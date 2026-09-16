export default {
  common: {
    continue: 'Continue',
    continue_to: 'Continue to {item}',
    cancel: 'Cancel',
    try_again: 'Please try again later.',
    save: 'Save',
    yes: 'Yes',
    no: 'No',
    invalid_integrity: 'This website most likely phishing attempt. Please make sure to use <a class="underline" href="https://hivesigner.com" target="_blank" rel="noopener">hivesigner.com</a> only.',
    logged_in: 'Logged In',
    decrypted: 'Decrypted',
    encrypted: 'Encrypted'
  },
  index: {
    tagline: 'One secure login for the Hive blockchain',
    lede: 'Hivesigner keeps your Hive keys on your own device, shows you exactly what a transaction does before you sign it, and lets apps ask for only the permission they need.',
    sign_in_with: 'Sign in to an app',
    browse_apps: 'Browse apps',
    keys_title: 'Your keys never leave this device',
    keys_body: 'Keys are stored only in this browser and are never uploaded. Set a passcode and they are encrypted at rest as well.',
    review_title: 'See what you are signing',
    review_body: 'Anything you sign here is shown in plain language first, with the account it signs as and the authority it needs. An app you have authorized posts on its own, until you revoke it.',
    scope_title: 'Apps get only what they ask for',
    scope_body: 'An app can request posting access to publish on your behalf, or just your username. Active and owner keys stay with you.',
    powering: 'Powering apps on Hive',
    see_all_apps: 'See all apps',
    developers_cta: 'Building an app? Add Hivesigner sign-in with OAuth2.',
    title: 'Hivesigner',
    description: `Secure way to sign with Hivesigner. Best security for users and developers to integrate industry standard OAuth2 for their Blockchain applications. Transform web 2.0 apps into web 3.0 decentralized apps.`,
    get_started: 'Get started',
    secure_way_sign_in: 'Secure way to sign',
    eyebrow: 'Secure · Simple · For Hive',
    hero_title: 'Sign in to Hive apps',
    hero_title_accent: 'without sharing your keys',
    set_up: 'Set up Hivesigner',
    your_accounts: 'Your accounts',
    mini_keys: 'Keys stay on your device',
    mini_review: 'Review what you sign',
    mini_scope: 'Apps get only posting access',
    preview_wants_access: 'wants to access your Hive account',
    preview_account: 'your-account',
    preview_with_posting: 'With your posting authority, {app} will be able to:',
    preview_can_post: 'Post and comment',
    preview_can_post_body: 'Publish posts and comments on your behalf',
    preview_can_vote: 'Vote',
    preview_can_vote_body: 'Upvote and downvote with your account',
    preview_can_follow: 'Follow and update your feed',
    preview_can_follow_body: 'Follow, mute and reblog on your behalf',
    preview_one_grant: 'All of this is one posting-authority grant, created on this device. The app never receives a key, and it cannot touch your funds.',
    preview_badge: 'Example',
    preview_caption: 'What a permission request looks like.',
    preview_revoke: 'You can revoke any app at any time.',
    dev_eyebrow: 'For developers',
    dev_title: 'Building on Hive?',
    dev_body: 'Add Hive sign-in to your app with OAuth2, and let people grant posting access without ever handing over a key.',
    dev_cta: 'Read the developer docs',
    trust_local_title: 'Local key storage',
    trust_local_body: 'In your browser, never uploaded',
    trust_open_title: 'Open source',
    trust_open_body: 'Transparent and auditable',
    trust_scope_title: 'Two scopes, nothing finer',
    trust_scope_body: 'Login only, or posting on your behalf',
    trust_preview_title: 'Transaction preview',
    trust_preview_body: 'Plain language before you sign'
  },
  about: {
    about: 'About',
    website: 'Website',
    download_logo: 'Download logo',
    report_bug: 'Report a bug',
    contributors: 'Contributors',
    maintained: 'Maintained by'
  },
  accounts: {
    accounts: 'Accounts',
    empty: ` There isn't any account stored on this device, <a href="/import" target="_blank" class="text-black hover:underline">click here</a> if you want to import an account.`,
    delete: 'Remove from Hivesigner',
    unlock: 'Unlock',
    auths: 'Authorities',
    add_another: 'Add another account',
    sign_transactions: 'Sign transactions',
    delete_account: 'Remove',
    delete_account_confirm: `<div>Do you want to delete account?</div><div>This will remove account from local storage.</div>`,
    current: 'Current',
    unlocked: 'Unlocked',
    protected: 'Protected',
    no_passcode: 'No passcode',
    passcode: 'Passcode',
    remove_confirm: 'Remove @{username} from this device? Its keys here will be deleted.',
    remove_failed: 'Removed for this session only: storage is unavailable, so this account will return when you reload.',
    successfully_logged_in: 'Logged in successfully!'
  },
  apps: {
    self_declared: 'Everything above is published by the app account itself. Hivesigner does not verify any of it.',
    directory_unavailable: 'Could not reach the app directory.',
    directory_hint: 'Apps that broadcast to Hive through Hivesigner, most used first.',
    building: 'The directory is still being built. It fills in as apps broadcast through Hivesigner.',
    featured: 'Featured',
    all_apps: 'All apps',
    loading: 'Loading the directory…',
    show_more: 'Show more',
    count_one: '{count} app',
    count_other: '{count} apps',
    can_post_as: 'Apps that can post as <b>@{account}</b>.',
    none_authorized: 'No apps are authorized.',
    store: 'App store',
    search_placeholder: 'Search for apps',
    search_for: 'Search for "{search}"',
    empty_search: 'We didn’t find any apps for "{search}"',
    apps: 'apps',
    about: 'About',
    creator: 'Creator',
    visit: 'Visit'
  },
  auths: {
    auths: 'Authorities',
    type: 'Type',
    key: 'Key',
    weight: 'Weight',
    reveal_pub_key: 'Reveal public key',
    reveal_private_key: 'Reveal private key',
    import_private_key: 'Import private key',
    copy: 'Copy',
    successfully_copied: 'The key copied to clipboard',
    successfully_imported: 'Authorities keys imported successfully!',
    username: 'Username'
  },
  errors: {
    something_wrong: 'Oops, something went wrong.',
    here_message: `Here is the error message: <br /><b>"{message}"</b>`,
    unknown: 'Oops, something went wrong. The provided data is invalid.',
    not_found_title: 'Page not found',
    not_found_body: 'There is nothing at this address. Check the link, or start from the home page.',
    not_found_home: 'Go to the home page',
    invalid_consent_request: 'This authorization request is incomplete: it names no app or no redirect URL. Go back to the app and try again.'
  },
  authorize: {
    authorize: 'Authorize',
    request_access: 'is requesting access to your account.',
    authorize_active: 'Authorize (active)',
    authority_require: `The <b>{username}</b> requires your <b>{authority}</b> authority in order for
        you to be able to interact with it. By clicking "Continue" you are allowing
        {authority} access. This can be withdrawn by you at any time by clicking
        <a class="text-black hover:underline uppercase cursor-pointer" href="/revoke/{username}" target="_blank">here</a>.`,
    authority_active: `Giving active authority enables the authorized account to do fund transfers from your account, this should be used with utmost care.`,
    redirect_not_registered: `This app's redirect URL is not registered. For your safety, sign-in is blocked.`,
    hive_account: 'Hive account',
    sends_you_to: 'sends you to',
    grant_explain_no_account: '@{app} is asking to post, comment, vote and follow on your behalf. Add an account to continue.',
    grant_explain: '@{app} will be able to post, comment, vote and follow as @{account}.',
    granted: '@{app} is authorized.',
    scope: 'Scope',
    scope_login: 'View your account username',
    scope_posting: 'Post, comment, vote and follow on your behalf',
    requires_active_key: `This transaction requires your <b>{authority}</b> key.`
  },
  import: {
    hs_password: 'Hivesigner password',
    confirm_password: 'Confirm password',
    require_hs_password: `The Hivesigner password will be required to unlock your account for usage.`,
    import_account: 'Import account',
    username: 'Username',
    add_account: 'Add account',
    add_account_hint: 'Unlock your Hive account on this device. Your keys are encrypted and never leave this browser.',

    import_encryption_key: `This is a new custom password to encrypt your credentials. This is not your Hive private key.`,
    master_password: 'Private key',
    master_key: 'You need to use master or at least {authority} key to login.',
    encrypt_keys: 'Save and encrypt your login information with a password',
    select_account: 'Select account',
    signup: 'Sign Up',
    app: 'The app ',
    site: 'This site ',
    request_access: 'is requesting access to view your current account username.',
    invalid_username_password: `Invalid username or password. You need to use master, active, posting or memo key to login.`,
    add_another_account: 'Add another account',
    dont_have_an_account: 'Don`t have an account?',
    sign_up_here: 'Signup here',
    login: 'Login',
    private_key: 'Private key',
    import_private_key: 'Import private key',
    incorrect_private_key: 'Private key is not correct',
    same_encryption_key: 'Use same Hivesigner password?',
    same_encryption_key_account: 'Use same Hivesigner password as in',
    same_key_not_match: 'Doesn`t match with existing Hivesigner password',
    incorrect_encryption_key: 'Incorrect Hivesigner password',
    username_placeholder: 'Hive username, e.g. ecency',
    password_placeholder: 'Hive private key, e.g. Owner, Active, Posting, Memo keys',
    passcode: 'Passcode',
    protect_with_passcode: 'Protect with a passcode (recommended)',
    private_key_hint: 'A posting key covers everyday actions. Use an active or owner key, or your master password, only if you need to. The key is stored on this device and never sent anywhere.',
    passcode_hint: 'A local password, separate from your Hive keys. It encrypts the key on this device and unlocks it again. It is not your Hive password and cannot be recovered.',
    accounts_on_device_one: '{count} account on this device.',
    accounts_on_device_other: '{count} accounts on this device.',
    hs_placeholder: 'Your Hivesigner password'
  },
  login: {
    unlock_to_continue_to: 'Unlock an account to continue to <target>{target}</target>.',
    switch_an_account: 'Switch an account',
    username_required: 'Hive username is required',
    password_required: 'Hive private key is required',
    hs_password_required: 'Hivesigner password is required',
    hs_password_confirmation_required: 'Hivesigner password confirmation is required',
    hs_password_not_match: 'Hivesigner passwords do not match',
    hs_password_length: `Hivesigner password has to be at least 8 characters long, contain lowercase letter and uppercase letter`,
    invalid_hs_password: 'Invalid Hivesigner password',
    encryption_key_message: `This is a custom password you\'ve set to unlock your account for usage. This is not your Hive private key. If you forgot your Hivesigner password you can import your account again.`,
    need_import: `You need to import your account using your password or at least {authority} key to do this request. Click "Add another account" button to proceed.`
  },
  operations: {
    empty: 'Empty',
    you: 'You'
  },
  revoke: {
    revoke_explain_no_account: '@{app} currently has permission to post on behalf of accounts that granted it. Add an account to revoke it.',
    revoke_explain: '@{app} will no longer be able to act as @{account}.',
    revoked: '@{app} is revoked.',
    revoke: 'Revoke',
    revoke_active: 'Revoke (active)',
    message: `By clicking "Continue" you are revoking <b>{authority}</b> authority from
        <b>{username}</b>.
        Going forward <b>{username}</b> will not be able to perform actions on your
        behalf.`
  },
  already_action_account: `You {action} the account <b>{username}</b> to do
      <b>{authority}</b> operations on your behalf.`,
  confirmation: 'Your transaction is on the way! Here is the ID of the transaction:',
  theme: {
    theme: 'Theme',
    system: 'Follows your device',
    light: 'Light',
    dark: 'Dark',
    switch_to: 'Switch to: {theme}'
  },
  footer: {
    apps: 'Apps',
    accounts: 'Accounts',
    settings: 'Settings',
    developers: 'Developers',
    about: 'About',
    documentation: 'Docs',
    signs: 'Signer',
    sign_message: 'Sign message',
    verify_message: 'Verify message',
    network: `{network}`,
    login: 'Login',
    built_by: 'Built with <heart>♥</heart> by the <ecency>Ecency</ecency> team',
    authorized_apps: 'Authorized apps',
    github: 'GitHub',
  },
  open_external: `We recommend you to use the HiveSigner desktop app. If you don't have this, you can download it from the <a href="{homepage}" target="_blank">official site</a>.`,
  open_desktop_app: 'Open desktop app',
  message_signing: {
    title: 'Sign message',
    description: 'Sign any message with one of your private keys to prove account ownership.',
    login_prompt: 'Login and choose which key you want to use to sign your message.',
    message_label: 'Message',
    message_placeholder: 'Enter the message you want to sign',
    authority_label: 'Key to sign with',
    sign_button: 'Sign message',
    signing: 'Signing...',
    go_to_verify: 'Go to verification',
    signed_notice: 'Share the verification link or token below so anyone can confirm this signature.',
    summary: 'Signature summary',
    author: 'Author',
    authority_used: 'Authority used',
    timestamp: 'Timestamp',
    signature: 'Signature',
    verification_token: 'Verification token',
    verification_link: 'Verification link',
    message_preview: 'Signed message',
    copied: 'Copied to clipboard',
    copy: 'Copy',
    unable_to_sign: 'Unable to sign. Please check your message and selected key.'
  },
  message_verification: {
    title: 'Verify message',
    description: 'Paste the verification token or open a shared link to confirm the signature.',
    payload_label: 'Verification token',
    payload_placeholder: 'Paste the shared verification token',
    verify_button: 'Verify signature',
    verifying: 'Verifying...',
    go_to_sign: 'Go to message signer',
    success: 'Signature is valid for {username}',
    invalid_signature: 'Signature could not be verified with account keys.',
    invalid_payload: 'Verification token is invalid or incomplete.',
    payload_required: 'Verification token is required.',
    account_not_found: 'Account {username} could not be found.',
    decoded_details: 'Decoded details',
    author: 'Author',
    timestamp: 'Timestamp',
    recovered_key: 'Recovered public key',
    matched_authority: 'Matched authority',
    unknown_authority: 'Unknown',
    message_preview: 'Message',
    signature: 'Signature',
    copy: 'Copy',
    copied: 'Copied to clipboard'
  },
  sign: {
    sign: 'Sign',
    approve: 'Approve',
    going_redirect_to: 'You are going to get redirected to',
    confirm_transaction: 'Confirm transaction',
    success_title: 'Transaction has been successfully broadcasted',
    failure_title: 'Your transaction was not successfully broadcasted',
    back_to_sign: 'Back to Signer',
    error_message: 'Error message',
    transaction_id: 'Transaction id',
  },
  developers: {
    developers: 'Developers',
    description: `Check our new documentation page here <a href="https://docs.hivesigner.com" class="text-black hover:underline" target="_blank">https://docs.hivesigner.com</a>`,
    1: {
      title: '1. Add new app',
      message: `To create a new app on HiveSigner you need a Hive account for it. If you don't have one yet you can create one on
              <a href="https://signup.hive.io" class="text-black hover:underline" target="_blank">
                signup.hive.io
              </a> in with your app account and update your profile with "application" as account type.`,
      enable_app: 'Enable app',
      message_hs_authorize: `If you would like to use the OAuth 2 API for posting with HiveSigner server you need to authorize the Hive account "hivesigner" to post on the behalf of your app account.
            <a href="/authorize/hivesigner" target="_blank">Click here</a>
            to do this and sign with your app account.`
    },
    2: {
      title: '2. Edit app settings',
      message: 'You can edit your app settings by updating your app account profile.',
      edit_settings: 'Edit app settings'
    },
    3: {
      title: '3. Hivesigner JS SDK',
      message_1: `Get started integrating HiveSigner on your website with HiveSigner.js, the official JavaScript SDK. Learn how to setup and use
            <a href="https://github.com/ledgerconnect/hivesigner.js#sdk-methods" target="_blank"
               class="text-black hover:underline">
              SDK methods
            </a>.`
    },
    4: {
      title: '4. How OAuth2 works',
      message: `OAuth 2 is the industry-standard protocol for authorization. After you have checked above steps, You can read more about
            <a
              href="https://github.com/ledgerconnect/hivesigner/wiki/How-OAuth2-Work%3F"
              target="_blank"
              class="text-black hover:underline"
            >
              authorization flow in our Wiki page
            </a>.`
    },
    5: {
      title: '5. Demo app',
      message: 'Checkout HiveSigner demo with Vue.js',
      try_demo: 'Try demo',
      see_gh: 'See on GitHub'
    },
    6: {
      title: '6. Other use cases',
      message: `Hivesigner auth tokens can be used in other ways to secure your apps. Imagehoster
            instances use it for verifying image uploads by user. You can use same method to secure
            your backends or you can also authenticate with Hivesigner for off-chain applications.`,
      read_wiki: 'Read more about it on our Wiki page'
    },
    7: {
      title: 'Contact us',
      message: `If you believe you're experiencing a bug with our API or want to report incorrect
            documentation, open an issue on our issue tracker. For a more real-time avenue of
            communication, check out the official Discord server. There you'll find community
            members who can help answer questions about our API, libraries and other development
            questions.`,
      try_interactive: 'Try interactive Hive API',
      join_discord: 'Join us on Discord'
    }
  },
  settings: {
    language: 'Language',
    node_note: 'Hivesigner connects to Hive through a managed pool of nodes and fails over automatically, so there is no node to configure here.',
    settings: 'Settings',
    saved: 'Settings has been saved.',
    session: 'Session timeout in',
    minutes: '{min} minutes',
    hours: '{min} hours',
    node: 'Node address'
  },
  profile: {
    profile: 'Profile',
    account_type: 'Account type',
    user: 'User',
    app: 'Application',
    name: 'Name',
    profile_pic: 'Profile picture URL',
    cover_pic: 'Cover image URL',
    about: 'About',
    website: 'Website',
    location: 'Location',
    i_e_placeholder: 'i.e. {example}',
    redirect_uris: 'Redirect URIs',
    one_uri_line: `One URI per line. Need to have a protocol, no URL fragments, and no relative paths.`,
    creator: 'Creator',
    status: 'Status',
    production: 'Production',
    sandbox: 'Sandbox',
    secret: 'Secret',
    blank_field: 'Leave this field blank to keep your secret unchanged.'
  },
  signs: {
    nothing_matches: 'Nothing matches that.',
    title: 'Sign transaction',
    search_placeholder: 'Please type name of transaction that need to sign',
    sign: 'Sign'
  },
}
