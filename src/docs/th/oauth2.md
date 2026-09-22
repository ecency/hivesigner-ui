ส่งผู้คนไปที่ Hivesigner เพื่อเข้าสู่ระบบแอปของคุณ พวกเขาตรวจดูคำขอของคุณที่นั่นแล้วอนุมัติ จากนั้น Hivesigner ส่งพวกเขากลับมาที่ callback ของคุณพร้อมโทเค็น (โฟลว์แบบโทเค็น) หรือพร้อมโค้ดที่เซิร์ฟเวอร์ของคุณนำไปแลกเป็นโทเค็น (โฟลว์แบบโค้ด) หน้านี้ครอบคลุมทั้งสองโฟลว์ พารามิเตอร์ทุกตัว และขอบเขตสิทธิ์

## ก่อนเริ่ม {#before-you-start}

- ลงทะเบียนแอปของคุณ: มีบัญชี Hive สำหรับแอป พร้อมใส่รายการ callback ไว้ ดู [ลงทะเบียนแอปของคุณ](/docs/register-app)
- หากต้องการกระจายธุรกรรมผ่าน API บัญชีแอปของคุณยังต้อง [ให้สิทธิ์ posting แก่ @hivesigner](/docs/register-app#grant-hivesigner) ด้วย
- สำหรับโฟลว์แบบโค้ด ให้ตั้ง [ไคลเอ็นต์ซีเคร็ต](/docs/register-app#client-secret)

## URL อนุญาต {#authorize-url}

ส่งผู้ใช้ไปที่ที่อยู่นี้

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

เข้ารหัสทุกค่าให้เหมาะกับ URL `URLSearchParams` ทำให้คุณได้

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

### พารามิเตอร์ {#parameters}

| พารามิเตอร์ | จำเป็น | ทำอะไร |
| --- | --- | --- |
| `client_id` | ใช่ สำหรับแอป | ชื่อบัญชีแอปของคุณ และระบบอ่าน `clientId` ด้วย หากไม่มี คำขอจะกลายเป็นคำขอเข้าสู่ระบบอย่างเดียวจากเว็บไซต์ที่ไม่มีบัญชีแอป ดู [เข้าสู่ระบบโดยไม่มีสิทธิ์ posting](/docs/login-only) |
| `redirect_uri` | ใช่ | ที่ที่ Hivesigner จะส่งผู้ใช้กลับไป ต้องตรงกับ URI สำหรับเปลี่ยนเส้นทางของแอปคุณอย่างใดอย่างหนึ่งพอดี ดู [callback](/docs/register-app#callbacks) |
| `scope` | ไม่ | `login`, `posting` หรือ `offline` ดู [ขอบเขตสิทธิ์](#scopes) หากไม่มี คำขอจะขอสิทธิ์ posting |
| `response_type` | ไม่ | ค่า `code` เริ่ม [โฟลว์แบบโค้ด](#code-flow) ค่าอื่นหรือไม่ใส่เลยหมายถึง [โฟลว์แบบโทเค็น](#token-flow) |
| `state` | แนะนำ | ค่าสุ่มที่ Hivesigner ส่งกลับมาโดยไม่เปลี่ยนแปลง ดู [ป้องกันคำขอด้วย state](#state) |
| `account` | ไม่ | ชื่อผู้ใช้ Hive เมื่อบัญชีนั้นอยู่บนอุปกรณ์ของผู้ใช้ Hivesigner จะเลือกให้ ถ้าไม่มีก็ไม่สนใจ และระบบอ่าน `select_account` ด้วย |

ผู้ใช้ยังสลับไปบัญชีอื่นบนหน้าจอยินยอมได้ ให้เอาบัญชีจากโทเค็นหรือจากการแลกโค้ดเสมอ อย่าเอาจากสิ่งที่คุณขอไป

## ขอบเขตสิทธิ์ {#scopes}

Hive มีสิทธิ์ posting เพียงชุดเดียว Hivesigner จึงมีระดับการเข้าถึงสองระดับ คือเข้าสู่ระบบอย่างเดียวกับ posting และไม่มีอะไรละเอียดกว่านั้นคั่นกลาง

| `scope` | สิ่งที่ผู้ใช้อนุมัติ | โฟลว์ | `type` ของโทเค็นการเข้าถึง |
| --- | --- | --- | --- |
| `login` | «ดูชื่อผู้ใช้ของบัญชีคุณ» ไม่มีการให้สิทธิ์ใด | โฟลว์แบบโทเค็น (อย่าใส่ `response_type=code`) | `login` |
| `posting` | สิทธิ์ posting ครั้งแรกจะเพิ่มบัญชีแอปของคุณเข้าไปในสิทธิ์ posting ของผู้ใช้ | โฟลว์แบบโทเค็น หรือโฟลว์แบบโค้ดพร้อม `response_type=code` | `posting` |
| `offline` | สิทธิ์ posting เช่นเดียวกับด้านบน | โฟลว์แบบโค้ด | `posting` พร้อมโทเค็น `refresh` |

ในโฟลว์แบบโค้ด callback จะได้รับโค้ดก่อน (โทเค็นที่ `type` เป็น `code`) ซึ่งเซิร์ฟเวอร์ของคุณนำไปแลกเป็นโทเค็นการเข้าถึง

- **ไม่ระบุขอบเขต** หมายถึง `posting`
- **ค่าที่มีคำว่า `offline`** อยู่ตรงไหนก็ตาม หมายถึง `offline` เช่นค่าเดิมอย่าง `offline,vote,comment`
- **ค่าอื่นใด** หมายถึง `posting` รวมถึงชื่อการดำเนินการแบบเก่าอย่าง `vote`, `comment`, `vote,comment`, `comment_options` หรือ `custom_json` ค่าเหล่านี้ไม่จำกัดโทเค็น เพราะโทเค็น posting ทุกอันอนุญาตการดำเนินการชุดเดียวกัน ดู [broadcast รับอะไรบ้าง](/docs/api#broadcast-rules)

ขอ `login` เมื่อแอปของคุณต้องการรู้เพียงว่าผู้ใช้เป็นใคร ดู [เข้าสู่ระบบโดยไม่มีสิทธิ์ posting](/docs/login-only)

## โฟลว์แบบโทเค็น {#token-flow}

เบราว์เซอร์ของผู้ใช้ได้รับโทเค็นการเข้าถึงโดยตรง แอปของคุณไม่ต้องใช้ซีเคร็ตใด

1. ส่งผู้ใช้ไปยัง URL อนุญาต

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. ผู้ใช้อนุมัติ Hivesigner เปลี่ยนเส้นทางไปยัง callback ของคุณ

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner เติมพารามิเตอร์ของตนด้วย `?` เมื่อ callback ของคุณไม่มีสตริงคำค้น และด้วย `&` เมื่อมี ส่วน `state` จะมีก็ต่อเมื่อคุณส่งค่าที่ไม่ว่างไป

3. ที่ callback ของคุณ ให้ [เทียบ `state`](#state) ก่อน แล้วจึง [ตรวจสอบโทเค็น](/docs/tokens#check-a-token) บนเซิร์ฟเวอร์ของคุณ บัญชีที่โทเค็นเป็นของเขาอยู่ในตัวโทเค็นเอง อย่าพึ่งพาพารามิเตอร์ `username` เพียงอย่างเดียว เพราะใครก็แก้ URL ได้
4. เก็บโทเค็นไว้บนเซิร์ฟเวอร์ของคุณหรือในคุกกี้ httpOnly แล้วเปลี่ยนเส้นทางไป URL ที่สะอาด เพื่อให้โทเค็นหายไปจากแถบที่อยู่
5. ใช้โทเค็นกับ [API](/docs/api) จนกว่ามันจะหมดอายุหลัง `expires_in` วินาที (7 วัน) แล้วส่งผู้ใช้ไปยัง URL อนุญาตอีกครั้ง คนที่เคยให้สิทธิ์ posting แล้วจะเห็น «เข้าสู่ระบบ APP» และ «คุณเคยอนุญาต @myapp แล้ว จะไม่มีการให้สิทธิ์ใหม่เพิ่ม»

## โฟลว์แบบโค้ด {#code-flow}

เซิร์ฟเวอร์ของคุณได้รับโค้ดแล้วนำไปแลกเป็นโทเค็นการเข้าถึงและโทเค็นรีเฟรช หลังจากนั้นก็ต่ออายุได้เองโดยไม่ต้องมีผู้ใช้ ใช้วิธีนี้เมื่อเซิร์ฟเวอร์ของคุณทำงานแทนผู้ใช้เป็นเวลานาน

1. ส่งผู้ใช้ไปยัง URL อนุญาตพร้อม `scope=offline`

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` ให้ผลเหมือนกัน

2. ผู้ใช้อนุมัติสิทธิ์ posting Hivesigner เปลี่ยนเส้นทางไปยัง callback ของคุณ

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [เทียบ `state`](#state) แล้วแลกโค้ดทันทีจากเซิร์ฟเวอร์ของคุณ

### แลกโค้ด {#exchange-code}

ส่งโค้ดและไคลเอ็นต์ซีเคร็ตของคุณไปยัง `/api/oauth2/token` ในเนื้อหาของคำขอ POST

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

คำตอบ

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

การเรียกแบบเดียวกันใน Node.js 18 ขึ้นไป

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

- ใส่โค้ดและซีเคร็ตไว้ในเนื้อหาของคำขอ อย่าใส่ใน URL
- อย่าส่งเฮดเดอร์ `Authorization` มากับคำขอนี้
- ใช้ `username` จากคำตอบนี้ ค่านี้มาจากโค้ดที่ผู้ใช้ลงนาม
- เก็บโทเค็นการเข้าถึงและโทเค็นรีเฟรชไว้บนเซิร์ฟเวอร์ของคุณ

### รีเฟรช {#refresh}

เมื่อโทเค็นการเข้าถึงหมดอายุ ให้ส่งโทเค็นรีเฟรชพร้อมไคลเอ็นต์ซีเคร็ตของคุณไปยังปลายทางเดิม

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

คำตอบมีรูปแบบเดิม พร้อมโทเค็นการเข้าถึงใหม่และโทเค็นรีเฟรชใหม่ ให้เก็บทั้งสองแทนของเดิม

## ป้องกันคำขอด้วย state {#state}

หากไม่มี `state` เว็บไซต์อื่นอาจส่งผู้ใช้ของคุณมาที่ callback ของคุณพร้อมโทเค็นหรือโค้ดที่มันเลือกเอง แอปของคุณก็จะพาผู้ใช้เข้าสู่ระบบบัญชีของคนอื่น `state` ผูกการกลับมาทุกครั้งเข้ากับเบราว์เซอร์ที่เริ่มการเข้าสู่ระบบ

1. สร้างค่าสุ่มสำหรับการเข้าสู่ระบบแต่ละครั้ง อย่างน้อย 16 ไบต์สุ่ม เลขฐานสิบหกช่วยให้ค่านี้ไม่มีอักขระที่ต้องเข้ารหัส
2. เก็บไว้ในที่ที่มีเพียงเบราว์เซอร์นี้เท่านั้นที่แสดงกลับมาได้ เช่นเซสชันของเซิร์ฟเวอร์ หรือคุกกี้อายุสั้นแบบ httpOnly และ Secure ที่ตั้ง `SameSite=Lax`
3. ส่งค่านั้นเป็น `state` ใน URL อนุญาต
4. ที่ callback ของคุณ ให้เทียบพารามิเตอร์ `state` กับค่าที่เก็บไว้ ถ้าไม่มีหรือไม่ตรงกัน ให้หยุด อย่าใช้ทั้งโทเค็นและโค้ด
5. ลบค่าที่เก็บไว้ เพื่อให้แต่ละค่าใช้ได้เพียงครั้งเดียว

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

Hivesigner ส่งค่า `state` กลับมาเหมือนที่ได้รับไป ส่วนค่าว่างจะถูกละไว้

## ผู้ใช้เห็นอะไร {#what-the-user-sees}

หน้าจอยินยอมแสดงรูปและชื่อแอปของคุณ «บัญชี Hive @myapp» และ «จะพาคุณไปที่ HOST» โดย HOST มาจาก callback ของคุณ จากนั้น

- **คำขอ posting ครั้งแรก** หัวข้อเขียนว่า «APP กำลังขอสิทธิ์เข้าถึงบัญชีของคุณ» การ์ด **ขอบเขต** แสดงรายการสิ่งที่แอปของคุณจะทำได้ ประกาศหนึ่งเขียนว่า «การอนุญาตครั้งแรก: การดำเนินการนี้จะเพิ่ม @myapp ลงในสิทธิ์ posting ของคุณบนเชน และต้องใช้คีย์ active ของคุณหนึ่งครั้ง บัญชีดังกล่าวจะสามารถโพสต์ในนามของคุณได้จนกว่าคุณจะเพิกถอนสิทธิ์» ปุ่มเขียนว่า **อนุญาต** เมื่ออุปกรณ์ของผู้ใช้ไม่มีคีย์ active ของบัญชีนั้น หน้าจอจะขอคีย์ตรงนั้นเลย
- **เข้าสู่ระบบ** สำหรับ `scope=login` หรือสำหรับสิทธิ์ posting ที่ผู้ใช้เคยให้ไว้แล้ว หัวข้อเขียนว่า «เข้าสู่ระบบ APP» และปุ่มเขียนว่า **เข้าสู่ระบบ**
- **บัญชี** «อนุญาตในนาม» หรือ «เข้าสู่ระบบในนาม» ตามด้วยบัญชีที่เลือกไว้ ผู้ใช้เปลี่ยนบัญชีได้ตรงนี้
- **บัญชีที่ล็อกอยู่** เหนือปุ่มจะมีช่องรหัสผ่าน คลิกครั้งเดียวก็ปลดล็อกบัญชีและไปต่อ
- **ไม่มีบัญชีบนอุปกรณ์** ปุ่มเขียนว่า **ดำเนินการต่อ** ปุ่มนี้เปิดแบบฟอร์มเพิ่มบัญชี แล้วพากลับมาที่คำขอ

หลังคำขอ posting ครั้งแรก Hivesigner จะรอจนการให้สิทธิ์ใหม่ปรากฏบนเชนก่อนจึงเปลี่ยนเส้นทาง ซึ่งอาจใช้เวลาไม่กี่วินาที หากต้องการดูหน้าจอทั้งหมดจากฝั่งผู้ใช้ ดู [เข้าสู่ระบบแอป](/docs/signing-in)

## การยกเลิกและคำขอที่ถูกปฏิเสธ {#cancel}

- **การยกเลิก** ผู้ใช้จะไปยังรายการบัญชีของตนใน Hivesigner ไม่มีอะไรถูกส่งไปยัง callback ของคุณ และไม่มีพารามิเตอร์ข้อผิดพลาดใด ให้เปิดปุ่มเข้าสู่ระบบของคุณไว้เพื่อให้ผู้ใช้เริ่มใหม่ได้ และอย่ารอการกลับมา
- **คำขอที่ถูกปฏิเสธ** callback ที่ไม่ได้ลงทะเบียน `client_id` ที่ไม่รู้จัก หรือ `redirect_uri` ที่ขาดหายไป จะทำให้ Hivesigner แสดงข้อผิดพลาดพร้อมปุ่ม **รายงานปัญหานี้** และไม่มีอะไรถูกส่งไปยัง callback ของคุณ ดู [ผู้ใช้เห็นอะไรเมื่อมีบางอย่างผิดพลาด](/docs/register-app#refused-requests)

## URL คำขอเข้าสู่ระบบแบบเดิม {#legacy-login-request}

Hivesigner ยังรับ URL เข้าสู่ระบบแบบเก่าอยู่ ซึ่งเก็บไว้เพื่อการเชื่อมต่อในอดีต สำหรับงานใหม่ให้ใช้ `/oauth2/authorize`

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

มันเปิดหน้าจอยินยอมเดียวกัน ด้วยการตรวจ callback แบบเดียวกันและการเปลี่ยนเส้นทางแบบเดียวกัน แต่อ่านพารามิเตอร์ต่างออกไป

- `scope` เป็น `login` หรือ `posting` ค่าอื่นหรือไม่ใส่เลยหมายถึง `login`
- ไม่อ่าน `offline` สำหรับโฟลว์แบบโค้ดให้เติม `response_type=code`
- ไม่อ่าน `account`

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` ใช้กฎชุดเดียวกัน
