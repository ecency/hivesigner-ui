官方 JavaScript SDK 會替你組出登入網址和簽署連結，並呼叫 Hivesigner API。Python 方面有社群提供的函式庫。其他任何語言都可以直接呼叫 [REST API](/docs/api)。

## JavaScript SDK {#javascript}

SDK 就是 npm 套件 `hivesigner`。它的原始碼在 https://github.com/ecency/hivesigner-sdk。它以 TypeScript 撰寫，並附上型別定義。

版本 4 需要 Node.js 18 或更新版本，因為它使用內建的 `fetch`。在瀏覽器中它需要 ES2017 或更新版本。在沒有全域 `fetch` 的環境中，請在使用 SDK 之前加上 polyfill。在較舊的 Node.js 上，請繼續使用版本 3。

### 安裝 {#install}

```bash
npm install hivesigner
```

對於沒有建置步驟的頁面，請載入瀏覽器打包版。它會定義一個全域變數 `hivesigner`：

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### 建立用戶端 {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| 選項 | 意義 |
| --- | --- |
| `app` | 你的應用程式帳號，會當作 `client_id` 送出。 |
| `callbackURL` | Hivesigner 把使用者送回的地方。它必須和你應用程式的某個回呼網址逐字元相同（使用一般 http 的回送網址在主機和連接埠上可以不同，參見[回呼網址](/docs/register-app#callback-rules)）。 |
| `scope` | 一個清單，會用逗號接成 `scope` 參數。參見[權限範圍](/docs/oauth2#scopes)。 |
| `responseType` | 授權碼流程用 `'code'`。權杖流程則不填。 |
| `accessToken` | 使用者的存取權杖，如果你已經有了。 |
| `apiURL` | API 的來源位址。SDK 會在後面加上 `/api/`。預設是 `https://hivesigner.com`。 |

`setApp`、`setCallbackURL`、`setScope`、`setAccessToken`、`removeAccessToken` 和 `setApiURL` 可以在之後修改用戶端。每一個都會傳回該用戶端。

### 讓使用者登入 {#sign-in}

`getLoginURL(state, account)` 會傳回登入網址：

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` 會原樣回到你的回呼網址。用它把回答和請求對應起來。
- `account` 是選填的：一個使用者名稱。該帳號在裝置上時 Hivesigner 會選取它，否則忽略。

在瀏覽器中，`client.login({ state: 'STATE' })` 會把使用者送到同一個網址，但不帶帳號。

在權杖流程中，你的回呼網址會收到 `access_token`、`expires_in` 和 `username`。請把權杖交給用戶端：

```js
client.setAccessToken('ACCESS_TOKEN');
```

SDK 沒有提供授權碼流程中兌換授權碼的方法。你的伺服器要自己把授權碼和用戶端密鑰送到 API，就像[兌換授權碼](/docs/oauth2#exchange-code)所示。

### 取得使用者 {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` 是鏈上傳回的使用者 Hive 帳號。`scope` 列出該權杖允許的內容。

### 廣播 {#broadcast}

`broadcast(operations)` 把操作送到 API，由 API 替使用者廣播。API 只接受由權杖所屬使用者撰寫的發文類操作：`vote`、`comment`、`delete_comment`、`comment_options`、使用發文權限的 `custom_json`、`claim_reward_balance`，以及用於個人檔案中繼資料的 `account_update2`。參見[broadcast 接受哪些操作](/docs/api#broadcast-rules)。

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

請在每個操作中寫明使用者。API 不會替換 `__signer`。

以下的輔助方法各自組出一個操作並呼叫 `broadcast`：

| 方法 | 廣播什麼 |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`。`weight` 從 `-10000` 到 `10000`（100%）。 |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`。發新文章時 `parentAuthor` 是 `''`。`jsonMetadata` 可以是物件：SDK 會把它轉成字串。 |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`。`requiredAuths` 傳 `[]`，`requiredPostingAuths` 傳 `['USERNAME']`。`json` 是字串。 |
| `reblog(account, author, permlink)` | id 為 `follow` 的 `custom_json`，用來轉發文章 |
| `follow(follower, following)` | id 為 `follow`、`what: ['blog']` 的 `custom_json` |
| `unfollow(unfollower, unfollowing)` | id 為 `follow`、`what: []` 的 `custom_json` |
| `ignore(follower, following)` | id 為 `follow`、`what: ['ignore']` 的 `custom_json`（靜音） |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`。金額是字串，例如 `'0.000 HIVE'`、`'0.000 HBD'` 和 `'1.000000 VESTS'`。 |

`updateUserMetadata()` 已不再建議使用。要更改使用者的個人檔案，請廣播帶有新 `posting_json_metadata` 的 `account_update2`。

### 登出 {#log-out}

`revokeToken()` 是 SDK 的登出呼叫。它把權杖送到 API 的撤銷端點，然後把它從用戶端移除。當這個呼叫被拒絕時，請自己呼叫 `removeAccessToken()`。也要把權杖從你的應用程式存放它的地方刪掉。

若要徹底終止你應用程式的存取權，需由使用者在 https://hivesigner.com/authorized-apps 移除。參見[查看並移除應用程式的存取權](/docs/signing-in#remove-access)。

### 簽署連結 {#sign-links}

`sendOperation(op, params)`、`sendOperations(ops, params)` 和 `sendTransaction(tx, params)` 會傳回一個 `https://hivesigner.com/sign/...` 連結。`params` 接受 `callback`、`no_broadcast` 和 `signer`。參見[簽署連結](/docs/sign-links)。

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

在 TypeScript 中，型別要求一定要有第三個引數：傳入 `undefined` 就能取回連結。

在瀏覽器中，把一個函式當作第三個引數傳入，就能改成在新分頁打開連結。那個函式不會被呼叫，也不會傳回任何東西。請在點擊處理函式中呼叫它，否則瀏覽器可能會擋下新分頁，呼叫也會丟出錯誤。

### Promise 與回呼 {#promises-and-callbacks}

`me`、`broadcast`、各個輔助方法和 `revokeToken` 都會傳回 Promise。若想改用回呼，請把一個函式當作最後一個引數傳入。它會收到 `(error, result)`。

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

當 API 以錯誤作答時，Promise 會以 API 的錯誤內文 `{ error, error_description }` 被拒絕。使用回呼時，那個內文就是 `error` 引數。當回答不是 JSON 時，Promise 會以解析錯誤被拒絕。

## Python {#python}

以下函式庫來自社群。維護它們的是各自的作者，而不是 Hivesigner 團隊。在依賴它們之前，請對照 [REST API](/docs/api) 查證。

| 函式庫 | 作者 |
| --- | --- |
| hivesigner-python-client：https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem，`beem.hivesigner` 模組：https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
