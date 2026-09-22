서명 링크는 Hive 거래를 Hivesigner에서 엽니다. 사용자가 그것을 살펴보고 자신의 키로 승인하면, Hivesigner가 그 브라우저에서 브로드캐스트합니다. 그다음 Hivesigner는 거래 ID와 함께 사용자를 여러분의 앱으로 돌려보낼 수 있습니다. 서명 링크에는 앱 계정도 토큰도 필요 없습니다. Hivesigner가 다루는 41가지 작업을 모두 담을 수 있으며, 송금과 활성 키가 필요한 다른 동작도 들어갑니다.

## 서명 링크의 동작 방식 {#how-it-works}

1. 여러분의 앱이 하나 이상의 작업을 담은 링크를 만듭니다.
2. 사용자가 그 링크를 엽니다. Hivesigner는 «거래 확인» 화면에서 각 작업을 쉬운 말로, 필요한 키와 함께 보여 줍니다.
3. 사용자가 승인합니다. Hivesigner는 Hivesigner에서 고른 계정의 키로 브라우저 안에서 거래에 서명합니다. 그다음 거래를 Hive 네트워크로 보냅니다.
4. 링크에 콜백이 적혀 있으면 Hivesigner는 거래 ID와 함께 사용자를 그곳으로 보냅니다.

여러분의 앱이 키를 보는 일은 없습니다. 어느 사이트든 서명 링크를 만들 수 있습니다. 보낼 `client_id`도 없습니다.

## 링크의 형태 {#link-forms}

Hivesigner는 두 종류의 서명 링크를 읽습니다. 인코딩된 링크와 예전 링크입니다.

### 인코딩된 링크 {#encoded-links}

인코딩된 링크는 작업을 JSON으로 담아 base64url로 인코딩합니다. `hive-uri` 패키지의 `hive://sign/...` 형식을 쓰되, `hive://` 대신 `https://hivesigner.com/`을 씁니다.

| 형태 | `B64U`에 담기는 것 |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | 작업 하나: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | 작업 목록: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | 거래 전체(자체 헤더 포함) |

`B64U`는 JSON 텍스트를 UTF-8로 인코딩한 다음 base64로 바꾼 것입니다. `+`는 `-`로, `/`는 `_`로, 채움 문자 `=`는 `.`으로 바꿉니다.

`op`와 `ops`에서는 Hivesigner가 작업을 감싸 거래를 만듭니다. 참조 블록과 만료 시각도 채웁니다.

`tx`에서는 거래 자체의 `ref_block_num`, `ref_block_prefix`, `expiration`을 그대로 둡니다. 이미 붙어 있는 서명도 그대로 둡니다. 그래서 여러 사람이 관리하는 계정을 위해 여러 계정이 차례로 한 거래에 서명할 수 있습니다. `extensions` 목록이 비어 있지 않은 거래는 거절합니다.

> **참고:** Hivesigner는 서명 전에 일부 값을 고르게 맞춥니다. 금액이나 기본값 그대로 둔 필드 같은 것입니다. 그래서 서명된 거래의 ID가 여러분이 만든 것과 다를 수 있습니다. ID는 콜백에서 읽으세요.

### 예전 링크 {#legacy-links}

예전 링크는 경로에 작업 하나를 적고 그 필드를 쿼리에 담습니다.

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- 작업 이름은 스네이크 케이스(`transfer_to_vesting`), 카멜 케이스(`transferToVesting`), 케밥 케이스(`transfer-to-vesting`) 가운데 무엇으로 써도 됩니다.
- 각 필드는 그 필드 이름의 쿼리 매개변수로 넘깁니다. 모든 값을 URL 인코딩하세요.
- 목록과 객체는 JSON으로 씁니다. 예를 들어 `required_posting_auths=["alice"]`입니다. ID나 이름의 목록은 쉼표로 나눠도 됩니다. `proposal_ids=379,380`처럼 씁니다.
- 참/거짓은 `true`나 `false`로 씁니다.

예전 링크에는 작업 하나만 담깁니다. 둘 이상이면 인코딩된 링크를 쓰세요.

### 필드 값 {#field-values}

다음 규칙은 모든 형태에 적용됩니다.

- **기본값.** 빼놓은 필드는 기본값을 씁니다. 동작하는 계정(`voter`, `from`, `owner` 같은 필드)의 기본값은 서명하는 계정입니다. 투표의 `weight` 기본값은 `10000`(100%)입니다.
- **금액**은 숫자와 기호입니다. `1.000 HIVE`, `0.500 HBD`, `100.000000 VESTS`처럼 씁니다. Hivesigner는 HIVE와 HBD를 소수점 아래 3자리, VESTS를 6자리로 씁니다.
- **Hive Power.** VESTS를 받는 필드는 `100 HP`처럼 HP 단위 금액도 받습니다. Hivesigner는 사용자가 승인하기 전에 그때의 환율로 VESTS로 바꿉니다.
- **`__signer`**는 어떤 값 안에 있든 서명하는 계정 이름으로 바뀝니다. 예를 들어 팔로우의 `custom_json`은 `json` 안에서 팔로우하는 쪽으로 `__signer`를 적을 수 있습니다.
- **정수**는 체인이 받는 범위 안의 정수여야 합니다. 예를 들어 투표의 `weight`는 `-10000`부터 `10000`까지입니다.

값이 필드에 맞지 않거나, 모르는 작업이거나, 링크에 작업이 하나도 없으면 Hivesigner는 링크 전체를 거절합니다. 사용자에게는 «문제가 발생했습니다. 제공된 데이터가 올바르지 않습니다.»이 보이고 아무것도 서명되지 않습니다.

## 매개변수 {#parameters}

다음을 어떤 서명 링크의 쿼리 문자열에든 붙일 수 있습니다.

| 매개변수 | 뜻 |
| --- | --- |
| `cb` | 콜백 URL을 base64url로 인코딩한 것입니다. `hive-uri`의 `callback` 옵션이 이것을 씁니다. |
| `redirect_uri` | 콜백 URL을 URL 인코딩한 평범한 텍스트로 적은 것입니다. 예전 링크는 이것을 씁니다. 인코딩된 링크는 `cb`가 없을 때 이것을 씁니다. |
| `nb` | 서명만 합니다. Hivesigner는 브로드캐스트하지 않고 거래에 서명합니다. 서명을 받으려면 콜백에 `{{sig}}`를 넣으세요([콜백의 자리 표시자](#callback-placeholders) 참고). 값은 무엇이든, 비어 있어도 됩니다(`nb=`). |
| `s` | 서명해야 하는 계정입니다. 다른 계정이 골라져 있으면 Hivesigner는 사용자에게 이 계정으로 바꾸라고 합니다. 다른 계정으로는 서명하지 않습니다. |

콜백은 `https://`를 쓰세요. `http`도 `https`도 아닌 URL의 콜백은 무시되며, Hivesigner는 자신의 결과 화면에 그대로 머무릅니다.

Hivesigner는 작업을 보고 키를 정합니다. 키를 고르는 매개변수는 없습니다. 서명 링크에서는 `authority`(그리고 `hive-uri`의 `a` 매개변수)를 무시합니다. [링크에 필요한 키](#which-key)를 보세요.

### 콜백의 자리 표시자 {#callback-placeholders}

사용자가 승인한 뒤 Hivesigner는 콜백의 다음 자리 표시자를 채웁니다.

| 자리 표시자 | 값 |
| --- | --- |
| `{{id}}` | 거래 ID |
| `{{sig}}` | 서명. 서명만 하는(`nb`) 링크에 씁니다 |
| `{{block}}` | 비워 둡니다 |
| `{{txn}}` | 비워 둡니다 |
| `{{data}}` | 비워 둡니다 |

자리 표시자가 하나도 없는 콜백에는 `?`나 `&` 뒤에 `id`로 거래 ID가 붙습니다.

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner는 Hive 노드가 거래를 받아들이는 즉시 리디렉션합니다. 그때 거래가 아직 블록에 들어가지 않았을 수 있습니다. 블록에 들어갔는지 알아야 한다면 ID로 찾아보세요.

네트워크가 거래를 거절했을 때(사용자에게 오류가 보입니다)나 사용자가 승인하지 않고 떠났을 때는 콜백이 호출되지 않습니다.

## 링크 만들기 {#build-a-link}

### hive-uri로 {#with-hive-uri}

`hive-uri` 패키지(https://www.npmjs.com/package/hive-uri)는 작업을 링크로 인코딩합니다. 어떤 유니코드 텍스트도 제대로 인코딩하는 0.2.8 이상을 쓰세요.

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

옵션 객체는 `callback`(`cb`로 적힘), `no_broadcast: true`(`nb`로 적힘), `signer`(`s`로 적힘)를 받습니다. 거래 전체에는 `encodeTx`가 같은 일을 합니다.

### JavaScript SDK로 {#with-the-sdk}

`hivesigner` 패키지에는 `sendOperation`, `sendOperations`, `sendTransaction`이 있습니다. `hive-uri`의 인코더와 같은 인자를 받고 `https://hivesigner.com/sign/...` 링크를 돌려줍니다.

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

TypeScript에서는 타입이 세 번째 인자를 요구합니다. 링크를 받으려면 `undefined`를 넘기세요. 브라우저에서 세 번째 인자로 함수를 넘기면 링크를 돌려주는 대신 새 탭에서 엽니다. [SDK](/docs/sdk#sign-links)를 보세요.

### 코드 없이 {#signs-page}

https://hivesigner.com/signs(«거래 서명»)는 지원하는 모든 작업을 그 필드 입력란과 함께 보여 줍니다. `/sign/op/` 링크를 만들어 엽니다.

## 링크에 필요한 키 {#which-key}

각 작업에는 키가 하나 필요합니다. 게시 키, 활성 키, 소유자 키 가운데 하나입니다. [아래 표](#supported-operations)에 정리되어 있습니다. 세 가지 작업은 값에 따라 달라집니다.

- `custom_json`은 `required_auths`에 계정 이름이 있으면 활성 키가 필요합니다. 없으면 게시 키입니다.
- `account_update`는 `owner`를 설정하면 소유자 키가 필요합니다. 아니면 활성 키입니다.
- `account_update2`는 `owner`를 설정하면 소유자 키가 필요합니다. `active`, `posting`, `memo_key`, `json_metadata`를 설정하면 활성 키입니다. `posting_json_metadata`만 있으면 게시 키입니다.

Hivesigner는 한 링크를 한 키로 서명하므로, 한 링크의 모든 작업이 같은 키를 필요로 해야 합니다. 서로 다른 키가 섞인 링크는 서명을 거절하고 그 이유를 사용자에게 알립니다. 그런 작업은 링크를 나눠 보내세요.

고른 계정의 키가 기기에 없으면 Hivesigner는 어떤 키가 없는지 알리고 추가할 수 있게 해 줍니다. [키가 없을 때](/docs/signing#missing-key)를 보세요.

## 사용자에게 보이는 것 {#what-the-user-sees}

- «거래 확인» 제목의 화면. 작업마다 카드가 하나씩 나오며, 쉬운 말로 된 요약, 필요한 키, 담긴 값이 들어 있습니다.
- 링크에 콜백이 있으면 «HOST 주소로 리디렉션됩니다.». 사용자가 호스트를 알아볼 수 있도록 자기 사이트의 콜백을 쓰세요.
- 서명하는 계정과 다른 계정으로 동작하는 작업이 있으면 경고.
- **승인**, 서명만 하는 링크에서는 **서명**. 잠긴 계정은 먼저 암호를 묻습니다.
- 브로드캐스트한 뒤에는 «거래가 브로드캐스트되었습니다»과 거래 ID. 그다음 여러분의 콜백으로 리디렉션합니다.

[확인하고 서명하기](/docs/signing#confirm-screen)에서 이 화면을 사용자 눈높이로 설명합니다.

## 지원하는 작업 {#supported-operations}

Hivesigner는 다음 41가지 작업을 체인에서 쓰는 이름으로 서명합니다. 그 밖의 것은 거절됩니다. 이름은 Hivesigner가 확인 화면에서 보여 주는 것입니다.

| 작업 | 키 | 이름 |
| --- | --- | --- |
| `transfer` | 활성 | 송금 |
| `recurrent_transfer` | 활성 | 정기 송금 |
| `delegate_vesting_shares` | 활성 | Hive Power 위임 |
| `transfer_to_vesting` | 활성 | 파워업 |
| `set_withdraw_vesting_route` | 활성 | 파워다운 경로 설정 |
| `withdraw_vesting` | 활성 | 파워다운 |
| `transfer_to_savings` | 활성 | 저축으로 이체 |
| `transfer_from_savings` | 활성 | 저축에서 이체 |
| `cancel_transfer_from_savings` | 활성 | 저축에서 이체 취소 |
| `convert` | 활성 | HBD를 HIVE로 전환 |
| `collateralized_convert` | 활성 | HIVE를 HBD로 전환 |
| `account_witness_vote` | 활성 | 증인 투표 |
| `witness_update` | 활성 | 증인 정보 업데이트 |
| `witness_set_properties` | 활성 | 증인 속성 설정 |
| `account_witness_proxy` | 활성 | 거버넌스 프록시 |
| `claim_account` | 활성 | 계정 크레딧 청구 |
| `account_create` | 활성 | 계정 생성 |
| `create_claimed_account` | 활성 | 계정 크레딧으로 계정 생성 |
| `vote` | 게시 | 투표 |
| `limit_order_create` | 활성 | 지정가 주문 생성 |
| `limit_order_create2` | 활성 | 지정가 주문 생성 |
| `limit_order_cancel` | 활성 | 지정가 주문 취소 |
| `claim_reward_balance` | 게시 | 보상 수령 |
| `comment` | 게시 | 글 또는 댓글 |
| `comment_options` | 게시 | 글 또는 댓글 옵션 |
| `custom_json` | 게시, `required_auths`가 있으면 활성 | 사용자 지정 작업 |
| `delete_comment` | 게시 | 댓글 삭제 |
| `account_update` | 활성, `owner`를 설정하면 소유자 | 계정 업데이트(활성) |
| `account_update2` | 게시, 활성, 소유자 가운데 필드에 따라 | 계정 업데이트(게시) |
| `change_recovery_account` | 소유자 | 복구 계정 변경 |
| `create_proposal` | 활성 | 제안 생성 |
| `remove_proposal` | 활성 | 제안 삭제 |
| `update_proposal_votes` | 활성 | 제안 투표 업데이트 |
| `update_proposal` | 활성 | 제안 업데이트 |
| `escrow_transfer` | 활성 | 에스크로 송금 |
| `escrow_approve` | 활성 | 에스크로 승인 |
| `escrow_dispute` | 활성 | 에스크로 분쟁 |
| `escrow_release` | 활성 | 에스크로 해제 |
| `account_create_with_delegation` | 활성 | 위임과 함께 계정 생성 |
| `request_account_recovery` | 활성 | 계정 복구 요청 |
| `recover_account` | 소유자 | 계정 복구 |
