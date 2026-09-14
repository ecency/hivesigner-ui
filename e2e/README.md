# Parity E2E suite (#100)

Playwright specs that pin hivesigner-ui's user-visible behaviour so the React rewrite (#101) can be
checked against the same flows. They run against a `BASE_URL` (default `https://staging.hivesigner.com`),
so the same suite gates the current app today and the React build later.

The external contract these specs defend is written up in `../CONTRACT.md`.

## Run

```bash
cd e2e
BASE_URL=https://staging.hivesigner.com npx playwright test
# or against a local `nuxt generate` served on a port:
BASE_URL=http://127.0.0.1:3099 npx playwright test
```

Node 18+ (the harness is separate from the app's Node 14/16 build). Pinned to Playwright 1.60 to
match the Chromium already cached on the build host; set `PLAYWRIGHT_BROWSERS_PATH` if yours lives
elsewhere.

## Layout

- `fixtures/rpc.ts` - Hive JSON-RPC mock. Intercepts dhive POSTs, dispatches on `method`, and errors
  loudly on any method without a handler. Includes chain-shaped fixtures (get_config, dynamic global
  props, an app account with a registered redirect_uri).
- `tests/smoke.spec.ts` - route reachability, security headers, 404 for missing assets, asset caching.
  No mocks.
- `tests/sign.spec.ts` - the confirm-transaction page: the #96 em-dash/emoji case, the logged-out
  "needs a key" state, and the invalid-op error.
- `tests/oauth.spec.ts` - `/oauth2/authorize` scope normalization and the app-consent header.

## Not yet covered (next batches)

Token issuance and its exact redirect URL (needs a seeded account and a frozen clock), key import and
the local encryption password, authorize/revoke broadcasts, sign/verify message, settings RPC
migration, account switching. Each needs an account fixture; a decrypted account is a
`hex(JSON(keys))+"decrypted"` blob in `vuex__accounts`, an encrypted one a triplesec v4 blob plus its
password.
