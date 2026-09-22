署名リンクは Hive のトランザクションを Hivesigner で開きます。利用者がそれを確認し、自分の鍵で承認すると、Hivesigner がそのブラウザーからブロードキャストします。そのあと Hivesigner は、トランザクション ID とともに利用者をあなたのアプリへ戻せます。署名リンクにアプリアカウントもトークンも要りません。Hivesigner が対応する 41 種類の操作すべてを扱え、送金やアクティブキーが必要な操作も含みます。

## 署名リンクの仕組み {#how-it-works}

1. あなたのアプリが、一つ以上の操作を含むリンクを組み立てます。
2. 利用者がそのリンクを開きます。Hivesigner は「トランザクションの確認」の画面で、各操作を分かりやすい言葉で、必要な鍵とともに表示します。
3. 利用者が承認します。Hivesigner は Hivesigner で選ばれているアカウントの鍵を使い、ブラウザー内でトランザクションに署名します。そのあとトランザクションを Hive ネットワークへ送ります。
4. リンクにコールバックが指定されている場合、Hivesigner はトランザクション ID とともに利用者をそこへ送ります。

あなたのアプリが鍵を目にすることはありません。どのサイトでも署名リンクを作れます。送るべき `client_id` はありません。

## リンクの形式 {#link-forms}

Hivesigner は二種類の署名リンクを読みます。符号化リンクと旧来のリンクです。

### 符号化リンク {#encoded-links}

符号化リンクは操作を JSON として、base64url で符号化して持ちます。`hive-uri` パッケージの `hive://sign/...` の形式を使い、`hive://` を `https://hivesigner.com/` に置き換えたものです。

| 形式 | `B64U` の中身 |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | 一つの操作: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | 操作の一覧: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | トランザクション全体（独自のヘッダー付き） |

`B64U` は JSON のテキストを UTF-8 で符号化し、さらに base64 にしたものです。`+` は `-`、`/` は `_`、詰め文字の `=` は `.` に置き換えます。

`op` と `ops` の場合、Hivesigner が操作の周りにトランザクションを組み立てます。参照ブロックと有効期限も埋めます。

`tx` の場合、Hivesigner はトランザクション自身の `ref_block_num`、`ref_block_prefix`、`expiration` を保ちます。すでに付いている署名も保ちます。これにより、複数人が管理するアカウントのために、複数のアカウントが順番に一つのトランザクションへ署名できます。`extensions` の一覧が空でないトランザクションは拒否されます。

> **注:** Hivesigner は署名の前に一部の値をそろえます。金額や、既定値のままのフィールドなどです。そのため署名後のトランザクションの ID が、あなたが組み立てたものと異なることがあります。ID はコールバックから読んでください。

### 旧来のリンク {#legacy-links}

旧来のリンクは、パスに操作名を入れ、フィールドをクエリに入れます。

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- 操作名はスネークケース（`transfer_to_vesting`）、キャメルケース（`transferToVesting`）、ケバブケース（`transfer-to-vesting`）のいずれでも書けます。
- 各フィールドは、フィールド名のクエリパラメーターとして渡します。値はすべて URL 用に符号化してください。
- 配列やオブジェクトは JSON で書きます。たとえば `required_posting_auths=["alice"]` です。ID や名前の一覧はカンマ区切りでもかまいません。`proposal_ids=379,380` のようにします。
- 真偽値は `true` か `false` と書きます。

旧来のリンクには操作を一つだけ入れられます。二つ以上には符号化リンクを使ってください。

### フィールドの値 {#field-values}

次の規則はどの形式にも当てはまります。

- **既定値。** 省いたフィールドは既定値になります。操作の主体となるアカウント（`voter`、`from`、`owner` など）は、既定では署名するアカウントです。投票の `weight` の既定値は `10000`（100%）です。
- **金額**は数値と記号です。`1.000 HIVE`、`0.500 HBD`、`100.000000 VESTS` のように書きます。Hivesigner は HIVE と HBD を小数 3 桁、VESTS を 6 桁で書きます。
- **Hive Power。** VESTS を取るフィールドは `100 HP` のように HP 単位の金額も受け付けます。Hivesigner は利用者が承認する前に、そのときのレートで VESTS に換算します。
- **`__signer`** は、どの値の中にあっても署名するアカウント名に置き換わります。たとえばフォローの `custom_json` では、`json` の中でフォローする側として `__signer` を書けます。
- **整数**はチェーンが受け付ける範囲の整数でなければなりません。たとえば投票の `weight` は `-10000` から `10000` です。

値がフィールドに合わないとき、操作が未知のとき、リンクに操作が一つもないとき、Hivesigner はリンク全体を拒否します。利用者には「問題が発生しました。指定されたデータが無効です。」と表示され、何も署名されません。

## パラメーター {#parameters}

次のものを署名リンクのクエリ文字列に加えられます。

| パラメーター | 意味 |
| --- | --- |
| `cb` | コールバック URL を base64url で符号化したものです。`hive-uri` の `callback` オプションはこれを書きます。 |
| `redirect_uri` | コールバック URL を、URL 用に符号化した普通のテキストで書いたものです。旧来のリンクはこちらを使います。符号化リンクは `cb` がないときにこれを使います。 |
| `nb` | 署名のみ。Hivesigner はブロードキャストせずにトランザクションへ署名します。署名を受け取るにはコールバックに `{{sig}}` を入れてください（[コールバックの差し込み](#callback-placeholders)を参照）。値は何でもよく、空でもかまいません（`nb=`）。 |
| `s` | 署名すべきアカウントです。別のアカウントが選ばれている場合、Hivesigner は利用者にこのアカウントへ切り替えるよう促します。他のアカウントでは署名しません。 |

コールバックは `https://` を使ってください。`http` でも `https` でもない URL のコールバックは無視され、Hivesigner は自分の結果画面にとどまります。

Hivesigner は操作から鍵を決めます。鍵を選ぶパラメーターはありません。署名リンクでは `authority`（および `hive-uri` の `a` パラメーター）を無視します。[リンクに必要な鍵](#which-key)を参照してください。

### コールバックの差し込み {#callback-placeholders}

利用者が承認したあと、Hivesigner はコールバックの次の差し込みを埋めます。

| 差し込み | 値 |
| --- | --- |
| `{{id}}` | トランザクション ID |
| `{{sig}}` | 署名（署名のみ（`nb`）のリンクの場合） |
| `{{block}}` | 空のままです |
| `{{txn}}` | 空のままです |
| `{{data}}` | 空のままです |

差し込みが一つもないコールバックには、`?` か `&` のあとに `id` としてトランザクション ID が足されます。

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner は Hive のノードがトランザクションを受け付けた時点でリダイレクトします。そのときまだブロックに入っていないことがあります。ブロックに含まれたことを知る必要がある場合は、ID で照会してください。

ネットワークがトランザクションを拒否した場合（利用者にはエラーが見えます）や、利用者が承認せずに離れた場合、コールバックは呼ばれません。

## リンクを組み立てる {#build-a-link}

### hive-uri を使う {#with-hive-uri}

`hive-uri` パッケージ（https://www.npmjs.com/package/hive-uri）は操作をリンクに符号化します。どの Unicode テキストも正しく符号化する 0.2.8 以降を使ってください。

```bash
npm install hive-uri
```

```js
import { encodeOp, encodeOps } from 'hive-uri';

// One vote. __signer becomes the account that signs.
const vote = encodeOp(
  ['vote', { voter: '__signer', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
  { callback: 'https://YOUR_APP/voted?tx={{id}}' },
);

// Two transfers in one transaction.
const payout = encodeOps(
  [
    ['transfer', { from: '__signer', to: 'RECIPIENT_1', amount: '1.000 HIVE', memo: 'MEMO' }],
    ['transfer', { from: '__signer', to: 'RECIPIENT_2', amount: '2.000 HIVE', memo: 'MEMO' }],
  ],
  { callback: 'https://YOUR_APP/paid' },
);

const voteLink = vote.replace('hive://', 'https://hivesigner.com/');
const payoutLink = payout.replace('hive://', 'https://hivesigner.com/');
```

オプションのオブジェクトは `callback`（`cb` と書かれます）、`no_broadcast: true`（`nb` と書かれます）、`signer`（`s` と書かれます）を取ります。トランザクション全体には `encodeTx` が同じことをします。

### JavaScript SDK を使う {#with-the-sdk}

`hivesigner` パッケージには `sendOperation`、`sendOperations`、`sendTransaction` があります。`hive-uri` の符号化関数と同じ引数を取り、`https://hivesigner.com/sign/...` のリンクを返します。

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

TypeScript では型が第三引数を必須にしています。リンクを受け取るには `undefined` を渡してください。ブラウザーでは第三引数に関数を渡すと、リンクを返す代わりに新しいタブで開きます。[SDK](/docs/sdk#sign-links) を参照してください。

### コードなしで {#signs-page}

https://hivesigner.com/signs（「トランザクションに署名」）は、対応する各操作をフィールドの入力欄とともに並べます。`/sign/op/` のリンクを組み立てて開きます。

## リンクに必要な鍵 {#which-key}

各操作には一つの鍵が必要です。投稿キー、アクティブキー、オーナーキーのいずれかです。[下の表](#supported-operations)にまとめてあります。三つの操作は値によって変わります。

- `custom_json` は `required_auths` にアカウント名がある場合にアクティブキーが必要です。ない場合は投稿キーです。
- `account_update` は `owner` を設定する場合にオーナーキーが必要です。それ以外はアクティブキーです。
- `account_update2` は `owner` を設定する場合にオーナーキーが必要です。`active`、`posting`、`memo_key`、`json_metadata` を設定する場合はアクティブキーです。`posting_json_metadata` だけの場合は投稿キーです。

Hivesigner は一つのリンクを一つの鍵で署名します。そのため一つのリンクの操作はすべて同じ鍵を必要としなければなりません。混在するリンクへの署名は拒否し、その理由を利用者に伝えます。そうした操作は別々のリンクで送ってください。

選ばれているアカウントの鍵が端末にない場合、Hivesigner はどの鍵が足りないかを伝え、追加を促します。[鍵がない場合](/docs/signing#missing-key)を参照してください。

## 利用者に見えるもの {#what-the-user-sees}

- 「トランザクションの確認」という見出しの画面。操作ごとに一枚のカードが出て、分かりやすい言葉の要約、必要な鍵、含まれる値が並びます。
- リンクにコールバックがある場合は「HOST にリダイレクトされます。」。利用者がホストを見分けられるよう、自分のサイトのコールバックを使ってください。
- 署名するアカウント以外のアカウントとして操作する場合の警告。
- **承認**、署名のみのリンクでは**署名**。ロックされたアカウントでは先にパスコードを尋ねます。
- ブロードキャスト後に「トランザクションをブロードキャストしました」とトランザクション ID。そのあとあなたのコールバックへリダイレクトします。

[確認と署名](/docs/signing#confirm-screen)では、この画面を利用者向けに説明しています。

## 対応する操作 {#supported-operations}

Hivesigner は次の 41 種類の操作に、チェーン上の名前で署名します。それ以外は拒否されます。名前は Hivesigner が確認画面で表示するものです。

| 操作 | 鍵 | 名前 |
| --- | --- | --- |
| `transfer` | アクティブ | 送金 |
| `recurrent_transfer` | アクティブ | 定期送金 |
| `delegate_vesting_shares` | アクティブ | ハイブパワーの委任 |
| `transfer_to_vesting` | アクティブ | パワーアップ |
| `set_withdraw_vesting_route` | アクティブ | パワーダウンの送り先の設定 |
| `withdraw_vesting` | アクティブ | パワーダウン |
| `transfer_to_savings` | アクティブ | 貯蓄口座への送金 |
| `transfer_from_savings` | アクティブ | 貯蓄口座からの送金 |
| `cancel_transfer_from_savings` | アクティブ | 貯蓄口座からの送金のキャンセル |
| `convert` | アクティブ | HBD を HIVE に変換 |
| `collateralized_convert` | アクティブ | HIVE を HBD に変換 |
| `account_witness_vote` | アクティブ | 証人への投票 |
| `witness_update` | アクティブ | 証人情報の更新 |
| `witness_set_properties` | アクティブ | 証人プロパティの設定 |
| `account_witness_proxy` | アクティブ | ガバナンスのプロキシ |
| `claim_account` | アクティブ | アカウントクレジットの請求 |
| `account_create` | アクティブ | アカウントの作成 |
| `create_claimed_account` | アクティブ | アカウントクレジットによるアカウント作成 |
| `vote` | 投稿 | 投票 |
| `limit_order_create` | アクティブ | 指値注文の作成 |
| `limit_order_create2` | アクティブ | 指値注文の作成 |
| `limit_order_cancel` | アクティブ | 指値注文のキャンセル |
| `claim_reward_balance` | 投稿 | 報酬の受け取り |
| `comment` | 投稿 | 投稿またはコメント |
| `comment_options` | 投稿 | 投稿またはコメントのオプション |
| `custom_json` | 投稿、`required_auths` がある場合はアクティブ | カスタム操作 |
| `delete_comment` | 投稿 | コメントの削除 |
| `account_update` | アクティブ、`owner` を設定する場合はオーナー | アカウントの更新（アクティブ） |
| `account_update2` | 投稿、アクティブ、オーナーのいずれか（フィールドによる） | アカウントの更新（投稿） |
| `change_recovery_account` | オーナー | リカバリアカウントの変更 |
| `create_proposal` | アクティブ | 提案の作成 |
| `remove_proposal` | アクティブ | 提案の削除 |
| `update_proposal_votes` | アクティブ | 提案への投票の更新 |
| `update_proposal` | アクティブ | 提案の更新 |
| `escrow_transfer` | アクティブ | エスクロー送金 |
| `escrow_approve` | アクティブ | エスクローの承認 |
| `escrow_dispute` | アクティブ | エスクローの異議申し立て |
| `escrow_release` | アクティブ | エスクローの解放 |
| `account_create_with_delegation` | アクティブ | 委任付きのアカウント作成 |
| `request_account_recovery` | アクティブ | アカウント復旧のリクエスト |
| `recover_account` | オーナー | アカウントの復旧 |
