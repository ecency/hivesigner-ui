공식 JavaScript SDK는 로그인 URL과 서명 링크를 만들고 Hivesigner API를 대신 호출해 줍니다. Python에는 커뮤니티 라이브러리가 있습니다. 다른 언어에서는 [REST API](/docs/api)를 직접 호출하면 됩니다.

## JavaScript SDK {#javascript}

SDK는 npm 패키지 `hivesigner`입니다. 소스는 https://github.com/ecency/hivesigner-sdk 에 있습니다. TypeScript로 쓰였고 타입 정의도 함께 들어 있습니다.

버전 4는 내장 `fetch`를 쓰므로 Node.js 18 이상이 필요합니다. 브라우저에서는 ES2017 이상이 필요합니다. 전역 `fetch`가 없는 환경에서는 SDK를 쓰기 전에 polyfill을 넣으세요. 더 오래된 Node.js에서는 버전 3을 그대로 쓰세요.

### 설치 {#install}

```bash
npm install hivesigner
```

빌드 과정이 없는 페이지에서는 브라우저용 번들을 읽어 들이세요. 전역 `hivesigner`가 만들어집니다.

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### 클라이언트 만들기 {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| 옵션 | 뜻 |
| --- | --- |
| `app` | 여러분의 앱 계정. `client_id`로 보내집니다. |
| `callbackURL` | Hivesigner가 사용자를 돌려보낼 곳입니다. 여러분 앱의 콜백 가운데 하나와 한 글자도 빠짐없이 같아야 합니다(평범한 http의 루프백 콜백은 호스트와 포트가 달라도 됩니다. [콜백](/docs/register-app#callback-rules) 참고). |
| `scope` | 배열입니다. 쉼표로 이어 `scope` 매개변수가 됩니다. [권한 범위](/docs/oauth2#scopes)를 보세요. |
| `responseType` | 코드 흐름에서는 `'code'`. 토큰 흐름에서는 넣지 마세요. |
| `accessToken` | 이미 가지고 있다면 사용자의 액세스 토큰. |
| `apiURL` | API의 출처입니다. SDK가 거기에 `/api/`를 붙입니다. 기본값은 `https://hivesigner.com`입니다. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken`, `setApiURL`로 나중에 바꿀 수 있습니다. 모두 클라이언트를 돌려줍니다.

### 사용자를 로그인시키기 {#sign-in}

`getLoginURL(state, account)`은 로그인 URL을 돌려줍니다.

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state`는 그대로 콜백으로 돌아옵니다. 응답을 요청과 묶는 데 쓰세요.
- `account`는 선택이며 사용자 이름입니다. 그 계정이 기기에 있으면 Hivesigner가 고르고, 없으면 무시합니다.

브라우저에서 `client.login({ state: 'STATE' })`는 계정을 지정하지 않고 같은 URL로 사용자를 보냅니다.

토큰 흐름에서는 콜백이 `access_token`, `expires_in`, `username`을 받습니다. 토큰을 클라이언트에 넘기세요.

```js
client.setAccessToken('ACCESS_TOKEN');
```

코드 흐름의 교환을 위한 메서드는 SDK에 없습니다. [코드 교환하기](/docs/oauth2#exchange-code)가 보여 주듯, 서버가 직접 코드와 클라이언트 시크릿을 API로 보냅니다.

### 사용자 가져오기 {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account`는 체인이 돌려주는 형태의 그 사용자의 Hive 계정입니다. `scope`는 토큰이 허용하는 것을 알려 줍니다.

### 브로드캐스트 {#broadcast}

`broadcast(operations)`는 작업을 API로 보내고, API가 사용자를 대신해 브로드캐스트합니다. API가 받는 것은 토큰의 사용자가 작성한 게시 관련 작업뿐입니다. `vote`, `comment`, `delete_comment`, `comment_options`, 게시 권한의 `custom_json`, `claim_reward_balance`, 프로필 메타데이터를 위한 `account_update2`입니다. [broadcast가 받는 것](/docs/api#broadcast-rules)을 보세요.

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

모든 작업에 사용자 이름을 넣으세요. API는 `__signer`를 바꿔 주지 않습니다.

다음 보조 메서드는 각각 작업 하나를 만들어 `broadcast`를 호출합니다.

| 메서드 | 브로드캐스트하는 것 |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight`는 `-10000`부터 `10000`(100%)까지입니다. |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. 새 글이면 `parentAuthor`는 `''`입니다. `jsonMetadata`는 객체여도 되며 SDK가 문자열로 바꿔 줍니다. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. `requiredAuths`에 `[]`, `requiredPostingAuths`에 `['USERNAME']`을 넘기세요. `json`은 문자열입니다. |
| `reblog(account, author, permlink)` | id가 `follow`인 `custom_json`. 글을 다시 공유합니다 |
| `follow(follower, following)` | id가 `follow`인 `custom_json`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | id가 `follow`인 `custom_json`, `what: []` |
| `ignore(follower, following)` | id가 `follow`인 `custom_json`, `what: ['ignore']`(뮤트) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. 금액은 `'0.000 HIVE'`, `'0.000 HBD'`, `'1.000000 VESTS'` 같은 문자열입니다. |

`updateUserMetadata()`는 더 이상 쓰지 않습니다. 사용자의 프로필을 바꾸려면 새 `posting_json_metadata`와 함께 `account_update2`를 브로드캐스트하세요.

### 로그아웃 {#log-out}

`revokeToken()`이 SDK의 로그아웃 호출입니다. 토큰을 API의 취소 엔드포인트로 보낸 뒤 클라이언트에서 없앱니다. 호출이 실패하면 직접 `removeAccessToken()`을 호출하세요. 앱이 저장해 둔 곳에서도 토큰을 지우세요.

앱의 접근을 영영 끝내려면 사용자가 https://hivesigner.com/authorized-apps 에서 없앱니다. [앱의 접근을 보고 없애기](/docs/signing-in#remove-access)를 보세요.

### 서명 링크 {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)`, `sendTransaction(tx, params)`는 `https://hivesigner.com/sign/...` 링크를 돌려줍니다. `params`는 `callback`, `no_broadcast`, `signer`를 받습니다. [서명 링크](/docs/sign-links)를 보세요.

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

TypeScript에서는 타입이 세 번째 인자를 요구합니다. 링크를 받으려면 `undefined`를 넘기세요.

브라우저에서 세 번째 인자로 함수를 넘기면 링크를 새 탭에서 엽니다. 그 함수는 호출되지 않고 돌려주는 값도 없습니다. 클릭 처리기에서 호출하세요. 그러지 않으면 브라우저가 새 탭을 막고 호출이 오류를 낼 수 있습니다.

### 프로미스와 콜백 {#promises-and-callbacks}

`me`, `broadcast`, 보조 메서드, `revokeToken`은 프로미스를 돌려줍니다. 마지막 인자로 함수를 넘기면 대신 콜백을 쓸 수 있습니다. 그 함수는 `(error, result)`를 받습니다.

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

API가 오류로 답하면 프로미스는 API의 오류 본문 `{ error, error_description }`으로 거부됩니다. 콜백을 쓰면 그 본문이 `error` 인자가 됩니다. 응답이 JSON이 아니면 파싱 오류로 거부됩니다.

## Python {#python}

다음 라이브러리는 커뮤니티의 것입니다. Hivesigner 팀이 아니라 각 작성자가 관리합니다. 의지하기 전에 [REST API](/docs/api)와 맞춰 보세요.

| 라이브러리 | 작성자 |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem의 `beem.hivesigner` 모듈: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
