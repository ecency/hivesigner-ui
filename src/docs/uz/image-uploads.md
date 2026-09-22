Hive postlari rasmlarga manzil orqali ishora qiladi, shuning uchun ilovaga ularni yuklash uchun joy kerak. imagehoster bu Hive uchun yaratilgan ochiq kodli rasm xostingi. U ilovangizga Hivesigner orqali kirgan odamlardan yuklamalarni qabul qila oladi: ularning kirish tokeni kalit bilan qoʻyilgan imzo oʻrnini bosadi.

## Bu qanday ishlaydi {#how-it-works}

1. Foydalanuvchi ilovangizga Hivesigner orqali, posting ruxsati bilan kiradi. Ilovangiz kirish tokenini oladi. Qarang: [OAuth2 orqali kirish](/docs/oauth2).
2. Ilovangiz rasmni oʻsha token manzilda boʻlgan holda imagehoster'ingizga yuboradi.
3. imagehoster tokenni va hisobni tekshiradi, rasmni saqlaydi va uning manzilini qaytaradi.
4. Ilovangiz manzilni postga joylaydi.

## Oʻz imagehoster'ingizni ishga tushiring {#run-your-own}

imagehoster bitta ilova hisobi uchun sozlanadi: konfiguratsiyasining `[upload_limits]` boʻlimidagi `app_account`. Unga oʻsha ilova hisobi uchun yaratilgan tokenlarni yuboring. Ochiq nusxalar boshqa ilovalarga tegishli: images.ecency.com Ecency'ning ilova hisobi, images.hive.blog esa Hive.blog'niki uchun sozlangan. Oʻz foydalanuvchilaringizdan yuklamalarni qabul qilish uchun oʻz nusxangizni oʻz ilova hisobingiz bilan ishga tushiring.

Manba kodi va sozlash qoʻllanmalari:

- Hive hamjamiyatining imagehoster'i: https://gitlab.syncad.com/hive/imagehoster
- Ecency'ning imagehoster'i: https://github.com/ecency/imagehoster

Konfiguratsiyada oʻz ilova hisobingizni belgilang:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

Xuddi shu boʻlim hisobga yuklash uchun kerak boʻlgan eng past obroʻni (`reputation`) va har bir hisob uchun yuklash kvotasini (`duration` millisekundda `max` ta yuklama) belgilaydi. Kvota ishlashi uchun `redis_url` ni sozlang. `max_image_size` esa eng katta fayl hajmini baytlarda belgilaydi.

## Rasm yuklang {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Token.** Foydalanuvchining kirish tokenini Hivesigner ilovangizga bergan koʻrinishda yoʻlga qoʻying. Ilovangiz uchun posting ruxsati bilan qilingan kirishdan olingan tokendan foydalaning. `client_id` siz soʻrovdan olingan, faqat kirish uchun token hech qanday ilovani koʻrsatmaydi va rad etiladi.
- **Tana.** Bitta rasm fayli bilan `multipart/form-data` yuboring. imagehoster maydon nomi qanday boʻlishidan qatʼi nazar birinchi faylni oladi.
- **Hajm.** `Content-Length` sarlavhasini yuboring. Fayl shu nusxaning `max_image_size` qiymatidan katta boʻlmasligi kerak.

Javob JSON boʻladi. Muvaffaqiyatli holatda u rasmning manzilini saqlaydi:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

Muvaffaqiyatsiz holatda imagehoster HTTP xato holati bilan javob beradi. Koʻpchilik nosozliklar yana xato nomini ham olib keladi:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Eslatma:** token manzil ichida yuradi. imagehoster'ingizni faqat https orqali tarqating va uning kirish jurnallarini yopiq saqlang.

## Misol {#example}

Bu brauzer funksiyasi faylni fayl maydonidan yoki tashlab yuborilgan fayldan yuklaydi. Multipart sarlavhalari va uzunlikni brauzer siz uchun belgilaydi: `Content-Type` ni oʻzingiz belgilamang.

```js
// IMAGEHOSTER_URL is the address of your imagehoster, such as 'https://YOUR_IMAGEHOSTER'.
async function uploadImage(file, accessToken) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${IMAGEHOSTER_URL}/hs/${accessToken}`, {
    method: 'POST',
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.name ?? `Upload failed with status ${response.status}`);
  }
  return result.url;
}

const url = await uploadImage(input.files[0], ACCESS_TOKEN);
const markdown = `![](${url})`; // add this to the post body
```
