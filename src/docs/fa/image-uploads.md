پست‌های Hive با نشانی URL به تصویرها اشاره می‌کنند، پس یک برنامه به جایی برای بارگذاری آنها نیاز دارد. imagehoster یک میزبان تصویر متن‌باز است که برای Hive ساخته شده. می‌تواند بارگذاری‌های افرادی را بپذیرد که با Hivesigner به برنامه شما وارد شده‌اند: توکن دسترسی آنها جای امضا با کلیدشان را می‌گیرد.

## چگونه کار می‌کند {#how-it-works}

1. کاربر با Hivesigner و با دسترسی انتشار به برنامه شما وارد می‌شود. برنامه شما یک توکن دسترسی می‌گیرد. ببینید [ورود با OAuth2](/docs/oauth2).
2. برنامه شما تصویر را با همان توکن در نشانی به imagehoster شما می‌فرستد.
3. imagehoster توکن و حساب را بررسی می‌کند، تصویر را ذخیره می‌کند و با نشانی آن پاسخ می‌دهد.
4. برنامه شما آن نشانی را در پست می‌گذارد.

## imagehoster خودتان را راه بیندازید {#run-your-own}

هر imagehoster برای یک حساب برنامه تنظیم می‌شود: `app_account` در بخش `[upload_limits]` پیکربندی آن. توکن‌هایی را برایش بفرستید که برای همان حساب برنامه ساخته شده‌اند. نمونه‌های عمومی به برنامه‌های دیگری تعلق دارند: images.ecency.com برای حساب برنامه Ecency تنظیم شده و images.hive.blog برای حساب Hive.blog. برای پذیرفتن بارگذاری‌های کاربران خودتان، نمونه‌ای از آن خودتان را با حساب برنامه خود راه بیندازید.

کد منبع و راهنماهای راه‌اندازی:

- imagehoster جامعه Hive: https://gitlab.syncad.com/hive/imagehoster
- imagehoster مربوط به Ecency: https://github.com/ecency/imagehoster

در پیکربندی، حساب برنامه خود را بگذارید:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

همان بخش کمینه اعتبار لازم برای بارگذاری یک حساب (`reputation`) و سهمیه بارگذاری هر حساب (`max` بارگذاری در هر `duration` میلی‌ثانیه) را تعیین می‌کند. `redis_url` را تنظیم کنید تا سهمیه واقعاً اعمال شود. `max_image_size` بزرگ‌ترین اندازه فایل را بر حسب بایت تعیین می‌کند.

## یک تصویر بارگذاری کنید {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **توکن.** توکن دسترسی کاربر را در مسیر بگذارید، همان‌گونه که Hivesigner آن را به برنامه شما داده است. از توکن یک ورود با دسترسی انتشار برای برنامه خود استفاده کنید. توکن فقط ورود، که از درخواستی بدون `client_id` می‌آید، نام هیچ برنامه‌ای را ندارد و رد می‌شود.
- **بدنه.** یک `multipart/form-data` با یک فایل تصویر بفرستید. imagehoster نخستین فایل را برمی‌دارد، نام فیلدش هر چه باشد.
- **اندازه.** یک سرایند `Content-Length` بفرستید. فایل نباید از `max_image_size` آن نمونه بزرگ‌تر باشد.

پاسخ JSON است. در صورت موفقیت نشانی تصویر را در خود دارد:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

در صورت شکست، imagehoster با یک وضعیت خطای HTTP پاسخ می‌دهد. بیشتر شکست‌ها نام خطا را هم در خود دارند:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **نکته:** توکن در نشانی جابه‌جا می‌شود. imagehoster خود را فقط روی https ارائه کنید و گزارش‌های دسترسی آن را خصوصی نگه دارید.

## نمونه {#example}

این تابع مرورگری یک فایل را از یک ورودی فایل یا از رها کردن بارگذاری می‌کند. مرورگر سرایندهای چندبخشی و طول را به‌جای شما تنظیم می‌کند: `Content-Type` را خودتان تنظیم نکنید.

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
