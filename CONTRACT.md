# Hivesigner UI external contract

What third-party apps and existing users depend on. The contract suite in `e2e/` checks the
parts that are observable logged out, on every pull request and after every staging deploy; the
rest is pinned by Vitest tests under `src/`. Changing anything here changes what other apps see,
so do it deliberately and say so in the release notes.

## Routes and query params

- Pages: `/`, `/about`, `/accounts`, `/apps`, `/auths`, `/authorized-apps`, `/docs/*`,
  `/import`, `/login`, `/oauth2/authorize`, `/profile`, `/settings`, `/signmessage`,
  `/verifymessage`, `/signs`, `/authorize/:username`, `/revoke/:username`,
  `/login-request/:clientId`, `/login-request/*`, `/sign/*`, `/sign-buffer`.
- `/developers` redirects permanently to `/docs`.
- Query read on auth flows: `redirect_uri` (decoded), `client_id`/`clientId`, `scope`,
  `response_type`, `state`.
- Scope normalisation on `/oauth2/authorize`: `login` stays login; any value containing `offline`
  becomes scope posting with response_type code; anything else becomes posting.
- `/login` and `/login-request/*` fall back to scope login and response_type token, which is
  deliberately NOT the same rule: a malformed legacy request must never be upgraded from a
  username check into a posting grant.
- `account` (what the SDK's `getLoginURL(state, account)` sends; its README calls it
  `select_account`, which is read too) on `/oauth2/authorize` chooses that account when it is on
  the device and is otherwise ignored. Either way it is taken out of the URL before the screen
  renders, so a return to the request from the account list keeps the user's own pick.

## Docs

- `/docs` and `/docs/<page>` in English, `/docs/<lang>` and `/docs/<lang>/<page>` in another
  language (its code in lower case). The pages and their order are `src/docs/pages.ts`; each page
  is `src/docs/<lang>/<page>.md` with its title in that folder's `pages.json`. A page a language
  has not translated shows the English one with a note and is not indexed at that address.
- Each page's HTML is written at build time with its content, canonical and `hreflang`
  alternates, and the sitemap lists every page. `/docs/<page>.md` (and `/docs/index.md`) is the
  page as Markdown, listed in `/docs/llms.txt`.
- The old GitBook docs forward as `/docs/h/<old path>`: each old page redirects permanently to the
  page that replaced it, anything else to `/docs`.

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
- All 41 operations in `src/data/operations.json` are supported, by their chain names. Anything
  else, an empty operation list, or a field that cannot be coerced to its schema type (an
  integer that is not a number, a malformed amount) is refused with an invalid-request error and
  a Report button, and never signed.
- Amount rendering: VESTS and HP to 6 decimals, HIVE and HBD to 3; HP converts through dynamic
  global properties.
- Required authority: the one every operation in the transaction needs (`custom_json` needs
  active only when `required_auths` is non-empty). One key signs one authority, so a transaction
  whose operations need different ones, or one Hivesigner does not know, cannot be signed. There
  is no `authority` parameter on `/sign/*`.
- A request that acts as an account other than the selected one says so before approval.

## Message signing requests (`/sign-buffer`)

- An app asks for a message signed with one of the account's keys, as with Hive Keychain's
  `requestSignBuffer`. Query: `message` (the exact text), `authority` (`posting` when absent or
  empty, or `active`, in any case; anything else is refused), `redirect_uri`, optional
  `client_id`/`clientId`, `state` and `account` (read as on `/oauth2/authorize`).
- Every callback must be https, or http on loopback. With a `client_id` it must also be registered
  to that app, as read on this visit (a copy cached earlier decides nothing), and nothing is
  signed while the app's profile cannot be read (a retry is offered).
  Without one the callback host is shown as the requester. A request without a message or a
  callback is refused with a Report button.
- The whole message is shown in the page, with controls, zero-width and bidi characters as
  visible escapes.
- The signature is Keychain's: secp256k1 over sha256 of the message's UTF-8 bytes, as a hex string.
  A message that is a JSON object with a `signed_message` key (a Hivesigner token body) is never
  signed.
- Redirect: the callback gets `signature`, `public_key`, `username`, `authority` and, when the
  request sent one (empty included, which the token flow below leaves out), `state`, appended as
  in the token flow. Cancel returns nothing to the app.

## Token and redirect shape

- Token = `b64u(JSON{signed_message, authors, timestamp, signatures:[sig], authority})`, where
  b64u is base64 with `+` to `-`, `/` to `_`, `=` to `.`.
- `signed_message` = `{type: code | scope, app?}`, hashed with sha256 over
  `{signed_message, authors:[username], timestamp: floor(Date.now()/1000)}`.
- Redirect: code flow appends `code=<token>[&state=<s>]&username=<u>`; token flow appends
  `[state=<s>&]access_token=<token>&expires_in=604800&username=<u>`.
- The parameters are appended to the callback string with `?` when it has no query and `&` when
  it has one, before any `#fragment`. The callback's own query is preserved byte for byte.
- A sign callback (`cb=`) has its placeholders filled: `{{id}}` with the transaction id, `{{sig}}`
  with the signature on a sign-only (`nb`) link. `{{block}}`, `{{txn}}` and `{{data}}` are left
  empty: the broadcast returns once a node accepts the transaction, before it is in a block. A
  callback with none of them gets the transaction id appended as `id=`, with `?` when it has no
  query and `&` when it has one.

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
