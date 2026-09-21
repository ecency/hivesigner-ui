Some apps only need to know who a person is on Hive. They never post, vote or broadcast anything for them. Hivesigner can sign people in to such an app without any posting authority. The user proves they control a Hive account. Your app learns its name. This page shows the two ways to do it and how to check the result safely.

## Two ways {#two-ways}

- **With an app account:** your app has its own Hive account and asks for `scope=login`. The token names your app.
- **Without an app account:** a site with no Hive account of its own sends only a `redirect_uri`. The token names no app. Your site checks it itself.

Neither needs a grant from the user or from your app account, so nothing changes on the user's account. Hivesigner signs the sign-in with the posting key, or with the active key when the device has no posting key for the account.

## With an app account {#app-account}

1. [Register your app](/docs/register-app): create its Hive account and list your callbacks. You need no client secret and no @hivesigner grant.
2. Send the user to:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. The user sees "Sign in to APP" with **Scope** "View your account username". They select **Sign in**.
4. Hivesigner redirects to your callback:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [Compare `state`](/docs/oauth2#state), then check the token. It is a `login` token that names your app, so either of these works:
   - call [`GET /api/me`](/docs/api#me) with it, which answers with the account in `user` and `scope` `["login"]`, then decode the token and check `type` and `app` ([Ask the API](/docs/tokens#check-with-the-api));
   - or [check it yourself](/docs/tokens#check-it-yourself) with `type: 'login'` and your app's name.

A `login` token cannot broadcast: `/api/broadcast` refuses every operation sent with it.

## Without an app account {#no-app-account}

1. Send the user to the authorize URL with a `redirect_uri` and no `client_id`:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   The callback must be `https://`, or `http://` on loopback (`localhost`, `127.0.0.1`, `[::1]`). There is no list to register it in. Hivesigner ignores `scope` and `response_type` here: the answer is always a sign-in token.

2. The user sees "HOST wants to confirm your Hive username.", where HOST is the host of your callback. They select **Sign in**.
3. Hivesigner redirects to your callback:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [Compare `state`](/docs/oauth2#state), then check the token yourself. The API does not accept a token that names no app, so your server verifies the signature against the account's keys. See [Check it yourself](/docs/tokens#check-it-yourself), with `type: 'login'` and no `app`.

When the callback is not a web address, or is plain `http://` off loopback, Hivesigner refuses the request and tells the user why.

## Which one to use {#which-one}

| | With an app account | Without an app account |
| --- | --- | --- |
| What the user sees | Your app's name, picture and Hive account | Only your site's host |
| Setup | A Hive account with your callbacks listed | None |
| The token names | Your app | No app |
| Check the token with | `/api/me` or your own code | Your own code |
| Later posting access | Same account: ask for `posting` and [grant @hivesigner](/docs/register-app#grant-hivesigner) | Needs an app account first |

Use an app account when you can. Users see your app's name and picture. Your server can reject tokens that were made for another app. You can move to posting access later with the same account.

Use the second way when your site has no Hive account and does not want one.

## Check the sign-in safely {#check-safely}

- **Bind the request with `state`.** Generate a random value per sign-in, store it in the user's session, compare it on your callback and use it once. See [Protect the request with state](/docs/oauth2#state).
- **Check the type.** Accept only `signed_message.type` `login`. A code or a refresh token is not a sign-in.
- **Check the app.** With an app account, `signed_message.app` must be your app. Without one, there must be no `app`.
- **Check the age.** You check the token right after the redirect, so accept it only within a few minutes of its `timestamp` (for example 5 minutes, with a minute of clock difference).
- **Use each token once.** After a successful check, start your own session (for example an httpOnly cookie) and discard the Hivesigner token. Keep a record of the tokens you accepted until they are too old to pass the age check. Refuse any you see again.
- **Keep the token out of logs.** It arrives in your callback's query string. See [Keep tokens safe](/docs/tokens#keep-tokens-safe).

## Examples {#examples}

Sites such as https://hivesearcher.com and https://openhive.chat let people sign in with their Hive account for features that stay off chain, such as search and chat. They need to know who the person is and nothing more.
