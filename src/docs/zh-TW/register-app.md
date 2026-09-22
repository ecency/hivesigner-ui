用 Hivesigner 讓人們登入的應用程式，本身就是一個 Hive 帳號。它的名稱就是你送出的 `client_id`。它的個人檔案存放著 Hivesigner 會讀取的設定：可以接收權杖的回呼網址，以及授權碼流程要用的用戶端密鑰。若要透過 API 廣播，應用程式帳號還要把發文權限授予 @hivesigner。這一頁逐步說明每個步驟。

## 你需要什麼 {#what-you-need}

| 你想做的事 | 應用程式帳號和回呼網址 | 用戶端密鑰 | @hivesigner 授權 |
| --- | --- | --- | --- |
| 讓人們登入並以權杖流程廣播 | 需要 | 不需要 | 需要 |
| 讓人們登入並以授權碼流程廣播（更新權杖） | 需要 | 需要 | 需要 |
| 只讓人們登入，權杖中寫明你的應用程式 | 需要 | 不需要 | 不需要 |
| 只讓人們登入，來自沒有 Hive 帳號的網站 | 不需要 | 不需要 | 不需要 |
| 送出簽署連結 | 不需要 | 不需要 | 不需要 |

關於最後兩列，參見[不需發文權限的登入](/docs/login-only)和[簽署連結](/docs/sign-links)。

## 建立應用程式帳號 {#app-account}

1. 為你的應用程式建立一個 Hive 帳號，例如在 https://ecency.com/signup。請替應用程式使用另一個帳號，不要用你的個人帳號。它的名稱就是你的 `client_id`。使用者會在授權畫面上「Hive 帳號」字樣旁看到它。Hive 帳號無法改名，所以請謹慎挑選名稱。
2. 在 https://hivesigner.com/import 把該帳號加入 Hivesigner（**新增帳號**）。請使用活躍金鑰或主密碼：下面的授權步驟需要活躍金鑰。

## 填寫應用程式設定 {#app-settings}

選取應用程式帳號後開啟 https://hivesigner.com/profile，並設定：

- **此帳號是一個應用程式。** 把它打開。它會把該帳號標示為應用程式，API 在接受針對它的授權碼或更新權杖之前會檢查這一點。
- **重新導向 URI。** 你的回呼網址，一行一個。參見[回呼網址](#callbacks)。
- **建立者。** 由誰維護這個應用程式。https://hivesigner.com/apps 的應用程式目錄會顯示它。
- **狀態。** 正式或測試環境，供你自己記錄。Hivesigner 對兩者一視同仁。
- **用戶端密鑰。** 只有[授權碼流程](/docs/oauth2#code-flow)才需要。參見[用戶端密鑰](#client-secret)。

也請填寫 **名稱** 和 **大頭貼網址**。授權畫面會顯示你應用程式的圖片和名稱。https://hivesigner.com/apps 的應用程式目錄會顯示名稱、**關於** 和 **網站**。

儲存會在鏈上更新該帳號的個人檔案，並需要它的發文金鑰。登入請求開啟時，Hivesigner 會從該帳號讀取你的回呼網址，所以交易一進入區塊，變更就會生效。

> **備註：** 名稱、圖片和說明由你的應用程式帳號自己發布。因此授權畫面也會顯示真正的帳號名稱（`@myapp`）和它把使用者送往的主機：授權和重新導向真正依據的正是這兩項。

## 回呼網址 {#callbacks}

回呼網址（登入請求中的 `redirect_uri`）是 Hivesigner 帶著權杖或授權碼把使用者送回的地方。Hivesigner 只會送到你應用程式帳號上列出的回呼網址。

### 規則 {#callback-rules}

- **完全相符。** 請求中的 `redirect_uri` 必須和你的某個重新導向 URI 逐字元相同：協定、主機、連接埠、路徑和查詢字串。
- **僅限 https。** 回呼網址必須使用 `https://`。一般的 `http://` 只有在回送位址上才會被接受：`localhost`、`127.0.0.1` 或 `[::1]`。
- **回送連接埠可以改變。** 已註冊的一般 http 回送網址，可以對應到路徑、查詢字串、片段和使用者資訊相同的任何回送主機和連接埠。已註冊的 `https://` 回送網址則仍須完全相符。
- **不接受自訂協定。** 像 `myapp://callback` 這樣的網址會被拒絕。參見[行動與桌面應用程式](#native-apps)。
- **不要加片段。** 不要在回呼網址上加 `#fragment`。

對於根本不可能生效的回呼網址，個人檔案頁會拒絕儲存，並顯示「無法使用的回呼網址（僅限 https，或 localhost 上的 http）」。

### 範例 {#callback-examples}

假設註冊了以下重新導向 URI：

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| 請求中的 `redirect_uri` | 結果 |
| --- | --- |
| `https://myapp.example/auth/callback` | 接受：完全相符 |
| `https://myapp.example/auth/callback/` | 拒絕：多了一個 `/` |
| `https://myapp.example/auth/callback?next=home` | 拒絕：查詢字串不同 |
| `https://www.myapp.example/auth/callback` | 拒絕：主機不同 |
| `http://myapp.example/auth/callback` | 拒絕：回送位址以外的一般 http |
| `http://localhost:3000/auth` | 接受：完全相符 |
| `http://127.0.0.1:51234/auth` | 接受：回送位址，路徑相同，連接埠不同 |
| `http://[::1]:3000/auth` | 接受：回送位址，路徑相同 |
| `http://127.0.0.1:3000/other` | 拒絕：路徑不同 |
| `https://localhost:3000/auth` | 拒絕：https 與一般 http 的註冊不相符 |
| `myapp://auth` | 拒絕：自訂協定 |

若要在回呼網址上接受查詢字串，請連同那個查詢字串一起註冊。Hivesigner 會保留你自己的查詢字串，並把它的參數接在後面。

### 行動與桌面應用程式 {#native-apps}

Hivesigner 把權杖放進回呼網址裡。像 `myapp://` 這種自訂協定並不屬於某一個應用程式：同一台裝置上的另一個應用程式可以宣告它並收到權杖。因此 Hivesigner 拒絕自訂協定，只把權杖送到 https 網址或使用者自己裝置上的回送位址。

原生應用程式可改用以下其中一種：

- **一個自己擁有的 https 連結。** 在你的網域下註冊一個回呼網址，由作業系統在你的應用程式中開啟（Android App Links 或 iOS Universal Links）。
- **一個回送網址。** 應用程式在 `127.0.0.1` 上等候重新導向。註冊 `http://127.0.0.1/auth`（或 `localhost`），執行時使用任何空閒的連接埠即可：連接埠不必相同。

## 用戶端密鑰 {#client-secret}

用戶端密鑰用來證明兌換授權碼的人是你的伺服器。它是[授權碼流程](/docs/oauth2#code-flow)的必要條件：你的伺服器把它連同每個授權碼或更新權杖送到 `/api/oauth2/token`。權杖流程不會用到它。

- **產生一個很長的隨機值**，例如用 `openssl rand -hex 32`。
- **在個人檔案頁設定它。** Hivesigner 只把它的 sha256 雜湊存在你應用程式帳號的個人檔案裡。把欄位留空會保留目前的密鑰。
- **把它留在你的伺服器上。** 絕對不要把它放進網頁、行動應用程式或網址。
- **若要更換它**，請設定新值並同時更新你的伺服器。

## 把發文權限授予 @hivesigner {#grant-hivesigner}

API 用 @hivesigner 帳號的發文金鑰廣播。只有當你的應用程式帳號已把 @hivesigner 加入它自己的發文權限時，Hive 才會為你的使用者接受這個簽章。參見[發文權限鏈](/docs/how-it-works#authority-chain)。

1. 在 Hivesigner 中選取你的應用程式帳號。
2. 開啟 https://hivesigner.com/authorize/hivesigner。
3. 頁面上寫著「授權 @hivesigner」和「@hivesigner 將可以用 @myapp 的身分發文、留言、投票和追蹤。」請選擇 **授權**。這一步需要應用程式帳號的活躍金鑰。

這一步只要做一次。沒有它，每次廣播都會以 `unauthorized_client` 和「Broadcaster account doesn't have permission to broadcast for @myapp」失敗。只做登入的應用程式不需要它。

這項授權也讓 @hivesigner 能以你的應用程式帳號本身的身分發文，這又是一個把應用程式帳號只留給應用程式用的理由。

在這項授權到位的情況下透過 Hivesigner 廣播的應用程式，可以出現在 https://hivesigner.com/apps 的應用程式目錄中，依使用人數排序。

## 出狀況時使用者會看到什麼 {#refused-requests}

對於無法安全處理的請求，Hivesigner 會拒絕。它會顯示一則訊息和一個 **回報這個問題** 按鈕。那個請求無法被核准。不會有任何東西送到你的回呼網址。

| 問題 | 使用者看到的內容 |
| --- | --- |
| `redirect_uri` 不在你的重新導向 URI 之列 | 「這個應用程式的重新導向網址尚未註冊。為了你的安全，已封鎖登入。」 |
| `client_id` 不是 Hive 帳號 | 「@myapp 不是 Hive 帳號，因此沒有可授權的應用程式。請返回該網站再試一次。」 |
| 該帳號未標示為應用程式 | 「@myapp 未設定為應用程式，因此無法讓你登入。請返回該網站後再試一次。」請依上文所述打開 **此帳號是一個應用程式**。 |
| 請求中沒有 `redirect_uri` | 「這個授權請求不完整：未指定應用程式或重新導向網址。請返回應用程式再試一次。」 |

如果你的使用者回報其中之一，請把應用程式送出的 `redirect_uri` 和你的重新導向 URI 逐字元比對。

## 檢查清單 {#checklist}

1. 一個給應用程式用的 Hive 帳號，已用活躍金鑰加入 Hivesigner。
2. 在 https://hivesigner.com/profile 上：「此帳號是一個應用程式」已打開、重新導向 URI 已列出，若使用授權碼流程則已設定用戶端密鑰。
3. 若要透過 API 廣播，已在 https://hivesigner.com/authorize/hivesigner 授權 @hivesigner。
4. 一個登入連結，送出的正是你某個重新導向 URI 的原樣值。參見[用 OAuth2 登入](/docs/oauth2)。
