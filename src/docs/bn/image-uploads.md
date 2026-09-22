Hive পোস্ট ছবিকে URL দিয়ে নির্দেশ করে, তাই একটি অ্যাপের ছবি আপলোড করার জায়গা দরকার। imagehoster হলো Hive-এর জন্য তৈরি ওপেন সোর্স ছবি হোস্টিং। এটি সেইসব মানুষের আপলোড নিতে পারে যারা Hivesigner দিয়ে আপনার অ্যাপে লগইন করেছেন: তাদের অ্যাক্সেস টোকেনই তাদের কী দিয়ে করা স্বাক্ষরের কাজ করে।

## এটি কীভাবে কাজ করে {#how-it-works}

1. ব্যবহারকারী পোস্টিং অ্যাক্সেসসহ Hivesigner দিয়ে আপনার অ্যাপে লগইন করেন। আপনার অ্যাপ একটি অ্যাক্সেস টোকেন পায়। দেখুন [OAuth2 দিয়ে লগইন](/docs/oauth2)।
2. আপনার অ্যাপ সেই টোকেন URL-এ রেখে ছবিটি আপনার imagehoster-এ পাঠায়।
3. imagehoster টোকেন আর অ্যাকাউন্ট যাচাই করে, ছবিটি সংরক্ষণ করে এবং তার URL দিয়ে উত্তর দেয়।
4. আপনার অ্যাপ সেই URL পোস্টে বসায়।

## নিজের imagehoster চালান {#run-your-own}

একটি imagehoster একটিমাত্র অ্যাপ অ্যাকাউন্টের জন্য সেট করা থাকে: কনফিগারেশনের `[upload_limits]` অংশে `app_account`। সেটিকে সেই অ্যাপ অ্যাকাউন্টের জন্য তৈরি টোকেন পাঠান। পাবলিক ইনস্ট্যান্সগুলো অন্য অ্যাপের: images.ecency.com সেট করা আছে Ecency-র অ্যাপ অ্যাকাউন্টের জন্য আর images.hive.blog সেট করা আছে Hive.blog-এর জন্য। আপনার ব্যবহারকারীদের আপলোড নিতে হলে আপনার অ্যাপ অ্যাকাউন্ট দিয়ে নিজের ইনস্ট্যান্স চালান।

সোর্স কোড আর সেটআপ নির্দেশিকা:

- Hive কমিউনিটির imagehoster: https://gitlab.syncad.com/hive/imagehoster
- Ecency-র imagehoster: https://github.com/ecency/imagehoster

কনফিগারেশনে আপনার অ্যাপ অ্যাকাউন্ট বসান:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

একই অংশে ঠিক হয় আপলোডের জন্য অ্যাকাউন্টের ন্যূনতম রেপুটেশন (`reputation`) আর প্রতিটি অ্যাকাউন্টের আপলোড কোটা (`duration` মিলিসেকেন্ডে `max` সংখ্যক আপলোড)। কোটা কার্যকর করতে `redis_url` সেট করুন। `max_image_size` সবচেয়ে বড় ফাইলের আকার ঠিক করে, বাইটে।

## একটি ছবি আপলোড করুন {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **টোকেন।** ব্যবহারকারীর অ্যাক্সেস টোকেন পাথে বসান, Hivesigner যেভাবে আপনার অ্যাপকে দিয়েছে ঠিক সেভাবেই। আপনার অ্যাপের জন্য পোস্টিং অ্যাক্সেসসহ লগইন থেকে পাওয়া টোকেন ব্যবহার করুন। শুধু লগইনের টোকেন, যা `client_id` ছাড়া অনুরোধ থেকে আসে, কোনো অ্যাপের নাম বহন করে না আর তাই তা প্রত্যাখ্যাত হয়।
- **বডি।** একটি ছবি ফাইলসহ `multipart/form-data` পাঠান। imagehoster প্রথম ফাইলটিই নেয়, ফিল্ডের নাম যাই হোক।
- **আকার।** একটি `Content-Length` হেডার পাঠান। ফাইলটি ইনস্ট্যান্সের `max_image_size`-এর চেয়ে বড় হওয়া চলবে না।

উত্তরটি JSON। সফল হলে তাতে ছবির URL থাকে:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

ব্যর্থ হলে imagehoster একটি HTTP ত্রুটি স্ট্যাটাস দিয়ে উত্তর দেয়। বেশিরভাগ ব্যর্থতায় একটি ত্রুটির নামও থাকে:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **নোট:** টোকেনটি URL-এর মধ্যে যায়। আপনার imagehoster শুধু https-এ চালান এবং তার অ্যাক্সেস লগ ব্যক্তিগত রাখুন।

## উদাহরণ {#example}

এই ব্রাউজার ফাংশনটি একটি ফাইল ইনপুট বা ড্রপ থেকে ফাইল আপলোড করে। ব্রাউজার আপনার হয়ে মাল্টিপার্ট হেডার আর দৈর্ঘ্য বসিয়ে দেয়: `Content-Type` নিজে বসাবেন না।

```js
// IMAGEHOSTER_URL is the address of your imagehoster, such as 'https://YOUR_IMAGEHOSTER'.
async function uploadImage(file, accessToken) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${IMAGEHOSTER_URL}/hs/${accessToken}`, {
    method: 'POST',
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.name ?? `Upload failed with status ${response.status}`);
  }
  return result.url;
}

const url = await uploadImage(input.files[0], ACCESS_TOKEN);
const markdown = `![](${url})`; // add this to the post body
```
