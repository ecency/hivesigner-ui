โพสต์บน Hive อ้างถึงรูปภาพด้วย URL แอปจึงต้องมีที่สำหรับอัปโหลดรูป imagehoster คือบริการโฮสต์รูปภาพแบบโอเพนซอร์สที่สร้างมาเพื่อ Hive มันรับไฟล์จากผู้ที่เข้าสู่ระบบแอปของคุณด้วย Hivesigner ได้ โดยโทเค็นการเข้าถึงของพวกเขาทำหน้าที่แทนลายเซ็นด้วยคีย์

## ทำงานอย่างไร {#how-it-works}

1. ผู้ใช้เข้าสู่ระบบแอปของคุณด้วย Hivesigner พร้อมสิทธิ์ posting แอปของคุณได้รับโทเค็นการเข้าถึง ดู [เข้าสู่ระบบด้วย OAuth2](/docs/oauth2)
2. แอปของคุณส่งรูปไปยัง imagehoster ของคุณ โดยใส่โทเค็นนั้นไว้ใน URL
3. imagehoster ตรวจโทเค็นและบัญชี เก็บรูปไว้ แล้วตอบกลับด้วย URL ของรูป
4. แอปของคุณนำ URL นั้นไปใส่ในโพสต์

## รัน imagehoster ของคุณเอง {#run-your-own}

imagehoster ตั้งค่าไว้สำหรับบัญชีแอปเพียงบัญชีเดียว คือ `app_account` ในส่วน `[upload_limits]` ของไฟล์ตั้งค่า ให้ส่งโทเค็นที่สร้างขึ้นสำหรับบัญชีแอปนั้นไปให้มัน อินสแตนซ์สาธารณะเป็นของแอปอื่น images.ecency.com ตั้งค่าไว้สำหรับบัญชีแอปของ Ecency ส่วน images.hive.blog สำหรับของ Hive.blog หากต้องการรับไฟล์จากผู้ใช้ของคุณ ให้รันอินสแตนซ์ของคุณเองด้วยบัญชีแอปของคุณ

ซอร์สโค้ดและคู่มือการติดตั้ง

- imagehoster ของชุมชน Hive: https://gitlab.syncad.com/hive/imagehoster
- imagehoster ของ Ecency: https://github.com/ecency/imagehoster

ในไฟล์ตั้งค่า ให้ใส่บัญชีแอปของคุณ

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

ส่วนเดียวกันนี้ยังกำหนดค่าชื่อเสียงขั้นต่ำที่บัญชีต้องมีจึงจะอัปโหลดได้ (`reputation`) และโควตาการอัปโหลดของแต่ละบัญชี (`max` ครั้งต่อ `duration` มิลลิวินาที) ตั้งค่า `redis_url` ด้วย เพื่อให้โควตาถูกบังคับใช้จริง `max_image_size` กำหนดขนาดไฟล์ใหญ่สุด หน่วยเป็นไบต์

## อัปโหลดรูป {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **โทเค็น** ใส่โทเค็นการเข้าถึงของผู้ใช้ไว้ในพาธ ตรงตามที่ Hivesigner มอบให้แอปของคุณ ใช้โทเค็นจากการเข้าสู่ระบบที่มีสิทธิ์ posting สำหรับแอปของคุณ ส่วนโทเค็นสำหรับเข้าสู่ระบบอย่างเดียวซึ่งมาจากคำขอที่ไม่มี `client_id` จะไม่ระบุแอปใดเลยและจะถูกปฏิเสธ
- **เนื้อหา** ส่ง `multipart/form-data` พร้อมไฟล์รูปหนึ่งไฟล์ imagehoster จะหยิบไฟล์แรก ไม่ว่าชื่อฟิลด์จะเป็นอะไร
- **ขนาด** ส่งเฮดเดอร์ `Content-Length` ไฟล์ต้องไม่ใหญ่เกิน `max_image_size` ของอินสแตนซ์นั้น

คำตอบเป็น JSON เมื่อสำเร็จจะมี URL ของรูปอยู่ด้วย

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

เมื่อล้มเหลว imagehoster จะตอบด้วยสถานะข้อผิดพลาดของ HTTP ความล้มเหลวส่วนใหญ่จะมีชื่อข้อผิดพลาดมาด้วย

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **หมายเหตุ:** โทเค็นเดินทางอยู่ใน URL ให้บริการ imagehoster ของคุณผ่าน https เท่านั้น และเก็บบันทึกการเข้าถึงไว้เป็นความลับ

## ตัวอย่าง {#example}

ฟังก์ชันสำหรับเบราว์เซอร์นี้อัปโหลดไฟล์จากช่องเลือกไฟล์หรือจากการลากมาวาง เบราว์เซอร์จะตั้งเฮดเดอร์แบบหลายส่วนและความยาวให้เอง อย่าตั้ง `Content-Type` เอง

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
