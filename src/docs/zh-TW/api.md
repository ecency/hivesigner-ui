Hivesigner API 位於 `https://hivesigner.com/api/`。它會傳回已登入使用者的帳號、替他們廣播發文類的操作、把授權碼兌換成權杖，並列出使用 Hivesigner 的應用程式。這一頁說明每個端點的請求、回答和錯誤。

## 請求與驗證 {#authentication}

- **基底網址：** `https://hivesigner.com/api/`。下面每個端點都相對於 `https://hivesigner.com`。
- **權杖：** 原樣放在 `Authorization` 標頭送出：`Authorization: ACCESS_TOKEN`。也接受 `Bearer ` 前綴。你也可以把它當作 `access_token` 放在查詢字串或內文裡，但放在標頭能讓它不進入網址和日誌。
- **內文：** 帶 `Content-Type: application/json` 的 JSON，或表單（`application/x-www-form-urlencoded`）。
- **回答：** JSON。
- **瀏覽器：** API 允許跨來源請求，網頁應用程式可以直接呼叫。

要取得權杖，參見[用 OAuth2 登入](/docs/oauth2)。關於權杖包含什麼，參見[權杖](/docs/tokens)。

## 錯誤 {#errors}

錯誤回答帶有 HTTP 錯誤狀態碼和這樣的內文：

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| 狀態碼 | `error` | 何時出現 |
| --- | --- | --- |
| 401 | `invalid_grant` | 缺少權杖或權杖無效，或它對這個端點來說種類不對（「The token has invalid role」）。在 `/api/oauth2/token` 上還有「The code or secret is not valid」。 |
| 401 | `invalid_scope` | `/api/broadcast`：權杖不允許的操作。說明中會指出是哪些操作。 |
| 401 | `unauthorized_client` | `/api/broadcast`：作者不是權杖所屬使用者的操作、動到金鑰的 `account_update2`、缺少發文權限授權，或帳號無法載入。說明會指出是哪一種。 |
| 500 | `server_error` | `/api/broadcast`：Hive 網路拒絕了這筆交易。`error_description` 帶著網路傳回的訊息。 |
| 503 | `unavailable` | `/api/apps`：目錄還在建立中。 |

## GET /api/me {#me}

傳回權杖所屬的帳號。用它來得知是誰登入，或用來[檢查權杖](/docs/tokens#check-with-the-api)。

- **方法：** `GET` 或 `POST`。
- **權杖：** 存取權杖，包括寫明了應用程式的 `login` 權杖。

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

刪節後的回答：

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| 欄位 | 意義 |
| --- | --- |
| `user` | 權杖所屬的 Hive 使用者名稱。`_id` 和 `name` 與它相同。 |
| `account` | 完整的帳號，與 Hive 的 `condenser_api.get_accounts` 傳回的一樣。 |
| `scope` | 權杖允許什麼：登入權杖為 `["login"]`，否則是 `/api/broadcast` 接受的操作。 |
| `user_metadata` | 帳號的個人檔案中繼資料，已從 JSON 解析。 |

`/api/me` 不會指出權杖是為哪個應用程式產生的。要檢查這一點，請解碼權杖：參見[問 API](/docs/tokens#check-with-the-api)。

## POST /api/broadcast {#broadcast}

用 @hivesigner 的發文金鑰替權杖所屬使用者簽署發文類的操作，並把它們廣播到 Hive。

- **方法：** `POST`。
- **權杖：** 來自權杖流程或授權碼流程的 `posting` 存取權杖。
- **前提條件：** 使用者已把發文權限授予你的應用程式帳號（授權畫面會完成這一步），而且你的應用程式帳號已[把發文權限授予 @hivesigner](/docs/register-app#grant-hivesigner)。
- **內文：** `{ "operations": [...] }`，其中每個操作都是 Hive 區塊鏈上的 `[name, fields]` 形式。同一個請求中的所有操作會合成一筆交易。

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

同樣的請求用 curl 送出：

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

追蹤是一個 `custom_json` 操作：

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

只要有 Hive 節點接受了交易，API 就會回答。`result.id` 是交易 ID：

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

當網路拒絕這筆交易時，回答是 `500` 和 `server_error`。它的 `error_description` 帶著網路傳回的訊息，`response` 帶著原始錯誤。

### broadcast 接受哪些操作 {#broadcast-rules}

發文權杖只允許 API 廣播以下這些操作，其他一概不行。在每個操作中，權杖所屬使用者必須是所示欄位中的帳號：

| 操作 | 權杖所屬使用者必須是 |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | `required_posting_auths` 中的第一個帳號 |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **其他任何操作**都會以 `invalid_scope` 被拒絕。`login` 權杖不允許任何操作。
- **替別的帳號執行的操作**會以 `unauthorized_client` 被拒絕。權杖只會替它自己的使用者廣播。
- **`account_update2`** 只能更改帳號的中繼資料。帶有 `owner`、`active` 或 `posting` 欄位的操作會以 `unauthorized_client` 被拒絕。
- **`custom_json`**：請把 `required_auths` 留空。API 以發文權限簽署，所以需要活躍權限的操作會在網路上失敗。

轉帳和其他錢包操作需要使用者的活躍金鑰。請改以[簽署連結](/docs/sign-links)送出。

## POST /api/oauth2/token {#oauth2-token}

把授權碼兌換成權杖，或把更新權杖兌換成新的權杖。只能從你的伺服器呼叫。參見[授權碼流程](/docs/oauth2#code-flow)。

- **方法：** `POST`，各個值放在內文裡。
- **內文：** `code` 和 `client_secret`，或 `refresh_token` 和 `client_secret`。
- **標頭：** 不要送出 `Authorization` 標頭。

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

每次呼叫都會傳回一個新的存取權杖和一個新的更新權杖。兩者都由 @hivesigner 簽署。`expires_in` 是存取權杖的可用時間，以秒計（7 天）。

錯誤：`401 invalid_grant`。當送上的值不是有效的授權碼或更新權杖時，說明是「The token has invalid role」。當授權碼或密鑰不相符時，說明是「The code or secret is not valid」。

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

告訴 Hivesigner 使用者已登出你的應用程式。權杖本身由你的應用程式自己丟掉。

- **方法：** `POST`。
- **權杖：** 存取權杖，放在 `Authorization` 標頭中。

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

JavaScript SDK 的 `revokeToken()` 會發出這個呼叫，然後忘掉權杖。若要徹底移除你應用程式的存取權，需由使用者在 https://hivesigner.com/authorized-apps 自行移除。參見[登出與移除存取權](/docs/tokens#sign-out)。

## GET /api/apps {#apps}

公開的應用程式目錄：透過 Hivesigner 廣播的應用程式，依使用人數排序。它不需要權杖。https://hivesigner.com/apps 顯示同一份清單。

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| 欄位 | 意義 |
| --- | --- |
| `updated_at` | 目錄最後一次建立的時間。 |
| `building` | 在第一次建立取得資料之前為 `true`。那時 `apps` 是空的。 |
| `window_days` | 排名涵蓋的天數。 |
| `featured` | 優先顯示的使用者名稱，依該順序排列。 |
| `apps[].username` | 應用程式帳號。 |
| `apps[].name`、`about` | 取自應用程式帳號的個人檔案，或為 `null`。 |
| `apps[].website` | 個人檔案中的網站，前提是它在自己的網域上有回應。否則為 `null`。 |
| `apps[].site` | 網站檢查的結果：`ok`、`no_website`、`invalid`、`redirected`、`blocked` 或 `unreachable`。`redirected` 的項目還會有 `redirects_to`。 |
| `apps[].users` | 每日不重複使用者數，在這段期間內累加。 |
| `apps[].requests` | 這段期間內為該應用程式發出的成功 API 請求數。 |
| `apps[].first_seen`、`last_seen` | Hivesigner 記錄到該應用程式的第一天，以及它最後被使用的一天，或為 `null`。 |
| `apps[].new` | 當應用程式在這段期間內第一次出現時為 `true`。 |

回答最多可能被快取 5 分鐘。在目錄第一次建立之前，API 會回答 `503` 和 `unavailable`。請稍後再試。

名稱和說明由各個應用程式帳號自己發布。Hivesigner 不會查證它們。
