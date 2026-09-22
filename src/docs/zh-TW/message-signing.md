你的應用程式可以請使用者用發文金鑰或活躍金鑰簽署一段文字訊息。簽章證明這位使用者掌控這個帳號。不會廣播任何東西：這則訊息永遠不會上鏈。Hivesigner 的簽署方式和 Hive Keychain 的 `requestSignBuffer` 相同，所以能驗證 Keychain 簽章的伺服器程式碼，也能驗證 Hivesigner 的簽章。

## 要求一個簽章 {#request}

把使用者送到 `https://hivesigner.com/sign-buffer`，並帶上這些查詢參數：

| 參數 | 必填 | 意義 |
| --- | --- | --- |
| `message` | 必填 | 要簽署的確切文字。它必須包含空白字元以外的內容。 |
| `redirect_uri` | 必填 | Hivesigner 把結果送去的地方。參見[回呼規則](#callback-rules)。 |
| `authority` | 選填 | `posting` 或 `active`，大小寫不拘（`Posting` 也可以）。缺少或為空時當作 `posting`。其他任何值都會被拒絕。 |
| `client_id` | 選填 | 你的應用程式帳號。`clientId` 也會被讀取。有它時，`redirect_uri` 必須是你應用程式的某個回呼網址。 |
| `state` | 選填 | 任何值。Hivesigner 會原樣傳回。 |
| `account` | 選填 | 你預期會簽署的帳號。該帳號在裝置上時 Hivesigner 會選取它，否則忽略。`select_account` 也會被讀取。 |

請用 `URLSearchParams` 組出網址，好讓每個值都被編碼：

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### 回呼規則 {#callback-rules}

- 回呼網址必須是 `https://`。一般的 `http://` 只在回送位址上有效：`localhost`、`127.0.0.1` 或 `[::1]`。
- **有 `client_id` 時**，回呼網址必須已在那個應用程式帳號上註冊，並依登入時的方式比對。參見[回呼網址](/docs/register-app#callback-rules)。請求開啟時，Hivesigner 會從 Hive 讀取該應用程式的回呼網址，在讀到之前不會簽署任何東西。當連不上 Hive 時，使用者會看到一個 **重試** 按鈕。
- **沒有 `client_id` 時**，任何符合第一條規則的回呼網址都可用。Hivesigner 這時會把回呼網址的主機寫成提出要求的一方，例如「HOST 請你簽署一則訊息。」

當你有應用程式帳號時，請送出 `client_id`。這樣使用者就會看到你應用程式的名稱和帳號，而且只有你註冊過的回呼網址才能收到簽章。

對於沒有訊息、`authority` 無法辨識、回呼網址缺少或無法使用、`client_id` 不是 Hive 帳號，或回呼網址未在該應用程式上註冊的請求，Hivesigner 都會拒絕。使用者會看到「這個簽署要求無法使用：它需要一則訊息、一把發文或活躍金鑰，以及為該應用程式註冊的安全重新導向網址。請回到該網站再試一次。」和一個 **回報這個問題** 按鈕。

### 使用者會看到什麼 {#what-the-user-sees}

- 一個寫明你應用程式名稱（或回呼網址主機）的標題，以及「將前往 HOST」。
- 完整的訊息，和將被簽署的內容一字不差。可能藏字或改變文字方向的字元會以 `\u{200B}` 這樣的編碼顯示。
- 「將以你的發文金鑰簽署」或「將以你的活躍金鑰簽署」。
- 一則警告：「你的簽章會向任何看到它的人證明 @USERNAME 簽署了這段確切的文字。只簽署你理解的訊息。」
- **簽署** 和 **取消**。鎖定的帳號會先索取本機密碼。

[訊息簽署請求](/docs/signing#message-requests)從使用者的角度說明這個畫面。

## 你的回呼網址會收到什麼 {#callback}

當使用者選擇 **簽署** 時，Hivesigner 會把他們送到你的回呼網址，並帶上這些查詢參數：

| 參數 | 值 |
| --- | --- |
| `signature` | 簽章，130 個字元的十六進位字串 |
| `public_key` | 簽署所用金鑰的公鑰，例如 `STM...` |
| `username` | 簽署的帳號 |
| `authority` | `posting` 或 `active` |
| `state` | 你的 `state`，只要請求中帶了它（空值也算） |

Hivesigner 把它們加到你回呼網址的查詢字串中，位置在 `?` 或 `&` 之後、任何 `#fragment` 之前。你自己的查詢字串維持不變。

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

當使用者選擇 **取消** 時，Hivesigner 會打開他們的帳號清單。你的回呼網址什麼都收不到。

> **警告：** 任何人都能用編造的值打開你的回呼網址。在你的伺服器驗證簽章之前，請把每個參數都當成尚未證實的說法。

## 驗證簽章 {#verify}

請在你的伺服器上檢查簽章：

1. 把你要求簽署的訊息連同它的 `state` 留在你的伺服器上。不要相信從瀏覽器傳回來的副本。
2. 對訊息做雜湊：對它的 UTF-8 位元組做 sha256。
3. 從簽章和那個雜湊還原出公鑰。
4. 從 Hive 載入該帳號。檢查還原出的公鑰屬於你要求的權限，而且權重足以單獨簽署。
5. 檢查 `state` 是你發出的那個值。每則訊息只接受一次。

下面的例子使用 dhive（https://www.npmjs.com/package/@hiveio/dhive）：

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

同樣的檢查也適用於來自 Hive Keychain `requestSignBuffer` 的簽章。請和你還原出的公鑰比對：回呼中的 `public_key` 只是提示。

## Hivesigner 不會簽署的訊息 {#refused-messages}

帶有 `signed_message` 鍵的 JSON 物件訊息，形狀就是 Hivesigner 權杖。簽署它會讓提出要求的一方取得該使用者帳號的存取權。Hivesigner 從不簽署這種訊息。它會告訴使用者「這則訊息是 Hivesigner 權杖。簽署它會讓該網站取得你帳號的存取權，因此無法簽署。」

請用純文字，或不帶 `signed_message` 鍵的 JSON。寫清楚這個簽章要做什麼用，並加上一個你只產生一次的值，例如：

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## 簽署訊息工具 {#sign-message-tool}

人們也可以在 https://hivesigner.com/signmessage 自己簽署訊息（**簽署訊息**），並在 https://hivesigner.com/verifymessage 檢查訊息（**驗證訊息**）。參見[自己簽署訊息](/docs/signing#sign-message)。

那個工具的簽署方式和 `/sign-buffer` 不同。它簽署的是一段含有訊息、帳號和時間的 Hivesigner 權杖內文，並把結果以 **驗證權杖** 的形式分享出來。請在 **驗證訊息** 頁面上，或依[自己檢查](/docs/tokens#check-it-yourself)所述的方法檢查這種權杖，而不要用上面的程式碼。
