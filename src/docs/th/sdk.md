JavaScript SDK อย่างเป็นทางการสร้าง URL สำหรับเข้าสู่ระบบและลิงก์ลงนามให้คุณ และเรียก API ของ Hivesigner ให้ด้วย ส่วน Python นั้นมีไลบรารีจากชุมชน ภาษาอื่นใดก็เรียก [REST API](/docs/api) ได้โดยตรง

## JavaScript SDK {#javascript}

SDK คือแพ็กเกจ npm ชื่อ `hivesigner` ซอร์สโค้ดอยู่ที่ https://github.com/ecency/hivesigner-sdk มันเขียนด้วย TypeScript และมาพร้อมชนิดข้อมูลของตนเอง

เวอร์ชัน 4 ต้องใช้ Node.js 18 ขึ้นไป เพราะมันใช้ `fetch` ที่มีมาในตัว ส่วนในเบราว์เซอร์ต้องใช้ ES2017 ขึ้นไป ที่ใดไม่มี `fetch` ระดับโกลบอล ให้เพิ่ม polyfill ก่อนใช้ SDK บน Node.js รุ่นเก่ากว่านั้น ให้อยู่กับเวอร์ชัน 3 ต่อไป

### ติดตั้ง {#install}

```bash
npm install hivesigner
```

สำหรับหน้าเว็บที่ไม่มีขั้นตอนบิลด์ ให้โหลดบันเดิลสำหรับเบราว์เซอร์ มันกำหนดตัวแปรโกลบอลชื่อ `hivesigner` ไว้

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### สร้างไคลเอ็นต์ {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| ตัวเลือก | ความหมาย |
| --- | --- |
| `app` | บัญชีแอปของคุณ ส่งไปเป็น `client_id` |
| `callbackURL` | ที่ที่ Hivesigner ส่งผู้ใช้กลับไป ต้องเป็น callback ของแอปคุณอย่างใดอย่างหนึ่ง ตรงกันทุกอักขระ (callback แบบ loopback ที่เป็น http ธรรมดาอาจต่างกันที่โฮสต์และพอร์ตได้ ดู [callback](/docs/register-app#callback-rules)) |
| `scope` | รายการหนึ่งชุด เชื่อมด้วยจุลภาคเป็นพารามิเตอร์ `scope` ดู [ขอบเขตสิทธิ์](/docs/oauth2#scopes) |
| `responseType` | `'code'` สำหรับโฟลว์แบบโค้ด หากใช้โฟลว์แบบโทเค็นก็ไม่ต้องใส่ |
| `accessToken` | โทเค็นการเข้าถึงของผู้ใช้ เมื่อคุณมีอยู่แล้ว |
| `apiURL` | ต้นทางของ API โดย SDK จะเติม `/api/` ต่อท้ายให้ ค่าเริ่มต้นคือ `https://hivesigner.com` |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` และ `setApiURL` เปลี่ยนค่าของไคลเอ็นต์ได้ภายหลัง แต่ละตัวคืนไคลเอ็นต์กลับมา

### พาผู้ใช้เข้าสู่ระบบ {#sign-in}

`getLoginURL(state, account)` คืน URL สำหรับเข้าสู่ระบบ

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` ย้อนกลับมาที่ callback ของคุณโดยไม่เปลี่ยนแปลง ใช้มันผูกคำตอบเข้ากับคำขอ
- `account` ใส่หรือไม่ก็ได้ เป็นชื่อผู้ใช้ Hivesigner เลือกบัญชีนั้นเมื่อมันอยู่บนอุปกรณ์ และไม่สนใจเมื่อไม่มี

ในเบราว์เซอร์ `client.login({ state: 'STATE' })` ส่งผู้ใช้ไปยัง URL เดียวกันโดยไม่ระบุบัญชี

ในโฟลว์แบบโทเค็น callback ของคุณได้รับ `access_token`, `expires_in` และ `username` ให้มอบโทเค็นแก่ไคลเอ็นต์

```js
client.setAccessToken('ACCESS_TOKEN');
```

SDK ไม่มีเมธอดสำหรับการแลกโค้ดในโฟลว์แบบโค้ด เซิร์ฟเวอร์ของคุณต้องส่งโค้ดกับไคลเอ็นต์ซีเคร็ตไปยัง API เอง ตามที่ [แลกโค้ด](/docs/oauth2#exchange-code) แสดงไว้

### ดูว่าใครคือผู้ใช้ {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` คือบัญชี Hive ของผู้ใช้ตามที่บล็อกเชนคืนมา ส่วน `scope` ระบุสิ่งที่โทเค็นอนุญาต

### กระจายธุรกรรม {#broadcast}

`broadcast(operations)` ส่งการดำเนินการไปยัง API ซึ่งกระจายให้แทนผู้ใช้ API รับเฉพาะการดำเนินการฝั่ง posting ที่ผู้ใช้ของโทเค็นเป็นผู้เขียนเท่านั้น คือ `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` ที่ใช้สิทธิ์ posting, `claim_reward_balance` และ `account_update2` สำหรับเมตะดาต้าโปรไฟล์ ดู [broadcast รับอะไรบ้าง](/docs/api#broadcast-rules)

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

ให้ระบุชื่อผู้ใช้ไว้ในทุกการดำเนินการ API ไม่แทนค่า `__signer` ให้

เมธอดช่วยเหล่านี้สร้างการดำเนินการหนึ่งอย่างแล้วเรียก `broadcast`

| เมธอด | กระจายอะไร |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote` โดย `weight` อยู่ในช่วง `-10000` ถึง `10000` (100%) |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment` สำหรับโพสต์ใหม่ `parentAuthor` เป็น `''` ส่วน `jsonMetadata` เป็นอ็อบเจ็กต์ได้ SDK จะแปลงเป็นสตริงให้ |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json` ให้ส่ง `[]` เป็น `requiredAuths` และ `['USERNAME']` เป็น `requiredPostingAuths` ส่วน `json` เป็นสตริง |
| `reblog(account, author, permlink)` | `custom_json` ที่มี id เป็น `follow` เพื่อรีบล็อกโพสต์ |
| `follow(follower, following)` | `custom_json` ที่มี id เป็น `follow` และ `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` ที่มี id เป็น `follow` และ `what: []` |
| `ignore(follower, following)` | `custom_json` ที่มี id เป็น `follow` และ `what: ['ignore']` (ปิดเสียง) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance` จำนวนเงินเป็นสตริง เช่น `'0.000 HIVE'`, `'0.000 HBD'` และ `'1.000000 VESTS'` |

`updateUserMetadata()` เลิกใช้แล้ว หากต้องการเปลี่ยนโปรไฟล์ของผู้ใช้ ให้กระจาย `account_update2` พร้อม `posting_json_metadata` ใหม่

### ออกจากระบบ {#log-out}

`revokeToken()` คือคำสั่งออกจากระบบของ SDK มันส่งโทเค็นไปยังปลายทางเพิกถอนของ API แล้วลบโทเค็นออกจากไคลเอ็นต์ หากการเรียกล้มเหลว ให้เรียก `removeAccessToken()` เอง และอย่าลืมลบโทเค็นจากที่ที่แอปของคุณเก็บไว้ด้วย

หากต้องการยุติสิทธิ์เข้าถึงของแอปคุณอย่างถาวร ผู้ใช้ต้องลบแอปนั้นเองที่ https://hivesigner.com/authorized-apps ดู [ดูและถอนสิทธิ์ของแอป](/docs/signing-in#remove-access)

### ลิงก์ลงนาม {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` และ `sendTransaction(tx, params)` คืนลิงก์ `https://hivesigner.com/sign/...` ส่วน `params` รับ `callback`, `no_broadcast` และ `signer` ดู [ลิงก์ลงนาม](/docs/sign-links)

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

ใน TypeScript ชนิดข้อมูลบังคับให้ใส่อาร์กิวเมนต์ตัวที่สาม ให้ส่ง `undefined` เพื่อรับลิงก์กลับมา

ในเบราว์เซอร์ ให้ส่งฟังก์ชันเป็นอาร์กิวเมนต์ตัวที่สามเพื่อเปิดลิงก์ในแท็บใหม่แทน ฟังก์ชันนั้นจะไม่ถูกเรียกและจะไม่มีค่าใดคืนมา ให้เรียกจากตัวจัดการการคลิก มิฉะนั้นเบราว์เซอร์อาจบล็อกแท็บใหม่และการเรียกจะเกิดข้อผิดพลาด

### พรอมิสกับคอลแบ็ก {#promises-and-callbacks}

`me`, `broadcast`, เมธอดช่วยต่าง ๆ และ `revokeToken` คืนพรอมิส หากต้องการใช้คอลแบ็กแทน ให้ส่งฟังก์ชันเป็นอาร์กิวเมนต์ตัวสุดท้าย มันรับ `(error, result)`

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

เมื่อ API ตอบเป็นข้อผิดพลาด พรอมิสจะถูกปฏิเสธพร้อมเนื้อหาข้อผิดพลาดของ API คือ `{ error, error_description }` หากใช้คอลแบ็ก เนื้อหานั้นจะเป็นอาร์กิวเมนต์ `error` และเมื่อคำตอบไม่ใช่ JSON มันจะถูกปฏิเสธพร้อมข้อผิดพลาดจากการแปลงข้อมูล

## Python {#python}

ไลบรารีเหล่านี้มาจากชุมชน ผู้เขียนเป็นผู้ดูแลเอง ไม่ใช่ทีม Hivesigner ให้ตรวจสอบกับ [REST API](/docs/api) ก่อนนำไปใช้จริง

| ไลบรารี | ผู้เขียน |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem โมดูล `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
