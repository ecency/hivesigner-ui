Ilovalar sizdan Hive tranzaksiyasini imzolashni soʻrashi mumkin: ovoz, pul oʻtkazmasi yoki post. Ular sizga Hivesigner’ni ochadigan havola yuboradi. Hivesigner soʻrov nima qilishini, unga qaysi kalit kerakligini va keyin sizni qayerga yuborishini tushunarli soʻzlar bilan koʻrsatadi. Siz tasdiqlamaguningizcha hech narsa imzolanmaydi. Ilovalar bundan tashqari xabarni imzolashni ham soʻrashi mumkin, u esa hech qachon blokcheynga tushmaydi.

## «Tranzaksiyani tasdiqlash» ekrani {#confirm-screen}

Imzolash havolasi «Tranzaksiyani tasdiqlash» sarlavhali ekranni ochadi. U soʻrovdagi har bir amal uchun bitta karta koʻrsatadi. Amal bu Hive’dagi bitta ish, masalan bitta ovoz yoki bitta pul oʻtkazmasi.

Soʻrovda bittadan koʻp amal boʻlsa, kartalar raqamlanadi va ularning ustidagi satrda «Bu soʻrovda 3 ta amal bor. Tasdiqlashdan oldin ularning har birini koʻrib chiqing.» deb yoziladi.

### Qisqacha tavsif {#summary}

Har bir karta amal nima qilishini soʻrovdagi qiymatlar bilan aytib beradigan jumla bilan boshlanadi. Masalan:

| Amal | Kartada nima yoziladi |
| --- | --- |
| Pul oʻtkazmasi | @bob hisobiga 1.000 HIVE yuborish (ostida esa eslatma, «Eslatma: ...» koʻrinishida) |
| Ovoz | @alice/mening-postim uchun ijobiy ovoz berish (ostida ovoz ogʻirligi, masalan 100%) |
| Post yoki javob | «Mening sarlavham» postini nashr qilish, yoki @alice/mening-postim postiga javob yozish |
| Hive ilovasi belgilagan amal | Maxsus amal (follow) |
| Hisobni kim boshqarishini oʻzgartirish | Hisob vakolatlarini yangilash |

Boshqa amallar oʻz nomini koʻrsatadi, masalan «Power Up» yoki «Hive Power delegatsiya qilish».

Jumla yonida bosh harflar bilan yozilgan yorliq amalga qaysi kalit kerakligini koʻrsatadi: POSTING, ACTIVE yoki OWNER.

### Tafsilotlar {#details}

Jumla ostida karta amal olib yuradigan qiymatlarni sanab oʻtadi:

- amal qaysi hisob nomidan bajarilishi
- post yoki izoh uchun: permlink (postning manzili), hamjamiyat yoki teg, matn va metamaʼlumotlar
- maxsus amal uchun: uning maʼlumotlaridagi har bir qiymat, har bir satrda bittadan, hech narsa kesilib qolmasligi uchun
- vakolat oʻzgarishi uchun: u belgilaydigan chegaraviy qiymat, kalitlar va hisoblar

Vakolat oʻzgarishi kalitlaringizni olib tashlaydigan boʻlsa, buni ham aytadi: «kalitlar: YOʻQ (kalitingiz olib tashlanadi)». Chegaraviy qiymat boʻlmasa, «chegaraviy qiymat BELGILANMAGAN (0 deb hisoblanadi)» deb koʻrsatiladi.

Qisqacha tavsifda ham, tafsilotlarda ham matnni yashira oladigan yoki uning yoʻnalishini oʻzgartira oladigan belgilar `�` koʻrinishida koʻrsatiladi. Siz oʻqiyotgan narsa oʻzini boshqa narsa qilib koʻrsata olmaydi.

**Amalning xom maʼlumotlarini koʻrsatish** (yoki **Amallarning xom maʼlumotlarini koʻrsatish**) aynan imzolanadigan amallarni ochadi.

Miqdor Hive Power’da berilgan boʻlsa, Hivesigner uni joriy kurs boʻyicha hisoblab beradi. U «Joriy Hive Power kursi yuklanmoqda…» deb koʻrsatadi va oʻsha kursni olmaguncha tasdiqlashga ruxsat bermaydi.

Baʼzi soʻrovlar boshqa joyda tayyorlangan tranzaksiyani olib keladi, masalan bir necha kishi boshqaradigan hisob uchun. Ekranda oʻshanda «Bu soʻrov tranzaksiya sarlavhasini oʻzi taqdim etgan. Amal qilish muddati: SANA.» deb yoziladi. Boshqalar uni allaqachon imzolagan boʻlsa, «Unda allaqachon 2 ta imzo bor.» degan qoʻshimcha chiqadi.

## Qaysi kalit kerak {#which-key}

Kartalar ostida bitta satr butun soʻrovga kerak boʻlgan kalitni koʻrsatadi: «Posting kalitingiz bilan imzolanadi», «Active kalitingiz bilan imzolanadi» yoki «Owner kalitingiz bilan imzolanadi».

Hivesigner aynan oʻsha kalit bilan imzolaydi. Active kalit ovozni imzolay olmaydi, owner kalit esa pul oʻtkazmasini imzolay olmaydi. Bu 2025-yildagi hard forkdan beri amal qiladigan Hive qoidasi. Qarang: [Qaysi kalitni qoʻshish kerak](/docs/accounts#which-key).

Bitta soʻrovdagi barcha amallarga bitta xil kalit kerak boʻlishi shart. Agar bunday boʻlmasa, oʻsha satrda «Bu tranzaksiya bir nechta vakolatni talab qiladi va uni bitta kalit bilan imzolab boʻlmaydi.» deb yoziladi. Tasdiqlash tugmasi boʻlmaydi. Ilovaga qayting.

Owner kalit talab qiladigan soʻrovlar kam uchraydi. Ular hisobingizni kim boshqarishi yoki tiklashi mumkinligini oʻzgartiradi. Ularni ikki marta oʻqing. Qarang: [Tasdiqlashdan oldin oʻqing](/docs/safety#read-before-approving).

### Kalit yoʻq boʻlganda {#missing-key}

Agar tanlangan hisobda oʻsha kalit bu qurilmada boʻlmasa, ekran buni aytadi. Masalan: «Buning uchun active kalitingiz kerak, lekin bu yerda @FOYDALANUVCHI hisobining active kaliti yoʻq.»

1. Xabar ostidagi **Boshqa hisob qoʻshish** tugmasini tanlang. **Hisob qoʻshish** shakli ochiladi.
2. Oʻsha foydalanuvchi nomini va yetishmayotgan kalitni kiriting. Hisobda himoya kodi boʻlsa, uni ham kiriting.
3. **Hisob qoʻshish** tugmasini tanlang. Hivesigner kalitni qoʻshadi va sizni soʻrovga qaytaradi.

Agar hisob qulflangan boʻlsa, ekran tugma ustida **Himoya kodi** maydonini koʻrsatadi. Bir marta bosish hisobni qulfdan chiqaradi va tasdiqlaydi. Kalit haqiqatan ham yoʻq boʻlib chiqsa, ekran buni qulfdan chiqargandan keyin aytadi.

Agar bu brauzerda hali hech qanday hisob boʻlmasa, tugmada **Davom etish** deb yoziladi va u **Hisob qoʻshish** shaklini ochadi.

## Tasdiqlash yoki imzolash {#approve}

Tugma ustidagi hisob satrida «Imzolovchi hisob» deb yoziladi va imzolaydigan hisob koʻrsatiladi. **Hisobni almashtirish** boshqasini tanlash imkonini beradi. Qarang: [Hisoblarni almashtirish](/docs/accounts#switch-accounts).

- **Tasdiqlash** tranzaksiyani brauzeringizda imzolaydi va Hive tarmogʻiga yuboradi. Natijada «Tranzaksiya tarmoqqa muvaffaqiyatli yuborildi» deb yoziladi va yonida tranzaksiyani blok brauzerida ochadigan **Tranzaksiya identifikatori** koʻrsatiladi.
- Soʻrov faqat imzoni soʻraganda uning oʻrniga **Imzolash** chiqadi. Hivesigner tranzaksiyani tarmoqqa yubormasdan imzolaydi va imzoni ilovaga topshiradi, agar soʻrovda sayt koʻrsatilmagan boʻlsa, uni ekranda koʻrsatadi.

Agar tarmoq tranzaksiyani rad etsa, «Tranzaksiyangiz tarmoqqa yuborilmadi» degan xabar va tarmoq bergan «Xato xabari» koʻrinadi. Qaytadan urinib koʻrsangiz boʻladi.

## Qaytadigan saytingiz {#return-site}

Soʻrovda qaytish sayti koʻrsatilgan boʻlsa, yuqoridagi xabarda «Siz HOST manziliga yoʻnaltirilasiz.» deb yoziladi. Tasdiqlaganingizdan keyin Hivesigner sizni oʻsha yerga yuboradi. HOST siz kelgan sayt ekanini tekshiring.

Soʻrovda hech qanday sayt koʻrsatilmagan boʻlsa, Hivesigner natija ekranida qoladi.

## Boshqa hisob uchun soʻrov {#another-account}

Soʻrov tanlangan hisobdan boshqa hisob uchun tuzilgan boʻlishi mumkin. Hivesigner buni ikki xil yoʻl bilan koʻrsatadi.

**Soʻrovni boshqa hisob imzolashi kerak.** Ekranda «Bu soʻrov @HISOB tomonidan imzolanishi kerak. Oʻsha hisobga oʻting.» deb yoziladi. Hisob satrida «Tanlangan hisob» deb yoziladi va ostida hisoblar roʻyxati ochiladi. Oʻsha hisobni tanlang yoki **Boshqa hisob qoʻshish** orqali qoʻshing. Hivesigner bu soʻrovni boshqa hech qanday hisob bilan imzolamaydi.

**Amal boshqa hisob nomidan bajariladi.** Bu bir necha kishi boshqaradigan hisoblarda uchraydi. Yuqoridagi ogohlantirishda «Bu soʻrov @FOYDALANUVCHI nomidan emas, @HISOB nomidan amal bajaradi. Faqat oʻsha hisobni ham siz boshqarsangizgina davom eting.» deb yoziladi. Har bir kartaning tafsilotlarida u qaysi hisob nomidan ish tutayotgani koʻrsatiladi.

## Hivesigner oʻqiy olmaydigan soʻrovlar {#invalid-requests}

Hivesigner oʻzi toʻliq oʻqib, sizga koʻrsata olmaydigan soʻrovni hech qachon imzolamaydi. Bunga oʻzi bilmaydigan amal, hech qanday amali yoʻq soʻrov, amalga mos kelmaydigan qiymat (son boʻlmagan son, notoʻgʻri yozilgan miqdor) va oʻzi koʻrsata olmaydigan ortiqcha maʼlumotlar kiradi.

Ekranda oʻshanda «Voy, nimadir xato ketdi. Taqdim etilgan maʼlumotlar notoʻgʻri.» deb yoziladi. Ilovaga qayting. Hivesigner jamoasiga xabar berish uchun **Bu muammo haqida xabar berish** tugmasini tanlang.

## Xabarni imzolash soʻrovlari {#message-requests}

Baʼzi ilovalar tranzaksiya oʻrniga xabarni imzolashni soʻraydi, masalan hisob sizniki ekanini isbotlash uchun. Xabar bu matn va uni imzolash blokcheynda hech narsani oʻzgartirmaydi.

Ekranda quyidagilar koʻrinadi:

- «ILOVA sizdan xabarni imzolashni soʻramoqda.» kabi sarlavha. Ilovaning Hive hisobi boʻlsa, ostidagi satr uni koʻrsatadi: «Hive hisobi @ILOVA_HISOBI».
- «Sizni HOST manziliga yoʻnaltiradi»: imzoni oladigan sayt. Aynan shu satr tugma yonida yana bir marta chiqadi.
- **Xabar**: butun matn, aynan imzolanadigan koʻrinishida. Matnni yashira oladigan yoki uning yoʻnalishini oʻzgartira oladigan belgilar ajratib koʻrsatilgan kodlar sifatida chiqadi, masalan `\u{200B}`.
- Ishlatiladigan kalit: «Posting kalitingiz bilan imzolanadi» yoki «Active kalitingiz bilan imzolanadi». Hivesigner xabarni hech qachon owner kalit bilan imzolamaydi.
- Ogohlantirish: «Imzoingiz uni koʻrgan har kimga @FOYDALANUVCHI aynan shu matnni imzolaganini isbotlaydi. Faqat tushungan xabaringizni imzolang.»
- Hisob satri, «Imzolovchi hisob», **Hisobni almashtirish** havolasi bilan.

Imzolash uchun **Imzolash** tugmasini tanlang. Hivesigner sizni imzo, foydalanuvchi nomingiz, kalit turi va imzoni yaratgan ochiq kalit bilan birga saytga qaytaradi. Ochiq kalit kalitlar juftining ulashsa boʻladigan yarmi: u bilan hech narsani imzolab boʻlmaydi.

**Hisoblar** sahifangizga oʻtish uchun **Bekor qilish** tugmasini tanlang. Sayt hech narsa olmaydi.

Agar hisobda oʻsha kalit bu qurilmada boʻlmasa, ekran buni aytadi. Masalan: «Buning uchun posting kalitingiz kerak, lekin bu yerda @FOYDALANUVCHI hisobining posting kaliti yoʻq.» **Hisobni almashtirish**, soʻngra **Boshqa hisob qoʻshish** tugmasini tanlang. Oʻsha hisob uchun [yetishmayotgan kalitni qoʻshing](/docs/accounts#add-a-key). Hivesigner sizni soʻrovga qaytaradi.

### Nega baʼzi xabarlar rad etiladi {#refused-messages}

**Hivesigner’ga kirish sifatida ishlashi mumkin boʻlgan xabar.** Baʼzi matnlar aynan Hivesigner’ga kirish koʻrinishida boʻladi. Ularni imzolash saytga hisobingizga kirish huquqini berib qoʻyadi. Hivesigner bunday matnni hech qachon imzolamaydi va «Bu xabar Hivesigner tokeni. Uni imzolash saytga hisobingizga kirish huquqini beradi, shuning uchun uni imzolab boʻlmaydi.» deb koʻrsatadi.

**Hivesigner ishlata olmaydigan soʻrov.** Hivesigner xabari yoki qaytish manzili yoʻq soʻrovni rad etadi. Shuningdek, posting yoki active kalitdan boshqa kalitni soʻraydigan soʻrovni, Hive hisobi boʻlmagan narsani ilova deb koʻrsatadigan soʻrovni va qaytish manzili xavfsiz boʻlmagan yoki oʻsha ilova uchun roʻyxatdan oʻtkazilmagan soʻrovni ham rad etadi. Oʻshanda u «Bu imzo soʻrovidan foydalanib boʻlmaydi: unga xabar, posting yoki active kalit va ilova uchun roʻyxatdan oʻtkazilgan xavfsiz yoʻnaltirish URL manzili kerak. Saytga qayting va qaytadan urinib koʻring.» deb koʻrsatadi.

Agar Hivesigner ilova maʼlumotlarini Hive tarmogʻidan oʻqiy olmasa, «Hisob maʼlumotlarini Hive tarmogʻidan yuklab boʻlmadi.» deb koʻrsatadi va oʻqiy olmaguncha hech narsani imzolamaydi. **Qayta urinish** tugmasini tanlang.

## Xabarni oʻzingiz imzolash {#sign-message}

Hisobni oʻzingiz boshqarayotganingizni isbotlash uchun xabarni oʻzingiz ham imzolashingiz mumkin.

1. [hivesigner.com/signmessage](https://hivesigner.com/signmessage) sahifasini oching. Sayt pastki qismi u yerga **Xabarni imzolash** nomi bilan havola qiladi.
2. Agar tanlangan hisob qulflangan boʻlsa, uning himoya kodini kiriting va **Qulfdan chiqarish** tugmasini tanlang. Hech qanday hisob tanlanmagan boʻlsa, sahifa hisoblaringizga havola beradi.
3. Matnni **Xabar** maydoniga yozing. Hivesigner boshidagi va oxiridagi boʻsh joylar bilan qator koʻchirishlarni olib tashlaydi.
4. Kalitni **Imzolash uchun kalit** maydonida tanlang. U yerda tanlangan hisobning shu qurilmadagi kalitlari eng kuchlisidan boshlab keltiriladi va boshida eng kuchlisi tanlangan boʻladi. Boshqa kalit kerak boʻlmasa, uni **Posting** ga oʻzgartiring.
5. **Xabarni imzolash** tugmasini tanlang.

**Imzo xulosasi** boʻlimida **Muallif**, **Foydalanilgan vakolat**, **Tekshirish tokeni** va **Tekshirish havolasi** koʻrsatiladi. Tekshirish tokeni xabar, foydalanuvchi nomingiz va imzoni bitta matnga jamlaydi. Havolani yoki tokenni xabarni tekshirishi kerak boʻlgan kishiga bering.

Imzo kalitingizni oshkor qilmaydi. Lekin u qaysi kalit bilan yaratilganini koʻrsatadi.

## Xabarni tekshirish {#verify-message}

1. [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage) sahifasini oching. Sayt pastki qismi u yerga **Xabarni tekshirish** nomi bilan havola qiladi.
2. Tokenni **Tekshirish tokeni** maydoniga joylashtiring va **Imzoni tekshirish** tugmasini tanlang.

Tekshirish havolasi shu sahifani ochadi va xabarni oʻzi tekshiradi.

Natijada «Imzo FOYDALANUVCHI uchun haqiqiy» yoki «Imzoni hisob kalitlari bilan tasdiqlab boʻlmadi.» deb yoziladi. Ostida **Muallif**, **Imzodan tiklangan ochiq kalit**, **Mos kelgan vakolat** (imzolagan kalit turi) va **Xabar** koʻrinadi.

Hivesigner imzoni hisob hozir Hive tarmogʻida ega boʻlgan kalitlar bilan solishtiradi. Hisob oʻshandan beri almashtirgan kalit bilan imzolangan xabar endi tekshiruvdan oʻtmaydi.
