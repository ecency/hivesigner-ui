把人們送到 Hivesigner 來登入你的應用程式。他們在那裡查看並核准你的請求。接著 Hivesigner 把他們送回你的回呼網址，帶著一個權杖（權杖流程），或帶著一個由你的伺服器兌換成權杖的授權碼（授權碼流程）。這一頁涵蓋這兩種流程、每個參數以及各種權限範圍。

## 開始之前 {#before-you-start}

- 註冊應用程式：為它準備一個 Hive 帳號，並列出你的回呼網址。參見[註冊應用程式](/docs/register-app)。
- 若要透過 API 廣播，你的應用程式帳號還必須[把發文權限授予 @hivesigner](/docs/register-app#grant-hivesigner)。
- 若要用授權碼流程，請設定[用戶端密鑰](/docs/register-app#client-secret)。

## 授權網址 {#authorize-url}

把使用者送到這個位址：

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

請把每個值做網址編碼。`URLSearchParams` 會替你處理：

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### 參數 {#parameters}

| 參數 | 必填 | 作用 |
| --- | --- | --- |
| `client_id` | 對應用程式而言必填 | 你應用程式帳號的名稱。`clientId` 也會被讀取。沒有它時，這個請求就變成來自沒有應用程式帳號的網站的純登入請求：參見[不需發文權限的登入](/docs/login-only)。 |
| `redirect_uri` | 必填 | Hivesigner 把使用者送回的地方。它必須和你應用程式的某個重新導向 URI 完全相同。參見[回呼網址](/docs/register-app#callbacks)。 |
| `scope` | 選填 | `login`、`posting` 或 `offline`。參見[權限範圍](#scopes)。沒有它時，請求索取發文權限。 |
| `response_type` | 選填 | 值為 `code` 會開始[授權碼流程](#code-flow)。其他值或不填則表示[權杖流程](#token-flow)。 |
| `state` | 建議填寫 | 一個隨機值，Hivesigner 會原樣傳回。參見[用 state 保護請求](#state)。 |
| `account` | 選填 | 一個 Hive 使用者名稱。當那個帳號在使用者的裝置上時，Hivesigner 會選取它；否則忽略。`select_account` 也會被讀取。 |

使用者在授權畫面上仍可以換成別的帳號。請一律從權杖或授權碼兌換結果取得帳號，絕對不要用你當初要求的那個。

## 權限範圍 {#scopes}

Hive 只有一種發文權限。因此 Hivesigner 只有兩級存取，純登入和發文，中間沒有更細的區分。

| `scope` | 使用者核准的內容 | 流程 | 存取權杖的 `type` |
| --- | --- | --- | --- |
| `login` | 「查看你的帳號使用者名稱」。不授予任何權限。 | 權杖流程（不要加 `response_type=code`） | `login` |
| `posting` | 發文權限。第一次會把你的應用程式帳號加入使用者的發文權限。 | 權杖流程，或帶 `response_type=code` 的授權碼流程 | `posting` |
| `offline` | 與上面相同的發文權限 | 授權碼流程 | `posting`，並附上一個 `refresh` 權杖 |

在授權碼流程中，回呼網址先收到一個授權碼（`type` 為 `code` 的權杖），再由你的伺服器把它兌換成存取權杖。

- **不填範圍**表示 `posting`。
- **任何位置含有 `offline` 的值**都表示 `offline`，例如舊的 `offline,vote,comment`。
- **其他任何值**都表示 `posting`。這包括 `vote`、`comment`、`vote,comment`、`comment_options` 或 `custom_json` 這些舊的操作名稱。它們不會限制權杖：每個發文權杖都允許同一組操作。參見[broadcast 接受哪些操作](/docs/api#broadcast-rules)。

當你的應用程式只需要知道使用者是誰時，請索取 `login`。參見[不需發文權限的登入](/docs/login-only)。

## 權杖流程 {#token-flow}

使用者的瀏覽器直接收到存取權杖。你的應用程式不需要任何密鑰。

1. 把使用者送到授權網址：

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. 使用者核准。Hivesigner 重新導向到你的回呼網址：

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   當你的回呼網址沒有查詢字串時，Hivesigner 用 `?` 加上自己的參數；有查詢字串時則用 `&`。只有在你送出非空值時，`state` 才會出現。

3. 在你的回呼網址上，先[比對 `state`](#state)。接著在你的伺服器上[檢查權杖](/docs/tokens#check-a-token)。權杖所屬的帳號就在權杖裡面：不要只依賴 `username` 參數，因為任何人都能改網址。
4. 把權杖留在你的伺服器上或 httpOnly Cookie 裡。接著重新導向到乾淨的網址，讓權杖從網址列消失。
5. 用這個權杖呼叫 [API](/docs/api)，直到它在 `expires_in` 秒（7 天）後過期。然後再把使用者送到授權網址。已經授予過發文權限的使用者會看到「登入 APP」和「你之前已授權 @myapp，不會授予新的權限。」

## 授權碼流程 {#code-flow}

你的伺服器收到一個授權碼，並把它兌換成一個存取權杖和一個更新權杖。之後它可以在使用者不在場的情況下自行續期。當你的伺服器要長期替使用者做事時，請用這種流程。

1. 把使用者送到帶 `scope=offline` 的授權網址：

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` 效果相同。

2. 使用者核准發文權限。Hivesigner 重新導向到你的回呼網址：

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [比對 `state`](#state)。接著立刻從你的伺服器兌換授權碼。

### 兌換授權碼 {#exchange-code}

把授權碼和你的用戶端密鑰放在 POST 請求的內文中，送到 `/api/oauth2/token`：

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

回答：

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

同樣的呼叫在 Node.js 18 或更新版本中：

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- 把授權碼和密鑰放在請求內文裡，絕對不要放進網址。
- 這個請求不要帶 `Authorization` 標頭。
- 請使用這個回答中的 `username`。它來自使用者簽署的授權碼。
- 把存取權杖和更新權杖留在你的伺服器上。

### 更新 {#refresh}

存取權杖過期後，把更新權杖連同你的用戶端密鑰送到同一個端點：

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

回答的形狀相同，帶著新的存取權杖和新的更新權杖。請用它們取代舊的那兩個。

## 用 state 保護請求 {#state}

沒有 `state`，別的網站就能把你的使用者送到你的回呼網址，並帶上它自己挑的權杖或授權碼。你的應用程式於是會把使用者登入到別人的帳號。`state` 把每一次回來都綁到發起登入的那個瀏覽器。

1. 每次登入產生一個隨機值，至少 16 個隨機位元組。十六進位可以避免出現需要編碼的字元。
2. 把它存在只有這個瀏覽器才能再次提出的地方：你的伺服器工作階段，或一個帶 `SameSite=Lax` 的短效 httpOnly、Secure Cookie。
3. 把它當作 `state` 放進授權網址。
4. 在你的回呼網址上，把 `state` 參數和存下的值比對。若缺少或不同，就停下來：權杖和授權碼都不要用。
5. 刪掉存下的值，讓每個值只生效一次。

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner 會原樣傳回它收到的 `state` 值。空值則會被省略。

## 使用者會看到什麼 {#what-the-user-sees}

授權畫面會顯示你應用程式的圖片和名稱、「Hive 帳號 @myapp」以及「將前往 HOST」，其中 HOST 取自你的回呼網址。接著：

- **首次發文請求。** 標題寫著「APP 要求存取你的帳號。」**權限範圍**卡片列出你的應用程式將能做的事。一則提示寫著「首次授權：這會在鏈上將 @myapp 加入你的發文權限，需要使用一次你的活躍金鑰。在你撤銷之前，該帳號都能以你的身分發文。」按鈕上寫著 **授權**。當使用者的裝置上沒有該帳號的活躍金鑰時，畫面會就地索取。
- **登入。** 對於 `scope=login`，或使用者先前已授予的發文權限，標題寫著「登入 APP」，按鈕上寫著 **登入**。
- **帳號。** 「用於授權的帳號」或「登入帳號」，後面接著選取的帳號。使用者可以在這裡換帳號。
- **鎖定的帳號。** 按鈕上方會有一個本機密碼欄位。按一下就能解鎖帳號並繼續。
- **裝置上沒有帳號。** 按鈕上寫著 **繼續**。它會打開新增帳號表單，然後回到這個請求。

首次發文請求之後，Hivesigner 會等到新的授權在鏈上看得到才重新導向。這可能要幾秒鐘。若想從使用者的角度看完整畫面，參見[登入應用程式](/docs/signing-in)。

## 取消與被拒絕的請求 {#cancel}

- **取消。** 使用者會回到自己在 Hivesigner 的帳號清單。不會有任何東西送到你的回呼網址：也沒有錯誤參數。請讓登入按鈕保持可用，好讓使用者重新開始。不要一直等回來。
- **被拒絕的請求。** 未註冊的回呼網址、未知的 `client_id` 或缺少 `redirect_uri`，都會在 Hivesigner 中顯示錯誤和一個 **回報這個問題** 按鈕。不會有任何東西送到你的回呼網址。參見[出狀況時使用者會看到什麼](/docs/register-app#refused-requests)。

## 舊版登入請求網址 {#legacy-login-request}

Hivesigner 仍然接受較舊的登入網址，那是為了舊的整合而保留的。新的整合請使用 `/oauth2/authorize`。

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

它會打開相同的授權畫面，用相同的回呼檢查和相同的重新導向方式，但讀取參數的方式不同：

- `scope` 是 `login` 或 `posting`。其他值或不填都表示 `login`。
- 不讀取 `offline`。若要用授權碼流程，請加上 `response_type=code`。
- 不讀取 `account`。

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` 遵循同一套規則。
