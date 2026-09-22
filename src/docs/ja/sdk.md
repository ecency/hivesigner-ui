公式の JavaScript SDK は、ログイン URL と署名リンクを組み立て、Hivesigner の API をあなたの代わりに呼びます。Python にはコミュニティのライブラリーがあります。他の言語からは [REST API](/docs/api) を直接呼べます。

## JavaScript SDK {#javascript}

SDK は npm パッケージの `hivesigner` です。ソースは https://github.com/ecency/hivesigner-sdk にあります。TypeScript で書かれており、型定義も同梱されています。

バージョン 4 は組み込みの `fetch` を使うため Node.js 18 以降が必要です。ブラウザーでは ES2017 以降が必要です。グローバルの `fetch` がない環境では、SDK を使う前に polyfill を追加してください。それより古い Node.js ではバージョン 3 のままにしてください。

### インストール {#install}

```bash
npm install hivesigner
```

ビルド工程のないページでは、ブラウザー向けのバンドルを読み込みます。グローバルの `hivesigner` が定義されます。

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### クライアントを作る {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| オプション | 意味 |
| --- | --- |
| `app` | あなたのアプリアカウント。`client_id` として送られます。 |
| `callbackURL` | Hivesigner が利用者を戻す先です。あなたのアプリのコールバックのいずれかと一字一句一致する必要があります（素の http のループバックのコールバックはホストとポートが違ってもかまいません。[コールバック](/docs/register-app#callback-rules)を参照）。 |
| `scope` | 配列です。カンマでつないで `scope` パラメーターになります。[スコープ](/docs/oauth2#scopes)を参照してください。 |
| `responseType` | コードフローでは `'code'` にします。トークンフローでは省きます。 |
| `accessToken` | すでに持っている場合の、利用者のアクセストークンです。 |
| `apiURL` | API のオリジンです。SDK がそれに `/api/` を足します。既定値は `https://hivesigner.com` です。 |

`setApp`、`setCallbackURL`、`setScope`、`setAccessToken`、`removeAccessToken`、`setApiURL` であとから変更できます。いずれもクライアントを返します。

### 利用者をログインさせる {#sign-in}

`getLoginURL(state, account)` はログイン URL を返します。

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` はそのままコールバックへ戻ります。応答をリクエストに結び付けるために使ってください。
- `account` は任意で、ユーザー名です。そのアカウントが端末にあるとき Hivesigner はそれを選び、ないときは無視します。

ブラウザーでは `client.login({ state: 'STATE' })` が、アカウントを指定せずに同じ URL へ利用者を送ります。

トークンフローでは、コールバックが `access_token`、`expires_in`、`username` を受け取ります。トークンをクライアントに渡してください。

```js
client.setAccessToken('ACCESS_TOKEN');
```

コードフローの交換用のメソッドは SDK にありません。[コードを交換する](/docs/oauth2#exchange-code)が示すとおり、サーバーが自分でコードとクライアントシークレットを API へ送ります。

### 利用者を取得する {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` はチェーンが返す形の、その利用者の Hive アカウントです。`scope` はトークンが許すものを示します。

### ブロードキャスト {#broadcast}

`broadcast(operations)` は操作を API へ送り、API が利用者に代わってブロードキャストします。API が受け付けるのは、トークンの利用者が作成した投稿系の操作だけです。`vote`、`comment`、`delete_comment`、`comment_options`、投稿権限の `custom_json`、`claim_reward_balance`、プロフィールのメタデータのための `account_update2` です。[broadcast が受け付けるもの](/docs/api#broadcast-rules)を参照してください。

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

どの操作にも利用者名を入れてください。API は `__signer` を置き換えません。

次の補助メソッドは、それぞれ一つの操作を組み立てて `broadcast` を呼びます。

| メソッド | ブロードキャストする内容 |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`。`weight` は `-10000` から `10000`（100%）までです。 |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`。新しい記事では `parentAuthor` は `''` です。`jsonMetadata` はオブジェクトでもよく、SDK が文字列に変換します。 |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`。`requiredAuths` に `[]`、`requiredPostingAuths` に `['USERNAME']` を渡します。`json` は文字列です。 |
| `reblog(account, author, permlink)` | id が `follow` の `custom_json`。記事を再共有します |
| `follow(follower, following)` | id が `follow` の `custom_json`、`what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | id が `follow` の `custom_json`、`what: []` |
| `ignore(follower, following)` | id が `follow` の `custom_json`、`what: ['ignore']`（ミュート） |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`。金額は `'0.000 HIVE'`、`'0.000 HBD'`、`'1.000000 VESTS'` のような文字列です。 |

`updateUserMetadata()` は非推奨です。利用者のプロフィールを変更するには、新しい `posting_json_metadata` を付けて `account_update2` をブロードキャストしてください。

### ログアウト {#log-out}

`revokeToken()` が SDK のログアウトの呼び出しです。トークンを API の取り消しエンドポイントへ送り、そのあとクライアントから取り除きます。呼び出しが失敗した場合は、自分で `removeAccessToken()` を呼んでください。アプリが保存している場所からもトークンを消してください。

アプリのアクセスを完全に終わらせるには、利用者が https://hivesigner.com/authorized-apps で取り消します。[アプリのアクセスを見て取り消す](/docs/signing-in#remove-access)を参照してください。

### 署名リンク {#sign-links}

`sendOperation(op, params)`、`sendOperations(ops, params)`、`sendTransaction(tx, params)` は `https://hivesigner.com/sign/...` のリンクを返します。`params` は `callback`、`no_broadcast`、`signer` を取ります。[署名リンク](/docs/sign-links)を参照してください。

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

TypeScript では型が第三引数を必須にしています。リンクを受け取るには `undefined` を渡してください。

ブラウザーで第三引数に関数を渡すと、リンクを新しいタブで開きます。その関数は呼ばれず、戻り値もありません。クリックのハンドラーから呼んでください。そうしないとブラウザーが新しいタブを止め、呼び出しがエラーになることがあります。

### Promise とコールバック {#promises-and-callbacks}

`me`、`broadcast`、補助メソッド、`revokeToken` は Promise を返します。最後の引数に関数を渡すと、代わりにコールバックを使えます。その関数は `(error, result)` を受け取ります。

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

API がエラーを返した場合、Promise は API のエラー本体 `{ error, error_description }` で reject されます。コールバックを使う場合、その本体が `error` 引数になります。応答が JSON でない場合は、解析のエラーで reject されます。

## Python {#python}

次のライブラリーはコミュニティのものです。Hivesigner チームではなく、それぞれの作者が保守しています。頼る前に [REST API](/docs/api) と照らし合わせてください。

| ライブラリー | 作者 |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem のモジュール `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
