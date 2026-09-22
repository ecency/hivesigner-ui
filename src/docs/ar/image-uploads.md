تشير منشورات Hive إلى الصور بعناوين URL، فيحتاج التطبيق إلى مكان يرفعها إليه. و imagehoster استضافة صور مفتوحة المصدر مبنية من أجل Hive. ويستطيع قبول رفعات من أشخاص سجّلوا الدخول إلى تطبيقك عبر Hivesigner: إذ يقوم رمز وصولهم مقام توقيع بمفتاحهم.

## كيف يعمل {#how-it-works}

1. يسجّل المستخدم الدخول إلى تطبيقك عبر Hivesigner، مع وصول النشر. ويستلم تطبيقك رمز وصول. راجع [تسجيل الدخول باستخدام OAuth2](/docs/oauth2).
2. يرسل تطبيقك الصورة إلى imagehoster الخاص بك، مع ذلك الرمز في العنوان.
3. يتحقق imagehoster من الرمز ومن الحساب، ويخزّن الصورة، ويجيب بعنوانها.
4. يضع تطبيقك العنوان في المنشور.

## شغّل imagehoster خاصًا بك {#run-your-own}

يُهيّأ imagehoster لحساب تطبيق واحد: `app_account` في قسم `[upload_limits]` من إعداداته. أرسل إليه رموزًا أُنشئت لحساب التطبيق ذاك. والنسخ العامة تخصّ تطبيقات أخرى: فـ images.ecency.com مهيّأ لحساب تطبيق Ecency و images.hive.blog لحساب Hive.blog. ولقبول رفعات مستخدميك، شغّل نسخة خاصة بك بحساب تطبيقك.

الشيفرة المصدرية وأدلة الإعداد:

- imagehoster الخاص بمجتمع Hive: https://gitlab.syncad.com/hive/imagehoster
- imagehoster الخاص بـ Ecency: https://github.com/ecency/imagehoster

في الإعدادات، اضبط حساب تطبيقك:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

ويضبط القسم نفسه الحد الأدنى للسمعة التي يحتاجها الحساب للرفع (`reputation`) وحصة الرفع لكل حساب (`max` رفعات لكل `duration` بالمللي ثانية). واضبط `redis_url` ليجري تطبيق الحصة فعليًا. و`max_image_size` يحدّد أكبر ملف، بالبايت.

## ارفع صورة {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **الرمز.** ضع رمز وصول المستخدم في المسار، كما أعطاه Hivesigner لتطبيقك. استخدم رمزًا من تسجيل دخول بوصول النشر لتطبيقك. أما رمز تسجيل الدخول فقط، القادم من طلب بلا `client_id`، فلا يسمّي أي تطبيق ويُرفض.
- **الجسم.** أرسل `multipart/form-data` بملف صورة واحد. ويأخذ imagehoster أول ملف، أيًّا كان اسم حقله.
- **الحجم.** أرسل ترويسة `Content-Length`. ويجب ألا يزيد حجم الملف عن `max_image_size` الخاص بالنسخة.

الإجابة JSON. وعند النجاح تحمل عنوان الصورة:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

وعند الفشل، يجيب imagehoster بحالة HTTP للخطأ. ومعظم حالات الفشل تحمل أيضًا اسم خطأ:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **ملاحظة:** ينتقل الرمز في العنوان. قدّم imagehoster الخاص بك عبر https فقط وأبقِ سجلات الوصول إليه خاصة.

## مثال {#example}

هذه الدالة في المتصفح ترفع ملفًا من حقل ملف أو من إفلات. ويضبط المتصفح ترويسات الأجزاء المتعددة والطول نيابةً عنك: لا تضبط `Content-Type` بنفسك.

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
