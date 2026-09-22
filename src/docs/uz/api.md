Hivesigner API'si `https://hivesigner.com/api/` manzilida joylashgan. U tizimga kirgan foydalanuvchining hisobini qaytaradi, uning nomidan posting amallarini tarmoqqa yuboradi, kodlarni tokenlarga almashtiradi va Hivesigner'dan foydalanadigan ilovalarni roʻyxatlaydi. Bu sahifa har bir manzilni soʻrovlari, javoblari va xatolari bilan tavsiflaydi.

## Soʻrovlar va autentifikatsiya {#authentication}

- **Asosiy manzil:** `https://hivesigner.com/api/`. Quyidagi har bir manzil `https://hivesigner.com` ga nisbatan beriladi.
- **Token:** uni `Authorization` sarlavhasida qanday boʻlsa shundayligicha yuboring: `Authorization: ACCESS_TOKEN`. `Bearer ` prefiksi ham qabul qilinadi. Uni soʻrov qatorida yoki tanada `access_token` sifatida ham yuborishingiz mumkin, ammo sarlavha tokenni URL manzillari va jurnallardan tashqarida saqlaydi.
- **Tanalar:** `Content-Type: application/json` bilan JSON yoki forma (`application/x-www-form-urlencoded`).
- **Javoblar:** JSON.
- **Brauzerlar:** API domenlararo soʻrovlarga ruxsat beradi, shuning uchun veb-ilova uni bevosita chaqira oladi.

Token olish uchun qarang: [OAuth2 orqali kirish](/docs/oauth2). Token nimalarni saqlashi haqida qarang: [Tokenlar](/docs/tokens).

## Xatolar {#errors}

Xato javobi HTTP xato holatiga va shunday tanaga ega boʻladi:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Holat | `error` | Qachon |
| --- | --- | --- |
| 401 | `invalid_grant` | Token yoʻq yoki yaroqsiz, yoki u bu manzil uchun notoʻgʻri turdagi («The token has invalid role»). `/api/oauth2/token` da yana «The code or secret is not valid». |
| 401 | `invalid_scope` | `/api/broadcast`: token ruxsat bermaydigan amal. Tavsifda amallar nomi koʻrsatiladi. |
| 401 | `unauthorized_client` | `/api/broadcast`: muallifi token foydalanuvchisi boʻlmagan amal, kalitlarga tegadigan `account_update2`, yetishmayotgan posting vakolati ruxsati yoki yuklab boʻlmagan hisob. Tavsif qaysi biri ekanini aytadi. |
| 500 | `server_error` | `/api/broadcast`: Hive tarmogʻi tranzaksiyani rad etdi. `error_description` uning xabarini olib keladi. |
| 503 | `unavailable` | `/api/apps`: katalog hali tuzilmoqda. |

## GET /api/me {#me}

Token tegishli boʻlgan hisobni qaytaradi. Undan kim kirganini bilish yoki [tokenni tekshirish](/docs/tokens#check-with-the-api) uchun foydalaning.

- **Usullar:** `GET` yoki `POST`.
- **Token:** kirish tokeni, shu jumladan ilovani koʻrsatadigan `login` tokeni.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Qisqartirilgan javob:

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

| Maydon | Maʼnosi |
| --- | --- |
| `user` | Token tegishli boʻlgan Hive foydalanuvchi nomi. `_id` va `name` ham shu qiymatni takrorlaydi. |
| `account` | Hive'ning `condenser_api.get_accounts` chaqiruvi qaytargan koʻrinishdagi butun hisob. |
| `scope` | Token nimaga ruxsat berishi: kirish tokeni uchun `["login"]`, aks holda `/api/broadcast` qabul qiladigan amallar. |
| `user_metadata` | Hisobning profil maʼlumotlari, JSON'dan ajratib olingan. |

`/api/me` token qaysi ilova uchun yaratilganini aytmaydi. Buni tekshirish uchun tokenni dekodlang: qarang: [API'dan soʻrang](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Token foydalanuvchisi uchun posting amallarini @hivesigner posting kaliti bilan imzolaydi va ularni Hive tarmogʻiga yuboradi.

- **Usul:** `POST`.
- **Token:** token oqimidan yoki kod oqimidan olingan `posting` kirish tokeni.
- **Avval nima boʻlishi kerak:** foydalanuvchi ilova hisobingizga posting vakolatini bergan boʻlishi (buni ruxsat ekrani bajaradi) va ilova hisobingiz [@hivesigner'ga posting vakolatini bergan](/docs/register-app#grant-hivesigner) boʻlishi kerak.
- **Tana:** `{ "operations": [...] }`, bunda har bir amal Hive blokcheynidagidek `[name, fields]` koʻrinishida boʻladi. Bitta soʻrovdagi barcha amallar bitta tranzaksiyaga tushadi.

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

Xuddi shu soʻrov curl bilan:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Obuna bu `custom_json` amali:

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

Hive tuguni tranzaksiyani qabul qilishi bilanoq API javob beradi. `result.id` bu tranzaksiya identifikatori:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Tarmoq tranzaksiyani rad etganda javob `server_error` bilan `500` boʻladi. Uning `error_description` maydoni tarmoq xabarini, `response` esa xom xatoni olib keladi.

### broadcast nimani qabul qiladi {#broadcast-rules}

Posting tokeni API'ga faqat shu amallarni yuborishga ruxsat beradi, boshqasiga emas. Ularning har birida token foydalanuvchisi koʻrsatilgan maydondagi hisob boʻlishi kerak:

| Amal | Token foydalanuvchisi kim boʻlishi kerak |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | `required_posting_auths` dagi birinchi hisob |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Boshqa har qanday amal** `invalid_scope` bilan rad etiladi. `login` tokeni hech qanday amalga ruxsat bermaydi.
- **Boshqa hisob uchun amal** `unauthorized_client` bilan rad etiladi. Token faqat oʻz foydalanuvchisi nomidan tranzaksiya yuboradi.
- **`account_update2`** faqat hisobning profil maʼlumotlarini oʻzgartira oladi. `owner`, `active` yoki `posting` maydoni bor amal `unauthorized_client` bilan rad etiladi.
- **`custom_json`**: `required_auths` maydonini boʻsh qoldiring. API posting vakolati bilan imzolaydi, shuning uchun active vakolat talab qiladigan amal tarmoqda muvaffaqiyatsiz tugaydi.

Pul oʻtkazmalari va hamyon bilan bogʻliq boshqa amallar foydalanuvchining active kalitini talab qiladi. Ularni buning oʻrniga [imzo havolasi](/docs/sign-links) sifatida yuboring.

## POST /api/oauth2/token {#oauth2-token}

Kodni tokenlarga yoki yangilash tokenini yangi tokenlarga almashtiradi. Uni faqat serveringizdan chaqiring. Qarang: [Kod oqimi](/docs/oauth2#code-flow).

- **Usul:** `POST`, qiymatlar tanada.
- **Tana:** `code` va `client_secret` yoki `refresh_token` va `client_secret`.
- **Sarlavhalar:** `Authorization` sarlavhasini yubormang.

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

Har bir chaqiruv yangi kirish tokeni va yangi yangilash tokenini qaytaradi. Ikkalasini ham @hivesigner imzolaydi. `expires_in` bu kirish tokenining sekundlardagi amal qilish muddati (7 kun).

Xatolar: `401 invalid_grant`. Yuborilgan qiymat yaroqli kod yoki yangilash tokeni boʻlmaganda tavsif «The token has invalid role» boʻladi. Kod yoki maxfiy kalit mos kelmaganda esa «The code or secret is not valid» boʻladi.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Hivesigner'ga foydalanuvchi ilovangizdan chiqqanini bildiradi. Tokenni ilovangiz oʻzi tashlab yuboradi.

- **Usul:** `POST`.
- **Token:** kirish tokeni, `Authorization` sarlavhasida.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

JavaScript SDK'sining `revokeToken()` funksiyasi shu chaqiruvni bajaradi va keyin tokenni unutadi. Ilovangiz ruxsatini butunlay olib tashlash uchun foydalanuvchi uni https://hivesigner.com/authorized-apps sahifasida oʻchiradi. Qarang: [Chiqish va ruxsatni olib tashlash](/docs/tokens#sign-out).

## GET /api/apps {#apps}

Ochiq ilovalar katalogi: Hivesigner orqali tranzaksiya yuboradigan ilovalar, ulardan qancha odam foydalanishiga qarab tartiblangan. Unga token kerak emas. https://hivesigner.com/apps xuddi shu roʻyxatni koʻrsatadi.

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

| Maydon | Maʼnosi |
| --- | --- |
| `updated_at` | Katalog oxirgi marta qachon tuzilgani. |
| `building` | Birinchi tuzish maʼlumotga ega boʻlgunicha `true`. Shu vaqtda `apps` boʻsh boʻladi. |
| `window_days` | Tartiblash necha kunni qamrab olishi. |
| `featured` | Avval koʻrsatiladigan foydalanuvchi nomlari, aynan shu tartibda. |
| `apps[].username` | Ilova hisobi. |
| `apps[].name`, `about` | Ilova hisobining profilidan olinadi yoki `null` boʻladi. |
| `apps[].website` | Profildagi veb-sayt, agar u oʻz domenida javob bersa. Aks holda `null`. |
| `apps[].site` | Veb-sayt tekshiruvi natijasi: `ok`, `no_website`, `invalid`, `redirected`, `blocked` yoki `unreachable`. `redirected` yozuvida yana `redirects_to` boʻladi. |
| `apps[].users` | Davr boʻyicha jamlangan kunlik noyob foydalanuvchilar soni. |
| `apps[].requests` | Davr davomida ilova uchun bajarilgan muvaffaqiyatli API soʻrovlari. |
| `apps[].first_seen`, `last_seen` | Hivesigner ilovani birinchi marta qayd etgan kun va u oxirgi marta ishlatilgan kun yoki `null`. |
| `apps[].new` | Ilova davr ichida birinchi marta paydo boʻlgan boʻlsa `true`. |

Javob 5 daqiqagacha keshlanishi mumkin. Katalog birinchi marta tuzilgunicha API `unavailable` bilan `503` javobini beradi. Keyinroq qayta urinib koʻring.

Nomlar va tavsiflarni har bir ilova hisobi oʻzi eʼlon qiladi. Hivesigner ularni tekshirmaydi.
