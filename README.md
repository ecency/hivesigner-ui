# Hivesigner UI

The Hivesigner web app: a browser-only signer for the Hive blockchain. It holds
the user's keys on their own device, shows them what a transaction actually does
before they sign it, and issues OAuth tokens to apps that ask for posting
authority.

It is a static single-page app. There is no server-side rendering and no
application server: `pnpm build` produces `dist/`, and nginx serves it.

## Stack

- **Rsbuild** (Rspack) + `@rsbuild/plugin-react`
- **React 19**, TypeScript strict
- **TanStack Router** (file-based routes under `src/routes`, generated
  `routeTree.gen.ts`)
- **TanStack React Query** for chain reads
- **Tailwind CSS 4** via `@tailwindcss/postcss`
- **i18next** + react-i18next (`src/i18n/locales/`)
- **Vitest** + Testing Library
- **Biome** for lint and format
- `@ecency/sdk/hive` for the chain layer: multi-node RPC failover and
  browser-native crypto

## Develop

```bash
pnpm install
pnpm dev        # rsbuild dev server
pnpm test       # vitest
pnpm typecheck  # tsc --noEmit (run `pnpm build` first: it generates routeTree.gen.ts)
pnpm build      # rsbuild build + node-globals guard
pnpm check      # biome check --write
```

Node 24 (the version CI and the image use). `pnpm build` runs
`scripts/check-node-globals.mjs`, which fails the build if a chunk reads a Node
global (`process`, `Buffer`, ...) unguarded: Rsbuild provides none, so such a
read blanks the app in the browser. Keep crypto and signing dependencies
browser-native, or shim them (see the guard's notes).

## Docker

The image builds the SPA and serves `dist/` with nginx on `$PORT` (default
3000). `nginx.conf` carries the SPA fallback, the cache policy and the security
headers, including the CSP.

```bash
docker build -t hivesigner-ui .
docker run -e PORT=3000 -p 3000:3000 hivesigner-ui
```

Two build args, both optional:

- `GIT_SHA` is baked into the bundle so a served build can be identified.
- `SENTRY_DSN` enables error reporting. A DSN is public by design (it ships in
  the bundle), but it is passed in at build time rather than committed, so this
  public repo does not carry it. Empty means reporting is off, which is the
  default for local builds.

## Deploy

- Push to `development` builds `ecency/hivesigner:development` and deploys
  staging (`.github/workflows/staging.yml`).
- Push to `main` builds `ecency/hivesigner:latest` and deploys production
  (`.github/workflows/master.yml`). Production releases are the manual
  `development` -> `main` merge.
- Pull requests run the same lint/build/typecheck/test gate
  (`.github/workflows/ui-ci.yml`).

## Environment

`BROADCAST_NETWORK` is `mainnet`. The testnet deployment is discontinued.
