よくある質問への短い回答です。それぞれ詳しい説明のあるページにリンクしています。

## Hivesigner を使う {#using-hivesigner}

### Hivesigner は無料ですか。 {#is-it-free}

はい。Hivesigner は利用者にもアプリにも課金しません。ソースコードは MIT ライセンスで公開されています。

### Hivesigner が私のキーを見ることはありますか。 {#keys}

ありません。キーはあなたのデバイスのブラウザーに残り、署名もそこで行われます。Hivesigner のサーバーにも、利用するアプリにも送られることはありません。[キーの保存場所](/docs/accounts#where-keys-are-stored)と[キーを安全に保つ](/docs/safety)をご覧ください。

### パスコードを忘れたらどうなりますか。 {#forgotten-passcode}

パスコードは誰にも復元できません。Hivesigner にもできません。アカウントを Hivesigner から削除し、Hive のキーと新しいパスコードでもう一度追加してください。Hive アカウントと承認済みのアプリは変わりません。[パスコードを忘れた場合](/docs/accounts#forgotten-passcode)をご覧ください。

### スマートフォンでも Hivesigner を使えますか。 {#phone}

使えます。スマートフォンのブラウザーで https://hivesigner.com を開き、そこでアカウントを追加してください。キーはそのブラウザーにだけ保存されるので、使うデバイスごとにアカウントを追加してください。[アカウントの追加と管理](/docs/accounts)をご覧ください。

### どのアプリが Hivesigner を使っていますか。 {#which-apps}

https://hivesigner.com/apps に、Hivesigner を通じて Hive にブロードキャストしているアプリが利用の多い順で並んでいます。アプリ名と説明は各アプリが自分で公開したもので、Hivesigner は検証していません。そこでアプリを開くと、投稿権限を与えられるページが表示されます。[ディレクトリからアプリを承認する](/docs/signing-in#directory)をご覧ください。

### Hivesigner と Hive Keychain の関係は。 {#hive-keychain}

別々のツールです。Hive Keychain はブラウザー拡張機能とモバイルアプリで、Hivesigner は Web サイトなのでインストールするものがありません。アプリからメッセージへの署名を求められたとき、できる署名は Hive Keychain が作るものと同じ種類なので、アプリは同じコードでどちらも検証できます。Hivesigner の**メッセージに署名**ページで作られた検証トークンは、Hivesigner の**メッセージを検証**ページで確認します。[メッセージ署名](/docs/message-signing)をご覧ください。

## Hivesigner で開発する {#building}

### モバイルアプリで Hivesigner を使えますか。 {#mobile-app}

使えます。ブラウザーで Hivesigner にユーザーを送り、アプリが受け取れるコールバックを使ってください。自分が所有する https のリンク（Android App Links または iOS Universal Links）か、`http://127.0.0.1/auth` のようなループバックアドレスです。`myapp://` のような独自スキームは拒否されます。[モバイルアプリとデスクトップアプリ](/docs/register-app#native-apps)をご覧ください。

### アプリ用のアカウントは必要ですか。 {#app-account}

投稿権限付きでユーザーをログインさせる場合と、API 経由でブロードキャストする場合に必要です。[アプリを登録する](/docs/register-app)をご覧ください。[署名リンク](/docs/sign-links)と[メッセージ署名](/docs/message-signing)は、アカウントがなくても動きます。[投稿権限なしのログイン](/docs/login-only)も同様です。

### API で送金できますか。 {#transfers}

できません。API がブロードキャストするのは、投票、コメント、フォローなど投稿レベルの操作だけです。送金やアクティブキーが必要なその他の操作には[署名リンク](/docs/sign-links)を使ってください。ユーザーが自分のキーで一つずつ承認します。

### SDK があるのはどの言語ですか。 {#languages}

公式 SDK は JavaScript 向けです。Python にはコミュニティ製のライブラリがあります。REST API はどの言語からでも呼び出せます。[SDK](/docs/sdk)と[REST API](/docs/api)をご覧ください。

## ヘルプ {#help}

### どこで助けを得られますか。 {#get-help}

HiveDevs の Discord サーバーで質問してください：https://discord.gg/pNJn7wh。バグは、関係する GitHub リポジトリに issue として報告してください。Web サイトは https://github.com/ecency/hivesigner-ui、API は https://github.com/ecency/hivesigner-api、JavaScript SDK は https://github.com/ecency/hivesigner-sdk です。リクエストを拒否した画面では、**この問題を報告**から Hivesigner チームに送信できます。

### どうすれば貢献できますか。 {#contribute}

Hivesigner は上記 3 つのリポジトリで GitHub 上のオープンソースとして公開されています。バグやアイデアは issue としてお寄せください。修正は pull request で送ってください。
