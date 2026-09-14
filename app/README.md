# Hivesigner UI — React rewrite (`app/`)

The React replacement for the Nuxt 2 Hivesigner UI, mirroring the Ecency stack
used in `vision-web/apps/self-hosted`:

- **Rsbuild** (Rspack) + `@rsbuild/plugin-react`
- **React 19**, TypeScript strict
- **TanStack Router** (file-based routes under `src/routes`, generated
  `routeTree.gen.ts`)
- **TanStack React Query** for chain reads
- **Tailwind CSS 4** via `@tailwindcss/postcss`
- **i18next** + react-i18next, reusing the Nuxt app's locale dictionaries
  unchanged (`src/i18n/locales/en-US.js`, `ru-RU.js`)
- **Vitest** + Testing Library
- **Biome** for lint and format

This lives beside the Nuxt app during the rewrite. The Nuxt app keeps serving
production until this app reaches parity; at cutover the Dockerfile builds
`app/` and serves `dist/` with `app/nginx.conf` (which carries the CSP and the
security headers).

## Develop

```bash
cd app
pnpm install
pnpm dev       # rsbuild dev server
pnpm test      # vitest
pnpm build     # rsbuild build + node-globals guard
pnpm check     # biome check --write
```

Node 20+ / pnpm. `pnpm build` runs `scripts/check-node-globals.mjs`, which fails
the build if a chunk reads a Node global (`process`, `Buffer`, ...) unguarded —
Rsbuild provides none, so such a read blanks the app in the browser. Keep
crypto/signing dependencies browser-native or shim them (see the guard's notes).

## Scope of the scaffold

Routing, config, i18n, the shared shell and a read-only `/sign/*` confirm screen
built on `lib/operation-summary.ts` (the human-readable summary that answers the
"raw JSON" complaint). Signing, key import and encryption are intentionally
absent: they arrive with the flow port (#102) and key-storage migration (#103),
where the Buffer question for the signer is handled. The external contract these
must preserve is in `../CONTRACT.md`; the parity E2E suite in `../e2e` is the gate.
