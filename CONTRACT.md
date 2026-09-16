# Hivesigner UI external contract (parity reference)

What the React rewrite (#101) must keep identical, and what the parity E2E suite (#100) pins.
Derived from a full read of the Nuxt 2 app at commit eb4e902. This is the actionable subset;
the exhaustive route/flow trace lives in the migration session and memory
(`project_hivesigner_react_migration`).

## Hard invariants (must not change)

### Routes and query params
- Pages: `/`, `/about`, `/accounts`, `/apps`, `/auths`, `/developers`, `/import`, `/login`,
  `/oauth2/authorize`, `/profile`, `/settings`, `/signmessage`, `/verifymessage`, `/signs`,
  `/authorize/:username`, `/revoke/:username`, `/login-request/:clientId`, `/login-request/*`,
  `/sign/*`.
- Query read on auth flows: `redirect_uri` (decoded), `client_id`/`clientId`, `scope`,
  `response_type`, `state`, `authority`, `username` (import pre-fill, `^[a-z][a-z0-9.-]{2,15}$`).
- Scope normalization (`/oauth2/authorize`): `login` -> login; any string containing `offline`
  -> scope posting + response_type code; anything else -> posting.
- `authority` invalid -> undefined (NOT posting). scope default login, response_type default token.

### Signing (`/sign/*`)
- Accepts `hive://` URIs: `tx`, `op`, `ops`, `msg`. Legacy `/sign/<op>?params` and
  `/sign/op/<b64u>`. hive-uri **0.2.8** semantics: UTF-8 b64u with `.` padding; `nb` present =
  no_broadcast; `s` must equal the signer/user; `cb` is b64u callback.
- Unknown op or empty operations -> "the provided data is invalid".
- Amount rendering: VESTS/HP -> 6dp, HIVE/HBD -> 3dp; HP converts via dynamic global props.
- Required authority = query.authority if valid, else lowest across ops (custom_json needs active
  iff required_auths non-empty), else null (mixed).

### Token / redirect shape (the OAuth contract other apps depend on)
- Token = `b64uEnc(JSON{signed_message, authors, timestamp, signatures:[sig], authority})`.
  b64u = base64 with `+`->`-`, `/`->`_`, `=`->`.`.
- signed_message = `{type: (code|scope), app?}`; hashed with sha256 over
  `{signed_message, authors:[username], timestamp: floor(Date.now()/1000)}`.
- Redirect: code -> `<cb>?code=<tok>[&state=<s>]&username=<u>`;
  token -> `<cb>?[state=<s>&]access_token=<tok>&expires_in=604800&username=<u>`.
- Always a single `?` appended even if `cb` already had one. Legacy `redirect_uri`/`cb=` with no
  `{{sig|id|block|txn|data}}` template get nothing appended.

### Persistence (existing users must not be logged out by the rewrite)
- `localStorage.vuex__accounts` = `{accountsKeychains:{<user>:{password, [owner,active,posting,memo]}}, selectedAccount}`.
- `localStorage.vuex__auth` = `{keys:{owner,active,posting,memo}, account:<get_accounts obj>, encryptedUserAccess}`.
- `localStorage.settings` = `{language, timeout, theme, address}`.
- Legacy `localStorage.keychain` migrated then deleted at boot.
- Decrypted key blob = `hex(JSON(keys))+"decrypted"`. Encrypted blob = triplesec v4
  (scrypt N=2^15,r=8,p=1 inside PBKDF2-SHA256 c=1; 192 bytes + plaintext). The rewrite must read
  both, then may re-encrypt (see #103).

### Network
- Only outbound: Hive JSON-RPC via dhive `condenser_api` (get_config, get_dynamic_global_properties,
  get_accounts, broadcast_transaction), `follow_api.get_following`, avatar images
  (images.ecency.com), Bugsnag (prod only). No hivesigner-api HTTP. No window.opener/postMessage.

## Current behaviours that are bugs (pin as-is, then decide with #106)
1. `failed` (unknown app / unregistered redirect_uri) only hides the app header; a token is still
   issued to an unregistered redirect_uri.
2. Plaintext WIFs sit in `vuex__auth.keys` even for encrypted accounts; `/auths` key-import writes
   plaintext into `vuex__accounts`.
3. authorize payload always mutates `posting` (even `?authority=active`) and never de-dups
   `account_auths`.
4. Chain id source differs: `/sign` uses get_config.HIVE_CHAIN_ID; authorize/revoke use hardcoded
   CLIENT_OPTIONS.chainId.
5. revoke `hasAuthority` is name-only (not weight-aware). login/import/authorize mount gate reads the
   cached account snapshot; only the pre-token grant check hits the chain.
6. A production build served off a non-hivesigner origin shows a permanent phishing popup
   (integrity check on `window.origin`).

## Test hooks
- `data-e2e` attributes already exist (login-*, import-*, authorize-*, account-details-*,
  `<role>`-key/revoke/copy). No e2e runner is configured yet.
- Custom Select has no native `<select>` (click `.select .input`, then `.select-option`);
  checkboxes are hidden (click the label text).
- Determinism: freeze the clock (tokens and tx expiration use Date.now()); fix locale en-US and
  timezone UTC (timestamps use toLocaleString).
