A Hivesigner token is a short signed statement. It names a Hive account, the app it was made for and the time it was signed. Your server can check a token with the API or by itself. This page shows what a token contains, how long it lasts and both ways to check it.

## What a token looks like {#format}

A token is a JSON object encoded as base64url, with one difference from standard base64url: padding uses `.` instead of `=`. So compared with plain base64, `+` becomes `-`, `/` becomes `_` and `=` becomes `.`. Every token starts with `eyJzaWduZWRfbWVzc2FnZSI6`.

Decoded, an access token from the token flow looks like this:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Field | Meaning |
| --- | --- |
| `signed_message.type` | What the token is: `login`, `posting`, `code` or `refresh`. See [Kinds of token](#kinds). |
| `signed_message.app` | The app account the token was made for. A sign-in token for a site with no app account has none. |
| `authors[0]` | The Hive account the token is for. |
| `timestamp` | When it was signed, in seconds since 1970-01-01 UTC. |
| `signatures[0]` | The signature, as a hex string. |
| `authority` | Only in tokens signed in the browser: which of the user's keys signed it, `posting` or `active`. This field is outside the signed data. To know which key signed, recover it from the signature. |

The signature is a secp256k1 signature over the sha256 hash of `JSON.stringify({ signed_message, authors, timestamp })`, with the keys in that order.

### Decode a token {#decode}

In Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

In a browser:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Decoding is not checking. Anyone can build a string that decodes to this shape. [Check a token](#check-a-token) before you trust it.

## Kinds of token {#kinds}

| Token | `type` | `app` | Signed by | Where you get it |
| --- | --- | --- | --- | --- |
| Access token, token flow | `posting` | Your app | The user's posting key, or their active key when Hivesigner holds no posting key for the account | `access_token` on your callback |
| Sign-in token, `scope=login` | `login` | Your app | The user's posting or active key | `access_token` on your callback |
| Sign-in token, site with no app account | `login` | None | The user's posting or active key | `access_token` on your callback |
| Code | `code` | Your app | The user's posting or active key | `code` on your callback |
| Access token, code flow | `posting` | Your app | The posting key of @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Refresh token | `refresh` | Your app | The posting key of @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

A code and a refresh token are not access tokens. Never accept either one as a sign-in.

## How long a token lasts {#lifetime}

An access token lasts 7 days: `expires_in` is 604800 seconds, counted from its `timestamp`. When it has expired:

- **Token flow:** send the user to sign in again. A user who already authorized your app sees "Sign in to APP" and needs one click.
- **Code flow:** your server gets a new access token with the refresh token and your client secret. See [Refresh](/docs/oauth2#refresh).

Treat a token as expired once its `timestamp` is more than 7 days old. Accept a much shorter age for anything you check right after the redirect. Exchange a code at once. Accept a sign-in token only within a few minutes of its `timestamp`.

## Check a token on your server {#check-a-token}

Before your server trusts a token that a browser or an app sends it, check that:

- the account or @hivesigner really signed it;
- it was made for your app;
- it is the kind of token you expect;
- it is recent enough.

### Ask the API {#check-with-the-api}

Call `/api/me` with the token. A valid token returns the account in `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

An invalid token returns `401` with `invalid_grant`. See [GET /api/me](/docs/api#me).

`/api/me` confirms the signature. Its answer does not name the app the token was made for. So also decode the token and check its `app`, `type` and age yourself. A token made for another app must not sign anyone in to yours.

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

The API only accepts tokens that name an app. Check a sign-in token from a site with no app account [yourself](#check-it-yourself).

### Check it yourself {#check-it-yourself}

1. Decode the token.
2. Check that `signed_message.type` is the kind you expect: `posting` for an access token, `login` for a sign-in token.
3. Check that `signed_message.app` is your app account. For a site with no app account, check that there is none.
4. Check the age from `timestamp`.
5. Compute the sha256 hash of `JSON.stringify({ signed_message, authors, timestamp })`.
6. Recover the public key from `signatures[0]` and that hash.
7. Read the account `authors[0]` from the Hive blockchain now, because users can change their keys. The recovered key must be one of its current posting or active keys. A token from `/api/oauth2/token` is signed by @hivesigner instead: for those, accept a current posting key of the @hivesigner account.

In Node.js with [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), which exports `PrivateKey`, `PublicKey`, `Signature` and `callRPC` under `@ecency/sdk/hive`:

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

Use it like this:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

The dhive library (`@hiveio/dhive`) works too: compute the hash with `cryptoUtils.sha256(message)` and recover the key with `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Keep tokens safe {#keep-tokens-safe}

Anyone who holds a posting token can broadcast as the user through your app until it expires. Treat it like a password.

- **Keep tokens on your server,** or in an httpOnly, Secure cookie. Keep refresh tokens and your client secret on the server only.
- **Never put a token in a URL you log.** The token flow delivers the token in your callback's query string. Read it on your server, then redirect to a URL without it. Leave the callback's query string out of your logs.
- **Load nothing from other sites on your callback page,** so the address with the token is not sent to them. A `Referrer-Policy: no-referrer` header on that page helps.
- **Send a token only to your own server and to `https://hivesigner.com/api/`.**

## Sign out and remove access {#sign-out}

- **Signing a user out** means discarding the token: delete it from your session or cookie. You can also call [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) to tell Hivesigner the user signed out. Your app still discards the token itself.
- **Cutting your app off for good** is the user's choice. On https://hivesigner.com/authorized-apps, or at `https://hivesigner.com/revoke/APP`, they remove your app account from their posting authority on chain. After that the API no longer broadcasts for them through your app.
