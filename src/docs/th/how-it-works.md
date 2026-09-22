Hivesigner ให้ผู้คนใช้บัญชี Hive ของตนในแอปของคุณได้โดยไม่ต้องมอบคีย์ให้แอป Hivesigner มีสองส่วน คือตัวลงนามในเบราว์เซอร์ที่ https://hivesigner.com และ API ที่ `https://hivesigner.com/api/` หน้านี้อธิบายว่าแต่ละส่วนทำอะไร และแอปใช้งานทั้งสองส่วนด้วยวิธีใดได้บ้าง

## ตัวลงนามในเบราว์เซอร์ {#browser-signer}

ตัวลงนามในเบราว์เซอร์ก็คือเว็บไซต์ Hivesigner นั่นเอง ผู้คนเพิ่มบัญชี Hive ของตนไว้ที่นั่น คีย์ของพวกเขาอยู่ในเบราว์เซอร์ของตัวเอง Hivesigner ไม่ได้ส่งคีย์ใดไปยังเซิร์ฟเวอร์ใดเลย และแอปของคุณก็ไม่เคยเห็นคีย์เหล่านั้น

ตัวลงนามลงนามสามสิ่ง และทุกครั้งจะลงนามหลังจากที่ผู้ใช้ได้เห็นแล้วว่ากำลังลงนามอะไร

- **โทเค็นเข้าสู่ระบบ** แอปของคุณส่งคนไปที่ Hivesigner เพื่อเข้าสู่ระบบ Hivesigner แสดงชื่อแอปของคุณและสิ่งที่แอปขอ เมื่อผู้ใช้อนุมัติ Hivesigner จะลงนามข้อความสั้น ๆ ด้วยคีย์ของผู้ใช้ ซึ่งระบุบัญชีของผู้ใช้และแอปของคุณ ข้อความที่ลงนามแล้วนั้นคือโทเค็นที่แอปของคุณได้รับ ดู [เข้าสู่ระบบด้วย OAuth2](/docs/oauth2) และ [โทเค็น](/docs/tokens)
- **ธุรกรรม** ลิงก์ลงนามจะเปิดธุรกรรมให้ตรวจสอบ เมื่อผู้ใช้อนุมัติ Hivesigner จะลงนามด้วยคีย์ที่ธุรกรรมนั้นต้องใช้ จากนั้นส่งเข้าเครือข่าย Hive จากเบราว์เซอร์ เว้นแต่ลิงก์จะขอเพียงลายเซ็น ดู [ลิงก์ลงนาม](/docs/sign-links)
- **ข้อความ** แอปของคุณสามารถขอให้ผู้ใช้ลงนามข้อความด้วยคีย์ของตน เพื่อพิสูจน์ว่าเขาควบคุมบัญชีนั้น ดู [การลงนามข้อความ](/docs/message-signing)

## API {#api}

API จะกระจายการดำเนินการฝั่ง posting แทนผู้ที่เข้าสู่ระบบแอปของคุณ ได้แก่ โพสต์และความคิดเห็น โหวต การติดตามและการดำเนินการ `custom_json` อื่น ๆ การรับรางวัล และการแก้ไขโปรไฟล์ แอปของคุณส่งการดำเนินการไปพร้อมกับโทเค็นของผู้ใช้ API ตรวจสอบโทเค็น ลงนามธุรกรรมด้วยคีย์ posting ของบัญชี @hivesigner แล้วกระจายเข้าเครือข่าย Hive

API ยังคืนบัญชีของผู้ที่เข้าสู่ระบบ แลกโค้ดเป็นโทเค็น และแสดงรายการแอปที่ใช้ Hivesigner ดู [REST API](/docs/api)

## สายของสิทธิ์ posting {#authority-chain}

บน Hive บัญชีหนึ่งสามารถให้อีกบัญชีหนึ่งทำงานด้วยสิทธิ์ posting ของตนได้ API อาศัยการให้สิทธิ์สองอย่างนี้

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **ผู้ใช้เพิ่มบัญชีแอปของคุณเข้าไปในสิทธิ์ posting ของตน** หน้าจอยินยอมทำสิ่งนี้ในครั้งแรกที่มีคนอนุมัติสิทธิ์ posting ให้แอปของคุณ ซึ่งต้องใช้คีย์ active ของผู้ใช้หนึ่งครั้ง
2. **บัญชีแอปของคุณเพิ่ม @hivesigner เข้าไปในสิทธิ์ posting ของตน** สิ่งนี้คุณทำครั้งเดียว ตอน [ลงทะเบียนแอป](/docs/register-app#grant-hivesigner)

ก่อนกระจายธุรกรรม API จะตรวจว่ามีการให้สิทธิ์ทั้งสองอย่างครบ และจะกระจายเฉพาะการดำเนินการที่ผู้เขียนคือผู้ใช้ที่ระบุไว้ในโทเค็นเท่านั้น

ผู้ใช้ถอนสิทธิ์ของแอปคุณได้ทุกเมื่อที่ https://hivesigner.com/authorized-apps หลังจากนั้น API จะโพสต์แทนเขาผ่านแอปของคุณไม่ได้อีก

## การเชื่อมต่อสองแบบ {#two-ways-to-integrate}

### เข้าสู่ระบบแล้วกระจายผ่าน API {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

ผู้ใช้อนุมัติครั้งเดียว หลังจากนั้นแอปของคุณจะโหวต แสดงความคิดเห็น และโพสต์แทนเขาได้โดยไม่ต้องถามอีก จนกว่าโทเค็นจะหมดอายุหรือผู้ใช้ถอนสิทธิ์ ใช้วิธีนี้กับการกระทำทางสังคมในชีวิตประจำวัน

คุณต้องมีบัญชีแอปที่มี callback ลงทะเบียนไว้ และมีการให้สิทธิ์แก่ @hivesigner ดู [ลงทะเบียนแอปของคุณ](/docs/register-app) ถ้าคุณเพียงต้องการรู้ว่าผู้ใช้คือใคร ดู [เข้าสู่ระบบโดยไม่มีสิทธิ์ posting](/docs/login-only)

### ลิงก์ลงนาม {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

ผู้ใช้เห็นทุกธุรกรรมก่อนที่จะลงนาม ลิงก์ลงนามครอบคลุมการดำเนินการของ Hive ทั้ง 41 รายการ รวมถึงการโอนและการกระทำอื่นในกระเป๋าเงินที่ต้องใช้คีย์ active ซึ่ง API ไม่เคยจัดการให้ ลิงก์ลงนามไม่ต้องใช้บัญชีแอป ดู [ลิงก์ลงนาม](/docs/sign-links)

### ควรเลือกแบบไหน {#which-to-choose}

- **การกระทำฝั่ง posting ที่เกิดบ่อย** (โหวต ความคิดเห็น ติดตาม): ให้ผู้ใช้เข้าสู่ระบบด้วย OAuth2 แล้วใช้ API
- **การกระทำในกระเป๋าเงิน** หรืออะไรก็ตามที่ต้องใช้คีย์ active: ใช้ลิงก์ลงนาม
- **ทั้งสองอย่าง**: หลายแอปให้ผู้ใช้เข้าสู่ระบบด้วย OAuth2 สำหรับฟีเจอร์ทางสังคม และใช้ลิงก์ลงนามสำหรับการโอน
- **แค่ตัวตนของผู้ใช้**: ดู [เข้าสู่ระบบโดยไม่มีสิทธิ์ posting](/docs/login-only)

## ซอร์สโค้ด {#source-code}

Hivesigner เป็นโอเพนซอร์ส

- ตัวลงนามในเบราว์เซอร์: https://github.com/ecency/hivesigner-ui
- API: https://github.com/ecency/hivesigner-api
- JavaScript SDK (แพ็กเกจ npm ชื่อ `hivesigner`): https://github.com/ecency/hivesigner-sdk ดู [SDK](/docs/sdk)
