Hivesigner টোকেন হলো একটি ছোট সাইন করা বিবৃতি। এতে থাকে একটি Hive অ্যাকাউন্ট, যে অ্যাপের জন্য এটি তৈরি হয়েছে আর কখন সাইন করা হয়েছে। আপনার সার্ভার API দিয়ে বা নিজেই একটি টোকেন যাচাই করতে পারে। এই পাতায় দেখানো হয়েছে টোকেনে কী থাকে, কতক্ষণ টেকে আর যাচাইয়ের দুই উপায়।

## টোকেন দেখতে কেমন {#format}

টোকেন হলো base64url-এ এনকোড করা একটি JSON অবজেক্ট, স্ট্যান্ডার্ড base64url থেকে একটি পার্থক্যসহ: প্যাডিংয়ে `=`-এর বদলে `.` ব্যবহার হয়। তাই সাধারণ base64-এর তুলনায় `+` হয় `-`, `/` হয় `_` আর `=` হয় `.`। প্রতিটি টোকেন `eyJzaWduZWRfbWVzc2FnZSI6` দিয়ে শুরু হয়।

ডিকোড করলে টোকেন ফ্লোর একটি অ্যাক্সেস টোকেন দেখতে এমন:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| ফিল্ড | অর্থ |
| --- | --- |
| `signed_message.type` | টোকেনটি কী: `login`, `posting`, `code` বা `refresh`। দেখুন [টোকেনের ধরন](#kinds)। |
| `signed_message.app` | যে অ্যাপ অ্যাকাউন্টের জন্য টোকেনটি তৈরি হয়েছে। অ্যাপ অ্যাকাউন্ট নেই এমন সাইটের লগইন টোকেনে কোনোটি থাকে না। |
| `authors[0]` | যে Hive অ্যাকাউন্টের জন্য টোকেনটি। |
| `timestamp` | কখন সাইন করা হয়েছে, 1970-01-01 UTC থেকে সেকেন্ডে। |
| `signatures[0]` | স্বাক্ষর, হেক্স স্ট্রিং হিসেবে। |
| `authority` | শুধু ব্রাউজারে সাইন করা টোকেনে: ব্যবহারকারীর কোন কী সাইন করেছে, `posting` না `active`। এই ফিল্ডটি সাইন করা ডেটার বাইরে। কোন কী সাইন করেছে জানতে স্বাক্ষর থেকে সেটি উদ্ধার করুন। |

স্বাক্ষরটি হলো `JSON.stringify({ signed_message, authors, timestamp })`-এর sha256 হ্যাশের উপর একটি secp256k1 স্বাক্ষর, কী-গুলো ওই ক্রমেই।

### একটি টোকেন ডিকোড করুন {#decode}

Node.js-এ:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

ব্রাউজারে:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

ডিকোড করা যাচাই করা নয়। যে কেউ এমন স্ট্রিং বানাতে পারে যা এই আকারে ডিকোড হয়। বিশ্বাস করার আগে [টোকেনটি যাচাই করুন](#check-a-token)।

## টোকেনের ধরন {#kinds}

| টোকেন | `type` | `app` | যে সাইন করেছে | কোথায় পাবেন |
| --- | --- | --- | --- | --- |
| অ্যাক্সেস টোকেন, টোকেন ফ্লো | `posting` | আপনার অ্যাপ | ব্যবহারকারীর পোস্টিং কী, বা Hivesigner-এর কাছে অ্যাকাউন্টের পোস্টিং কী না থাকলে তার অ্যাক্টিভ কী | আপনার কলব্যাকে `access_token` |
| লগইন টোকেন, `scope=login` | `login` | আপনার অ্যাপ | ব্যবহারকারীর পোস্টিং বা অ্যাক্টিভ কী | আপনার কলব্যাকে `access_token` |
| লগইন টোকেন, অ্যাপ অ্যাকাউন্ট নেই এমন সাইট | `login` | নেই | ব্যবহারকারীর পোস্টিং বা অ্যাক্টিভ কী | আপনার কলব্যাকে `access_token` |
| কোড | `code` | আপনার অ্যাপ | ব্যবহারকারীর পোস্টিং বা অ্যাক্টিভ কী | আপনার কলব্যাকে `code` |
| অ্যাক্সেস টোকেন, কোড ফ্লো | `posting` | আপনার অ্যাপ | @hivesigner-এর পোস্টিং কী | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| রিফ্রেশ টোকেন | `refresh` | আপনার অ্যাপ | @hivesigner-এর পোস্টিং কী | [`/api/oauth2/token`](/docs/api#oauth2-token) |

কোড আর রিফ্রেশ টোকেন অ্যাক্সেস টোকেন নয়। কখনও এর কোনোটিকেই লগইন হিসেবে গ্রহণ করবেন না।

## টোকেন কতক্ষণ টেকে {#lifetime}

অ্যাক্সেস টোকেন ৭ দিন টেকে: `expires_in` হলো 604800 সেকেন্ড, তার `timestamp` থেকে গোনা। মেয়াদ শেষ হলে:

- **টোকেন ফ্লো:** ব্যবহারকারীকে আবার লগইন করতে পাঠান। যিনি আগেই আপনার অ্যাপকে অনুমোদন দিয়েছেন তিনি "APP-এ লগইন করুন" দেখেন আর তার একটি ক্লিক লাগে।
- **কোড ফ্লো:** আপনার সার্ভার রিফ্রেশ টোকেন আর ক্লায়েন্ট সিক্রেট দিয়ে নতুন অ্যাক্সেস টোকেন পায়। দেখুন [রিফ্রেশ](/docs/oauth2#refresh)।

টোকেনের `timestamp` ৭ দিনের বেশি পুরনো হলেই সেটিকে মেয়াদোত্তীর্ণ ধরুন। রিডাইরেক্টের ঠিক পরে যা যাচাই করেন তার জন্য অনেক কম বয়সই গ্রহণ করুন। কোড সঙ্গে সঙ্গেই বিনিময় করুন। লগইন টোকেন শুধু তার `timestamp`-এর কয়েক মিনিটের মধ্যেই গ্রহণ করুন।

## আপনার সার্ভারে টোকেন যাচাই করুন {#check-a-token}

কোনো ব্রাউজার বা অ্যাপের পাঠানো টোকেনে আপনার সার্ভার ভরসা করার আগে যাচাই করুন যে:

- অ্যাকাউন্ট বা @hivesigner সত্যিই এটি সাইন করেছে;
- এটি আপনার অ্যাপের জন্য তৈরি;
- এটি আপনার প্রত্যাশিত ধরনের টোকেন;
- এটি যথেষ্ট টাটকা।

### API-কে জিজ্ঞেস করুন {#check-with-the-api}

টোকেনটি দিয়ে `/api/me` ডাকুন। বৈধ টোকেন `user`-এ অ্যাকাউন্টটি ফেরত দেয়:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

অবৈধ টোকেন `invalid_grant` সহ `401` ফেরত দেয়। দেখুন [GET /api/me](/docs/api#me)।

`/api/me` স্বাক্ষরটি নিশ্চিত করে। তার উত্তরে কোন অ্যাপের জন্য টোকেনটি তৈরি তা বলা থাকে না। তাই টোকেনটি ডিকোড করে তার `app`, `type` আর বয়সও নিজে যাচাই করুন। অন্য অ্যাপের জন্য তৈরি টোকেন যেন আপনার অ্যাপে কাউকে লগইন না করায়।

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

API শুধু সেইসব টোকেন গ্রহণ করে যাতে অ্যাপের নাম আছে। অ্যাপ অ্যাকাউন্ট নেই এমন সাইটের লগইন টোকেন [নিজে](#check-it-yourself) যাচাই করুন।

### নিজে যাচাই করুন {#check-it-yourself}

1. টোকেনটি ডিকোড করুন।
2. দেখুন `signed_message.type` আপনার প্রত্যাশিত ধরন কি না: অ্যাক্সেস টোকেনের জন্য `posting`, লগইন টোকেনের জন্য `login`।
3. দেখুন `signed_message.app` আপনার অ্যাপ অ্যাকাউন্ট কি না। অ্যাপ অ্যাকাউন্ট নেই এমন সাইটের জন্য দেখুন যে কোনোটিই নেই।
4. `timestamp` থেকে বয়স যাচাই করুন।
5. `JSON.stringify({ signed_message, authors, timestamp })`-এর sha256 হ্যাশ বের করুন।
6. `signatures[0]` আর ওই হ্যাশ থেকে পাবলিক কী উদ্ধার করুন।
7. এখনই Hive ব্লকচেইন থেকে `authors[0]` অ্যাকাউন্টটি পড়ুন, কারণ ব্যবহারকারীরা তাদের কী বদলাতে পারেন। উদ্ধার করা কী তার বর্তমান পোস্টিং বা অ্যাক্টিভ কী-গুলোর একটি হতে হবে। `/api/oauth2/token` থেকে আসা টোকেন বরং @hivesigner সাইন করে: সেগুলোর জন্য @hivesigner অ্যাকাউন্টের একটি বর্তমান পোস্টিং কী গ্রহণ করুন।

Node.js-এ [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk) দিয়ে, যা `@ecency/sdk/hive`-এর অধীনে `PrivateKey`, `PublicKey`, `Signature` আর `callRPC` রপ্তানি করে:

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

এভাবে ব্যবহার করুন:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

dhive লাইব্রেরিও (`@hiveio/dhive`) কাজ করে: `cryptoUtils.sha256(message)` দিয়ে হ্যাশ বের করুন আর `Signature.fromString(signatures[0]).recover(digest).toString()` দিয়ে কী উদ্ধার করুন।

## টোকেন নিরাপদে রাখুন {#keep-tokens-safe}

যার কাছে পোস্টিং টোকেন আছে সে মেয়াদ শেষ না হওয়া পর্যন্ত আপনার অ্যাপের মাধ্যমে ব্যবহারকারীর হয়ে ব্রডকাস্ট করতে পারে। এটিকে পাসওয়ার্ডের মতোই গণ্য করুন।

- **টোকেন আপনার সার্ভারে রাখুন,** বা একটি httpOnly, Secure কুকিতে। রিফ্রেশ টোকেন আর ক্লায়েন্ট সিক্রেট শুধু সার্ভারেই রাখুন।
- **আপনি লগ করেন এমন কোনো URL-এ কখনও টোকেন রাখবেন না।** টোকেন ফ্লো আপনার কলব্যাকের কোয়েরি স্ট্রিংয়ে টোকেনটি পৌঁছে দেয়। সার্ভারে সেটি পড়ুন, তারপর টোকেন ছাড়া একটি URL-এ রিডাইরেক্ট করুন। কলব্যাকের কোয়েরি স্ট্রিং আপনার লগের বাইরে রাখুন।
- **কলব্যাক পাতায় অন্য সাইট থেকে কিছুই লোড করবেন না,** যাতে টোকেনসহ ঠিকানাটি তাদের কাছে না যায়। ওই পাতায় `Referrer-Policy: no-referrer` হেডার সাহায্য করে।
- **টোকেন শুধু আপনার নিজের সার্ভারে আর `https://hivesigner.com/api/`-তে পাঠান।**

## লগআউট আর অ্যাক্সেস সরানো {#sign-out}

- **কোনো ব্যবহারকারীকে লগআউট করানো** মানে টোকেনটি ফেলে দেওয়া: আপনার সেশন বা কুকি থেকে মুছে দিন। ব্যবহারকারী লগআউট করেছেন তা Hivesigner-কে জানাতে [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke)-ও ডাকতে পারেন। আপনার অ্যাপ তবু টোকেনটি নিজেই ফেলে দেয়।
- **আপনার অ্যাপের অ্যাক্সেস চিরতরে বন্ধ করা** ব্যবহারকারীর সিদ্ধান্ত। https://hivesigner.com/authorized-apps ঠিকানায়, বা `https://hivesigner.com/revoke/APP` ঠিকানায়, তিনি অন-চেইনে তার পোস্টিং কর্তৃত্ব থেকে আপনার অ্যাপ অ্যাকাউন্ট সরিয়ে দেন। তারপর API আর আপনার অ্যাপের মাধ্যমে তার হয়ে ব্রডকাস্ট করে না।
