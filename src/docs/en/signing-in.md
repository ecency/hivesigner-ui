When an app lets you sign in with Hivesigner, it sends you to hivesigner.com with a request. Hivesigner shows who is asking, what they ask for and which of your accounts answers. You decide there. The app never receives your keys: it gets a proof of your username, signed in your browser.

## The request screen {#request-screen}

From top to bottom, the screen shows:

- **The app.** Its picture and a heading. When the app asks for posting access for the first time, the heading reads "APP is requesting access to your account." Otherwise it reads "Sign in to APP". The app chooses the name in it.
- **Hive account @APP_ACCOUNT.** The app's real Hive account. An app can call itself anything, but it cannot change this name. Check it.
- **Sends you to HOST.** The site Hivesigner sends you back to when you approve.
- **Scope.** What the app asks for: [sign-in only or posting access](/docs/signing-in#scopes).
- **The account row.** "Authorizing as" or "Signing in as", with the account the app will get and a **Switch an account** link. See [Choose the account](/docs/signing-in#choose-account).
- **The button.** **Authorize** or **Sign in**. If the account is locked, a **Passcode** field sits above it and one click unlocks the account and continues.
- **Cancel.** It takes you to your **Accounts** page. Hivesigner sends nothing to the app.

If this browser has no account yet, the button reads **Continue**. It opens the **Add account** form and brings you back to the request afterwards. See [Add an account](/docs/accounts#add-account).

## Sign-in only or posting access {#scopes}

An app asks for one of two things. There is nothing in between.

### Sign-in only {#sign-in-only}

**Scope** shows "View your account username". The app learns which Hive account you are, confirmed by your signature. It gets no permission to act for you. The button reads **Sign in**.

A site without a Hive account of its own can also ask you to sign in. Its screen reads "HOST wants to confirm your Hive username." Such a request is always sign-in only. Hivesigner names the site by its address, because that address is the one thing you can check about it.

### Posting access {#posting-access}

**Scope** shows "With your posting authority, APP will be able to:" followed by what that means:

- **Post and comment:** publish posts and comments on your behalf.
- **Vote:** upvote and downvote with your account.
- **Follow and update your feed:** follow, mute and reblog on your behalf.

Posting authority is the part of your Hive account that controls everyday actions. Approving adds the app's Hive account to your posting authority. That is one grant on the Hive blockchain, not a list of separate permissions.

## What posting access allows {#what-posting-access-allows}

With posting access, the app can do as you anything your posting key can do:

- publish, edit and delete your posts and comments
- vote
- follow, mute and reblog
- edit your profile
- claim your rewards into your own wallet
- other everyday actions that Hive apps and games use

It can never:

- move your funds: send HIVE or HBD, power up or down, delegate Hive Power or use your savings
- change your keys or who controls your account
- give access to other apps

> **Warning:** Only authorize apps you trust. Posting access lasts until you revoke it. It is stored on the Hive blockchain, not in Hivesigner: removing the account from Hivesigner does not end it.

## The first time you authorize an app {#first-time}

The first time you give an app posting access, the screen shows this notice: "First-time authorization: this adds @APP_ACCOUNT to your posting authority on-chain and needs your active key once. That account will be able to post as you until you revoke it."

Changing who can post for your account is a change to the account itself, so it needs your active key. If this device does not have it, the screen asks for it in place:

1. Paste your active key in **Active key or master password for @USERNAME**. Hivesigner checks it against your account on the Hive network and saves it on this device with your other keys. If you paste your master password, Hivesigner keeps only the active key from it, plus the posting key when this device has none.
2. If the account has no passcode, the form offers **Protect with a passcode (recommended)**, checked by default. If the account has one and Hivesigner needs it again, the form asks for it in **Passcode for @USERNAME**.
3. Select **Add active key**, then **Authorize**.

Hivesigner then sends the change to the Hive network from your browser. It waits until the change shows on the blockchain before it sends you back to the app, signed in. If that takes too long, you see "Authorization was submitted but is still confirming. Please try again in a moment."

The active key stays on this device afterwards. To keep only the posting key here, see [Add only the keys you need](/docs/safety#only-the-keys-you-need).

## Authorize an app from the directory {#directory}

Each app on [hivesigner.com/apps](https://hivesigner.com/apps) opens a page titled "Authorize @APP_ACCOUNT". It shows what the app publishes about itself and the sentence "@APP_ACCOUNT will be able to post, comment, vote and follow as @USERNAME."

Selecting **Authorize** gives the app posting access right away, as the first-time screen does. It needs your active key. No app asked you for this, so use it only when you mean to. **Cancel** takes you to your **Accounts** page.

When your account already gave the app posting access, the page says "@APP_ACCOUNT is authorized." and offers **Continue**.

## Coming back to an app {#coming-back}

When your account already gave an app posting access, nothing new is granted. The screen is shorter:

- The heading reads "Sign in to APP".
- A line says "You authorized @APP_ACCOUNT before. Nothing new is granted."
- The account row reads "Signing in as".
- The button reads **Sign in**.

You need only your posting key (or your active key) for this. If you revoked the app in between, the first-time screen shows again.

## Choose the account {#choose-account}

The account row names the account the app will get. Check it before you approve, especially when you have several accounts on this device.

- Select **Switch an account** to open the list of your accounts in place. Pick another one and the screen changes to that account.
- Select **Add another account** under the list to add an account that is not on this device yet. Hivesigner brings you back to the request afterwards.

An app can suggest which account to use. If that account is on this device, Hivesigner selects it. You can still switch.

## When Hivesigner refuses a request {#refused-requests}

Hivesigner does not let you approve a request it cannot check. The screen shows one of these messages instead:

| Message | What it means |
| --- | --- |
| "This app's redirect URL is not registered. For your safety, sign-in is blocked." | The return address is not one the app listed on its Hive account. |
| "@APP_ACCOUNT is not a Hive account, so there is no app to authorize. Go back to the site and try again." | The request names an app that does not exist. |
| "This site asked to be sent your login over a plain http:// address. Hivesigner only sends it over https. Ask the site to use a secure address." | The return address is not secure. |
| "This site asked to be sent your login to an address that is not a web URL. Go back to the site and try again." | The return address is not a web address. |
| "This authorization request is incomplete: it names no app or no redirect URL. Go back to the app and try again." | The request is missing parts. |

Go back to the app and try again. If the problem stays, select **Report this problem**. It sends the link and your optional note to the Hivesigner team, with secrets blanked out.

If Hivesigner cannot reach the Hive network, it shows "Could not load the account details from the Hive network." Select **Retry**.

## See and remove an app's access {#remove-access}

1. Open [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps). The footer links to it as **Authorized apps**.
2. The page shows "Apps that can post as @USERNAME." for the selected account, with each app below. To see another account's apps, select it on the **Accounts** page first.
3. If the account is locked, enter its passcode and select **Unlock**.
4. Select **Revoke** next to the app. When the active key is on this device, this removes the app's access at once.

The list shows every account that can post as yours on its own, including any you added with other tools.

Revoking is a change to your account on the Hive blockchain, so it needs your active key once. If this device does not have it, **Revoke** opens a page for that app ("Revoke @APP_ACCOUNT") that asks for the active key in place. It says "@APP_ACCOUNT will no longer be able to act as @USERNAME." Add the key, then select **Revoke**.

When you revoke an app, Hivesigner removes the app's account from your account's posting authority (and from its active authority, if it is there). From then on the app can no longer post, vote or act as you. If the app asks for posting access again later, you see the first-time screen.

Revoking does not log you out of the app's own website. Log out there too if you want.
