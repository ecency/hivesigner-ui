# Contract E2E suite

Playwright specs that pin the user-visible behaviour third-party apps and existing users depend
on: the published routes, the security headers, the sign page's edge cases and the consent
screen's normalisation. They run logged out against a `BASE_URL`, with the Hive RPC mocked, and
they check behaviour rather than markup. The contract they defend is written up in
`../CONTRACT.md`.

CI runs the suite twice:

- on every pull request, against the Docker image built from that branch (`ui-ci.yml`, job
  `contract`), so a break is caught before merge;
- after every staging deploy, against `https://staging.hivesigner.com` (`staging.yml`, job
  `contract`), so the deployed build is proven to match.

## Run

```bash
cd e2e
npm ci                                   # the pinned @playwright/test
BASE_URL=https://staging.hivesigner.com npx playwright test
```

To run against a local build, use the image rather than a plain static server: the headers and
the SPA fallback the smoke spec checks come from `nginx.conf`.

```bash
docker build -t hivesigner-ui:local .
docker run --rm -d --name ui -p 3000:3000 -e PORT=3000 hivesigner-ui:local
BASE_URL=http://127.0.0.1:3000 npx playwright test
```

Node 18+. Playwright is pinned in `package-lock.json`; set `CHROME_PATH` to use a Chromium already
on the machine instead of installing one, or `PLAYWRIGHT_BROWSERS_PATH` if the cache lives
elsewhere.

## Layout

- `fixtures/rpc.ts` - Hive JSON-RPC mock. Intercepts RPC POSTs, dispatches on `method`, and errors
  loudly on any method without a handler. Includes chain-shaped fixtures (get_config, dynamic global
  props, an app account with a registered redirect_uri).
- `tests/smoke.spec.ts` - route reachability, security headers, 404 for missing assets, asset caching.
  No mocks.
- `tests/sign.spec.ts` - the confirm-transaction page: a legacy sign link with an em dash and emoji,
  the logged-out "needs a key" state, and the unknown-operation error.
- `tests/oauth.spec.ts` - `/oauth2/authorize` scope normalisation, the app-consent header, and a
  login-only request from a site with no app account.

## What lives elsewhere

Everything that needs a stored account is a Vitest test under `src/`: token issuance and the exact
redirect URL, the grant-before-token ordering, key import and the local passcode, grant and revoke
broadcasts, sign and verify message, account switching. This suite stays logged out on purpose, so
it needs no key fixture and can run against any deployment.

The RPC fixture also blocks Sentry's ingest host, so a run against a deployed build (which
carries a DSN) reports nothing: the unknown-operation spec is a real invalid request and would
otherwise file an `integration: sign_request_invalid` event on every run.
