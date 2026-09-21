An app that signs people in with Hivesigner is a Hive account. Its name is the `client_id` you send. Its profile holds the settings Hivesigner reads: the callbacks it may send tokens to and, for the code flow, a client secret. To broadcast through the API, the app account also grants posting authority to @hivesigner. This page walks through each step.

## What you need {#what-you-need}

| You want to | App account and callbacks | Client secret | @hivesigner grant |
| --- | --- | --- | --- |
| Sign people in and broadcast with the token flow | Yes | No | Yes |
| Sign people in and broadcast with the code flow (refresh tokens) | Yes | Yes | Yes |
| Sign people in only, with a token that names your app | Yes | No | No |
| Sign people in only, from a site with no Hive account | No | No | No |
| Send sign links | No | No | No |

For the last two rows, see [Sign-in without posting access](/docs/login-only) and [Sign links](/docs/sign-links).

## Create the app account {#app-account}

1. Create a Hive account for your app, for example on https://ecency.com/signup. Use a separate account for the app, not your personal one. Its name is your `client_id`. Users see it on the consent screen next to "Hive account". A Hive account cannot be renamed, so choose the name with care.
2. Add the account to Hivesigner on https://hivesigner.com/import (**Add account**). Use the active key or the master password: the grant further down needs the active key.

## Fill in the app settings {#app-settings}

Open https://hivesigner.com/profile with the app account selected and set:

- **This account is an app.** Turn it on.
- **Redirect URIs.** Your callbacks, one per line. See [Callbacks](#callbacks).
- **Client secret.** Needed only for the [code flow](/docs/oauth2#code-flow). See [Client secret](#client-secret).

Fill in **Name** and **Profile picture URL** too. The consent screen shows your app's picture and name. The app directory on https://hivesigner.com/apps shows the name, **About** and **Website**.

Saving updates the account's profile on chain and needs its posting key. Hivesigner reads your callbacks from the account when a sign-in request opens, so a change applies as soon as the transaction is in a block.

> **Note:** The name, picture and description are published by your app account itself. So the consent screen also shows the real account name (`@myapp`) and the host it sends the user to: those are what the grant and the redirect actually use.

## Callbacks {#callbacks}

A callback (the `redirect_uri` in a sign-in request) is where Hivesigner sends the user back with a token or a code. Hivesigner only sends it to a callback listed on your app account.

### The rules {#callback-rules}

- **Exact match.** The `redirect_uri` in the request must be one of your Redirect URIs, character for character: scheme, host, port, path and query.
- **https only.** A callback must use `https://`. Plain `http://` is accepted only on loopback: `localhost`, `127.0.0.1` or `[::1]`.
- **Loopback ports may change.** A registered plain-http loopback callback matches any loopback host and port with the same path, query, fragment and user info. A registered `https://` loopback callback stays an exact match.
- **No custom schemes.** A callback such as `myapp://callback` is refused. See [Mobile and desktop apps](#native-apps).
- **No fragments.** Do not add a `#fragment` to a callback.

The profile page refuses to save a callback that could never work, with "Not a usable callback (https, or http on localhost)".

### Examples {#callback-examples}

With these Redirect URIs registered:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| `redirect_uri` in the request | Result |
| --- | --- |
| `https://myapp.example/auth/callback` | Accepted: exact match |
| `https://myapp.example/auth/callback/` | Refused: extra `/` |
| `https://myapp.example/auth/callback?next=home` | Refused: the query differs |
| `https://www.myapp.example/auth/callback` | Refused: another host |
| `http://myapp.example/auth/callback` | Refused: plain http off loopback |
| `http://localhost:3000/auth` | Accepted: exact match |
| `http://127.0.0.1:51234/auth` | Accepted: loopback, same path, another port |
| `http://[::1]:3000/auth` | Accepted: loopback, same path |
| `http://127.0.0.1:3000/other` | Refused: another path |
| `https://localhost:3000/auth` | Refused: https does not match a plain-http registration |
| `myapp://auth` | Refused: custom scheme |

To accept a query on your callback, register the callback with that exact query. Hivesigner keeps your callback's own query and adds its parameters after it.

### Mobile and desktop apps {#native-apps}

Hivesigner puts the token in the callback URL. A custom scheme such as `myapp://` is not tied to one app: another app on the same device can claim it and receive the token. So Hivesigner refuses custom schemes and sends tokens only to an https address or to loopback on the user's own device.

A native app uses one of these instead:

- **An https link it owns.** Register a callback on your domain that the operating system opens in your app (Android App Links or iOS Universal Links).
- **A loopback callback.** The app listens on `127.0.0.1` for the redirect. Register `http://127.0.0.1/auth` (or `localhost`) and use any free port at run time: the port does not have to match.

## Client secret {#client-secret}

The client secret proves that a code exchange comes from your server. It is required for the [code flow](/docs/oauth2#code-flow): your server sends it with each code or refresh token to `/api/oauth2/token`. The token flow does not use it.

- **Generate a long random value**, for example with `openssl rand -hex 32`.
- **Set it on the profile page.** Hivesigner stores only its sha256 hash, in your app account's profile. Leaving the field blank keeps the current secret.
- **Keep it on your server.** Never put it in a web page, a mobile app or a URL.
- **To change it,** set a new one and update your server at the same time.

## Grant @hivesigner posting authority {#grant-hivesigner}

The API broadcasts with the posting key of the @hivesigner account. Hive accepts that signature for your users only when your app account has added @hivesigner to its own posting authority. See [The chain of posting authority](/docs/how-it-works#authority-chain).

1. Select your app account in Hivesigner.
2. Open https://hivesigner.com/authorize/hivesigner.
3. The page reads "Authorize @hivesigner" and "@hivesigner will be able to post, comment, vote and follow as @myapp." Select **Authorize**. This needs the app account's active key.

You do this once. Without it, every broadcast fails with `unauthorized_client` and "Broadcaster account doesn't have permission to broadcast for @myapp". A sign-in only app does not need it.

This grant also lets @hivesigner post as your app account itself, which is one more reason to keep the app account for the app only.

Apps that broadcast through Hivesigner with this grant in place can appear in the app directory on https://hivesigner.com/apps, ranked by how many people use them.

## What users see when something is wrong {#refused-requests}

Hivesigner refuses a request it cannot answer safely. It shows a message and a **Report this problem** button. The request cannot be approved. Nothing is sent to your callback.

| Problem | What the user reads |
| --- | --- |
| The `redirect_uri` is not one of your Redirect URIs | "This app's redirect URL is not registered. For your safety, sign-in is blocked." |
| The `client_id` is not a Hive account | "@myapp is not a Hive account, so there is no app to authorize. Go back to the site and try again." |
| No `redirect_uri` in the request | "This authorization request is incomplete: it names no app or no redirect URL. Go back to the app and try again." |

If your users report one of these, check the `redirect_uri` your app sends against your Redirect URIs, character by character.

## Checklist {#checklist}

1. A Hive account for the app, added to Hivesigner with its active key.
2. On https://hivesigner.com/profile: "This account is an app" on, Redirect URIs listed, a client secret set if you use the code flow.
3. @hivesigner authorized on https://hivesigner.com/authorize/hivesigner, if you broadcast through the API.
4. A sign-in link that sends one of your Redirect URIs exactly. See [Sign in with OAuth2](/docs/oauth2).
