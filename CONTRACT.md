# Hivesigner UI external contract

What third-party apps and existing users depend on. The contract suite in `e2e/` checks the
parts that are observable logged out, on every pull request and after every staging deploy; the
rest is pinned by Vitest tests under `src/`. Changing anything here changes what other apps see,
so do it deliberately and say so in the release notes.

## Routes and query params

- Pages: `/`, `/about`, `/accounts`, `/apps`, `/auths`, `/authorized-apps`, `/developers`,
  `/import`, `/login`, `/oauth2/authorize`, `/profile`, `/settings`, `/signmessage`,
  `/verifymessage`, `/signs`, `/authorize/:username`, `/revoke/:username`,
  `/login-request/:clientId`, `/login-request/*`, `/sign/*`.
- Query read on auth flows: `redirect_uri` (decoded), `client_id`/`clientId`, `scope`,
  `response_type`, `state`, `authority`.
- Scope normalisation on `/oauth2/authorize`: `login` stays login; any value containing `offline`
  becomes scope posting with response_type code; anything else becomes posting.
- `/login` and `/login-request/*` fall back to scope login and response_type token, which is
  deliberately NOT the same rule: a malformed legacy request must never be upgraded from a
  username check into a posting grant.
- `authority` outside owner/active/posting is treated as absent.

## Callback registration

- An app's callbacks are the `redirect_uris` list in its account's `posting_json_metadata`
  profile. A request whose `redirect_uri` is not listed is refused: no token, a message naming
  the problem and a Report button.
- Matching is exact, with one relaxation from RFC 8252: a registered plain-http loopback
  callback (`localhost`, `127.0.0.1`, `[::1]`) matches any loopback host and port with the same
  path, query, fragment and userinfo. An https loopback registration stays exact.
- A callback must be https, or http on loopback.
- A request with a `redirect_uri` and no `client_id` is a login-only request from a site with no
  app account: the callback host is shown as the requester and the token issued is a bare
  `login` token with no `app`, whatever scope was named. The API does not accept such a token;
  the site verifies it itself.

## Signing (`/sign/*`)

- Accepts `hive://` URIs (`tx`, `op`, `ops`), the legacy `/sign/<op>?params` form with camelCase
  and kebab-case operation names, and `/sign/op/<b64u>`. hive-uri 0.2.8 semantics: UTF-8 b64u
  with `.` padding; `nb` present means sign only, no broadcast; `s` names the required signer;
  `cb` is a b64u callback.
- All 34 operations in `src/data/operations.json` are supported, by their chain names. Anything
  else, an empty operation list, or a field that cannot be coerced to its schema type (an
  integer that is not a number, a malformed amount) is refused with an invalid-request error and
  a Report button, and never signed.
- Amount rendering: VESTS and HP to 6 decimals, HIVE and HBD to 3; HP converts through dynamic
  global properties.
- Required authority is `?authority=` when valid, else the lowest across the operations
  (`custom_json` needs active only when `required_auths` is non-empty), else none when they
  disagree.
- A request that acts as an account other than the selected one says so before approval.

## Token and redirect shape

- Token = `b64u(JSON{signed_message, authors, timestamp, signatures:[sig], authority})`, where
  b64u is base64 with `+` to `-`, `/` to `_`, `=` to `.`.
- `signed_message` = `{type: code | scope, app?}`, hashed with sha256 over
  `{signed_message, authors:[username], timestamp: floor(Date.now()/1000)}`.
- Redirect: code flow appends `code=<token>[&state=<s>]&username=<u>`; token flow appends
  `[state=<s>&]access_token=<token>&expires_in=604800&username=<u>`.
- The parameters are appended to the callback string with `?` when it has no query and `&` when
  it has one, before any `#fragment`. The callback's own query is preserved byte for byte.
- A sign callback (`cb=`) with no `{{sig|id|block|txn|data}}` template gets nothing appended.

## Stored data (existing users must stay logged in)

- `localStorage.vuex__accounts` = `{accountsKeychains: {<user>: {password}}, selectedAccount}`.
  The `password` field is one of: a plain blob `hex(JSON(keys))+"decrypted"`; a triplesec v4
  blob written by earlier versions, read and re-encrypted on the first unlock; a v1 envelope
  (JSON `{v:1, kdf, salt, iv, ct}`, scrypt then AES-GCM under the local passcode).
- Plaintext key siblings (`owner`, `active`, `posting`, `memo`) that earlier versions wrote next
  to `password` are read once, folded into the keystore and removed.
- `localStorage.vuex__auth` is no longer written and is removed at boot. Decrypted keys live in
  memory for the session only.
- The legacy `localStorage.keychain` is migrated into `vuex__accounts` and deleted.
- `localStorage.hs_lang` carries the chosen language. The old `settings` blob is not read.

## Network

- Hive JSON-RPC through `@ecency/sdk` with node failover: `condenser_api.get_accounts`,
  `get_dynamic_global_properties`, `broadcast_transaction` and the reads the screens need.
- Avatars from `https://i.ecency.com`.
- The app directory from the Hivesigner API (`/api/apps`), one source, no fallback.
- Error reporting to Sentry, scrubbed before it leaves the browser (see the README).
- No `window.opener`, no `postMessage`.

## Test hooks

- Specs locate by role and visible text; there are no test-only attributes in the markup.
- `e2e/fixtures/rpc.ts` intercepts every RPC POST and fails loudly on an unhandled method.
- Locale `en-US`, timezone UTC. Anything that reads the clock (tokens, transaction expiry) is
  pinned in Vitest with a frozen clock rather than here.
