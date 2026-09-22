توکن Hivesigner یک بیانیه کوتاه امضاشده است. نام یک حساب Hive، برنامه‌ای که برای آن ساخته شده و زمان امضا را در خود دارد. سرور شما می‌تواند توکن را با API یا خودش بررسی کند. این صفحه نشان می‌دهد توکن چه چیزی در خود دارد، چه مدت اعتبار دارد و هر دو راه بررسی آن.

## توکن چه شکلی است {#format}

توکن یک شیء JSON است که با base64url رمزگذاری شده، با یک تفاوت نسبت به base64url استاندارد: برای لایی‌گذاری به‌جای `=` از `.` استفاده می‌شود. پس در مقایسه با base64 ساده، `+` می‌شود `-`، `/` می‌شود `_` و `=` می‌شود `.`. هر توکن با `eyJzaWduZWRfbWVzc2FnZSI6` آغاز می‌شود.

پس از رمزگشایی، یک توکن دسترسی از جریان توکن چنین است:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| فیلد | معنا |
| --- | --- |
| `signed_message.type` | توکن چیست: `login`، `posting`، `code` یا `refresh`. ببینید [گونه‌های توکن](#kinds). |
| `signed_message.app` | حساب برنامه‌ای که توکن برای آن ساخته شده. توکن ورود برای سایتی بدون حساب برنامه چنین چیزی ندارد. |
| `authors[0]` | حساب Hive که توکن برای آن است. |
| `timestamp` | زمان امضا، بر حسب ثانیه از 1970-01-01 به وقت جهانی. |
| `signatures[0]` | امضا، به‌صورت رشته شانزده‌شانزدهی. |
| `authority` | تنها در توکن‌هایی که در مرورگر امضا شده‌اند: کدام کلید کاربر امضا کرده است، `posting` یا `active`. این فیلد بیرون از داده‌های امضاشده است. برای دانستن اینکه کدام کلید امضا کرده، آن را از امضا بازیابی کنید. |

امضا یک امضای secp256k1 روی درهم‌سازی sha256 از `JSON.stringify({ signed_message, authors, timestamp })` است، با کلیدها به همین ترتیب.

### یک توکن را رمزگشایی کنید {#decode}

در Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

در مرورگر:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

رمزگشایی، بررسی نیست. هر کسی می‌تواند رشته‌ای بسازد که به همین شکل رمزگشایی شود. پیش از اعتماد، [توکن را بررسی کنید](#check-a-token).

## گونه‌های توکن {#kinds}

| توکن | `type` | `app` | امضاشده به‌دست | از کجا می‌گیرید |
| --- | --- | --- | --- | --- |
| توکن دسترسی، جریان توکن | `posting` | برنامه شما | کلید انتشار کاربر، یا کلید فعال او وقتی Hivesigner کلید انتشاری برای آن حساب نداشته باشد | `access_token` در نشانی بازگشت شما |
| توکن ورود، `scope=login` | `login` | برنامه شما | کلید انتشار یا کلید فعال کاربر | `access_token` در نشانی بازگشت شما |
| توکن ورود، سایت بدون حساب برنامه | `login` | ندارد | کلید انتشار یا کلید فعال کاربر | `access_token` در نشانی بازگشت شما |
| کد | `code` | برنامه شما | کلید انتشار یا کلید فعال کاربر | `code` در نشانی بازگشت شما |
| توکن دسترسی، جریان کد | `posting` | برنامه شما | کلید انتشار @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| توکن تازه‌سازی | `refresh` | برنامه شما | کلید انتشار @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

کد و توکن تازه‌سازی، توکن دسترسی نیستند. هرگز هیچ‌یک از آن دو را به‌عنوان ورود نپذیرید.

## توکن چه مدت اعتبار دارد {#lifetime}

توکن دسترسی ۷ روز اعتبار دارد: `expires_in` برابر ۶۰۴۸۰۰ ثانیه است، از `timestamp` آن شمرده می‌شود. وقتی منقضی شد:

- **جریان توکن:** کاربر را دوباره برای ورود بفرستید. کسی که پیش‌تر برنامه شما را مجاز کرده «ورود به APP» را می‌بیند و به یک کلیک نیاز دارد.
- **جریان کد:** سرور شما با توکن تازه‌سازی و کلید محرمانه کلاینت خود، توکن دسترسی تازه‌ای می‌گیرد. ببینید [تازه‌سازی](/docs/oauth2#refresh).

به‌محض آنکه `timestamp` توکن بیش از ۷ روز کهنه شد، آن را منقضی بشمارید. برای هر چیزی که درست پس از هدایت بررسی می‌کنید، زمان بسیار کوتاه‌تری بپذیرید. کد را بی‌درنگ مبادله کنید. توکن ورود را تنها در چند دقیقه پس از `timestamp` آن بپذیرید.

## توکن را روی سرور خود بررسی کنید {#check-a-token}

پیش از آنکه سرور شما به توکنی که مرورگر یا برنامه‌ای می‌فرستد اعتماد کند، بررسی کنید که:

- حساب یا @hivesigner واقعاً آن را امضا کرده باشد؛
- برای برنامه شما ساخته شده باشد؛
- همان گونه توکنی باشد که انتظار دارید؛
- به‌اندازه کافی تازه باشد.

### از API بپرسید {#check-with-the-api}

با توکن، `/api/me` را صدا بزنید. توکن معتبر حساب را در `user` برمی‌گرداند:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

توکن نامعتبر `401` با `invalid_grant` برمی‌گرداند. ببینید [GET /api/me](/docs/api#me).

`/api/me` امضا را تأیید می‌کند. پاسخ آن نام برنامه‌ای را که توکن برایش ساخته شده نمی‌برد. پس توکن را هم رمزگشایی کنید و `app`، `type` و زمان آن را خودتان بررسی کنید. توکنی که برای برنامه دیگری ساخته شده نباید کسی را به برنامه شما وارد کند.

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

API تنها توکن‌هایی را می‌پذیرد که نام برنامه‌ای را دارند. توکن ورود از سایتی بدون حساب برنامه را [خودتان](#check-it-yourself) بررسی کنید.

### خودتان بررسی کنید {#check-it-yourself}

1. توکن را رمزگشایی کنید.
2. بررسی کنید که `signed_message.type` همان گونه‌ای باشد که انتظار دارید: `posting` برای توکن دسترسی، `login` برای توکن ورود.
3. بررسی کنید که `signed_message.app` حساب برنامه شما باشد. برای سایتی بدون حساب برنامه، بررسی کنید که هیچ‌کدام نباشد.
4. زمان را از روی `timestamp` بررسی کنید.
5. درهم‌سازی sha256 از `JSON.stringify({ signed_message, authors, timestamp })` را حساب کنید.
6. کلید عمومی را از `signatures[0]` و همان درهم‌سازی بازیابی کنید.
7. حساب `authors[0]` را همین حالا از زنجیره Hive بخوانید، چون کاربران می‌توانند کلیدهای خود را عوض کنند. کلید بازیابی‌شده باید یکی از کلیدهای انتشار یا فعال کنونی آن باشد. توکنی که از `/api/oauth2/token` می‌آید را @hivesigner امضا می‌کند: برای آنها یک کلید انتشار کنونی حساب @hivesigner را بپذیرید.

در Node.js با [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk)، که `PrivateKey`، `PublicKey`، `Signature` و `callRPC` را زیر `@ecency/sdk/hive` عرضه می‌کند:

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

این‌گونه به کارش ببرید:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

کتابخانه dhive (`@hiveio/dhive`) هم کار می‌کند: درهم‌سازی را با `cryptoUtils.sha256(message)` حساب کنید و کلید را با `Signature.fromString(signatures[0]).recover(digest).toString()` بازیابی کنید.

## توکن‌ها را ایمن نگه دارید {#keep-tokens-safe}

هر کسی که توکن انتشار داشته باشد می‌تواند تا زمان انقضای آن از راه برنامه شما به‌جای کاربر منتشر کند. با آن مانند گذرواژه رفتار کنید.

- **توکن‌ها را روی سرور خود نگه دارید،** یا در یک کوکی httpOnly و Secure. توکن‌های تازه‌سازی و کلید محرمانه کلاینت را تنها روی سرور نگه دارید.
- **هرگز توکن را در نشانی‌ای که گزارش می‌کنید نگذارید.** جریان توکن، توکن را در رشته پرس‌وجوی نشانی بازگشت شما می‌رساند. آن را روی سرور بخوانید و سپس به نشانی‌ای بدون آن هدایت کنید. رشته پرس‌وجوی نشانی بازگشت را از گزارش‌های خود بیرون بگذارید.
- **در صفحه نشانی بازگشت چیزی از سایت‌های دیگر بار نکنید،** تا نشانی همراه توکن به آنها فرستاده نشود. سرایند `Referrer-Policy: no-referrer` در آن صفحه کمک می‌کند.
- **توکن را تنها به سرور خودتان و به `https://hivesigner.com/api/` بفرستید.**

## خروج و برداشتن دسترسی {#sign-out}

- **خارج کردن کاربر** یعنی دور انداختن توکن: آن را از نشست یا کوکی خود پاک کنید. می‌توانید [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) را هم صدا بزنید تا به Hivesigner بگویید کاربر خارج شده است. برنامه شما به هر حال توکن را خودش دور می‌اندازد.
- **قطع همیشگی دسترسی برنامه شما** انتخاب کاربر است. در https://hivesigner.com/authorized-apps، یا در `https://hivesigner.com/revoke/APP`، او حساب برنامه شما را روی زنجیره از اختیار انتشار خود برمی‌دارد. پس از آن API دیگر از راه برنامه شما به‌جای او منتشر نمی‌کند.
