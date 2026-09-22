签名链接会在 Hivesigner 中打开一笔 Hive 交易。用户查看它，用自己的密钥批准，Hivesigner 便从他们的浏览器把它广播出去。随后 Hivesigner 可以带着交易 ID 把用户送回您的应用。签名链接既不需要应用账户，也不需要令牌。它们涵盖 Hivesigner 支持的全部 41 种操作，包括转账和其他需要活动密钥的操作。

## 签名链接如何工作 {#how-it-works}

1. 您的应用构造一个包含一个或多个操作的链接。
2. 用户打开该链接。Hivesigner 在“确认交易”界面上用平实的语言展示每个操作，并标明它需要的密钥。
3. 用户批准。Hivesigner 在浏览器中用 Hivesigner 里所选账户的密钥签署该交易，然后把它发送到 Hive 网络。
4. 当链接指定了回调地址时，Hivesigner 会带着交易 ID 把用户送到那里。

您的应用永远看不到密钥。任何网站都能创建签名链接：不需要发送 `client_id`。

## 链接形式 {#link-forms}

Hivesigner 读取两种签名链接：编码链接和旧式链接。

### 编码链接 {#encoded-links}

编码链接把操作以 JSON 形式、用 base64url 编码后携带。它采用 `hive-uri` 包的 `hive://sign/...` 格式，只是把 `hive://` 换成 `https://hivesigner.com/`。

| 形式 | `B64U` 包含什么 |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | 一个操作：`["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | 一组操作：`[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | 一整笔交易，带有它自己的头部 |

`B64U` 是那段 JSON 文本，先编码为 UTF-8，再编码为 base64，并把 `+` 换成 `-`、`/` 换成 `_`、填充符 `=` 换成 `.`。

对于 `op` 和 `ops`，Hivesigner 会围绕这些操作构造交易，并自行填入参考区块和过期时间。

对于 `tx`，Hivesigner 保留交易自带的 `ref_block_num`、`ref_block_prefix` 和 `expiration`，也保留交易已有的签名。这让多人共同掌控的账户可以由多个账户依次签署同一笔交易。若交易的 `extensions` 列表不为空，Hivesigner 会拒绝它。

> **备注：** Hivesigner 在签名前会把某些值规范化，例如金额以及保持默认值的字段。因此签署后的交易 ID 可能与您构造时的不同。请从回调地址读取 ID。

### 旧式链接 {#legacy-links}

旧式链接在路径中写明一个操作，并把它的字段放进查询串：

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- 操作名可写成 snake case（`transfer_to_vesting`）、camel case（`transferToVesting`）或 kebab case（`transfer-to-vesting`）。
- 每个字段作为同名的查询参数给出。请对每个值做 URL 编码。
- 列表和对象写成 JSON，例如 `required_posting_auths=["alice"]`。由 ID 或名称组成的列表也可以用逗号分隔：`proposal_ids=379,380`。
- 布尔值写成 `true` 或 `false`。

旧式链接只包含一个操作。需要多个时请使用编码链接。

### 字段取值 {#field-values}

以下规则适用于所有形式：

- **默认值。** 您省略的字段会取它的默认值。执行操作的账户（`voter`、`from`、`owner` 等字段）默认为签署的账户。投票的 `weight` 默认为 `10000`（100%）。
- **金额**由一个数字和一个符号组成：`1.000 HIVE`、`0.500 HBD` 或 `100.000000 VESTS`。Hivesigner 把 HIVE 和 HBD 写成 3 位小数，把 VESTS 写成 6 位。
- **Hive Power。** 接受 VESTS 的字段也接受以 HP 表示的金额，例如 `100 HP`。Hivesigner 会在用户批准之前按当前汇率把它换算成 VESTS。
- **`__signer`** 出现在任何取值中时，都会变成签署账户的名称。例如，关注用的 `custom_json` 可以在它的 `json` 中把 `__signer` 写作关注者。
- **整数**必须是链所接受区间内的整数，例如投票的 `weight` 为 `-10000` 到 `10000`。

当某个取值与它的字段不符、某个操作无法识别，或链接中根本没有操作时，Hivesigner 会拒绝整个链接。用户会看到“糟糕，出错了。提供的数据无效。”，并且不会签署任何内容。

## 参数 {#parameters}

把这些参数加到任意签名链接的查询串中：

| 参数 | 含义 |
| --- | --- |
| `cb` | 回调地址，用 base64url 编码。这正是 `hive-uri` 为它的 `callback` 选项所写入的内容。 |
| `redirect_uri` | 以普通 URL 编码文本表示的回调地址。旧式链接使用这个参数。编码链接在没有 `cb` 时也使用它。 |
| `nb` | 只签名。Hivesigner 签署交易但不广播。请在回调地址中放入 `{{sig}}` 以获取签名（参见[回调占位符](#callback-placeholders)）。任何取值都可以，空值也行（`nb=`）。 |
| `s` | 必须签署的账户。当选中的是别的账户时，Hivesigner 会请用户切换到这个账户。它不会用任何其他账户签署。 |

请使用 `https://` 的回调地址。对于不是 `http` 或 `https` 地址的回调，Hivesigner 会忽略它，并停留在自己的结果界面上。

Hivesigner 根据操作来选择密钥。没有参数可以指定密钥：在签名链接上，Hivesigner 会忽略 `authority`（以及 `hive-uri` 的 `a` 参数）。参见[链接需要哪把密钥](#which-key)。

### 回调占位符 {#callback-placeholders}

用户批准之后，Hivesigner 会在回调地址中填入这些占位符：

| 占位符 | 取值 |
| --- | --- |
| `{{id}}` | 交易 ID |
| `{{sig}}` | 签名，用于只签名（`nb`）的链接 |
| `{{block}}` | 留空 |
| `{{txn}}` | 留空 |
| `{{data}}` | 留空 |

对于完全不含这些占位符的回调地址，交易 ID 会以 `id` 的形式追加在 `?` 或 `&` 之后：

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

只要某个 Hive 节点接受了交易，Hivesigner 就会跳转。交易此时可能尚未进入区块。当您需要确认它已被打包时，请按 ID 查询它。

当网络拒绝该交易（用户会看到错误），或用户未批准就离开时，您的回调地址不会被调用。

## 构造链接 {#build-a-link}

### 使用 hive-uri {#with-hive-uri}

`hive-uri` 包（https://www.npmjs.com/package/hive-uri）把操作编码成链接。请使用 0.2.8 或更高版本，它能正确编码任意 Unicode 文本。

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

选项对象接受 `callback`（写作 `cb`）、`no_broadcast: true`（写作 `nb`）和 `signer`（写作 `s`）。`encodeTx` 对整笔交易做同样的事。

### 使用 JavaScript SDK {#with-the-sdk}

`hivesigner` 包提供 `sendOperation`、`sendOperations` 和 `sendTransaction`。它们接受与 `hive-uri` 编码函数相同的参数，并返回 `https://hivesigner.com/sign/...` 链接：

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

在 TypeScript 中，类型要求必须有第三个参数：传入 `undefined` 即可取回链接。在浏览器中，把一个函数作为第三个参数传入，会让它们在新标签页中打开链接，而不是返回链接。参见 [SDK](/docs/sdk#sign-links)。

### 无需写代码 {#signs-page}

https://hivesigner.com/signs（“签名交易”）列出所有受支持的操作，并为它们的字段提供表单。它会构造一个 `/sign/op/` 链接并打开。

## 链接需要哪把密钥 {#which-key}

每个操作需要一把密钥：发布、活动或所有者密钥。[下方的表格](#supported-operations)逐一列出。有三个操作取决于它们自身的取值：

- 当 `required_auths` 写明了账户时，`custom_json` 需要活动密钥；否则需要发布密钥。
- 当 `account_update` 设置了 `owner` 时，它需要所有者密钥；否则需要活动密钥。
- 当 `account_update2` 设置了 `owner` 时，它需要所有者密钥；设置 `active`、`posting`、`memo_key` 或 `json_metadata` 时，它需要活动密钥；只设置 `posting_json_metadata` 时，它需要发布密钥。

Hivesigner 用一把密钥签署一个链接，所以同一个链接中的所有操作必须需要同一把密钥。对于把它们混在一起的链接，Hivesigner 会拒绝签署，并告诉用户原因。请把这类操作分成不同的链接发送。

当所选账户的设备上没有那把密钥时，Hivesigner 会说明缺少哪把密钥，并提示添加。参见[缺少密钥时](/docs/signing#missing-key)。

## 用户会看到什么 {#what-the-user-sees}

- 一个标题为“确认交易”的界面，每个操作一张卡片：用平实语言写的摘要、它需要的密钥，以及它携带的取值。
- 当链接带有回调地址时，会显示“您将被重定向到 HOST。”。请使用您自己网站上的回调地址，好让用户认得这个主机。
- 当某个操作以签署者以外的账户名义行事时，会有一条警告。
- **批准**，或者对只签名的链接显示 **签名**。已锁定的账户会先索取访问码。
- 广播之后会显示“交易已成功广播”和交易 ID。随后跳转到您的回调地址。

[查看并签名](/docs/signing#confirm-screen)从用户角度描述了这个界面。

## 受支持的操作 {#supported-operations}

Hivesigner 按链上名称签署以下 41 种操作。其他一律拒绝。表中的名称就是 Hivesigner 在确认界面上显示的名称。

| 操作 | 密钥 | 名称 |
| --- | --- | --- |
| `transfer` | 活动 | 转账 |
| `recurrent_transfer` | 活动 | 定期转账 |
| `delegate_vesting_shares` | 活动 | 委托 Hive Power |
| `transfer_to_vesting` | 活动 | 增加能量（Power Up） |
| `set_withdraw_vesting_route` | 活动 | 设置 Power Down 去向 |
| `withdraw_vesting` | 活动 | 减少能量（Power Down） |
| `transfer_to_savings` | 活动 | 转入储蓄 |
| `transfer_from_savings` | 活动 | 从储蓄转出 |
| `cancel_transfer_from_savings` | 活动 | 取消从储蓄转出 |
| `convert` | 活动 | 将 HBD 转换为 HIVE |
| `collateralized_convert` | 活动 | 将 HIVE 转换为 HBD |
| `account_witness_vote` | 活动 | 见证人投票 |
| `witness_update` | 活动 | 更新见证人信息 |
| `witness_set_properties` | 活动 | 设置见证人参数 |
| `account_witness_proxy` | 活动 | 治理代理 |
| `claim_account` | 活动 | 领取账户额度 |
| `account_create` | 活动 | 创建账户 |
| `create_claimed_account` | 活动 | 使用账户额度创建账户 |
| `vote` | 发布 | 投票 |
| `limit_order_create` | 活动 | 创建限价单 |
| `limit_order_create2` | 活动 | 创建限价单 |
| `limit_order_cancel` | 活动 | 取消限价单 |
| `claim_reward_balance` | 发布 | 领取奖励 |
| `comment` | 发布 | 帖子或评论 |
| `comment_options` | 发布 | 帖子或评论选项 |
| `custom_json` | 发布；设置了 `required_auths` 时为活动 | 自定义操作 |
| `delete_comment` | 发布 | 删除评论 |
| `account_update` | 活动；设置了 `owner` 时为所有者 | 更新账户（活动） |
| `account_update2` | 按字段而定，发布、活动或所有者 | 更新账户（发布） |
| `change_recovery_account` | 所有者 | 更改恢复账户 |
| `create_proposal` | 活动 | 创建提案 |
| `remove_proposal` | 活动 | 删除提案 |
| `update_proposal_votes` | 活动 | 更新提案投票 |
| `update_proposal` | 活动 | 更新提案 |
| `escrow_transfer` | 活动 | 托管转账 |
| `escrow_approve` | 活动 | 批准托管 |
| `escrow_dispute` | 活动 | 托管争议 |
| `escrow_release` | 活动 | 释放托管资金 |
| `account_create_with_delegation` | 活动 | 通过委托创建账户 |
| `request_account_recovery` | 活动 | 请求恢复账户 |
| `recover_account` | 所有者 | 恢复账户 |
