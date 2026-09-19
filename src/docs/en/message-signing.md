Your app can ask a user to sign a text message with their posting or active key. The signature proves that the user controls the account. Nothing is broadcast: the message never reaches the blockchain. Hivesigner signs the same way as Hive Keychain's `requestSignBuffer`, so the server code that checks a Keychain signature also checks a Hivesigner one.

## Request a signature {#request}

Send the user to `https://hivesigner.com/sign-buffer` with these query parameters:

| Parameter | Required | Meaning |
| --- | --- | --- |
| `message` | Yes | The exact text to sign. It must hold more than spaces. |
| `redirect_uri` | Yes | Where Hivesigner sends the result. See [Callback rules](#callback-rules). |
| `authority` | No | `posting` or `active`, in any letter case (`Posting` works too). `posting` when absent or empty. Any other value is refused. |
| `client_id` | No | Your app account. `clientId` is read too. With it, `redirect_uri` must be one of your app's callbacks. |
| `state` | No | Any value. Hivesigner returns it unchanged. |
| `account` | No | The account you expect to sign. Hivesigner selects it when it is on the device and ignores it otherwise. `select_account` is read too. |

Build the URL with `URLSearchParams`, so that every value is encoded:

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### Callback rules {#callback-rules}

- The callback must be `https://`. Plain `http://` works only on loopback: `localhost`, `127.0.0.1` or `[::1]`.
- **With `client_id`**, the callback must be registered on that app account, matched as for sign-in. See [Callbacks](/docs/register-app#callback-rules). Hivesigner reads the app's callbacks from Hive when the request opens and signs nothing until it has read them. When Hive cannot be reached, the user gets a **Retry** button.
- **Without `client_id`**, any callback that follows the first rule works. Hivesigner then names the callback's host as the requester, for example "HOST asks you to sign a message."

Send `client_id` when you have an app account. The user then sees your app's name and account. Only your registered callbacks can receive the signature.

Hivesigner refuses a request with no message, an unknown `authority`, a missing or unusable callback or a `client_id` that is not a Hive account. The user sees "This signing request cannot be used: it needs a message, a posting or active key and a secure redirect URL registered to the app. Go back to the site and try again." and a **Report this problem** button.

### What the user sees {#what-the-user-sees}

- A heading that names your app (or the callback's host) and "Sends you to HOST".
- The whole message, exactly as it will be signed. Characters that could hide text or change its direction are shown as codes such as `\u{200B}`.
- "Signs with your posting key" or "Signs with your active key".
- A warning: "Your signature proves to anyone who sees it that @USERNAME signed this exact text. Sign only a message you understand."
- **Sign** and **Cancel**. A locked account asks for its passcode first.

[Message signing requests](/docs/signing#message-requests) describes the screen for users.

## What your callback receives {#callback}

When the user selects **Sign**, Hivesigner sends them to your callback with these query parameters:

| Parameter | Value |
| --- | --- |
| `signature` | The signature, as a hex string of 130 characters |
| `public_key` | The public key of the key that signed, such as `STM...` |
| `username` | The account that signed |
| `authority` | `posting` or `active` |
| `state` | Your `state`, whenever the request had one (an empty one included) |

Hivesigner adds them to your callback's query, after `?` or `&` and before any `#fragment`. Your own query stays as it is.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

When the user selects **Cancel**, Hivesigner opens their account list. Your callback gets nothing.

> **Warning:** Anyone can open your callback with made-up values. Treat every parameter as a claim until your server has checked the signature.

## Verify the signature {#verify}

Check the signature on your server:

1. Keep the message you asked for on your server, with its `state`. Do not trust a copy that comes back from the browser.
2. Hash the message: sha256 over its UTF-8 bytes.
3. Recover the public key from the signature and that hash.
4. Load the account from Hive. Check that the recovered key belongs to the authority you asked for, with enough weight to sign alone.
5. Check that `state` is the one you issued. Accept each message once.

This example uses dhive (https://www.npmjs.com/package/@hiveio/dhive):

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

The same check works for a signature from Hive Keychain's `requestSignBuffer`. Compare against the key you recovered: `public_key` in the callback is only a hint.

## Messages Hivesigner does not sign {#refused-messages}

A message that is a JSON object with a `signed_message` key has the shape of a Hivesigner token. Signing it would give the requester access to the user's account. Hivesigner never signs such a message. It tells the user "This message is a Hivesigner token. Signing it would give the site access to your account, so it cannot be signed."

Use plain text, or JSON without a `signed_message` key. Say what the signature is for and add a value you generate once, for example:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## The Sign message tool {#sign-message-tool}

People can also sign a message on their own at https://hivesigner.com/signmessage (**Sign message**) and check one at https://hivesigner.com/verifymessage (**Verify message**). See [Sign a message yourself](/docs/signing#sign-message).

That tool signs differently from `/sign-buffer`. It signs a Hivesigner token body that holds the message, the account and the time. It shares the result as a **Verification token**. Check such a token on the **Verify message** page or as described in [Check it yourself](/docs/tokens#check-it-yourself), not with the code above.
