অফিশিয়াল JavaScript SDK লগইন URL আর সাইন লিংক বানায় এবং আপনার হয়ে Hivesigner API ডাকে। Python-এর জন্য কমিউনিটির লাইব্রেরি আছে। অন্য যে কোনো ভাষা সরাসরি [REST API](/docs/api) ডাকতে পারে।

## JavaScript SDK {#javascript}

SDK হলো npm প্যাকেজ `hivesigner`। এর সোর্স https://github.com/ecency/hivesigner-sdk ঠিকানায়। এটি TypeScript-এ লেখা আর নিজের টাইপ নিয়েই আসে।

সংস্করণ ৪-এর জন্য Node.js 18 বা তার পরের সংস্করণ লাগে, কারণ এটি বিল্ট-ইন `fetch` ব্যবহার করে। ব্রাউজারে ES2017 বা তার পরের সংস্করণ লাগে। যেখানে গ্লোবাল `fetch` নেই সেখানে SDK ব্যবহারের আগে একটি polyfill যোগ করুন। পুরনো Node.js-এ সংস্করণ ৩-এ থাকুন।

### ইনস্টল {#install}

```bash
npm install hivesigner
```

বিল্ড ধাপ নেই এমন পাতার জন্য ব্রাউজার বান্ডল লোড করুন। এটি একটি গ্লোবাল `hivesigner` তৈরি করে:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### একটি ক্লায়েন্ট তৈরি করুন {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| অপশন | অর্থ |
| --- | --- |
| `app` | আপনার অ্যাপ অ্যাকাউন্ট, `client_id` হিসেবে পাঠানো হয়। |
| `callbackURL` | Hivesigner ব্যবহারকারীকে কোথায় ফেরত পাঠাবে। এটি আপনার অ্যাপের কলব্যাকগুলোর একটি হতে হবে, অক্ষরে অক্ষরে (সাধারণ http-এর লুপব্যাক কলব্যাকের হোস্ট আর পোর্ট আলাদা হতে পারে, দেখুন [কলব্যাক](/docs/register-app#callback-rules))। |
| `scope` | একটি তালিকা, কমা দিয়ে জুড়ে `scope` প্যারামিটারে যায়। দেখুন [স্কোপ](/docs/oauth2#scopes)। |
| `responseType` | কোড ফ্লোর জন্য `'code'`। টোকেন ফ্লোর জন্য বাদ দিন। |
| `accessToken` | ব্যবহারকারীর অ্যাক্সেস টোকেন, যদি আপনার কাছে আগেই থাকে। |
| `apiURL` | API-র অরিজিন। SDK এর সঙ্গে `/api/` যোগ করে। ডিফল্ট `https://hivesigner.com`। |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` আর `setApiURL` পরে ক্লায়েন্ট বদলায়। প্রতিটিই ক্লায়েন্টটি ফেরত দেয়।

### ব্যবহারকারীকে লগইন করান {#sign-in}

`getLoginURL(state, account)` লগইন URL ফেরত দেয়:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` আপনার কলব্যাকে অপরিবর্তিত ফিরে আসে। উত্তরটিকে অনুরোধের সঙ্গে বাঁধতে এটি ব্যবহার করুন।
- `account` ঐচ্ছিক: একটি ইউজারনেম। ওই অ্যাকাউন্ট ডিভাইসে থাকলে Hivesigner সেটি নির্বাচন করে, নয়তো উপেক্ষা করে।

ব্রাউজারে `client.login({ state: 'STATE' })` ব্যবহারকারীকে একই URL-এ পাঠায়, অ্যাকাউন্ট ছাড়াই।

টোকেন ফ্লোতে আপনার কলব্যাক পায় `access_token`, `expires_in` আর `username`। টোকেনটি ক্লায়েন্টকে দিন:

```js
client.setAccessToken('ACCESS_TOKEN');
```

কোড ফ্লোর বিনিময়ের জন্য SDK-তে কোনো মেথড নেই। আপনার সার্ভার নিজেই কোড আর ক্লায়েন্ট সিক্রেট API-তে পাঠায়, যেমনটি [কোড বিনিময় করুন](/docs/oauth2#exchange-code) দেখায়।

### ব্যবহারকারীকে নিন {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` হলো ব্যবহারকারীর Hive অ্যাকাউন্ট, চেইন যেমন ফেরত দেয়। `scope` বলে টোকেনটি কী কী অনুমোদন করে।

### ব্রডকাস্ট {#broadcast}

`broadcast(operations)` অপারেশনগুলো API-তে পাঠায়, যা সেগুলো ব্যবহারকারীর হয়ে ব্রডকাস্ট করে। API শুধু সেইসব পোস্টিং অপারেশন গ্রহণ করে যেগুলোর লেখক টোকেনের ব্যবহারকারী: `vote`, `comment`, `delete_comment`, `comment_options`, পোস্টিং কর্তৃত্বসহ `custom_json`, `claim_reward_balance` আর প্রোফাইল মেটাডেটার জন্য `account_update2`। দেখুন [broadcast যা গ্রহণ করে](/docs/api#broadcast-rules)।

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

প্রতিটি অপারেশনে ব্যবহারকারীর নাম দিন। API `__signer` বদলে দেয় না।

এই সহায়ক মেথডগুলো একটি করে অপারেশন বানায় আর `broadcast` ডাকে:

| মেথড | যা ব্রডকাস্ট করে |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`। `weight` চলে `-10000` থেকে `10000` (100%) পর্যন্ত। |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`। নতুন পোস্টের জন্য `parentAuthor` হলো `''`। `jsonMetadata` অবজেক্ট হতে পারে: SDK সেটিকে স্ট্রিং বানিয়ে নেয়। |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`। `requiredAuths` হিসেবে `[]` আর `requiredPostingAuths` হিসেবে `['USERNAME']` দিন। `json` একটি স্ট্রিং। |
| `reblog(account, author, permlink)` | `follow` আইডিসহ `custom_json`, যা পোস্টটি রিব্লগ করে |
| `follow(follower, following)` | `follow` আইডিসহ `custom_json`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `follow` আইডিসহ `custom_json`, `what: []` |
| `ignore(follower, following)` | `follow` আইডিসহ `custom_json`, `what: ['ignore']` (মিউট) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`। পরিমাণগুলো `'0.000 HIVE'`, `'0.000 HBD'` আর `'1.000000 VESTS'`-এর মতো স্ট্রিং। |

`updateUserMetadata()` অবচিত। কোনো ব্যবহারকারীর প্রোফাইল বদলাতে নতুন `posting_json_metadata` সহ `account_update2` ব্রডকাস্ট করুন।

### লগআউট {#log-out}

`revokeToken()` হলো SDK-র লগআউট কল। এটি টোকেনটি API-র প্রত্যাহার এন্ডপয়েন্টে পাঠায় আর তারপর ক্লায়েন্ট থেকে সরিয়ে দেয়। কলটি ব্যর্থ হলে নিজেই `removeAccessToken()` ডাকুন। আপনার অ্যাপ টোকেনটি যেখানেই রেখেছে সেখান থেকেও মুছে দিন।

আপনার অ্যাপের অ্যাক্সেস চিরতরে শেষ করতে ব্যবহারকারী https://hivesigner.com/authorized-apps ঠিকানায় সেটি সরান। দেখুন [কোনো অ্যাপের অ্যাক্সেস দেখা ও সরানো](/docs/signing-in#remove-access)।

### সাইন লিংক {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` আর `sendTransaction(tx, params)` একটি `https://hivesigner.com/sign/...` লিংক ফেরত দেয়। `params` নেয় `callback`, `no_broadcast` আর `signer`। দেখুন [সাইন লিংক](/docs/sign-links)।

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

TypeScript-এ টাইপগুলো তৃতীয় আর্গুমেন্ট চায়: লিংকটি ফেরত পেতে `undefined` দিন।

ব্রাউজারে তৃতীয় আর্গুমেন্ট হিসেবে একটি ফাংশন দিলে লিংকটি নতুন ট্যাবে খোলে। ফাংশনটি ডাকা হয় না আর কিছুই ফেরত আসে না। একটি ক্লিক হ্যান্ডলার থেকে এটি ডাকুন, নইলে ব্রাউজার নতুন ট্যাবটি আটকে দিতে পারে আর কলটি ত্রুটি দেয়।

### প্রমিজ আর কলব্যাক {#promises-and-callbacks}

`me`, `broadcast`, সহায়ক মেথডগুলো আর `revokeToken` একটি প্রমিজ ফেরত দেয়। এর বদলে কলব্যাক ব্যবহার করতে শেষ আর্গুমেন্ট হিসেবে একটি ফাংশন দিন। সেটি `(error, result)` পায়।

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

API ত্রুটি দিয়ে উত্তর দিলে প্রমিজটি API-র ত্রুটি বডি দিয়ে ব্যর্থ হয়, `{ error, error_description }`। কলব্যাক দিলে সেই বডিই `error` আর্গুমেন্ট। উত্তরটি JSON না হলে পার্স ত্রুটি দিয়ে ব্যর্থ হয়।

## Python {#python}

এই লাইব্রেরিগুলো কমিউনিটি থেকে এসেছে। এগুলোর রক্ষণাবেক্ষণ করেন তাদের লেখকেরা, Hivesigner দল নয়। ভরসা করার আগে [REST API](/docs/api)-এর সঙ্গে মিলিয়ে দেখুন।

| লাইব্রেরি | লেখক |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, মডিউল `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
