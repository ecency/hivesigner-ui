Hivesigner のトークンは、短い署名済みの文です。Hive アカウント、そのトークンが作られたアプリ、署名された時刻を示します。あなたのサーバーは API でも自前でもトークンを確認できます。このページでは、トークンの中身、有効期間、確認の二つの方法を説明します。

## トークンの形 {#format}

トークンは base64url で符号化された JSON オブジェクトです。標準の base64url との違いが一つあり、詰め文字に `=` ではなく `.` を使います。つまり素の base64 と比べると、`+` は `-` に、`/` は `_` に、`=` は `.` になります。どのトークンも `eyJzaWduZWRfbWVzc2FnZSI6` で始まります。

復号すると、トークンフローのアクセストークンは次のようになります。

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| フィールド | 意味 |
| --- | --- |
| `signed_message.type` | トークンの種類: `login`、`posting`、`code`、`refresh`。[トークンの種類](#kinds)を参照してください。 |
| `signed_message.app` | そのトークンが作られたアプリアカウント。アプリアカウントのないサイト向けのログイン用トークンにはありません。 |
| `authors[0]` | そのトークンが対象とする Hive アカウント。 |
| `timestamp` | 署名された時刻。1970-01-01 UTC からの秒数です。 |
| `signatures[0]` | 署名。十六進の文字列です。 |
| `authority` | ブラウザーで署名されたトークンにのみあります。利用者のどの鍵が署名したか、`posting` か `active` かを示します。このフィールドは署名対象の外にあります。どの鍵が署名したかを知るには、署名から復元してください。 |

署名は、`JSON.stringify({ signed_message, authors, timestamp })` の sha256 ハッシュに対する secp256k1 署名です。キーの順序はこのとおりです。

### トークンを復号する {#decode}

Node.js では:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

ブラウザーでは:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

復号は確認ではありません。この形に復号される文字列は誰でも作れます。信用する前に[トークンを確認](#check-a-token)してください。

## トークンの種類 {#kinds}

| トークン | `type` | `app` | 署名者 | 入手先 |
| --- | --- | --- | --- | --- |
| アクセストークン、トークンフロー | `posting` | あなたのアプリ | 利用者の投稿キー、または Hivesigner がそのアカウントの投稿キーを持たない場合はアクティブキー | あなたのコールバックの `access_token` |
| ログイン用トークン、`scope=login` | `login` | あなたのアプリ | 利用者の投稿キーまたはアクティブキー | あなたのコールバックの `access_token` |
| ログイン用トークン、アプリアカウントのないサイト | `login` | なし | 利用者の投稿キーまたはアクティブキー | あなたのコールバックの `access_token` |
| コード | `code` | あなたのアプリ | 利用者の投稿キーまたはアクティブキー | あなたのコールバックの `code` |
| アクセストークン、コードフロー | `posting` | あなたのアプリ | @hivesigner の投稿キー | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| 更新トークン | `refresh` | あなたのアプリ | @hivesigner の投稿キー | [`/api/oauth2/token`](/docs/api#oauth2-token) |

コードと更新トークンはアクセストークンではありません。どちらもログインとして受け入れてはいけません。

## トークンの有効期間 {#lifetime}

アクセストークンは 7 日間有効です。`expires_in` は 604800 秒で、その `timestamp` から数えます。期限が切れたら:

- **トークンフロー:** 利用者をもう一度ログインへ送ります。すでにあなたのアプリを承認している人には「APP にログイン」が表示され、一度のクリックで済みます。
- **コードフロー:** サーバーが更新トークンとクライアントシークレットで新しいアクセストークンを得ます。[更新](/docs/oauth2#refresh)を参照してください。

トークンの `timestamp` が 7 日より古くなったら期限切れとみなしてください。リダイレクト直後に確認するものについては、もっと短い経過時間だけを受け付けてください。コードはすぐに交換してください。ログイン用トークンは、その `timestamp` から数分以内のものだけを受け付けてください。

## サーバーでトークンを確認する {#check-a-token}

ブラウザーやアプリから送られてきたトークンをサーバーが信用する前に、次を確認してください。

- そのアカウントまたは @hivesigner が本当に署名していること。
- あなたのアプリ向けに作られたものであること。
- あなたが想定している種類のトークンであること。
- 十分に新しいこと。

### API に尋ねる {#check-with-the-api}

そのトークンで `/api/me` を呼びます。有効なトークンなら `user` にアカウントが返ります。

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

無効なトークンは `invalid_grant` とともに `401` を返します。[GET /api/me](/docs/api#me) を参照してください。

`/api/me` は署名を確かめます。ただし応答は、そのトークンがどのアプリ向けに作られたかを示しません。ですからトークンも復号して、`app`、`type`、経過時間を自分で確認してください。他のアプリ向けに作られたトークンで、あなたのアプリに誰かをログインさせてはいけません。

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

API はアプリ名の入ったトークンしか受け付けません。アプリアカウントのないサイトからのログイン用トークンは[自分で](#check-it-yourself)確認してください。

### 自分で確認する {#check-it-yourself}

1. トークンを復号します。
2. `signed_message.type` が想定どおりの種類か確認します。アクセストークンなら `posting`、ログイン用トークンなら `login` です。
3. `signed_message.app` があなたのアプリアカウントか確認します。アプリアカウントのないサイトの場合は、`app` がないことを確認します。
4. `timestamp` から経過時間を確認します。
5. `JSON.stringify({ signed_message, authors, timestamp })` の sha256 ハッシュを計算します。
6. `signatures[0]` とそのハッシュから公開鍵を復元します。
7. `authors[0]` のアカウントを今この時点で Hive のブロックチェーンから読みます。利用者は鍵を変更できるからです。復元した鍵は、そのアカウントの現在の投稿キーまたはアクティブキーのいずれかでなければなりません。`/api/oauth2/token` から得たトークンは @hivesigner が署名しているので、その場合は @hivesigner アカウントの現在の投稿キーを受け入れてください。

Node.js で [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk) を使う場合（`@ecency/sdk/hive` の下に `PrivateKey`、`PublicKey`、`Signature`、`callRPC` があります）:

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

次のように使います。

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

dhive ライブラリー（`@hiveio/dhive`）でも同じことができます。ハッシュは `cryptoUtils.sha256(message)` で計算し、鍵は `Signature.fromString(signatures[0]).recover(digest).toString()` で復元します。

## トークンを安全に扱う {#keep-tokens-safe}

投稿トークンを持つ人は、期限が切れるまであなたのアプリを通じてその利用者としてブロードキャストできます。パスワードと同じように扱ってください。

- **トークンはサーバーに保管する**か、httpOnly かつ Secure のクッキーに入れてください。更新トークンとクライアントシークレットはサーバーにだけ置いてください。
- **記録する URL にトークンを入れないでください。** トークンフローはコールバックのクエリ文字列でトークンを届けます。サーバーでそれを読み取り、そのあとトークンのない URL へリダイレクトしてください。コールバックのクエリ文字列はログに残さないでください。
- **コールバックのページで他サイトから何も読み込まないでください。** トークンの入ったアドレスがそちらへ送られないようにするためです。そのページの `Referrer-Policy: no-referrer` ヘッダーが役に立ちます。
- **トークンは自分のサーバーと `https://hivesigner.com/api/` にだけ送ってください。**

## ログアウトとアクセスの取り消し {#sign-out}

- **利用者のログアウト**とは、トークンを捨てることです。セッションやクッキーから削除してください。利用者がログアウトしたことを Hivesigner に伝えるために [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) を呼ぶこともできます。いずれにせよアプリ側でトークンを捨てます。
- **アプリのアクセスを完全に断つ**かどうかは利用者が決めます。https://hivesigner.com/authorized-apps か `https://hivesigner.com/revoke/APP` で、利用者は自分の投稿権限からあなたのアプリアカウントをオンチェーンで外します。そのあと API はあなたのアプリを通じてその利用者のためにブロードキャストしません。
