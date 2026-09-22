โทเค็นของ Hivesigner คือข้อความสั้น ๆ ที่ลงนามแล้ว ระบุบัญชี Hive แอปที่สร้างโทเค็นนั้นขึ้นมา และเวลาที่ลงนาม เซิร์ฟเวอร์ของคุณตรวจสอบโทเค็นได้ทั้งผ่าน API และด้วยตัวเอง หน้านี้แสดงว่าโทเค็นมีอะไรอยู่ข้างใน อยู่ได้นานเท่าใด และวิธีตรวจสอบทั้งสองแบบ

## โทเค็นหน้าตาเป็นอย่างไร {#format}

โทเค็นคืออ็อบเจกต์ JSON ที่เข้ารหัสแบบ base64url โดยต่างจาก base64url มาตรฐานอยู่อย่างเดียว คือใช้ `.` เติมท้ายแทน `=` ดังนั้นเมื่อเทียบกับ base64 ธรรมดา `+` จะกลายเป็น `-`, `/` กลายเป็น `_` และ `=` กลายเป็น `.` โทเค็นทุกอันขึ้นต้นด้วย `eyJzaWduZWRfbWVzc2FnZSI6`

เมื่อถอดรหัสแล้ว โทเค็นการเข้าถึงจากโฟลว์แบบโทเค็นจะมีหน้าตาแบบนี้

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| ฟิลด์ | ความหมาย |
| --- | --- |
| `signed_message.type` | โทเค็นนี้คืออะไร: `login`, `posting`, `code` หรือ `refresh` ดู [ชนิดของโทเค็น](#kinds) |
| `signed_message.app` | บัญชีแอปที่โทเค็นถูกสร้างให้ โทเค็นเข้าสู่ระบบของเว็บไซต์ที่ไม่มีบัญชีแอปจะไม่มีค่านี้ |
| `authors[0]` | บัญชี Hive ที่โทเค็นนี้เป็นของเขา |
| `timestamp` | เวลาที่ลงนาม เป็นวินาทีนับจาก 1970-01-01 UTC |
| `signatures[0]` | ลายเซ็น ในรูปสตริงฐานสิบหก |
| `authority` | มีเฉพาะในโทเค็นที่ลงนามในเบราว์เซอร์ บอกว่าคีย์ใดของผู้ใช้เป็นผู้ลงนาม `posting` หรือ `active` ฟิลด์นี้อยู่นอกข้อมูลที่ลงนาม หากต้องการรู้ว่าคีย์ใดลงนาม ให้กู้คืนจากลายเซ็น |

ลายเซ็นคือลายเซ็น secp256k1 บนค่าแฮช sha256 ของ `JSON.stringify({ signed_message, authors, timestamp })` โดยเรียงคีย์ตามลำดับนั้น

### ถอดรหัสโทเค็น {#decode}

ใน Node.js

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

ในเบราว์เซอร์

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

การถอดรหัสไม่ใช่การตรวจสอบ ใครก็สร้างสตริงที่ถอดรหัสออกมาเป็นรูปแบบนี้ได้ [ตรวจสอบโทเค็น](#check-a-token) ก่อนจะเชื่อถือมัน

## ชนิดของโทเค็น {#kinds}

| โทเค็น | `type` | `app` | ลงนามโดย | ได้รับจากที่ใด |
| --- | --- | --- | --- | --- |
| โทเค็นการเข้าถึง โฟลว์แบบโทเค็น | `posting` | แอปของคุณ | คีย์ posting ของผู้ใช้ หรือคีย์ active เมื่อ Hivesigner ไม่มีคีย์ posting ของบัญชีนั้น | `access_token` ที่ callback ของคุณ |
| โทเค็นเข้าสู่ระบบ `scope=login` | `login` | แอปของคุณ | คีย์ posting หรือ active ของผู้ใช้ | `access_token` ที่ callback ของคุณ |
| โทเค็นเข้าสู่ระบบ เว็บไซต์ที่ไม่มีบัญชีแอป | `login` | ไม่มี | คีย์ posting หรือ active ของผู้ใช้ | `access_token` ที่ callback ของคุณ |
| โค้ด | `code` | แอปของคุณ | คีย์ posting หรือ active ของผู้ใช้ | `code` ที่ callback ของคุณ |
| โทเค็นการเข้าถึง โฟลว์แบบโค้ด | `posting` | แอปของคุณ | คีย์ posting ของ @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| โทเค็นรีเฟรช | `refresh` | แอปของคุณ | คีย์ posting ของ @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

โค้ดและโทเค็นรีเฟรชไม่ใช่โทเค็นการเข้าถึง อย่ารับสิ่งใดสิ่งหนึ่งเป็นการเข้าสู่ระบบเด็ดขาด

## โทเค็นอยู่ได้นานเท่าใด {#lifetime}

โทเค็นการเข้าถึงอยู่ได้ 7 วัน `expires_in` คือ 604800 วินาที นับจาก `timestamp` ของโทเค็นนั้น เมื่อหมดอายุแล้ว

- **โฟลว์แบบโทเค็น:** ส่งผู้ใช้ไปเข้าสู่ระบบใหม่ คนที่เคยอนุญาตแอปของคุณแล้วจะเห็น «เข้าสู่ระบบ APP» และคลิกเพียงครั้งเดียว
- **โฟลว์แบบโค้ด:** เซิร์ฟเวอร์ของคุณขอโทเค็นการเข้าถึงใหม่ด้วยโทเค็นรีเฟรชและไคลเอ็นต์ซีเคร็ต ดู [รีเฟรช](/docs/oauth2#refresh)

ให้ถือว่าโทเค็นหมดอายุทันทีที่ `timestamp` ของมันเก่ากว่า 7 วัน สำหรับสิ่งที่คุณตรวจทันทีหลังการเปลี่ยนเส้นทาง ให้ยอมรับอายุที่สั้นกว่านั้นมาก แลกโค้ดทันที และรับโทเค็นเข้าสู่ระบบเฉพาะภายในไม่กี่นาทีนับจาก `timestamp` ของมัน

## ตรวจสอบโทเค็นบนเซิร์ฟเวอร์ของคุณ {#check-a-token}

ก่อนที่เซิร์ฟเวอร์ของคุณจะเชื่อโทเค็นที่เบราว์เซอร์หรือแอปส่งมา ให้ตรวจว่า

- บัญชีนั้นหรือ @hivesigner เป็นผู้ลงนามจริง
- โทเค็นถูกสร้างขึ้นสำหรับแอปของคุณ
- เป็นโทเค็นชนิดที่คุณคาดหวัง
- ยังใหม่พอ

### ถาม API {#check-with-the-api}

เรียก `/api/me` ด้วยโทเค็นนั้น โทเค็นที่ถูกต้องจะคืนบัญชีมาใน `user`

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

โทเค็นที่ไม่ถูกต้องจะคืน `401` พร้อม `invalid_grant` ดู [GET /api/me](/docs/api#me)

`/api/me` ยืนยันลายเซ็นให้ แต่คำตอบของมันไม่ได้บอกว่าโทเค็นถูกสร้างขึ้นเพื่อแอปใด ดังนั้นให้ถอดรหัสโทเค็นด้วย แล้วตรวจ `app`, `type` และอายุของมันเอง โทเค็นที่สร้างขึ้นเพื่อแอปอื่นต้องไม่ทำให้ใครเข้าสู่ระบบแอปของคุณได้

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

API รับเฉพาะโทเค็นที่ระบุแอป ส่วนโทเค็นเข้าสู่ระบบจากเว็บไซต์ที่ไม่มีบัญชีแอป ให้ [ตรวจสอบเอง](#check-it-yourself)

### ตรวจสอบเอง {#check-it-yourself}

1. ถอดรหัสโทเค็น
2. ตรวจว่า `signed_message.type` เป็นชนิดที่คุณคาดหวัง: `posting` สำหรับโทเค็นการเข้าถึง และ `login` สำหรับโทเค็นเข้าสู่ระบบ
3. ตรวจว่า `signed_message.app` คือบัญชีแอปของคุณ สำหรับเว็บไซต์ที่ไม่มีบัญชีแอป ให้ตรวจว่าไม่มีค่านี้เลย
4. ตรวจอายุจาก `timestamp`
5. คำนวณค่าแฮช sha256 ของ `JSON.stringify({ signed_message, authors, timestamp })`
6. กู้คืนคีย์สาธารณะจาก `signatures[0]` และค่าแฮชนั้น
7. อ่านบัญชี `authors[0]` จากบล็อกเชน Hive ณ ตอนนี้ เพราะผู้ใช้เปลี่ยนคีย์ได้ คีย์ที่กู้คืนมาต้องเป็นคีย์ posting หรือ active ปัจจุบันของบัญชีนั้น ส่วนโทเค็นจาก `/api/oauth2/token` ลงนามโดย @hivesigner ให้รับคีย์ posting ปัจจุบันของบัญชี @hivesigner แทน

ใน Node.js ด้วย [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk) ซึ่งให้ `PrivateKey`, `PublicKey`, `Signature` และ `callRPC` ภายใต้ `@ecency/sdk/hive`

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

ใช้งานแบบนี้

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

ไลบรารี dhive (`@hiveio/dhive`) ก็ใช้ได้ คำนวณแฮชด้วย `cryptoUtils.sha256(message)` และกู้คืนคีย์ด้วย `Signature.fromString(signatures[0]).recover(digest).toString()`

## เก็บโทเค็นให้ปลอดภัย {#keep-tokens-safe}

ใครก็ตามที่ถือโทเค็น posting จะกระจายธุรกรรมในนามผู้ใช้ผ่านแอปของคุณได้จนกว่าโทเค็นจะหมดอายุ ให้ปฏิบัติกับมันเหมือนรหัสผ่าน

- **เก็บโทเค็นไว้บนเซิร์ฟเวอร์ของคุณ** หรือในคุกกี้แบบ httpOnly และ Secure ส่วนโทเค็นรีเฟรชและไคลเอ็นต์ซีเคร็ต ให้เก็บไว้บนเซิร์ฟเวอร์เท่านั้น
- **อย่าใส่โทเค็นไว้ใน URL ที่คุณบันทึกลงล็อก** โฟลว์แบบโทเค็นส่งโทเค็นมาในสตริงคำค้นของ callback ของคุณ ให้อ่านมันบนเซิร์ฟเวอร์ แล้วเปลี่ยนเส้นทางไปยัง URL ที่ไม่มีโทเค็น และอย่าเก็บสตริงคำค้นของ callback ไว้ในล็อก
- **อย่าโหลดอะไรจากเว็บไซต์อื่นในหน้า callback ของคุณ** เพื่อไม่ให้ที่อยู่ซึ่งมีโทเค็นถูกส่งไปหาพวกเขา เฮดเดอร์ `Referrer-Policy: no-referrer` บนหน้านั้นช่วยได้
- **ส่งโทเค็นไปยังเซิร์ฟเวอร์ของคุณเองและ `https://hivesigner.com/api/` เท่านั้น**

## ออกจากระบบและถอนสิทธิ์ {#sign-out}

- **การให้ผู้ใช้ออกจากระบบ** หมายถึงการทิ้งโทเค็น ให้ลบออกจากเซสชันหรือคุกกี้ของคุณ คุณจะเรียก [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) เพื่อบอก Hivesigner ว่าผู้ใช้ออกจากระบบแล้วก็ได้ แต่ถึงอย่างไรแอปของคุณก็ทิ้งโทเค็นเอง
- **การตัดสิทธิ์ของแอปคุณอย่างถาวร** เป็นการตัดสินใจของผู้ใช้ ที่ https://hivesigner.com/authorized-apps หรือที่ `https://hivesigner.com/revoke/APP` เขาจะนำบัญชีแอปของคุณออกจากสิทธิ์ posting ของตนบนเชน หลังจากนั้น API จะไม่กระจายธุรกรรมแทนเขาผ่านแอปของคุณอีก
