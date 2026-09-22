API ของ Hivesigner อยู่ที่ `https://hivesigner.com/api/` มันคืนบัญชีของผู้ที่เข้าสู่ระบบ กระจายการดำเนินการฝั่ง posting แทนเขา แลกโค้ดเป็นโทเค็น และแสดงรายการแอปที่ใช้ Hivesigner หน้านี้อธิบายแต่ละปลายทางพร้อมคำขอ คำตอบ และข้อผิดพลาด

## คำขอและการยืนยันตัวตน {#authentication}

- **URL ฐาน:** `https://hivesigner.com/api/` ทุกปลายทางด้านล่างเป็นเส้นทางสัมพัทธ์กับ `https://hivesigner.com`
- **โทเค็น:** ส่งไปตามเดิมในเฮดเดอร์ `Authorization` เป็น `Authorization: ACCESS_TOKEN` และรับคำนำหน้า `Bearer ` ด้วย คุณจะส่งเป็น `access_token` ในสตริงคำค้นหรือในเนื้อหาก็ได้ แต่เฮดเดอร์ช่วยไม่ให้โทเค็นไปอยู่ใน URL และในล็อก
- **เนื้อหา:** JSON พร้อม `Content-Type: application/json` หรือฟอร์ม (`application/x-www-form-urlencoded`)
- **คำตอบ:** JSON
- **เบราว์เซอร์:** API อนุญาตคำขอข้ามต้นทาง เว็บแอปจึงเรียกได้โดยตรง

วิธีได้โทเค็น ดู [เข้าสู่ระบบด้วย OAuth2](/docs/oauth2) ส่วนสิ่งที่อยู่ในโทเค็น ดู [โทเค็น](/docs/tokens)

## ข้อผิดพลาด {#errors}

คำตอบที่เป็นข้อผิดพลาดมีสถานะข้อผิดพลาดของ HTTP และเนื้อหาแบบนี้

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| สถานะ | `error` | เมื่อใด |
| --- | --- | --- |
| 401 | `invalid_grant` | ไม่มีโทเค็นหรือโทเค็นไม่ถูกต้อง หรือเป็นชนิดที่ไม่ตรงกับปลายทางนี้ («The token has invalid role») ที่ `/api/oauth2/token` ยังมี «The code or secret is not valid» ด้วย |
| 401 | `invalid_scope` | `/api/broadcast`: การดำเนินการที่โทเค็นไม่อนุญาต คำอธิบายจะระบุชื่อการดำเนินการนั้น |
| 401 | `unauthorized_client` | `/api/broadcast`: การดำเนินการที่ผู้เขียนไม่ใช่ผู้ใช้ของโทเค็น, `account_update2` ที่ไปแตะคีย์, ไม่มีการให้สิทธิ์ posting หรือโหลดบัญชีไม่สำเร็จ คำอธิบายจะบอกว่าเป็นกรณีใด |
| 500 | `server_error` | `/api/broadcast`: เครือข่าย Hive ปฏิเสธธุรกรรม `error_description` จะมีข้อความจากเครือข่าย |
| 503 | `unavailable` | `/api/apps`: ไดเรกทอรียังสร้างไม่เสร็จ |

## GET /api/me {#me}

คืนบัญชีที่โทเค็นเป็นของเขา ใช้เพื่อรู้ว่าใครเข้าสู่ระบบ หรือเพื่อ [ตรวจสอบโทเค็น](/docs/tokens#check-with-the-api)

- **เมธอด:** `GET` หรือ `POST`
- **โทเค็น:** โทเค็นการเข้าถึง รวมถึงโทเค็น `login` ที่ระบุแอป

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

คำตอบแบบย่อ

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

| ฟิลด์ | ความหมาย |
| --- | --- |
| `user` | ชื่อผู้ใช้ Hive ที่โทเค็นเป็นของเขา `_id` และ `name` ก็เป็นค่าเดียวกัน |
| `account` | บัญชีทั้งหมด ตามที่ `condenser_api.get_accounts` ของ Hive คืนมา |
| `scope` | สิ่งที่โทเค็นอนุญาต: `["login"]` สำหรับโทเค็นเข้าสู่ระบบ ไม่เช่นนั้นก็เป็นการดำเนินการที่ `/api/broadcast` รับ |
| `user_metadata` | เมตะดาต้าโปรไฟล์ของบัญชี อ่านมาจาก JSON |

`/api/me` ไม่บอกว่าโทเค็นถูกสร้างเพื่อแอปใด หากต้องการตรวจสิ่งนั้น ให้ถอดรหัสโทเค็น ดู [ถาม API](/docs/tokens#check-with-the-api)

## POST /api/broadcast {#broadcast}

ลงนามการดำเนินการฝั่ง posting ของผู้ใช้ในโทเค็นด้วยคีย์ posting ของ @hivesigner แล้วกระจายเข้าเครือข่าย Hive

- **เมธอด:** `POST`
- **โทเค็น:** โทเค็นการเข้าถึงชนิด `posting` จากโฟลว์แบบโทเค็นหรือโฟลว์แบบโค้ด
- **สิ่งที่ต้องมีก่อน:** ผู้ใช้ได้ให้สิทธิ์ posting แก่บัญชีแอปของคุณแล้ว (หน้าจอยินยอมทำให้) และบัญชีแอปของคุณได้ [ให้สิทธิ์ posting แก่ @hivesigner](/docs/register-app#grant-hivesigner) แล้ว
- **เนื้อหา:** `{ "operations": [...] }` โดยแต่ละการดำเนินการเป็น `[name, fields]` เหมือนบนบล็อกเชน Hive การดำเนินการทั้งหมดในคำขอเดียวจะรวมอยู่ในธุรกรรมเดียว

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

คำขอเดียวกันด้วย curl

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

การติดตามเป็นการดำเนินการ `custom_json`

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

API ตอบทันทีที่โหนด Hive รับธุรกรรมแล้ว `result.id` คือรหัสธุรกรรม

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

เมื่อเครือข่ายปฏิเสธธุรกรรม คำตอบจะเป็น `500` พร้อม `server_error` โดย `error_description` มีข้อความจากเครือข่าย และ `response` มีข้อผิดพลาดดิบ

### broadcast รับอะไรบ้าง {#broadcast-rules}

โทเค็น posting ให้ API กระจายการดำเนินการเหล่านี้เท่านั้น ในแต่ละรายการ ผู้ใช้ของโทเค็นต้องเป็นบัญชีในฟิลด์ที่ระบุ

| การดำเนินการ | ผู้ใช้ของโทเค็นต้องเป็น |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | บัญชีแรกใน `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **การดำเนินการอื่นใด** ถูกปฏิเสธด้วย `invalid_scope` และโทเค็น `login` ไม่อนุญาตการดำเนินการใดเลย
- **การดำเนินการเพื่อบัญชีอื่น** ถูกปฏิเสธด้วย `unauthorized_client` โทเค็นกระจายได้เฉพาะแทนผู้ใช้ของตนเท่านั้น
- **`account_update2`** เปลี่ยนได้เพียงเมตะดาต้าของบัญชี การดำเนินการที่มีฟิลด์ `owner`, `active` หรือ `posting` จะถูกปฏิเสธด้วย `unauthorized_client`
- **`custom_json`**: ให้ปล่อย `required_auths` ว่างไว้ API ลงนามด้วยสิทธิ์ posting การดำเนินการที่ต้องใช้สิทธิ์ active จึงล้มเหลวบนเครือข่าย

การโอนและการดำเนินการกระเป๋าเงินอื่น ๆ ต้องใช้คีย์ active ของผู้ใช้ ให้ส่งเป็น [ลิงก์ลงนาม](/docs/sign-links) แทน

## POST /api/oauth2/token {#oauth2-token}

แลกโค้ดเป็นโทเค็น หรือแลกโทเค็นรีเฟรชเป็นโทเค็นชุดใหม่ ให้เรียกจากเซิร์ฟเวอร์ของคุณเท่านั้น ดู [โฟลว์แบบโค้ด](/docs/oauth2#code-flow)

- **เมธอด:** `POST` โดยใส่ค่าไว้ในเนื้อหา
- **เนื้อหา:** `code` กับ `client_secret` หรือ `refresh_token` กับ `client_secret`
- **เฮดเดอร์:** อย่าส่งเฮดเดอร์ `Authorization`

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

ทุกครั้งที่เรียกจะได้โทเค็นการเข้าถึงใหม่และโทเค็นรีเฟรชใหม่ ทั้งคู่ลงนามโดย @hivesigner ส่วน `expires_in` คืออายุของโทเค็นการเข้าถึงเป็นวินาที (7 วัน)

ข้อผิดพลาด: `401 invalid_grant` คำอธิบายจะเป็น «The token has invalid role» เมื่อค่าที่ส่งมาไม่ใช่โค้ดหรือโทเค็นรีเฟรชที่ถูกต้อง และจะเป็น «The code or secret is not valid» เมื่อโค้ดหรือซีเคร็ตไม่ตรงกัน

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

บอก Hivesigner ว่าผู้ใช้ออกจากแอปของคุณแล้ว ส่วนโทเค็นนั้นแอปของคุณทิ้งเอง

- **เมธอด:** `POST`
- **โทเค็น:** โทเค็นการเข้าถึง ในเฮดเดอร์ `Authorization`

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

`revokeToken()` ของ JavaScript SDK เรียกคำสั่งนี้แล้วลืมโทเค็นทิ้ง ส่วนการถอนสิทธิ์ของแอปคุณอย่างถาวรนั้น ผู้ใช้ทำเองที่ https://hivesigner.com/authorized-apps ดู [ออกจากระบบและถอนสิทธิ์](/docs/tokens#sign-out)

## GET /api/apps {#apps}

ไดเรกทอรีแอปสาธารณะ รวมแอปที่กระจายธุรกรรมผ่าน Hivesigner เรียงตามจำนวนผู้ใช้ ไม่ต้องใช้โทเค็น และ https://hivesigner.com/apps ก็แสดงรายการเดียวกัน

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

| ฟิลด์ | ความหมาย |
| --- | --- |
| `updated_at` | ไดเรกทอรีถูกสร้างครั้งล่าสุดเมื่อใด |
| `building` | เป็น `true` จนกว่าการสร้างครั้งแรกจะมีข้อมูล ระหว่างนั้น `apps` จะว่าง |
| `window_days` | จำนวนวันที่การจัดอันดับครอบคลุม |
| `featured` | ชื่อผู้ใช้ที่แสดงก่อน ตามลำดับนั้น |
| `apps[].username` | บัญชีของแอป |
| `apps[].name`, `about` | มาจากโปรไฟล์ของบัญชีแอป หรือเป็น `null` |
| `apps[].website` | เว็บไซต์จากโปรไฟล์ เมื่อเว็บไซต์นั้นตอบบนโดเมนของตนเอง ไม่เช่นนั้นเป็น `null` |
| `apps[].site` | ผลการตรวจเว็บไซต์: `ok`, `no_website`, `invalid`, `redirected`, `blocked` หรือ `unreachable` รายการที่เป็น `redirected` จะมี `redirects_to` ด้วย |
| `apps[].users` | จำนวนผู้ใช้ที่ไม่ซ้ำต่อวัน รวมตลอดช่วงเวลา |
| `apps[].requests` | คำขอ API ที่สำเร็จซึ่งทำเพื่อแอปนั้นในช่วงเวลาดังกล่าว |
| `apps[].first_seen`, `last_seen` | วันแรกที่ Hivesigner บันทึกแอปนั้น และวันล่าสุดที่มีการใช้งาน หรือเป็น `null` |
| `apps[].new` | เป็น `true` เมื่อแอปปรากฏครั้งแรกภายในช่วงเวลานั้น |

คำตอบอาจถูกแคชไว้ได้ถึง 5 นาที ก่อนที่ไดเรกทอรีจะถูกสร้างครั้งแรก API จะตอบ `503` พร้อม `unavailable` ให้ลองใหม่ภายหลัง

ชื่อและคำอธิบายเผยแพร่โดยบัญชีแอปแต่ละบัญชีเอง Hivesigner ไม่ได้ตรวจสอบรายการใดเลย
