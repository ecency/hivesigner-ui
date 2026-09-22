Ilovangiz foydalanuvchidan matnli xabarni posting yoki active kaliti bilan imzolashni soʻrashi mumkin. Imzo foydalanuvchi hisobni nazorat qilishini isbotlaydi. Hech narsa tarmoqqa yuborilmaydi: xabar blokcheynga umuman tushmaydi. Hivesigner Hive Keychain'ning `requestSignBuffer` funksiyasi kabi imzolaydi, shuning uchun Keychain imzosini tekshiradigan server kodi Hivesigner imzosini ham tekshiradi.

## Imzo soʻrang {#request}

Foydalanuvchini quyidagi soʻrov parametrlari bilan `https://hivesigner.com/sign-buffer` manziliga yuboring:

| Parametr | Majburiy | Maʼnosi |
| --- | --- | --- |
| `message` | Ha | Imzolanadigan matnning aynan oʻzi. U boʻsh joylardan koʻproq narsani saqlashi kerak. |
| `redirect_uri` | Ha | Hivesigner natijani qayerga yuborishi. Qarang: [Callback qoidalari](#callback-rules). |
| `authority` | Yoʻq | `posting` yoki `active`, harflar katta-kichikligidan qatʼi nazar (`Posting` ham yaraydi). Boʻlmasa yoki boʻsh boʻlsa `posting`. Boshqa har qanday qiymat rad etiladi. |
| `client_id` | Yoʻq | Ilova hisobingiz. `clientId` ham oʻqiladi. U boʻlsa, `redirect_uri` ilovangizning callback manzillaridan biri boʻlishi kerak. |
| `state` | Yoʻq | Har qanday qiymat. Hivesigner uni oʻzgartirmasdan qaytaradi. |
| `account` | Yoʻq | Siz imzolashini kutayotgan hisob. Hivesigner u qurilmada boʻlsa uni tanlaydi, boʻlmasa eʼtiborsiz qoldiradi. `select_account` ham oʻqiladi. |

Har bir qiymat kodlanishi uchun manzilni `URLSearchParams` bilan tuzing:

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

### Callback qoidalari {#callback-rules}

- Callback manzili `https://` boʻlishi kerak. Oddiy `http://` faqat loopback'da ishlaydi: `localhost`, `127.0.0.1` yoki `[::1]`.
- **`client_id` bilan** callback manzili oʻsha ilova hisobida roʻyxatdan oʻtkazilgan boʻlishi va kirishdagi kabi solishtirilishi kerak. Qarang: [Callback manzillari](/docs/register-app#callback-rules). Hivesigner ilovaning callback manzillarini soʻrov ochilganda Hive'dan oʻqiydi va ularni oʻqimaguncha hech narsani imzolamaydi. Hive'ga ulanib boʻlmaganda foydalanuvchi **Qayta urinish** tugmasini oladi.
- **`client_id` siz** birinchi qoidaga mos keladigan har qanday callback manzili ishlaydi. Shunda Hivesigner soʻrovchi sifatida callback manzilining xostini koʻrsatadi, masalan «HOST sizdan xabarni imzolashni soʻramoqda.»

Ilova hisobingiz boʻlsa, `client_id` yuboring. Shunda foydalanuvchi ilovangizning nomi va hisobini koʻradi. Imzoni faqat roʻyxatdan oʻtkazilgan callback manzillaringiz olishi mumkin.

Hivesigner xabari yoʻq, `authority` qiymati nomaʼlum, callback manzili yetishmaydigan yoki yaroqsiz, `client_id` qiymati Hive hisobi boʻlmagan yoki callback manzili oʻsha ilovada roʻyxatdan oʻtkazilmagan soʻrovni rad etadi. Foydalanuvchi «Bu imzo soʻrovidan foydalanib boʻlmaydi: unga xabar, posting yoki active kalit va ilova uchun roʻyxatdan oʻtkazilgan xavfsiz yoʻnaltirish URL manzili kerak. Saytga qayting va qaytadan urinib koʻring.» yozuvini va **Bu muammo haqida xabar berish** tugmasini koʻradi.

### Foydalanuvchi nimani koʻradi {#what-the-user-sees}

- Ilovangiz nomini (yoki callback manzilining xostini) koʻrsatadigan sarlavha va «Sizni HOST manziliga yoʻnaltiradi» yozuvi.
- Butun xabar, aynan imzolanadigan koʻrinishda. Matnni yashirishi yoki uning yoʻnalishini oʻzgartirishi mumkin boʻlgan belgilar `\u{200B}` kabi kodlar sifatida koʻrsatiladi.
- «Posting kalitingiz bilan imzolanadi» yoki «Active kalitingiz bilan imzolanadi».
- Ogohlantirish: «Imzoingiz uni koʻrgan har kimga @USERNAME aynan shu matnni imzolaganini isbotlaydi. Faqat tushungan xabaringizni imzolang.»
- **Imzolash** va **Bekor qilish**. Qulflangan hisob avval kirish kodini soʻraydi.

[Xabar imzolash soʻrovlari](/docs/signing#message-requests) bu ekranni foydalanuvchilar uchun tavsiflaydi.

## Callback manzilingiz nimani oladi {#callback}

Foydalanuvchi **Imzolash** ni tanlaganda Hivesigner uni quyidagi soʻrov parametrlari bilan callback manzilingizga yuboradi:

| Parametr | Qiymat |
| --- | --- |
| `signature` | Imzo, 130 belgidan iborat oʻn oltilik satr koʻrinishida |
| `public_key` | Imzolagan kalitning ochiq kaliti, masalan `STM...` |
| `username` | Imzolagan hisob |
| `authority` | `posting` yoki `active` |
| `state` | Soʻrovda `state` boʻlgan boʻlsa, sizning qiymatingiz (boʻsh qiymat ham) |

Hivesigner ularni callback manzilingizning soʻrov qatoriga, `?` yoki `&` dan keyin va har qanday `#fragment` dan oldin qoʻshadi. Sizning oʻz soʻrov qatoringiz oʻzgarmasdan qoladi.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Foydalanuvchi **Bekor qilish** ni tanlaganda Hivesigner uning hisoblar roʻyxatini ochadi. Callback manzilingiz hech narsa olmaydi.

> **Ogohlantirish:** har kim callback manzilingizni oʻylab topilgan qiymatlar bilan ocha oladi. Serveringiz imzoni tekshirmaguncha har bir parametrni shunchaki daʼvo deb bilib turing.

## Imzoni tekshiring {#verify}

Imzoni serveringizda tekshiring:

1. Siz soʻragan xabarni `state` qiymati bilan birga serveringizda saqlang. Brauzerdan qaytib kelgan nusxaga ishonmang.
2. Xabarning xeshini hisoblang: uning UTF-8 baytlari ustidan sha256.
3. Ochiq kalitni imzodan va oʻsha xeshdan tiklang.
4. Hisobni Hive'dan yuklang. Tiklangan kalit siz soʻragan vakolatga tegishli ekanini va yolgʻiz imzolashga yetarli ogʻirlikka ega ekanini tekshiring.
5. `state` siz bergan qiymat ekanini tekshiring. Har bir xabarni bir marta qabul qiling.

Bu misolda dhive (https://www.npmjs.com/package/@hiveio/dhive) ishlatiladi:

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

Xuddi shu tekshiruv Hive Keychain'ning `requestSignBuffer` funksiyasidan kelgan imzo uchun ham ishlaydi. Oʻzingiz tiklagan kalit bilan solishtiring: callback'dagi `public_key` faqat ishoradir.

## Hivesigner imzolamaydigan xabarlar {#refused-messages}

`signed_message` kalitiga ega JSON obyekti boʻlgan xabar Hivesigner tokeni shaklida boʻladi. Uni imzolash soʻrovchiga foydalanuvchi hisobiga kirish huquqini berardi. Hivesigner bunday xabarni hech qachon imzolamaydi. U foydalanuvchiga «Bu xabar Hivesigner tokeni. Uni imzolash saytga hisobingizga kirish huquqini beradi, shuning uchun uni imzolab boʻlmaydi.» deb aytadi.

Oddiy matndan yoki `signed_message` kaliti yoʻq JSON'dan foydalaning. Imzo nima uchun kerakligini yozing va bir marta yaratadigan qiymatni qoʻshing, masalan:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## Xabarni imzolash vositasi {#sign-message-tool}

Odamlar xabarni https://hivesigner.com/signmessage sahifasida oʻzlari ham imzolashi (**Xabarni imzolash**) va https://hivesigner.com/verifymessage sahifasida uni tekshirishi (**Xabarni tekshirish**) mumkin. Qarang: [Xabarni oʻzingiz imzolang](/docs/signing#sign-message).

Oʻsha vosita `/sign-buffer` dan boshqacha imzolaydi. U xabar, hisob va vaqtni saqlaydigan Hivesigner token tanasini imzolaydi. Natijani esa **Tekshirish tokeni** sifatida ulashadi. Bunday tokenni **Xabarni tekshirish** sahifasida yoki [Oʻzingiz tekshiring](/docs/tokens#check-it-yourself) boʻlimida tavsiflanganidek tekshiring, yuqoridagi kod bilan emas.
