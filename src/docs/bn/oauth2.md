মানুষকে আপনার অ্যাপে লগইন করার জন্য Hivesigner-এ পাঠান। তারা সেখানে আপনার অনুরোধ দেখে অনুমোদন দেন। তারপর Hivesigner তাদের আপনার কলব্যাকে ফেরত পাঠায় একটি টোকেনসহ (টোকেন ফ্লো) বা একটি কোডসহ, যা আপনার সার্ভার টোকেনের বিনিময়ে দেয় (কোড ফ্লো)। এই পাতা দুটি ফ্লো, প্রতিটি প্যারামিটার আর স্কোপ নিয়ে।

## শুরু করার আগে {#before-you-start}

- আপনার অ্যাপ নিবন্ধন করুন: তার জন্য একটি Hive অ্যাকাউন্ট, আপনার কলব্যাক তালিকাভুক্ত করে। দেখুন [আপনার অ্যাপ নিবন্ধন করুন](/docs/register-app)।
- API দিয়ে ব্রডকাস্ট করতে হলে আপনার অ্যাপ অ্যাকাউন্টকে [@hivesigner-কে পোস্টিং কর্তৃত্বও দিতে](/docs/register-app#grant-hivesigner) হবে।
- কোড ফ্লোর জন্য একটি [ক্লায়েন্ট সিক্রেট](/docs/register-app#client-secret) বসান।

## অনুমোদন URL {#authorize-url}

ব্যবহারকারীকে এই ঠিকানায় পাঠান:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

প্রতিটি মান URL-এনকোড করুন। `URLSearchParams` সেটি আপনার হয়ে করে দেয়:

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### প্যারামিটার {#parameters}

| প্যারামিটার | আবশ্যক | কী করে |
| --- | --- | --- |
| `client_id` | হ্যাঁ, অ্যাপের জন্য | আপনার অ্যাপ অ্যাকাউন্টের নাম। `clientId`-ও পড়া হয়। এটি ছাড়া অনুরোধটি Hive অ্যাকাউন্ট নেই এমন সাইট থেকে শুধু লগইনের অনুরোধ: দেখুন [পোস্টিং অ্যাক্সেস ছাড়া লগইন](/docs/login-only)। |
| `redirect_uri` | হ্যাঁ | Hivesigner ব্যবহারকারীকে কোথায় ফেরত পাঠাবে। এটি আপনার অ্যাপের রিডাইরেক্ট URI-এর একটি হতে হবে, হুবহু। দেখুন [কলব্যাক](/docs/register-app#callbacks)। |
| `scope` | না | `login`, `posting` বা `offline`। দেখুন [স্কোপ](#scopes)। এটি ছাড়া অনুরোধটি পোস্টিং অ্যাক্সেস চায়। |
| `response_type` | না | `code` [কোড ফ্লো](#code-flow) শুরু করে। অন্য যে কোনো মান, বা কিছু না দিলে, মানে [টোকেন ফ্লো](#token-flow)। |
| `state` | সুপারিশকৃত | একটি র‍্যান্ডম মান যা Hivesigner অপরিবর্তিত ফেরত দেয়। দেখুন [state দিয়ে অনুরোধ সুরক্ষিত করুন](#state)। |
| `account` | না | একটি Hive ইউজারনেম। ওই অ্যাকাউন্ট ব্যবহারকারীর ডিভাইসে থাকলে Hivesigner সেটি নির্বাচন করে। না থাকলে উপেক্ষা করে। `select_account`-ও পড়া হয়। |

ব্যবহারকারী সম্মতির পর্দায় অন্য অ্যাকাউন্টে বদলাতে পারেন। অ্যাকাউন্টটি সবসময় টোকেন বা কোড বিনিময় থেকে নিন, আপনি যা চেয়েছিলেন তা থেকে কখনও নয়।

## স্কোপ {#scopes}

Hive-এ একটিমাত্র পোস্টিং কর্তৃত্ব আছে। তাই Hivesigner-এ অ্যাক্সেসের দুটি স্তর, শুধু লগইন আর পোস্টিং, এর মাঝে আর কিছু নেই।

| `scope` | ব্যবহারকারী যা অনুমোদন করেন | ফ্লো | অ্যাক্সেস টোকেনের `type` |
| --- | --- | --- | --- |
| `login` | "আপনার অ্যাকাউন্টের ইউজারনেম দেখা"। কিছুই দেওয়া হয় না। | টোকেন ফ্লো (`response_type=code` যোগ করবেন না) | `login` |
| `posting` | পোস্টিং অ্যাক্সেস। প্রথমবার এটি ব্যবহারকারীর পোস্টিং কর্তৃত্বে আপনার অ্যাপ অ্যাকাউন্ট যোগ করে। | টোকেন ফ্লো, বা `response_type=code` সহ কোড ফ্লো | `posting` |
| `offline` | পোস্টিং অ্যাক্সেস, উপরের মতোই | কোড ফ্লো | `posting`, একটি `refresh` টোকেনসহ |

কোড ফ্লোতে কলব্যাক প্রথমে একটি কোড পায় (`type` `code` এর একটি টোকেন) যা আপনার সার্ভার অ্যাক্সেস টোকেনের বিনিময়ে দেয়।

- **কোনো স্কোপ না দিলে** মানে `posting`।
- **যে মানে কোথাও `offline` আছে** সেটির মানে `offline`, যেমন পুরনো `offline,vote,comment`।
- **অন্য যে কোনো মানের** অর্থ `posting`। এর মধ্যে আছে `vote`, `comment`, `vote,comment`, `comment_options` বা `custom_json`-এর মতো পুরনো অপারেশনের নাম। এগুলো টোকেনকে সীমিত করে না: প্রতিটি পোস্টিং টোকেন একই অপারেশন অনুমোদন করে। দেখুন [broadcast যা গ্রহণ করে](/docs/api#broadcast-rules)।

আপনার অ্যাপের যদি শুধু জানা দরকার ব্যবহারকারী কে, তাহলে `login` চান। দেখুন [পোস্টিং অ্যাক্সেস ছাড়া লগইন](/docs/login-only)।

## টোকেন ফ্লো {#token-flow}

ব্যবহারকারীর ব্রাউজার সরাসরি অ্যাক্সেস টোকেন পায়। আপনার অ্যাপের কোনো সিক্রেট লাগে না।

1. ব্যবহারকারীকে অনুমোদন URL-এ পাঠান:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. ব্যবহারকারী অনুমোদন দেন। Hivesigner আপনার কলব্যাকে রিডাইরেক্ট করে:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   আপনার কলব্যাকে কোয়েরি না থাকলে Hivesigner `?` দিয়ে আর থাকলে `&` দিয়ে তার প্যারামিটার যোগ করে। `state` তখনই থাকে যখন আপনি অ-ফাঁকা একটি মান পাঠিয়েছেন।

3. আপনার কলব্যাকে প্রথমে [`state` মিলিয়ে দেখুন](#state)। তারপর আপনার সার্ভারে [টোকেনটি যাচাই করুন](/docs/tokens#check-a-token)। যে অ্যাকাউন্টের জন্য টোকেনটি তা টোকেনের ভেতরেই আছে: শুধু `username` প্যারামিটারের উপর ভরসা করবেন না, কারণ যে কেউ একটি URL সম্পাদনা করতে পারে।
4. টোকেনটি আপনার সার্ভারে বা একটি httpOnly কুকিতে রাখুন। একটি পরিষ্কার URL-এ রিডাইরেক্ট করুন যাতে টোকেনটি ঠিকানার ঘর থেকে সরে যায়।
5. `expires_in` সেকেন্ড (৭ দিন) পরে মেয়াদ শেষ না হওয়া পর্যন্ত [API](/docs/api)-এর সঙ্গে টোকেনটি ব্যবহার করুন। তারপর ব্যবহারকারীকে আবার অনুমোদন URL-এ পাঠান। যিনি আগেই পোস্টিং অ্যাক্সেস দিয়েছেন তিনি "APP-এ লগইন করুন" আর "আপনি আগেই @myapp-কে অনুমোদন দিয়েছেন। নতুন কোনো অনুমতি দেওয়া হচ্ছে না।" দেখেন।

## কোড ফ্লো {#code-flow}

আপনার সার্ভার একটি কোড পায় আর সেটি একটি অ্যাক্সেস টোকেন ও একটি রিফ্রেশ টোকেনের বিনিময়ে দেয়। পরে সে ব্যবহারকারী ছাড়াই সেগুলো নবায়ন করতে পারে। আপনার সার্ভার দীর্ঘ সময় ধরে ব্যবহারকারীদের হয়ে কাজ করলে এটি ব্যবহার করুন।

1. ব্যবহারকারীকে `scope=offline` সহ অনুমোদন URL-এ পাঠান:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` একই কাজ করে।

2. ব্যবহারকারী পোস্টিং অ্যাক্সেস অনুমোদন করেন। Hivesigner আপনার কলব্যাকে রিডাইরেক্ট করে:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [`state` মিলিয়ে দেখুন](#state)। তারপর সঙ্গে সঙ্গেই, আপনার সার্ভার থেকে, কোডটি বিনিময় করুন।

### কোড বিনিময় করুন {#exchange-code}

একটি POST অনুরোধের বডিতে কোড আর আপনার ক্লায়েন্ট সিক্রেট `/api/oauth2/token`-এ পাঠান:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

উত্তর:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Node.js 18 বা তার পরের সংস্করণে একই কল:

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- কোড আর সিক্রেট অনুরোধের বডিতে রাখুন, কখনও URL-এ নয়।
- এই অনুরোধের সঙ্গে কোনো `Authorization` হেডার পাঠাবেন না।
- এই উত্তরের `username` ব্যবহার করুন। এটি কোড থেকে আসে, যা ব্যবহারকারী সাইন করেছেন।
- অ্যাক্সেস টোকেন আর রিফ্রেশ টোকেন আপনার সার্ভারে রাখুন।

### রিফ্রেশ {#refresh}

অ্যাক্সেস টোকেনের মেয়াদ শেষ হলে রিফ্রেশ টোকেনটি আপনার ক্লায়েন্ট সিক্রেটসহ একই এন্ডপয়েন্টে পাঠান:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

উত্তরের আকার একই, তাতে থাকে নতুন একটি অ্যাক্সেস টোকেন আর নতুন একটি রিফ্রেশ টোকেন। পুরনোগুলোর বদলে দুটিই সংরক্ষণ করুন।

## state দিয়ে অনুরোধ সুরক্ষিত করুন {#state}

`state` ছাড়া অন্য কোনো সাইট আপনার ব্যবহারকারীকে তার নিজের বেছে নেওয়া টোকেন বা কোডসহ আপনার কলব্যাকে পাঠাতে পারে। তখন আপনার অ্যাপ ব্যবহারকারীকে অন্য কারও অ্যাকাউন্টে লগইন করিয়ে দেবে। `state` প্রতিটি কলব্যাককে সেই ব্রাউজারের সঙ্গে বাঁধে যেখান থেকে লগইন শুরু হয়েছিল।

1. প্রতিটি লগইনের জন্য একটি র‍্যান্ডম মান তৈরি করুন, অন্তত ১৬ র‍্যান্ডম বাইট। হেক্স একে এমন অক্ষর থেকে মুক্ত রাখে যেগুলোর এনকোডিং লাগে।
2. এমন জায়গায় রাখুন যা শুধু এই ব্রাউজারই আবার দেখাতে পারে: আপনার সার্ভারের সেশন, বা `SameSite=Lax` সহ একটি স্বল্পমেয়াদি httpOnly, Secure কুকি।
3. অনুমোদন URL-এ এটি `state` হিসেবে পাঠান।
4. আপনার কলব্যাকে `state` প্যারামিটারটি সংরক্ষিত মানের সঙ্গে মিলিয়ে দেখুন। না থাকলে বা আলাদা হলে থামুন: টোকেন বা কোড ব্যবহার করবেন না।
5. সংরক্ষিত মানটি মুছে দিন, যাতে প্রতিটি একবারই কাজ করে।

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner যে `state` মান পেয়েছে ঠিক সেটিই ফেরত দেয়। ফাঁকা মান সে বাদ দেয়।

## ব্যবহারকারী যা দেখেন {#what-the-user-sees}

সম্মতির পর্দা আপনার অ্যাপের ছবি আর নাম, "Hive অ্যাকাউন্ট @myapp" আর "আপনাকে HOST ঠিকানায় পাঠাবে" দেখায়, যেখানে HOST আসে আপনার কলব্যাক থেকে। তারপর:

- **প্রথম পোস্টিং অনুরোধ।** শিরোনামে থাকে "APP আপনার অ্যাকাউন্টে অ্যাক্সেসের অনুরোধ করছে।"। **স্কোপ** কার্ডে তালিকা থাকে আপনার অ্যাপ কী কী করতে পারবে। একটি নোটিশে থাকে "প্রথমবারের অনুমোদন: এটি অন-চেইনে আপনার পোস্টিং কর্তৃত্বে @myapp যোগ করবে এবং এর জন্য একবার আপনার অ্যাক্টিভ কী প্রয়োজন। আপনি প্রত্যাহার না করা পর্যন্ত ওই অ্যাকাউন্ট আপনার হয়ে পোস্ট করতে পারবে।"। বোতামে লেখা থাকে **অনুমোদন দিন**। ব্যবহারকারীর ডিভাইসে অ্যাকাউন্টের অ্যাক্টিভ কী না থাকলে পর্দাটি সেখানেই সেটি চায়।
- **লগইন।** `scope=login`-এর জন্য, বা ব্যবহারকারী আগেই দেওয়া পোস্টিং অ্যাক্সেসের জন্য, শিরোনামে থাকে "APP-এ লগইন করুন" আর বোতামে থাকে **লগইন করুন**।
- **অ্যাকাউন্ট।** "যে অ্যাকাউন্ট দিয়ে অনুমোদন দিচ্ছেন" বা "যে অ্যাকাউন্ট দিয়ে লগইন করছেন", তারপর নির্বাচিত অ্যাকাউন্ট। ব্যবহারকারী এখানে অ্যাকাউন্ট বদলাতে পারেন।
- **লক করা অ্যাকাউন্ট।** বোতামের উপরে একটি পাসকোড ঘর থাকে। একটি ক্লিকেই অ্যাকাউন্ট খোলে আর এগিয়ে যায়।
- **ডিভাইসে কোনো অ্যাকাউন্ট নেই।** বোতামে লেখা থাকে **চালিয়ে যান**। এটি অ্যাকাউন্ট যোগ করার ফর্ম খোলে আর পরে অনুরোধে ফিরে আসে।

প্রথম পোস্টিং অনুরোধের পর Hivesigner নতুন অনুমতিটি চেইনে দেখা না যাওয়া পর্যন্ত অপেক্ষা করে, তারপর রিডাইরেক্ট করে। এতে কয়েক সেকেন্ড লাগতে পারে। ব্যবহারকারীর দিক থেকে পুরো পর্দাটি দেখতে দেখুন [অ্যাপে লগইন](/docs/signing-in)।

## বাতিল আর প্রত্যাখ্যাত অনুরোধ {#cancel}

- **বাতিল।** ব্যবহারকারী Hivesigner-এ তার অ্যাকাউন্ট তালিকায় চলে যান। আপনার কলব্যাকে কিছুই পাঠানো হয় না: কোনো ত্রুটির প্যারামিটার নেই। আপনার লগইন বোতামটি হাতের কাছেই রাখুন যাতে ব্যবহারকারী আবার শুরু করতে পারেন। কলব্যাকের অপেক্ষা করবেন না।
- **প্রত্যাখ্যাত অনুরোধ।** অনিবন্ধিত কলব্যাক, অজানা `client_id` বা অনুপস্থিত `redirect_uri` Hivesigner-এ একটি ত্রুটি দেখায় আর সঙ্গে **এই সমস্যাটি রিপোর্ট করুন** বোতাম থাকে। আপনার কলব্যাকে কিছুই পাঠানো হয় না। দেখুন [কিছু ভুল হলে ব্যবহারকারীরা যা দেখেন](/docs/register-app#refused-requests)।

## পুরনো লগইন-রিকোয়েস্ট URL {#legacy-login-request}

Hivesigner এখনও পুরনো লগইন URL গ্রহণ করে, পুরনো ইন্টিগ্রেশনের জন্য রাখা। নতুনগুলোর জন্য `/oauth2/authorize` ব্যবহার করুন।

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

এটি একই সম্মতির পর্দা খোলে, একই কলব্যাক যাচাই আর একই রিডাইরেক্টসহ। তবে এটি তার প্যারামিটার ভিন্নভাবে পড়ে:

- `scope` হয় `login` বা `posting`। অন্য যে কোনো মান, বা কিছু না দিলে, মানে `login`।
- `offline` পড়া হয় না। কোড ফ্লোর জন্য `response_type=code` যোগ করুন।
- `account` পড়া হয় না।

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` একই নিয়ম মেনে চলে।
