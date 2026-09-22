افراد را برای ورود به برنامه خود به Hivesigner بفرستید. آنها درخواست شما را آنجا بررسی می‌کنند و تأیید می‌کنند. سپس Hivesigner آنها را با یک توکن (جریان توکن) یا با کدی که سرور شما آن را با توکن مبادله می‌کند (جریان کد) به نشانی بازگشت شما بازمی‌گرداند. این صفحه هر دو جریان، همه پارامترها و دامنه‌ها را پوشش می‌دهد.

## پیش از آغاز {#before-you-start}

- برنامه خود را ثبت کنید: یک حساب Hive برای آن، با نشانی‌های بازگشت فهرست‌شده. ببینید [برنامه خود را ثبت کنید](/docs/register-app).
- برای انتشار از راه API، حساب برنامه شما باید [به @hivesigner اختیار انتشار هم بدهد](/docs/register-app#grant-hivesigner).
- برای جریان کد، یک [کلید محرمانه کلاینت](/docs/register-app#client-secret) تنظیم کنید.

## نشانی مجوز {#authorize-url}

کاربر را به این نشانی بفرستید:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

هر مقدار را با URL رمزگذاری کنید. `URLSearchParams` این کار را برای شما انجام می‌دهد:

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### پارامترها {#parameters}

| پارامتر | الزامی | چه می‌کند |
| --- | --- | --- |
| `client_id` | بله، برای یک برنامه | نام حساب برنامه شما. `clientId` هم خوانده می‌شود. بدون آن، درخواست یک درخواست فقط ورود از سایتی بدون حساب برنامه است: ببینید [ورود بدون دسترسی انتشار](/docs/login-only). |
| `redirect_uri` | بله | جایی که Hivesigner کاربر را به آن بازمی‌گرداند. باید دقیقاً یکی از نشانی‌های URI بازگشت برنامه شما باشد. ببینید [نشانی‌های بازگشت](/docs/register-app#callbacks). |
| `scope` | خیر | `login`، `posting` یا `offline`. ببینید [دامنه‌ها](#scopes). بدون آن، درخواست دسترسی انتشار می‌خواهد. |
| `response_type` | خیر | مقدار `code` [جریان کد](#code-flow) را آغاز می‌کند. هر مقدار دیگر، یا نبود آن، یعنی [جریان توکن](#token-flow). |
| `state` | توصیه‌شده | یک مقدار تصادفی که Hivesigner بدون تغییر بازمی‌گرداند. ببینید [درخواست را با state محافظت کنید](#state). |
| `account` | خیر | یک نام کاربری Hive. وقتی آن حساب روی دستگاه کاربر باشد، Hivesigner آن را انتخاب می‌کند. در غیر این صورت نادیده گرفته می‌شود. `select_account` هم خوانده می‌شود. |

کاربر همچنان می‌تواند در صفحه رضایت به حساب دیگری برود. همیشه حساب را از توکن یا از مبادله کد بگیرید، نه از آنچه خواسته‌اید.

## دامنه‌ها {#scopes}

Hive یک اختیار انتشار دارد. به همین دلیل Hivesigner دو سطح دسترسی دارد، فقط ورود و انتشار، و چیز ریزتری میان آن دو نیست.

| `scope` | آنچه کاربر تأیید می‌کند | جریان | `type` توکن دسترسی |
| --- | --- | --- | --- |
| `login` | «مشاهده نام کاربری حساب شما». چیزی داده نمی‌شود. | جریان توکن (`response_type=code` نیفزایید) | `login` |
| `posting` | دسترسی انتشار. نخستین بار، این کار حساب برنامه شما را به اختیار انتشار کاربر می‌افزاید. | جریان توکن، یا جریان کد با `response_type=code` | `posting` |
| `offline` | دسترسی انتشار، مانند بالا | جریان کد | `posting`، با یک توکن `refresh` |

در جریان کد، نشانی بازگشت نخست یک کد می‌گیرد (توکنی با `type` برابر `code`) که سرور شما آن را با توکن دسترسی مبادله می‌کند.

- **نبود دامنه** یعنی `posting`.
- **مقداری که در هر جای آن `offline` باشد** یعنی `offline`، برای نمونه `offline,vote,comment` قدیمی.
- **هر مقدار دیگر** یعنی `posting`. این شامل نام‌های قدیمی عملیات مانند `vote`، `comment`، `vote,comment`، `comment_options` یا `custom_json` هم می‌شود. آنها توکن را محدود نمی‌کنند: هر توکن انتشار همان عملیات را مجاز می‌کند. ببینید [broadcast چه می‌پذیرد](/docs/api#broadcast-rules).

وقتی برنامه شما فقط باید بداند کاربر کیست، `login` بخواهید. ببینید [ورود بدون دسترسی انتشار](/docs/login-only).

## جریان توکن {#token-flow}

مرورگر کاربر توکن دسترسی را مستقیم می‌گیرد. برنامه شما به هیچ کلید محرمانه‌ای نیاز ندارد.

1. کاربر را به نشانی مجوز بفرستید:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. کاربر تأیید می‌کند. Hivesigner به نشانی بازگشت شما هدایت می‌کند:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   وقتی نشانی بازگشت شما پرس‌وجو نداشته باشد Hivesigner پارامترهایش را با `?` می‌افزاید و وقتی داشته باشد با `&`. `state` تنها زمانی هست که مقداری ناتهی فرستاده باشید.

3. در نشانی بازگشت، نخست [`state` را مقایسه کنید](#state). سپس [توکن را بررسی کنید](/docs/tokens#check-a-token) روی سرور خود. حسابی که توکن برای آن است درون خود توکن است: تنها به پارامتر `username` تکیه نکنید، چون هر کسی می‌تواند یک نشانی را ویرایش کند.
4. توکن را روی سرور خود یا در یک کوکی httpOnly نگه دارید. به نشانی تمیزی هدایت کنید تا توکن از نوار نشانی بیرون برود.
5. توکن را با [API](/docs/api) به کار ببرید تا پس از `expires_in` ثانیه (۷ روز) منقضی شود. سپس کاربر را دوباره به نشانی مجوز بفرستید. کسی که پیش‌تر دسترسی انتشار داده «ورود به APP» و «شما قبلاً @myapp را مجاز کرده‌اید. دسترسی تازه‌ای داده نمی‌شود.» را می‌بیند.

## جریان کد {#code-flow}

سرور شما یک کد می‌گیرد و آن را با یک توکن دسترسی و یک توکن تازه‌سازی مبادله می‌کند. بعدها می‌تواند بدون کاربر آنها را تازه کند. وقتی سرور شما مدت درازی به‌جای کاربران عمل می‌کند، از آن استفاده کنید.

1. کاربر را با `scope=offline` به نشانی مجوز بفرستید:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` همان کار را می‌کند.

2. کاربر دسترسی انتشار را تأیید می‌کند. Hivesigner به نشانی بازگشت شما هدایت می‌کند:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [`state` را مقایسه کنید](#state). سپس کد را بی‌درنگ، از سرور خود، مبادله کنید.

### کد را مبادله کنید {#exchange-code}

کد و کلید محرمانه کلاینت خود را در بدنه یک درخواست POST به `/api/oauth2/token` بفرستید:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

پاسخ:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

همان فراخوانی در Node.js نسخه ۱۸ یا بالاتر:

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- کد و کلید محرمانه را در بدنه درخواست بگذارید، هرگز در نشانی.
- با این درخواست هیچ سرایند `Authorization` نفرستید.
- از `username` همین پاسخ استفاده کنید. از کدی می‌آید که کاربر امضا کرده است.
- توکن دسترسی و توکن تازه‌سازی را روی سرور خود نگه دارید.

### تازه‌سازی {#refresh}

وقتی توکن دسترسی منقضی شد، توکن تازه‌سازی را با کلید محرمانه کلاینت خود به همان نقطه بفرستید:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

پاسخ همان شکل را دارد، با یک توکن دسترسی تازه و یک توکن تازه‌سازی تازه. هر دو را به‌جای قبلی‌ها ذخیره کنید.

## درخواست را با state محافظت کنید {#state}

بدون `state`، سایت دیگری می‌تواند کاربر شما را با توکن یا کدی از انتخاب خودش به نشانی بازگشت شما بفرستد. آن‌گاه برنامه شما کاربر را به حساب شخص دیگری وارد می‌کند. `state` هر بازگشت را به مرورگری که ورود را آغاز کرده گره می‌زند.

1. برای هر ورود یک مقدار تصادفی بسازید، دست‌کم ۱۶ بایت تصادفی. شانزده‌شانزدهی آن را از نویسه‌هایی که به رمزگذاری نیاز دارند دور نگه می‌دارد.
2. آن را جایی نگه دارید که تنها همین مرورگر بتواند دوباره ارائه‌اش کند: نشست سرور شما، یا یک کوکی کوتاه‌عمر httpOnly و Secure با `SameSite=Lax`.
3. آن را به‌عنوان `state` در نشانی مجوز بفرستید.
4. در نشانی بازگشت، پارامتر `state` را با مقدار ذخیره‌شده مقایسه کنید. اگر نبود یا فرق داشت، بایستید: نه توکن را به کار ببرید نه کد را.
5. مقدار ذخیره‌شده را پاک کنید تا هر کدام یک بار کار کند.

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner همان مقدار `state` را که گرفته بازمی‌گرداند. مقدار تهی را کنار می‌گذارد.

## کاربر چه می‌بیند {#what-the-user-sees}

صفحه رضایت تصویر و نام برنامه شما، «حساب Hive @myapp» و «شما را به HOST می‌فرستد» را نشان می‌دهد، که HOST از نشانی بازگشت شما گرفته می‌شود. سپس:

- **نخستین درخواست انتشار.** عنوان می‌گوید «APP درخواست دسترسی به حساب شما را دارد.». کارت **دامنه** فهرست می‌کند که برنامه شما چه خواهد توانست بکند. آگهی‌ای می‌گوید «مجوز برای نخستین بار: این کار @myapp را روی زنجیره به اختیار انتشار شما اضافه می‌کند و یک بار به کلید فعال شما نیاز دارد. آن حساب تا زمانی که مجوزش را لغو نکنید، می‌تواند به‌جای شما پست بگذارد.». دکمه می‌گوید **مجاز کردن**. وقتی دستگاه کاربر کلید فعالی برای آن حساب نداشته باشد، صفحه همان‌جا آن را می‌خواهد.
- **ورود.** برای `scope=login`، یا برای دسترسی انتشاری که کاربر پیش‌تر داده است، عنوان می‌گوید «ورود به APP» و دکمه می‌گوید **ورود**.
- **حساب.** «مجاز کردن به‌عنوان» یا «ورود به‌عنوان»، و پس از آن حساب انتخاب‌شده. کاربر می‌تواند اینجا حساب را عوض کند.
- **حساب قفل‌شده.** بالای دکمه، فیلدی برای رمز عبور هست. یک کلیک قفل حساب را باز می‌کند و ادامه می‌دهد.
- **نبود هیچ حسابی روی دستگاه.** دکمه می‌گوید **ادامه**. فرم افزودن حساب را باز می‌کند و پس از آن به درخواست بازمی‌گردد.

پس از نخستین درخواست انتشار، Hivesigner پیش از هدایت صبر می‌کند تا اجازه تازه روی زنجیره دیده شود. این کار می‌تواند چند ثانیه طول بکشد. برای دیدن صفحه کامل از دید کاربر، ببینید [ورود به برنامه‌ها](/docs/signing-in).

## لغو و درخواست‌های ردشده {#cancel}

- **لغو.** کاربر به فهرست حساب‌های خود در Hivesigner می‌رود. چیزی به نشانی بازگشت شما فرستاده نمی‌شود: هیچ پارامتر خطایی وجود ندارد. دکمه ورود خود را در دسترس نگه دارید تا کاربر بتواند دوباره آغاز کند. منتظر بازگشتی نباشید.
- **درخواست‌های ردشده.** نشانی بازگشت ثبت‌نشده، `client_id` ناشناس یا نبود `redirect_uri` در Hivesigner خطایی را با دکمه **گزارش این مشکل** نشان می‌دهد. چیزی به نشانی بازگشت شما فرستاده نمی‌شود. ببینید [کاربران هنگام بروز مشکل چه می‌بینند](/docs/register-app#refused-requests).

## نشانی قدیمی درخواست ورود {#legacy-login-request}

Hivesigner هنوز نشانی قدیمی‌تر ورود را می‌پذیرد، که برای یکپارچه‌سازی‌های قدیمی نگه داشته شده است. برای موارد تازه از `/oauth2/authorize` استفاده کنید.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

همان صفحه رضایت را با همان بررسی‌های نشانی بازگشت و همان هدایت باز می‌کند. اما پارامترهایش را جور دیگری می‌خواند:

- `scope` برابر `login` یا `posting` است. هر مقدار دیگر، یا نبود آن، یعنی `login`.
- `offline` خوانده نمی‌شود. برای جریان کد، `response_type=code` بیفزایید.
- `account` خوانده نمی‌شود.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` از همان قاعده‌ها پیروی می‌کند.
