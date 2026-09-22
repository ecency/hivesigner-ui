Hivesigner의 API는 `https://hivesigner.com/api/` 에 있습니다. 로그인한 사용자의 계정을 돌려주고, 그 사용자를 대신해 게시 관련 작업을 브로드캐스트하며, 코드를 토큰으로 바꾸고, Hivesigner를 쓰는 앱 목록을 제공합니다. 이 문서는 각 엔드포인트를 요청, 응답, 오류와 함께 설명합니다.

## 요청과 인증 {#authentication}

- **기본 URL:** `https://hivesigner.com/api/`. 아래의 모든 엔드포인트는 `https://hivesigner.com` 기준의 상대 경로입니다.
- **토큰:** `Authorization` 헤더에 그대로 담아 보냅니다. `Authorization: ACCESS_TOKEN` 형태입니다. 앞에 `Bearer `를 붙여도 됩니다. 쿼리 문자열이나 본문에 `access_token`으로 보낼 수도 있지만, 헤더에 담으면 URL과 기록에 남지 않습니다.
- **본문:** `Content-Type: application/json`을 붙인 JSON이나 폼(`application/x-www-form-urlencoded`)입니다.
- **응답:** JSON입니다.
- **브라우저:** API는 교차 출처 요청을 허용하므로 웹 앱에서 바로 호출할 수 있습니다.

토큰을 받는 방법은 [OAuth2로 로그인](/docs/oauth2)을, 토큰의 내용은 [토큰](/docs/tokens)을 보세요.

## 오류 {#errors}

오류 응답은 HTTP 오류 상태와 다음 본문을 가집니다.

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| 상태 | `error` | 언제 |
| --- | --- | --- |
| 401 | `invalid_grant` | 토큰이 없거나 유효하지 않거나, 이 엔드포인트에 맞지 않는 종류입니다("The token has invalid role"). `/api/oauth2/token`에서는 "The code or secret is not valid"도 있습니다. |
| 401 | `invalid_scope` | `/api/broadcast`: 토큰이 허용하지 않는 작업입니다. 설명에 그 작업 이름이 나옵니다. |
| 401 | `unauthorized_client` | `/api/broadcast`: 작성자가 토큰의 사용자가 아닌 작업, 키를 건드리는 `account_update2`, 게시 권한 허용이 없는 경우, 또는 계정을 읽지 못한 경우입니다. 어느 쪽인지는 설명에 나옵니다. |
| 500 | `server_error` | `/api/broadcast`: Hive 네트워크가 거래를 거절했습니다. `error_description`에 네트워크의 메시지가 들어 있습니다. |
| 503 | `unavailable` | `/api/apps`: 목록을 아직 만드는 중입니다. |

## GET /api/me {#me}

토큰이 가리키는 계정을 돌려줍니다. 누가 로그인했는지 알아볼 때나 [토큰을 확인할 때](/docs/tokens#check-with-the-api) 쓰세요.

- **메서드:** `GET` 또는 `POST`.
- **토큰:** 액세스 토큰. 앱 이름이 든 `login` 토큰도 됩니다.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

응답(줄인 것):

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| 필드 | 뜻 |
| --- | --- |
| `user` | 토큰이 가리키는 Hive 사용자 이름. `_id`와 `name`도 같은 값입니다. |
| `account` | 계정 전체. Hive의 `condenser_api.get_accounts`가 돌려주는 그대로입니다. |
| `scope` | 토큰이 허용하는 것. 로그인 토큰이면 `["login"]`, 그 밖에는 `/api/broadcast`가 받는 작업들입니다. |
| `user_metadata` | 계정의 프로필 메타데이터. JSON에서 읽은 것입니다. |

`/api/me`는 토큰이 어느 앱을 위해 만들어졌는지 알려 주지 않습니다. 그것을 확인하려면 토큰을 디코딩하세요. [API에 묻기](/docs/tokens#check-with-the-api)를 보세요.

## POST /api/broadcast {#broadcast}

토큰이 가리키는 사용자의 게시 관련 작업을 @hivesigner의 게시 키로 서명해 Hive에 브로드캐스트합니다.

- **메서드:** `POST`.
- **토큰:** `posting` 액세스 토큰. 토큰 흐름이든 코드 흐름이든 상관없습니다.
- **동작하려면:** 사용자가 여러분의 앱 계정에 게시 권한을 주었고(동의 화면이 합니다), 여러분의 앱 계정이 [@hivesigner에 게시 권한을 주었어야](/docs/register-app#grant-hivesigner) 합니다.
- **본문:** `{ "operations": [...] }` 형태이며, 각 작업은 Hive 블록체인과 같은 `[name, fields]` 꼴입니다. 한 요청의 모든 작업은 하나의 거래에 들어갑니다.

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

curl로 보내는 같은 요청:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

팔로우는 `custom_json` 작업입니다.

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

Hive 노드가 거래를 받아들이는 즉시 API가 답합니다. `result.id`가 거래 ID입니다.

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

네트워크가 거래를 거절하면 응답은 `server_error`와 함께 `500`입니다. `error_description`에는 네트워크의 메시지가, `response`에는 가공되지 않은 오류가 들어 있습니다.

### broadcast가 받는 것 {#broadcast-rules}

게시 토큰으로 API가 브로드캐스트할 수 있는 작업은 다음뿐입니다. 각 작업에서 토큰의 사용자가 표시된 필드의 계정이어야 합니다.

| 작업 | 토큰의 사용자가 들어갈 자리 |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | `required_posting_auths`의 첫 계정 |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **그 밖의 작업**은 `invalid_scope`로 거절됩니다. `login` 토큰으로는 어떤 작업도 할 수 없습니다.
- **다른 계정을 위한 작업**은 `unauthorized_client`로 거절됩니다. 토큰은 언제나 자기 사용자를 위해서만 브로드캐스트합니다.
- **`account_update2`**로 바꿀 수 있는 것은 계정의 메타데이터뿐입니다. `owner`, `active`, `posting` 필드가 있는 작업은 `unauthorized_client`로 거절됩니다.
- **`custom_json`**: `required_auths`는 비워 두세요. API는 게시 권한으로 서명하므로, 활성 권한이 필요한 작업은 네트워크에서 실패합니다.

송금과 그 밖의 지갑 작업에는 사용자의 활성 키가 필요합니다. 그런 작업은 [서명 링크](/docs/sign-links)로 보내세요.

## POST /api/oauth2/token {#oauth2-token}

코드를 토큰으로, 또는 갱신 토큰을 새 토큰으로 바꿉니다. 서버에서만 호출하세요. [코드 흐름](/docs/oauth2#code-flow)을 보세요.

- **메서드:** `POST`. 값은 본문에 넣습니다.
- **본문:** `code`와 `client_secret`, 또는 `refresh_token`과 `client_secret`.
- **헤더:** `Authorization` 헤더를 붙이지 마세요.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

호출할 때마다 새 액세스 토큰과 새 갱신 토큰이 돌아옵니다. 둘 다 @hivesigner가 서명합니다. `expires_in`은 액세스 토큰의 수명이며 초 단위입니다(7일).

오류: `401 invalid_grant`. 보낸 값이 유효한 코드도 갱신 토큰도 아니면 설명은 "The token has invalid role"입니다. 코드나 시크릿이 맞지 않으면 "The code or secret is not valid"입니다.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

사용자가 여러분의 앱에서 로그아웃했다고 Hivesigner에 알립니다. 토큰은 앱이 직접 버립니다.

- **메서드:** `POST`.
- **토큰:** 액세스 토큰을 `Authorization` 헤더에 넣습니다.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

JavaScript SDK의 `revokeToken()`이 이 호출을 하고 나서 토큰을 잊습니다. 앱의 접근을 영영 없애려면 사용자가 https://hivesigner.com/authorized-apps 에서 없앱니다. [로그아웃과 접근 없애기](/docs/tokens#sign-out)를 보세요.

## GET /api/apps {#apps}

공개 앱 목록입니다. Hivesigner로 브로드캐스트하는 앱을 쓰는 사람 수 순서로 보여 줍니다. 토큰은 필요 없습니다. https://hivesigner.com/apps 도 같은 목록을 보여 줍니다.

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| 필드 | 뜻 |
| --- | --- |
| `updated_at` | 목록을 마지막으로 만든 때입니다. |
| `building` | 첫 생성에 데이터가 들어올 때까지 `true`입니다. 그동안 `apps`는 비어 있습니다. |
| `window_days` | 순위가 다루는 날수입니다. |
| `featured` | 먼저 보여 주는 사용자 이름을 그 순서대로 담습니다. |
| `apps[].username` | 앱 계정입니다. |
| `apps[].name`, `about` | 앱 계정의 프로필에서 가져옵니다. 없으면 `null`입니다. |
| `apps[].website` | 프로필의 웹사이트. 자기 도메인에서 응답할 때만 들어갑니다. 아니면 `null`입니다. |
| `apps[].site` | 웹사이트 확인 결과입니다. `ok`, `no_website`, `invalid`, `redirected`, `blocked`, `unreachable` 가운데 하나입니다. `redirected` 항목에는 `redirects_to`도 있습니다. |
| `apps[].users` | 하루 단위의 서로 다른 사용자 수를 기간 전체로 더한 값입니다. |
| `apps[].requests` | 그 기간에 그 앱을 위해 성공한 API 요청 수입니다. |
| `apps[].first_seen`, `last_seen` | Hivesigner가 그 앱을 처음 기록한 날과 마지막으로 쓰인 날입니다. 없으면 `null`입니다. |
| `apps[].new` | 그 앱이 기간 안에서 처음 나타났으면 `true`입니다. |

응답은 최대 5분 동안 캐시될 수 있습니다. 목록이 처음 만들어지기 전에는 API가 `unavailable`과 함께 `503`을 돌려줍니다. 나중에 다시 시도하세요.

이름과 설명은 각 앱 계정이 직접 게시한 것입니다. Hivesigner는 그 가운데 어느 것도 확인하지 않습니다.
