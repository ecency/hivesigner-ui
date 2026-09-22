Hive 文章透過網址指向圖片，所以應用程式需要一個放圖片的地方。imagehoster 是為 Hive 打造的開放原始碼圖片主機程式。它可以接受那些用 Hivesigner 登入你應用程式的人上傳的圖片：他們的存取權杖代替了用金鑰做出的簽章。

## 運作方式 {#how-it-works}

1. 使用者用 Hivesigner 登入你的應用程式，並給予發文權限。你的應用程式收到一個存取權杖。參見[用 OAuth2 登入](/docs/oauth2)。
2. 你的應用程式把圖片送到你的 imagehoster，並把那個權杖放在網址裡。
3. imagehoster 檢查權杖和帳號，存下圖片，並以圖片的網址作答。
4. 你的應用程式把網址放進文章裡。

## 自己架 imagehoster {#run-your-own}

一個 imagehoster 只為一個應用程式帳號設定：設定檔 `[upload_limits]` 段落中的 `app_account`。請只送給它為那個應用程式帳號產生的權杖。公開的站台屬於別的應用程式：images.ecency.com 是為 Ecency 的應用程式帳號設定的，images.hive.blog 則是 Hive.blog 的。若要接受你自己使用者的上傳，請用你的應用程式帳號架設你自己的站台。

原始碼和架設指南：

- Hive 社群的 imagehoster：https://gitlab.syncad.com/hive/imagehoster
- Ecency 的 imagehoster：https://github.com/ecency/imagehoster

在設定檔中設定你的應用程式帳號：

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

同一個段落也設定帳號上傳所需的最低聲望（`reputation`），以及每個帳號的上傳額度（每 `duration` 毫秒 `max` 次上傳）。請設定 `redis_url`，額度才會生效。`max_image_size` 則設定最大的檔案大小，以位元組計。

## 上傳圖片 {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **權杖。** 把使用者的存取權杖，依 Hivesigner 交給你應用程式時的原樣放進路徑。請使用為你的應用程式、帶發文權限登入所得到的權杖。來自沒有 `client_id` 的請求的純登入權杖沒有寫明任何應用程式，會被拒絕。
- **內文。** 送出 `multipart/form-data`，其中含有一個圖片檔。不論欄位名稱是什麼，imagehoster 都取第一個檔案。
- **大小。** 請送出 `Content-Length` 標頭。檔案不得大於該站台的 `max_image_size`。

回答是 JSON。成功時它會帶著圖片的網址：

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

失敗時，imagehoster 會以 HTTP 錯誤狀態碼作答。多數失敗還會帶著一個錯誤名稱：

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **備註：** 權杖是在網址中傳送的。請只透過 https 提供你的 imagehoster，並妥善保管它的存取日誌。

## 例子 {#example}

下面這個瀏覽器函式會從檔案輸入欄位或拖放動作上傳一個檔案。multipart 的標頭和長度由瀏覽器替你設定：不要自己設定 `Content-Type`。

```js
// IMAGEHOSTER_URL is the address of your imagehoster, such as 'https://YOUR_IMAGEHOSTER'.
async function uploadImage(file, accessToken) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${IMAGEHOSTER_URL}/hs/${accessToken}`, {
    method: 'POST',
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.name ?? `Upload failed with status ${response.status}`);
  }
  return result.url;
}

const url = await uploadImage(input.files[0], ACCESS_TOKEN);
const markdown = `![](${url})`; // add this to the post body
```
