Hivesigner 權杖是一段簽署過的簡短聲明。它寫明一個 Hive 帳號、它是為哪個應用程式產生的，以及簽署的時間。你的伺服器可以透過 API 檢查權杖，也可以自己檢查。這一頁說明權杖包含什麼、能用多久，以及兩種檢查方式。

## 權杖長什麼樣子 {#format}

權杖是一個以 base64url 編碼的 JSON 物件，和標準 base64url 只差一點：填補字元用 `.` 而不是 `=`。也就是說，和一般 base64 相比，`+` 變成 `-`、`/` 變成 `_`、`=` 變成 `.`。每個權杖都以 `eyJzaWduZWRfbWVzc2FnZSI6` 開頭。

解碼之後，來自權杖流程的存取權杖長這樣：

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| 欄位 | 意義 |
| --- | --- |
| `signed_message.type` | 權杖的種類：`login`、`posting`、`code` 或 `refresh`。參見[權杖的種類](#kinds)。 |
| `signed_message.app` | 這個權杖是為哪個應用程式帳號產生的。為沒有應用程式帳號的網站產生的登入權杖沒有這一項。 |
| `authors[0]` | 這個權杖所屬的 Hive 帳號。 |
| `timestamp` | 簽署的時間，以 1970-01-01 UTC 起算的秒數表示。 |
| `signatures[0]` | 簽章，十六進位字串。 |
| `authority` | 只出現在瀏覽器中簽署的權杖裡：使用者的哪一把金鑰簽署了它，`posting` 或 `active`。這個欄位在被簽署的資料之外。若要確定是哪一把金鑰簽的，請從簽章還原出公鑰。 |

簽章是對 `JSON.stringify({ signed_message, authors, timestamp })` 的 sha256 雜湊所做的 secp256k1 簽章，其中各個鍵按此順序排列。

### 解碼權杖 {#decode}

在 Node.js 中：

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

在瀏覽器中：

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

解碼不等於檢查。任何人都能造出解碼後形狀相同的字串。信任它之前請先[檢查權杖](#check-a-token)。

## 權杖的種類 {#kinds}

| 權杖 | `type` | `app` | 簽署者 | 從哪裡取得 |
| --- | --- | --- | --- | --- |
| 存取權杖，權杖流程 | `posting` | 你的應用程式 | 使用者的發文金鑰；若 Hivesigner 沒有該帳號的發文金鑰，則是活躍金鑰 | 回呼網址上的 `access_token` |
| 登入權杖，`scope=login` | `login` | 你的應用程式 | 使用者的發文金鑰或活躍金鑰 | 回呼網址上的 `access_token` |
| 登入權杖，沒有應用程式帳號的網站 | `login` | 沒有 | 使用者的發文金鑰或活躍金鑰 | 回呼網址上的 `access_token` |
| 授權碼 | `code` | 你的應用程式 | 使用者的發文金鑰或活躍金鑰 | 回呼網址上的 `code` |
| 存取權杖，授權碼流程 | `posting` | 你的應用程式 | @hivesigner 的發文金鑰 | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| 更新權杖 | `refresh` | 你的應用程式 | @hivesigner 的發文金鑰 | [`/api/oauth2/token`](/docs/api#oauth2-token) |

授權碼和更新權杖都不是存取權杖。絕對不要把它們任何一個當成一次登入。

## 權杖能用多久 {#lifetime}

存取權杖可用 7 天：`expires_in` 是 604800 秒，從它的 `timestamp` 起算。過期之後：

- **權杖流程：** 把使用者送去重新登入。已經授權過你應用程式的使用者會看到「登入 APP」，只要按一下即可。
- **授權碼流程：** 你的伺服器用更新權杖和用戶端密鑰取得新的存取權杖。參見[更新](/docs/oauth2#refresh)。

只要權杖的 `timestamp` 超過 7 天，就把它當成已過期。對於重新導向之後立刻檢查的東西，請接受短得多的時效。授權碼要立刻兌換。登入權杖只在它的 `timestamp` 之後幾分鐘內接受。

## 在你的伺服器上檢查權杖 {#check-a-token}

在你的伺服器信任瀏覽器或應用程式送來的權杖之前，請檢查：

- 確實是該帳號或 @hivesigner 簽署了它；
- 它是為你的應用程式產生的；
- 它是你預期的那種權杖；
- 它夠新。

### 問 API {#check-with-the-api}

帶著權杖呼叫 `/api/me`。有效的權杖會在 `user` 中傳回帳號：

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

無效的權杖會傳回 `401` 和 `invalid_grant`。參見 [GET /api/me](/docs/api#me)。

`/api/me` 會確認簽章。它的回答不會指出權杖是為哪個應用程式產生的。所以也要自己解碼權杖，檢查它的 `app`、`type` 和時效。為別的應用程式產生的權杖，不該讓任何人登入你的應用程式。

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

API 只接受有寫明應用程式的權杖。來自沒有應用程式帳號的網站的登入權杖，請[自己檢查](#check-it-yourself)。

### 自己檢查 {#check-it-yourself}

1. 解碼權杖。
2. 檢查 `signed_message.type` 是你預期的種類：存取權杖是 `posting`，登入權杖是 `login`。
3. 檢查 `signed_message.app` 是你的應用程式帳號。若是沒有應用程式帳號的網站，則檢查它根本不存在。
4. 依 `timestamp` 檢查時效。
5. 計算 `JSON.stringify({ signed_message, authors, timestamp })` 的 sha256 雜湊。
6. 從 `signatures[0]` 和那個雜湊還原出公鑰。
7. 此刻從 Hive 區塊鏈讀取帳號 `authors[0]`，因為使用者可以更換金鑰。還原出的公鑰必須是它目前的發文金鑰或活躍金鑰之一。至於來自 `/api/oauth2/token` 的權杖則由 @hivesigner 簽署：對那些權杖，請接受 @hivesigner 帳號目前的發文金鑰。

在 Node.js 中，可以用在 `@ecency/sdk/hive` 下匯出 `PrivateKey`、`PublicKey`、`Signature` 和 `callRPC` 的 [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk)：

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

像這樣使用它：

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

dhive 函式庫（`@hiveio/dhive`）也可以：用 `cryptoUtils.sha256(message)` 計算雜湊，用 `Signature.fromString(signatures[0]).recover(digest).toString()` 還原公鑰。

## 妥善保管權杖 {#keep-tokens-safe}

任何拿到發文權杖的人，都能在它過期之前透過你的應用程式以使用者的身分廣播。請把它當成密碼看待。

- **把權杖留在你的伺服器上**，或放在 httpOnly、Secure 的 Cookie 裡。更新權杖和用戶端密鑰只留在伺服器上。
- **絕對不要把權杖放進會被記錄到日誌的網址。** 權杖流程會在回呼網址的查詢字串中送來權杖。請在你的伺服器上讀取它，然後重新導向到沒有它的網址。日誌中不要記下回呼網址的查詢字串。
- **不要在回呼頁面上載入任何來自其他網站的東西**，以免帶著權杖的網址被送給它們。在那個頁面加上 `Referrer-Policy: no-referrer` 標頭會有幫助。
- **只把權杖送到你自己的伺服器和 `https://hivesigner.com/api/`。**

## 登出與移除存取權 {#sign-out}

- **讓使用者登出**就是丟掉權杖：把它從你的工作階段或 Cookie 中刪除。你也可以呼叫 [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) 告訴 Hivesigner 使用者已登出。你的應用程式仍要自己丟掉權杖。
- **徹底切斷你應用程式的存取權**由使用者決定。在 https://hivesigner.com/authorized-apps，或在 `https://hivesigner.com/revoke/APP`，他們會把你的應用程式帳號從鏈上的發文權限中移除。之後 API 就不再透過你的應用程式替他們廣播。
