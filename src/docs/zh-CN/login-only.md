有些应用只需要知道一个人在 Hive 上是谁。它们从不替这个人发帖、投票或广播任何内容。Hivesigner 可以在不需要任何发布权限的情况下，让人们登录这样的应用。用户证明自己掌控某个 Hive 账户，您的应用得知它的名称。本页介绍两种做法，以及如何安全地检查结果。

## 两种做法 {#two-ways}

- **有应用账户：** 您的应用拥有自己的 Hive 账户，并请求 `scope=login`。令牌中写明您的应用。
- **没有应用账户：** 没有自己 Hive 账户的网站只发送一个 `redirect_uri`。令牌中不写明任何应用，由您的网站自行检查。

两种做法都不需要用户或您的应用账户授予任何权限，因此用户账户上不会有任何改变。Hivesigner 用发布密钥签署这次登录；若设备上没有该账户的发布密钥，则用活动密钥签署。

## 有应用账户 {#app-account}

1. [注册应用](/docs/register-app)：创建它的 Hive 账户并列出您的回调地址。您不需要客户端密钥，也不需要 @hivesigner 授权。
2. 把用户送到：

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. 用户会看到“登录 APP”，其中 **权限范围** 显示为“查看您的账户用户名”。他们选择 **登录**。
4. Hivesigner 跳转到您的回调地址：

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [比对 `state`](/docs/oauth2#state)，然后检查令牌。这是一个写明了您应用的 `login` 令牌，所以以下两种做法都可以：
   - 带上它调用 [`GET /api/me`](/docs/api#me)，它会在 `user` 中返回账户，`scope` 为 `["login"]`，随后解码令牌并检查 `type` 和 `app`（[询问 API](/docs/tokens#check-with-the-api)）；
   - 或者用 `type: 'login'` 和您的应用名称[自行检查](/docs/tokens#check-it-yourself)。

`login` 令牌无法广播：`/api/broadcast` 会拒绝随它发送的每一个操作。

## 没有应用账户 {#no-app-account}

1. 把用户送到带 `redirect_uri` 而不带 `client_id` 的授权地址：

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   回调地址必须是 `https://`，或回环地址上的 `http://`（`localhost`、`127.0.0.1`、`[::1]`）。这里没有可供注册的列表。Hivesigner 在这种情况下忽略 `scope` 和 `response_type`：回答始终是一个登录令牌。

2. 用户会看到“HOST 想要确认您的 Hive 用户名。”，其中 HOST 是您回调地址的主机。他们选择 **登录**。
3. Hivesigner 跳转到您的回调地址：

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [比对 `state`](/docs/oauth2#state)，然后自行检查令牌。API 不接受没有写明应用的令牌，所以由您的服务器对照账户的密钥验证签名。参见[自行检查](/docs/tokens#check-it-yourself)，使用 `type: 'login'` 且没有 `app`。

如果回调地址不是网址，或者是回环之外的普通 `http://`，Hivesigner 会拒绝该请求，并告诉用户原因。

## 该用哪一种 {#which-one}

| | 有应用账户 | 没有应用账户 |
| --- | --- | --- |
| 用户看到什么 | 您应用的名称、图片和 Hive 账户 | 只有您网站的主机 |
| 需要的准备 | 一个列出了回调地址的 Hive 账户 | 无 |
| 令牌写明 | 您的应用 | 不写明任何应用 |
| 用什么检查令牌 | `/api/me` 或您自己的代码 | 您自己的代码 |
| 日后的发布权限 | 同一个账户：请求 `posting` 并[授权 @hivesigner](/docs/register-app#grant-hivesigner) | 需要先有应用账户 |

条件允许时请使用应用账户。用户能看到您应用的名称和图片。您的服务器可以拒绝为其他应用生成的令牌。日后您还能用同一个账户转为发布权限。

当您的网站没有 Hive 账户也不想要时，请使用第二种做法。

## 安全地检查这次登录 {#check-safely}

- **用 `state` 绑定请求。** 每次登录生成一个随机值，存入用户会话，在回调地址上比对，并只用一次。参见[用 state 保护请求](/docs/oauth2#state)。
- **检查类型。** 只接受 `signed_message.type` 为 `login` 的令牌。授权码或刷新令牌都不是一次登录。
- **检查应用。** 有应用账户时，`signed_message.app` 必须是您的应用；没有应用账户时，则不应存在 `app`。
- **检查时效。** 您在跳转后立即检查令牌，所以只在其 `timestamp` 之后的几分钟内接受它（例如 5 分钟，外加一分钟的时钟误差）。
- **每个令牌只用一次。** 检查通过后，开启您自己的会话（例如一个 httpOnly Cookie），并丢弃 Hivesigner 令牌。把已接受的令牌记录下来，直到它们旧到无法通过时效检查为止。再次见到的一律拒绝。
- **不要把令牌写进日志。** 它随回调地址的查询串到达。参见[妥善保管令牌](/docs/tokens#keep-tokens-safe)。

## 示例 {#examples}

https://hivesearcher.com 和 https://openhive.chat 这类网站，让人们用 Hive 账户登录，以使用搜索、聊天等链下功能。它们只需要知道这个人是谁，别无所求。
