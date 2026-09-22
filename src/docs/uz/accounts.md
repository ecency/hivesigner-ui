Hivesigner unga qoʻshgan Hive hisoblaringizning kalitlari bilan imzolaydi. Hisobni foydalanadigan har bir brauzerda bir marta qoʻshasiz, soʻngra Hivesigner uning kalitlarini oʻsha brauzerda saqlaydi, agar himoya kodi oʻrnatgan boʻlsangiz shifrlangan holda.

## Hisob qoʻshish {#add-account}

1. Brauzeringizning manzil satrida `https://hivesigner.com` yozilganini tekshiring. Qarang: [Avval manzilni tekshiring](/docs/safety#check-the-address).
2. [hivesigner.com/import](https://hivesigner.com/import) sahifasini oching. Agar bu brauzerda hali hech qanday hisob boʻlmasa, bosh sahifadagi **Hivesigner’ni sozlash** tugmasi ham shu shaklni ochadi.
3. **Foydalanuvchi nomi** maydoniga Hive foydalanuvchi nomingizni kichik harflarda, `@` belgisisiz yozing.
4. **Maxfiy kalit** maydoniga maxfiy kalitlaringizdan birini joylashtiring. Avval [Qaysi kalitni qoʻshish kerak](/docs/accounts#which-key) boʻlimini oʻqing.
5. **Himoya kodi oʻrnatish (tavsiya etiladi)** belgisini qoldiring va **Himoya kodi** tanlang. Kamida 4 ta belgi kerak. Qarang: [Uni himoya kodi bilan himoyalang](/docs/accounts#passcode).
6. **Hisob qoʻshish** tugmasini tanlang.

Hivesigner biror narsani saqlashdan oldin kalitni Hive tarmogʻidagi hisobingiz bilan solishtiradi. U kalitning ochiq qismini hisobingiz eʼlon qilgan kalitlar bilan taqqoslaydi, maxfiy kalitning oʻzi esa hech qayerga yuborilmaydi. Agar foydalanuvchi nomi Hive hisobi boʻlmasa yoki kalit unga tegishli boʻlmasa, shaklda «Foydalanuvchi nomi yoki kalit notoʻgʻri. Asosiy parolingizdan yoki owner, active, posting yoxud memo kalitingizdan foydalaning.» deb koʻrsatiladi.

Qoʻshgan hisobingiz tanlangan hisob boʻladi, yaʼni Hivesigner oʻz ekranlarida ishlatadigan hisob. Agar bu shaklga biror soʻrovdan kelgan boʻlsangiz, Hivesigner sizni oʻsha soʻrovga qaytaradi. Aks holda **Hisoblar** sahifasini ochadi.

### Hisobga yana bir kalit qoʻshish {#add-a-key}

Allaqachon shu yerda boʻlgan hisobga ikkinchi kalit qoʻshish uchun (masalan, posting kalit yoniga active kalitni) oʻsha hisobni yangi kalit bilan qaytadan qoʻshing. Hivesigner mavjud kalitlarni saqlab qoladi va yangisini qoʻshadi. Allaqachon mavjud turdagi yangi kalit eskisining oʻrnini egallaydi.

Agar hisobda himoya kodi boʻlsa, **Himoya kodi oʻrnatish (tavsiya etiladi)** belgisini qoldiring va oʻsha kodni kiriting. Hivesigner boshqa holatlarni qabul qilmaydi:

- Himoya kodi kiritilmasa, shaklda «Bu hisob shu qurilmada himoyalangan. Kalit qoʻshish uchun uning himoya kodini kiriting.» deb chiqadi.
- Boshqa kod kiritilsa, «Himoya kodi notoʻgʻri. Kalit saqlanmadi.» deb chiqadi.

## Qaysi kalitni qoʻshish kerak {#which-key}

Hive hisobida bir nechta maxfiy kalit boʻladi va ularning har biri turli amallarga ruxsat beradi. Bu kalitlarni Hive hisobingizni yaratgan hamyon yoki ilovadan olgansiz, odatda uning kalitlar yoki parol sahifasida. Hivesigner ularni sizga koʻrsata olmaydi.

| Kalit | Hivesigner uni nimaga ishlatadi |
| --- | --- |
| Posting | Ilovalarga kirish, ovoz berish, post joylash va izoh yozish, obuna boʻlish, profilni tahrirlash va mukofotlarni olish. |
| Active | Pul oʻtkazmalari, power up va power down, delegatsiya, jamgʻarma va konvertatsiya kabi hamyon amallari. Guvohlar va takliflar uchun ovoz berish. Ilovaga birinchi marta ruxsat berish va ilova ruxsatini bekor qilish. |
| Owner | Owner kalitni yoki tiklash hisobini oʻzgartirish. Kundalik ishda u kerak emas. |
| Memo | Hech narsaga. Shakl uni qabul qiladi, lekin faqat memo kaliti bor hisob tizimga kira olmaydi: soʻrov ekranida oʻshanda «Davom etish uchun @FOYDALANUVCHI hisobiga posting yoki active kalit qoʻshing» deb chiqadi. |

Kundalik foydalanish uchun posting kalitni qoʻshing. Active kalitni faqat hamyon amali yoki ilovaga birinchi ruxsat berish uchun kerak boʻlgandagina qoʻshing. Ekranga shu qurilmada yoʻq kalit kerak boʻlsa, u buni aytadi va kalitni qoʻshish imkonini beradi.

Asosiy parolingiz ham **Maxfiy kalit** maydonida ishlaydi. Hivesigner undan kalitlaringizni hosil qiladi va hisobingizga hamon mos keladigan har bir kalitni, jumladan owner kalitni ham saqlaydi. Kalitlarni alohida-alohida qoʻshsangiz, owner kalit bu qurilmaga tushmaydi.

> **Eslatma:** Hivesigner har bir tranzaksiyani aynan oʻsha tranzaksiya talab qiladigan kalit bilan imzolaydi. Bu 2025-yildagi hard forkdan beri amal qilayotgan Hive qoidasiga muvofiq. Active kalit endi ovoz berish kabi posting darajasidagi amalni imzolay olmaydi, owner kalit esa hamyon amalini imzolay olmaydi. Active kalit allaqachon shu yerda boʻlsa ham, posting kalitni qoʻshing.

Ilovaga kirish boshqacha: bu tranzaksiya emas. Hivesigner sizni posting kalit bilan kiritadi, agar bu qurilmada hisobning posting kaliti boʻlmasa, active kalit bilan.

## Uni himoya kodi bilan himoyalang {#passcode}

Himoya kodi faqat shu brauzer uchun tanlaydigan parolingiz. U Hive parolingiz ham emas, kalitlaringizdan biri ham emas. Hivesigner u bilan hisob kalitlarini saqlashdan oldin shifrlaydi va ularni ochish uchun uni yana soʻraydi.

- Hivesigner himoya kodingizni saqlamaydi va hech qayerga yubormaydi. Uni hech kim siz uchun tiklab bera olmaydi.
- Bu qurilmadagi har bir hisobning oʻz himoya kodi bor. Hammasi uchun bittasini ishlatsangiz ham boʻladi.
- Uzunroq kodni topish qiyinroq. Hive asosiy parolingizni yoki kalitlaringizdan birini himoya kodi sifatida ishlatmang.

Himoya kodi boʻlmasa, Hivesigner hisob kalitlarini bu brauzerda shifrlamasdan saqlaydi. U har ishga tushganda kalitlarni oʻzi ochadi, shuning uchun bu brauzerdan foydalanadigan har kim ular bilan imzolay oladi. **Hisoblar** sahifasi bunday hisobni **Himoya kodi yoʻq** deb belgilaydi.

Himoya kodi yoʻq hisobga kod qoʻyish uchun oʻsha hisobni uning kalitlaridan biri va himoya kodi bilan qaytadan qoʻshing. Shunda Hivesigner hisobning barcha kalitlarini oʻsha kod bilan shifrlaydi.

Himoya kodini oʻzgartirish uchun [hisobni olib tashlang](/docs/accounts#remove-account) va uni yangi kod bilan qaytadan qoʻshing. Olib tashlash hisobning barcha kalitlarini bu brauzerdan oʻchiradi, shuning uchun har bir kalitni qaytadan qoʻshing (posting kalitni, soʻngra foydalansangiz active kalitni).

## Hisobni qulfdan chiqarish {#unlock}

Himoya kodi bor hisob Hivesigner har ochilganda qulflangan holda boshlanadi: yangi varaqda, qayta yuklashdan keyin yoki biror ilova sizni shu yerga yuborganda. Uni oldindan qulfdan chiqarish shart emas. Kalitlar kerak boʻladigan ekran oʻz tugmasi ustida **Himoya kodi** maydonini koʻrsatadi (masalan **Kirish**, **Tasdiqlash** yoki **Qulfdan chiqarish**). Bir marta bosish hisobni qulfdan chiqaradi va amalni davom ettiradi.

Notoʻgʻri kod «Himoya kodi notoʻgʻri.» deb koʻrsatadi va hech narsa imzolanmaydi.

Hivesigner qulfdan chiqarilgan kalitlarni faqat xotirada saqlaydi, hech qachon doimiy xotirada emas. Hisob siz varaqni yopmaguningizcha yoki qayta yuklamaguningizcha oʻsha varaqda ochiq qoladi.

## Hisoblarni almashtirish {#switch-accounts}

**Hisoblar** sahifasi bu qurilmadagi hisoblarni A dan Z gacha roʻyxatlaydi. Tanlangan hisobda belgi turadi. 6 ta hisobdan boshlab **Hisoblarni qidirish** maydoni roʻyxatni saralaydi.

Hisobni tanlab uni tanlangan hisobga aylantiring. Bu yerda Hivesigner himoya kodini soʻramaydi. Uni kalitlar kerak boʻladigan ekran soʻraydi.

Soʻrov ekranida hisobni koʻrsatadigan satrda («Kiruvchi hisob», «Ruxsat beruvchi hisob» yoki «Imzolovchi hisob») **Hisobni almashtirish** havolasi boʻladi. U oʻsha roʻyxatni shu yerning oʻzida ochadi, shuning uchun soʻrovni tark etmasdan boshqa hisobni tanlay olasiz. Roʻyxat ostidagi **Boshqa hisob qoʻshish** **Hisob qoʻshish** shaklini ochadi va keyin sizni soʻrovga qaytaradi.

## Hisobni olib tashlash {#remove-account}

1. **Hisoblar** sahifasini oching.
2. Hisob yonidagi **✕** belgisini tanlang. Uning ekran oʻqugichlari uchun nomi **Hivesigner roʻyxatidan olib tashlash @FOYDALANUVCHI**.
3. Brauzer «@FOYDALANUVCHI hisobi ushbu qurilmadan olib tashlansinmi? Uning bu yerdagi kalitlari oʻchiriladi.» deb soʻraganda tasdiqlang.

Hisobni olib tashlash uning kalitlarini faqat shu brauzerdan oʻchiradi. Hive hisobingiz oʻzgarmaydi. Siz ruxsat bergan ilovalar kirish huquqini saqlab qoladi, chunki u huquq Hive blokcheynida yozilgan. Uni bekor qilish uchun qarang: [Ilova ruxsatini koʻrish va bekor qilish](/docs/signing-in#remove-access).

Agar tanlangan hisobni olib tashlasangiz, bu qurilmadagi boshqa hisob tanlangan hisobga aylanadi.

Agar brauzer Hivesigner’ga oʻzgarishni saqlashga ruxsat bermasa, «Faqat shu seans uchun olib tashlandi: xotiradan foydalanib boʻlmayapti, shuning uchun sahifani qayta yuklaganingizda bu hisob yana paydo boʻladi.» degan xabarni koʻrasiz.

## Agar himoya kodini unutsangiz {#forgotten-passcode}

Himoya kodini hech kim tiklay olmaydi, Hivesigner ham. Hive hisobingizga bu taʼsir qilmaydi: himoya kodi faqat shu brauzerdagi kalitlaringiz nusxasini himoya qiladi.

1. Bu qurilmadan [hisobni olib tashlang](/docs/accounts#remove-account).
2. Uning kaliti va yangi himoya kodi bilan [qaytadan qoʻshing](/docs/accounts#add-account).

Hive blokcheynida hech narsa oʻzgarmaydi. Siz ruxsat bergan ilovalar kirish huquqini saqlab qoladi.

## Kalitlaringiz qayerda saqlanadi {#where-keys-are-stored}

Hivesigner kalitlaringizni faqat shu qurilmadagi shu brauzerda, brauzer hivesigner.com uchun ajratgan xotirada saqlaydi.

- Ular sinxronlanmaydi. Boshqa brauzerda, brauzerning boshqa profilida yoki boshqa qurilmada ular yoʻq. Hisobni u yerda ham qoʻshing.
- hivesigner.com uchun sayt maʼlumotlarini yoki koʻrish tarixini tozalash ularni oʻchiradi. Maxfiy oynani yopish ham shunday.
- Hivesigner zaxira nusxa emas. Kalitlaringizni yoki asosiy parolingizni boshqa joyda xavfsiz saqlang.
