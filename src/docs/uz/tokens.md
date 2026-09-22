Hivesigner tokeni bu qisqa imzolangan bayonot. Unda Hive hisobi, token qaysi ilova uchun yaratilgani va imzolangan vaqti koʻrsatiladi. Serveringiz tokenni API orqali yoki mustaqil ravishda tekshirishi mumkin. Bu sahifa token nimalarni saqlashini, qancha vaqt amal qilishini va tekshirishning ikkala yoʻlini koʻrsatadi.

## Token qanday koʻrinishda boʻladi {#format}

Token bu base64url bilan kodlangan JSON obyekti; standart base64url'dan farqi shundaki, toʻldirish uchun `=` oʻrniga `.` ishlatiladi. Yaʼni oddiy base64 bilan solishtirganda `+` oʻrniga `-`, `/` oʻrniga `_` va `=` oʻrniga `.` keladi. Har bir token `eyJzaWduZWRfbWVzc2FnZSI6` bilan boshlanadi.

Kodi yechilganda, token oqimidan kelgan kirish tokeni shunday koʻrinadi:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Maydon | Maʼnosi |
| --- | --- |
| `signed_message.type` | Token turi: `login`, `posting`, `code` yoki `refresh`. Qarang: [Token turlari](#kinds). |
| `signed_message.app` | Token qaysi ilova hisobi uchun yaratilgani. Ilova hisobi yoʻq sayt uchun yaratilgan kirish tokenida bu maydon boʻlmaydi. |
| `authors[0]` | Token tegishli boʻlgan Hive hisobi. |
| `timestamp` | Qachon imzolangani, 1970-01-01 UTC dan boshlab sekundlarda. |
| `signatures[0]` | Imzo, oʻn oltilik satr koʻrinishida. |
| `authority` | Faqat brauzerda imzolangan tokenlarda: foydalanuvchining qaysi kaliti imzolagani, `posting` yoki `active`. Bu maydon imzolangan maʼlumotdan tashqarida turadi. Qaysi kalit imzolaganini bilish uchun uni imzodan tiklang. |

Imzo bu `JSON.stringify({ signed_message, authors, timestamp })` qiymatining sha256 xeshi ustidan olingan secp256k1 imzosi boʻlib, kalitlar aynan shu tartibda keladi.

### Tokenni dekodlang {#decode}

Node.js'da:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

Brauzerda:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Dekodlash tekshirish degani emas. Har kim shu shaklga dekodlanadigan satrni tuzishi mumkin. Ishonishdan oldin [tokenni tekshiring](#check-a-token).

## Token turlari {#kinds}

| Token | `type` | `app` | Kim imzolaydi | Uni qayerdan olasiz |
| --- | --- | --- | --- | --- |
| Kirish tokeni, token oqimi | `posting` | Sizning ilovangiz | Foydalanuvchining posting kaliti yoki Hivesigner bu hisob uchun posting kalitini saqlamasa, uning active kaliti | Callback manzilingizdagi `access_token` |
| Kirish tokeni, `scope=login` | `login` | Sizning ilovangiz | Foydalanuvchining posting yoki active kaliti | Callback manzilingizdagi `access_token` |
| Kirish tokeni, ilova hisobi yoʻq sayt | `login` | Yoʻq | Foydalanuvchining posting yoki active kaliti | Callback manzilingizdagi `access_token` |
| Kod | `code` | Sizning ilovangiz | Foydalanuvchining posting yoki active kaliti | Callback manzilingizdagi `code` |
| Kirish tokeni, kod oqimi | `posting` | Sizning ilovangiz | @hivesigner hisobining posting kaliti | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Yangilash tokeni | `refresh` | Sizning ilovangiz | @hivesigner hisobining posting kaliti | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Kod va yangilash tokeni kirish tokeni emas. Ularning hech birini hech qachon tizimga kirish sifatida qabul qilmang.

## Token qancha vaqt amal qiladi {#lifetime}

Kirish tokeni 7 kun amal qiladi: `expires_in` bu 604800 sekund boʻlib, uning `timestamp` qiymatidan boshlab sanaladi. Muddati tugaganda:

- **Token oqimi:** foydalanuvchini qaytadan kirishga yuboring. Ilovangizga avval ruxsat bergan foydalanuvchi «APP ilovasiga kirish» yozuvini koʻradi va unga bir marta bosish kifoya.
- **Kod oqimi:** serveringiz yangilash tokeni va mijoz maxfiy kaliti bilan yangi kirish tokenini oladi. Qarang: [Yangilash](/docs/oauth2#refresh).

Tokenning `timestamp` qiymati 7 kundan eski boʻlsa, uni muddati tugagan deb hisoblang. Yoʻnaltirishdan soʻng darhol tekshiradigan har qanday narsa uchun ancha qisqaroq yoshni qabul qiling. Kodni darhol almashtiring. Kirish tokenini faqat uning `timestamp` qiymatidan keyingi bir necha daqiqa ichida qabul qiling.

## Tokenni serveringizda tekshiring {#check-a-token}

Serveringiz brauzer yoki ilova yuborgan tokenga ishonishidan oldin quyidagilarni tekshiring:

- uni haqiqatan ham hisob yoki @hivesigner imzolaganini;
- u sizning ilovangiz uchun yaratilganini;
- u siz kutgan turdagi token ekanini;
- u yetarlicha yangi ekanini.

### API'dan soʻrang {#check-with-the-api}

`/api/me` manzilini token bilan chaqiring. Yaroqli token hisobni `user` maydonida qaytaradi:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Yaroqsiz token `invalid_grant` bilan `401` qaytaradi. Qarang: [GET /api/me](/docs/api#me).

`/api/me` imzoni tasdiqlaydi. Uning javobi token qaysi ilova uchun yaratilganini aytmaydi. Shuning uchun tokenni yana oʻzingiz dekodlang va uning `app`, `type` hamda yoshini tekshiring. Boshqa ilova uchun yaratilgan token sizning ilovangizga hech kimni kiritmasligi kerak.

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

API faqat ilovani koʻrsatadigan tokenlarni qabul qiladi. Ilova hisobi yoʻq saytdan kelgan kirish tokenini [oʻzingiz](#check-it-yourself) tekshiring.

### Oʻzingiz tekshiring {#check-it-yourself}

1. Tokenni dekodlang.
2. `signed_message.type` siz kutgan tur ekanini tekshiring: kirish tokeni uchun `posting`, tizimga kirish tokeni uchun `login`.
3. `signed_message.app` sizning ilova hisobingiz ekanini tekshiring. Ilova hisobi yoʻq sayt uchun esa u umuman yoʻqligini tekshiring.
4. `timestamp` boʻyicha yoshini tekshiring.
5. `JSON.stringify({ signed_message, authors, timestamp })` qiymatining sha256 xeshini hisoblang.
6. Ochiq kalitni `signatures[0]` va shu xeshdan tiklang.
7. `authors[0]` hisobini Hive blokcheynidan aynan hozir oʻqing, chunki foydalanuvchilar kalitlarini oʻzgartirishi mumkin. Tiklangan kalit uning joriy posting yoki active kalitlaridan biri boʻlishi kerak. `/api/oauth2/token` dan kelgan tokenni esa @hivesigner imzolaydi: bunday tokenlar uchun @hivesigner hisobining joriy posting kalitini qabul qiling.

Node.js'da, `PrivateKey`, `PublicKey`, `Signature` va `callRPC` funksiyalarini `@ecency/sdk/hive` ostida eksport qiladigan [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk) bilan:

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

Uni shunday ishlating:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

dhive kutubxonasi (`@hiveio/dhive`) ham yaraydi: xeshni `cryptoUtils.sha256(message)` bilan hisoblang va kalitni `Signature.fromString(signatures[0]).recover(digest).toString()` bilan tiklang.

## Tokenlarni xavfsiz saqlang {#keep-tokens-safe}

Posting tokeni kimning qoʻlida boʻlsa, u token muddati tugagunicha ilovangiz orqali foydalanuvchi nomidan tranzaksiya yubora oladi. Unga parol kabi munosabatda boʻling.

- **Tokenlarni serveringizda saqlang** yoki httpOnly va Secure cookie'da saqlang. Yangilash tokenlarini va mijoz maxfiy kalitini faqat serverda saqlang.
- **Tokenni hech qachon jurnalga yoziladigan URL manziliga qoʻymang.** Token oqimi tokenni callback manzilingizning soʻrov qatorida yetkazadi. Uni serveringizda oʻqing, soʻngra tokensiz manzilga yoʻnaltiring. Callback manzilining soʻrov qatorini jurnallaringizdan tashqarida qoldiring.
- **Callback sahifangizda boshqa saytlardan hech narsa yuklamang**, shunda tokenli manzil ularga yuborilmaydi. Oʻsha sahifadagi `Referrer-Policy: no-referrer` sarlavhasi yordam beradi.
- **Tokenni faqat oʻz serveringizga va `https://hivesigner.com/api/` manziliga yuboring.**

## Chiqish va ruxsatni olib tashlash {#sign-out}

- **Foydalanuvchini chiqarish** tokenni tashlab yuborish demakdir: uni sessiyangizdan yoki cookie'ngizdan oʻchiring. Hivesigner'ga foydalanuvchi chiqqanini bildirish uchun [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) manzilini ham chaqirishingiz mumkin. Ilovangiz baribir tokenni oʻzi tashlab yuboradi.
- **Ilovangiz ruxsatini butunlay uzish** foydalanuvchining tanlovi. https://hivesigner.com/authorized-apps sahifasida yoki `https://hivesigner.com/revoke/APP` manzilida u ilova hisobingizni blokcheyndagi posting vakolatidan chiqaradi. Shundan keyin API ilovangiz orqali uning nomidan tranzaksiya yubormaydi.
