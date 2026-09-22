常見問題的簡短回答。每一則都連到有詳細說明的頁面。

## 使用 Hivesigner {#using-hivesigner}

### Hivesigner 免費嗎？ {#is-it-free}

免費。Hivesigner 既不向使用者收費，也不向應用程式收費。它的原始碼以 MIT 授權開放。

### Hivesigner 會看到我的金鑰嗎？ {#keys}

不會。你的金鑰留在你裝置上的瀏覽器裡，Hivesigner 也在那裡完成簽署。它們從來不會被送到 Hivesigner 的伺服器，也不會送給你使用的應用程式。參見[金鑰儲存在哪裡](/docs/accounts#where-keys-are-stored)和[保護好你的金鑰](/docs/safety)。

### 如果我忘了本機密碼怎麼辦？ {#forgotten-passcode}

沒有人能還原本機密碼，Hivesigner 也不行。請把帳號從 Hivesigner 移除，再用你的 Hive 金鑰和新的本機密碼重新新增。你的 Hive 帳號和已授權的應用程式都不會改變。參見[如果你忘了本機密碼](/docs/accounts#forgotten-passcode)。

### 手機上可以用 Hivesigner 嗎？ {#phone}

可以。在手機瀏覽器中開啟 https://hivesigner.com 並在那裡新增帳號。金鑰只會存在那個瀏覽器裡，因此每台使用的裝置都要各自新增帳號。參見[新增與管理帳號](/docs/accounts)。

### 有哪些應用程式使用 Hivesigner？ {#which-apps}

https://hivesigner.com/apps 列出透過 Hivesigner 向 Hive 廣播的應用程式，依使用次數由多到少排列。每個應用程式的名稱與說明都是自己發布的，Hivesigner 不會驗證。在那裡開啟一個應用程式，會顯示可以授予它發文權限的頁面。參見[從目錄授權應用程式](/docs/signing-in#directory)。

### Hivesigner 和 Hive Keychain 有什麼關係？ {#hive-keychain}

它們是各自獨立的工具。Hive Keychain 是瀏覽器擴充功能與行動應用程式，Hivesigner 則是網站，因此不必安裝任何東西。當應用程式請你簽署訊息時，產生的簽章與 Hive Keychain 做出來的屬於同一種，應用程式用同一段程式碼就能驗證兩者。Hivesigner **簽署訊息**頁面產生的驗證權杖，會在 Hivesigner 的**驗證訊息**頁面核對。參見[訊息簽署](/docs/message-signing)。

## 用 Hivesigner 開發 {#building}

### 我可以在行動應用程式裡使用 Hivesigner 嗎？ {#mobile-app}

可以。把使用者帶到瀏覽器中的 Hivesigner，並使用你的應用程式能接收的回呼位址：你自己擁有的 https 連結（Android App Links 或 iOS Universal Links），或像 `http://127.0.0.1/auth` 這樣的回送位址。`myapp://` 之類的自訂協定會被拒絕。參見[行動與桌面應用程式](/docs/register-app#native-apps)。

### 我需要一個應用程式帳號嗎？ {#app-account}

如果要讓使用者帶著發文權限登入，或透過 API 廣播，就需要。參見[註冊你的應用程式](/docs/register-app)。[簽署連結](/docs/sign-links)和[訊息簽署](/docs/message-signing)不需要它，[不帶發文權限的登入](/docs/login-only)同樣不需要。

### API 可以轉帳嗎？ {#transfers}

不行。API 只廣播發文層級的操作，例如投票、留言與追蹤。轉帳以及其他需要活躍金鑰的操作，請使用[簽署連結](/docs/sign-links)：由使用者以自己的金鑰逐一核准。

### 哪些語言有 SDK？ {#languages}

官方 SDK 是給 JavaScript 用的。Python 有社群提供的函式庫。任何語言都可以呼叫 REST API。參見 [SDK](/docs/sdk) 和 [REST API](/docs/api)。

## 求助 {#help}

### 我可以去哪裡尋求協助？ {#get-help}

請到 HiveDevs 的 Discord 伺服器提問：https://discord.gg/pNJn7wh。回報錯誤時，請到相關的 GitHub 儲存庫開 issue：網站是 https://github.com/ecency/hivesigner-ui，API 是 https://github.com/ecency/hivesigner-api，JavaScript SDK 是 https://github.com/ecency/hivesigner-sdk。在拒絕請求的畫面上，**回報這個問題**會把問題送給 Hivesigner 團隊。

### 我可以怎麼參與？ {#contribute}

Hivesigner 在 GitHub 上開源，就在上面那三個儲存庫裡。請用 issue 回報錯誤或想法，用 pull request 送出修正。
