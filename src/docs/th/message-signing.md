แอปของคุณขอให้ผู้ใช้ลงนามข้อความด้วยคีย์ posting หรือคีย์ active ของเขาได้ ลายเซ็นนั้นพิสูจน์ว่าผู้ใช้ควบคุมบัญชีดังกล่าว ไม่มีอะไรถูกกระจายออกไป ข้อความจึงไม่เคยขึ้นไปบนบล็อกเชน Hivesigner ลงนามแบบเดียวกับ `requestSignBuffer` ของ Hive Keychain โค้ดฝั่งเซิร์ฟเวอร์ที่ตรวจลายเซ็นของ Keychain จึงตรวจลายเซ็นของ Hivesigner ได้ด้วย

## ขอลายเซ็น {#request}

ส่งผู้ใช้ไปที่ `https://hivesigner.com/sign-buffer` พร้อมพารามิเตอร์คำค้นเหล่านี้

| พารามิเตอร์ | จำเป็น | ความหมาย |
| --- | --- | --- |
| `message` | ใช่ | ข้อความที่จะลงนามทุกตัวอักษร ต้องมีอะไรมากกว่าช่องว่าง |
| `redirect_uri` | ใช่ | ที่ที่ Hivesigner ส่งผลลัพธ์ไป ดู [กฎของ callback](#callback-rules) |
| `authority` | ไม่ | `posting` หรือ `active` จะพิมพ์ตัวใหญ่ตัวเล็กอย่างไรก็ได้ (`Posting` ก็ใช้ได้) หากไม่มีหรือเป็นค่าว่างจะเป็น `posting` ค่าอื่นใดถูกปฏิเสธ |
| `client_id` | ไม่ | บัญชีแอปของคุณ และระบบอ่าน `clientId` ด้วย เมื่อมีค่านี้ `redirect_uri` ต้องเป็น callback ของแอปคุณอย่างใดอย่างหนึ่ง |
| `state` | ไม่ | ค่าใดก็ได้ Hivesigner ส่งกลับมาโดยไม่เปลี่ยนแปลง |
| `account` | ไม่ | บัญชีที่คุณคาดว่าจะเป็นผู้ลงนาม Hivesigner เลือกบัญชีนั้นเมื่อมันอยู่บนอุปกรณ์ และไม่สนใจเมื่อไม่มี ระบบอ่าน `select_account` ด้วย |

สร้าง URL ด้วย `URLSearchParams` เพื่อให้ทุกค่าถูกเข้ารหัส

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### กฎของ callback {#callback-rules}

- callback ต้องเป็น `https://` ส่วน `http://` ธรรมดาใช้ได้เฉพาะบน loopback เท่านั้น คือ `localhost`, `127.0.0.1` หรือ `[::1]`
- **เมื่อมี `client_id`** callback ต้องลงทะเบียนไว้กับบัญชีแอปนั้น โดยเทียบแบบเดียวกับการเข้าสู่ระบบ ดู [callback](/docs/register-app#callback-rules) Hivesigner อ่าน callback ของแอปจาก Hive ตอนที่คำขอเปิดขึ้น และจะไม่ลงนามอะไรจนกว่าจะอ่านได้ เมื่อติดต่อ Hive ไม่ได้ ผู้ใช้จะได้ปุ่ม **ลองอีกครั้ง**
- **เมื่อไม่มี `client_id`** callback ใดที่ทำตามกฎข้อแรกก็ใช้ได้ Hivesigner จะระบุโฮสต์ของ callback เป็นผู้ขอ เช่น «HOST ขอให้คุณลงนามข้อความ»

ให้ส่ง `client_id` เมื่อคุณมีบัญชีแอป ผู้ใช้จะได้เห็นชื่อและบัญชีของแอปคุณ และมีเพียง callback ที่คุณลงทะเบียนไว้เท่านั้นที่รับลายเซ็นได้

Hivesigner ปฏิเสธคำขอที่ไม่มีข้อความ มี `authority` ที่ไม่รู้จัก ไม่มี callback หรือ callback ใช้ไม่ได้ มี `client_id` ที่ไม่ใช่บัญชี Hive หรือมี callback ที่ไม่ได้ลงทะเบียนไว้กับแอปนั้น ผู้ใช้จะเห็นข้อความ «ไม่สามารถใช้คำขอลงนามนี้ได้ คำขอต้องมีข้อความ คีย์ posting หรือ active และ URL สำหรับเปลี่ยนเส้นทางที่ปลอดภัยซึ่งลงทะเบียนไว้กับแอป โปรดกลับไปที่เว็บไซต์แล้วลองอีกครั้ง» พร้อมปุ่ม **รายงานปัญหานี้**

### ผู้ใช้เห็นอะไร {#what-the-user-sees}

- หัวข้อที่ระบุชื่อแอปของคุณ (หรือโฮสต์ของ callback) และ «จะพาคุณไปที่ HOST»
- ข้อความทั้งหมด ตรงตามที่มันจะถูกลงนาม อักขระที่อาจซ่อนข้อความหรือเปลี่ยนทิศทางของข้อความจะแสดงเป็นรหัส เช่น `\u{200B}`
- «จะลงนามด้วยคีย์ posting ของคุณ» หรือ «จะลงนามด้วยคีย์ active ของคุณ»
- คำเตือนว่า «ลายเซ็นของคุณพิสูจน์ต่อทุกคนที่เห็นว่า @USERNAME ได้ลงนามข้อความนี้ทุกตัวอักษร โปรดลงนามเฉพาะข้อความที่คุณเข้าใจ»
- **ลงนาม** และ **ยกเลิก** บัญชีที่ล็อกอยู่จะขอรหัสผ่านก่อน

[คำขอลงนามข้อความ](/docs/signing#message-requests) อธิบายหน้าจอนี้สำหรับผู้ใช้

## callback ของคุณได้รับอะไร {#callback}

เมื่อผู้ใช้เลือก **ลงนาม** Hivesigner จะส่งเขาไปยัง callback ของคุณพร้อมพารามิเตอร์คำค้นเหล่านี้

| พารามิเตอร์ | ค่า |
| --- | --- |
| `signature` | ลายเซ็น เป็นสตริงฐานสิบหก 130 อักขระ |
| `public_key` | คีย์สาธารณะของคีย์ที่ลงนาม เช่น `STM...` |
| `username` | บัญชีที่ลงนาม |
| `authority` | `posting` หรือ `active` |
| `state` | ค่า `state` ของคุณ เมื่อคำขอมีค่านั้น (รวมถึงค่าว่าง) |

Hivesigner เติมค่าเหล่านี้ลงในสตริงคำค้นของ callback ของคุณ ต่อท้าย `?` หรือ `&` และวางไว้ก่อน `#fragment` ใด ๆ ส่วนคำค้นของคุณเองยังคงอยู่ตามเดิม

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

เมื่อผู้ใช้เลือก **ยกเลิก** Hivesigner จะเปิดรายการบัญชีของเขา callback ของคุณจะไม่ได้รับอะไรเลย

> **คำเตือน:** ใครก็เปิด callback ของคุณพร้อมค่าที่แต่งขึ้นได้ ให้ถือว่าทุกพารามิเตอร์เป็นเพียงคำกล่าวอ้าง จนกว่าเซิร์ฟเวอร์ของคุณจะตรวจลายเซ็นแล้ว

## ตรวจสอบลายเซ็น {#verify}

ตรวจลายเซ็นบนเซิร์ฟเวอร์ของคุณ

1. เก็บข้อความที่คุณขอไว้บนเซิร์ฟเวอร์ของคุณ พร้อมกับ `state` ของมัน อย่าเชื่อสำเนาที่ย้อนกลับมาจากเบราว์เซอร์
2. แฮชข้อความ ด้วย sha256 บนไบต์ UTF-8 ของมัน
3. กู้คีย์สาธารณะจากลายเซ็นกับแฮชนั้น
4. โหลดบัญชีจาก Hive แล้วตรวจว่าคีย์ที่กู้มานั้นอยู่ในสิทธิ์ที่คุณขอไว้ และมีน้ำหนักพอที่จะลงนามได้ตามลำพัง
5. ตรวจว่า `state` เป็นค่าที่คุณออกไป และรับข้อความแต่ละข้อความเพียงครั้งเดียว

ตัวอย่างนี้ใช้ dhive (https://www.npmjs.com/package/@hiveio/dhive)

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

การตรวจแบบเดียวกันใช้ได้กับลายเซ็นจาก `requestSignBuffer` ของ Hive Keychain ให้เทียบกับคีย์ที่คุณกู้มา ส่วน `public_key` ใน callback เป็นเพียงคำใบ้เท่านั้น

## ข้อความที่ Hivesigner ไม่ลงนาม {#refused-messages}

ข้อความที่เป็นอ็อบเจ็กต์ JSON ซึ่งมีคีย์ `signed_message` มีรูปร่างเหมือนโทเค็นของ Hivesigner การลงนามให้จะเท่ากับมอบสิทธิ์เข้าถึงบัญชีของผู้ใช้แก่ผู้ขอ Hivesigner จึงไม่ลงนามข้อความเช่นนั้นเลย มันบอกผู้ใช้ว่า «ข้อความนี้เป็นโทเค็นของ Hivesigner การลงนามจะทำให้เว็บไซต์เข้าถึงบัญชีของคุณได้ จึงลงนามไม่ได้»

ให้ใช้ข้อความธรรมดา หรือ JSON ที่ไม่มีคีย์ `signed_message` บอกให้ชัดว่าลายเซ็นนี้ใช้ทำอะไร และเติมค่าที่คุณสร้างขึ้นครั้งเดียวลงไป เช่น

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## เครื่องมือลงนามข้อความ {#sign-message-tool}

ผู้ใช้ยังลงนามข้อความด้วยตนเองได้ที่ https://hivesigner.com/signmessage (**ลงนามข้อความ**) และตรวจสอบข้อความได้ที่ https://hivesigner.com/verifymessage (**ตรวจสอบข้อความ**) ดู [ลงนามข้อความด้วยตนเอง](/docs/signing#sign-message)

เครื่องมือนั้นลงนามต่างจาก `/sign-buffer` มันลงนามเนื้อหาโทเค็นของ Hivesigner ที่บรรจุข้อความ บัญชี และเวลาไว้ แล้วแบ่งปันผลลัพธ์เป็น **โทเค็นยืนยัน** ให้ตรวจโทเค็นเช่นนั้นบนหน้า **ตรวจสอบข้อความ** หรือตามที่อธิบายไว้ใน [ตรวจด้วยตนเอง](/docs/tokens#check-it-yourself) ไม่ใช่ด้วยโค้ดข้างบน
