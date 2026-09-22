Hivesigner を使うと、アプリに鍵を渡すことなく Hive アカウントをそのアプリで利用できます。Hivesigner は二つの部分からなります。https://hivesigner.com のブラウザー署名画面と、`https://hivesigner.com/api/` の API です。このページでは、それぞれの役割と、アプリがそれらを使う二つの方法を説明します。

## ブラウザー署名画面 {#browser-signer}

ブラウザー署名画面とは Hivesigner のウェブサイトそのものです。利用者はそこに自分の Hive アカウントを追加します。鍵は利用者自身のブラウザーに残ります。Hivesigner が鍵をサーバーに送ることはありません。あなたのアプリが鍵を目にすることもありません。

署名画面は三種類のものに署名します。いずれも、利用者が何に署名するのかを見たうえでの署名です。

- **ログイン用トークン。** あなたのアプリは、ログインのために利用者を Hivesigner へ送ります。Hivesigner はアプリの名前と要求内容を表示します。利用者が承認すると、Hivesigner はその鍵で、利用者のアカウントとあなたのアプリを記した短い文に署名します。その署名済みの文が、あなたのアプリが受け取るトークンです。[OAuth2 でのログイン](/docs/oauth2)と[トークン](/docs/tokens)を参照してください。
- **トランザクション。** 署名リンクは、確認のためにトランザクションを開きます。利用者が承認すると、Hivesigner は必要な鍵でそれに署名します。そのあとブラウザーから Hive ネットワークへ送信します。リンクが署名だけを求めている場合は送信しません。[署名リンク](/docs/sign-links)を参照してください。
- **メッセージ。** あなたのアプリは、アカウントを管理していることを示すために、利用者に自分の鍵でテキストへ署名するよう求められます。[メッセージ署名](/docs/message-signing)を参照してください。

## API {#api}

API は、あなたのアプリにログインした利用者に代わって投稿系の操作をブロードキャストします。記事とコメント、投票、フォローなどの `custom_json` 操作、報酬の受け取り、プロフィールの更新です。あなたのアプリは操作を利用者のトークンとともに送ります。API はトークンを確認し、@hivesigner アカウントの投稿キーでトランザクションに署名し、Hive へブロードキャストします。

API はログイン中の利用者のアカウントを返し、コードをトークンと交換し、Hivesigner を使っているアプリの一覧も返します。[REST API](/docs/api) を参照してください。

## 投稿権限の連なり {#authority-chain}

Hive では、あるアカウントが別のアカウントに自分の投稿権限での操作を許可できます。API は次の二つの許可に支えられています。

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **利用者が自分の投稿権限にあなたのアプリアカウントを追加します。** 利用者が初めてあなたのアプリの投稿アクセスを承認したとき、同意画面がこれを行います。このとき利用者のアクティブキーが一度だけ必要です。
2. **あなたのアプリアカウントが自分の投稿権限に @hivesigner を追加します。** これは[アプリを登録する](/docs/register-app#grant-hivesigner)ときに一度だけ行います。

ブロードキャストの前に、API は両方の許可がそろっているかを確認します。トークンが示す利用者が作成した操作だけをブロードキャストします。

利用者は https://hivesigner.com/authorized-apps でいつでもあなたのアプリのアクセスを取り消せます。取り消されたあと、API はあなたのアプリを通じてその利用者に代わって投稿できません。

## 組み込みの二つの方法 {#two-ways-to-integrate}

### ログインしてから API でブロードキャストする {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

利用者の承認は一度だけです。そのあとは、トークンの期限が切れるか利用者がアクセスを取り消すまで、あなたのアプリは改めて尋ねることなく投票、コメント、投稿ができます。日常的な交流の操作にはこちらを使ってください。

コールバックを登録したアプリアカウントと @hivesigner への許可が必要です。[アプリを登録する](/docs/register-app)を参照してください。利用者が誰かを知りたいだけなら、[投稿アクセスなしのログイン](/docs/login-only)を参照してください。

### 署名リンク {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

利用者は署名の前にすべてのトランザクションを確認します。署名リンクは Hive の 41 種類の操作に対応しており、送金やアクティブキーが必要なウォレット操作も含みます。API がそれらを扱うことはありません。署名リンクにアプリアカウントは要りません。[署名リンク](/docs/sign-links)を参照してください。

### どちらを選ぶか {#which-to-choose}

- **頻繁な投稿系の操作**（投票、コメント、フォロー）: OAuth2 でログインさせてから API を使います。
- **ウォレット操作**、またはアクティブキーが必要なもの: 署名リンクを使います。
- **両方**: 多くのアプリは交流機能に OAuth2 のログインを使い、送金には署名リンクを使っています。
- **利用者が誰かを知るだけ**: [投稿アクセスなしのログイン](/docs/login-only)を参照してください。

## ソースコード {#source-code}

Hivesigner はオープンソースです。

- ブラウザー署名画面: https://github.com/ecency/hivesigner-ui
- API: https://github.com/ecency/hivesigner-api
- JavaScript SDK（npm パッケージ `hivesigner`）: https://github.com/ecency/hivesigner-sdk。[SDK](/docs/sdk) を参照してください。
