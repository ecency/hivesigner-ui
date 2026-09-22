어떤 앱은 Hive에서 그 사람이 누구인지만 알면 됩니다. 그런 앱은 사용자를 대신해 글을 쓰거나 투표하거나 무언가를 브로드캐스트하지 않습니다. Hivesigner는 게시 권한을 전혀 쓰지 않고도 그런 앱에 사람들을 로그인시킬 수 있습니다. 사용자는 Hive 계정을 관리한다는 것을 증명하고, 여러분의 앱은 그 이름을 알게 됩니다. 이 문서는 두 가지 방법과 결과를 안전하게 확인하는 방법을 설명합니다.

## 두 가지 방법 {#two-ways}

- **앱 계정이 있는 경우:** 여러분의 앱에 자체 Hive 계정이 있고 `scope=login`을 요청합니다. 토큰에는 여러분의 앱 이름이 들어갑니다.
- **앱 계정이 없는 경우:** 자체 Hive 계정이 없는 사이트는 `redirect_uri`만 보냅니다. 토큰에는 앱 이름이 없습니다. 사이트가 직접 확인합니다.

둘 다 사용자나 여러분의 앱 계정으로부터 어떤 허용도 필요하지 않으므로, 사용자의 계정에는 아무것도 바뀌지 않습니다. Hivesigner는 게시 키로 로그인에 서명하며, 기기에 그 계정의 게시 키가 없으면 활성 키로 서명합니다.

## 앱 계정이 있는 경우 {#app-account}

1. [앱을 등록합니다](/docs/register-app). Hive 계정을 만들고 콜백을 등록하세요. 클라이언트 시크릿도 @hivesigner에 대한 허용도 필요 없습니다.
2. 사용자를 다음 주소로 보냅니다.

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. 사용자에게 «APP 앱에 로그인»이 **권한 범위** «계정 사용자 이름 보기»과 함께 보입니다. 사용자는 **로그인**을 고릅니다.
4. Hivesigner가 여러분의 콜백으로 보냅니다.

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [`state`를 맞춰 보고](/docs/oauth2#state) 토큰을 확인합니다. 여러분의 앱 이름이 든 `login` 토큰이므로 다음 중 어느 쪽이든 됩니다.
   - 이것으로 [`GET /api/me`](/docs/api#me)를 호출하면 `user`에 계정이, `scope`에 `["login"]`이 돌아옵니다. 그다음 토큰을 디코딩해 `type`과 `app`을 확인합니다([API에 묻기](/docs/tokens#check-with-the-api)).
   - 또는 `type: 'login'`과 여러분의 앱 이름으로 [직접 확인합니다](/docs/tokens#check-it-yourself).

`login` 토큰으로는 브로드캐스트할 수 없습니다. `/api/broadcast`는 그 토큰으로 보낸 모든 작업을 거절합니다.

## 앱 계정이 없는 경우 {#no-app-account}

1. 사용자를 `redirect_uri`와 함께, `client_id` 없이 승인 URL로 보냅니다.

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   콜백은 `https://`이거나 루프백의 `http://`(`localhost`, `127.0.0.1`, `[::1]`)여야 합니다. 등록할 목록은 없습니다. 여기서 Hivesigner는 `scope`와 `response_type`을 무시합니다. 응답은 언제나 로그인 토큰입니다.

2. 사용자에게 «HOST 사이트에서 회원님의 Hive 사용자 이름 확인을 요청합니다.»가 보입니다. 여기서 HOST는 여러분 콜백의 호스트입니다. 사용자는 **로그인**을 고릅니다.
3. Hivesigner가 여러분의 콜백으로 보냅니다.

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [`state`를 맞춰 본](/docs/oauth2#state) 다음 토큰을 직접 확인합니다. API는 앱 이름이 없는 토큰을 받지 않으므로, 여러분의 서버가 서명을 계정의 키와 맞춰 봐야 합니다. [직접 확인하기](/docs/tokens#check-it-yourself)를 `type: 'login'`으로, `app` 없이 보세요.

콜백이 웹 주소가 아니거나 루프백 밖의 평범한 `http://`이면, Hivesigner는 요청을 거절하고 그 이유를 사용자에게 알립니다.

## 어느 쪽을 쓸까 {#which-one}

| | 앱 계정이 있는 경우 | 앱 계정이 없는 경우 |
| --- | --- | --- |
| 사용자에게 보이는 것 | 여러분 앱의 이름, 그림, Hive 계정 | 여러분 사이트의 호스트만 |
| 준비 | 콜백을 등록한 Hive 계정 | 없음 |
| 토큰이 가리키는 것 | 여러분의 앱 | 앱 없음 |
| 토큰 확인 방법 | `/api/me` 또는 직접 만든 코드 | 직접 만든 코드 |
| 나중에 게시 접근으로 | 같은 계정으로 `posting`을 요청하고 [@hivesigner에 허용](/docs/register-app#grant-hivesigner) | 먼저 앱 계정이 필요 |

가능하면 앱 계정을 쓰세요. 사용자에게 여러분 앱의 이름과 그림이 보입니다. 서버는 다른 앱을 위해 만들어진 토큰을 거절할 수 있습니다. 나중에 같은 계정으로 게시 접근으로 옮겨 갈 수 있습니다.

사이트에 Hive 계정이 없고 만들 생각도 없다면 두 번째 방법을 쓰세요.

## 로그인을 안전하게 확인하기 {#check-safely}

- **`state`로 요청을 묶습니다.** 로그인마다 무작위 값을 만들어 사용자 세션에 저장하고, 콜백에서 맞춰 보고, 한 번만 씁니다. [state로 요청 지키기](/docs/oauth2#state)를 보세요.
- **종류를 확인합니다.** `signed_message.type`이 `login`인 것만 받으세요. 코드나 갱신 토큰은 로그인이 아닙니다.
- **앱을 확인합니다.** 앱 계정이 있으면 `signed_message.app`이 여러분의 앱이어야 합니다. 없으면 `app` 자체가 없어야 합니다.
- **경과 시간을 확인합니다.** 토큰은 리디렉션 직후에 확인하므로, 그 `timestamp`에서 몇 분 안의 것만 받으세요(예를 들어 시계 차이 1분을 감안해 5분).
- **토큰은 한 번만 씁니다.** 확인에 성공하면 자체 세션을 시작하고(예를 들어 httpOnly 쿠키) Hivesigner 토큰은 버리세요. 받아들인 토큰은 경과 시간 확인을 통과하지 못할 만큼 오래될 때까지 기록해 두세요. 다시 보이는 토큰은 거절하세요.
- **토큰을 기록에 남기지 마세요.** 토큰은 콜백의 쿼리 문자열로 도착합니다. [토큰을 안전하게 지키기](/docs/tokens#keep-tokens-safe)를 보세요.

## 예시 {#examples}

https://hivesearcher.com 과 https://openhive.chat 같은 사이트는 검색이나 채팅처럼 체인 밖에 머무는 기능을 위해 Hive 계정으로 로그인하게 합니다. 그 사람이 누구인지만 알면 되고 그 이상은 필요하지 않습니다.
