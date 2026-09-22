Hivesigner API আছে `https://hivesigner.com/api/` ঠিকানায়। এটি লগইন করা ব্যবহারকারীর অ্যাকাউন্ট ফেরত দেয়, তার হয়ে পোস্টিং অপারেশন ব্রডকাস্ট করে, কোডকে টোকেনে বদলে দেয় এবং Hivesigner ব্যবহার করা অ্যাপের তালিকা দেয়। এই পাতায় প্রতিটি এন্ডপয়েন্ট তার অনুরোধ, উত্তর আর ত্রুটিসহ বর্ণনা করা হয়েছে।

## অনুরোধ আর প্রমাণীকরণ {#authentication}

- **বেস URL:** `https://hivesigner.com/api/`। নিচের প্রতিটি এন্ডপয়েন্ট `https://hivesigner.com`-এর সাপেক্ষে।
- **টোকেন:** এটি `Authorization` হেডারে যেমন আছে তেমনই পাঠান: `Authorization: ACCESS_TOKEN`। `Bearer ` উপসর্গও গ্রহণ করা হয়। কোয়েরি স্ট্রিং বা বডিতে `access_token` হিসেবেও পাঠাতে পারেন, তবে হেডার একে URL আর লগের বাইরে রাখে।
- **বডি:** `Content-Type: application/json` সহ JSON, বা একটি ফর্ম (`application/x-www-form-urlencoded`)।
- **উত্তর:** JSON।
- **ব্রাউজার:** API ক্রস-অরিজিন অনুরোধ অনুমোদন করে, তাই একটি ওয়েব অ্যাপ সরাসরি একে ডাকতে পারে।

টোকেন পেতে দেখুন [OAuth2 দিয়ে লগইন](/docs/oauth2)। টোকেনে কী থাকে তার জন্য দেখুন [টোকেন](/docs/tokens)।

## ত্রুটি {#errors}

ত্রুটির উত্তরে একটি HTTP ত্রুটি স্ট্যাটাস আর এই বডি থাকে:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| স্ট্যাটাস | `error` | কখন |
| --- | --- | --- |
| 401 | `invalid_grant` | টোকেন নেই বা বৈধ নয়, বা এই এন্ডপয়েন্টের জন্য ভুল ধরনের ("The token has invalid role")। `/api/oauth2/token`-এ আরও "The code or secret is not valid"। |
| 401 | `invalid_scope` | `/api/broadcast`: টোকেন অনুমোদন করে না এমন একটি অপারেশন। বিবরণে অপারেশনগুলোর নাম থাকে। |
| 401 | `unauthorized_client` | `/api/broadcast`: এমন অপারেশন যার লেখক টোকেনের ব্যবহারকারী নন, কী স্পর্শ করে এমন `account_update2`, অনুপস্থিত পোস্টিং কর্তৃত্বের অনুমতি, বা লোড করা যায়নি এমন অ্যাকাউন্ট। বিবরণে বলা থাকে কোনটি। |
| 500 | `server_error` | `/api/broadcast`: Hive নেটওয়ার্ক লেনদেনটি প্রত্যাখ্যান করেছে। `error_description`-এ তার বার্তা থাকে। |
| 503 | `unavailable` | `/api/apps`: ডিরেক্টরি এখনও তৈরি হচ্ছে। |

## GET /api/me {#me}

টোকেনটি যে অ্যাকাউন্টের জন্য সেটি ফেরত দেয়। কে লগইন করেছেন তা জানতে, বা [একটি টোকেন যাচাই করতে](/docs/tokens#check-with-the-api) এটি ব্যবহার করুন।

- **মেথড:** `GET` বা `POST`।
- **টোকেন:** একটি অ্যাক্সেস টোকেন, অ্যাপের নাম আছে এমন `login` টোকেনসহ।

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

উত্তর, সংক্ষেপে:

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| ফিল্ড | অর্থ |
| --- | --- |
| `user` | টোকেনটি যে Hive ইউজারনেমের জন্য। `_id` আর `name` সেটিই আবার বলে। |
| `account` | পুরো অ্যাকাউন্ট, Hive-এর `condenser_api.get_accounts` যেমন ফেরত দেয়। |
| `scope` | টোকেন যা অনুমোদন করে: লগইন টোকেনের জন্য `["login"]`, নয়তো `/api/broadcast` যেসব অপারেশন গ্রহণ করে। |
| `user_metadata` | অ্যাকাউন্টের প্রোফাইল মেটাডেটা, JSON থেকে পড়া। |

`/api/me` টোকেনটি কোন অ্যাপের জন্য তৈরি তা বলে না। সেটি যাচাই করতে টোকেনটি ডিকোড করুন: দেখুন [API-কে জিজ্ঞেস করুন](/docs/tokens#check-with-the-api)।

## POST /api/broadcast {#broadcast}

টোকেনের ব্যবহারকারীর পোস্টিং অপারেশনগুলো @hivesigner-এর পোস্টিং কী দিয়ে সাইন করে আর Hive-এ ব্রডকাস্ট করে।

- **মেথড:** `POST`।
- **টোকেন:** একটি `posting` অ্যাক্সেস টোকেন, টোকেন ফ্লো বা কোড ফ্লো থেকে।
- **কাজ করার আগে যা দরকার:** ব্যবহারকারী আপনার অ্যাপ অ্যাকাউন্টকে পোস্টিং কর্তৃত্ব দিয়েছেন (সম্মতির পর্দা এটি করে) আর আপনার অ্যাপ অ্যাকাউন্ট [@hivesigner-কে পোস্টিং কর্তৃত্ব দিয়েছে](/docs/register-app#grant-hivesigner)।
- **বডি:** `{ "operations": [...] }`, যেখানে প্রতিটি অপারেশন `[name, fields]`, ঠিক যেমন Hive ব্লকচেইনে। একটি অনুরোধের সব অপারেশন একটিমাত্র লেনদেনে যায়।

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

curl দিয়ে একই অনুরোধ:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

অনুসরণ একটি `custom_json` অপারেশন:

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

কোনো Hive নোড লেনদেনটি গ্রহণ করলেই API উত্তর দেয়। `result.id` হলো লেনদেনের আইডি:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

নেটওয়ার্ক লেনদেনটি প্রত্যাখ্যান করলে উত্তর হয় `server_error` সহ `500`। তার `error_description`-এ নেটওয়ার্কের বার্তা থাকে আর `response`-এ কাঁচা ত্রুটিটি থাকে।

### broadcast যা গ্রহণ করে {#broadcast-rules}

পোস্টিং টোকেন API-কে এই অপারেশনগুলো ব্রডকাস্ট করতে দেয়, আর কিছু নয়। প্রতিটিতে দেখানো ফিল্ডের অ্যাকাউন্টটিই টোকেনের ব্যবহারকারী হতে হবে:

| অপারেশন | টোকেনের ব্যবহারকারীকে হতে হবে |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | `required_posting_auths`-এর প্রথম অ্যাকাউন্ট |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **অন্য যে কোনো অপারেশন** `invalid_scope` দিয়ে প্রত্যাখ্যাত হয়। `login` টোকেন কোনো অপারেশনই অনুমোদন করে না।
- **অন্য অ্যাকাউন্টের জন্য অপারেশন** `unauthorized_client` দিয়ে প্রত্যাখ্যাত হয়। টোকেন সবসময় শুধু তার নিজের ব্যবহারকারীর হয়েই ব্রডকাস্ট করে।
- **`account_update2`** শুধু অ্যাকাউন্টের মেটাডেটাই বদলাতে পারে। `owner`, `active` বা `posting` ফিল্ড আছে এমন অপারেশন `unauthorized_client` দিয়ে প্রত্যাখ্যাত হয়।
- **`custom_json`**: `required_auths` ফাঁকা রাখুন। API পোস্টিং কর্তৃত্ব দিয়ে সাইন করে, তাই অ্যাক্টিভ কর্তৃত্ব লাগে এমন অপারেশন নেটওয়ার্কে ব্যর্থ হয়।

স্থানান্তর আর অন্যান্য ওয়ালেট অপারেশনের জন্য ব্যবহারকারীর অ্যাক্টিভ কী লাগে। সেগুলো বরং [সাইন লিংক](/docs/sign-links) হিসেবে পাঠান।

## POST /api/oauth2/token {#oauth2-token}

একটি কোডকে টোকেনে, বা একটি রিফ্রেশ টোকেনকে নতুন টোকেনে বদলে দেয়। শুধু আপনার সার্ভার থেকেই ডাকুন। দেখুন [কোড ফ্লো](/docs/oauth2#code-flow)।

- **মেথড:** `POST`, মানগুলো বডিতে।
- **বডি:** `code` আর `client_secret`, অথবা `refresh_token` আর `client_secret`।
- **হেডার:** কোনো `Authorization` হেডার পাঠাবেন না।

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

প্রতিটি কল একটি নতুন অ্যাক্সেস টোকেন আর একটি নতুন রিফ্রেশ টোকেন ফেরত দেয়। দুটিই @hivesigner সাইন করে। `expires_in` হলো অ্যাক্সেস টোকেনের আয়ু, সেকেন্ডে (৭ দিন)।

ত্রুটি: `401 invalid_grant`। পাঠানো মানটি বৈধ কোড বা রিফ্রেশ টোকেন না হলে বিবরণ হয় "The token has invalid role"। কোড বা সিক্রেট না মিললে বিবরণ হয় "The code or secret is not valid"।

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Hivesigner-কে জানায় যে ব্যবহারকারী আপনার অ্যাপ থেকে লগআউট করেছেন। আপনার অ্যাপ টোকেনটি নিজেই ফেলে দেয়।

- **মেথড:** `POST`।
- **টোকেন:** অ্যাক্সেস টোকেন, `Authorization` হেডারে।

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

JavaScript SDK-এর `revokeToken()` এই কলটি করে আর তারপর টোকেনটি ভুলে যায়। আপনার অ্যাপের অ্যাক্সেস চিরতরে সরাতে ব্যবহারকারী https://hivesigner.com/authorized-apps ঠিকানায় সেটি সরান। দেখুন [লগআউট আর অ্যাক্সেস সরানো](/docs/tokens#sign-out)।

## GET /api/apps {#apps}

সর্বজনীন অ্যাপ ডিরেক্টরি: যেসব অ্যাপ Hivesigner দিয়ে ব্রডকাস্ট করে, কত মানুষ সেগুলো ব্যবহার করে সেই অনুসারে সাজানো। এতে কোনো টোকেন লাগে না। https://hivesigner.com/apps একই তালিকা দেখায়।

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| ফিল্ড | অর্থ |
| --- | --- |
| `updated_at` | ডিরেক্টরিটি শেষবার কখন তৈরি হয়েছে। |
| `building` | প্রথম নির্মাণে ডেটা না আসা পর্যন্ত `true`। তখন `apps` ফাঁকা থাকে। |
| `window_days` | তালিকাটি কত দিনের হিসাব ধরে। |
| `featured` | যে ইউজারনেমগুলো প্রথমে দেখানো হয়, ক্রম অনুসারে। |
| `apps[].username` | অ্যাপ অ্যাকাউন্ট। |
| `apps[].name`, `about` | অ্যাপ অ্যাকাউন্টের প্রোফাইল থেকে, বা `null`। |
| `apps[].website` | প্রোফাইলের ওয়েবসাইট, যখন সেটি নিজের ডোমেইনে উত্তর দেয়। নয়তো `null`। |
| `apps[].site` | ওয়েবসাইট যাচাইয়ের ফল: `ok`, `no_website`, `invalid`, `redirected`, `blocked` বা `unreachable`। `redirected` হলে সঙ্গে `redirects_to`-ও থাকে। |
| `apps[].users` | দৈনিক আলাদা ব্যবহারকারী, পুরো সময়কালের যোগফল। |
| `apps[].requests` | ওই সময়কালে অ্যাপটির জন্য করা সফল API অনুরোধ। |
| `apps[].first_seen`, `last_seen` | Hivesigner অ্যাপটিকে প্রথম যেদিন নথিভুক্ত করেছে আর শেষ যেদিন সেটি ব্যবহার হয়েছে, বা `null`। |
| `apps[].new` | `true`, যখন অ্যাপটি এই সময়কালের মধ্যেই প্রথম দেখা গেছে। |

উত্তরটি ৫ মিনিট পর্যন্ত ক্যাশে থাকতে পারে। ডিরেক্টরি প্রথমবার তৈরি হওয়ার আগে API `unavailable` সহ `503` দেয়। পরে আবার চেষ্টা করুন।

নাম আর বিবরণ প্রতিটি অ্যাপ অ্যাকাউন্ট নিজেই প্রকাশ করে। Hivesigner এর কোনোটিই যাচাই করে না।
