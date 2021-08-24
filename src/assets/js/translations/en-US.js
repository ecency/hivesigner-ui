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
    title: 'Hivesigner',
    description: `Secure way to sign with Hivesigner. Best security for users and developers to integrate industry standard OAuth2 for their Blockchain applications. Transform web 2.0 apps into web 3.0 decentralized apps.`,
    get_started: 'Get started',
    secure_way_sign_in: 'Secure way to sign'
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
    successfully_logged_in: 'Logged in successfully!'
  },
  apps: {
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
    unknown: 'Oops, something went wrong. The provided data is invalid.'
  },
  authorize: {
    authorize: 'Authorize',
    authorize_active: 'Authorize (active)',
    authority_require: `The <b>{username}</b> requires your <b>{authority}</b> authority in order for
        you to be able to interact with it. By clicking "Continue" you are allowing
        {authority} access. This can be withdrawn by you at any time by clicking
        <a class="text-black hover:underline uppercase cursor-pointer" href="/revoke/{username}" target="_blank">here</a>.`,
    authority_active: `Giving active authority enables the authorized account to do fund transfers from your account, this should be used with utmost care.`,
    requires_active_key: `This transaction requires your <b>{authority}</b> key.`
  },
  import: {
    hs_password: 'Hivesigner password',
    confirm_password: 'Confirm password',
    require_hs_password: `The Hivesigner password will be required to unlock your account for usage.`,
    import_account: 'Import account',
    username: 'Username',
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
    hs_placeholder: 'Your Hivesigner password'
  },
  login: {
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
  footer: {
    apps: 'Apps',
    accounts: 'Accounts',
    settings: 'Settings',
    developers: 'Developers',
    about: 'About',
    documentation: 'Docs',
    signs: 'Signer',
    network: `{network}`,
    login: 'Login'
  },
  open_external: `We recommend you to use the HiveSigner desktop app. If you don't have this, you can download it from the <a href="{homepage}" target="_blank">official site</a>.`,
  open_desktop_app: 'Open desktop app',
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
    title: 'Sign transaction',
    search_placeholder: 'Please type name of transaction that need to sign',
    sign: 'Sign'
  },
}
