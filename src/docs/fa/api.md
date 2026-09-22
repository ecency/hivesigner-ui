API مربوط به Hivesigner روی `https://hivesigner.com/api/` است. حساب کاربر واردشده را برمی‌گرداند، عملیات انتشار را به‌جای او منتشر می‌کند، کدها را با توکن مبادله می‌کند و برنامه‌هایی را که از Hivesigner استفاده می‌کنند فهرست می‌کند. این صفحه هر نقطه پایانی را با درخواست‌ها، پاسخ‌ها و خطاهای آن شرح می‌دهد.

## درخواست‌ها و احراز هویت {#authentication}

- **نشانی پایه:** `https://hivesigner.com/api/`. هر نقطه پایانی زیر نسبت به `https://hivesigner.com` است.
- **توکن:** آن را همان‌گونه که هست به‌عنوان سرایند `Authorization` بفرستید: `Authorization: ACCESS_TOKEN`. پیشوند `Bearer ` هم پذیرفته می‌شود. می‌توانید آن را به‌عنوان `access_token` در رشته پرس‌وجو یا در بدنه هم بفرستید، اما سرایند آن را از نشانی‌ها و گزارش‌ها دور نگه می‌دارد.
- **بدنه‌ها:** JSON با `Content-Type: application/json`، یا یک فرم (`application/x-www-form-urlencoded`).
- **پاسخ‌ها:** JSON.
- **مرورگرها:** API درخواست‌های میان‌مبدأ را مجاز می‌کند، پس یک برنامه وب می‌تواند مستقیم آن را صدا بزند.

برای گرفتن توکن، ببینید [ورود با OAuth2](/docs/oauth2). برای اینکه توکن چه چیزی در خود دارد، ببینید [توکن‌ها](/docs/tokens).

## خطاها {#errors}

پاسخ خطا یک وضعیت خطای HTTP و این بدنه را دارد:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| وضعیت | `error` | چه زمانی |
| --- | --- | --- |
| 401 | `invalid_grant` | توکن نیست یا معتبر نیست، یا برای این نقطه پایانی از گونه نادرست است ("The token has invalid role"). در `/api/oauth2/token` همچنین "The code or secret is not valid". |
| 401 | `invalid_scope` | `/api/broadcast`: عملیاتی که توکن آن را مجاز نمی‌کند. توضیح، نام عملیات را می‌برد. |
| 401 | `unauthorized_client` | `/api/broadcast`: عملیاتی که نویسنده‌اش کاربر توکن نیست، یک `account_update2` که کلیدها را دست می‌زند، نبود اجازه اختیار انتشار، یا حسابی که بار نشد. توضیح می‌گوید کدام است. |
| 500 | `server_error` | `/api/broadcast`: شبکه Hive تراکنش را رد کرد. `error_description` پیام آن را در خود دارد. |
| 503 | `unavailable` | `/api/apps`: فهرست هنوز در حال ساخته شدن است. |

## GET /api/me {#me}

حسابی را که توکن برای آن است برمی‌گرداند. از آن برای دانستن اینکه چه کسی وارد شده، یا برای [بررسی یک توکن](/docs/tokens#check-with-the-api) استفاده کنید.

- **روش‌ها:** `GET` یا `POST`.
- **توکن:** یک توکن دسترسی، از جمله توکن `login` که نام برنامه‌ای را دارد.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

پاسخ، کوتاه‌شده:

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| فیلد | معنا |
| --- | --- |
| `user` | نام کاربری Hive که توکن برای آن است. `_id` و `name` همان را تکرار می‌کنند. |
| `account` | کل حساب، همان‌گونه که `condenser_api.get_accounts` در Hive برمی‌گرداند. |
| `scope` | آنچه توکن مجاز می‌کند: `["login"]` برای توکن ورود، و در غیر این صورت عملیاتی که `/api/broadcast` می‌پذیرد. |
| `user_metadata` | فراداده پروفایل حساب، خوانده‌شده از JSON. |

`/api/me` نام برنامه‌ای را که توکن برایش ساخته شده نمی‌برد. برای بررسی آن، توکن را رمزگشایی کنید: ببینید [از API بپرسید](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

عملیات انتشار کاربر توکن را با کلید انتشار @hivesigner امضا می‌کند و به Hive می‌فرستد.

- **روش:** `POST`.
- **توکن:** یک توکن دسترسی `posting`، از جریان توکن یا جریان کد.
- **پیش از آنکه کار کند:** کاربر به حساب برنامه شما اختیار انتشار داده باشد (صفحه رضایت این کار را می‌کند) و حساب برنامه شما [به @hivesigner اختیار انتشار داده باشد](/docs/register-app#grant-hivesigner).
- **بدنه:** `{ "operations": [...] }`، که در آن هر عملیات `[name, fields]` است، همان‌گونه که روی زنجیره Hive هست. همه عملیات یک درخواست در یک تراکنش می‌روند.

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

همان درخواست با curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

دنبال کردن یک عملیات `custom_json` است:

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

API به‌محض آنکه گره‌ای از Hive تراکنش را بپذیرد پاسخ می‌دهد. `result.id` شناسه تراکنش است:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

وقتی شبکه تراکنش را رد کند، پاسخ `500` با `server_error` است. `error_description` آن پیام شبکه را در خود دارد و `response` خطای خام را.

### broadcast چه می‌پذیرد {#broadcast-rules}

توکن انتشار به API اجازه می‌دهد این عملیات را منتشر کند و نه چیز دیگری. در هر کدام، کاربر توکن باید همان حسابی باشد که در فیلد نشان‌داده‌شده آمده است:

| عملیات | کاربر توکن باید باشد |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | نخستین حساب در `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **هر عملیات دیگر** با `invalid_scope` رد می‌شود. توکن `login` هیچ عملیاتی را مجاز نمی‌کند.
- **عملیاتی برای حساب دیگر** با `unauthorized_client` رد می‌شود. توکن همیشه تنها به‌جای کاربر خودش منتشر می‌کند.
- **`account_update2`** تنها می‌تواند فراداده حساب را عوض کند. عملیاتی با فیلد `owner`، `active` یا `posting` با `unauthorized_client` رد می‌شود.
- **`custom_json`**: `required_auths` را تهی بگذارید. API با اختیار انتشار امضا می‌کند، پس عملیاتی که به اختیار فعال نیاز دارد روی شبکه شکست می‌خورد.

انتقال‌ها و دیگر عملیات کیف پول به کلید فعال کاربر نیاز دارند. آنها را به‌جای این کار به‌صورت [پیوندهای امضا](/docs/sign-links) بفرستید.

## POST /api/oauth2/token {#oauth2-token}

یک کد را با توکن، یا یک توکن تازه‌سازی را با توکن‌های تازه مبادله می‌کند. تنها از سرور خودتان صدا بزنید. ببینید [جریان کد](/docs/oauth2#code-flow).

- **روش:** `POST`، با مقادیر در بدنه.
- **بدنه:** `code` و `client_secret`، یا `refresh_token` و `client_secret`.
- **سرایندها:** هیچ سرایند `Authorization` نفرستید.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

هر فراخوانی یک توکن دسترسی تازه و یک توکن تازه‌سازی تازه برمی‌گرداند. هر دو را @hivesigner امضا می‌کند. `expires_in` عمر توکن دسترسی بر حسب ثانیه است (۷ روز).

خطاها: `401 invalid_grant`. وقتی مقدار فرستاده‌شده کد یا توکن تازه‌سازی معتبری نباشد، توضیح «The token has invalid role» است. وقتی کد یا کلید محرمانه جور نباشد، «The code or secret is not valid» است.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

به Hivesigner می‌گوید که کاربر از برنامه شما خارج شده است. برنامه شما خودش توکن را دور می‌اندازد.

- **روش:** `POST`.
- **توکن:** توکن دسترسی، در سرایند `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

تابع `revokeToken()` در کیت توسعه JavaScript همین فراخوانی را انجام می‌دهد و سپس توکن را فراموش می‌کند. برای برداشتن همیشگی دسترسی برنامه شما، کاربر آن را در https://hivesigner.com/authorized-apps برمی‌دارد. ببینید [خروج و برداشتن دسترسی](/docs/tokens#sign-out).

## GET /api/apps {#apps}

فهرست عمومی برنامه‌ها: برنامه‌هایی که از راه Hivesigner منتشر می‌کنند، مرتب‌شده بر پایه شمار کاربرانشان. به هیچ توکنی نیاز ندارد. https://hivesigner.com/apps همان فهرست را نشان می‌دهد.

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| فیلد | معنا |
| --- | --- |
| `updated_at` | آخرین باری که فهرست ساخته شده است. |
| `building` | تا زمانی که نخستین ساخت داده‌ای نداشته باشد `true` است. `apps` آن‌گاه تهی است. |
| `window_days` | شمار روزهایی که رتبه‌بندی پوشش می‌دهد. |
| `featured` | نام‌های کاربری که نخست نشان داده می‌شوند، به همان ترتیب. |
| `apps[].username` | حساب برنامه. |
| `apps[].name`, `about` | از پروفایل حساب برنامه، یا `null`. |
| `apps[].website` | وب‌سایت از پروفایل، وقتی روی دامنه خودش پاسخ دهد. در غیر این صورت `null`. |
| `apps[].site` | نتیجه بررسی وب‌سایت: `ok`، `no_website`، `invalid`، `redirected`، `blocked` یا `unreachable`. مدخل `redirected` مقدار `redirects_to` را هم دارد. |
| `apps[].users` | کاربران متمایز روزانه، جمع‌شده روی بازه. |
| `apps[].requests` | درخواست‌های موفق API که در آن بازه برای برنامه انجام شده‌اند. |
| `apps[].first_seen`, `last_seen` | نخستین روزی که Hivesigner برنامه را ثبت کرده و آخرین روزی که به کار رفته، یا `null`. |
| `apps[].new` | وقتی برنامه نخستین بار درون همان بازه پیدا شده باشد `true` است. |

پاسخ می‌تواند تا ۵ دقیقه در حافظه نهان بماند. پیش از نخستین ساخت فهرست، API با `503` و `unavailable` پاسخ می‌دهد. بعدها دوباره تلاش کنید.

نام‌ها و توضیح‌ها را هر حساب برنامه خودش منتشر می‌کند. Hivesigner هیچ‌کدام را تأیید نمی‌کند.
