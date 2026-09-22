여러분의 앱은 사용자에게 게시 키나 활성 키로 텍스트 메시지에 서명해 달라고 요청할 수 있습니다. 서명은 그 사람이 계정을 관리한다는 것을 증명합니다. 아무것도 브로드캐스트되지 않으며 메시지가 블록체인에 올라가지도 않습니다. Hivesigner는 Hive Keychain의 `requestSignBuffer`와 같은 방식으로 서명하므로, Keychain의 서명을 확인하는 서버 코드로 Hivesigner의 서명도 확인할 수 있습니다.

## 서명 요청하기 {#request}

사용자를 다음 쿼리 매개변수와 함께 `https://hivesigner.com/sign-buffer` 로 보냅니다.

| 매개변수 | 필수 | 뜻 |
| --- | --- | --- |
| `message` | 필수 | 서명할 정확한 텍스트입니다. 공백만 있어서는 안 됩니다. |
| `redirect_uri` | 필수 | Hivesigner가 결과를 보낼 곳입니다. [콜백 규칙](#callback-rules)을 보세요. |
| `authority` | 선택 | `posting` 또는 `active`입니다. 대소문자는 가리지 않습니다(`Posting`도 됩니다). 없거나 비어 있으면 `posting`입니다. 그 밖의 값은 거절됩니다. |
| `client_id` | 선택 | 여러분의 앱 계정입니다. `clientId`도 읽습니다. 이것을 붙이면 `redirect_uri`가 여러분 앱의 콜백 가운데 하나여야 합니다. |
| `state` | 선택 | 아무 값이나 됩니다. Hivesigner가 그대로 돌려줍니다. |
| `account` | 선택 | 서명하리라 기대하는 계정입니다. 기기에 있으면 Hivesigner가 그것을 고르고, 없으면 무시합니다. `select_account`도 읽습니다. |

URL은 `URLSearchParams`로 만드세요. 모든 값이 인코딩됩니다.

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

### 콜백 규칙 {#callback-rules}

- 콜백은 `https://`여야 합니다. 평범한 `http://`는 루프백에서만 됩니다. `localhost`, `127.0.0.1`, `[::1]`입니다.
- **`client_id`가 있으면** 콜백이 그 앱 계정에 등록되어 있어야 하며, 확인 방식은 로그인과 같습니다. [콜백](/docs/register-app#callback-rules)을 보세요. Hivesigner는 요청이 열릴 때 Hive에서 앱의 콜백을 읽고, 다 읽기 전에는 아무것도 서명하지 않습니다. Hive에 닿지 못하면 사용자에게 **다시 시도** 버튼이 나옵니다.
- **`client_id`가 없으면** 첫 규칙을 지키는 콜백이면 무엇이든 됩니다. 그때 Hivesigner는 콜백의 호스트를 요청한 쪽으로 표시합니다. 예를 들어 «HOST에서 메시지 서명을 요청합니다.»처럼 나옵니다.

앱 계정이 있으면 `client_id`를 보내세요. 그러면 사용자에게 여러분 앱의 이름과 계정이 보입니다. 서명을 받을 수 있는 것은 등록된 콜백뿐입니다.

Hivesigner는 메시지가 없는 요청, 알 수 없는 `authority`, 빠졌거나 쓸 수 없는 콜백, Hive 계정이 아닌 `client_id`, 그 앱에 등록되지 않은 콜백을 거절합니다. 사용자에게는 «이 서명 요청은 사용할 수 없습니다. 메시지, 게시 키 또는 활성 키, 그리고 앱에 등록된 안전한 리디렉션 URL이 필요합니다. 사이트로 돌아가 다시 시도하세요.»와 **이 문제 신고하기** 버튼이 보입니다.

### 사용자에게 보이는 것 {#what-the-user-sees}

- 여러분의 앱 이름(또는 콜백의 호스트)과 «이동할 주소: HOST»가 든 제목.
- 서명될 그대로의 메시지 전체. 텍스트를 감추거나 방향을 바꿀 수 있는 문자는 `\u{200B}` 같은 코드로 보여 줍니다.
- «게시 키로 서명됩니다» 또는 «활성 키로 서명됩니다».
- 경고: «서명은 이를 보는 누구에게나 @USERNAME 계정이 바로 이 텍스트에 서명했음을 증명합니다. 이해한 메시지에만 서명하세요.»
- **서명**과 **취소**. 잠긴 계정은 먼저 암호를 묻습니다.

[메시지 서명 요청](/docs/signing#message-requests)에서 이 화면을 사용자 눈높이로 설명합니다.

## 콜백이 받는 것 {#callback}

사용자가 **서명**을 고르면 Hivesigner는 다음 쿼리 매개변수와 함께 사용자를 여러분의 콜백으로 보냅니다.

| 매개변수 | 값 |
| --- | --- |
| `signature` | 서명. 130자의 16진 문자열입니다 |
| `public_key` | 서명한 키의 공개 키. `STM...` 같은 형태입니다 |
| `username` | 서명한 계정 |
| `authority` | `posting` 또는 `active` |
| `state` | 여러분의 `state`. 요청에 있었다면 돌아옵니다(빈 값도 포함) |

Hivesigner는 이것들을 콜백의 쿼리에, `?`나 `&` 뒤 그리고 `#fragment` 앞에 붙입니다. 여러분 자신의 쿼리는 그대로 남습니다.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

사용자가 **취소**을 고르면 Hivesigner는 계정 목록을 엽니다. 콜백에는 아무것도 오지 않습니다.

> **경고:** 누구나 지어낸 값으로 여러분의 콜백을 열 수 있습니다. 서버가 서명을 확인하기 전까지 모든 매개변수를 주장일 뿐이라고 여기세요.

## 서명 검증하기 {#verify}

서명은 서버에서 확인하세요.

1. 요청했던 메시지를 그 `state`와 함께 서버에 보관해 두세요. 브라우저에서 돌아온 사본을 믿지 마세요.
2. 메시지의 해시를 구합니다. UTF-8 바이트에 대한 sha256입니다.
3. 서명과 그 해시에서 공개 키를 복원합니다.
4. Hive에서 계정을 읽어 옵니다. 복원한 키가 여러분이 요청한 권한에 속하고, 혼자서도 서명할 만큼의 가중치를 가지는지 확인합니다.
5. `state`가 여러분이 발급한 것인지 확인합니다. 각 메시지는 한 번만 받아들이세요.

다음 예시는 dhive(https://www.npmjs.com/package/@hiveio/dhive)를 씁니다.

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

같은 확인이 Hive Keychain의 `requestSignBuffer` 서명에도 통합니다. 비교 대상은 직접 복원한 키입니다. 콜백의 `public_key`는 참고일 뿐입니다.

## Hivesigner가 서명하지 않는 메시지 {#refused-messages}

`signed_message` 키가 든 JSON 객체인 메시지는 Hivesigner 토큰과 같은 모양입니다. 거기에 서명하면 요청한 쪽에 사용자의 계정에 대한 접근을 주게 됩니다. Hivesigner는 그런 메시지에 절대 서명하지 않습니다. 사용자에게는 «이 메시지는 Hivesigner 토큰입니다. 서명하면 사이트에 회원님의 계정에 대한 접근 권한을 주게 되므로 서명할 수 없습니다.»라고 알립니다.

평범한 텍스트나, `signed_message` 키가 없는 JSON을 쓰세요. 서명이 무엇을 위한 것인지 밝히고, 한 번만 만드는 값을 덧붙이세요. 예를 들면 다음과 같습니다.

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## 메시지 서명 도구 {#sign-message-tool}

사용자는 https://hivesigner.com/signmessage (**메시지 서명**)에서 직접 메시지에 서명할 수도 있고, https://hivesigner.com/verifymessage (**메시지 검증**)에서 서명을 확인할 수도 있습니다. [직접 메시지에 서명하기](/docs/signing#sign-message)를 보세요.

이 도구의 서명 방식은 `/sign-buffer`와 다릅니다. 메시지, 계정, 시각이 든 Hivesigner 토큰 본체에 서명하고, 그 결과를 **검증 토큰**으로 공유합니다. 그런 토큰은 **메시지 검증** 페이지에서 확인하거나 [직접 확인하기](/docs/tokens#check-it-yourself)에 적힌 방법으로 확인하세요. 위의 코드로는 확인할 수 없습니다.
