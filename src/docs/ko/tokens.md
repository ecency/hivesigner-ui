Hivesigner 토큰은 짧은 서명된 진술입니다. Hive 계정, 그 토큰이 만들어진 앱, 서명된 시각을 가리킵니다. 여러분의 서버는 API로도, 스스로도 토큰을 확인할 수 있습니다. 이 문서는 토큰에 무엇이 들어 있는지, 얼마나 오래 쓸 수 있는지, 확인하는 두 가지 방법을 설명합니다.

## 토큰의 모양 {#format}

토큰은 base64url로 인코딩된 JSON 객체이며, 표준 base64url과 한 가지가 다릅니다. 채움 문자로 `=` 대신 `.`을 씁니다. 그래서 평범한 base64와 비교하면 `+`는 `-`가, `/`는 `_`가, `=`는 `.`이 됩니다. 모든 토큰은 `eyJzaWduZWRfbWVzc2FnZSI6`로 시작합니다.

디코딩하면 토큰 흐름의 액세스 토큰은 다음과 같습니다.

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| 필드 | 뜻 |
| --- | --- |
| `signed_message.type` | 토큰의 종류: `login`, `posting`, `code`, `refresh`. [토큰의 종류](#kinds)를 보세요. |
| `signed_message.app` | 그 토큰이 만들어진 앱 계정. 앱 계정이 없는 사이트의 로그인 토큰에는 없습니다. |
| `authors[0]` | 그 토큰이 가리키는 Hive 계정. |
| `timestamp` | 서명된 시각. 1970-01-01 UTC부터의 초입니다. |
| `signatures[0]` | 서명. 16진 문자열입니다. |
| `authority` | 브라우저에서 서명된 토큰에만 있습니다. 사용자의 어느 키가 서명했는지, `posting`인지 `active`인지를 가리킵니다. 이 필드는 서명 대상 바깥에 있습니다. 어느 키가 서명했는지 알려면 서명에서 복원하세요. |

서명은 `JSON.stringify({ signed_message, authors, timestamp })`의 sha256 해시에 대한 secp256k1 서명이며, 키의 순서도 그대로입니다.

### 토큰 디코딩하기 {#decode}

Node.js에서는:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

브라우저에서는:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

디코딩은 확인이 아닙니다. 이 모양으로 디코딩되는 문자열은 누구나 만들 수 있습니다. 믿기 전에 [토큰을 확인하세요](#check-a-token).

## 토큰의 종류 {#kinds}

| 토큰 | `type` | `app` | 서명한 주체 | 받는 곳 |
| --- | --- | --- | --- | --- |
| 액세스 토큰, 토큰 흐름 | `posting` | 여러분의 앱 | 사용자의 게시 키, 또는 Hivesigner에 그 계정의 게시 키가 없으면 활성 키 | 여러분 콜백의 `access_token` |
| 로그인 토큰, `scope=login` | `login` | 여러분의 앱 | 사용자의 게시 키 또는 활성 키 | 여러분 콜백의 `access_token` |
| 로그인 토큰, 앱 계정이 없는 사이트 | `login` | 없음 | 사용자의 게시 키 또는 활성 키 | 여러분 콜백의 `access_token` |
| 코드 | `code` | 여러분의 앱 | 사용자의 게시 키 또는 활성 키 | 여러분 콜백의 `code` |
| 액세스 토큰, 코드 흐름 | `posting` | 여러분의 앱 | @hivesigner의 게시 키 | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| 갱신 토큰 | `refresh` | 여러분의 앱 | @hivesigner의 게시 키 | [`/api/oauth2/token`](/docs/api#oauth2-token) |

코드와 갱신 토큰은 액세스 토큰이 아닙니다. 둘 중 어느 것도 로그인으로 받아들이지 마세요.

## 토큰의 유효 기간 {#lifetime}

액세스 토큰은 7일 동안 유효합니다. `expires_in`은 604800초이며 그 `timestamp`부터 셉니다. 만료되면:

- **토큰 흐름:** 사용자를 다시 로그인으로 보내세요. 이미 여러분의 앱을 승인한 사람에게는 «APP 앱에 로그인»이 보이고 한 번의 클릭이면 됩니다.
- **코드 흐름:** 서버가 갱신 토큰과 클라이언트 시크릿으로 새 액세스 토큰을 받습니다. [갱신](/docs/oauth2#refresh)을 보세요.

토큰의 `timestamp`가 7일보다 오래되면 만료된 것으로 보세요. 리디렉션 직후에 확인하는 것은 훨씬 짧은 시간만 받아들이세요. 코드는 바로 교환하세요. 로그인 토큰은 그 `timestamp`에서 몇 분 안의 것만 받아들이세요.

## 서버에서 토큰 확인하기 {#check-a-token}

브라우저나 앱이 보낸 토큰을 서버가 믿기 전에 다음을 확인하세요.

- 그 계정이나 @hivesigner가 실제로 서명했는지.
- 여러분의 앱을 위해 만들어졌는지.
- 여러분이 기대하는 종류의 토큰인지.
- 충분히 최근인지.

### API에 묻기 {#check-with-the-api}

그 토큰으로 `/api/me`를 호출합니다. 유효한 토큰이면 `user`에 계정이 돌아옵니다.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

유효하지 않은 토큰은 `invalid_grant`와 함께 `401`을 돌려줍니다. [GET /api/me](/docs/api#me)를 보세요.

`/api/me`는 서명을 확인해 줍니다. 다만 그 응답은 토큰이 어느 앱을 위해 만들어졌는지 알려 주지 않습니다. 그러니 토큰도 디코딩해 `app`, `type`, 경과 시간을 직접 확인하세요. 다른 앱을 위해 만들어진 토큰으로 여러분의 앱에 누군가를 로그인시켜서는 안 됩니다.

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

API는 앱 이름이 든 토큰만 받습니다. 앱 계정이 없는 사이트의 로그인 토큰은 [직접](#check-it-yourself) 확인하세요.

### 직접 확인하기 {#check-it-yourself}

1. 토큰을 디코딩합니다.
2. `signed_message.type`이 기대한 종류인지 확인합니다. 액세스 토큰이면 `posting`, 로그인 토큰이면 `login`입니다.
3. `signed_message.app`이 여러분의 앱 계정인지 확인합니다. 앱 계정이 없는 사이트라면 아예 없는지 확인합니다.
4. `timestamp`로 경과 시간을 확인합니다.
5. `JSON.stringify({ signed_message, authors, timestamp })`의 sha256 해시를 구합니다.
6. `signatures[0]`과 그 해시에서 공개 키를 복원합니다.
7. `authors[0]` 계정을 바로 지금 Hive 블록체인에서 읽습니다. 사용자는 키를 바꿀 수 있기 때문입니다. 복원한 키는 그 계정의 현재 게시 키나 활성 키 가운데 하나여야 합니다. `/api/oauth2/token`에서 받은 토큰은 @hivesigner가 서명하므로, 그런 토큰에는 @hivesigner 계정의 현재 게시 키를 받아들이세요.

Node.js에서 [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk)를 쓰는 경우(`@ecency/sdk/hive` 아래에 `PrivateKey`, `PublicKey`, `Signature`, `callRPC`가 있습니다):

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

다음처럼 씁니다.

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

dhive 라이브러리(`@hiveio/dhive`)로도 됩니다. 해시는 `cryptoUtils.sha256(message)`로 구하고, 키는 `Signature.fromString(signatures[0]).recover(digest).toString()`으로 복원합니다.

## 토큰을 안전하게 지키기 {#keep-tokens-safe}

게시 토큰을 가진 사람은 만료될 때까지 여러분의 앱을 통해 그 사용자로서 브로드캐스트할 수 있습니다. 비밀번호처럼 다루세요.

- **토큰은 서버에 보관하거나** httpOnly와 Secure 쿠키에 담으세요. 갱신 토큰과 클라이언트 시크릿은 서버에만 두세요.
- **기록에 남기는 URL에 토큰을 넣지 마세요.** 토큰 흐름은 콜백의 쿼리 문자열로 토큰을 전해 줍니다. 서버에서 읽은 다음, 토큰이 없는 URL로 리디렉션하세요. 콜백의 쿼리 문자열은 기록에 남기지 마세요.
- **콜백 페이지에서 다른 사이트의 것을 불러오지 마세요.** 토큰이 든 주소가 그쪽으로 전해지지 않게 하기 위해서입니다. 그 페이지의 `Referrer-Policy: no-referrer` 헤더가 도움이 됩니다.
- **토큰은 여러분의 서버와 `https://hivesigner.com/api/` 에만 보내세요.**

## 로그아웃과 접근 없애기 {#sign-out}

- **사용자를 로그아웃시킨다**는 것은 토큰을 버린다는 뜻입니다. 세션이나 쿠키에서 지우세요. 사용자가 로그아웃했다고 Hivesigner에 알리려면 [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke)를 호출해도 됩니다. 그래도 토큰은 앱이 직접 버립니다.
- **앱의 접근을 영영 끊는 것**은 사용자의 선택입니다. https://hivesigner.com/authorized-apps 나 `https://hivesigner.com/revoke/APP` 에서, 사용자는 자신의 게시 권한에서 여러분의 앱 계정을 온체인으로 없앱니다. 그 뒤로 API는 여러분의 앱을 통해 그 사용자를 대신해 브로드캐스트하지 않습니다.
