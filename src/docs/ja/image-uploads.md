Hive の記事は画像を URL で指し示すため、アプリには画像をアップロードする場所が必要です。imagehoster は Hive 向けに作られたオープンソースの画像ホスティングです。Hivesigner であなたのアプリにログインした利用者からのアップロードを受け付けられます。利用者のアクセストークンが、鍵による署名の代わりになります。

## 仕組み {#how-it-works}

1. 利用者が投稿アクセス付きで Hivesigner からあなたのアプリにログインします。あなたのアプリはアクセストークンを受け取ります。[OAuth2 でのログイン](/docs/oauth2)を参照してください。
2. あなたのアプリは、そのトークンを URL に入れて画像をあなたの imagehoster へ送ります。
3. imagehoster はトークンとアカウントを確認し、画像を保存し、その URL を返します。
4. あなたのアプリはその URL を記事に入れます。

## 自分の imagehoster を動かす {#run-your-own}

imagehoster は一つのアプリアカウント用に設定します。設定の `[upload_limits]` にある `app_account` です。そのアプリアカウント向けに作られたトークンを送ってください。公開インスタンスは他のアプリのものです。images.ecency.com は Ecency のアプリアカウント用、images.hive.blog は Hive.blog 用に設定されています。自分の利用者からのアップロードを受け付けるには、自分のアプリアカウントで自分のインスタンスを動かしてください。

ソースコードと導入手順:

- Hive コミュニティの imagehoster: https://gitlab.syncad.com/hive/imagehoster
- Ecency の imagehoster: https://github.com/ecency/imagehoster

設定にあなたのアプリアカウントを書きます。

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

同じ節では、アップロードに必要な最低評価値（`reputation`）と、アカウントごとのアップロード上限（`duration` ミリ秒あたり `max` 回）も決めます。上限を実際に適用するには `redis_url` を設定してください。`max_image_size` は最大のファイルサイズをバイトで決めます。

## 画像をアップロードする {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **トークン。** 利用者のアクセストークンを、Hivesigner があなたのアプリに渡したそのままの形でパスに入れます。あなたのアプリ向けに投稿アクセスでログインして得たトークンを使ってください。`client_id` のないリクエストから得たログインだけのトークンは、どのアプリも示していないため拒否されます。
- **本体。** 画像ファイル一つを `multipart/form-data` で送ります。imagehoster はフィールド名に関わらず最初のファイルを取ります。
- **サイズ。** `Content-Length` ヘッダーを送ります。ファイルはそのインスタンスの `max_image_size` を超えてはいけません。

応答は JSON です。成功した場合は画像の URL が入っています。

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

失敗した場合、imagehoster は HTTP のエラーステータスで応答します。ほとんどの失敗にはエラー名も付きます。

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **注:** トークンは URL の中を通ります。imagehoster は https でのみ提供し、アクセスログは公開しないでください。

## 例 {#example}

次のブラウザー向け関数は、ファイル入力欄やドロップからファイルをアップロードします。マルチパートのヘッダーと長さはブラウザーが設定します。`Content-Type` を自分で設定しないでください。

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
