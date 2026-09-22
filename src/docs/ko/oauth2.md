사람들을 여러분의 앱에 로그인시키려면 Hivesigner로 보내세요. 사용자는 거기서 여러분의 요청을 살펴보고 승인합니다. 그다음 Hivesigner는 토큰(토큰 흐름)이나, 서버가 토큰으로 바꾸는 코드(코드 흐름)와 함께 사용자를 여러분의 콜백으로 돌려보냅니다. 이 문서는 두 흐름과 모든 매개변수, 권한 범위를 다룹니다.

## 시작하기 전에 {#before-you-start}

- 앱을 등록하세요. 앱을 위한 Hive 계정을 만들고 콜백을 등록합니다. [앱 등록하기](/docs/register-app)를 보세요.
- API로 브로드캐스트하려면 앱 계정이 [@hivesigner에 게시 권한도 주어야](/docs/register-app#grant-hivesigner) 합니다.
- 코드 흐름에는 [클라이언트 시크릿](/docs/register-app#client-secret)을 설정하세요.

## 승인 URL {#authorize-url}

사용자를 다음 주소로 보냅니다.

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

모든 값을 URL 인코딩하세요. `URLSearchParams`가 대신 해 줍니다.

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### 매개변수 {#parameters}

| 매개변수 | 필수 | 하는 일 |
| --- | --- | --- |
| `client_id` | 앱이라면 필수 | 여러분의 앱 계정 이름입니다. `clientId`도 읽습니다. 이것이 없으면 그 요청은 앱 계정이 없는 사이트의 로그인 전용 요청이 됩니다. [게시 접근 없는 로그인](/docs/login-only)을 보세요. |
| `redirect_uri` | 필수 | Hivesigner가 사용자를 돌려보낼 곳입니다. 여러분 앱의 리디렉션 URI 가운데 하나와 정확히 같아야 합니다. [콜백](/docs/register-app#callbacks)을 보세요. |
| `scope` | 선택 | `login`, `posting`, `offline` 가운데 하나입니다. [권한 범위](#scopes)를 보세요. 없으면 요청은 게시 접근을 구합니다. |
| `response_type` | 선택 | `code`는 [코드 흐름](#code-flow)을 시작합니다. 다른 값이거나 없으면 [토큰 흐름](#token-flow)입니다. |
| `state` | 권장 | Hivesigner가 그대로 돌려주는 무작위 값입니다. [state로 요청 지키기](#state)를 보세요. |
| `account` | 선택 | Hive 사용자 이름입니다. 그 계정이 사용자의 기기에 있으면 Hivesigner가 그것을 고릅니다. 없으면 무시합니다. `select_account`도 읽습니다. |

사용자는 동의 화면에서 다른 계정으로 바꿀 수 있습니다. 계정은 언제나 토큰이나 코드 교환에서 가져오세요. 여러분이 요청한 값에서 가져오면 안 됩니다.

## 권한 범위 {#scopes}

Hive에는 게시 권한이 하나뿐입니다. 그래서 Hivesigner의 접근 수준은 로그인 전용과 게시, 두 가지이며 그 사이에 더 세밀한 단계는 없습니다.

| `scope` | 사용자가 승인하는 것 | 흐름 | 액세스 토큰의 `type` |
| --- | --- | --- | --- |
| `login` | «계정 사용자 이름 보기». 아무것도 주어지지 않습니다. | 토큰 흐름(`response_type=code`를 붙이지 마세요) | `login` |
| `posting` | 게시 접근. 처음에는 여러분의 앱 계정을 사용자의 게시 권한에 추가합니다. | 토큰 흐름, 또는 `response_type=code`를 붙인 코드 흐름 | `posting` |
| `offline` | 게시 접근(위와 같음) | 코드 흐름 | `posting`, `refresh` 토큰과 함께 |

코드 흐름에서는 콜백이 먼저 코드(`type`이 `code`인 토큰)를 받고, 서버가 그것을 액세스 토큰으로 바꿉니다.

- **범위를 주지 않으면** `posting`입니다.
- **어디든 `offline`이 들어간 값**은 `offline`을 뜻합니다. 예를 들어 예전의 `offline,vote,comment`입니다.
- **그 밖의 값**은 `posting`을 뜻합니다. `vote`, `comment`, `vote,comment`, `comment_options`, `custom_json` 같은 예전 작업 이름도 여기에 들어갑니다. 이런 값이 토큰을 제한하지는 않습니다. 모든 게시 토큰은 같은 작업을 허용합니다. [broadcast가 받는 것](/docs/api#broadcast-rules)을 보세요.

앱이 사용자가 누구인지만 알면 된다면 `login`을 요청하세요. [게시 접근 없는 로그인](/docs/login-only)을 보세요.

## 토큰 흐름 {#token-flow}

사용자의 브라우저가 액세스 토큰을 바로 받습니다. 앱에 시크릿은 필요 없습니다.

1. 사용자를 승인 URL로 보냅니다.

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. 사용자가 승인합니다. Hivesigner가 여러분의 콜백으로 보냅니다.

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   콜백에 쿼리가 없으면 Hivesigner는 `?`로, 있으면 `&`로 자신의 매개변수를 붙입니다. `state`는 비어 있지 않은 값을 보냈을 때만 붙습니다.

3. 콜백에서 먼저 [`state`를 맞춰 보세요](#state). 그다음 서버에서 [토큰을 확인하세요](/docs/tokens#check-a-token). 그 토큰이 가리키는 계정은 토큰 안에 있습니다. URL은 누구나 고칠 수 있으니 `username` 매개변수만 믿지 마세요.
4. 토큰은 서버나 httpOnly 쿠키에 보관하세요. 주소창에서 토큰이 사라지도록 깨끗한 URL로 보내세요.
5. `expires_in`초(7일) 뒤 만료될 때까지 토큰을 [API](/docs/api)와 함께 쓰세요. 만료되면 사용자를 다시 승인 URL로 보냅니다. 이미 게시 접근을 준 사람에게는 «APP 앱에 로그인»과 «이미 @myapp 앱을 승인했습니다. 새로 부여되는 권한은 없습니다.»이 보입니다.

## 코드 흐름 {#code-flow}

서버가 코드를 받아 액세스 토큰과 갱신 토큰으로 바꿉니다. 그 뒤에는 사용자 없이도 새로 받을 수 있습니다. 서버가 오랫동안 사용자를 대신해 동작할 때 쓰세요.

1. 사용자를 `scope=offline`과 함께 승인 URL로 보냅니다.

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code`도 같은 일을 합니다.

2. 사용자가 게시 접근을 승인합니다. Hivesigner가 여러분의 콜백으로 보냅니다.

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [`state`를 맞춰 봅니다](#state). 그다음 서버에서 곧바로 코드를 교환합니다.

### 코드 교환하기 {#exchange-code}

코드와 클라이언트 시크릿을 POST 요청의 본문에 담아 `/api/oauth2/token`으로 보냅니다.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

응답:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Node.js 18 이상에서 같은 호출:

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- 코드와 시크릿은 요청 본문에 넣으세요. URL에는 절대 넣지 마세요.
- 이 요청에는 `Authorization` 헤더를 붙이지 마세요.
- 이 응답의 `username`을 쓰세요. 사용자가 서명한 코드에서 나온 값입니다.
- 액세스 토큰과 갱신 토큰은 서버에 보관하세요.

### 갱신 {#refresh}

액세스 토큰이 만료되면 갱신 토큰을 클라이언트 시크릿과 함께 같은 엔드포인트로 보냅니다.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

응답의 모양은 같고, 새 액세스 토큰과 새 갱신 토큰이 들어 있습니다. 둘 다 예전 것 대신 보관하세요.

## state로 요청 지키기 {#state}

`state`가 없으면 다른 사이트가 자기가 고른 토큰이나 코드와 함께 여러분의 사용자를 콜백으로 보낼 수 있습니다. 그러면 여러분의 앱은 사용자를 남의 계정으로 로그인시키게 됩니다. `state`는 돌아오는 모든 요청을 로그인을 시작한 그 브라우저와 묶어 줍니다.

1. 로그인마다 무작위 값을 만듭니다. 적어도 16바이트의 무작위 값이어야 합니다. 16진으로 두면 인코딩이 필요한 문자가 들어가지 않습니다.
2. 그 브라우저만 다시 내놓을 수 있는 곳에 저장합니다. 서버의 세션이나, `SameSite=Lax`를 붙인 수명 짧은 httpOnly와 Secure 쿠키입니다.
3. 승인 URL에 `state`로 보냅니다.
4. 콜백에서 `state` 매개변수를 저장해 둔 값과 맞춰 봅니다. 없거나 다르면 멈추세요. 토큰도 코드도 쓰지 마세요.
5. 저장해 둔 값을 지웁니다. 그래야 각 값이 한 번만 쓰입니다.

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner는 받은 것과 같은 `state` 값을 돌려줍니다. 빈 값은 돌려주지 않습니다.

## 사용자에게 보이는 것 {#what-the-user-sees}

동의 화면에는 여러분 앱의 그림과 이름, «Hive 계정 @myapp», «이동할 주소: HOST»가 나옵니다. HOST는 여러분의 콜백에서 가져옵니다. 이어서:

- **첫 게시 요청.** 제목은 «APP 앱에서 회원님의 계정에 대한 접근을 요청합니다.»입니다. **권한 범위** 카드에 앱이 할 수 있게 되는 일이 나열됩니다. 알림으로 «최초 승인: @myapp 계정을 온체인에서 회원님의 게시 권한에 추가하므로 활성 키가 한 번 필요합니다. 회원님이 권한을 취소할 때까지 해당 계정은 회원님으로서 글을 게시할 수 있습니다.»이 나옵니다. 버튼은 **승인**입니다. 사용자의 기기에 그 계정의 활성 키가 없으면 화면에서 바로 물어봅니다.
- **로그인.** `scope=login`이거나 사용자가 이미 준 게시 접근이라면, 제목은 «APP 앱에 로그인», 버튼은 **로그인**입니다.
- **계정.** «승인에 사용할 계정» 또는 «로그인할 계정»과 함께 고른 계정이 나옵니다. 여기서 계정을 바꿀 수 있습니다.
- **잠긴 계정.** 버튼 위에 암호 입력란이 나옵니다. 한 번 누르면 잠금이 풀리고 이어집니다.
- **기기에 계정이 없을 때.** 버튼은 **계속**입니다. 계정 추가 화면을 열고 그다음 요청으로 돌아옵니다.

첫 게시 요청 뒤에 Hivesigner는 새 허용이 체인에서 보일 때까지 기다렸다가 리디렉션합니다. 몇 초가 걸릴 수 있습니다. 사용자 쪽에서 본 화면 전체는 [앱에 로그인하기](/docs/signing-in)를 보세요.

## 취소와 거절된 요청 {#cancel}

- **취소.** 사용자는 Hivesigner의 계정 목록으로 갑니다. 여러분의 콜백으로는 아무것도 보내지 않으며 오류 매개변수도 없습니다. 사용자가 다시 시작할 수 있도록 로그인 버튼을 그대로 두세요. 돌아오기를 기다리지 마세요.
- **거절된 요청.** 등록되지 않은 콜백, 알 수 없는 `client_id`, 빠진 `redirect_uri`는 Hivesigner에서 오류와 **이 문제 신고하기** 버튼을 띄웁니다. 여러분의 콜백으로는 아무것도 보내지 않습니다. [무언가 잘못되었을 때 사용자에게 보이는 것](/docs/register-app#refused-requests)을 보세요.

## 예전 로그인 요청 URL {#legacy-login-request}

Hivesigner는 예전 로그인 URL도 아직 받아들입니다. 오래된 연동을 위해 남겨 둔 것입니다. 새로 만들 때는 `/oauth2/authorize`를 쓰세요.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

같은 동의 화면을 열고, 콜백 확인도 리디렉션도 같습니다. 다만 매개변수를 다르게 읽습니다.

- `scope`는 `login`이나 `posting`입니다. 다른 값이거나 없으면 `login`을 뜻합니다.
- `offline`은 읽지 않습니다. 코드 흐름에는 `response_type=code`를 붙이세요.
- `account`는 읽지 않습니다.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` 도 같은 규칙을 따릅니다.
