Hivesigner API 位于 `https://hivesigner.com/api/`。它返回已登录用户的账户、替他们广播发布类操作、把授权码兑换成令牌，并列出使用 Hivesigner 的应用。本页说明每个端点的请求、回答和错误。

## 请求与身份验证 {#authentication}

- **基础地址：** `https://hivesigner.com/api/`。下面每个端点都相对于 `https://hivesigner.com`。
- **令牌：** 原样放在 `Authorization` 头中发送：`Authorization: ACCESS_TOKEN`。也接受 `Bearer ` 前缀。您还可以把它作为 `access_token` 放在查询串或请求体中，但放在请求头能让它不进入 URL 和日志。
- **请求体：** 带 `Content-Type: application/json` 的 JSON，或表单（`application/x-www-form-urlencoded`）。
- **回答：** JSON。
- **浏览器：** API 允许跨源请求，网页应用可以直接调用。

要获取令牌，参见[使用 OAuth2 登录](/docs/oauth2)。关于令牌包含什么，参见[令牌](/docs/tokens)。

## 错误 {#errors}

错误回答带有 HTTP 错误状态码和这样的请求体：

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| 状态码 | `error` | 何时出现 |
| --- | --- | --- |
| 401 | `invalid_grant` | 令牌缺失或无效，或它对这个端点来说类型不对（“The token has invalid role”）。在 `/api/oauth2/token` 上还有“The code or secret is not valid”。 |
| 401 | `invalid_scope` | `/api/broadcast`：令牌不允许的操作。描述中会写明是哪些操作。 |
| 401 | `unauthorized_client` | `/api/broadcast`：作者不是令牌所属用户的操作、触及密钥的 `account_update2`、缺少发布权限授权，或账户无法加载。描述会说明是哪一种。 |
| 500 | `server_error` | `/api/broadcast`：Hive 网络拒绝了该交易。`error_description` 带着网络返回的消息。 |
| 503 | `unavailable` | `/api/apps`：目录仍在构建中。 |

## GET /api/me {#me}

返回令牌所属的账户。用它来得知谁登录了，或用来[检查令牌](/docs/tokens#check-with-the-api)。

- **方法：** `GET` 或 `POST`。
- **令牌：** 访问令牌，包括写明了应用的 `login` 令牌。

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

删减后的回答：

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| 字段 | 含义 |
| --- | --- |
| `user` | 令牌所属的 Hive 用户名。`_id` 和 `name` 与它相同。 |
| `account` | 完整账户，与 Hive 的 `condenser_api.get_accounts` 返回的一致。 |
| `scope` | 令牌允许什么：登录令牌为 `["login"]`，否则是 `/api/broadcast` 接受的操作。 |
| `user_metadata` | 账户的资料元数据，已从 JSON 解析。 |

`/api/me` 不会说明令牌是为哪个应用生成的。要检查这一点，请解码令牌：参见[询问 API](/docs/tokens#check-with-the-api)。

## POST /api/broadcast {#broadcast}

用 @hivesigner 的发布密钥为令牌所属用户签署发布类操作，并把它们广播到 Hive。

- **方法：** `POST`。
- **令牌：** 来自令牌流程或授权码流程的 `posting` 访问令牌。
- **前提条件：** 用户已把发布权限授予您的应用账户（授权界面会完成这一步），并且您的应用账户已[把发布权限授予 @hivesigner](/docs/register-app#grant-hivesigner)。
- **请求体：** `{ "operations": [...] }`，其中每个操作都是 Hive 区块链上的 `[name, fields]` 形式。一次请求中的所有操作会合成一笔交易。

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

同一个请求用 curl 发送：

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

关注是一个 `custom_json` 操作：

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

一旦某个 Hive 节点接受了交易，API 就会回答。`result.id` 是交易 ID：

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

当网络拒绝该交易时，回答是 `500` 和 `server_error`。它的 `error_description` 带着网络返回的消息，`response` 带着原始错误。

### 广播接受哪些操作 {#broadcast-rules}

发布令牌只允许 API 广播以下操作，其他一律不行。在每个操作中，令牌所属用户必须是所示字段中的账户：

| 操作 | 令牌所属用户必须是 |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | `required_posting_auths` 中的第一个账户 |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **任何其他操作**都会被以 `invalid_scope` 拒绝。`login` 令牌不允许任何操作。
- **为别的账户执行的操作**会被以 `unauthorized_client` 拒绝。令牌只会替它自己的用户广播。
- **`account_update2`** 只能更改账户的元数据。带有 `owner`、`active` 或 `posting` 字段的操作会被以 `unauthorized_client` 拒绝。
- **`custom_json`**：请把 `required_auths` 留空。API 用发布权限签名，所以需要活动权限的操作会在网络上失败。

转账和其他钱包操作需要用户的活动密钥。请改用[签名链接](/docs/sign-links)发送它们。

## POST /api/oauth2/token {#oauth2-token}

把授权码兑换成令牌，或把刷新令牌兑换成新的令牌。只能从您的服务器调用。参见[授权码流程](/docs/oauth2#code-flow)。

- **方法：** `POST`，各值放在请求体中。
- **请求体：** `code` 和 `client_secret`，或 `refresh_token` 和 `client_secret`。
- **请求头：** 不要发送 `Authorization` 头。

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

每次调用都会返回一个新的访问令牌和一个新的刷新令牌。两者都由 @hivesigner 签署。`expires_in` 是访问令牌的有效期，以秒计（7 天）。

错误：`401 invalid_grant`。当送上的值不是有效的授权码或刷新令牌时，描述为“The token has invalid role”。当授权码或密钥不匹配时，描述为“The code or secret is not valid”。

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

告诉 Hivesigner 用户已退出您的应用。令牌本身由您的应用自行丢弃。

- **方法：** `POST`。
- **令牌：** 访问令牌，放在 `Authorization` 头中。

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

JavaScript SDK 的 `revokeToken()` 会发起这个调用，然后忘掉令牌。要彻底移除您应用的访问权限，用户需在 https://hivesigner.com/authorized-apps 自行移除。参见[退出登录与移除访问权限](/docs/tokens#sign-out)。

## GET /api/apps {#apps}

公开的应用目录：通过 Hivesigner 广播的应用，按使用人数排序。它不需要令牌。https://hivesigner.com/apps 显示同一份列表。

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| 字段 | 含义 |
| --- | --- |
| `updated_at` | 目录最后一次构建的时间。 |
| `building` | 在首次构建有数据之前为 `true`。那时 `apps` 为空。 |
| `window_days` | 排名覆盖的天数。 |
| `featured` | 优先显示的用户名，按该顺序排列。 |
| `apps[].username` | 应用账户。 |
| `apps[].name`、`about` | 取自应用账户的资料，或为 `null`。 |
| `apps[].website` | 资料中的网站，前提是该网站在自己的域名上有响应。否则为 `null`。 |
| `apps[].site` | 网站检查结果：`ok`、`no_website`、`invalid`、`redirected`、`blocked` 或 `unreachable`。`redirected` 的条目还带有 `redirects_to`。 |
| `apps[].users` | 按天统计的独立用户数，在该时间窗内累加。 |
| `apps[].requests` | 该时间窗内为该应用发出的成功 API 请求数。 |
| `apps[].first_seen`、`last_seen` | Hivesigner 记录该应用的第一天和它最后被使用的一天，或为 `null`。 |
| `apps[].new` | 当应用在该时间窗内首次出现时为 `true`。 |

回答最多可被缓存 5 分钟。在目录首次构建之前，API 会返回 `503` 和 `unavailable`。请稍后重试。

名称和描述由各个应用账户自己发布。Hivesigner 不对它们做任何核实。
