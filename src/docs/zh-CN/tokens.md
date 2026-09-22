Hivesigner 令牌是一段简短的签署声明。它写明一个 Hive 账户、它是为哪个应用生成的，以及签署时间。您的服务器可以通过 API 检查令牌，也可以自行检查。本页说明令牌包含什么、能用多久，以及两种检查方式。

## 令牌是什么样子 {#format}

令牌是一个用 base64url 编码的 JSON 对象，与标准 base64url 只有一点不同：填充使用 `.` 而不是 `=`。也就是说，与普通 base64 相比，`+` 变成 `-`，`/` 变成 `_`，`=` 变成 `.`。每个令牌都以 `eyJzaWduZWRfbWVzc2FnZSI6` 开头。

解码后，来自令牌流程的访问令牌是这样的：

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| 字段 | 含义 |
| --- | --- |
| `signed_message.type` | 令牌的类型：`login`、`posting`、`code` 或 `refresh`。参见[令牌类型](#kinds)。 |
| `signed_message.app` | 该令牌是为哪个应用账户生成的。为没有应用账户的网站生成的登录令牌没有这一项。 |
| `authors[0]` | 该令牌所属的 Hive 账户。 |
| `timestamp` | 签署时间，以 1970-01-01 UTC 起的秒数表示。 |
| `signatures[0]` | 签名，十六进制字符串。 |
| `authority` | 只出现在浏览器中签署的令牌里：用户的哪把密钥签署了它，`posting` 或 `active`。该字段位于被签署数据之外。要确定是哪把密钥签署的，请从签名中恢复出公钥。 |

签名是对 `JSON.stringify({ signed_message, authors, timestamp })` 的 sha256 哈希所做的 secp256k1 签名，其中各键按此顺序排列。

### 解码令牌 {#decode}

在 Node.js 中：

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

在浏览器中：

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

解码不等于检查。任何人都能构造出解码后形状相同的字符串。信任它之前请先[检查令牌](#check-a-token)。

## 令牌类型 {#kinds}

| 令牌 | `type` | `app` | 签署者 | 从哪里获得 |
| --- | --- | --- | --- | --- |
| 访问令牌，令牌流程 | `posting` | 您的应用 | 用户的发布密钥；若 Hivesigner 没有该账户的发布密钥，则为其活动密钥 | 回调地址上的 `access_token` |
| 登录令牌，`scope=login` | `login` | 您的应用 | 用户的发布密钥或活动密钥 | 回调地址上的 `access_token` |
| 登录令牌，没有应用账户的网站 | `login` | 无 | 用户的发布密钥或活动密钥 | 回调地址上的 `access_token` |
| 授权码 | `code` | 您的应用 | 用户的发布密钥或活动密钥 | 回调地址上的 `code` |
| 访问令牌，授权码流程 | `posting` | 您的应用 | @hivesigner 的发布密钥 | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| 刷新令牌 | `refresh` | 您的应用 | @hivesigner 的发布密钥 | [`/api/oauth2/token`](/docs/api#oauth2-token) |

授权码和刷新令牌都不是访问令牌。永远不要把它们中的任何一个当成一次登录。

## 令牌能用多久 {#lifetime}

访问令牌有效期为 7 天：`expires_in` 是 604800 秒，从它的 `timestamp` 起算。过期之后：

- **令牌流程：** 把用户送去重新登录。已经授权过您应用的用户会看到“登录 APP”，只需点一下。
- **授权码流程：** 您的服务器用刷新令牌和客户端密钥获取新的访问令牌。参见[刷新](/docs/oauth2#refresh)。

一旦令牌的 `timestamp` 超过 7 天，就把它视为已过期。对于跳转后立即检查的内容，请接受短得多的时效。授权码要立即兑换。登录令牌只在其 `timestamp` 之后的几分钟内接受。

## 在您的服务器上检查令牌 {#check-a-token}

在您的服务器信任浏览器或应用送来的令牌之前，请检查：

- 确实是该账户或 @hivesigner 签署了它；
- 它是为您的应用生成的；
- 它是您预期的那种令牌；
- 它足够新。

### 询问 API {#check-with-the-api}

带上令牌调用 `/api/me`。有效的令牌会在 `user` 中返回账户：

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

无效的令牌会返回 `401` 和 `invalid_grant`。参见 [GET /api/me](/docs/api#me)。

`/api/me` 确认签名。它的回答不会说明令牌是为哪个应用生成的。所以还要自行解码令牌，检查它的 `app`、`type` 和时效。为别的应用生成的令牌，绝不能让任何人登录您的应用。

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

API 只接受写明了应用的令牌。来自没有应用账户的网站的登录令牌，请[自行检查](#check-it-yourself)。

### 自行检查 {#check-it-yourself}

1. 解码令牌。
2. 检查 `signed_message.type` 是您预期的类型：访问令牌为 `posting`，登录令牌为 `login`。
3. 检查 `signed_message.app` 是您的应用账户。对于没有应用账户的网站，请检查它根本不存在。
4. 根据 `timestamp` 检查时效。
5. 计算 `JSON.stringify({ signed_message, authors, timestamp })` 的 sha256 哈希。
6. 从 `signatures[0]` 和该哈希恢复出公钥。
7. 此刻从 Hive 区块链读取账户 `authors[0]`，因为用户可以更换密钥。恢复出的公钥必须是该账户当前的发布密钥或活动密钥之一。而来自 `/api/oauth2/token` 的令牌则由 @hivesigner 签署：对这些令牌，请接受 @hivesigner 账户当前的发布密钥。

在 Node.js 中，可使用在 `@ecency/sdk/hive` 下导出 `PrivateKey`、`PublicKey`、`Signature` 和 `callRPC` 的 [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk)：

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

像这样使用它：

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

dhive 库（`@hiveio/dhive`）同样可用：用 `cryptoUtils.sha256(message)` 计算哈希，用 `Signature.fromString(signatures[0]).recover(digest).toString()` 恢复公钥。

## 妥善保管令牌 {#keep-tokens-safe}

任何持有发布令牌的人，都能在令牌过期前通过您的应用以用户身份广播。请像对待密码一样对待它。

- **把令牌保存在您的服务器上**，或放在 httpOnly、Secure 的 Cookie 中。刷新令牌和客户端密钥只保存在服务器上。
- **永远不要把令牌放进会被记录到日志的 URL。** 令牌流程会在回调地址的查询串中送来令牌。请在服务器上读取它，然后跳转到不带它的地址。日志中不要记录回调地址的查询串。
- **不要在回调页面上加载任何来自其他站点的资源**，以免带有令牌的地址被发送给它们。在该页面上设置 `Referrer-Policy: no-referrer` 响应头会有帮助。
- **只把令牌发送到您自己的服务器和 `https://hivesigner.com/api/`。**

## 退出登录与移除访问权限 {#sign-out}

- **让用户退出登录**意味着丢弃令牌：把它从您的会话或 Cookie 中删除。您也可以调用 [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) 告诉 Hivesigner 用户已退出。您的应用仍要自行丢弃令牌。
- **彻底切断您应用的访问权限**由用户决定。在 https://hivesigner.com/authorized-apps，或在 `https://hivesigner.com/revoke/APP`，他们会把您的应用账户从链上的发布权限中移除。之后 API 便不再通过您的应用替他们广播。
