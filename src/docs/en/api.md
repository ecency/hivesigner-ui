The Hivesigner API is at `https://hivesigner.com/api/`. It returns the signed-in user's account, broadcasts posting operations for them, exchanges codes for tokens and lists the apps that use Hivesigner. This page describes each endpoint with its requests, answers and errors.

## Requests and authentication {#authentication}

- **Base URL:** `https://hivesigner.com/api/`. Every endpoint below is relative to `https://hivesigner.com`.
- **The token:** send it as the `Authorization` header, as it is: `Authorization: ACCESS_TOKEN`. A `Bearer ` prefix is accepted too. You can also send it as `access_token` in the query string or in the body, but the header keeps it out of URLs and logs.
- **Bodies:** JSON with `Content-Type: application/json`, or a form (`application/x-www-form-urlencoded`).
- **Answers:** JSON.
- **Browsers:** the API allows cross-origin requests, so a web app can call it directly.

To get a token, see [Sign in with OAuth2](/docs/oauth2). For what a token contains, see [Tokens](/docs/tokens).

## Errors {#errors}

An error answer has an HTTP error status and this body:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Status | `error` | When |
| --- | --- | --- |
| 401 | `invalid_grant` | The token is missing or not valid, or it is the wrong kind for this endpoint ("The token has invalid role"). On `/api/oauth2/token`, also "The code or secret is not valid". |
| 401 | `invalid_scope` | `/api/broadcast`: an operation the token does not allow. The description names the operations. |
| 401 | `unauthorized_client` | `/api/broadcast`: an operation not authored by the token's user, an `account_update2` that touches keys, a missing posting authority grant or an account that could not be loaded. The description says which. |
| 500 | `server_error` | `/api/broadcast`: the Hive network refused the transaction. `error_description` carries its message. |
| 503 | `unavailable` | `/api/apps`: the directory is still being built. |

## GET /api/me {#me}

Returns the account the token is for. Use it to learn who signed in, or to [check a token](/docs/tokens#check-with-the-api).

- **Methods:** `GET` or `POST`.
- **Token:** an access token, including a `login` token that names an app.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

The answer, shortened:

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

| Field | Meaning |
| --- | --- |
| `user` | The Hive username the token is for. `_id` and `name` repeat it. |
| `account` | The whole account, as Hive's `condenser_api.get_accounts` returns it. |
| `scope` | What the token allows: `["login"]` for a sign-in token, otherwise the operations that `/api/broadcast` accepts. |
| `user_metadata` | The account's profile metadata, parsed from JSON. |

`/api/me` does not name the app the token was made for. To check that, decode the token: see [Ask the API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Signs posting operations for the token's user with the @hivesigner posting key and broadcasts them to Hive.

- **Method:** `POST`.
- **Token:** a `posting` access token, from the token flow or the code flow.
- **Before it works:** the user has granted your app account posting authority (the consent screen does this) and your app account has [granted @hivesigner posting authority](/docs/register-app#grant-hivesigner).
- **Body:** `{ "operations": [...] }`, where each operation is `[name, fields]` as on the Hive blockchain. All operations in one request go into one transaction.

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

The same request with curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

A follow is a `custom_json` operation:

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

The API answers once a Hive node has accepted the transaction. `result.id` is the transaction id:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

When the network refuses the transaction, the answer is `500` with `server_error`. Its `error_description` carries the network's message and `response` carries the raw error.

### What broadcast accepts {#broadcast-rules}

A posting token lets the API broadcast these operations and no others. In each one, the token's user must be the account in the field shown:

| Operation | The token's user must be |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | The first account in `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Another operation** is refused with `invalid_scope`. A `login` token allows no operation at all.
- **An operation for another account** is refused with `unauthorized_client`. A token only ever broadcasts for its own user.
- **`account_update2`** can change the account's metadata only. An operation with an `owner`, `active` or `posting` field is refused with `unauthorized_client`.
- **`custom_json`**: leave `required_auths` empty. The API signs with posting authority, so an operation that needs active authority fails on the network.

Transfers and other wallet operations need the user's active key. Send them as [sign links](/docs/sign-links) instead.

## POST /api/oauth2/token {#oauth2-token}

Exchanges a code for tokens, or a refresh token for new tokens. Call it from your server only. See [The code flow](/docs/oauth2#code-flow).

- **Method:** `POST`, with the values in the body.
- **Body:** `code` and `client_secret`, or `refresh_token` and `client_secret`.
- **Headers:** send no `Authorization` header.

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

Each call returns a new access token and a new refresh token. Both are signed by @hivesigner. `expires_in` is the access token's lifetime in seconds (7 days).

Errors: `401 invalid_grant`. The description is "The token has invalid role" when the value sent is not a valid code or refresh token. It is "The code or secret is not valid" when the code or the secret does not match.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Tells Hivesigner that the user signed out of your app. Your app discards the token itself.

- **Method:** `POST`.
- **Token:** the access token, in the `Authorization` header.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

The JavaScript SDK's `revokeToken()` makes this call and then forgets the token. To remove your app's access for good, the user removes it on https://hivesigner.com/authorized-apps. See [Sign out and remove access](/docs/tokens#sign-out).

## GET /api/apps {#apps}

The public app directory: apps that broadcast through Hivesigner, ranked by how many people use them. It needs no token. https://hivesigner.com/apps shows the same list.

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

| Field | Meaning |
| --- | --- |
| `updated_at` | When the directory was last built. |
| `building` | `true` until the first build has data. `apps` is then empty. |
| `window_days` | The number of days the ranking covers. |
| `featured` | The usernames shown first, in order. |
| `apps[].username` | The app account. |
| `apps[].name`, `about` | From the app account's profile, or `null`. |
| `apps[].website` | The website from the profile, when it answers on its own domain. Otherwise `null`. |
| `apps[].site` | The result of the website check: `ok`, `no_website`, `invalid`, `redirected`, `blocked` or `unreachable`. A `redirected` entry also has `redirects_to`. |
| `apps[].users` | Daily distinct users, summed over the window. |
| `apps[].requests` | Successful API requests made for the app over the window. |
| `apps[].first_seen`, `last_seen` | The first day Hivesigner recorded the app and the last day it was used, or `null`. |
| `apps[].new` | `true` when the app first appeared inside the window. |

The answer may be cached for up to 5 minutes. Before the directory is first built, the API answers `503` with `unavailable`. Retry later.

The names and descriptions are published by each app account itself. Hivesigner does not verify them.
