Apps can ask you to sign a Hive transaction, such as a vote, a transfer or a post. They send you a link that opens Hivesigner. Hivesigner shows in plain words what the request does, which key it needs and where it sends you afterwards. Nothing is signed until you approve it. Apps can also ask you to sign a message, which never reaches the blockchain.

## The Confirm transaction screen {#confirm-screen}

A sign link opens a screen titled "Confirm transaction". It shows one card for each operation in the request. An operation is one action on Hive, such as one vote or one transfer.

When a request holds more than one operation, the cards are numbered and a line above them says "This request contains 3 operations. Review every one before approving."

### The summary {#summary}

Each card starts with a sentence that says what the operation does, with the values from the request. For example:

| Operation | What the card says |
| --- | --- |
| A transfer | Send 1.000 HIVE to @bob (and the memo below it, as Memo: ...) |
| A vote | Upvote @alice/my-post (and the vote weight below it, such as 100%) |
| A post or a reply | Publish post "My title", or Reply to @alice/my-post |
| An action that a Hive app defines | Custom action (follow) |
| A change to who controls an account | Update account authorities |

Other operations show their name, such as "Power up" or "Delegate Hive Power".

Next to the sentence, a label shows the key the operation needs: **Posting**, **Active** or **Owner**.

### The details {#details}

Below the sentence, the card lists the values the operation carries:

- the account the operation acts as
- for a post or comment: the permlink (the post's address), the community or tag, the body and the metadata
- for a custom action: every value of its data, one per line, so nothing is cut off
- for a change of authorities: the threshold, the keys and the accounts it sets

A change of authorities also says when it would remove your keys, with "keys: NONE (your key is removed)". A missing threshold shows as "threshold NOT SET (signs as 0)".

In the summary and the details, characters that could hide text or change its direction are shown as `�`. What you read cannot pretend to be something else.

**Show raw operation** (or **Show raw operations**) opens the exact operations that will be signed.

When an amount is given in Hive Power, Hivesigner converts it at the current rate. It shows "Loading the current HIVE Power rate…" and waits for that rate before you can approve.

Some requests carry a transaction that was prepared elsewhere, for example for an account that several people control. The screen then says "This request supplied its own transaction header. Expires: DATE." If others signed it already, it adds "It already carries 2 signatures."

## Which key it needs {#which-key}

Below the cards, one line names the key the whole request needs: "Signs with your posting key", "Signs with your active key" or "Signs with your owner key".

Hivesigner signs with exactly that key. An active key cannot sign a vote and an owner key cannot sign a transfer. This is a Hive rule since a hard fork in 2025. See [Which key to add](/docs/accounts#which-key).

All operations in one request must need the same key. When they do not, the line reads "This transaction needs more than one authority and cannot be signed with a single key." There is no button to approve it. Go back to the app.

Owner key requests are rare. They change who can control or recover your account. Read them twice. See [Read before you approve](/docs/safety#read-before-approving).

### When the key is missing {#missing-key}

If the selected account does not have the key on this device, the screen says so. For example: "This needs your active key, which @USERNAME does not have here."

1. Select **Add another account** below the message. It opens the **Add account** form.
2. Enter the same username and the missing key. If the account has a passcode, enter that passcode too.
3. Select **Add account**. Hivesigner adds the key and brings you back to the request.

If the account is locked, the screen shows a **Passcode** field above the button. One click unlocks the account and approves. If the key turns out to be missing, the screen tells you after the unlock.

If this browser has no account yet, the button reads **Continue** and opens the **Add account** form.

## Approve or sign {#approve}

The account row above the button says "Signing as" with the account that signs. **Switch an account** lets you pick another. See [Switch accounts](/docs/accounts#switch-accounts).

- **Approve** signs the transaction in your browser and sends it to the Hive network. The result reads "Transaction broadcast successfully" with a **Transaction ID** that opens the transaction in a block explorer.
- **Sign** appears instead when the request asks only for a signature. Hivesigner signs the transaction without sending it to the network. It hands the signature to the app, or shows it when the request names no site.

If the network rejects the transaction, you see "Your transaction was not broadcast" with the "Error message" the network gave. You can try again.

## The site you return to {#return-site}

When the request names a site to return to, a notice at the top says "You will be redirected to HOST." After you approve, Hivesigner sends you there. Check that HOST is the site you came from.

When the request names no site, Hivesigner stays on the result.

## A request for another account {#another-account}

A request can be made for a different account than the selected one. Hivesigner shows this in two ways.

**The request must be signed by another account.** The screen says "This request must be signed by @ACCOUNT. Switch to that account." The account row reads "Selected account" and the account list opens below it. Pick that account, or add it with **Add another account**. Hivesigner does not sign the request with any other account.

**An operation acts as another account.** This happens with accounts that several people manage. A warning at the top says "This does not act as @USERNAME but as @ACCOUNT. Only continue if you manage that account too." The details of each card name the account it acts as.

## Requests Hivesigner cannot read {#invalid-requests}

Hivesigner never signs a request it cannot fully read and show you. That includes an operation it does not know, a request with no operations, a value that does not fit the operation (a number that is not a number, a malformed amount) and extra data it cannot show.

The screen then says "Oops, something went wrong. The provided data is invalid." Go back to the app. To tell the Hivesigner team, select **Report this problem**.

## Message signing requests {#message-requests}

Some apps ask you to sign a message instead of a transaction, for example to prove that you own an account. A message is text. Signing it changes nothing on the blockchain.

The screen shows:

- A heading such as "APP asks you to sign a message." When the app has a Hive account, the line below names it: "Hive account @APP_ACCOUNT".
- "Sends you to HOST": the site that gets the signature. The same line appears again next to the button.
- **Message**: the whole text, exactly as it will be signed. Characters that could hide text or change its direction are shown as highlighted codes, such as `\u{200B}`.
- The key it uses: "Signs with your posting key" or "Signs with your active key". Hivesigner never signs a message with the owner key.
- A warning: "Your signature proves to anyone who sees it that @USERNAME signed this exact text. Sign only a message you understand."
- The account row, "Signing as", with **Switch an account**.

Select **Sign** to sign. Hivesigner sends you back to the site with the signature, your username, the key type and the public key that made the signature. A public key is the shareable half of a key pair: it cannot sign anything.

Select **Cancel** to go to your **Accounts** page. The site gets nothing.

If the account does not have the key on this device, the screen says so. For example: "This needs your posting key, which @USERNAME does not have here." Select **Switch an account**, then **Add another account**. [Add the missing key](/docs/accounts#add-a-key) for the same account. Hivesigner brings you back to the request.

### Why some messages are refused {#refused-messages}

**A message that works as a Hivesigner sign-in.** Some text has the exact shape of a Hivesigner sign-in. Signing it would give the site access to your account. Hivesigner never signs such text and says "This message is a Hivesigner token. Signing it would give the site access to your account, so it cannot be signed."

**A request Hivesigner cannot use.** Hivesigner refuses a request with no message or no return address. It also refuses a request for a key other than posting or active, or one whose return address is not secure or is not registered to the app. It says "This signing request cannot be used: it needs a message, a posting or active key and a secure redirect URL registered to the app. Go back to the site and try again."

If Hivesigner cannot read the app's details from the Hive network, it says "Could not load the account details from the Hive network." It signs nothing until it can. Select **Retry**.

## Sign a message yourself {#sign-message}

You can sign a message on your own to prove that you control an account.

1. Open [hivesigner.com/signmessage](https://hivesigner.com/signmessage). The footer links to it as **Sign message**.
2. If the selected account is locked, enter its passcode and select **Unlock**. If no account is selected, the page links to your accounts.
3. Type the text in **Message**. Hivesigner removes spaces and line breaks at the start and end.
4. Choose the key in **Key to sign with**. It lists the keys of the selected account on this device and starts with the strongest one. Choose **Posting** unless you need another key.
5. Select **Sign message**.

The **Signature summary** shows the **Author**, the **Authority used**, a **Verification token** and a **Verification link**. The verification token holds the message, your username and the signature in one piece of text. Share the link or the token with whoever should check the message.

A signature does not reveal your key. It does show which key made it.

## Verify a message {#verify-message}

1. Open [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage). The footer links to it as **Verify message**.
2. Paste the token in **Verification token** and select **Verify signature**.

A verification link opens this page and checks the message by itself.

The result says "Signature is valid for USERNAME" or "Signature could not be verified with account keys." Below it, you see the **Author**, the **Recovered public key**, the **Matched authority** (the key type that signed) and the **Message**.

Hivesigner checks the signature against the keys the account has now on the Hive network. A message signed with a key that the account has since replaced no longer verifies.
