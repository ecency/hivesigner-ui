Baʼzi ilovalarga odamning Hive'da kimligini bilishning oʻzi kifoya. Ular uning nomidan hech qachon post joylamaydi, ovoz bermaydi va hech narsa yubormaydi. Hivesigner odamlarni bunday ilovaga hech qanday posting vakolatisiz kiritishi mumkin. Foydalanuvchi Hive hisobini nazorat qilishini isbotlaydi. Ilovangiz uning nomini bilib oladi. Bu sahifa buning ikki yoʻlini va natijani xavfsiz tekshirishni koʻrsatadi.

## Ikki yoʻl {#two-ways}

- **Ilova hisobi bilan:** ilovangizning oʻz Hive hisobi bor va u `scope=login` soʻraydi. Token sizning ilovangizni koʻrsatadi.
- **Ilova hisobisiz:** oʻz Hive hisobi yoʻq sayt faqat `redirect_uri` yuboradi. Token hech qanday ilovani koʻrsatmaydi. Saytingiz uni oʻzi tekshiradi.

Ularning hech biri foydalanuvchidan yoki ilova hisobingizdan ruxsat talab qilmaydi, shuning uchun foydalanuvchi hisobida hech narsa oʻzgarmaydi. Hivesigner kirishni posting kaliti bilan imzolaydi, qurilmada bu hisob uchun posting kaliti boʻlmasa, active kaliti bilan imzolaydi.

## Ilova hisobi bilan {#app-account}

1. [Ilovangizni roʻyxatdan oʻtkazing](/docs/register-app): uning Hive hisobini yarating va callback manzillaringizni roʻyxatlang. Mijoz maxfiy kaliti ham, @hivesigner ruxsati ham kerak emas.
2. Foydalanuvchini quyidagi manzilga yuboring:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. Foydalanuvchi «APP ilovasiga kirish» ekranini koʻradi, unda **Ruxsat doirasi** qismida «Hisobingizning foydalanuvchi nomini koʻrish» deb yozilgan. U **Kirish** tugmasini tanlaydi.
4. Hivesigner callback manzilingizga yoʻnaltiradi:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [`state` qiymatini solishtiring](/docs/oauth2#state), soʻngra tokenni tekshiring. Bu sizning ilovangizni koʻrsatadigan `login` tokeni, shuning uchun quyidagilardan istalgani yaraydi:
   - u bilan [`GET /api/me`](/docs/api#me) chaqiruvini bajaring; javobda hisob `user` maydonida va `scope` `["login"]` boʻladi, soʻngra tokenni dekodlab, `type` va `app` qiymatlarini tekshiring ([API'dan soʻrang](/docs/tokens#check-with-the-api));
   - yoki `type: 'login'` va ilovangiz nomi bilan [oʻzingiz tekshiring](/docs/tokens#check-it-yourself).

`login` tokeni tranzaksiya yubora olmaydi: `/api/broadcast` u bilan yuborilgan har bir amalni rad etadi.

## Ilova hisobisiz {#no-app-account}

1. Foydalanuvchini `client_id` siz, faqat `redirect_uri` bilan ruxsat manziliga yuboring:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   Callback manzili `https://` boʻlishi yoki loopback'da `http://` boʻlishi kerak (`localhost`, `127.0.0.1`, `[::1]`). Uni roʻyxatga olish uchun hech qanday roʻyxat yoʻq. Hivesigner bu yerda `scope` va `response_type` qiymatlarini eʼtiborsiz qoldiradi: javob doimo kirish tokeni boʻladi.

2. Foydalanuvchi «HOST Hive foydalanuvchi nomingizni tasdiqlamoqchi.» yozuvini koʻradi; bu yerda HOST sizning callback manzilingizning xosti. U **Kirish** tugmasini tanlaydi.
3. Hivesigner callback manzilingizga yoʻnaltiradi:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [`state` qiymatini solishtiring](/docs/oauth2#state), soʻngra tokenni oʻzingiz tekshiring. API hech qanday ilovani koʻrsatmaydigan tokenni qabul qilmaydi, shuning uchun imzoni hisobning kalitlariga qarab serveringiz tekshiradi. Qarang: [Oʻzingiz tekshiring](/docs/tokens#check-it-yourself), `type: 'login'` bilan va `app` siz.

Agar callback manzili veb-manzil boʻlmasa yoki loopback'dan tashqarida oddiy `http://` boʻlsa, Hivesigner soʻrovni rad etadi va foydalanuvchiga sababini aytadi.

## Qaysi birini tanlash {#which-one}

| | Ilova hisobi bilan | Ilova hisobisiz |
| --- | --- | --- |
| Foydalanuvchi nimani koʻradi | Ilovangizning nomi, rasmi va Hive hisobi | Faqat saytingizning xostini |
| Sozlash | Callback manzillari roʻyxatlangan Hive hisobi | Kerak emas |
| Token nimani koʻrsatadi | Sizning ilovangizni | Hech qanday ilovani |
| Tokenni nima bilan tekshirish | `/api/me` yoki oʻz kodingiz | Oʻz kodingiz |
| Keyinchalik posting ruxsati | Xuddi shu hisob: `posting` soʻrang va [@hivesigner'ga ruxsat bering](/docs/register-app#grant-hivesigner) | Avval ilova hisobi kerak |

Imkoni boʻlsa, ilova hisobidan foydalaning. Foydalanuvchilar ilovangizning nomi va rasmini koʻradi. Serveringiz boshqa ilova uchun yaratilgan tokenlarni rad eta oladi. Keyinchalik xuddi shu hisob bilan posting ruxsatiga oʻtishingiz mumkin.

Ikkinchi yoʻlni saytingizda Hive hisobi boʻlmasa va uni xohlamasangiz ishlating.

## Kirishni xavfsiz tekshiring {#check-safely}

- **Soʻrovni `state` bilan bogʻlang.** Har bir kirish uchun tasodifiy qiymat yarating, uni foydalanuvchi sessiyasida saqlang, callback manzilingizda solishtiring va bir marta ishlating. Qarang: [Soʻrovni state bilan himoyalang](/docs/oauth2#state).
- **Turini tekshiring.** Faqat `signed_message.type` qiymati `login` boʻlganini qabul qiling. Kod yoki yangilash tokeni kirish emas.
- **Ilovani tekshiring.** Ilova hisobi bilan `signed_message.app` sizning ilovangiz boʻlishi kerak. Ilova hisobisiz esa `app` umuman boʻlmasligi kerak.
- **Yoshini tekshiring.** Siz tokenni yoʻnaltirishdan soʻng darhol tekshirasiz, shuning uchun uni faqat `timestamp` qiymatidan keyingi bir necha daqiqa ichida qabul qiling (masalan, 5 daqiqa, soat farqiga bir daqiqa qoʻshib).
- **Har bir tokenni bir marta ishlating.** Muvaffaqiyatli tekshiruvdan keyin oʻz sessiyangizni boshlang (masalan, httpOnly cookie bilan) va Hivesigner tokenini tashlab yuboring. Qabul qilgan tokenlaringizni ular yosh tekshiruvidan oʻtolmaydigan darajada eskirgunicha yozib boring. Ikkinchi marta koʻrganingizni rad eting.
- **Tokenni jurnallardan tashqarida saqlang.** U callback manzilingizning soʻrov qatorida keladi. Qarang: [Tokenlarni xavfsiz saqlang](/docs/tokens#keep-tokens-safe).

## Misollar {#examples}

https://hivesearcher.com va https://openhive.chat kabi saytlar odamlarga qidiruv va chat kabi blokcheyndan tashqaridagi imkoniyatlar uchun Hive hisobi bilan kirish imkonini beradi. Ularga odamning kimligini bilish kifoya, bundan ortigʻi kerak emas.
