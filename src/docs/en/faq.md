Short answers to common questions. Each one links to the page with the details.

## Using Hivesigner {#using-hivesigner}

### Is Hivesigner free? {#is-it-free}

Yes. Hivesigner does not charge people or apps. Its source code is open under the MIT license.

### Does Hivesigner ever see my keys? {#keys}

No. Your keys stay in your browser on your device. Hivesigner signs there. They are never sent to Hivesigner's servers or to the apps you use. See [Where your keys are stored](/docs/accounts#where-keys-are-stored) and [Keep your keys safe](/docs/safety).

### What if I forget my passcode? {#forgotten-passcode}

Nobody can recover a passcode, not even Hivesigner. Remove the account from Hivesigner and add it again with your Hive key and a new passcode. Your Hive account and the apps you authorized do not change. See [If you forget your passcode](/docs/accounts#forgotten-passcode).

### Can I use Hivesigner on my phone? {#phone}

Yes. Open https://hivesigner.com in your phone's browser and add your account there. Your keys are stored in that browser only, so add the account on each device you use. See [Add and manage accounts](/docs/accounts).

### Which apps use Hivesigner? {#which-apps}

https://hivesigner.com/apps lists the apps that broadcast to Hive through Hivesigner, most used first. Each app publishes its own name and description. Hivesigner does not verify them.

### How is Hivesigner related to Hive Keychain? {#hive-keychain}

They are separate tools. Hive Keychain is a browser extension and a mobile app. Hivesigner is a website, so there is nothing to install. Their message signatures are compatible: an app checks a signed message from either one with the same code. See [Message signing](/docs/message-signing).

## Building with Hivesigner {#building}

### Can I use Hivesigner in a mobile app? {#mobile-app}

Yes. Send the user to Hivesigner in a browser and use a callback your app can receive: an https link your app owns (Android App Links or iOS Universal Links) or a loopback address such as `http://127.0.0.1/auth`. Custom schemes such as `myapp://` are refused. See [Mobile and desktop apps](/docs/register-app#native-apps).

### Do I need an app account? {#app-account}

You need one to sign people in with posting access and to broadcast through the API. See [Register your app](/docs/register-app). [Sign links](/docs/sign-links) and [message signing](/docs/message-signing) work without one. So does [sign-in without posting access](/docs/login-only).

### Can the API send transfers? {#transfers}

No. The API broadcasts posting operations only, such as votes, comments and follows. For transfers and other actions that need the active key, use [sign links](/docs/sign-links): the user approves each one with their own key.

### Which languages have an SDK? {#languages}

The official SDK is for JavaScript. Community libraries exist for Python. Any language can call the REST API. See [SDKs](/docs/sdk) and [REST API](/docs/api).

## Help {#help}

### Where can I get help? {#get-help}

Ask in the HiveDevs Discord server: https://discord.gg/pNJn7wh. Report a bug as an issue on the GitHub repository it concerns: https://github.com/ecency/hivesigner-ui for the website, https://github.com/ecency/hivesigner-api for the API or https://github.com/ecency/hivesigner-sdk for the JavaScript SDK. On a screen that refuses a request, **Report this problem** sends the problem to the Hivesigner team.

### How can I contribute? {#contribute}

Hivesigner is open source on GitHub, in the three repositories above. Open an issue with a bug or an idea. Send a pull request with a fix.
