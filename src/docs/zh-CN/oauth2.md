把人们送到 Hivesigner 来登录您的应用。他们在那里查看并批准您的请求。随后 Hivesigner 把他们送回您的回调地址，带上一个令牌（令牌流程），或带上一个由您的服务器兑换成令牌的授权码（授权码流程）。本页涵盖这两种流程、每个参数以及各种权限范围。

## 开始之前 {#before-you-start}

- 注册应用：为它准备一个 Hive 账户，并列出您的回调地址。参见[注册应用](/docs/register-app)。
- 若要通过 API 广播，您的应用账户还必须[把发布权限授予 @hivesigner](/docs/register-app#grant-hivesigner)。
- 若使用授权码流程，请设置[客户端密钥](/docs/register-app#client-secret)。

## 授权地址 {#authorize-url}

把用户送到这个地址：

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

请对每个值做 URL 编码。`URLSearchParams` 会替您完成：

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### 参数 {#parameters}

| 参数 | 必填 | 作用 |
| --- | --- | --- |
| `client_id` | 对应用而言必填 | 您应用账户的名称。`clientId` 也会被读取。没有它，该请求就成为来自没有应用账户的网站的纯登录请求：参见[无发布权限的登录](/docs/login-only)。 |
| `redirect_uri` | 必填 | Hivesigner 把用户送回的地址。它必须与您应用的某个重定向 URI 完全一致。参见[回调地址](/docs/register-app#callbacks)。 |
| `scope` | 选填 | `login`、`posting` 或 `offline`。参见[权限范围](#scopes)。没有它时，请求索取发布权限。 |
| `response_type` | 选填 | 取值 `code` 会启动[授权码流程](#code-flow)。其他取值或不填表示[令牌流程](#token-flow)。 |
| `state` | 建议填写 | 一个随机值，Hivesigner 会原样返回。参见[用 state 保护请求](#state)。 |
| `account` | 选填 | 一个 Hive 用户名。当该账户在用户的设备上时，Hivesigner 会选中它；否则忽略。`select_account` 也会被读取。 |

用户在授权界面上仍可以切换到别的账户。请始终从令牌或授权码兑换结果中取得账户，绝不要用您请求时写的那个。

## 权限范围 {#scopes}

Hive 只有一种发布权限。因此 Hivesigner 只有两级访问，纯登录和发布，两者之间没有更细的划分。

| `scope` | 用户批准的内容 | 流程 | 访问令牌的 `type` |
| --- | --- | --- | --- |
| `login` | “查看您的账户用户名”。不授予任何权限。 | 令牌流程（不要加 `response_type=code`） | `login` |
| `posting` | 发布权限。第一次会把您的应用账户加入用户的发布权限。 | 令牌流程，或带 `response_type=code` 的授权码流程 | `posting` |
| `offline` | 与上面相同的发布权限 | 授权码流程 | `posting`，并附带一个 `refresh` 令牌 |

在授权码流程中，回调地址先收到一个授权码（`type` 为 `code` 的令牌），再由您的服务器把它兑换成访问令牌。

- **不填范围**表示 `posting`。
- **任意位置含有 `offline` 的取值**表示 `offline`，例如旧的 `offline,vote,comment`。
- **其他任何取值**都表示 `posting`。这包括 `vote`、`comment`、`vote,comment`、`comment_options` 或 `custom_json` 等旧的操作名。它们并不会限制令牌：每个发布令牌都允许同一组操作。参见[广播接受哪些操作](/docs/api#broadcast-rules)。

当您的应用只需要知道用户是谁时，请索取 `login`。参见[无发布权限的登录](/docs/login-only)。

## 令牌流程 {#token-flow}

用户的浏览器直接收到访问令牌。您的应用不需要任何密钥。

1. 把用户送到授权地址：

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. 用户批准。Hivesigner 跳转到您的回调地址：

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   当您的回调地址没有查询串时，Hivesigner 用 `?` 添加自己的参数；有查询串时则用 `&`。只有当您发送了非空值时，`state` 才会出现。

3. 在您的回调地址上，先[比对 `state`](#state)。然后在您的服务器上[检查令牌](/docs/tokens#check-a-token)。令牌所属的账户就在令牌本身之中：不要只依赖 `username` 参数，因为任何人都能改 URL。
4. 把令牌保存在您的服务器上或 httpOnly Cookie 中。随后跳转到一个干净的地址，让令牌从地址栏消失。
5. 使用令牌调用 [API](/docs/api)，直到它在 `expires_in` 秒（7 天）后过期。然后再次把用户送到授权地址。已经授予过发布权限的用户会看到“登录 APP”和“您之前已授权 @myapp，不会授予新的权限。”

## 授权码流程 {#code-flow}

您的服务器收到一个授权码，并把它兑换成一个访问令牌和一个刷新令牌。之后它可以在用户不在场的情况下自行续期。当您的服务器要长期替用户行事时，请使用这种流程。

1. 把用户送到带 `scope=offline` 的授权地址：

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` 效果相同。

2. 用户批准发布权限。Hivesigner 跳转到您的回调地址：

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [比对 `state`](#state)。然后立即在您的服务器上兑换授权码。

### 兑换授权码 {#exchange-code}

把授权码和您的客户端密钥放在 POST 请求体中，发送到 `/api/oauth2/token`：

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

回答：

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

同一个调用在 Node.js 18 或更高版本中：

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- 把授权码和密钥放在请求体里，绝不要放进 URL。
- 这个请求不要带 `Authorization` 头。
- 请使用这个回答中的 `username`。它来自用户签署的授权码。
- 把访问令牌和刷新令牌保存在您的服务器上。

### 刷新 {#refresh}

访问令牌过期后，把刷新令牌连同您的客户端密钥发送到同一个端点：

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

回答的形状相同，带有新的访问令牌和新的刷新令牌。请用它们替换旧的两个。

## 用 state 保护请求 {#state}

没有 `state`，别的网站就能把您的用户送到您的回调地址，并带上它自己选定的令牌或授权码。您的应用于是会把用户登录到别人的账户。`state` 把每一次回跳都绑定到发起登录的那个浏览器。

1. 每次登录生成一个随机值，至少 16 个随机字节。十六进制可以避免出现需要编码的字符。
2. 把它存放在只有这个浏览器才能再次出示的地方：您的服务器会话，或一个带 `SameSite=Lax` 的短期 httpOnly、Secure Cookie。
3. 把它作为 `state` 放进授权地址。
4. 在您的回调地址上，把 `state` 参数与保存的值比对。若缺失或不同，就停下：既不要用令牌，也不要用授权码。
5. 删除保存的值，使每个值只生效一次。

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner 会原样返回它收到的 `state` 值。空值则会被略去。

## 用户会看到什么 {#what-the-user-sees}

授权界面显示您应用的图片和名称、“Hive 账户 @myapp”以及“将跳转到 HOST”，其中 HOST 取自您的回调地址。然后：

- **首次发布请求。** 标题写着“APP 正在请求访问您的账户。”**权限范围**卡片列出您的应用将能做的事。一条提示写着“首次授权：此操作会在链上将 @myapp 添加到您的发布权限中，需要使用一次您的活动密钥。在您撤销之前，该账户都可以以您的身份发布内容。”按钮上写着 **授权**。当用户设备上没有该账户的活动密钥时，界面会就地索取。
- **登录。** 对于 `scope=login`，或用户此前已授予的发布权限，标题写着“登录 APP”，按钮上写着 **登录**。
- **账户。** “用于授权的账户”或“登录账户”，后面跟着选中的账户。用户可以在这里切换账户。
- **已锁定的账户。** 按钮上方有一个访问码输入框。点一下即可解锁账户并继续。
- **设备上没有账户。** 按钮上写着 **继续**。它会打开添加账户表单，然后回到该请求。

首次发布请求之后，Hivesigner 会等到新的授权在链上可见才跳转。这可能需要几秒钟。若想从用户视角看完整界面，参见[登录应用](/docs/signing-in)。

## 取消与被拒绝的请求 {#cancel}

- **取消。** 用户会回到自己在 Hivesigner 中的账户列表。不会有任何内容发送到您的回调地址：也没有错误参数。请让登录按钮保持可用，以便用户重新开始。不要一直等待回跳。
- **被拒绝的请求。** 未注册的回调地址、未知的 `client_id` 或缺失的 `redirect_uri`，都会在 Hivesigner 中显示错误和一个 **报告此问题** 按钮。不会有任何内容发送到您的回调地址。参见[出问题时用户会看到什么](/docs/register-app#refused-requests)。

## 旧版登录请求地址 {#legacy-login-request}

Hivesigner 仍然接受较旧的登录地址，它为老的集成而保留。新的集成请使用 `/oauth2/authorize`。

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

它打开相同的授权界面，采用相同的回调检查和相同的跳转方式，但读取参数的方式不同：

- `scope` 为 `login` 或 `posting`。其他取值或不填都表示 `login`。
- 不读取 `offline`。若要用授权码流程，请加上 `response_type=code`。
- 不读取 `account`。

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` 遵循同一套规则。
