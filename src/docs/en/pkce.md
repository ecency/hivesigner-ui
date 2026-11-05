PKCE (Proof Key for Code Exchange, RFC 7636) lets an app that cannot keep a secret use the [code flow](/docs/oauth2#code-flow). A mobile or desktop app sends a one-way fingerprint of a random value when it starts the sign-in. Later it proves it holds that value when it exchanges the code. A code that someone else catches on the way is useless to them. This is also what lets a native app come back on its own scheme, such as `myapp://callback`.

## Why use PKCE {#why}

- **No secret inside your app.** A client secret shipped in an app can be read out of it. With PKCE your app proves itself with a value it makes fresh for every sign-in and never sends until the exchange.
- **Your own scheme as the callback.** Any app on a device can claim a scheme like `myapp://`, so Hivesigner never sends a token to one. With PKCE it sends a code instead. Only your app can exchange it.
- **A stolen code is worthless.** The exchange needs the verifier, which never travels through the browser.
- **The challenge is signed.** Hivesigner puts the challenge inside the code that the user's key signs. Nobody can swap or remove it after the user approved.
- **Short lived and single use.** A PKCE code can be exchanged once, within 10 minutes (with up to 5 more for a device clock that is off).
- **Existing apps keep working.** A code without a challenge works exactly as before. See [Existing apps](#existing-apps).

## How it works {#how-it-works}

```text
 Your app                        Hivesigner                      Hivesigner API
 ────────                        ──────────                      ──────────────
 1. verifier  = random secret
    challenge = BASE64URL(SHA256(verifier))
    keeps the verifier in memory

 2. opens /oauth2/authorize ────► 3. user picks an account
    with code_challenge              and approves
                                    signs a code that CONTAINS
                                    the challenge

 4. myapp://callback?code=CODE ◄── redirects with the code
    (another app may see this,
     it cannot use the code)

 5. POST /api/oauth2/token ─────────────────────────────────────► 6. checks the user's signature,
    code + code_verifier                                              SHA256(verifier) == challenge,
                                                                      age under 10 minutes (+5),
                                                                      not used before

 7. access_token ◄──────────────────────────────────────────────── issues the token
```

The verifier is the only thing that turns the code into a token. It never leaves your app until step 5. That step goes straight to the API over https, not through the browser or the operating system.

## Register your app {#register}

Set up your app account as on [Register your app](/docs/register-app), with two differences:

- **Callback.** Add your app's own scheme to Redirect URIs, for example `myapp://callback` or `com.example.myapp:/callback`. It has to match exactly, with no `#fragment`. The scheme is a plain name such as `myapp` or a reverse domain name such as `com.example.my-app`, in plain ASCII. Hivesigner accepts it only for a code request with a valid PKCE challenge. An https App Link or Universal Link, or a loopback address, works as well.
- **No client secret.** An app account with no secret is treated as an app that cannot keep one. PKCE alone is enough to exchange its codes. If the account already has a secret because a server uses it too, see [A server and a native app on one account](#pkce-public).

Schemes that run code or open something other than your app are never accepted as a callback: `javascript`, `data`, `vbscript`, `file`, `blob`, `about`, `intent`, `market`, browser schemes such as `googlechrome` or `firefox`. Also any scheme with a dash or a plus before its first dot (`x-safari-https`, `ms-msdt`, `web+app`).

## Step by step {#steps}

### 1. Make a verifier and its challenge {#make-verifier}

Make a new pair for every sign-in. The verifier is 43 to 128 characters of `A-Z a-z 0-9 - . _ ~`. The challenge is its SHA-256 hash in base64url, without `=` padding.

```js
function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
const challenge = base64url(new Uint8Array(digest));
```

To test your own code, the verifier `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk` gives the challenge `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM` (RFC 7636, appendix B).

With the JavaScript SDK, `createPkcePair()` does this for you. See [Use the JavaScript SDK](#with-the-sdk).

### 2. Send the user to Hivesigner {#authorize}

Open the authorize URL in the system browser (or an in-app browser tab), with `response_type=code` and the two PKCE parameters:

```text
https://hivesigner.com/oauth2/authorize?client_id=myapp&redirect_uri=myapp%3A%2F%2Fcallback&response_type=code&scope=posting&code_challenge=CHALLENGE&code_challenge_method=S256&state=STATE
```

| Parameter | Value |
| --- | --- |
| `response_type` | `code`. The token flow never uses a custom scheme. |
| `code_challenge` | The challenge from step 1, 43 characters. |
| `code_challenge_method` | `S256`. The `plain` method is not supported. |
| `state` | A random value you compare on return. See [Protect the request with state](/docs/oauth2#state). |

### 3. Receive the code {#receive-code}

After the user approves, Hivesigner opens your callback:

```text
myapp://callback?code=CODE&state=STATE&username=alice
```

Compare `state` first. Do not trust `username`: the account is in the code and in the exchange answer.

### 4. Exchange the code {#exchange}

Send the code and the verifier to the API, with no client secret:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "code_verifier": "VERIFIER"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

There is no `refresh_token`: refreshing needs the client secret, which a native app does not have. When the access token expires, send the user through the authorize URL again. A user who approved your app before sees a one tap "Sign in" screen. Forget the verifier once the exchange is done.

Then use the access token with the [API](/docs/api) as any other app does.

### Use the JavaScript SDK {#with-the-sdk}

```js
import { Client, createPkcePair } from 'hivesigner';

const client = new Client({
  app: 'myapp',
  callbackURL: 'myapp://callback',
  responseType: 'code',
  scope: ['posting'],
});

const { codeVerifier, codeChallenge } = await createPkcePair();
const url = client.getLoginURL(state, undefined, { codeChallenge });
// ...open url, receive myapp://callback?code=CODE...
const tokens = await client.exchangeCode(code, codeVerifier);
```

## What Hivesigner checks {#rules}

| Request | Result |
| --- | --- |
| `response_type=code`, an S256 challenge, a registered `myapp://callback` | Accepted: the code carries the challenge |
| The same without `code_challenge` | Refused: the callback is not registered for this request |
| The same with `code_challenge_method=plain` or no method | Refused: the challenge is ignored, so the callback is too |
| The token flow with `myapp://callback` | Refused: a token is never sent to a custom scheme |
| An https callback with a valid S256 challenge | Accepted: the code carries the challenge |
| An https callback with `plain` or a malformed challenge | Accepted as before: the challenge is ignored and the code needs the client secret |

| Exchange | Result |
| --- | --- |
| A PKCE code with the right verifier | Tokens |
| A wrong, missing or malformed verifier | `401 invalid_grant` |
| The same code a second time | `401 invalid_grant` "The code was already used" |
| A PKCE code older than 15 minutes (10, plus 5 for clock differences) | `401 invalid_grant` "The code has expired" |
| A PKCE code dated more than 5 minutes ahead | `401 invalid_grant` "The code is dated in the future" |
| A code whose challenge was changed | `401 invalid_grant`: the user's signature no longer matches |
| A PKCE code used as a token, for example at `/api/me` | `401 invalid_grant` |
| A code without a challenge, with the client secret | Tokens and a refresh token, as before |

A wrong verifier does not use up the code: the app that holds the right one can still exchange it.

## A server and a native app on one account {#pkce-public}

An app account that has a client secret is treated as a server. Its codes need the secret even when they carry a challenge. This keeps PKCE from weakening an existing app: someone who starts a sign-in with their own challenge and then gets hold of the code still cannot exchange it without the secret.

When your website (with the secret) and your mobile app (without it) share one app account, tick **Let this app's native app exchange PKCE codes without the secret** on the profile page. It saves `"pkce_public": true` in the app profile. Then:

- A PKCE code exchanged without a secret gets an access token, with no refresh token.
- A PKCE code exchanged with the secret also gets a refresh token.
- A code without a challenge still needs the secret.
- A secret that is sent must always be the right one.

Only the value `true` counts. Leave it off when every client of the account can keep the secret.

Turn it on only when you control every callback registered on the account. With it, whoever receives a code at one of those callbacks after starting the sign-in can exchange it without the secret. For an https or loopback callback that is no new exposure, since the token flow already sends a token there. A custom scheme can be claimed by any app on the device, so give the native app a verified App Link or Universal Link where you can. An IP allowlist (`allowed_ips`) applies to every exchange, so an account with one cannot serve a native app.

## What PKCE does not cover {#limits}

PKCE stops a code that was caught on the way from being used. It does not stop another app on the same device from claiming your scheme and starting a sign-in of its own, with its own verifier, while the consent screen names your app. If the user approves, that app gets a token for your app.

- **Prefer an https callback that the system opens only in your app** (Android App Links, iOS Universal Links) when you can. PKCE still protects the code there.
- **Use a scheme based on a domain you own**, such as `com.example.myapp:/callback`, so it is less likely to collide with another app.
- **Keep scopes and trust in proportion.** The consent screen names your app and shows your registered callback either way, so it cannot tell a user which app will open it.

## Existing apps {#existing-apps}

Nothing changes for an app that does not send a challenge. Its codes need the client secret, have no age limit and can be exchanged more than once, as before. Its https and loopback callbacks work as before. The token flow still refuses custom schemes.

Some OAuth libraries send an S256 challenge on their own. For such an app the code now carries the challenge, so:

- the exchange needs the verifier as well as the secret (these libraries send both);
- the code can be exchanged once, within the time above;
- the code is no longer accepted as a token at `/api/me`. Exchange it first.

A `plain` or malformed challenge is ignored as before.

## The code format {#code-format}

A code is a Hivesigner token of `type` `code`. See [What a token looks like](/docs/tokens#format). With PKCE its `signed_message` has two more fields, in this order:

```json
{
  "type": "code",
  "app": "myapp",
  "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  "code_challenge_method": "S256"
}
```

The signature covers SHA-256 of these exact bytes, with no spaces:

```text
{"signed_message":{"type":"code","app":"myapp","code_challenge":"E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM","code_challenge_method":"S256"},"authors":["alice"],"timestamp":1800000000}
```

Its SHA-256 is `8de0c7bf487c57a3f4b3a616d139c4c6a4a1a61411c7cd222cd796d924c22836`. The `timestamp` is Unix time in whole seconds: a value in milliseconds is refused as dated in the future. Another signer that issues Hivesigner codes, such as a wallet app signing in to a sister app, has to produce the same bytes, signed by one of the user's posting, active or owner keys. The API then exchanges that code like any other.
