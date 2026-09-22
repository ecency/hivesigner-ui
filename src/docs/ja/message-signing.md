あなたのアプリは、利用者に投稿キーやアクティブキーでテキストのメッセージへ署名するよう求められます。署名は、その人がアカウントを管理していることを示します。何もブロードキャストされず、メッセージがブロックチェーンに載ることもありません。Hivesigner は Hive Keychain の `requestSignBuffer` と同じ方法で署名するので、Keychain の署名を確認するサーバー側のコードで Hivesigner の署名も確認できます。

## 署名を求める {#request}

利用者を次のクエリパラメーターとともに `https://hivesigner.com/sign-buffer` へ送ります。

| パラメーター | 必須 | 意味 |
| --- | --- | --- |
| `message` | 必須 | 署名する正確なテキストです。空白以外の内容が必要です。 |
| `redirect_uri` | 必須 | Hivesigner が結果を送る先です。[コールバックの規則](#callback-rules)を参照してください。 |
| `authority` | 任意 | `posting` か `active` です。大文字小文字は問いません（`Posting` でもかまいません）。ない場合や空の場合は `posting` です。それ以外の値は拒否されます。 |
| `client_id` | 任意 | あなたのアプリアカウントです。`clientId` も読まれます。これを付けると、`redirect_uri` はあなたのアプリのコールバックのいずれかでなければなりません。 |
| `state` | 任意 | 任意の値です。Hivesigner はそのまま返します。 |
| `account` | 任意 | 署名してほしいアカウントです。端末にある場合 Hivesigner はそれを選び、ない場合は無視します。`select_account` も読まれます。 |

URL は `URLSearchParams` で組み立ててください。すべての値が符号化されます。

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### コールバックの規則 {#callback-rules}

- コールバックは `https://` でなければなりません。素の `http://` はループバックでのみ動きます。`localhost`、`127.0.0.1`、`[::1]` です。
- **`client_id` がある場合**、コールバックはそのアプリアカウントに登録されている必要があります。照合はログインと同じです。[コールバック](/docs/register-app#callback-rules)を参照してください。Hivesigner はリクエストが開かれたときに Hive からアプリのコールバックを読み、読み終えるまで何も署名しません。Hive に届かない場合、利用者には**再試行**ボタンが出ます。
- **`client_id` がない場合**、最初の規則を満たすコールバックであればどれでもかまいません。そのとき Hivesigner はコールバックのホストを要求元として示します。たとえば「HOST がメッセージへの署名を求めています。」のようにです。

アプリアカウントがあるなら `client_id` を送ってください。利用者にはアプリの名前とアカウントが見えます。署名を受け取れるのは登録済みのコールバックだけです。

Hivesigner は、メッセージのないリクエスト、未知の `authority`、欠けているか使えないコールバック、Hive アカウントでない `client_id`、そのアプリに登録されていないコールバックを拒否します。利用者には「この署名リクエストは使用できません。メッセージ、投稿キーまたはアクティブキー、そしてアプリに登録された安全なリダイレクト URL が必要です。サイトに戻ってもう一度お試しください。」と**この問題を報告**ボタンが表示されます。

### 利用者に見えるもの {#what-the-user-sees}

- あなたのアプリ（またはコールバックのホスト）の名前と「移動先：HOST」が入った見出し。
- 署名されるとおりのメッセージ全文。テキストを隠したり向きを変えたりしかねない文字は、`\u{200B}` のようなコードで表示されます。
- 「投稿キーで署名されます」または「アクティブキーで署名されます」。
- 警告: 「あなたの署名は、それを見るすべての人に @USERNAME がまさにこのテキストに署名したことを証明します。内容を理解したメッセージにだけ署名してください。」
- **署名**と**キャンセル**。ロックされたアカウントでは先にパスコードを尋ねます。

[メッセージ署名のリクエスト](/docs/signing#message-requests)では、この画面を利用者向けに説明しています。

## コールバックが受け取るもの {#callback}

利用者が**署名**を選ぶと、Hivesigner は次のクエリパラメーターとともに利用者をあなたのコールバックへ送ります。

| パラメーター | 値 |
| --- | --- |
| `signature` | 署名。130 文字の十六進文字列です |
| `public_key` | 署名した鍵の公開鍵。`STM...` のような形です |
| `username` | 署名したアカウント |
| `authority` | `posting` または `active` |
| `state` | あなたの `state`。リクエストに付いていた場合に返ります（空の値も含みます） |

Hivesigner はこれらをコールバックのクエリに、`?` か `&` のあと、`#fragment` の前に足します。あなた自身のクエリはそのまま残ります。

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

利用者が**キャンセル**を選ぶと、Hivesigner はアカウント一覧を開きます。コールバックには何も届きません。

> **警告:** 誰でも作り物の値であなたのコールバックを開けます。サーバーが署名を確認するまで、どのパラメーターも主張に過ぎないものとして扱ってください。

## 署名を検証する {#verify}

署名はサーバーで確認します。

1. 依頼したメッセージを、その `state` とともにサーバーに保管しておきます。ブラウザーから戻ってきた写しを信用しないでください。
2. メッセージのハッシュを取ります。UTF-8 のバイト列に対する sha256 です。
3. 署名とそのハッシュから公開鍵を復元します。
4. Hive からアカウントを読み込みます。復元した鍵が、あなたが求めた権限に属し、単独で署名できる重みを持つかを確認します。
5. `state` が自分の発行したものか確認します。各メッセージは一度だけ受け付けてください。

次の例では dhive（https://www.npmjs.com/package/@hiveio/dhive）を使います。

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

同じ確認が Hive Keychain の `requestSignBuffer` の署名にも使えます。比べる相手は自分で復元した鍵です。コールバックの `public_key` は手がかりにすぎません。

## Hivesigner が署名しないメッセージ {#refused-messages}

`signed_message` というキーを持つ JSON オブジェクトのメッセージは、Hivesigner のトークンと同じ形です。それに署名すると、要求した側に利用者のアカウントへのアクセスを与えてしまいます。Hivesigner はそのようなメッセージには決して署名しません。利用者には「このメッセージは Hivesigner のトークンです。署名するとサイトにあなたのアカウントへのアクセスを与えてしまうため、署名できません。」と伝えます。

普通のテキストか、`signed_message` キーを持たない JSON を使ってください。署名の目的を示し、一度だけ生成する値を添えます。たとえば次のようにします。

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## メッセージ署名のツール {#sign-message-tool}

利用者は https://hivesigner.com/signmessage（**メッセージに署名**）で自分でメッセージに署名し、https://hivesigner.com/verifymessage（**メッセージを検証**）で署名を確認することもできます。[自分でメッセージに署名する](/docs/signing#sign-message)を参照してください。

このツールの署名方法は `/sign-buffer` とは異なります。メッセージ、アカウント、時刻を含む Hivesigner のトークン本体に署名し、その結果を**検証トークン**として共有します。そうしたトークンは**メッセージを検証**のページで確認するか、[自分で確認する](/docs/tokens#check-it-yourself)に書かれた方法で確認してください。上のコードでは確認できません。
