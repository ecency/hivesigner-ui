Hivesigner signs with the keys of the Hive accounts you add to it. You add an account once in each browser you use. Hivesigner then keeps its keys in that browser, encrypted with a passcode if you set one.

## Add an account {#add-account}

1. Check that the address bar of your browser shows `https://hivesigner.com`. See [Check the address first](/docs/safety#check-the-address).
2. Open [hivesigner.com/import](https://hivesigner.com/import). If this browser has no account yet, **Set up Hivesigner** on the home page opens the same form.
3. In **Username**, enter your Hive username in lower case, without the `@`.
4. In **Private key**, paste one of your private keys. See [Which key to add](/docs/accounts#which-key) first.
5. Leave **Protect with a passcode (recommended)** checked and choose a **Passcode**. It needs at least 4 characters. See [Protect it with a passcode](/docs/accounts#passcode).
6. Select **Add account**.

Hivesigner checks the key against your account on the Hive network before it stores anything. It compares the public part of the key with the keys your account lists. The private key itself is not sent anywhere. If the key does not belong to the account, the form says "Invalid username or key. Use your master password or your owner, active, posting or memo key."

The account you add becomes the selected account: the one Hivesigner uses on its screens. If a request sent you to the form, Hivesigner takes you back to that request. Otherwise it opens the **Accounts** page.

### Add another key to an account {#add-a-key}

To add a second key to an account that is already here (the active key next to the posting key, for example), add the account again with the new key. Hivesigner keeps the keys it already has and adds the new one.

If the account has a passcode, keep **Protect with a passcode (recommended)** checked and enter the same passcode. Hivesigner refuses anything else:

- Without a passcode, the form says "This account is protected on this device. Enter its passcode to add the key."
- With a different passcode, it says "Wrong passcode. The key was not saved."

## Which key to add {#which-key}

A Hive account has several private keys. Each one allows different actions.

| Key | What Hivesigner uses it for |
| --- | --- |
| Posting | Signing in to apps, voting, posting and commenting, following, editing your profile and claiming your rewards. |
| Active | Wallet actions such as transfers, powering up or down, delegations, savings and conversions. Witness and proposal votes. Authorizing an app for the first time and revoking an app. |
| Owner | Changing your owner key or your recovery account. You never need it day to day. |
| Memo | Nothing when you sign in or sign a transaction. |

Add the posting key for everyday use. Add the active key only when you need it for a wallet action or to authorize an app for the first time. When a screen needs a key that this device does not have, it says so and lets you add it.

Your master password also works in the **Private key** field. Hivesigner derives your keys from it and stores every key that still matches your account, the owner key included. Adding separate keys keeps the owner key off this device.

> **Note:** Hivesigner signs each transaction with exactly the key it needs. This follows a Hive rule in force since a hard fork in 2025. An active key can no longer sign a posting action such as a vote. An owner key can no longer sign a wallet action. Add the posting key even when the active key is already here.

Signing in to an app is different: it is not a transaction. Hivesigner signs you in with the posting key, or with the active key when this device has no posting key for the account.

## Protect it with a passcode {#passcode}

The passcode is a password you choose for this browser only. It is not your Hive password and it is not one of your keys. Hivesigner uses it to encrypt the account's keys before it stores them. It asks for it again to unlock them.

- Hivesigner does not store your passcode or send it anywhere. Nobody can recover it for you.
- Each account on this device has its own passcode. You can use the same one for all of them.
- A longer passcode is harder to guess. Do not use your Hive master password or one of your keys as the passcode.

Without a passcode, Hivesigner stores the account's keys in this browser without encryption. It opens them by itself every time it starts, so anyone who uses this browser can sign with them. The **Accounts** page marks such an account with **No passcode**.

To add a passcode to an account that has none, add the account again with one of its keys and a passcode. Hivesigner then encrypts all of the account's keys with that passcode.

To change a passcode, [remove the account](/docs/accounts#remove-account) and add it again with the new passcode.

## Unlock an account {#unlock}

An account with a passcode starts locked each time Hivesigner opens: in a new tab, after a reload or when an app sends you to it. You do not need to unlock it in advance. A screen that needs the keys shows a **Passcode** field above its own button (for example **Sign in**, **Approve** or **Unlock**). One click unlocks the account and continues.

A wrong passcode shows "Wrong passcode." and nothing is signed.

Hivesigner keeps unlocked keys in memory only, never in storage. The account stays unlocked in that tab until you close or reload it.

## Switch accounts {#switch-accounts}

The **Accounts** page lists the accounts on this device from A to Z. The selected account has a check mark. From 6 accounts on, a **Search accounts** field filters the list.

Select an account to make it the selected account. Hivesigner does not ask for the passcode here. The screen that needs the keys asks for it.

On a request screen, the row that names the account ("Signing in as", "Authorizing as" or "Signing as") has a **Switch an account** link. It opens the same list in place, so you can pick another account without leaving the request. **Add another account** under the list opens the **Add account** form and brings you back to the request afterwards.

## Remove an account {#remove-account}

1. Open the **Accounts** page.
2. Select the **✕** next to the account. Its label for screen readers is **Remove from Hivesigner**.
3. Confirm when the browser asks "Remove @USERNAME from this device? Its keys here will be deleted."

Removing an account deletes its keys from this browser only. Your Hive account does not change. Apps you authorized keep their access, because that access is stored on the Hive blockchain. To remove it, see [See and remove an app's access](/docs/signing-in#remove-access).

If you remove the selected account, another account on this device becomes the selected one.

If the browser does not let Hivesigner save the change, you see "Removed for this session only: storage is unavailable, so this account will return when you reload."

## If you forget your passcode {#forgotten-passcode}

Nobody can recover a passcode, not even Hivesigner. Your Hive account is not affected: the passcode only protects the copy of your keys in this browser.

1. [Remove the account](/docs/accounts#remove-account) from this device.
2. [Add it again](/docs/accounts#add-account) with its key and a new passcode.

Nothing changes on the Hive blockchain. Apps you authorized keep their access.

## Where your keys are stored {#where-keys-are-stored}

Hivesigner stores your keys only in this browser, on this device, in the storage the browser keeps for hivesigner.com.

- They are not synced. Another browser, another browser profile or another device does not have them. Add the account there too.
- Clearing the site data or browsing data for hivesigner.com deletes them. So does closing a private window.
- Hivesigner is not a backup. Keep your keys or your master password stored safely somewhere else.
