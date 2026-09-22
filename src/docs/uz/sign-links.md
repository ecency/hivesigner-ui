Imzo havolasi Hive tranzaksiyasini Hivesigner'da ochadi. Foydalanuvchi uni koʻrib chiqadi, oʻz kaliti bilan tasdiqlaydi va Hivesigner uni brauzeridan tarmoqqa yuboradi. Soʻngra Hivesigner foydalanuvchini tranzaksiya identifikatori bilan ilovangizga qaytarishi mumkin. Imzo havolalari uchun na ilova hisobi, na token kerak. Ular Hivesigner qoʻllab-quvvatlaydigan barcha 41 amalni qamrab oladi, shu jumladan active kalit talab qiladigan pul oʻtkazmalari va boshqa amallarni ham.

## Imzo havolasi qanday ishlaydi {#how-it-works}

1. Ilovangiz bir yoki bir nechta amalni saqlaydigan havola tuzadi.
2. Foydalanuvchi havolani ochadi. Hivesigner har bir amalni «Tranzaksiyani tasdiqlash» ekranida sodda soʻzlar bilan, u talab qiladigan kalit bilan birga koʻrsatadi.
3. Foydalanuvchi tasdiqlaydi. Hivesigner tranzaksiyani brauzerda, Hivesigner'da tanlangan hisobning kaliti bilan imzolaydi. Soʻngra tranzaksiyani Hive tarmogʻiga yuboradi.
4. Havola callback manzilini koʻrsatsa, Hivesigner foydalanuvchini tranzaksiya identifikatori bilan oʻsha yerga yuboradi.

Ilovangiz hech qachon kalitni koʻrmaydi. Har qanday sayt imzo havolasini yarata oladi: yuboriladigan `client_id` yoʻq.

## Havola shakllari {#link-forms}

Hivesigner imzo havolalarining ikki turini oʻqiydi: kodlangan havolalar va eski havolalar.

### Kodlangan havolalar {#encoded-links}

Kodlangan havola amallarni JSON sifatida, base64url bilan kodlangan holda olib yuradi. U `hive-uri` paketining `hive://sign/...` shaklidan foydalanadi, bunda `hive://` oʻrniga `https://hivesigner.com/` qoʻyiladi.

| Shakl | `B64U` nimani saqlaydi |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Bitta amalni: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Amallar roʻyxatini: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Oʻz sarlavhasi bilan butun tranzaksiyani |

`B64U` bu JSON matni boʻlib, avval UTF-8 sifatida, soʻngra base64 sifatida kodlanadi; `+` oʻrniga `-`, `/` oʻrniga `_` va `=` toʻldirishi oʻrniga `.` qoʻyiladi.

`op` va `ops` uchun Hivesigner tranzaksiyani amallar atrofida oʻzi tuzadi. Tayanch blok va amal qilish muddatini oʻzi toʻldiradi.

`tx` uchun Hivesigner tranzaksiyaning oʻz `ref_block_num`, `ref_block_prefix` va `expiration` qiymatlarini saqlab qoladi. U tranzaksiya allaqachon olib yurgan imzolarni ham saqlaydi. Bu bir necha odam boshqaradigan hisob uchun bir nechta hisobga bitta tranzaksiyani navbat bilan imzolash imkonini beradi. Hivesigner `extensions` roʻyxati boʻsh boʻlmagan tranzaksiyani rad etadi.

> **Eslatma:** Hivesigner imzolashdan oldin baʼzi qiymatlarni meʼyorlashtiradi, masalan summalarni va standart qiymatida qolgan maydonlarni. Shuning uchun imzolangan tranzaksiyaning identifikatori siz tuzganidan boshqacha boʻlishi mumkin. Identifikatorni callback manzilidan oʻqing.

### Eski havolalar {#legacy-links}

Eski havola bitta amalni yoʻlda koʻrsatadi va uning maydonlarini soʻrov qatoriga joylaydi:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Amal nomini snake case (`transfer_to_vesting`), camel case (`transferToVesting`) yoki kebab case (`transfer-to-vesting`) koʻrinishida yozing.
- Har bir maydonni oʻsha maydon nomi bilan soʻrov parametri sifatida bering. Har bir qiymatni URL uchun kodlang.
- Roʻyxat va obyektlarni JSON sifatida yozing, masalan `required_posting_auths=["alice"]`. Identifikator yoki nomlar roʻyxatini vergul bilan ham ajratish mumkin: `proposal_ids=379,380`.
- Mantiqiy qiymatlarni `true` yoki `false` deb yozing.

Eski havola bitta amalni saqlaydi. Undan koʻproq uchun kodlangan havoladan foydalaning.

### Maydon qiymatlari {#field-values}

Bu qoidalar har bir shakl uchun amal qiladi:

- **Standart qiymatlar.** Siz tushirib qoldirgan maydon oʻz standart qiymatini oladi. Ish koʻradigan hisob (`voter`, `from`, `owner` va shunga oʻxshash maydonlar) standart holda imzolaydigan hisob boʻladi. Ovozning `weight` qiymati standart holda `10000` (100%) boʻladi.
- **Summalar** bu son va belgi: `1.000 HIVE`, `0.500 HBD` yoki `100.000000 VESTS`. Hivesigner HIVE va HBD ni 3 kasr bilan, VESTS ni esa 6 kasr bilan yozadi.
- **Hive Power.** VESTS qabul qiladigan maydon HP dagi summani ham qabul qiladi, masalan `100 HP`. Hivesigner uni foydalanuvchi tasdiqlashidan oldin joriy kurs boʻyicha VESTS ga aylantiradi.
- **`__signer`** qiymat ichida qayerda boʻlmasin, imzolaydigan hisob nomiga aylanadi. Masalan, obuna uchun `custom_json` oʻz `json` maydoni ichida obunachi sifatida `__signer` ni koʻrsatishi mumkin.
- **Butun sonlar** blokcheyn qabul qiladigan oraliqdagi butun sonlar boʻlishi kerak, masalan ovozning `weight` qiymati uchun `-10000` dan `10000` gacha.

Qiymat oʻz maydoniga toʻgʻri kelmaganda, amal nomaʼlum boʻlganda yoki havolada umuman amal boʻlmaganda Hivesigner butun havolani rad etadi. Foydalanuvchi «Voy, nimadir xato ketdi. Taqdim etilgan maʼlumotlar notoʻgʻri.» yozuvini koʻradi va hech narsa imzolanmaydi.

## Parametrlar {#parameters}

Bularni istalgan imzo havolasining soʻrov qatoriga qoʻshing:

| Parametr | Maʼnosi |
| --- | --- |
| `cb` | base64url bilan kodlangan callback manzili. `hive-uri` oʻzining `callback` parametri uchun aynan shuni yozadi. |
| `redirect_uri` | Oddiy URL kodlashidagi matn sifatidagi callback manzili. Eski havolalar shundan foydalanadi. Kodlangan havola esa `cb` boʻlmaganda undan foydalanadi. |
| `nb` | Faqat imzolash. Hivesigner tranzaksiyani tarmoqqa yubormasdan imzolaydi. Imzoni olish uchun callback manziliga `{{sig}}` qoʻying (qarang: [Callback oʻrinbosarlari](#callback-placeholders)). Har qanday qiymat, hatto boʻsh qiymat ham (`nb=`) yaraydi. |
| `s` | Imzolashi kerak boʻlgan hisob. Boshqa hisob tanlangan boʻlsa, Hivesigner foydalanuvchidan shu hisobga oʻtishni soʻraydi. U boshqa hech qaysi hisob bilan imzolamaydi. |

`https://` callback manzilidan foydalaning. Hivesigner `http` yoki `https` boʻlmagan manzilni eʼtiborsiz qoldiradi va oʻz natija ekranida qolaveradi.

Hivesigner kalitni amallarga qarab tanlaydi. Kalitni tanlash uchun parametr yoʻq: imzo havolalarida Hivesigner `authority` ni (va `hive-uri` paketining `a` parametrini) eʼtiborsiz qoldiradi. Qarang: [Havolaga qaysi kalit kerak](#which-key).

### Callback oʻrinbosarlari {#callback-placeholders}

Foydalanuvchi tasdiqlaganidan keyin Hivesigner callback manzilidagi bu oʻrinbosarlarni toʻldiradi:

| Oʻrinbosar | Qiymat |
| --- | --- |
| `{{id}}` | Tranzaksiya identifikatori |
| `{{sig}}` | Imzo, faqat imzolash (`nb`) havolasi uchun |
| `{{block}}` | Boʻsh qoldiriladi |
| `{{txn}}` | Boʻsh qoldiriladi |
| `{{data}}` | Boʻsh qoldiriladi |

Bu oʻrinbosarlarning hech biri yoʻq callback manziliga tranzaksiya identifikatori `id` sifatida, `?` yoki `&` dan keyin qoʻshiladi:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner Hive tuguni tranzaksiyani qabul qilishi bilanoq yoʻnaltiradi. Tranzaksiya hali blokda boʻlmasligi mumkin. Uning blokka tushganini bilish kerak boʻlsa, uni identifikatori boʻyicha qidiring.

Tarmoq tranzaksiyani rad etganda (foydalanuvchi xatoni koʻradi) yoki foydalanuvchi tasdiqlamasdan chiqib ketganda callback manzilingiz chaqirilmaydi.

## Havola tuzing {#build-a-link}

### hive-uri bilan {#with-hive-uri}

`hive-uri` paketi (https://www.npmjs.com/package/hive-uri) amallarni havolalarga kodlaydi. Har qanday Unicode matnni toʻgʻri kodlaydigan 0.2.8 yoki undan yangi versiyadan foydalaning.

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

Parametrlar obyekti `callback` (`cb` deb yoziladi), `no_broadcast: true` (`nb` deb yoziladi) va `signer` (`s` deb yoziladi) qiymatlarini qabul qiladi. `encodeTx` xuddi shu ishni butun tranzaksiya uchun bajaradi.

### JavaScript SDK bilan {#with-the-sdk}

`hivesigner` paketida `sendOperation`, `sendOperations` va `sendTransaction` bor. Ular `hive-uri` kodlovchilari bilan bir xil argumentlarni oladi va `https://hivesigner.com/sign/...` havolasini qaytaradi:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

TypeScript'da turlar uchinchi argumentni talab qiladi: havolani qaytarib olish uchun `undefined` yuboring. Brauzerda esa uchinchi argument sifatida yuborilgan funksiya havolani qaytarish oʻrniga uni yangi ilovachada ochishga majbur qiladi. Qarang: [SDK](/docs/sdk#sign-links).

### Kodsiz {#signs-page}

https://hivesigner.com/signs («Tranzaksiyani imzolash») qoʻllab-quvvatlanadigan har bir amalni maydonlari uchun shakl bilan roʻyxatlaydi. U `/sign/op/` havolasini tuzadi va ochadi.

## Havolaga qaysi kalit kerak {#which-key}

Har bir amalga bitta kalit kerak: posting, active yoki owner. [Quyidagi jadval](#supported-operations) ularni roʻyxatlaydi. Uchta amal oʻz qiymatlariga bogʻliq:

- `custom_json` ga `required_auths` hisobni koʻrsatganda active kalit kerak. Aks holda posting kalit kerak.
- `account_update` ga u `owner` ni belgilaganda owner kalit kerak. Aks holda active kalit kerak.
- `account_update2` ga u `owner` ni belgilaganda owner kalit kerak. U `active`, `posting`, `memo_key` yoki `json_metadata` ni belgilaganda active kalit kerak. Faqat `posting_json_metadata` boʻlsa, posting kalit kerak.

Hivesigner havolani bitta kalit bilan imzolaydi, shuning uchun bitta havoladagi barcha amallarga bir xil kalit kerak boʻlishi lozim. Hivesigner ularni aralashtirgan havolani imzolashdan bosh tortadi va foydalanuvchiga sababini aytadi. Bunday amallarni alohida havolalar bilan yuboring.

Tanlangan hisobda qurilmada kalit boʻlmasa, Hivesigner qaysi kalit yetishmayotganini aytadi va uni qoʻshishni taklif qiladi. Qarang: [Kalit yetishmaganda](/docs/signing#missing-key).

## Foydalanuvchi nimani koʻradi {#what-the-user-sees}

- «Tranzaksiyani tasdiqlash» sarlavhali ekran va har bir amal uchun bitta karta: sodda soʻzlardagi xulosa, kerakli kalit va u olib yurgan qiymatlar.
- Havolada callback manzili boʻlsa, «Siz HOST manziliga yoʻnaltirilasiz.» yozuvi. Foydalanuvchilar xostni tanishi uchun oʻz saytingizdagi callback manzilidan foydalaning.
- Amal imzolayotgan hisobdan boshqa hisob nomidan ish koʻrsa, ogohlantirish.
- **Tasdiqlash** yoki faqat imzolash havolasi uchun **Imzolash**. Qulflangan hisob avval kirish kodini soʻraydi.
- Tarmoqqa yuborilgandan keyin tranzaksiya identifikatori bilan «Tranzaksiya tarmoqqa muvaffaqiyatli yuborildi» yozuvi. Soʻngra callback manzilingizga yoʻnaltirish.

[Koʻrib chiqish va imzolash](/docs/signing#confirm-screen) bu ekranni foydalanuvchilar uchun tavsiflaydi.

## Qoʻllab-quvvatlanadigan amallar {#supported-operations}

Hivesigner bu 41 amalni blokcheyndagi nomlari boʻyicha imzolaydi. Qolgan hamma narsa rad etiladi. Nom bu Hivesigner tasdiqlash ekranida koʻrsatadigan nom.

| Amal | Kalit | Nomi |
| --- | --- | --- |
| `transfer` | Active | Oʻtkazma |
| `recurrent_transfer` | Active | Takroriy oʻtkazma |
| `delegate_vesting_shares` | Active | Hive Power delegatsiya qilish |
| `transfer_to_vesting` | Active | Power Up |
| `set_withdraw_vesting_route` | Active | Power Down yoʻnalishini belgilash |
| `withdraw_vesting` | Active | Power Down |
| `transfer_to_savings` | Active | Jamgʻarmaga oʻtkazish |
| `transfer_from_savings` | Active | Jamgʻarmadan oʻtkazish |
| `cancel_transfer_from_savings` | Active | Jamgʻarmadan oʻtkazishni bekor qilish |
| `convert` | Active | HBD’ni HIVE’ga aylantirish |
| `collateralized_convert` | Active | HIVE’ni HBD’ga aylantirish |
| `account_witness_vote` | Active | Guvohga ovoz berish |
| `witness_update` | Active | Guvoh maʼlumotlarini yangilash |
| `witness_set_properties` | Active | Guvoh parametrlarini belgilash |
| `account_witness_proxy` | Active | Boshqaruv proksisi |
| `claim_account` | Active | Hisob kreditini olish |
| `account_create` | Active | Hisob yaratish |
| `create_claimed_account` | Active | Hisob kreditlari bilan hisob yaratish |
| `vote` | Posting | Ovoz berish |
| `limit_order_create` | Active | Limit buyurtma yaratish |
| `limit_order_create2` | Active | Limit buyurtma yaratish |
| `limit_order_cancel` | Active | Limit buyurtmani bekor qilish |
| `claim_reward_balance` | Posting | Mukofotlarni olish |
| `comment` | Posting | Post yoki izoh |
| `comment_options` | Posting | Post yoki izoh sozlamalari |
| `custom_json` | Posting yoki `required_auths` belgilanganda Active | Maxsus amal |
| `delete_comment` | Posting | Izohni oʻchirish |
| `account_update` | Active yoki `owner` belgilanganda Owner | Hisobni yangilash (active) |
| `account_update2` | Maydoniga qarab Posting, Active yoki Owner | Hisobni yangilash (posting) |
| `change_recovery_account` | Owner | Tiklash hisobini oʻzgartirish |
| `create_proposal` | Active | Taklif yaratish |
| `remove_proposal` | Active | Taklifni olib tashlash |
| `update_proposal_votes` | Active | Taklif ovozlarini yangilash |
| `update_proposal` | Active | Taklifni yangilash |
| `escrow_transfer` | Active | Eskrou oʻtkazmasi |
| `escrow_approve` | Active | Eskrouni tasdiqlash |
| `escrow_dispute` | Active | Eskrou boʻyicha nizo |
| `escrow_release` | Active | Eskrou mablagʻini chiqarish |
| `account_create_with_delegation` | Active | Delegatsiya bilan hisob yaratish |
| `request_account_recovery` | Active | Hisobni tiklashni soʻrash |
| `recover_account` | Owner | Hisobni tiklash |
