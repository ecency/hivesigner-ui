Your Hive keys control your account. Anyone who has them can act as you. Hivesigner keeps them in your browser and shows you what you sign. These habits keep them safe.

## Check the address first {#check-the-address}

Before you type a key or a passcode, look at your browser's address bar. It must show `https://hivesigner.com`.

- A fake page copies the look of Hivesigner, not its address. Read the whole address: `hivesigner.com.example.net` is not hivesigner.com.
- Watch for an extra word, a missing or swapped letter or another ending.
- Hivesigner shows the address it runs on in its top bar. A fake page can show any text there, so trust the browser's address bar instead.
- To add a key, type the address yourself or use a bookmark. Do not follow a link from a message, an ad or a search result.

## What you never need to give {#never-needed}

- Signing in, posting, voting, wallet actions and authorizing apps never need your master password or your owner key. See [Which key to add](/docs/accounts#which-key).
- Apps that use Hivesigner never need your keys. They send you to hivesigner.com. Your keys stay in your browser. A site that asks you to type a key into its own page is not asking through Hivesigner.
- Never give your keys or your passcode to anyone who asks, in a chat, an email or a support request.

## Add only the keys you need {#only-the-keys-you-need}

- Add the posting key for everyday use.
- Add the active key only for wallet actions, for authorizing an app the first time or for revoking an app.
- Avoid adding your master password. If you add it, Hivesigner stores every key it unlocks, the owner key included.

After you authorize an app for the first time, the active key stays on this device. To keep only the posting key here, [remove the account](/docs/accounts#remove-account). Then [add it again](/docs/accounts#add-account) with the posting key only.

## Use a passcode {#use-a-passcode}

Without a passcode, Hivesigner stores your keys in this browser without encryption. It opens them by itself every time it starts, so anyone who uses this browser can sign as you. The **Accounts** page marks such an account with **No passcode**.

- Choose a passcode that others cannot guess. Hivesigner accepts 4 characters or more. A longer one is harder to guess.
- Do not use your Hive master password or one of your keys as the passcode.

On a computer that other people use:

- Always use a passcode.
- Close the Hivesigner tab when you are done. An unlocked account stays unlocked in that tab until you close or reload it.
- On a computer that is not yours, [remove the account](/docs/accounts#remove-account) before you leave. Better still, do not add your keys there at all.

## Read before you approve {#read-before-approving}

- **Check the account.** The row that says "Signing in as", "Authorizing as" or "Signing as" names the account that answers. Switch if it is the wrong one.
- **Check where you go next.** "Sends you to HOST" and "You will be redirected to HOST." name the site that gets the result. It should be the site you came from.
- **Check who is asking.** An app chooses its own display name. The line "Hive account @APP_ACCOUNT" shows its real Hive account. On the page for authorizing or revoking an app, Hivesigner says of the app's profile: "Everything above is published by the app account itself. Hivesigner does not verify any of it."
- **Check the key.** A vote, a post or a follow needs the posting key. If you meant to vote and the screen asks for your active or owner key, the request does something else. Stop.
- **Read authority changes.** "keys: NONE (your key is removed)" means the change would remove your key from your account. Approve a change to your keys only if you started it yourself.
- **Read warnings.** "This does not act as @USERNAME but as @ACCOUNT." means the request acts for another account.
- **Sign only messages you understand.** A signed message proves to anyone that you signed that exact text.

See [Review and sign](/docs/signing) for everything the signing screens show.

## Spot a fake page {#spot-a-fake-page}

A page that looks like Hivesigner is fake when:

- **The address is not hivesigner.com.** This is the one sign that always counts.
- **It requires your master password or owner key to sign in.** The real Hivesigner signs you in with your posting key.
- **It does not know the accounts you added.** Your browser keeps the storage of each site apart. A fake site on another address cannot see the accounts you added on hivesigner.com, so it asks for a key again. The real Hivesigner remembers them in this browser and asks only for your passcode, if you set one. It asks for a key only when a request needs one that this device does not have. It then names the key. For example: "This needs your active key, which @USERNAME does not have here."

A new browser or a new device does not have your accounts either. There, check the address before you add one.

If you typed a key into a fake page, treat that key as stolen. Change it on Hive as soon as you can.

## The code is open source {#open-source}

Hivesigner's code is public at [github.com/ecency/hivesigner-ui](https://github.com/ecency/hivesigner-ui). Anyone can read it and check how it handles your keys. To report a problem, open an issue at [github.com/ecency/hivesigner-ui/issues](https://github.com/ecency/hivesigner-ui/issues). The **About** page links there as **Report a bug**.
