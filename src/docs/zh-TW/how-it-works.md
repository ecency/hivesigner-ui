Hivesigner 讓人們在你的應用程式中使用自己的 Hive 帳號，而不必把金鑰交給你的應用程式。它有兩個部分：https://hivesigner.com 上的瀏覽器簽署器，以及 `https://hivesigner.com/api/` 上的 API。這一頁說明每個部分做什麼，以及應用程式使用它們的兩種方式。

## 瀏覽器簽署器 {#browser-signer}

瀏覽器簽署器就是 Hivesigner 網站。人們把自己的 Hive 帳號加進去。金鑰留在他們自己的瀏覽器裡：Hivesigner 不會把金鑰送到任何伺服器。你的應用程式永遠看不到金鑰。

簽署器會簽署三種東西，而且每一次使用者都會先看到自己簽的是什麼：

- **登入權杖。** 你的應用程式把人送到 Hivesigner 去登入。Hivesigner 顯示你應用程式的名稱和它要求的內容。使用者核准後，Hivesigner 用他們的金鑰簽署一段簡短聲明，其中寫明他們的帳號和你的應用程式。這段簽署過的聲明就是你的應用程式收到的權杖。參見[用 OAuth2 登入](/docs/oauth2)和[權杖](/docs/tokens)。
- **交易。** 簽署連結會打開一筆交易供人查看。使用者核准後，Hivesigner 用它需要的金鑰簽署它。除非連結只索取簽章，否則接著會從瀏覽器把交易送到 Hive 網路。參見[簽署連結](/docs/sign-links)。
- **訊息。** 你的應用程式可以請使用者用金鑰簽署一段文字，藉此證明他們掌控該帳號。參見[訊息簽署](/docs/message-signing)。

## API {#api}

API 為已登入你應用程式的使用者廣播發文層級的操作：文章和留言、投票、追蹤和其他 `custom_json` 操作、領取獎勵以及更新個人檔案。你的應用程式把操作連同使用者的權杖一起送出。API 檢查權杖，用 @hivesigner 帳號的發文金鑰簽署交易，然後把它廣播到 Hive。

API 也會傳回已登入使用者的帳號、把授權碼換成權杖，並列出使用 Hivesigner 的應用程式。參見 [REST API](/docs/api)。

## 發文權限鏈 {#authority-chain}

在 Hive 上，一個帳號可以允許另一個帳號以它的發文權限行事。API 依靠其中兩項授權：

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **使用者把你的應用程式帳號加入自己的發文權限。** 使用者第一次為你的應用程式核准發文權限時，授權畫面會完成這一步。它需要使用者的活躍金鑰一次。
2. **你的應用程式帳號把 @hivesigner 加入它自己的發文權限。** 這一步你只在[註冊應用程式](/docs/register-app#grant-hivesigner)時做一次。

廣播之前，API 會檢查這兩項授權都還在。它只廣播由權杖所指使用者撰寫的操作。

使用者隨時可以在 https://hivesigner.com/authorized-apps 移除你應用程式的存取權。之後 API 就無法再透過你的應用程式替他們發文。

## 兩種整合方式 {#two-ways-to-integrate}

### 先登入，再透過 API 廣播 {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

使用者只核准一次。之後你的應用程式可以替他們投票、留言和發文而不必再問，直到權杖過期或使用者移除你應用程式的存取權。日常的社群操作適合用這種方式。

你需要一個應用程式帳號，並註冊好回呼網址和 @hivesigner 授權。參見[註冊應用程式](/docs/register-app)。如果你只想知道使用者是誰，參見[不需發文權限的登入](/docs/login-only)。

### 簽署連結 {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

使用者在交易被簽署之前會看到每一筆交易。簽署連結涵蓋 41 種 Hive 操作，包括轉帳和其他需要活躍金鑰的錢包操作。API 從不處理那些操作。簽署連結不需要應用程式帳號。參見[簽署連結](/docs/sign-links)。

### 該選哪一種 {#which-to-choose}

- **頻繁的發文操作**（投票、留言、追蹤）：用 OAuth2 登入，然後呼叫 API。
- **錢包操作**，或任何需要活躍金鑰的操作：使用簽署連結。
- **兩者都用**：許多應用程式用 OAuth2 為人們登入以提供社群功能，並用簽署連結處理轉帳。
- **只要使用者的身分**：參見[不需發文權限的登入](/docs/login-only)。

## 原始碼 {#source-code}

Hivesigner 是開放原始碼的：

- 瀏覽器簽署器：https://github.com/ecency/hivesigner-ui
- API：https://github.com/ecency/hivesigner-api
- JavaScript SDK（npm 套件 `hivesigner`）：https://github.com/ecency/hivesigner-sdk。參見 [SDK](/docs/sdk)。
