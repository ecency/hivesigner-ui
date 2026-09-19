Hivesigner lets people use their Hive account in your app without giving your app their keys. It has two parts: a browser signer at https://hivesigner.com and an API at `https://hivesigner.com/api/`. This page explains what each part does and the two ways an app uses them.

## The browser signer {#browser-signer}

The browser signer is the Hivesigner website. People add their Hive accounts to it. Their keys stay in their own browser: Hivesigner does not send a key to any server. Your app never sees one.

The signer signs three kinds of things, each after the user has seen what they are signing:

- **Sign-in tokens.** Your app sends someone to Hivesigner to sign in. Hivesigner shows your app's name and what it asks for. When the user approves, Hivesigner signs a short statement with their key that names their account and your app. That signed statement is the token your app receives. See [Sign in with OAuth2](/docs/oauth2) and [Tokens](/docs/tokens).
- **Transactions.** A sign link opens a transaction for review. When the user approves, Hivesigner signs it with the key it needs. It then sends it to the Hive network from the browser, unless the link asks only for the signature. See [Sign links](/docs/sign-links).
- **Messages.** Your app can ask a user to sign a text with their key, to prove they control the account. See [Message signing](/docs/message-signing).

## The API {#api}

The API broadcasts posting operations for a user who signed in to your app: posts and comments, votes, follows and other `custom_json` operations, reward claims and profile updates. Your app sends the operations together with the user's token. The API checks the token, signs the transaction with the posting key of the @hivesigner account and broadcasts it to Hive.

The API also returns the signed-in user's account, exchanges codes for tokens and lists the apps that use Hivesigner. See [REST API](/docs/api).

## The chain of posting authority {#authority-chain}

On Hive, an account can let another account act with its posting authority. The API relies on two of these grants:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **The user adds your app account to their posting authority.** The consent screen does this the first time a user approves posting access for your app. It needs the user's active key once.
2. **Your app account adds @hivesigner to its posting authority.** You do this once, when you [register your app](/docs/register-app#grant-hivesigner).

Before it broadcasts, the API checks that both grants are in place. It only broadcasts operations authored by the user the token names.

The user can remove your app's access at any time on https://hivesigner.com/authorized-apps. After that, the API can no longer post for them through your app.

## Two ways to integrate {#two-ways-to-integrate}

### Sign in, then broadcast through the API {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

The user approves once. After that your app can vote, comment and post for them without asking again, until the token expires or the user removes your app's access. Use this for everyday social actions.

You need an app account with registered callbacks and the @hivesigner grant. See [Register your app](/docs/register-app). If you only want to know who the user is, see [Sign-in without posting access](/docs/login-only).

### Sign links {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

The user sees every transaction before it is signed. Sign links cover 41 Hive operations, including transfers and other wallet actions that need the active key. The API never handles those. You do not need an app account for sign links. See [Sign links](/docs/sign-links).

### Which to choose {#which-to-choose}

- **Frequent posting actions** (votes, comments, follows): sign in with OAuth2, then use the API.
- **Wallet actions**, or anything that needs the active key: use sign links.
- **Both**: many apps sign people in with OAuth2 for social features and use sign links for transfers.
- **Only the user's identity**: see [Sign-in without posting access](/docs/login-only).

## Source code {#source-code}

Hivesigner is open source:

- The browser signer: https://github.com/ecency/hivesigner-ui
- The API: https://github.com/ecency/hivesigner-api
- The JavaScript SDK (npm package `hivesigner`): https://github.com/ecency/hivesigner-sdk. See [SDKs](/docs/sdk).
