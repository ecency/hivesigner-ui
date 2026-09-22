用 Hivesigner 为人们登录的应用，本身就是一个 Hive 账户。它的名称就是您发送的 `client_id`。它的资料中保存着 Hivesigner 读取的设置：可以接收令牌的回调地址，以及用于授权码流程的客户端密钥。要通过 API 广播，应用账户还要把发布权限授予 @hivesigner。本页逐步介绍每个步骤。

## 您需要什么 {#what-you-need}

| 您想做的事 | 应用账户和回调地址 | 客户端密钥 | @hivesigner 授权 |
| --- | --- | --- | --- |
| 为人们登录并用令牌流程广播 | 需要 | 不需要 | 需要 |
| 为人们登录并用授权码流程广播（刷新令牌） | 需要 | 需要 | 需要 |
| 只为人们登录，令牌中写明您的应用 | 需要 | 不需要 | 不需要 |
| 只为人们登录，来自没有 Hive 账户的网站 | 不需要 | 不需要 | 不需要 |
| 发送签名链接 | 不需要 | 不需要 | 不需要 |

关于最后两行，参见[无发布权限的登录](/docs/login-only)和[签名链接](/docs/sign-links)。

## 创建应用账户 {#app-account}

1. 为您的应用创建一个 Hive 账户，例如在 https://ecency.com/signup。请为应用使用单独的账户，而不是您的个人账户。它的名称就是您的 `client_id`。用户会在授权界面上“Hive 账户”字样旁看到它。Hive 账户无法改名，所以请谨慎选择名称。
2. 在 https://hivesigner.com/import 把该账户添加到 Hivesigner（**添加账户**）。请使用活动密钥或主密码：下文的授权步骤需要活动密钥。

## 填写应用设置 {#app-settings}

选中应用账户后打开 https://hivesigner.com/profile，并设置：

- **此账户是一个应用。** 打开它。它把该账户标记为应用，API 在接受针对它的授权码或刷新令牌之前会检查这一点。
- **重定向 URI。** 您的回调地址，每行一个。参见[回调地址](#callbacks)。
- **创建者。** 由谁维护该应用。https://hivesigner.com/apps 上的应用目录会显示它。
- **状态。** 生产环境或沙盒环境，供您自己记录。Hivesigner 对两者一视同仁。
- **客户端密钥。** 只有[授权码流程](/docs/oauth2#code-flow)才需要。参见[客户端密钥](#client-secret)。

也请填写 **名称** 和 **头像 URL**。授权界面会显示您应用的图片和名称。https://hivesigner.com/apps 上的应用目录会显示名称、**关于** 和 **网站**。

保存会在链上更新该账户的资料，并需要它的发布密钥。登录请求打开时，Hivesigner 会从该账户读取您的回调地址，所以交易一进入区块，改动就会生效。

> **备注：** 名称、图片和描述由您的应用账户自己发布。因此授权界面还会显示真实的账户名（`@myapp`）和它把用户送往的主机：授权和跳转实际使用的正是这两项。

## 回调地址 {#callbacks}

回调地址（登录请求中的 `redirect_uri`）是 Hivesigner 带着令牌或授权码把用户送回的地方。Hivesigner 只会把它发送到您的应用账户上列出的回调地址。

### 规则 {#callback-rules}

- **完全匹配。** 请求中的 `redirect_uri` 必须与您的某个重定向 URI 逐字符一致：协议、主机、端口、路径和查询串。
- **仅限 https。** 回调地址必须使用 `https://`。普通 `http://` 只有在回环地址上才被接受：`localhost`、`127.0.0.1` 或 `[::1]`。
- **回环端口可以变化。** 已注册的普通 http 回环回调地址，可匹配路径、查询串、片段和用户信息相同的任意回环主机和端口。已注册的 `https://` 回环回调地址仍需完全匹配。
- **不支持自定义协议。** 诸如 `myapp://callback` 的回调地址会被拒绝。参见[移动端和桌面端应用](#native-apps)。
- **不要带片段。** 不要在回调地址上加 `#fragment`。

对于根本无法生效的回调地址，资料页会拒绝保存，并提示“不可用的回调地址（仅限 https，或 localhost 上的 http）”。

### 示例 {#callback-examples}

假设注册了以下重定向 URI：

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| 请求中的 `redirect_uri` | 结果 |
| --- | --- |
| `https://myapp.example/auth/callback` | 接受：完全匹配 |
| `https://myapp.example/auth/callback/` | 拒绝：多了一个 `/` |
| `https://myapp.example/auth/callback?next=home` | 拒绝：查询串不同 |
| `https://www.myapp.example/auth/callback` | 拒绝：主机不同 |
| `http://myapp.example/auth/callback` | 拒绝：回环之外的普通 http |
| `http://localhost:3000/auth` | 接受：完全匹配 |
| `http://127.0.0.1:51234/auth` | 接受：回环地址，路径相同，端口不同 |
| `http://[::1]:3000/auth` | 接受：回环地址，路径相同 |
| `http://127.0.0.1:3000/other` | 拒绝：路径不同 |
| `https://localhost:3000/auth` | 拒绝：https 与普通 http 的注册不匹配 |
| `myapp://auth` | 拒绝：自定义协议 |

若要在回调地址上接受查询串，请把带着该查询串的地址原样注册。Hivesigner 会保留您自己的查询串，并把它的参数加在后面。

### 移动端和桌面端应用 {#native-apps}

Hivesigner 把令牌放在回调地址里。像 `myapp://` 这样的自定义协议并不绑定某一个应用：同一台设备上的另一个应用可以声明它并收到令牌。因此 Hivesigner 拒绝自定义协议，只把令牌发送到 https 地址或用户自己设备上的回环地址。

原生应用可改用以下两种方式之一：

- **一个自己拥有的 https 链接。** 在您的域名下注册一个回调地址，由操作系统在您的应用中打开（Android App Links 或 iOS Universal Links）。
- **一个回环回调地址。** 应用在 `127.0.0.1` 上监听跳转。注册 `http://127.0.0.1/auth`（或 `localhost`），运行时使用任意空闲端口即可：端口不必一致。

## 客户端密钥 {#client-secret}

客户端密钥用于证明授权码兑换来自您的服务器。它是[授权码流程](/docs/oauth2#code-flow)的必需项：您的服务器把它连同每个授权码或刷新令牌发送到 `/api/oauth2/token`。令牌流程不使用它。

- **生成一个长随机值**，例如用 `openssl rand -hex 32`。
- **在资料页设置它。** Hivesigner 只把它的 sha256 哈希保存在您应用账户的资料中。把该字段留空会保留当前密钥。
- **把它留在您的服务器上。** 永远不要把它放进网页、移动应用或 URL。
- **要更换它**，请设置新值并同时更新您的服务器。

## 把发布权限授予 @hivesigner {#grant-hivesigner}

API 用 @hivesigner 账户的发布密钥广播。只有当您的应用账户已把 @hivesigner 加入自己的发布权限时，Hive 才会为您的用户接受这个签名。参见[发布权限链](/docs/how-it-works#authority-chain)。

1. 在 Hivesigner 中选择您的应用账户。
2. 打开 https://hivesigner.com/authorize/hivesigner。
3. 页面上写着“授权 @hivesigner”和“@hivesigner 将能够以 @myapp 的身份发帖、评论、投票和关注。”请选择 **授权**。这一步需要应用账户的活动密钥。

这一步只需做一次。没有它，每次广播都会失败并返回 `unauthorized_client` 以及“Broadcaster account doesn't have permission to broadcast for @myapp”。只做登录的应用不需要它。

这项授权也让 @hivesigner 能以您的应用账户自身的身份发布内容，这也是应用账户只用于应用的又一个理由。

在这项授权到位的情况下通过 Hivesigner 广播的应用，可以出现在 https://hivesigner.com/apps 的应用目录中，按使用人数排序。

## 出问题时用户会看到什么 {#refused-requests}

对于无法安全处理的请求，Hivesigner 会拒绝。它显示一条消息和一个 **报告此问题** 按钮。该请求无法被批准。不会有任何内容发送到您的回调地址。

| 问题 | 用户看到的内容 |
| --- | --- |
| `redirect_uri` 不在您的重定向 URI 之列 | “此应用的重定向 URL 未注册。为保障您的安全，已阻止登录。” |
| `client_id` 不是 Hive 账户 | “@myapp 不是 Hive 账户，因此没有可授权的应用。请返回该网站后重试。” |
| 该账户未被标记为应用 | “@myapp 未设置为应用，因此无法让你登录。请返回该网站后重试。”请按上文所述打开 **此账户是一个应用**。 |
| 请求中没有 `redirect_uri` | “此授权请求不完整：未指定应用或重定向 URL。请返回应用后重试。” |

如果您的用户反馈遇到其中之一，请把应用发送的 `redirect_uri` 与您的重定向 URI 逐字符对照。

## 检查清单 {#checklist}

1. 一个用于应用的 Hive 账户，已用活动密钥添加到 Hivesigner。
2. 在 https://hivesigner.com/profile 上：“此账户是一个应用”已打开，重定向 URI 已列出，若使用授权码流程则已设置客户端密钥。
3. 若通过 API 广播，已在 https://hivesigner.com/authorize/hivesigner 授权 @hivesigner。
4. 一个登录链接，它发送的正是您某个重定向 URI 的原样值。参见[使用 OAuth2 登录](/docs/oauth2)。
