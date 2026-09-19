Send people to Hivesigner to sign in to your app. They review your request there and approve it. Hivesigner then sends them back to your callback with a token (the token flow) or with a code that your server exchanges for tokens (the code flow). This page covers both flows, every parameter and the scopes.

## Before you start {#before-you-start}

- Register your app: a Hive account for it, with your callbacks listed. See [Register your app](/docs/register-app).
- To broadcast through the API, your app account must also [grant @hivesigner posting authority](/docs/register-app#grant-hivesigner).
- For the code flow, set a [client secret](/docs/register-app#client-secret).

## The authorize URL {#authorize-url}

Send the user to this address:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

URL-encode every value. `URLSearchParams` does it for you:

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### Parameters {#parameters}

| Parameter | Required | What it does |
| --- | --- | --- |
| `client_id` | Yes, for an app | Your app account's name. `clientId` is read too. Without it, the request is a sign-in only request from a site with no app account: see [Sign-in without posting access](/docs/login-only). |
| `redirect_uri` | Yes | Where Hivesigner sends the user back. It must be one of your app's Redirect URIs, exactly. See [Callbacks](/docs/register-app#callbacks). |
| `scope` | No | `login`, `posting` or `offline`. See [Scopes](#scopes). Without it, the request asks for posting access. |
| `response_type` | No | `code` starts the [code flow](#code-flow). Any other value, or none, means the [token flow](#token-flow). |
| `state` | Recommended | A random value that Hivesigner returns unchanged. See [Protect the request with state](#state). |
| `account` | No | A Hive username. When that account is on the user's device, Hivesigner selects it. Otherwise it is ignored. `select_account` is read too. |

The user can still switch to another account on the consent screen. Always take the account from the token or from the code exchange, never from what you asked for.

## Scopes {#scopes}

Hive has one posting authority. So Hivesigner has two levels of access, sign-in only and posting, with nothing finer in between.

| `scope` | What the user approves | Flow | Access token `type` |
| --- | --- | --- | --- |
| `login` | "View your account username". Nothing is granted. | Token flow (do not add `response_type=code`) | `login` |
| `posting` | Posting access. The first time, this adds your app account to the user's posting authority. | Token flow, or code flow with `response_type=code` | `posting` |
| `offline` | Posting access, as above | Code flow | `posting`, with a `refresh` token |

In the code flow, the callback first receives a code (a token of `type` `code`) that your server exchanges for the access token.

- **No scope** means `posting`.
- **A value that contains `offline`** anywhere means `offline`, for example the old `offline,vote,comment`.
- **Any other value** means `posting`. This includes the old operation names such as `vote`, `comment`, `vote,comment`, `comment_options` or `custom_json`. They do not limit the token: every posting token allows the same operations. See [What broadcast accepts](/docs/api#broadcast-rules).

Ask for `login` when your app only needs to know who the user is. See [Sign-in without posting access](/docs/login-only).

## The token flow {#token-flow}

The user's browser receives the access token directly. Your app needs no secret.

1. Send the user to the authorize URL:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. The user approves. Hivesigner redirects to your callback:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner adds its parameters with `?` when your callback has no query and with `&` when it has one. `state` is there only when you sent a non-empty one.

3. On your callback, [compare `state`](#state) first. Then [check the token](/docs/tokens#check-a-token) on your server. The account it is for is in the token: do not rely on the `username` parameter alone, because anyone can edit a URL.
4. Keep the token on your server or in an httpOnly cookie. Redirect to a clean URL so the token leaves the address bar.
5. Use the token with the [API](/docs/api) until it expires after `expires_in` seconds (7 days). Then send the user to the authorize URL again. A user who already granted posting access sees "Sign in to APP" and "You authorized @myapp before. Nothing new is granted."

## The code flow {#code-flow}

Your server receives a code and exchanges it for an access token and a refresh token. It can renew them later without the user. Use it when your server acts for users over a long time.

1. Send the user to the authorize URL with `scope=offline`:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` does the same.

2. The user approves posting access. Hivesigner redirects to your callback:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [Compare `state`](#state). Then exchange the code right away, from your server.

### Exchange the code {#exchange-code}

Send the code and your client secret to `/api/oauth2/token` in the body of a POST request:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

The answer:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

The same call in Node.js 18 or later:

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- Put the code and the secret in the request body, never in the URL.
- Send no `Authorization` header with this request.
- Use `username` from this answer. It comes from the code, which the user signed.
- Keep the access token and the refresh token on your server.

### Refresh {#refresh}

When the access token expires, send the refresh token with your client secret to the same endpoint:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

The answer has the same shape, with a new access token and a new refresh token. Store both in place of the old ones.

## Protect the request with state {#state}

Without `state`, another site could send your user to your callback with a token or code of its own choosing. Your app would then sign the user in to someone else's account. `state` ties each callback to the browser that started the sign-in.

1. Generate a random value for each sign-in, at least 16 random bytes. Hex keeps it free of characters that need encoding.
2. Store it where only this browser can present it again: your server session, or a short-lived httpOnly, Secure cookie with `SameSite=Lax`.
3. Send it as `state` in the authorize URL.
4. On your callback, compare the `state` parameter with the stored value. If it is missing or different, stop: do not use the token or the code.
5. Delete the stored value, so each one works once.

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner returns the same `state` value it received. It leaves out an empty one.

## What the user sees {#what-the-user-sees}

The consent screen shows your app's picture and name, "Hive account @myapp" and "Sends you to HOST", with HOST taken from your callback. Then:

- **First posting request.** The heading reads "APP is requesting access to your account." The **Scope** card lists what your app will be able to do. A notice reads "First-time authorization: this adds @myapp to your posting authority on-chain and needs your active key once. That account will be able to post as you until you revoke it." The button reads **Authorize**. When the user's device holds no active key for the account, the screen asks for it in place.
- **Sign-in.** For `scope=login`, or for posting access the user granted before, the heading reads "Sign in to APP" and the button reads **Sign in**.
- **The account.** "Authorizing as" or "Signing in as", followed by the selected account. The user can switch accounts here.
- **A locked account.** A passcode field sits above the button. One click unlocks the account and continues.
- **No account on the device.** The button reads **Continue**. It opens the add account form and comes back to the request.

After a first posting request, Hivesigner waits until the new grant is visible on chain before it redirects. This can take a few seconds. For the full screen from the user's side, see [Sign in to apps](/docs/signing-in).

## Cancel and refused requests {#cancel}

- **Cancel.** The user goes to their account list in Hivesigner. Nothing is sent to your callback: there is no error parameter. Keep your sign-in button available so the user can start again. Do not wait for a callback.
- **Refused requests.** An unregistered callback, an unknown `client_id` or a missing `redirect_uri` shows an error in Hivesigner with a **Report this problem** button. Nothing is sent to your callback. See [What users see when something is wrong](/docs/register-app#refused-requests).

## The legacy login-request URL {#legacy-login-request}

Hivesigner still accepts the older sign-in URL, kept for old integrations. Use `/oauth2/authorize` for new ones.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

It opens the same consent screen, with the same callback checks and the same redirect. It reads its parameters differently:

- `scope` is `login` or `posting`. Any other value, or none, means `login`.
- `offline` is not read. For the code flow, add `response_type=code`.
- `account` is not read.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` follows the same rules.
