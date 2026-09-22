常见问题的简短回答。每条都链接到有详细说明的页面。

## 使用 Hivesigner {#using-hivesigner}

### Hivesigner 免费吗？ {#is-it-free}

免费。Hivesigner 既不向用户收费，也不向应用收费。其源代码以 MIT 许可证开放。

### Hivesigner 会看到我的密钥吗？ {#keys}

不会。您的密钥留在您设备上的浏览器里，Hivesigner 也在那里完成签名。它们从不会被发送到 Hivesigner 的服务器，也不会被发送给您使用的应用。参见[密钥保存在哪里](/docs/accounts#where-keys-are-stored)和[保护好您的密钥](/docs/safety)。

### 如果我忘了本地密码怎么办？ {#forgotten-passcode}

没有人能恢复本地密码，Hivesigner 也不能。请把账户从 Hivesigner 移除，再用您的 Hive 密钥和新的本地密码重新添加。您的 Hive 账户以及已授权的应用都不会改变。参见[如果您忘了本地密码](/docs/accounts#forgotten-passcode)。

### 手机上能用 Hivesigner 吗？ {#phone}

可以。在手机浏览器中打开 https://hivesigner.com 并在那里添加账户。密钥只保存在那个浏览器里，因此每台使用的设备都要单独添加账户。参见[添加和管理账户](/docs/accounts)。

### 哪些应用使用 Hivesigner？ {#which-apps}

https://hivesigner.com/apps 列出了通过 Hivesigner 向 Hive 广播的应用，按使用量从高到低排列。每个应用的名称和描述都是自己发布的，Hivesigner 不会核实。在那里打开一个应用，会显示一个可以授予它发布权限的页面。参见[从目录中授权应用](/docs/signing-in#directory)。

### Hivesigner 和 Hive Keychain 是什么关系？ {#hive-keychain}

它们是彼此独立的工具。Hive Keychain 是浏览器扩展和手机应用，Hivesigner 是网站，因此无需安装。当应用请求您签名一条消息时，生成的签名与 Hive Keychain 产生的属于同一种，应用用同一段代码即可校验两者。Hivesigner **签名消息**页面生成的验证令牌，在 Hivesigner 的**验证消息**页面校验。参见[消息签名](/docs/message-signing)。

## 用 Hivesigner 开发 {#building}

### 我能在手机应用里使用 Hivesigner 吗？ {#mobile-app}

可以。把用户送到浏览器中的 Hivesigner，并使用您的应用能够接收的回调地址：您自己拥有的 https 链接（Android App Links 或 iOS Universal Links），或者像 `http://127.0.0.1/auth` 这样的回环地址。`myapp://` 之类的自定义协议会被拒绝。参见[手机应用和桌面应用](/docs/register-app#native-apps)。

### 我需要一个应用账户吗？ {#app-account}

如果要让用户带着发布权限登录，或者通过 API 广播，就需要。参见[注册您的应用](/docs/register-app)。[签名链接](/docs/sign-links)和[消息签名](/docs/message-signing)不需要它，[无发布权限的登录](/docs/login-only)同样不需要。

### API 能发起转账吗？ {#transfers}

不能。API 只广播发布级别的操作，例如投票、评论和关注。转账以及其他需要活动密钥的操作，请使用[签名链接](/docs/sign-links)：由用户用自己的密钥逐一批准。

### 哪些语言有 SDK？ {#languages}

官方 SDK 面向 JavaScript。Python 有社区提供的库。任何语言都可以调用 REST API。参见 [SDK](/docs/sdk) 和 [REST API](/docs/api)。

## 帮助 {#help}

### 我可以在哪里获得帮助？ {#get-help}

请到 HiveDevs 的 Discord 服务器提问：https://discord.gg/pNJn7wh。报告错误时，请在相关的 GitHub 仓库提交 issue：网站是 https://github.com/ecency/hivesigner-ui，API 是 https://github.com/ecency/hivesigner-api，JavaScript SDK 是 https://github.com/ecency/hivesigner-sdk。在拒绝请求的界面上，**报告此问题**会把问题发送给 Hivesigner 团队。

### 我可以如何参与？ {#contribute}

Hivesigner 在 GitHub 上开源，就在上面那三个仓库中。请用 issue 反馈错误或想法，用 pull request 提交修复。
