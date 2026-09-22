Hivesigner の API は `https://hivesigner.com/api/` にあります。ログイン中の利用者のアカウントを返し、その利用者に代わって投稿系の操作をブロードキャストし、コードをトークンと交換し、Hivesigner を使っているアプリの一覧を返します。このページでは各エンドポイントを、リクエスト、応答、エラーとともに説明します。

## リクエストと認証 {#authentication}

- **ベース URL:** `https://hivesigner.com/api/`。以下の各エンドポイントは `https://hivesigner.com` からの相対です。
- **トークン:** `Authorization` ヘッダーにそのまま入れて送ります。`Authorization: ACCESS_TOKEN` です。`Bearer ` を前に付けても受け付けます。クエリ文字列や本体に `access_token` として送ることもできますが、ヘッダーなら URL やログに残りません。
- **本体:** `Content-Type: application/json` を付けた JSON、またはフォーム（`application/x-www-form-urlencoded`）です。
- **応答:** JSON です。
- **ブラウザー:** API はクロスオリジンのリクエストを許可しているので、ウェブアプリから直接呼べます。

トークンの取得は [OAuth2 でのログイン](/docs/oauth2)を、トークンの中身は[トークン](/docs/tokens)を参照してください。

## エラー {#errors}

エラーの応答は、HTTP のエラーステータスと次の本体を持ちます。

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| ステータス | `error` | どんなとき |
| --- | --- | --- |
| 401 | `invalid_grant` | トークンがない、有効でない、またはこのエンドポイントには種類が合わない（「The token has invalid role」）。`/api/oauth2/token` では「The code or secret is not valid」もあります。 |
| 401 | `invalid_scope` | `/api/broadcast`: トークンが許していない操作です。説明にその操作名が入ります。 |
| 401 | `unauthorized_client` | `/api/broadcast`: 作成者がトークンの利用者でない操作、鍵に触れる `account_update2`、投稿権限の許可がない、またはアカウントを読み込めなかった場合です。どれなのかは説明に出ます。 |
| 500 | `server_error` | `/api/broadcast`: Hive ネットワークがトランザクションを拒否しました。`error_description` にネットワークからのメッセージが入ります。 |
| 503 | `unavailable` | `/api/apps`: 一覧をまだ作成中です。 |

## GET /api/me {#me}

トークンが対象とするアカウントを返します。誰がログインしたかを知るときや、[トークンを確認する](/docs/tokens#check-with-the-api)ときに使います。

- **メソッド:** `GET` または `POST`。
- **トークン:** アクセストークン。アプリ名の入った `login` トークンも含みます。

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

応答（抜粋）:

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

| フィールド | 意味 |
| --- | --- |
| `user` | トークンが対象とする Hive のユーザー名。`_id` と `name` も同じ値です。 |
| `account` | アカウント全体。Hive の `condenser_api.get_accounts` が返す形そのままです。 |
| `scope` | トークンが許すもの。ログイン用トークンでは `["login"]`、それ以外は `/api/broadcast` が受け付ける操作です。 |
| `user_metadata` | アカウントのプロフィールのメタデータ。JSON から読み取ったものです。 |

`/api/me` は、そのトークンがどのアプリ向けに作られたかを示しません。それを確かめるにはトークンを復号してください。[API に尋ねる](/docs/tokens#check-with-the-api)を参照してください。

## POST /api/broadcast {#broadcast}

トークンの利用者の投稿系の操作を @hivesigner の投稿キーで署名し、Hive へブロードキャストします。

- **メソッド:** `POST`。
- **トークン:** `posting` のアクセストークン。トークンフローでもコードフローでもかまいません。
- **動作の前提:** 利用者があなたのアプリアカウントに投稿権限を与えていること（同意画面が行います）と、あなたのアプリアカウントが [@hivesigner に投稿権限を与えている](/docs/register-app#grant-hivesigner)ことです。
- **本体:** `{ "operations": [...] }`。各操作は Hive のブロックチェーンと同じく `[name, fields]` の形です。一つのリクエストのすべての操作が一つのトランザクションに入ります。

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

curl での同じリクエスト:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

フォローは `custom_json` の操作です。

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

Hive のノードがトランザクションを受け付けた時点で API が応答します。`result.id` がトランザクション ID です。

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

ネットワークがトランザクションを拒否した場合、応答は `server_error` とともに `500` になります。`error_description` にネットワークのメッセージ、`response` に生のエラーが入ります。

### broadcast が受け付けるもの {#broadcast-rules}

投稿トークンで API がブロードキャストできるのは次の操作だけです。いずれの場合も、トークンの利用者が示されたフィールドのアカウントでなければなりません。

| 操作 | トークンの利用者が入る場所 |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | `required_posting_auths` の最初のアカウント |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **それ以外の操作**は `invalid_scope` で拒否されます。`login` トークンではどの操作も許されません。
- **他のアカウントのための操作**は `unauthorized_client` で拒否されます。トークンは自分の利用者のためにしかブロードキャストしません。
- **`account_update2`** で変更できるのはアカウントのメタデータだけです。`owner`、`active`、`posting` のフィールドを含む操作は `unauthorized_client` で拒否されます。
- **`custom_json`**: `required_auths` は空にしてください。API は投稿権限で署名するため、アクティブ権限が必要な操作はネットワークで失敗します。

送金などウォレットの操作には利用者のアクティブキーが必要です。それらは[署名リンク](/docs/sign-links)として送ってください。

## POST /api/oauth2/token {#oauth2-token}

コードをトークンと、または更新トークンを新しいトークンと交換します。サーバーからのみ呼んでください。[コードフロー](/docs/oauth2#code-flow)を参照してください。

- **メソッド:** `POST`。値は本体に入れます。
- **本体:** `code` と `client_secret`、または `refresh_token` と `client_secret`。
- **ヘッダー:** `Authorization` ヘッダーは付けないでください。

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

呼び出しごとに新しいアクセストークンと新しい更新トークンが返ります。どちらも @hivesigner が署名しています。`expires_in` はアクセストークンの有効期間で、秒単位です（7 日）。

エラー: `401 invalid_grant`。送った値が有効なコードでも更新トークンでもない場合、説明は「The token has invalid role」になります。コードやシークレットが合わない場合は「The code or secret is not valid」になります。

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

利用者があなたのアプリからログアウトしたことを Hivesigner に伝えます。トークンはあなたのアプリ側で捨てます。

- **メソッド:** `POST`。
- **トークン:** アクセストークンを `Authorization` ヘッダーに入れます。

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

JavaScript SDK の `revokeToken()` はこの呼び出しを行ってからトークンを忘れます。アプリのアクセスを完全に取り消すには、利用者が https://hivesigner.com/authorized-apps で取り消します。[ログアウトとアクセスの取り消し](/docs/tokens#sign-out)を参照してください。

## GET /api/apps {#apps}

公開されているアプリ一覧です。Hivesigner 経由でブロードキャストしているアプリを、利用者の多い順に並べたものです。トークンは不要です。https://hivesigner.com/apps も同じ一覧を表示します。

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

| フィールド | 意味 |
| --- | --- |
| `updated_at` | 一覧が最後に作られた時刻です。 |
| `building` | 最初の作成にデータが入るまで `true` です。そのあいだ `apps` は空です。 |
| `window_days` | 順位付けが対象とする日数です。 |
| `featured` | 先頭に表示されるユーザー名を、その順序で並べたものです。 |
| `apps[].username` | アプリのアカウントです。 |
| `apps[].name`, `about` | アプリアカウントのプロフィールから取ります。ない場合は `null` です。 |
| `apps[].website` | プロフィールのウェブサイト。自分のドメインで応答した場合に入ります。そうでなければ `null` です。 |
| `apps[].site` | ウェブサイト確認の結果です。`ok`、`no_website`、`invalid`、`redirected`、`blocked`、`unreachable` のいずれかです。`redirected` の項目には `redirects_to` も付きます。 |
| `apps[].users` | 日ごとの重複しない利用者数を、期間全体で合計したものです。 |
| `apps[].requests` | その期間にそのアプリのために行われた成功した API リクエストの数です。 |
| `apps[].first_seen`, `last_seen` | Hivesigner がそのアプリを記録した最初の日と、最後に使われた日です。ない場合は `null` です。 |
| `apps[].new` | そのアプリが期間内に初めて現れた場合に `true` になります。 |

応答は最大 5 分間キャッシュされることがあります。一覧が初めて作られる前は、API が `unavailable` とともに `503` を返します。あとでもう一度お試しください。

名前と説明は各アプリアカウント自身が公開しているものです。Hivesigner はそのいずれも検証しません。
