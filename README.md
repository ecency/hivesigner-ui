# Hivesigner UI

## Environment variable

Optional env variable:

`BROADCAST_NETWORK` could be either `'mainnet'` or `'testnet'`.

## Build Setup

```bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000
$ yarn dev

# generate static project into dist/
$ yarn generate
```

## Docker

The image generates the static app and serves `dist/` with nginx on `$PORT` (default 3000). Every route falls back to `200.html`, since pages render in the browser.

```bash
$ docker build -t hivesigner-ui .
$ docker run -e PORT=3000 -p 3000:3000 hivesigner-ui
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
