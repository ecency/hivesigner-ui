A sign link opens a Hive transaction in Hivesigner. The user reviews it, approves it with their own key and Hivesigner broadcasts it from their browser. Hivesigner can then send the user back to your app with the transaction id. Sign links need no app account and no token. They cover all 41 operations Hivesigner supports, including transfers and other actions that need the active key.

## How a sign link works {#how-it-works}

1. Your app builds a link that holds one or more operations.
2. The user opens the link. Hivesigner shows each operation in plain words on the "Confirm transaction" screen, with the key it needs.
3. The user approves. Hivesigner signs the transaction in the browser with the key of the account selected in Hivesigner. Then it sends the transaction to the Hive network.
4. When the link names a callback, Hivesigner sends the user there with the transaction id.

Your app never sees a key. Any site can create a sign link: there is no `client_id` to send.

## Link forms {#link-forms}

Hivesigner reads two kinds of sign links: encoded links and legacy links.

### Encoded links {#encoded-links}

An encoded link carries the operations as JSON, encoded in base64url. It uses the `hive://sign/...` format of the `hive-uri` package, with `hive://` replaced by `https://hivesigner.com/`.

| Form | What `B64U` holds |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | One operation: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | A list of operations: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | A whole transaction, with its own header |

`B64U` is the JSON text, encoded as UTF-8, then as base64 with `+` replaced by `-`, `/` by `_` and the `=` padding by `.`.

For `op` and `ops`, Hivesigner builds the transaction around the operations. It fills in the reference block and the expiration.

For `tx`, Hivesigner keeps the transaction's own `ref_block_num`, `ref_block_prefix` and `expiration`. It also keeps the signatures the transaction already carries. This lets several accounts sign one transaction in turn, for an account that several people control. Hivesigner refuses a transaction whose `extensions` list is not empty.

> **Note:** Hivesigner normalizes some values before it signs, such as amounts and fields left at their defaults. The signed transaction can then have a different id than the one you built. Read the id from the callback.

### Legacy links {#legacy-links}

A legacy link names one operation in the path and puts its fields in the query:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Write the operation name in snake case (`transfer_to_vesting`), camel case (`transferToVesting`) or kebab case (`transfer-to-vesting`).
- Give each field as a query parameter with the field's name. URL-encode every value.
- Write lists and objects as JSON, for example `required_posting_auths=["alice"]`. A list of ids or names can also be separated by commas: `proposal_ids=379,380`.
- Write booleans as `true` or `false`.

A legacy link holds one operation. Use an encoded link for more than one.

### Field values {#field-values}

These rules apply to every form:

- **Defaults.** A field you leave out takes its default. The account that acts (`voter`, `from`, `owner` and similar fields) defaults to the account that signs. A vote's `weight` defaults to `10000` (100%).
- **Amounts** are a number and a symbol: `1.000 HIVE`, `0.500 HBD` or `100.000000 VESTS`. Hivesigner writes HIVE and HBD with 3 decimals and VESTS with 6.
- **Hive Power.** A field that takes VESTS also accepts an amount in HP, such as `100 HP`. Hivesigner converts it to VESTS at the current rate before the user can approve.
- **`__signer`** anywhere in a value becomes the name of the account that signs. For example, a follow `custom_json` can name `__signer` as the follower inside its `json`.
- **Integers** must be whole numbers inside the range the chain accepts, such as `-10000` to `10000` for a vote's `weight`.

Hivesigner refuses the whole link when a value does not fit its field, when an operation is unknown or when the link holds no operation. The user sees "Oops, something went wrong. The provided data is invalid." and nothing is signed.

## Parameters {#parameters}

Add these to the query string of any sign link:

| Parameter | Meaning |
| --- | --- |
| `cb` | The callback URL, encoded in base64url. This is what `hive-uri` writes for its `callback` option. |
| `redirect_uri` | The callback URL as plain URL-encoded text. Legacy links use this one. An encoded link uses it when it has no `cb`. |
| `nb` | Sign only. Hivesigner signs the transaction without broadcasting it. Put `{{sig}}` in the callback to receive the signature (see [Callback placeholders](#callback-placeholders)). Any value works, even an empty one (`nb=`). |
| `s` | The account that must sign. When another account is selected, Hivesigner asks the user to switch to this one. It does not sign with any other account. |

Use an `https://` callback. Hivesigner ignores a callback that is not an `http` or `https` URL and then stays on its own result screen.

Hivesigner chooses the key from the operations. There is no parameter to choose it: Hivesigner ignores `authority` (and the `a` parameter of `hive-uri`) on sign links. See [Which key a link needs](#which-key).

### Callback placeholders {#callback-placeholders}

After the user approves, Hivesigner fills these placeholders in the callback:

| Placeholder | Value |
| --- | --- |
| `{{id}}` | The transaction id |
| `{{sig}}` | The signature, for a sign-only (`nb`) link |
| `{{block}}` | Left empty |
| `{{txn}}` | Left empty |
| `{{data}}` | Left empty |

A callback with none of these placeholders gets the transaction id added as `id`, after `?` or `&`:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner redirects as soon as a Hive node accepts the transaction. The transaction may not be in a block yet. Look it up by its id when you need to know that it was included.

Your callback is not called when the network rejects the transaction (the user sees the error) or when the user leaves without approving.

## Build a link {#build-a-link}

### With hive-uri {#with-hive-uri}

The `hive-uri` package (https://www.npmjs.com/package/hive-uri) encodes operations into links. Use version 0.2.8 or later, which encodes any Unicode text correctly.

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

The options object takes `callback` (written as `cb`), `no_broadcast: true` (written as `nb`) and `signer` (written as `s`). `encodeTx` does the same for a whole transaction.

### With the JavaScript SDK {#with-the-sdk}

The `hivesigner` package has `sendOperation`, `sendOperations` and `sendTransaction`. They take the same arguments as the `hive-uri` encoders and return the `https://hivesigner.com/sign/...` link:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

In TypeScript the types require the third argument: pass `undefined` to get the link back. In a browser, a function passed as the third argument makes them open the link in a new tab instead of returning it. See [SDKs](/docs/sdk#sign-links).

### Without code {#signs-page}

https://hivesigner.com/signs ("Sign transaction") lists every supported operation with a form for its fields. It builds an `/sign/op/` link and opens it.

## Which key a link needs {#which-key}

Each operation needs one key: posting, active or owner. The [table below](#supported-operations) lists them. Three operations depend on their values:

- `custom_json` needs the active key when `required_auths` names an account. Otherwise it needs the posting key.
- `account_update` needs the owner key when it sets `owner`. Otherwise it needs the active key.
- `account_update2` needs the owner key when it sets `owner`. It needs the active key when it sets `active`, `posting`, `memo_key` or `json_metadata`. With only `posting_json_metadata`, it needs the posting key.

Hivesigner signs a link with a single key, so all operations in one link must need the same key. Hivesigner refuses to sign a link that mixes them and tells the user why. Send such operations in separate links.

When the selected account does not have the key on the device, Hivesigner says which key is missing and offers to add it. See [When the key is missing](/docs/signing#missing-key).

## What the user sees {#what-the-user-sees}

- A screen titled "Confirm transaction", with one card for each operation: a summary in plain words, the key it needs and the values it carries.
- "You will be redirected to HOST." when the link has a callback. Use a callback on your own site, so that users recognize the host.
- A warning when an operation acts as another account than the one that signs.
- **Approve**, or **Sign** for a sign-only link. A locked account asks for its passcode first.
- After a broadcast, "Transaction broadcast successfully" with the transaction id. Then the redirect to your callback.

[Review and sign](/docs/signing#confirm-screen) describes the screen for users.

## Supported operations {#supported-operations}

Hivesigner signs these 41 operations, by their chain names. Anything else is refused. The name is the one Hivesigner shows on the confirm screen.

| Operation | Key | Name |
| --- | --- | --- |
| `transfer` | Active | Transfer |
| `recurrent_transfer` | Active | Recurring transfer |
| `delegate_vesting_shares` | Active | Delegate Hive Power |
| `transfer_to_vesting` | Active | Power up |
| `set_withdraw_vesting_route` | Active | Set power down route |
| `withdraw_vesting` | Active | Power down |
| `transfer_to_savings` | Active | Transfer to savings |
| `transfer_from_savings` | Active | Transfer from savings |
| `cancel_transfer_from_savings` | Active | Cancel transfer from savings |
| `convert` | Active | Convert HBD to HIVE |
| `collateralized_convert` | Active | Convert HIVE to HBD |
| `account_witness_vote` | Active | Witness vote |
| `witness_update` | Active | Witness update |
| `witness_set_properties` | Active | Witness set properties |
| `account_witness_proxy` | Active | Governance proxy |
| `claim_account` | Active | Claim account |
| `account_create` | Active | Create account |
| `create_claimed_account` | Active | Create account with account credits |
| `vote` | Posting | Vote |
| `limit_order_create` | Active | Create limit order |
| `limit_order_create2` | Active | Create limit order |
| `limit_order_cancel` | Active | Cancel limit order |
| `claim_reward_balance` | Posting | Redeem rewards |
| `comment` | Posting | Post or comment |
| `comment_options` | Posting | Post or comment options |
| `custom_json` | Posting, or active when `required_auths` is set | Custom operation |
| `delete_comment` | Posting | Delete comment |
| `account_update` | Active, or owner when `owner` is set | Update account (active) |
| `account_update2` | Posting, active or owner, by field | Update account (posting) |
| `change_recovery_account` | Owner | Change recovery account |
| `create_proposal` | Active | Create proposal |
| `remove_proposal` | Active | Remove proposal |
| `update_proposal_votes` | Active | Update proposal votes |
| `update_proposal` | Active | Update proposal |
| `escrow_transfer` | Active | Escrow transfer |
| `escrow_approve` | Active | Escrow approve |
| `escrow_dispute` | Active | Escrow dispute |
| `escrow_release` | Active | Escrow release |
| `account_create_with_delegation` | Active | Create account with delegation |
| `request_account_recovery` | Active | Request account recovery |
| `recover_account` | Owner | Recover account |
