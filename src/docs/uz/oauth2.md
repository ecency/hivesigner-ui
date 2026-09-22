Odamlarni ilovangizga kirish uchun Hivesigner'ga yuboring. Ular u yerda soʻrovingizni koʻrib chiqadi va tasdiqlaydi. Soʻngra Hivesigner ularni callback manzilingizga token bilan (token oqimi) yoki serveringiz tokenlarga almashtiradigan kod bilan (kod oqimi) qaytaradi. Bu sahifa ikkala oqimni, har bir parametrni va ruxsat doiralarini qamrab oladi.

## Boshlashdan oldin {#before-you-start}

- Ilovangizni roʻyxatdan oʻtkazing: uning uchun Hive hisobi, callback manzillari roʻyxatlangan holda. Qarang: [Ilovangizni roʻyxatdan oʻtkazing](/docs/register-app).
- API orqali tranzaksiya yuborish uchun ilova hisobingiz yana [@hivesigner'ga posting vakolatini berishi](/docs/register-app#grant-hivesigner) kerak.
- Kod oqimi uchun [mijoz maxfiy kalitini](/docs/register-app#client-secret) belgilang.

## Ruxsat manzili {#authorize-url}

Foydalanuvchini shu manzilga yuboring:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Har bir qiymatni URL uchun kodlang. `URLSearchParams` buni siz uchun bajaradi:

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

### Parametrlar {#parameters}

| Parametr | Majburiy | Nima qiladi |
| --- | --- | --- |
| `client_id` | Ilova uchun ha | Ilova hisobingizning nomi. `clientId` ham oʻqiladi. Usiz soʻrov Hive hisobi yoʻq saytdan kelgan faqat kirish soʻroviga aylanadi: qarang: [Posting ruxsatisiz kirish](/docs/login-only). |
| `redirect_uri` | Ha | Hivesigner foydalanuvchini qayerga qaytarishi. U ilovangizning Yoʻnaltirish URI manzillaridan biriga aynan mos boʻlishi kerak. Qarang: [Callback manzillari](/docs/register-app#callbacks). |
| `scope` | Yoʻq | `login`, `posting` yoki `offline`. Qarang: [Ruxsat doiralari](#scopes). Usiz soʻrov posting ruxsatini soʻraydi. |
| `response_type` | Yoʻq | `code` qiymati [kod oqimini](#code-flow) boshlaydi. Boshqa har qanday qiymat yoki uning yoʻqligi [token oqimini](#token-flow) bildiradi. |
| `state` | Tavsiya etiladi | Hivesigner oʻzgartirmasdan qaytaradigan tasodifiy qiymat. Qarang: [Soʻrovni state bilan himoyalang](#state). |
| `account` | Yoʻq | Hive foydalanuvchi nomi. Bu hisob foydalanuvchining qurilmasida boʻlsa, Hivesigner uni tanlaydi. Boʻlmasa eʼtiborsiz qoldiradi. `select_account` ham oʻqiladi. |

Foydalanuvchi ruxsat ekranida baribir boshqa hisobga oʻtishi mumkin. Hisobni doimo tokendan yoki kod almashinuvidan oling, hech qachon siz soʻragan narsadan emas.

## Ruxsat doiralari {#scopes}

Hive'da bitta posting vakolati bor. Shuning uchun Hivesigner'da ikkita ruxsat darajasi mavjud, faqat kirish va posting, ular orasida esa undan mayda narsa yoʻq.

| `scope` | Foydalanuvchi nimani tasdiqlaydi | Oqim | Kirish tokenining `type` qiymati |
| --- | --- | --- | --- |
| `login` | «Hisobingizning foydalanuvchi nomini koʻrish». Hech qanday vakolat berilmaydi. | Token oqimi (`response_type=code` qoʻshmang) | `login` |
| `posting` | Posting ruxsati. Birinchi marta bu ilova hisobingizni foydalanuvchining posting vakolatiga qoʻshadi. | Token oqimi yoki `response_type=code` bilan kod oqimi | `posting` |
| `offline` | Yuqoridagidek posting ruxsati | Kod oqimi | `refresh` tokeni bilan birga `posting` |

Kod oqimida callback avval kodni oladi (`type` qiymati `code` boʻlgan token), serveringiz esa uni kirish tokeniga almashtiradi.

- **Ruxsat doirasi koʻrsatilmasa** bu `posting` degani.
- **Ichida `offline` soʻzi** biror joyda uchraydigan qiymat `offline` degani, masalan eski `offline,vote,comment`.
- **Boshqa har qanday qiymat** `posting` degani. Bunga `vote`, `comment`, `vote,comment`, `comment_options` yoki `custom_json` kabi eski amal nomlari ham kiradi. Ular tokenni cheklamaydi: har bir posting tokeni bir xil amallarga ruxsat beradi. Qarang: [broadcast nimani qabul qiladi](/docs/api#broadcast-rules).

Ilovangizga faqat foydalanuvchi kimligini bilish kerak boʻlsa, `login` soʻrang. Qarang: [Posting ruxsatisiz kirish](/docs/login-only).

## Token oqimi {#token-flow}

Foydalanuvchining brauzeri kirish tokenini bevosita oladi. Ilovangizga hech qanday maxfiy kalit kerak emas.

1. Foydalanuvchini ruxsat manziliga yuboring:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. Foydalanuvchi tasdiqlaydi. Hivesigner callback manzilingizga yoʻnaltiradi:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner oʻz parametrlarini callback manzilingizda soʻrov qatori boʻlmasa `?` bilan, boʻlsa `&` bilan qoʻshadi. `state` faqat siz boʻsh boʻlmagan qiymat yuborgan boʻlsangiz boʻladi.

3. Callback manzilingizda avval [`state` qiymatini solishtiring](#state). Soʻngra [tokenni tekshiring](/docs/tokens#check-a-token) va buni serveringizda bajaring. Token qaysi hisobga tegishli ekani tokenning oʻzida bor: faqat `username` parametriga tayanmang, chunki URL manzilini har kim oʻzgartira oladi.
4. Tokenni serveringizda yoki httpOnly cookie'da saqlang. Token manzil satridan yoʻqolishi uchun toza manzilga yoʻnaltiring.
5. Tokendan `expires_in` sekunddan (7 kun) keyin muddati tugagunicha [API](/docs/api) bilan foydalaning. Soʻngra foydalanuvchini yana ruxsat manziliga yuboring. Posting ruxsatini avval bergan foydalanuvchi «APP ilovasiga kirish» va «Siz @myapp ilovasiga avval ruxsat bergansiz. Yangi ruxsat berilmaydi.» yozuvlarini koʻradi.

## Kod oqimi {#code-flow}

Serveringiz kodni oladi va uni kirish tokeni hamda yangilash tokeniga almashtiradi. Keyin ularni foydalanuvchisiz yangilay oladi. Serveringiz foydalanuvchilar nomidan uzoq vaqt ish koʻradigan boʻlsa, shundan foydalaning.

1. Foydalanuvchini `scope=offline` bilan ruxsat manziliga yuboring:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` ham xuddi shu ishni qiladi.

2. Foydalanuvchi posting ruxsatini tasdiqlaydi. Hivesigner callback manzilingizga yoʻnaltiradi:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [`state` qiymatini solishtiring](#state). Soʻngra kodni darhol, serveringizdan almashtiring.

### Kodni almashtiring {#exchange-code}

Kodni va mijoz maxfiy kalitingizni POST soʻrovining tanasida `/api/oauth2/token` manziliga yuboring:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

Javob:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Xuddi shu chaqiruv Node.js 18 yoki undan yangi versiyasida:

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

- Kod va maxfiy kalitni soʻrov tanasiga qoʻying, hech qachon URL manziliga emas.
- Bu soʻrov bilan `Authorization` sarlavhasini yubormang.
- Shu javobdagi `username` qiymatidan foydalaning. U foydalanuvchi imzolagan koddan keladi.
- Kirish tokenini va yangilash tokenini serveringizda saqlang.

### Yangilash {#refresh}

Kirish tokenining muddati tugaganda, yangilash tokenini mijoz maxfiy kalitingiz bilan xuddi shu manzilga yuboring:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

Javob xuddi shu shaklda boʻladi, unda yangi kirish tokeni va yangi yangilash tokeni boʻladi. Ikkalasini eskilarining oʻrniga saqlang.

## Soʻrovni state bilan himoyalang {#state}

`state` boʻlmasa, boshqa sayt foydalanuvchingizni oʻzi tanlagan token yoki kod bilan callback manzilingizga yuborishi mumkin. Shunda ilovangiz foydalanuvchini boshqa birovning hisobiga kiritgan boʻlardi. `state` har bir qaytishni kirishni boshlagan brauzerga bogʻlaydi.

1. Har bir kirish uchun tasodifiy qiymat yarating, kamida 16 tasodifiy bayt. Oʻn oltilik yozuvda kodlash talab qiladigan belgilar boʻlmaydi.
2. Uni faqat shu brauzer qaytadan koʻrsata oladigan joyda saqlang: server sessiyangizda yoki `SameSite=Lax` belgilangan, qisqa muddatli httpOnly va Secure cookie'da.
3. Uni ruxsat manzilida `state` sifatida yuboring.
4. Callback manzilingizda `state` parametrini saqlangan qiymat bilan solishtiring. Agar u yoʻq boʻlsa yoki boshqacha boʻlsa, toʻxtang: na tokendan, na koddan foydalaning.
5. Saqlangan qiymatni oʻchiring, shunda har biri bir marta ishlaydi.

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

Hivesigner oʻzi olgan `state` qiymatini aynan qaytaradi. Boʻsh qiymatni esa tashlab ketadi.

## Foydalanuvchi nimani koʻradi {#what-the-user-sees}

Ruxsat ekrani ilovangizning rasmi va nomini, «Hive hisobi @myapp» hamda «Sizni HOST manziliga yoʻnaltiradi» yozuvlarini koʻrsatadi; HOST callback manzilingizdan olinadi. Soʻngra:

- **Birinchi posting soʻrovi.** Sarlavhada «APP hisobingizga kirish uchun ruxsat soʻramoqda.» deb yoziladi. **Ruxsat doirasi** kartasi ilovangiz nima qila olishini roʻyxatlaydi. Bildirishnomada «Birinchi marta ruxsat berish: bu amal @myapp hisobini blokcheyndagi posting vakolatingizga qoʻshadi va bir marta active kalitingizni talab qiladi. Siz ruxsatni bekor qilmaguningizcha bu hisob sizning nomingizdan post joylay oladi.» deb yoziladi. Tugmada **Ruxsat berish** deb yoziladi. Foydalanuvchining qurilmasida bu hisob uchun active kalit boʻlmasa, ekran uni shu yerning oʻzida soʻraydi.
- **Kirish.** `scope=login` uchun yoki foydalanuvchi avval bergan posting ruxsati uchun sarlavhada «APP ilovasiga kirish», tugmada esa **Kirish** deb yoziladi.
- **Hisob.** «Ruxsat beruvchi hisob» yoki «Kiruvchi hisob», keyin esa tanlangan hisob keladi. Foydalanuvchi hisobni shu yerda almashtira oladi.
- **Qulflangan hisob.** Tugma ustida kirish kodi maydoni turadi. Bir marta bosish hisobni ochadi va davom ettiradi.
- **Qurilmada hisob yoʻq.** Tugmada **Davom etish** deb yoziladi. U hisob qoʻshish shaklini ochadi va soʻrovga qaytaradi.

Birinchi posting soʻrovidan keyin Hivesigner yangi ruxsat blokcheynda koʻringunicha kutadi va shundan keyingina yoʻnaltiradi. Bu bir necha sekund davom etishi mumkin. Ekranni toʻliq foydalanuvchi tomonidan koʻrish uchun qarang: [Ilovalarga kirish](/docs/signing-in).

## Bekor qilish va rad etilgan soʻrovlar {#cancel}

- **Bekor qilish.** Foydalanuvchi Hivesigner'dagi hisoblar roʻyxatiga oʻtadi. Callback manzilingizga hech narsa yuborilmaydi: xato parametri ham boʻlmaydi. Kirish tugmangizni ochiq qoldiring, toki foydalanuvchi qaytadan boshlay olsin. Qaytishni kutib turmang.
- **Rad etilgan soʻrovlar.** Roʻyxatdan oʻtkazilmagan callback manzili, nomaʼlum `client_id` yoki yetishmayotgan `redirect_uri` Hivesigner'da xato va **Bu muammo haqida xabar berish** tugmasini koʻrsatadi. Callback manzilingizga hech narsa yuborilmaydi. Qarang: [Nimadir notoʻgʻri boʻlganda foydalanuvchilar nimani koʻradi](/docs/register-app#refused-requests).

## Eski kirish soʻrovi manzili {#legacy-login-request}

Hivesigner eski kirish manzilini hamon qabul qiladi; u eski integratsiyalar uchun saqlangan. Yangilari uchun `/oauth2/authorize` dan foydalaning.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

U xuddi shu ruxsat ekranini, xuddi shu callback tekshiruvlari va xuddi shu yoʻnaltirish bilan ochadi. Parametrlarini esa boshqacha oʻqiydi:

- `scope` bu `login` yoki `posting`. Boshqa har qanday qiymat yoki uning yoʻqligi `login` degani.
- `offline` oʻqilmaydi. Kod oqimi uchun `response_type=code` qoʻshing.
- `account` oʻqilmaydi.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` xuddi shu qoidalarga amal qiladi.
