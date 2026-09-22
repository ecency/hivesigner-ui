کیت توسعه رسمی JavaScript نشانی‌های ورود و پیوندهای امضا را می‌سازد و API مربوط به Hivesigner را به‌جای شما صدا می‌زند. برای Python کتابخانه‌هایی از سوی جامعه هست. هر زبان دیگری می‌تواند مستقیم [REST API](/docs/api) را صدا بزند.

## کیت توسعه JavaScript {#javascript}

این کیت همان بسته npm با نام `hivesigner` است. کد منبع آن در https://github.com/ecency/hivesigner-sdk است. با TypeScript نوشته شده و انواع خودش را همراه دارد.

نسخه ۴ به Node.js نسخه ۱۸ یا بالاتر نیاز دارد، چون از `fetch` درون‌ساخته استفاده می‌کند. در مرورگرها به ES2017 یا بالاتر نیاز دارد. جایی که `fetch` سراسری نباشد، پیش از به‌کارگیری کیت یک polyfill بیفزایید. روی Node.js قدیمی‌تر روی نسخه ۳ بمانید.

### نصب {#install}

```bash
npm install hivesigner
```

برای صفحه‌ای بدون گام ساخت، بسته مرورگری را بار کنید. یک `hivesigner` سراسری تعریف می‌کند:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### یک کلاینت بسازید {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| گزینه | معنا |
| --- | --- |
| `app` | حساب برنامه شما، که به‌عنوان `client_id` فرستاده می‌شود. |
| `callbackURL` | جایی که Hivesigner کاربر را به آن بازمی‌گرداند. باید یکی از نشانی‌های بازگشت برنامه شما باشد، نویسه به نویسه (نشانی بازگشت لوپ‌بک با http ساده می‌تواند میزبان و درگاه متفاوتی داشته باشد، ببینید [نشانی‌های بازگشت](/docs/register-app#callback-rules)). |
| `scope` | یک فهرست، که با ویرگول در پارامتر `scope` به هم پیوند می‌خورد. ببینید [دامنه‌ها](/docs/oauth2#scopes). |
| `responseType` | مقدار `'code'` برای جریان کد. برای جریان توکن آن را کنار بگذارید. |
| `accessToken` | توکن دسترسی کاربر، اگر از پیش یکی دارید. |
| `apiURL` | مبدأ API. کیت `/api/` را به آن می‌افزاید. پیش‌فرض `https://hivesigner.com` است. |

توابع `setApp`، `setCallbackURL`، `setScope`، `setAccessToken`، `removeAccessToken` و `setApiURL` کلاینت را بعداً تغییر می‌دهند. هر کدام خود کلاینت را برمی‌گردانند.

### کاربر را وارد کنید {#sign-in}

`getLoginURL(state, account)` نشانی ورود را برمی‌گرداند:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` بدون تغییر به نشانی بازگشت شما بازمی‌گردد. از آن برای گره زدن پاسخ به درخواست استفاده کنید.
- `account` اختیاری است: یک نام کاربری. Hivesigner وقتی آن حساب روی دستگاه باشد آن را انتخاب می‌کند و در غیر این صورت نادیده می‌گیرد.

در مرورگر، `client.login({ state: 'STATE' })` کاربر را به همان نشانی می‌فرستد، بدون حساب.

در جریان توکن، نشانی بازگشت شما `access_token`، `expires_in` و `username` را می‌گیرد. توکن را به کلاینت بدهید:

```js
client.setAccessToken('ACCESS_TOKEN');
```

کیت برای مبادله جریان کد تابعی ندارد. سرور شما خودش کد و کلید محرمانه کلاینت را به API می‌فرستد، همان‌گونه که [کد را مبادله کنید](/docs/oauth2#exchange-code) نشان می‌دهد.

### کاربر را بگیرید {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` حساب Hive کاربر است، همان‌گونه که زنجیره برمی‌گرداند. `scope` فهرست می‌کند که توکن چه چیزی را مجاز می‌کند.

### انتشار {#broadcast}

`broadcast(operations)` عملیات را به API می‌فرستد و API آنها را به‌جای کاربر منتشر می‌کند. API تنها عملیات انتشاری را می‌پذیرد که نویسنده‌شان کاربر توکن باشد: `vote`، `comment`، `delete_comment`، `comment_options`، `custom_json` با اختیار انتشار، `claim_reward_balance` و `account_update2` برای فراداده پروفایل. ببینید [broadcast چه می‌پذیرد](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

در هر عملیات نام کاربر را بیاورید. API `__signer` را جایگزین نمی‌کند.

این توابع کمکی هر کدام یک عملیات می‌سازند و `broadcast` را صدا می‌زنند:

| تابع | چه چیزی منتشر می‌کند |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` از `-10000` تا `10000` (۱۰۰٪) است. |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. برای پست تازه، `parentAuthor` برابر `''` است. `jsonMetadata` می‌تواند شیء باشد: کیت آن را به رشته تبدیل می‌کند. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. مقدار `[]` را به‌عنوان `requiredAuths` و `['USERNAME']` را به‌عنوان `requiredPostingAuths` بدهید. `json` یک رشته است. |
| `reblog(account, author, permlink)` | `custom_json` با شناسه `follow`، که پست را بازنشر می‌کند |
| `follow(follower, following)` | `custom_json` با شناسه `follow`، با `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` با شناسه `follow`، با `what: []` |
| `ignore(follower, following)` | `custom_json` با شناسه `follow`، با `what: ['ignore']` (بی‌صدا کردن) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. مبلغ‌ها رشته‌هایی مانند `'0.000 HIVE'`، `'0.000 HBD'` و `'1.000000 VESTS'` هستند. |

`updateUserMetadata()` منسوخ است. برای تغییر پروفایل یک کاربر، `account_update2` را با `posting_json_metadata` تازه منتشر کنید.

### خروج {#log-out}

`revokeToken()` فراخوانی خروج در کیت است. توکن را به نقطه لغو در API می‌فرستد و سپس آن را از کلاینت برمی‌دارد. وقتی فراخوانی رد شود، خودتان `removeAccessToken()` را صدا بزنید. توکن را هر جا که برنامه شما ذخیره کرده هم پاک کنید.

برای پایان دادن همیشگی به دسترسی برنامه شما، کاربر آن را در https://hivesigner.com/authorized-apps برمی‌دارد. ببینید [دیدن و برداشتن دسترسی یک برنامه](/docs/signing-in#remove-access).

### پیوندهای امضا {#sign-links}

`sendOperation(op, params)`، `sendOperations(ops, params)` و `sendTransaction(tx, params)` یک پیوند `https://hivesigner.com/sign/...` برمی‌گردانند. `params` مقادیر `callback`، `no_broadcast` و `signer` را می‌گیرد. ببینید [پیوندهای امضا](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

در TypeScript، انواع، آرگومان سوم را الزامی می‌کنند: برای گرفتن پیوند، `undefined` بدهید.

در مرورگر، تابعی را به‌عنوان آرگومان سوم بدهید تا پیوند در زبانه تازه‌ای باز شود. آن تابع صدا زده نمی‌شود و چیزی بازگردانده نمی‌شود. آن را از یک گرداننده کلیک صدا بزنید، وگرنه مرورگر ممکن است زبانه تازه را ببندد و فراخوانی خطا بدهد.

### وعده‌ها و توابع بازگشتی {#promises-and-callbacks}

`me`، `broadcast`، توابع کمکی و `revokeToken` یک وعده برمی‌گردانند. برای استفاده از تابع بازگشتی به‌جای آن، تابعی را به‌عنوان آخرین آرگومان بدهید. آن تابع `(error, result)` می‌گیرد.

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

وقتی API با خطا پاسخ دهد، وعده با بدنه خطای API رد می‌شود، `{ error, error_description }`. با تابع بازگشتی، همان بدنه آرگومان `error` است. وقتی پاسخ JSON نباشد، با خطای تجزیه رد می‌شود.

## Python {#python}

این کتابخانه‌ها از جامعه می‌آیند. نویسندگانشان آنها را نگه‌داری می‌کنند، نه تیم Hivesigner. پیش از تکیه بر آنها، آنها را با [REST API](/docs/api) بسنجید.

| کتابخانه | نویسنده |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem، پیمانه `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
