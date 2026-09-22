Hivesigner 让人们在您的应用中使用自己的 Hive 账户，而不必把密钥交给您的应用。它由两部分组成：https://hivesigner.com 上的浏览器签名器，以及 `https://hivesigner.com/api/` 上的 API。本页说明每一部分的作用，以及应用使用它们的两种方式。

## 浏览器签名器 {#browser-signer}

浏览器签名器就是 Hivesigner 网站。人们把自己的 Hive 账户添加到这里。密钥留在他们自己的浏览器中：Hivesigner 不会把密钥发送到任何服务器。您的应用永远看不到密钥。

签名器签署三类内容，每一次用户都会先看到自己签署的是什么：

- **登录令牌。** 您的应用把人引导到 Hivesigner 去登录。Hivesigner 显示您应用的名称和它请求的内容。用户批准后，Hivesigner 用他们的密钥签署一段简短声明，其中写明他们的账户和您的应用。这段签署后的声明就是您的应用收到的令牌。参见[使用 OAuth2 登录](/docs/oauth2)和[令牌](/docs/tokens)。
- **交易。** 签名链接会打开一笔交易供人查看。用户批准后，Hivesigner 用所需的密钥签署它。除非链接只索取签名，否则随后会从浏览器把交易发送到 Hive 网络。参见[签名链接](/docs/sign-links)。
- **消息。** 您的应用可以请求用户用密钥签署一段文字，以证明他们掌控该账户。参见[消息签名](/docs/message-signing)。

## API {#api}

API 为已登录您应用的用户广播发布级别的操作：帖子和评论、投票、关注和其他 `custom_json` 操作、领取奖励以及资料更新。您的应用把操作连同用户的令牌一起发送。API 检查令牌，用 @hivesigner 账户的发布密钥签署交易，然后把它广播到 Hive。

API 还会返回已登录用户的账户、把授权码换成令牌，并列出使用 Hivesigner 的应用。参见 [REST API](/docs/api)。

## 发布权限链 {#authority-chain}

在 Hive 上，一个账户可以允许另一个账户以它的发布权限行事。API 依赖其中两项授权：

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **用户把您的应用账户加入自己的发布权限。** 用户第一次为您的应用批准发布权限时，授权界面会完成这一步。它需要用户的活动密钥一次。
2. **您的应用账户把 @hivesigner 加入自己的发布权限。** 这一步您只需在[注册应用](/docs/register-app#grant-hivesigner)时做一次。

广播之前，API 会检查这两项授权都已到位。它只广播由令牌所指用户撰写的操作。

用户随时可以在 https://hivesigner.com/authorized-apps 移除您应用的访问权限。之后 API 便无法再通过您的应用替他们发布内容。

## 两种集成方式 {#two-ways-to-integrate}

### 先登录，再通过 API 广播 {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

用户只批准一次。之后您的应用可以替他们投票、评论和发帖而无需再次询问，直到令牌过期或用户移除您应用的访问权限。日常社交操作适合用这种方式。

您需要一个应用账户，并注册好回调地址和 @hivesigner 授权。参见[注册应用](/docs/register-app)。如果您只想知道用户是谁，参见[无发布权限的登录](/docs/login-only)。

### 签名链接 {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

用户在交易被签署之前会看到每一笔交易。签名链接涵盖 41 种 Hive 操作，包括转账和其他需要活动密钥的钱包操作。API 从不处理这些操作。签名链接不需要应用账户。参见[签名链接](/docs/sign-links)。

### 如何选择 {#which-to-choose}

- **频繁的发布类操作**（投票、评论、关注）：使用 OAuth2 登录，然后调用 API。
- **钱包操作**，或任何需要活动密钥的操作：使用签名链接。
- **两者兼用**：许多应用用 OAuth2 为人们登录以实现社交功能，同时用签名链接处理转账。
- **只需要用户身份**：参见[无发布权限的登录](/docs/login-only)。

## 源代码 {#source-code}

Hivesigner 是开源的：

- 浏览器签名器：https://github.com/ecency/hivesigner-ui
- API：https://github.com/ecency/hivesigner-api
- JavaScript SDK（npm 包 `hivesigner`）：https://github.com/ecency/hivesigner-sdk。参见 [SDK](/docs/sdk)。
