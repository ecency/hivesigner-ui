利用者をあなたのアプリにログインさせるために Hivesigner へ送ります。利用者はそこであなたのリクエストを確認して承認します。そのあと Hivesigner は、トークン（トークンフロー）か、サーバーがトークンと交換するコード（コードフロー）とともに利用者をあなたのコールバックへ戻します。このページでは両方のフロー、すべてのパラメーター、スコープを扱います。

## はじめる前に {#before-you-start}

- アプリを登録します。そのための Hive アカウントを作り、コールバックを登録します。[アプリを登録する](/docs/register-app)を参照してください。
- API でブロードキャストするなら、あなたのアプリアカウントが [@hivesigner に投稿権限を与える](/docs/register-app#grant-hivesigner)必要もあります。
- コードフローでは[クライアントシークレット](/docs/register-app#client-secret)を設定します。

## 承認 URL {#authorize-url}

利用者を次のアドレスへ送ります。

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

すべての値を URL 用に符号化してください。`URLSearchParams` が代わりに行ってくれます。

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

### パラメーター {#parameters}

| パラメーター | 必須 | 役割 |
| --- | --- | --- |
| `client_id` | アプリの場合は必須 | あなたのアプリアカウントの名前です。`clientId` も読まれます。これがない場合、そのリクエストはアプリアカウントのないサイトからのログインだけのリクエストになります。[投稿アクセスなしのログイン](/docs/login-only)を参照してください。 |
| `redirect_uri` | 必須 | Hivesigner が利用者を戻す先です。あなたのアプリのリダイレクト URI のいずれかと完全に一致する必要があります。[コールバック](/docs/register-app#callbacks)を参照してください。 |
| `scope` | 任意 | `login`、`posting`、`offline` のいずれかです。[スコープ](#scopes)を参照してください。指定しない場合、リクエストは投稿アクセスを求めます。 |
| `response_type` | 任意 | `code` は[コードフロー](#code-flow)を開始します。他の値、または指定なしは[トークンフロー](#token-flow)を意味します。 |
| `state` | 推奨 | Hivesigner がそのまま返すランダムな値です。[state でリクエストを守る](#state)を参照してください。 |
| `account` | 任意 | Hive のユーザー名です。そのアカウントが利用者の端末にある場合、Hivesigner はそれを選びます。ない場合は無視します。`select_account` も読まれます。 |

利用者は同意画面で別のアカウントに切り替えられます。アカウントはつねにトークンかコードの交換から取得してください。あなたが要求した値から取ってはいけません。

## スコープ {#scopes}

Hive の投稿権限は一つだけです。そのため Hivesigner のアクセスは、ログインだけと投稿の二段階で、その間に細かい段階はありません。

| `scope` | 利用者が承認する内容 | フロー | アクセストークンの `type` |
| --- | --- | --- | --- |
| `login` | 「アカウントのユーザー名の参照」。何も付与されません。 | トークンフロー（`response_type=code` を付けないでください） | `login` |
| `posting` | 投稿アクセス。初回は、あなたのアプリアカウントを利用者の投稿権限に追加します。 | トークンフロー、または `response_type=code` を付けたコードフロー | `posting` |
| `offline` | 投稿アクセス（上と同じ） | コードフロー | `posting`（`refresh` トークン付き） |

コードフローでは、コールバックがまずコード（`type` が `code` のトークン）を受け取り、サーバーがそれをアクセストークンと交換します。

- **スコープなし**は `posting` を意味します。
- **どこかに `offline` を含む値**は `offline` を意味します。たとえば古い `offline,vote,comment` です。
- **それ以外の値**は `posting` を意味します。`vote`、`comment`、`vote,comment`、`comment_options`、`custom_json` のような古い操作名も含みます。これらがトークンを制限することはありません。どの投稿トークンでも同じ操作が許されます。[broadcast が受け付けるもの](/docs/api#broadcast-rules)を参照してください。

利用者が誰かを知るだけでよいなら `login` を求めてください。[投稿アクセスなしのログイン](/docs/login-only)を参照してください。

## トークンフロー {#token-flow}

利用者のブラウザーがアクセストークンを直接受け取ります。あなたのアプリにシークレットは要りません。

1. 利用者を承認 URL へ送ります。

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. 利用者が承認します。Hivesigner はあなたのコールバックへリダイレクトします。

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   コールバックにクエリがない場合 Hivesigner は `?` で、ある場合は `&` で自分のパラメーターを足します。`state` は、空でない値を送ったときにだけ付きます。

3. コールバックでは、まず [`state` を照合します](#state)。そのあとサーバーで[トークンを確認します](/docs/tokens#check-a-token)。対象のアカウントはトークンの中にあります。URL は誰でも書き換えられるので、`username` パラメーターだけに頼らないでください。
4. トークンはサーバーか httpOnly のクッキーに保管します。トークンがアドレス欄から消えるよう、きれいな URL へリダイレクトしてください。
5. `expires_in` 秒（7 日）で期限が切れるまで、トークンを [API](/docs/api) で使います。期限が切れたら利用者をもう一度承認 URL へ送ります。すでに投稿アクセスを与えている人には「APP にログイン」と「@myapp はすでに承認済みです。新たな権限は付与されません。」が表示されます。

## コードフロー {#code-flow}

サーバーがコードを受け取り、アクセストークンと更新トークンに交換します。そのあとは利用者なしで更新できます。サーバーが長期にわたって利用者のために動く場合に使ってください。

1. 利用者を `scope=offline` を付けて承認 URL へ送ります。

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` でも同じです。

2. 利用者が投稿アクセスを承認します。Hivesigner はあなたのコールバックへリダイレクトします。

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [`state` を照合します](#state)。そのあとサーバーからすぐにコードを交換します。

### コードを交換する {#exchange-code}

コードとクライアントシークレットを POST リクエストの本体に入れて `/api/oauth2/token` へ送ります。

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

応答:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Node.js 18 以降での同じ呼び出し:

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

- コードとシークレットはリクエストの本体に入れてください。URL には決して入れません。
- このリクエストに `Authorization` ヘッダーを付けないでください。
- この応答の `username` を使ってください。利用者が署名したコードから得られたものです。
- アクセストークンと更新トークンはサーバーに保管してください。

### 更新 {#refresh}

アクセストークンの期限が切れたら、更新トークンをクライアントシークレットとともに同じエンドポイントへ送ります。

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

応答は同じ形で、新しいアクセストークンと新しい更新トークンが入っています。どちらも古いものと入れ替えて保管してください。

## state でリクエストを守る {#state}

`state` がないと、別のサイトが自分で選んだトークンやコードとともにあなたの利用者をコールバックへ送れてしまいます。そうなると、あなたのアプリは利用者を他人のアカウントにログインさせてしまいます。`state` は、戻ってくるたびにログインを始めたブラウザーと結び付けます。

1. ログインごとにランダムな値を作ります。少なくとも 16 バイトのランダム値にしてください。十六進にしておくと、符号化が必要な文字が入りません。
2. そのブラウザーだけが再提示できる場所に保存します。サーバーのセッション、または `SameSite=Lax` を付けた短命の httpOnly かつ Secure のクッキーです。
3. 承認 URL に `state` として送ります。
4. コールバックで `state` パラメーターを保存した値と照合します。欠けていたり違っていたりしたら、そこで止めてください。トークンもコードも使ってはいけません。
5. 保存した値を削除します。こうすれば一つの値は一度しか使えません。

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

Hivesigner は受け取ったものと同じ `state` の値を返します。空の値は返しません。

## 利用者に見えるもの {#what-the-user-sees}

同意画面には、アプリの画像と名前、「Hive アカウント @myapp」、「移動先：HOST」が表示されます。HOST はあなたのコールバックから取られます。続いて:

- **初回の投稿リクエスト。** 見出しは「APP があなたのアカウントへのアクセスを求めています。」です。**スコープ**のカードに、アプリができるようになることが並びます。お知らせとして「初回の承認：@myapp をオンチェーンであなたの投稿権限に追加するため、アクティブキーが一度だけ必要です。あなたが取り消すまで、そのアカウントはあなたとして投稿できるようになります。」と表示されます。ボタンは**承認**です。利用者の端末にそのアカウントのアクティブキーがない場合、画面はその場で入力を求めます。
- **ログイン。** `scope=login` の場合、またはすでに与えられた投稿アクセスの場合、見出しは「APP にログイン」、ボタンは**ログイン**です。
- **アカウント。** 「承認に使うアカウント」または「ログインするアカウント」と、選択中のアカウントが続きます。ここでアカウントを切り替えられます。
- **ロックされたアカウント。** ボタンの上にパスコードの欄が出ます。一度クリックすればロックが解けて先へ進みます。
- **端末にアカウントがない場合。** ボタンは**続行**です。アカウント追加の画面を開き、そのあとリクエストへ戻ります。

初回の投稿リクエストのあと、Hivesigner は新しい許可がチェーン上で見えるようになるまで待ってからリダイレクトします。数秒かかることがあります。利用者側から見た画面全体については、[アプリへのログイン](/docs/signing-in)を参照してください。

## 取り消しと拒否されたリクエスト {#cancel}

- **取り消し。** 利用者は Hivesigner のアカウント一覧へ移動します。あなたのコールバックには何も送られず、エラーのパラメーターもありません。利用者がやり直せるよう、ログインのボタンは出したままにしてください。戻りを待たないでください。
- **拒否されたリクエスト。** 登録されていないコールバック、知らない `client_id`、`redirect_uri` の欠落があると、Hivesigner はエラーと**この問題を報告**ボタンを表示します。あなたのコールバックには何も送られません。[何かがうまくいかないとき利用者に見えるもの](/docs/register-app#refused-requests)を参照してください。

## 旧来のログインリクエスト URL {#legacy-login-request}

Hivesigner は古いログイン URL も受け付けます。以前からの組み込みのために残されています。新しいものには `/oauth2/authorize` を使ってください。

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

同じ同意画面を開き、コールバックの確認もリダイレクトも同じです。ただしパラメーターの読み方が異なります。

- `scope` は `login` か `posting` です。他の値、または指定なしは `login` を意味します。
- `offline` は読まれません。コードフローには `response_type=code` を足してください。
- `account` は読まれません。

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` も同じ規則に従います。
