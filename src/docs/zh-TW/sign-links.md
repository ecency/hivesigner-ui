簽署連結會在 Hivesigner 中打開一筆 Hive 交易。使用者查看它，用自己的金鑰核准，Hivesigner 就從他們的瀏覽器把它廣播出去。接著 Hivesigner 可以帶著交易 ID 把使用者送回你的應用程式。簽署連結不需要應用程式帳號，也不需要權杖。它們涵蓋 Hivesigner 支援的全部 41 種操作，包括轉帳和其他需要活躍金鑰的操作。

## 簽署連結如何運作 {#how-it-works}

1. 你的應用程式做出一個帶有一個或多個操作的連結。
2. 使用者打開連結。Hivesigner 在「確認交易」畫面上用平實的說法呈現每個操作，並標明它需要的金鑰。
3. 使用者核准。Hivesigner 在瀏覽器中用 Hivesigner 裡所選帳號的金鑰簽署交易，然後把交易送到 Hive 網路。
4. 當連結指定了回呼網址時，Hivesigner 會帶著交易 ID 把使用者送到那裡。

你的應用程式永遠看不到金鑰。任何網站都能做出簽署連結：沒有 `client_id` 要送。

## 連結的形式 {#link-forms}

Hivesigner 讀得懂兩種簽署連結：編碼連結和舊式連結。

### 編碼連結 {#encoded-links}

編碼連結把操作以 JSON 形式、用 base64url 編碼後帶著走。它採用 `hive-uri` 套件的 `hive://sign/...` 格式，只是把 `hive://` 換成 `https://hivesigner.com/`。

| 形式 | `B64U` 帶著什麼 |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | 一個操作：`["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | 一組操作：`[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | 一整筆交易，帶著它自己的標頭 |

`B64U` 是那段 JSON 文字，先編碼成 UTF-8，再編碼成 base64，並把 `+` 換成 `-`、`/` 換成 `_`、填補字元 `=` 換成 `.`。

對於 `op` 和 `ops`，Hivesigner 會圍繞這些操作組出交易，並自行填入參考區塊和到期時間。

對於 `tx`，Hivesigner 會保留交易自己的 `ref_block_num`、`ref_block_prefix` 和 `expiration`，也保留交易已經帶著的簽章。這讓由多人共同掌控的帳號，可以由多個帳號依序簽署同一筆交易。若交易的 `extensions` 清單不是空的，Hivesigner 會拒絕它。

> **備註：** Hivesigner 在簽署前會把某些值正規化，例如金額和維持預設值的欄位。因此簽署後的交易 ID 可能和你組出來的不同。請從回呼網址讀取 ID。

### 舊式連結 {#legacy-links}

舊式連結在路徑中寫明一個操作，並把它的欄位放進查詢字串：

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- 操作名稱可以寫成 snake case（`transfer_to_vesting`）、camel case（`transferToVesting`）或 kebab case（`transfer-to-vesting`）。
- 每個欄位都以同名的查詢參數給出。請把每個值做網址編碼。
- 清單和物件寫成 JSON，例如 `required_posting_auths=["alice"]`。由 ID 或名稱組成的清單也可以用逗號分隔：`proposal_ids=379,380`。
- 布林值寫成 `true` 或 `false`。

舊式連結只帶一個操作。需要更多時請用編碼連結。

### 欄位的值 {#field-values}

以下規則適用於所有形式：

- **預設值。** 你省略的欄位會採用它的預設值。執行操作的帳號（`voter`、`from`、`owner` 等欄位）預設是簽署的帳號。投票的 `weight` 預設是 `10000`（100%）。
- **金額**由一個數字和一個符號組成：`1.000 HIVE`、`0.500 HBD` 或 `100.000000 VESTS`。Hivesigner 把 HIVE 和 HBD 寫成 3 位小數，把 VESTS 寫成 6 位。
- **Hive Power。** 接受 VESTS 的欄位也接受以 HP 表示的金額，例如 `100 HP`。Hivesigner 會在使用者能核准之前，依目前的匯率把它換算成 VESTS。
- **`__signer`** 出現在任何值中時，都會變成簽署帳號的名稱。例如追蹤用的 `custom_json`，可以在它的 `json` 裡把 `__signer` 當成追蹤者。
- **整數**必須是鏈所接受範圍內的整數，例如投票的 `weight` 是 `-10000` 到 `10000`。

當某個值不符合它的欄位、某個操作無法辨識，或連結裡根本沒有操作時，Hivesigner 會拒絕整個連結。使用者會看到「糟糕，發生錯誤。提供的資料無效。」，而且不會簽署任何東西。

## 參數 {#parameters}

把這些參數加進任何簽署連結的查詢字串：

| 參數 | 意義 |
| --- | --- |
| `cb` | 回呼網址，以 base64url 編碼。這正是 `hive-uri` 為它的 `callback` 選項寫出的內容。 |
| `redirect_uri` | 以一般網址編碼文字表示的回呼網址。舊式連結用這個參數。編碼連結在沒有 `cb` 時也會用它。 |
| `nb` | 只簽署。Hivesigner 會簽署交易但不廣播。請在回呼網址中放入 `{{sig}}` 以取得簽章（參見[回呼佔位符](#callback-placeholders)）。任何值都可以，空值也行（`nb=`）。 |
| `s` | 必須簽署的帳號。當選取的是別的帳號時，Hivesigner 會請使用者換成這個帳號。它不會用任何其他帳號簽署。 |

請使用 `https://` 的回呼網址。對於不是 `http` 或 `https` 網址的回呼，Hivesigner 會忽略它，並停留在自己的結果畫面上。

Hivesigner 會依操作挑選金鑰。沒有參數可以指定金鑰：在簽署連結上，Hivesigner 會忽略 `authority`（以及 `hive-uri` 的 `a` 參數）。參見[連結需要哪一把金鑰](#which-key)。

### 回呼佔位符 {#callback-placeholders}

使用者核准之後，Hivesigner 會在回呼網址中填入這些佔位符：

| 佔位符 | 值 |
| --- | --- |
| `{{id}}` | 交易 ID |
| `{{sig}}` | 簽章，用於只簽署（`nb`）的連結 |
| `{{block}}` | 留白 |
| `{{txn}}` | 留白 |
| `{{data}}` | 留白 |

對於完全不含這些佔位符的回呼網址，交易 ID 會以 `id` 的形式接在 `?` 或 `&` 之後：

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

只要有 Hive 節點接受了交易，Hivesigner 就會重新導向。交易這時可能還沒進入區塊。當你需要確認它已被收錄時，請依 ID 查詢它。

當網路拒絕這筆交易（使用者會看到錯誤），或使用者沒有核准就離開時，你的回呼網址不會被呼叫。

## 做出一個連結 {#build-a-link}

### 用 hive-uri {#with-hive-uri}

`hive-uri` 套件（https://www.npmjs.com/package/hive-uri）把操作編碼成連結。請用 0.2.8 或更新的版本，它能正確編碼任何 Unicode 文字。

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

選項物件接受 `callback`（寫成 `cb`）、`no_broadcast: true`（寫成 `nb`）和 `signer`（寫成 `s`）。`encodeTx` 對整筆交易做同樣的事。

### 用 JavaScript SDK {#with-the-sdk}

`hivesigner` 套件提供 `sendOperation`、`sendOperations` 和 `sendTransaction`。它們接受和 `hive-uri` 編碼函式相同的引數，並傳回 `https://hivesigner.com/sign/...` 連結：

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

在 TypeScript 中，型別要求一定要有第三個引數：傳入 `undefined` 就能取回連結。在瀏覽器中，把一個函式當作第三個引數傳入，會讓它們在新分頁中打開連結，而不是傳回連結。參見 [SDK](/docs/sdk#sign-links)。

### 不用寫程式 {#signs-page}

https://hivesigner.com/signs（「簽署交易」）列出每一個支援的操作，並為它的欄位提供表單。它會做出一個 `/sign/op/` 連結並打開。

## 連結需要哪一把金鑰 {#which-key}

每個操作需要一把金鑰：發文、活躍或擁有者金鑰。[下面的表格](#supported-operations)一一列出。有三個操作取決於它們自己的值：

- 當 `required_auths` 寫明了帳號時，`custom_json` 需要活躍金鑰；否則需要發文金鑰。
- 當 `account_update` 設定了 `owner` 時，它需要擁有者金鑰；否則需要活躍金鑰。
- 當 `account_update2` 設定了 `owner` 時，它需要擁有者金鑰；設定 `active`、`posting`、`memo_key` 或 `json_metadata` 時需要活躍金鑰；只設定 `posting_json_metadata` 時則需要發文金鑰。

Hivesigner 用一把金鑰簽署一個連結，所以同一個連結裡的所有操作都必須需要同一把金鑰。對於把它們混在一起的連結，Hivesigner 會拒絕簽署，並告訴使用者原因。請把這類操作分成不同的連結送出。

當選取的帳號在裝置上沒有那把金鑰時，Hivesigner 會說明缺少哪一把金鑰，並提議把它加進來。參見[缺少金鑰時](/docs/signing#missing-key)。

## 使用者會看到什麼 {#what-the-user-sees}

- 一個標題為「確認交易」的畫面，每個操作一張卡片：用平實說法寫的摘要、它需要的金鑰，以及它帶著的值。
- 當連結帶有回呼網址時，會顯示「你將被重新導向至 HOST。」。請使用你自己網站上的回呼網址，好讓使用者認得這個主機。
- 當某個操作以簽署者以外的帳號名義行事時，會有一則警告。
- **核准**，或者對只簽署的連結顯示 **簽署**。鎖定的帳號會先索取本機密碼。
- 廣播之後會顯示「交易已成功廣播」和交易 ID。接著重新導向到你的回呼網址。

[查看並簽署](/docs/signing#confirm-screen)從使用者的角度說明這個畫面。

## 支援的操作 {#supported-operations}

Hivesigner 會依鏈上的名稱簽署以下 41 種操作。其他一概拒絕。表中的名稱就是 Hivesigner 在確認畫面上顯示的名稱。

| 操作 | 金鑰 | 名稱 |
| --- | --- | --- |
| `transfer` | 活躍 | 轉帳 |
| `recurrent_transfer` | 活躍 | 定期轉帳 |
| `delegate_vesting_shares` | 活躍 | 委派 Hive Power |
| `transfer_to_vesting` | 活躍 | 轉為 Hive Power（Power Up） |
| `set_withdraw_vesting_route` | 活躍 | 設定 Power Down 去向 |
| `withdraw_vesting` | 活躍 | 解除質押（Power Down） |
| `transfer_to_savings` | 活躍 | 轉入儲蓄 |
| `transfer_from_savings` | 活躍 | 從儲蓄轉出 |
| `cancel_transfer_from_savings` | 活躍 | 取消從儲蓄轉出 |
| `convert` | 活躍 | 將 HBD 兌換為 HIVE |
| `collateralized_convert` | 活躍 | 將 HIVE 兌換為 HBD |
| `account_witness_vote` | 活躍 | 見證人投票 |
| `witness_update` | 活躍 | 更新見證人資訊 |
| `witness_set_properties` | 活躍 | 設定見證人參數 |
| `account_witness_proxy` | 活躍 | 治理代理 |
| `claim_account` | 活躍 | 領取帳號建立額度 |
| `account_create` | 活躍 | 建立帳號 |
| `create_claimed_account` | 活躍 | 以帳號建立額度建立帳號 |
| `vote` | 發文 | 投票 |
| `limit_order_create` | 活躍 | 建立限價單 |
| `limit_order_create2` | 活躍 | 建立限價單 |
| `limit_order_cancel` | 活躍 | 取消限價單 |
| `claim_reward_balance` | 發文 | 領取獎勵 |
| `comment` | 發文 | 文章或留言 |
| `comment_options` | 發文 | 文章或留言選項 |
| `custom_json` | 發文；設定了 `required_auths` 時為活躍 | 自訂操作 |
| `delete_comment` | 發文 | 刪除留言 |
| `account_update` | 活躍；設定了 `owner` 時為擁有者 | 更新帳號（活躍） |
| `account_update2` | 依欄位而定，發文、活躍或擁有者 | 更新帳號（發文） |
| `change_recovery_account` | 擁有者 | 變更復原帳號 |
| `create_proposal` | 活躍 | 建立提案 |
| `remove_proposal` | 活躍 | 移除提案 |
| `update_proposal_votes` | 活躍 | 更新提案投票 |
| `update_proposal` | 活躍 | 更新提案 |
| `escrow_transfer` | 活躍 | 託管轉帳 |
| `escrow_approve` | 活躍 | 核准託管 |
| `escrow_dispute` | 活躍 | 託管爭議 |
| `escrow_release` | 活躍 | 釋出託管款項 |
| `account_create_with_delegation` | 活躍 | 以委派方式建立帳號 |
| `request_account_recovery` | 活躍 | 申請復原帳號 |
| `recover_account` | 擁有者 | 復原帳號 |
