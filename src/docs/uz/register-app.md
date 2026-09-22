Odamlarni Hivesigner orqali tizimga kiritadigan ilova bu Hive hisobidir. Uning nomi siz yuboradigan `client_id` qiymatidir. Profili Hivesigner oʻqiydigan sozlamalarni saqlaydi: tokenlarni yuborish mumkin boʻlgan callback manzillari va kod oqimi uchun mijoz maxfiy kaliti. API orqali tranzaksiya yuborish uchun ilova hisobi yana @hivesigner'ga posting vakolatini beradi. Bu sahifa har bir qadamni ketma-ket koʻrsatadi.

## Sizga nima kerak {#what-you-need}

| Siz nima qilmoqchisiz | Ilova hisobi va callback manzillari | Mijoz maxfiy kaliti | @hivesigner ruxsati |
| --- | --- | --- | --- |
| Odamlarni kiritish va token oqimi bilan tranzaksiya yuborish | Ha | Yoʻq | Ha |
| Odamlarni kiritish va kod oqimi bilan tranzaksiya yuborish (yangilash tokenlari) | Ha | Ha | Ha |
| Faqat odamlarni kiritish, ilovangiz nomi koʻrsatilgan token bilan | Ha | Yoʻq | Yoʻq |
| Faqat odamlarni kiritish, Hive hisobi yoʻq saytdan | Yoʻq | Yoʻq | Yoʻq |
| Imzo havolalarini yuborish | Yoʻq | Yoʻq | Yoʻq |

Oxirgi ikki qator uchun qarang: [Posting ruxsatisiz kirish](/docs/login-only) va [Imzo havolalari](/docs/sign-links).

## Ilova hisobini yarating {#app-account}

1. Ilovangiz uchun Hive hisobi yarating, masalan https://ecency.com/signup sahifasida. Ilova uchun shaxsiy hisobingizni emas, alohida hisobni ishlating. Uning nomi sizning `client_id` qiymatingizdir. Foydalanuvchilar uni ruxsat ekranida «Hive hisobi» yozuvi yonida koʻradi. Hive hisobining nomini keyin oʻzgartirib boʻlmaydi, shuning uchun nomni sinchkovlik bilan tanlang.
2. Hisobni https://hivesigner.com/import sahifasida Hivesigner'ga qoʻshing (**Hisob qoʻshish**). Active kalitdan yoki asosiy paroldan foydalaning: quyidagi ruxsat uchun active kalit kerak.

## Ilova sozlamalarini toʻldiring {#app-settings}

Ilova hisobi tanlangan holda https://hivesigner.com/profile sahifasini oching va quyidagilarni belgilang:

- **Bu hisob ilova.** Buni yoqing. Bu hisobni ilova sifatida belgilaydi va API u uchun kod yoki yangilash tokenini qabul qilishdan oldin buni tekshiradi.
- **Yoʻnaltirish URI manzillari.** Callback manzillaringiz, har bir qatorda bittadan. Qarang: [Callback manzillari](#callbacks).
- **Yaratuvchi.** Ilovani kim yuritadi. https://hivesigner.com/apps sahifasidagi ilovalar katalogi buni koʻrsatadi.
- **Holat.** Ishlab chiqarish yoki sinov muhiti, oʻz yozuvlaringiz uchun. Hivesigner ikkalasiga bir xil munosabatda boʻladi.
- **Mijoz maxfiy kaliti.** Faqat [kod oqimi](/docs/oauth2#code-flow) uchun kerak. Qarang: [Mijoz maxfiy kaliti](#client-secret).

**Nomi** va **Profil rasmi URL manzili** maydonlarini ham toʻldiring. Ruxsat ekrani ilovangizning rasmi va nomini koʻrsatadi. https://hivesigner.com/apps sahifasidagi ilovalar katalogi nomni, **Loyiha haqida** va **Veb-sayt** maʼlumotini koʻrsatadi.

Saqlash hisobning profilini blokcheynda yangilaydi va uning posting kalitini talab qiladi. Hivesigner callback manzillaringizni kirish soʻrovi ochilganda hisobdan oʻqiydi, shuning uchun oʻzgarish tranzaksiya blokka tushishi bilanoq kuchga kiradi.

> **Eslatma:** nom, rasm va tavsifni ilova hisobingizning oʻzi eʼlon qiladi. Shuning uchun ruxsat ekrani hisobning haqiqiy nomini (`@myapp`) va foydalanuvchini yoʻnaltiradigan xostni ham koʻrsatadi: ruxsat va yoʻnaltirish aslida oʻshalarga tayanadi.

## Callback manzillari {#callbacks}

Callback manzili (kirish soʻrovidagi `redirect_uri`) bu Hivesigner foydalanuvchini token yoki kod bilan qaytaradigan joy. Hivesigner uni faqat ilova hisobingizda roʻyxatlangan manzilga yuboradi.

### Qoidalar {#callback-rules}

- **Toʻliq mos kelish.** Soʻrovdagi `redirect_uri` sizning Yoʻnaltirish URI manzillaringizdan biriga harfma-harf mos boʻlishi kerak: sxema, xost, port, yoʻl va soʻrov qatori.
- **Faqat https.** Callback manzili `https://` ishlatishi kerak. Oddiy `http://` faqat loopback uchun qabul qilinadi: `localhost`, `127.0.0.1` yoki `[::1]`.
- **Loopback portlari oʻzgarishi mumkin.** Roʻyxatdan oʻtkazilgan oddiy http loopback manzili bir xil yoʻl, soʻrov qatori, fragment va foydalanuvchi maʼlumoti boʻlgan har qanday loopback xost va portiga mos keladi. Roʻyxatdan oʻtkazilgan `https://` loopback manzili esa toʻliq mos kelishni talab qilib qolaveradi.
- **Maxsus sxemalar yoʻq.** `myapp://callback` kabi manzil rad etiladi. Qarang: [Mobil va ish stoli ilovalari](#native-apps).
- **Fragmentlar yoʻq.** Callback manziliga `#fragment` qoʻshmang.

Profil sahifasi hech qachon ishlay olmaydigan manzilni saqlashdan bosh tortadi va «Yaroqsiz callback manzillari (https yoki localhost uchun http boʻlishi kerak)» deb yozadi.

### Misollar {#callback-examples}

Quyidagi Yoʻnaltirish URI manzillari roʻyxatdan oʻtkazilgan boʻlsa:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| Soʻrovdagi `redirect_uri` | Natija |
| --- | --- |
| `https://myapp.example/auth/callback` | Qabul qilindi: toʻliq mos |
| `https://myapp.example/auth/callback/` | Rad etildi: ortiqcha `/` |
| `https://myapp.example/auth/callback?next=home` | Rad etildi: soʻrov qatori boshqacha |
| `https://www.myapp.example/auth/callback` | Rad etildi: boshqa xost |
| `http://myapp.example/auth/callback` | Rad etildi: loopback'dan tashqarida oddiy http |
| `http://localhost:3000/auth` | Qabul qilindi: toʻliq mos |
| `http://127.0.0.1:51234/auth` | Qabul qilindi: loopback, bir xil yoʻl, boshqa port |
| `http://[::1]:3000/auth` | Qabul qilindi: loopback, bir xil yoʻl |
| `http://127.0.0.1:3000/other` | Rad etildi: boshqa yoʻl |
| `https://localhost:3000/auth` | Rad etildi: https oddiy http yozuviga mos kelmaydi |
| `myapp://auth` | Rad etildi: maxsus sxema |

Callback manzilingizda soʻrov qatorini qabul qilish uchun manzilni aynan oʻsha soʻrov qatori bilan roʻyxatdan oʻtkazing. Hivesigner sizning soʻrov qatoringizni saqlab qoladi va oʻz parametrlarini undan keyin qoʻshadi.

### Mobil va ish stoli ilovalari {#native-apps}

Hivesigner tokenni callback manziliga joylaydi. `myapp://` kabi maxsus sxema bitta ilovaga bogʻlanmagan: xuddi shu qurilmadagi boshqa ilova uni oʻziga olib, tokenni qabul qilishi mumkin. Shuning uchun Hivesigner maxsus sxemalarni rad etadi va tokenlarni faqat https manziliga yoki foydalanuvchining oʻz qurilmasidagi loopback'ga yuboradi.

Native ilova buning oʻrniga quyidagilardan birini ishlatadi:

- **Oʻziga tegishli https havolasi.** Operatsion tizim sizning ilovangizda ochadigan manzilni oʻz domeningizda roʻyxatdan oʻtkazing (Android App Links yoki iOS Universal Links).
- **Loopback manzili.** Ilova yoʻnaltirishni `127.0.0.1` da tinglaydi. `http://127.0.0.1/auth` (yoki `localhost`) manzilini roʻyxatdan oʻtkazing va ish vaqtida istalgan boʻsh portdan foydalaning: port mos kelishi shart emas.

## Mijoz maxfiy kaliti {#client-secret}

Mijoz maxfiy kaliti kod almashinuvi sizning serveringizdan kelayotganini isbotlaydi. U [kod oqimi](/docs/oauth2#code-flow) uchun majburiy: serveringiz uni har bir kod yoki yangilash tokeni bilan birga `/api/oauth2/token` manziliga yuboradi. Token oqimi undan foydalanmaydi.

- **Uzun tasodifiy qiymat yarating**, masalan `openssl rand -hex 32` bilan.
- **Uni profil sahifasida belgilang.** Hivesigner faqat uning sha256 xeshini, ilova hisobingiz profilida saqlaydi. Maydonni boʻsh qoldirish joriy maxfiy kalitni saqlab qoladi.
- **Uni serveringizda saqlang.** Uni hech qachon veb-sahifaga, mobil ilovaga yoki URL manziliga qoʻymang.
- **Uni oʻzgartirish uchun** yangisini belgilang va serveringizni ayni vaqtda yangilang.

## @hivesigner'ga posting vakolatini bering {#grant-hivesigner}

API @hivesigner hisobining posting kaliti bilan tranzaksiya yuboradi. Hive bu imzoni foydalanuvchilaringiz uchun faqat ilova hisobingiz @hivesigner'ni oʻz posting vakolatiga qoʻshgan boʻlsa qabul qiladi. Qarang: [Posting vakolati zanjiri](/docs/how-it-works#authority-chain).

1. Hivesigner'da ilova hisobingizni tanlang.
2. https://hivesigner.com/authorize/hivesigner sahifasini oching.
3. Sahifada «@hivesigner uchun ruxsat berish» va «@hivesigner @myapp nomidan post joylash, izoh yozish, ovoz berish va obuna boʻlish imkoniyatiga ega boʻladi.» deb yozilgan. **Ruxsat berish** tugmasini tanlang. Buning uchun ilova hisobining active kaliti kerak.

Buni bir marta bajarasiz. Usiz har bir yuborish `unauthorized_client` xatosi va «Broadcaster account doesn't have permission to broadcast for @myapp» xabari bilan muvaffaqiyatsiz tugaydi. Faqat kirish uchun ishlatiladigan ilovaga bu kerak emas.

Bu ruxsat @hivesigner'ga ilova hisobingizning oʻz nomidan ham post joylash imkonini beradi; bu ilova hisobini faqat ilova uchun saqlashning yana bir sababi.

Shu ruxsat bilan Hivesigner orqali tranzaksiya yuboradigan ilovalar https://hivesigner.com/apps sahifasidagi ilovalar katalogida, ulardan qancha odam foydalanishiga qarab tartiblangan holda koʻrinishi mumkin.

## Nimadir notoʻgʻri boʻlganda foydalanuvchilar nimani koʻradi {#refused-requests}

Hivesigner xavfsiz javob bera olmaydigan soʻrovni rad etadi. U xabar va **Bu muammo haqida xabar berish** tugmasini koʻrsatadi. Bunday soʻrovni tasdiqlab boʻlmaydi. Callback manzilingizga hech narsa yuborilmaydi.

| Muammo | Foydalanuvchi nimani oʻqiydi |
| --- | --- |
| `redirect_uri` sizning Yoʻnaltirish URI manzillaringizdan biri emas | «Bu ilovaning yoʻnaltirish URL manzili roʻyxatdan oʻtkazilmagan. Xavfsizligingiz uchun kirish bloklandi.» |
| `client_id` Hive hisobi emas | «@myapp Hive hisobi emas, shuning uchun ruxsat beriladigan ilova yoʻq. Saytga qayting va qaytadan urinib koʻring.» |
| Hisob ilova sifatida belgilanmagan | «@myapp ilova sifatida sozlanmagan, shuning uchun sizni tizimga kirita olmaydi. Saytga qaytib, qaytadan urinib koʻring.» Yuqorida koʻrsatilganidek **Bu hisob ilova** sozlamasini yoqing. |
| Soʻrovda `redirect_uri` yoʻq | «Bu ruxsat soʻrovi toʻliq emas: unda ilova yoki yoʻnaltirish URL manzili koʻrsatilmagan. Ilovaga qayting va qaytadan urinib koʻring.» |

Agar foydalanuvchilaringiz shulardan biri haqida xabar bersa, ilovangiz yuboradigan `redirect_uri` qiymatini Yoʻnaltirish URI manzillaringiz bilan harfma-harf solishtiring.

## Nazorat roʻyxati {#checklist}

1. Ilova uchun Hive hisobi, active kaliti bilan Hivesigner'ga qoʻshilgan.
2. https://hivesigner.com/profile sahifasida: «Bu hisob ilova» yoqilgan, Yoʻnaltirish URI manzillari roʻyxatlangan, kod oqimidan foydalansangiz mijoz maxfiy kaliti belgilangan.
3. API orqali tranzaksiya yuborsangiz, https://hivesigner.com/authorize/hivesigner sahifasida @hivesigner'ga ruxsat berilgan.
4. Yoʻnaltirish URI manzillaringizdan birini aynan yuboradigan kirish havolasi. Qarang: [OAuth2 orqali kirish](/docs/oauth2).
