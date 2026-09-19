The official JavaScript SDK builds sign-in URLs and sign links and calls the Hivesigner API for you. For Python, community libraries exist. Any other language can call the [REST API](/docs/api) directly.

## JavaScript SDK {#javascript}

The SDK is the npm package `hivesigner`. Its source is at https://github.com/ecency/hivesigner-sdk. It is written in TypeScript and ships its types.

Version 4 needs Node.js 18 or later, because it uses the built-in `fetch`. In browsers it needs ES2017 or later. Where no global `fetch` exists, add a polyfill before you use the SDK. On an older Node.js, stay on version 3.

### Install {#install}

```bash
npm install hivesigner
```

For a page without a build step, load the browser bundle. It defines a global `hivesigner`:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Create a client {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Option | Meaning |
| --- | --- |
| `app` | Your app account, sent as `client_id`. |
| `callbackURL` | Where Hivesigner sends the user back. It must be one of your app's callbacks, character for character (a plain-http loopback callback may differ in host and port, see [Callbacks](/docs/register-app#callback-rules)). |
| `scope` | A list, joined with commas into the `scope` parameter. See [Scopes](/docs/oauth2#scopes). |
| `responseType` | `'code'` for the code flow. Leave it out for the token flow. |
| `accessToken` | The user's access token, when you already have one. |
| `apiURL` | The origin of the API. The SDK adds `/api/` to it. The default is `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` and `setApiURL` change the client later. Each one returns the client.

### Sign the user in {#sign-in}

`getLoginURL(state, account)` returns the sign-in URL:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` comes back to your callback unchanged. Use it to tie the answer to the request.
- `account` is optional: a username. Hivesigner selects that account when it is on the device and ignores it otherwise.

In a browser, `client.login({ state: 'STATE' })` sends the user to the same URL, without an account.

In the token flow, your callback receives `access_token`, `expires_in` and `username`. Give the token to the client:

```js
client.setAccessToken('ACCESS_TOKEN');
```

The SDK has no method for the code flow's exchange. Your server posts the code and the client secret to the API itself, as [Exchange the code](/docs/oauth2#exchange-code) shows.

### Get the user {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` is the user's Hive account as the chain returns it. `scope` lists what the token allows.

### Broadcast {#broadcast}

`broadcast(operations)` sends operations to the API, which broadcasts them for the user. The API accepts only posting operations that the token's user authors: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` with posting authority, `claim_reward_balance` and `account_update2` for profile metadata. See [What broadcast accepts](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Name the user in each operation. The API does not replace `__signer`.

These helpers build one operation each and call `broadcast`:

| Method | Broadcasts |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` runs from `-10000` to `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. For a new post, `parentAuthor` is `''`. `jsonMetadata` can be an object: the SDK turns it into a string. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Pass `[]` as `requiredAuths` and `['USERNAME']` as `requiredPostingAuths`. `json` is a string. |
| `reblog(account, author, permlink)` | `custom_json` with id `follow`, reblogging the post |
| `follow(follower, following)` | `custom_json` with id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` with id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` with id `follow`, `what: ['ignore']` (mute) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Amounts are strings such as `'0.000 HIVE'`, `'0.000 HBD'` and `'1.000000 VESTS'`. |

`updateUserMetadata()` is deprecated. To change a user's profile, broadcast `account_update2` with a new `posting_json_metadata`.

### Log out {#log-out}

`revokeToken()` is the SDK's log-out call. It sends the token to the API's revoke endpoint and then removes it from the client. When the call rejects, call `removeAccessToken()` yourself. Also delete the token wherever your app stored it.

To end your app's access for good, the user removes it at https://hivesigner.com/authorized-apps. See [See and remove an app's access](/docs/signing-in#remove-access).

### Sign links {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` and `sendTransaction(tx, params)` return a `https://hivesigner.com/sign/...` link. `params` takes `callback`, `no_broadcast` and `signer`. See [Sign links](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

In TypeScript the types require the third argument: pass `undefined` to get the link back.

In a browser, pass a function as the third argument to open the link in a new tab instead. The function is not called and nothing is returned. Call it from a click handler, or the browser may block the new tab and the call throws.

### Promises and callbacks {#promises-and-callbacks}

`me`, `broadcast`, the helpers and `revokeToken` return a promise. Pass a function as the last argument to use a callback instead. It receives `(error, result)`.

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

When the API answers with an error, the promise rejects with the API's error body, `{ error, error_description }`. With a callback, that body is the `error` argument. When the answer is not JSON, it rejects with the parse error.

## Python {#python}

These libraries come from the community. Their authors maintain them, not the Hivesigner team. Check them against the [REST API](/docs/api) before you rely on them.

| Library | Author |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, module `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
