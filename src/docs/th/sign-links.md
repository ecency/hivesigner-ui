ลิงก์ลงนามเปิดธุรกรรมของ Hive ขึ้นใน Hivesigner ผู้ใช้ตรวจดู อนุมัติด้วยคีย์ของตนเอง แล้ว Hivesigner กระจายธุรกรรมจากเบราว์เซอร์ของเขา จากนั้น Hivesigner ส่งผู้ใช้กลับมาที่แอปของคุณพร้อมรหัสธุรกรรมได้ ลิงก์ลงนามไม่ต้องใช้บัญชีแอปและไม่ต้องใช้โทเค็น มันครอบคลุมการดำเนินการทั้ง 41 อย่างที่ Hivesigner รองรับ รวมถึงการโอนและการกระทำอื่นที่ต้องใช้คีย์ active

## ลิงก์ลงนามทำงานอย่างไร {#how-it-works}

1. แอปของคุณสร้างลิงก์ที่บรรจุการดำเนินการหนึ่งอย่างหรือมากกว่านั้น
2. ผู้ใช้เปิดลิงก์ Hivesigner แสดงแต่ละการดำเนินการเป็นคำพูดธรรมดาบนหน้าจอ «ยืนยันธุรกรรม» พร้อมคีย์ที่มันต้องใช้
3. ผู้ใช้อนุมัติ Hivesigner ลงนามธุรกรรมในเบราว์เซอร์ด้วยคีย์ของบัญชีที่เลือกไว้ใน Hivesigner แล้วส่งธุรกรรมไปยังเครือข่าย Hive
4. เมื่อลิงก์ระบุ callback ไว้ Hivesigner จะส่งผู้ใช้ไปที่นั่นพร้อมรหัสธุรกรรม

แอปของคุณไม่เคยเห็นคีย์เลย เว็บไซต์ใดก็สร้างลิงก์ลงนามได้ เพราะไม่มี `client_id` ให้ส่ง

## รูปแบบของลิงก์ {#link-forms}

Hivesigner อ่านลิงก์ลงนามสองแบบ คือลิงก์ที่เข้ารหัสและลิงก์แบบเดิม

### ลิงก์ที่เข้ารหัส {#encoded-links}

ลิงก์ที่เข้ารหัสบรรจุการดำเนินการไว้เป็น JSON ซึ่งเข้ารหัสแบบ base64url มันใช้รูปแบบ `hive://sign/...` ของแพ็กเกจ `hive-uri` โดยแทน `hive://` ด้วย `https://hivesigner.com/`

| รูปแบบ | สิ่งที่ `B64U` บรรจุ |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | การดำเนินการหนึ่งอย่าง: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | รายการการดำเนินการ: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | ธุรกรรมทั้งรายการ พร้อมส่วนหัวของมันเอง |

`B64U` คือข้อความ JSON ที่เข้ารหัสเป็น UTF-8 แล้วเข้ารหัสเป็น base64 โดยแทน `+` ด้วย `-` แทน `/` ด้วย `_` และแทนตัวเติม `=` ด้วย `.`

สำหรับ `op` และ `ops` นั้น Hivesigner สร้างธุรกรรมขึ้นรอบการดำเนินการเหล่านั้น โดยเติมบล็อกอ้างอิงและเวลาหมดอายุให้เอง

สำหรับ `tx` นั้น Hivesigner คง `ref_block_num`, `ref_block_prefix` และ `expiration` ของธุรกรรมไว้ตามเดิม ทั้งยังคงลายเซ็นที่ธุรกรรมมีอยู่แล้วด้วย วิธีนี้ทำให้หลายบัญชีลงนามธุรกรรมเดียวกันต่อ ๆ กันได้ สำหรับบัญชีที่มีหลายคนควบคุม Hivesigner ปฏิเสธธุรกรรมที่รายการ `extensions` ไม่ว่าง

> **หมายเหตุ:** Hivesigner ปรับค่าบางอย่างให้เป็นรูปแบบมาตรฐานก่อนลงนาม เช่นจำนวนเงินและฟิลด์ที่ปล่อยไว้ตามค่าเริ่มต้น ธุรกรรมที่ลงนามแล้วจึงอาจมีรหัสต่างจากที่คุณสร้างไว้ ให้อ่านรหัสจาก callback

### ลิงก์แบบเดิม {#legacy-links}

ลิงก์แบบเดิมระบุการดำเนินการหนึ่งอย่างไว้ในเส้นทาง และใส่ฟิลด์ของมันไว้ในสตริงคำค้น

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- เขียนชื่อการดำเนินการแบบ snake case (`transfer_to_vesting`) แบบ camel case (`transferToVesting`) หรือแบบ kebab case (`transfer-to-vesting`) ก็ได้
- ให้แต่ละฟิลด์เป็นพารามิเตอร์คำค้นที่ใช้ชื่อของฟิลด์นั้น และเข้ารหัสทุกค่าให้เหมาะกับ URL
- เขียนรายการและอ็อบเจ็กต์เป็น JSON เช่น `required_posting_auths=["alice"]` รายการของรหัสหรือชื่อจะคั่นด้วยจุลภาคก็ได้ เช่น `proposal_ids=379,380`
- เขียนค่าบูลีนเป็น `true` หรือ `false`

ลิงก์แบบเดิมบรรจุการดำเนินการได้อย่างเดียว หากต้องการมากกว่านั้น ให้ใช้ลิงก์ที่เข้ารหัส

### ค่าของฟิลด์ {#field-values}

กฎเหล่านี้ใช้กับทุกรูปแบบ

- **ค่าเริ่มต้น** ฟิลด์ที่คุณไม่ใส่จะใช้ค่าเริ่มต้นของมัน บัญชีที่เป็นผู้กระทำ (`voter`, `from`, `owner` และฟิลด์ทำนองนั้น) มีค่าเริ่มต้นเป็นบัญชีที่ลงนาม ส่วน `weight` ของการโหวตมีค่าเริ่มต้นเป็น `10000` (100%)
- **จำนวนเงิน** เป็นตัวเลขกับสัญลักษณ์ เช่น `1.000 HIVE`, `0.500 HBD` หรือ `100.000000 VESTS` Hivesigner เขียน HIVE และ HBD ด้วยทศนิยม 3 ตำแหน่ง และเขียน VESTS ด้วย 6 ตำแหน่ง
- **Hive Power** ฟิลด์ที่รับ VESTS ยังรับจำนวนเป็น HP ได้ด้วย เช่น `100 HP` Hivesigner แปลงเป็น VESTS ตามอัตราปัจจุบันก่อนที่ผู้ใช้จะอนุมัติได้
- **`__signer`** ที่อยู่ในค่าใดก็ตามจะกลายเป็นชื่อของบัญชีที่ลงนาม ตัวอย่างเช่น `custom_json` สำหรับการติดตามจะระบุ `__signer` เป็นผู้ติดตามไว้ใน `json` ของมันได้
- **จำนวนเต็ม** ต้องเป็นเลขจำนวนเต็มที่อยู่ในช่วงที่บล็อกเชนรับ เช่น `-10000` ถึง `10000` สำหรับ `weight` ของการโหวต

Hivesigner ปฏิเสธทั้งลิงก์เมื่อค่าหนึ่งไม่เข้ากับฟิลด์ของมัน เมื่อการดำเนินการไม่เป็นที่รู้จัก หรือเมื่อลิงก์ไม่มีการดำเนินการเลย ผู้ใช้จะเห็นข้อความ «ขออภัย เกิดข้อผิดพลาดบางอย่าง ข้อมูลที่ให้มาไม่ถูกต้อง» และไม่มีอะไรถูกลงนาม

## พารามิเตอร์ {#parameters}

เติมพารามิเตอร์เหล่านี้ลงในสตริงคำค้นของลิงก์ลงนามใดก็ได้

| พารามิเตอร์ | ความหมาย |
| --- | --- |
| `cb` | URL ของ callback ที่เข้ารหัสแบบ base64url ค่านี้คือสิ่งที่ `hive-uri` เขียนให้สำหรับตัวเลือก `callback` ของมัน |
| `redirect_uri` | URL ของ callback เป็นข้อความที่เข้ารหัสแบบ URL ธรรมดา ลิงก์แบบเดิมใช้ตัวนี้ ส่วนลิงก์ที่เข้ารหัสจะใช้ตัวนี้เมื่อไม่มี `cb` |
| `nb` | ลงนามอย่างเดียว Hivesigner ลงนามธุรกรรมโดยไม่กระจายออกไป ให้ใส่ `{{sig}}` ไว้ใน callback เพื่อรับลายเซ็น (ดู [ตัวแทนค่าใน callback](#callback-placeholders)) ค่าใดก็ใช้ได้ แม้แต่ค่าว่าง (`nb=`) |
| `s` | บัญชีที่ต้องลงนาม เมื่อบัญชีอื่นถูกเลือกไว้ Hivesigner จะขอให้ผู้ใช้สลับมาที่บัญชีนี้ มันจะไม่ลงนามด้วยบัญชีอื่นเลย |

ให้ใช้ callback แบบ `https://` Hivesigner ไม่สนใจ callback ที่ไม่ใช่ URL แบบ `http` หรือ `https` แล้วจะอยู่ที่หน้าจอผลลัพธ์ของตนเองต่อไป

Hivesigner เลือกคีย์จากการดำเนินการเอง ไม่มีพารามิเตอร์ให้เลือกคีย์ Hivesigner ไม่สนใจ `authority` (และพารามิเตอร์ `a` ของ `hive-uri`) บนลิงก์ลงนาม ดู [ลิงก์หนึ่งต้องใช้คีย์ใด](#which-key)

### ตัวแทนค่าใน callback {#callback-placeholders}

หลังผู้ใช้อนุมัติ Hivesigner จะเติมค่าให้ตัวแทนเหล่านี้ใน callback

| ตัวแทนค่า | ค่า |
| --- | --- |
| `{{id}}` | รหัสธุรกรรม |
| `{{sig}}` | ลายเซ็น สำหรับลิงก์ที่ลงนามอย่างเดียว (`nb`) |
| `{{block}}` | ปล่อยว่าง |
| `{{txn}}` | ปล่อยว่าง |
| `{{data}}` | ปล่อยว่าง |

callback ที่ไม่มีตัวแทนค่าเหล่านี้เลยจะได้รหัสธุรกรรมเติมเข้ามาเป็น `id` ต่อท้าย `?` หรือ `&`

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner เปลี่ยนเส้นทางทันทีที่โหนด Hive รับธุรกรรมแล้ว ธุรกรรมอาจยังไม่อยู่ในบล็อก ให้ค้นหาด้วยรหัสของมันเมื่อคุณต้องรู้ว่ามันถูกบรรจุแล้ว

callback ของคุณจะไม่ถูกเรียกเมื่อเครือข่ายปฏิเสธธุรกรรม (ผู้ใช้เห็นข้อผิดพลาดเอง) หรือเมื่อผู้ใช้ออกไปโดยไม่อนุมัติ

## สร้างลิงก์ {#build-a-link}

### ด้วย hive-uri {#with-hive-uri}

แพ็กเกจ `hive-uri` (https://www.npmjs.com/package/hive-uri) เข้ารหัสการดำเนินการให้เป็นลิงก์ ให้ใช้เวอร์ชัน 0.2.8 ขึ้นไป ซึ่งเข้ารหัสข้อความยูนิโคดใด ๆ ได้ถูกต้อง

```bash
npm install hive-uri
```

```js
import { encodeOp, encodeOps } from 'hive-uri';

// One vote. __signer becomes the account that signs.
const vote = encodeOp(
  ['vote', { voter: '__signer', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
  { callback: 'https://YOUR_APP/voted?tx={{id}}' },
);

// Two transfers in one transaction.
const payout = encodeOps(
  [
    ['transfer', { from: '__signer', to: 'RECIPIENT_1', amount: '1.000 HIVE', memo: 'MEMO' }],
    ['transfer', { from: '__signer', to: 'RECIPIENT_2', amount: '2.000 HIVE', memo: 'MEMO' }],
  ],
  { callback: 'https://YOUR_APP/paid' },
);

const voteLink = vote.replace('hive://', 'https://hivesigner.com/');
const payoutLink = payout.replace('hive://', 'https://hivesigner.com/');
```

อ็อบเจ็กต์ตัวเลือกรับ `callback` (เขียนออกมาเป็น `cb`), `no_broadcast: true` (เขียนออกมาเป็น `nb`) และ `signer` (เขียนออกมาเป็น `s`) ส่วน `encodeTx` ทำแบบเดียวกันกับธุรกรรมทั้งรายการ

### ด้วย JavaScript SDK {#with-the-sdk}

แพ็กเกจ `hivesigner` มี `sendOperation`, `sendOperations` และ `sendTransaction` ทั้งสามรับอาร์กิวเมนต์ชุดเดียวกับตัวเข้ารหัสของ `hive-uri` และคืนลิงก์ `https://hivesigner.com/sign/...`

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

ใน TypeScript ชนิดข้อมูลบังคับให้ใส่อาร์กิวเมนต์ตัวที่สาม ให้ส่ง `undefined` เพื่อรับลิงก์กลับมา ส่วนในเบราว์เซอร์ การส่งฟังก์ชันเป็นอาร์กิวเมนต์ตัวที่สามจะทำให้มันเปิดลิงก์ในแท็บใหม่แทนที่จะคืนค่า ดู [SDK](/docs/sdk#sign-links)

### โดยไม่ต้องเขียนโค้ด {#signs-page}

https://hivesigner.com/signs («ลงนามธุรกรรม») แสดงรายการการดำเนินการที่รองรับทุกอย่าง พร้อมแบบฟอร์มสำหรับฟิลด์ของมัน มันสร้างลิงก์ `/sign/op/` แล้วเปิดให้

## ลิงก์หนึ่งต้องใช้คีย์ใด {#which-key}

การดำเนินการแต่ละอย่างต้องใช้คีย์หนึ่งคีย์ คือ posting, active หรือ owner [ตารางด้านล่าง](#supported-operations) ระบุไว้ครบ มีสามการดำเนินการที่ขึ้นกับค่าของมันเอง

- `custom_json` ต้องใช้คีย์ active เมื่อ `required_auths` ระบุบัญชีไว้ นอกนั้นต้องใช้คีย์ posting
- `account_update` ต้องใช้คีย์ owner เมื่อมันตั้งค่า `owner` นอกนั้นต้องใช้คีย์ active
- `account_update2` ต้องใช้คีย์ owner เมื่อมันตั้งค่า `owner` และต้องใช้คีย์ active เมื่อมันตั้งค่า `active`, `posting`, `memo_key` หรือ `json_metadata` ถ้ามีแต่ `posting_json_metadata` ก็ต้องใช้คีย์ posting

Hivesigner ลงนามลิงก์ด้วยคีย์เดียว การดำเนินการทั้งหมดในลิงก์เดียวจึงต้องใช้คีย์เดียวกัน Hivesigner ปฏิเสธที่จะลงนามลิงก์ที่ปนกัน และบอกผู้ใช้ว่าเพราะอะไร ให้ส่งการดำเนินการเหล่านั้นแยกลิงก์กัน

เมื่อบัญชีที่เลือกไว้ไม่มีคีย์นั้นบนอุปกรณ์ Hivesigner จะบอกว่าคีย์ใดขาดไปและเสนอให้เพิ่ม ดู [เมื่อไม่มีคีย์](/docs/signing#missing-key)

## ผู้ใช้เห็นอะไร {#what-the-user-sees}

- หน้าจอชื่อ «ยืนยันธุรกรรม» พร้อมการ์ดหนึ่งใบต่อหนึ่งการดำเนินการ ในนั้นมีสรุปเป็นคำพูดธรรมดา คีย์ที่มันต้องใช้ และค่าที่มันบรรจุอยู่
- «คุณจะถูกเปลี่ยนเส้นทางไปยัง HOST» เมื่อลิงก์มี callback ให้ใช้ callback บนเว็บไซต์ของคุณเอง เพื่อให้ผู้ใช้จำโฮสต์นั้นได้
- คำเตือน เมื่อการดำเนินการกระทำในนามบัญชีอื่นที่ไม่ใช่บัญชีที่ลงนาม
- **อนุมัติ** หรือ **ลงนาม** สำหรับลิงก์ที่ลงนามอย่างเดียว บัญชีที่ล็อกอยู่จะขอรหัสผ่านก่อน
- หลังการกระจาย จะมีข้อความ «ส่งกระจายธุรกรรมสำเร็จแล้ว» พร้อมรหัสธุรกรรม แล้วจึงเปลี่ยนเส้นทางไปยัง callback ของคุณ

[ตรวจดูและลงนาม](/docs/signing#confirm-screen) อธิบายหน้าจอนี้สำหรับผู้ใช้

## การดำเนินการที่รองรับ {#supported-operations}

Hivesigner ลงนามการดำเนินการ 41 อย่างนี้ตามชื่อบนบล็อกเชน อย่างอื่นถูกปฏิเสธทั้งหมด ชื่อที่ระบุไว้คือชื่อที่ Hivesigner แสดงบนหน้าจอยืนยัน

| การดำเนินการ | คีย์ | ชื่อ |
| --- | --- | --- |
| `transfer` | Active | โอน |
| `recurrent_transfer` | Active | การโอนแบบประจำ |
| `delegate_vesting_shares` | Active | มอบหมาย Hive Power |
| `transfer_to_vesting` | Active | Power Up |
| `set_withdraw_vesting_route` | Active | ตั้งค่าเส้นทาง Power Down |
| `withdraw_vesting` | Active | Power Down |
| `transfer_to_savings` | Active | โอนเข้าเงินออม |
| `transfer_from_savings` | Active | โอนออกจากเงินออม |
| `cancel_transfer_from_savings` | Active | ยกเลิกการโอนออกจากเงินออม |
| `convert` | Active | แปลง HBD เป็น HIVE |
| `collateralized_convert` | Active | แปลง HIVE เป็น HBD |
| `account_witness_vote` | Active | โหวตพยาน |
| `witness_update` | Active | อัปเดตพยาน |
| `witness_set_properties` | Active | ตั้งค่าคุณสมบัติพยาน |
| `account_witness_proxy` | Active | พร็อกซีการกำกับดูแล |
| `claim_account` | Active | รับเครดิตบัญชี |
| `account_create` | Active | สร้างบัญชี |
| `create_claimed_account` | Active | สร้างบัญชีด้วยเครดิตบัญชี |
| `vote` | Posting | โหวต |
| `limit_order_create` | Active | สร้างคำสั่งจำกัดราคา |
| `limit_order_create2` | Active | สร้างคำสั่งจำกัดราคา |
| `limit_order_cancel` | Active | ยกเลิกคำสั่งจำกัดราคา |
| `claim_reward_balance` | Posting | รับรางวัล |
| `comment` | Posting | โพสต์หรือความคิดเห็น |
| `comment_options` | Posting | ตัวเลือกโพสต์หรือความคิดเห็น |
| `custom_json` | Posting หรือ Active เมื่อมีการตั้ง `required_auths` | การดำเนินการแบบกำหนดเอง |
| `delete_comment` | Posting | ลบความคิดเห็น |
| `account_update` | Active หรือ Owner เมื่อมีการตั้ง `owner` | อัปเดตบัญชี (active) |
| `account_update2` | Posting, Active หรือ Owner ตามฟิลด์ | อัปเดตบัญชี (posting) |
| `change_recovery_account` | Owner | เปลี่ยนบัญชีกู้คืน |
| `create_proposal` | Active | สร้างข้อเสนอ |
| `remove_proposal` | Active | ลบข้อเสนอ |
| `update_proposal_votes` | Active | อัปเดตการโหวตข้อเสนอ |
| `update_proposal` | Active | อัปเดตข้อเสนอ |
| `escrow_transfer` | Active | โอนแบบเอสโครว์ |
| `escrow_approve` | Active | อนุมัติเอสโครว์ |
| `escrow_dispute` | Active | โต้แย้งเอสโครว์ |
| `escrow_release` | Active | ปล่อยเงินเอสโครว์ |
| `account_create_with_delegation` | Active | สร้างบัญชีพร้อมการมอบหมาย |
| `request_account_recovery` | Active | ขอกู้คืนบัญชี |
| `recover_account` | Owner | กู้คืนบัญชี |
