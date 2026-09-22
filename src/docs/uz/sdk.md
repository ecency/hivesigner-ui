Rasmiy JavaScript SDK kirish manzillarini va imzo havolalarini siz uchun tuzadi hamda Hivesigner API'sini chaqiradi. Python uchun jamoa kutubxonalari mavjud. Boshqa har qanday til [REST API](/docs/api) ga bevosita murojaat qilishi mumkin.

## JavaScript SDK {#javascript}

SDK bu `hivesigner` nomli npm paketi. Uning manba kodi https://github.com/ecency/hivesigner-sdk manzilida. U TypeScript'da yozilgan va oʻz turlari bilan birga keladi.

4-versiya Node.js 18 yoki undan yangi versiyasini talab qiladi, chunki u ichki `fetch` funksiyasidan foydalanadi. Brauzerlarda unga ES2017 yoki undan yangi standart kerak. Global `fetch` yoʻq joyda SDK'dan foydalanishdan oldin polyfill qoʻshing. Eskiroq Node.js'da 3-versiyada qoling.

### Oʻrnatish {#install}

```bash
npm install hivesigner
```

Yigʻish bosqichi yoʻq sahifa uchun brauzer bandlini yuklang. U `hivesigner` nomli global oʻzgaruvchini aniqlaydi:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Mijoz yarating {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Parametr | Maʼnosi |
| --- | --- |
| `app` | Ilova hisobingiz, `client_id` sifatida yuboriladi. |
| `callbackURL` | Hivesigner foydalanuvchini qayerga qaytarishi. U ilovangizning callback manzillaridan biriga harfma-harf mos boʻlishi kerak (oddiy http loopback manzili xost va port boʻyicha farq qilishi mumkin, qarang: [Callback manzillari](/docs/register-app#callback-rules)). |
| `scope` | Roʻyxat; vergullar bilan birlashtirilib, `scope` parametriga qoʻyiladi. Qarang: [Ruxsat doiralari](/docs/oauth2#scopes). |
| `responseType` | Kod oqimi uchun `'code'`. Token oqimida uni koʻrsatmang. |
| `accessToken` | Foydalanuvchining kirish tokeni, agar u sizda allaqachon boʻlsa. |
| `apiURL` | API manbai. SDK unga `/api/` qoʻshadi. Standart qiymati `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` va `setApiURL` mijozni keyinroq oʻzgartiradi. Ularning har biri mijozni qaytaradi.

### Foydalanuvchini tizimga kiriting {#sign-in}

`getLoginURL(state, account)` kirish manzilini qaytaradi:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` callback manzilingizga oʻzgarmasdan qaytadi. Undan javobni soʻrovga bogʻlash uchun foydalaning.
- `account` ixtiyoriy: foydalanuvchi nomi. Hivesigner bu hisob qurilmada boʻlsa uni tanlaydi, boʻlmasa eʼtiborsiz qoldiradi.

Brauzerda `client.login({ state: 'STATE' })` foydalanuvchini xuddi shu manzilga, hisobsiz yuboradi.

Token oqimida callback manzilingiz `access_token`, `expires_in` va `username` qiymatlarini oladi. Tokenni mijozga bering:

```js
client.setAccessToken('ACCESS_TOKEN');
```

SDK'da kod oqimidagi almashinuv uchun usul yoʻq. Serveringiz kod va mijoz maxfiy kalitini API'ga oʻzi yuboradi, buni [Kodni almashtiring](/docs/oauth2#exchange-code) koʻrsatadi.

### Foydalanuvchini oling {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` bu blokcheyn qaytargan koʻrinishdagi foydalanuvchining Hive hisobi. `scope` token nimaga ruxsat berishini roʻyxatlaydi.

### Tranzaksiya yuboring {#broadcast}

`broadcast(operations)` amallarni API'ga yuboradi, API esa ularni foydalanuvchi nomidan tarmoqqa uzatadi. API faqat token foydalanuvchisi yozgan posting amallarini qabul qiladi: `vote`, `comment`, `delete_comment`, `comment_options`, posting vakolati bilan `custom_json`, `claim_reward_balance` va profil maʼlumotlari uchun `account_update2`. Qarang: [broadcast nimani qabul qiladi](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Har bir amalda foydalanuvchini koʻrsating. API `__signer` ni almashtirmaydi.

Bu yordamchilar bittadan amal tuzadi va `broadcast` ni chaqiradi:

| Usul | Nimani yuboradi |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` `-10000` dan `10000` gacha (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Yangi post uchun `parentAuthor` bu `''`. `jsonMetadata` obyekt boʻlishi mumkin: SDK uni satrga aylantiradi. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. `requiredAuths` sifatida `[]`, `requiredPostingAuths` sifatida `['USERNAME']` yuboring. `json` bu satr. |
| `reblog(account, author, permlink)` | Postni qayta ulashadigan, id qiymati `follow` boʻlgan `custom_json` |
| `follow(follower, following)` | id qiymati `follow` va `what: ['blog']` boʻlgan `custom_json` |
| `unfollow(unfollower, unfollowing)` | id qiymati `follow` va `what: []` boʻlgan `custom_json` |
| `ignore(follower, following)` | id qiymati `follow` va `what: ['ignore']` boʻlgan `custom_json` (ovozini oʻchirish) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Summalar `'0.000 HIVE'`, `'0.000 HBD'` va `'1.000000 VESTS'` kabi satrlar. |

`updateUserMetadata()` eskirgan. Foydalanuvchi profilini oʻzgartirish uchun yangi `posting_json_metadata` bilan `account_update2` yuboring.

### Tizimdan chiqing {#log-out}

`revokeToken()` bu SDK'ning chiqish chaqiruvi. U tokenni API'ning bekor qilish manziliga yuboradi va soʻngra uni mijozdan olib tashlaydi. Chaqiruv rad etilganda `removeAccessToken()` ni oʻzingiz chaqiring. Tokenni ilovangiz saqlagan joydan ham oʻchiring.

Ilovangiz ruxsatini butunlay tugatish uchun foydalanuvchi uni https://hivesigner.com/authorized-apps sahifasida olib tashlaydi. Qarang: [Ilova ruxsatini koʻrish va olib tashlash](/docs/signing-in#remove-access).

### Imzo havolalari {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` va `sendTransaction(tx, params)` `https://hivesigner.com/sign/...` havolasini qaytaradi. `params` `callback`, `no_broadcast` va `signer` qiymatlarini oladi. Qarang: [Imzo havolalari](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

TypeScript'da turlar uchinchi argumentni talab qiladi: havolani qaytarib olish uchun `undefined` yuboring.

Brauzerda havolani buning oʻrniga yangi ilovachada ochish uchun uchinchi argument sifatida funksiya yuboring. Bu funksiya chaqirilmaydi va hech narsa qaytmaydi. Uni bosish ishlovchisidan chaqiring, aks holda brauzer yangi ilovachani bloklashi mumkin va chaqiruv xato beradi.

### Promise'lar va callback'lar {#promises-and-callbacks}

`me`, `broadcast`, yordamchilar va `revokeToken` promise qaytaradi. Buning oʻrniga callback ishlatish uchun oxirgi argument sifatida funksiya yuboring. U `(error, result)` ni oladi.

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

API xato bilan javob berganda promise API'ning xato tanasi, `{ error, error_description }` bilan rad etiladi. Callback bilan esa oʻsha tana `error` argumenti boʻladi. Javob JSON boʻlmasa, promise tahlil xatosi bilan rad etiladi.

## Python {#python}

Bu kutubxonalar jamoadan keladi. Ularni Hivesigner jamoasi emas, mualliflari yuritadi. Ularga tayanishdan oldin [REST API](/docs/api) bilan solishtirib koʻring.

| Kutubxona | Muallif |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, `beem.hivesigner` moduli: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
