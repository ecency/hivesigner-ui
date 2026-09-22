您的应用可以请求用户用发布密钥或活动密钥签署一段文字消息。签名证明该用户掌控这个账户。不会广播任何内容：这条消息永远不会进入区块链。Hivesigner 的签名方式与 Hive Keychain 的 `requestSignBuffer` 相同，所以能校验 Keychain 签名的服务器代码，也能校验 Hivesigner 的签名。

## 请求一个签名 {#request}

把用户送到 `https://hivesigner.com/sign-buffer`，并带上这些查询参数：

| 参数 | 必填 | 含义 |
| --- | --- | --- |
| `message` | 必填 | 要签署的确切文字。它必须包含空白字符以外的内容。 |
| `redirect_uri` | 必填 | Hivesigner 把结果送往的地址。参见[回调规则](#callback-rules)。 |
| `authority` | 选填 | `posting` 或 `active`，大小写不限（`Posting` 也可以）。缺失或为空时按 `posting` 处理。其他任何取值都会被拒绝。 |
| `client_id` | 选填 | 您的应用账户。`clientId` 也会被读取。有它时，`redirect_uri` 必须是您应用的某个回调地址。 |
| `state` | 选填 | 任意取值。Hivesigner 会原样返回。 |
| `account` | 选填 | 您预期签署的账户。该账户在设备上时 Hivesigner 会选中它，否则忽略。`select_account` 也会被读取。 |

请用 `URLSearchParams` 构造地址，好让每个值都被编码：

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### 回调规则 {#callback-rules}

- 回调地址必须是 `https://`。普通 `http://` 只在回环地址上有效：`localhost`、`127.0.0.1` 或 `[::1]`。
- **带 `client_id` 时**，回调地址必须已在该应用账户上注册，并按登录时的方式匹配。参见[回调地址](/docs/register-app#callback-rules)。请求打开时，Hivesigner 会从 Hive 读取该应用的回调地址，在读到之前不会签署任何内容。当无法连上 Hive 时，用户会看到一个 **重试** 按钮。
- **不带 `client_id` 时**，任何符合第一条规则的回调地址都可用。Hivesigner 这时会把回调地址的主机作为请求方写出，例如“HOST 请求您签名一条消息。”

当您拥有应用账户时，请发送 `client_id`。这样用户就能看到您应用的名称和账户，而且只有您注册过的回调地址才能收到签名。

对于没有消息、`authority` 无法识别、回调地址缺失或不可用、`client_id` 不是 Hive 账户，或回调地址未在该应用上注册的请求，Hivesigner 都会拒绝。用户会看到“此签名请求无法使用：它需要一条消息、一个发布或活动密钥，以及为该应用注册的安全重定向 URL。请返回该网站后重试。”和一个 **报告此问题** 按钮。

### 用户会看到什么 {#what-the-user-sees}

- 一个写明您应用名称（或回调地址主机）的标题，以及“将跳转到 HOST”。
- 完整的消息，与将被签署的内容一字不差。可能隐藏文字或改变文字方向的字符会以 `\u{200B}` 这样的编码显示。
- “将使用您的发布密钥签名”或“将使用您的活动密钥签名”。
- 一条警告：“您的签名会向任何看到它的人证明 @USERNAME 签署了这段确切的文字。只签名您理解的消息。”
- **签名** 和 **取消**。已锁定的账户会先索取访问码。

[消息签名请求](/docs/signing#message-requests)从用户角度描述了这个界面。

## 您的回调地址会收到什么 {#callback}

当用户选择 **签名** 时，Hivesigner 会把他们送到您的回调地址，并带上这些查询参数：

| 参数 | 取值 |
| --- | --- |
| `signature` | 签名，130 个字符的十六进制字符串 |
| `public_key` | 签署所用密钥的公钥，例如 `STM...` |
| `username` | 签署的账户 |
| `authority` | `posting` 或 `active` |
| `state` | 您的 `state`，只要请求中带了它（包括空值） |

Hivesigner 把它们加到您回调地址的查询串中，位于 `?` 或 `&` 之后、任何 `#fragment` 之前。您自己的查询串保持不变。

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

当用户选择 **取消** 时，Hivesigner 会打开他们的账户列表。您的回调地址什么也收不到。

> **警告：** 任何人都能用编造的取值打开您的回调地址。在您的服务器校验签名之前，请把每个参数都当作未经证实的说法。

## 校验签名 {#verify}

请在您的服务器上校验签名：

1. 把您请求签署的消息连同它的 `state` 保存在您的服务器上。不要相信从浏览器回传的副本。
2. 对消息做哈希：对它的 UTF-8 字节做 sha256。
3. 从签名和该哈希恢复出公钥。
4. 从 Hive 加载该账户。检查恢复出的公钥属于您所请求的权限，且权重足以单独签署。
5. 检查 `state` 是您签发的那个值。每条消息只接受一次。

下面的示例使用 dhive（https://www.npmjs.com/package/@hiveio/dhive）：

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

同样的校验也适用于来自 Hive Keychain `requestSignBuffer` 的签名。请与您恢复出的公钥比对：回调中的 `public_key` 只是提示。

## Hivesigner 不会签署的消息 {#refused-messages}

带有 `signed_message` 键的 JSON 对象消息，具有 Hivesigner 令牌的形状。签署它会让请求方获得该用户账户的访问权限。Hivesigner 从不签署这样的消息。它会告诉用户“这条消息是 Hivesigner 令牌。签名它会让该网站获得您账户的访问权限，因此无法签名。”

请使用纯文本，或不带 `signed_message` 键的 JSON。写清这个签名用于什么，并加上一个您只生成一次的值，例如：

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## 签名消息工具 {#sign-message-tool}

人们也可以在 https://hivesigner.com/signmessage 自行签署消息（**签名消息**），并在 https://hivesigner.com/verifymessage 校验消息（**验证消息**）。参见[自行签署消息](/docs/signing#sign-message)。

那个工具的签署方式与 `/sign-buffer` 不同。它签署的是一段包含消息、账户和时间的 Hivesigner 令牌主体，并把结果以 **验证令牌** 的形式分享出来。请在 **验证消息** 页面上，或按[自行检查](/docs/tokens#check-it-yourself)所述的方法来校验这样的令牌，而不要用上面的代码。
