有些應用程式只需要知道一個人在 Hive 上是誰。它們從不替這個人發文、投票或廣播任何東西。Hivesigner 可以在不需要任何發文權限的情況下，讓人們登入這樣的應用程式。使用者證明自己掌控某個 Hive 帳號，你的應用程式得知它的名稱。這一頁說明兩種做法，以及如何安全地檢查結果。

## 兩種做法 {#two-ways}

- **有應用程式帳號：** 你的應用程式有自己的 Hive 帳號，並要求 `scope=login`。權杖中寫明你的應用程式。
- **沒有應用程式帳號：** 沒有自己 Hive 帳號的網站只送出一個 `redirect_uri`。權杖中不寫明任何應用程式，由你的網站自己檢查。

兩種做法都不需要使用者或你的應用程式帳號授予任何權限，所以使用者的帳號上不會有任何改變。Hivesigner 用發文金鑰簽署這次登入；若裝置上沒有該帳號的發文金鑰，則用活躍金鑰簽署。

## 有應用程式帳號 {#app-account}

1. [註冊應用程式](/docs/register-app)：建立它的 Hive 帳號並列出你的回呼網址。你不需要用戶端密鑰，也不需要 @hivesigner 授權。
2. 把使用者送到：

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. 使用者會看到「登入 APP」，其中 **權限範圍** 顯示「查看你的帳號使用者名稱」。他們選擇 **登入**。
4. Hivesigner 重新導向到你的回呼網址：

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [比對 `state`](/docs/oauth2#state)，然後檢查權杖。這是一個寫明你應用程式的 `login` 權杖，所以下面兩種做法都可以：
   - 帶著它呼叫 [`GET /api/me`](/docs/api#me)，它會在 `user` 中回答帳號，`scope` 為 `["login"]`，接著解碼權杖並檢查 `type` 和 `app`（[問 API](/docs/tokens#check-with-the-api)）；
   - 或者用 `type: 'login'` 和你的應用程式名稱[自己檢查](/docs/tokens#check-it-yourself)。

`login` 權杖無法廣播：`/api/broadcast` 會拒絕隨它送出的每一個操作。

## 沒有應用程式帳號 {#no-app-account}

1. 把使用者送到帶著 `redirect_uri` 而沒有 `client_id` 的授權網址：

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   回呼網址必須是 `https://`，或回送位址上的 `http://`（`localhost`、`127.0.0.1`、`[::1]`）。這裡沒有可供註冊的清單。Hivesigner 在這種情況下會忽略 `scope` 和 `response_type`：回答一律是登入權杖。

2. 使用者會看到「HOST 想確認你的 Hive 使用者名稱。」，其中 HOST 是你回呼網址的主機。他們選擇 **登入**。
3. Hivesigner 重新導向到你的回呼網址：

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [比對 `state`](/docs/oauth2#state)，然後自己檢查權杖。API 不接受沒有寫明應用程式的權杖，所以由你的伺服器對照帳號的金鑰驗證簽章。參見[自己檢查](/docs/tokens#check-it-yourself)，使用 `type: 'login'` 且沒有 `app`。

當回呼網址不是網頁位址，或是回送位址以外的一般 `http://` 時，Hivesigner 會拒絕該請求，並告訴使用者原因。

## 該用哪一種 {#which-one}

| | 有應用程式帳號 | 沒有應用程式帳號 |
| --- | --- | --- |
| 使用者看到什麼 | 你應用程式的名稱、圖片和 Hive 帳號 | 只有你網站的主機 |
| 需要的準備 | 一個列出回呼網址的 Hive 帳號 | 不需要 |
| 權杖寫明 | 你的應用程式 | 不寫明任何應用程式 |
| 用什麼檢查權杖 | `/api/me` 或你自己的程式碼 | 你自己的程式碼 |
| 日後的發文權限 | 同一個帳號：要求 `posting` 並[授權 @hivesigner](/docs/register-app#grant-hivesigner) | 要先有應用程式帳號 |

條件許可時請使用應用程式帳號。使用者看得到你應用程式的名稱和圖片。你的伺服器可以拒絕為別的應用程式產生的權杖。日後你也能用同一個帳號轉為發文權限。

當你的網站沒有 Hive 帳號也不想要時，請用第二種做法。

## 安全地檢查這次登入 {#check-safely}

- **用 `state` 綁定請求。** 每次登入產生一個隨機值，存進使用者的工作階段，在回呼網址上比對，而且只用一次。參見[用 state 保護請求](/docs/oauth2#state)。
- **檢查種類。** 只接受 `signed_message.type` 為 `login` 的權杖。授權碼或更新權杖都不是一次登入。
- **檢查應用程式。** 有應用程式帳號時，`signed_message.app` 必須是你的應用程式；沒有應用程式帳號時，則不該有 `app`。
- **檢查時效。** 你在重新導向後立刻檢查權杖，所以只在它的 `timestamp` 之後幾分鐘內接受它（例如 5 分鐘，再加一分鐘的時鐘誤差）。
- **每個權杖只用一次。** 檢查通過後，開啟你自己的工作階段（例如一個 httpOnly Cookie），並丟掉 Hivesigner 權杖。把已接受的權杖記下來，直到它們舊到過不了時效檢查為止。再次看到的一律拒絕。
- **別讓權杖進日誌。** 它隨著回呼網址的查詢字串到達。參見[妥善保管權杖](/docs/tokens#keep-tokens-safe)。

## 例子 {#examples}

https://hivesearcher.com 和 https://openhive.chat 這類網站，讓人們用 Hive 帳號登入，以使用搜尋、聊天等留在鏈外的功能。它們只需要知道這個人是誰，其他一概不需要。
