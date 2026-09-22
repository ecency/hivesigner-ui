Hivesigner odamlarga Hive hisobini sizning ilovangizda ishlatish imkonini beradi va buning uchun ilovangizga kalitlarini bermaydi. Uning ikkita qismi bor: https://hivesigner.com manzilidagi brauzer imzolovchisi va `https://hivesigner.com/api/` manzilidagi API. Bu sahifa har bir qism nima qilishini va ilova ularni qanday ikki yoʻl bilan ishlatishini tushuntiradi.

## Brauzer imzolovchisi {#browser-signer}

Brauzer imzolovchisi bu Hivesigner veb-sayti. Odamlar Hive hisoblarini unga qoʻshadi. Kalitlari oʻz brauzerlarida qoladi: Hivesigner hech bir kalitni hech bir serverga yubormaydi. Sizning ilovangiz ularni hech qachon koʻrmaydi.

Imzolovchi uch xil narsani imzolaydi va har safar foydalanuvchi nimani imzolayotganini avval koʻradi:

- **Kirish tokenlari.** Ilovangiz odamni tizimga kirish uchun Hivesigner'ga yuboradi. Hivesigner ilovangiz nomini va nima soʻrayotganini koʻrsatadi. Foydalanuvchi tasdiqlaganida Hivesigner uning kaliti bilan qisqa bayonotni imzolaydi; unda uning hisobi va sizning ilovangiz koʻrsatiladi. Imzolangan shu bayonot ilovangiz oladigan tokendir. Qarang: [OAuth2 orqali kirish](/docs/oauth2) va [Tokenlar](/docs/tokens).
- **Tranzaksiyalar.** Imzo havolasi tranzaksiyani koʻrib chiqish uchun ochadi. Foydalanuvchi tasdiqlaganida Hivesigner uni kerakli kalit bilan imzolaydi. Agar havola faqat imzo soʻramasa, uni brauzerdan Hive tarmogʻiga yuboradi. Qarang: [Imzo havolalari](/docs/sign-links).
- **Xabarlar.** Ilovangiz foydalanuvchidan hisobni nazorat qilishini isbotlash uchun matnni kaliti bilan imzolashni soʻrashi mumkin. Qarang: [Xabar imzolash](/docs/message-signing).

## API {#api}

API ilovangizga kirgan foydalanuvchi nomidan posting darajasidagi amallarni tarmoqqa yuboradi: postlar va izohlar, ovozlar, obunalar va boshqa `custom_json` amallari, mukofotlarni olish hamda profil yangilanishlari. Ilovangiz amallarni foydalanuvchi tokeni bilan birga yuboradi. API tokenni tekshiradi, tranzaksiyani @hivesigner hisobining posting kaliti bilan imzolaydi va uni Hive tarmogʻiga yuboradi.

API yana tizimga kirgan foydalanuvchining hisobini qaytaradi, kodlarni tokenlarga almashtiradi va Hivesigner'dan foydalanadigan ilovalarni roʻyxatlaydi. Qarang: [REST API](/docs/api).

## Posting vakolati zanjiri {#authority-chain}

Hive'da bir hisob boshqa hisobga oʻzining posting vakolati bilan ish koʻrishga ruxsat bera oladi. API shunday ruxsatlarning ikkitasiga tayanadi:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **Foydalanuvchi ilovangiz hisobini oʻz posting vakolatiga qoʻshadi.** Ruxsat ekrani buni foydalanuvchi ilovangizga birinchi marta posting ruxsatini berganida bajaradi. Buning uchun bir marta foydalanuvchining active kaliti kerak boʻladi.
2. **Ilovangiz hisobi @hivesigner'ni oʻz posting vakolatiga qoʻshadi.** Buni siz bir marta, [ilovangizni roʻyxatdan oʻtkazayotganingizda](/docs/register-app#grant-hivesigner) bajarasiz.

API yuborishdan oldin ikkala ruxsat ham joyida ekanini tekshiradi. U faqat tokenda koʻrsatilgan foydalanuvchi yozgan amallarni yuboradi.

Foydalanuvchi ilovangiz ruxsatini istalgan vaqtda https://hivesigner.com/authorized-apps sahifasida olib tashlashi mumkin. Shundan keyin API ilovangiz orqali uning nomidan post joylay olmaydi.

## Integratsiyaning ikki yoʻli {#two-ways-to-integrate}

### Kirish, soʻngra API orqali yuborish {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

Foydalanuvchi bir marta tasdiqlaydi. Shundan keyin ilovangiz token muddati tugagunicha yoki foydalanuvchi ruxsatni olib tashlagunicha uning nomidan ovoz bera oladi, izoh yoza oladi va post joylay oladi. Buni kundalik ijtimoiy amallar uchun ishlating.

Sizga roʻyxatdan oʻtkazilgan callback manzillari va @hivesigner ruxsati bor ilova hisobi kerak. Qarang: [Ilovangizni roʻyxatdan oʻtkazing](/docs/register-app). Agar siz faqat foydalanuvchi kimligini bilmoqchi boʻlsangiz, qarang: [Posting ruxsatisiz kirish](/docs/login-only).

### Imzo havolalari {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

Foydalanuvchi har bir tranzaksiyani imzolanishidan oldin koʻradi. Imzo havolalari Hive'ning 41 ta amalini qamrab oladi, shu jumladan active kalit talab qiladigan pul oʻtkazmalari va hamyon bilan bogʻliq boshqa amallarni ham. API ularni hech qachon bajarmaydi. Imzo havolalari uchun ilova hisobi kerak emas. Qarang: [Imzo havolalari](/docs/sign-links).

### Qaysi birini tanlash kerak {#which-to-choose}

- **Tez-tez takrorlanadigan posting amallari** (ovozlar, izohlar, obunalar): OAuth2 orqali kiring, soʻngra API'dan foydalaning.
- **Hamyon amallari** yoki active kalit talab qiladigan har qanday narsa: imzo havolalaridan foydalaning.
- **Ikkalasi ham**: koʻp ilovalar ijtimoiy imkoniyatlar uchun OAuth2 orqali kirishni, pul oʻtkazmalari uchun esa imzo havolalarini ishlatadi.
- **Faqat foydalanuvchi kimligi**: qarang: [Posting ruxsatisiz kirish](/docs/login-only).

## Manba kodi {#source-code}

Hivesigner ochiq kodli:

- Brauzer imzolovchisi: https://github.com/ecency/hivesigner-ui
- API: https://github.com/ecency/hivesigner-api
- JavaScript SDK (npm paketi `hivesigner`): https://github.com/ecency/hivesigner-sdk. Qarang: [SDK](/docs/sdk).
