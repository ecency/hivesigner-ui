رمز Hivesigner بيان قصير موقَّع. يسمّي حسابًا على Hive، والتطبيق الذي أُنشئ له، ووقت توقيعه. ويمكن لخادمك التحقق من الرمز عبر الواجهة أو بنفسه. تعرض هذه الصفحة ما يحتويه الرمز، وكم يدوم، وطريقتي التحقق منه.

## كيف يبدو الرمز {#format}

الرمز كائن JSON مرمَّز بـ base64url، مع فارق واحد عن base64url القياسي: الحشو يستخدم `.` بدل `=`. فبالمقارنة مع base64 العادي، تصبح `+` هي `-`، وتصبح `/` هي `_`، وتصبح `=` هي `.`. وكل رمز يبدأ بـ `eyJzaWduZWRfbWVzc2FnZSI6`.

بعد فك الترميز، يبدو رمز الوصول من التدفق بالرمز هكذا:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| الحقل | المعنى |
| --- | --- |
| `signed_message.type` | ما هو الرمز: `login` أو `posting` أو `code` أو `refresh`. راجع [أنواع الرموز](#kinds). |
| `signed_message.app` | حساب التطبيق الذي أُنشئ الرمز له. ورمز تسجيل الدخول لموقع بلا حساب تطبيق ليس له أي حساب. |
| `authors[0]` | حساب Hive الذي يخصّه الرمز. |
| `timestamp` | وقت التوقيع، بالثواني منذ 1970-01-01 بالتوقيت العالمي. |
| `signatures[0]` | التوقيع، كسلسلة ست عشرية. |
| `authority` | في الرموز الموقّعة في المتصفح فقط: أي مفاتيح المستخدم وقّع، `posting` أو `active`. وهذا الحقل خارج البيانات الموقّعة. ولمعرفة المفتاح الذي وقّع، استخرجه من التوقيع. |

التوقيع هو توقيع secp256k1 على بصمة sha256 لـ `JSON.stringify({ signed_message, authors, timestamp })`، بالمفاتيح بهذا الترتيب.

### فكّ ترميز الرمز {#decode}

في Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

في المتصفح:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

فكّ الترميز ليس تحققًا. فبإمكان أي شخص بناء سلسلة تُفكّ إلى هذا الشكل. [تحقّق من الرمز](#check-a-token) قبل أن تثق به.

## أنواع الرموز {#kinds}

| الرمز | `type` | `app` | وقّعه | من أين تحصل عليه |
| --- | --- | --- | --- | --- |
| رمز وصول، التدفق بالرمز | `posting` | تطبيقك | مفتاح النشر لدى المستخدم، أو مفتاحه النشط عندما لا يحمل Hivesigner أي مفتاح نشر للحساب | `access_token` على عنوان الاستدعاء الخاص بك |
| رمز تسجيل دخول، `scope=login` | `login` | تطبيقك | مفتاح النشر أو المفتاح النشط لدى المستخدم | `access_token` على عنوان الاستدعاء الخاص بك |
| رمز تسجيل دخول، موقع بلا حساب تطبيق | `login` | لا يوجد | مفتاح النشر أو المفتاح النشط لدى المستخدم | `access_token` على عنوان الاستدعاء الخاص بك |
| كود | `code` | تطبيقك | مفتاح النشر أو المفتاح النشط لدى المستخدم | `code` على عنوان الاستدعاء الخاص بك |
| رمز وصول، التدفق بالكود | `posting` | تطبيقك | مفتاح النشر الخاص بـ @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| رمز تجديد | `refresh` | تطبيقك | مفتاح النشر الخاص بـ @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

الكود ورمز التجديد ليسا رمزي وصول. لا تقبل أيًّا منهما أبدًا كتسجيل دخول.

## كم يدوم الرمز {#lifetime}

يدوم رمز الوصول 7 أيام: فـ `expires_in` يساوي 604800 ثانية، محسوبة من `timestamp` الخاص به. وعند انتهاء صلاحيته:

- **التدفق بالرمز:** أرسل المستخدم لتسجيل الدخول من جديد. ومن سبق أن خوّل تطبيقك يرى "تسجيل الدخول إلى APP" ويحتاج نقرة واحدة.
- **التدفق بالكود:** يحصل خادمك على رمز وصول جديد باستخدام رمز التجديد ومفتاحك السري للعميل. راجع [التجديد](/docs/oauth2#refresh).

عُدّ الرمز منتهي الصلاحية متى تجاوز عمر `timestamp` الخاص به 7 أيام. واقبل عمرًا أقصر بكثير لأي شيء تتحقق منه مباشرةً بعد إعادة التوجيه. واستبدل الكود فورًا. ولا تقبل رمز تسجيل الدخول إلا خلال دقائق قليلة من `timestamp` الخاص به.

## تحقّق من الرمز على خادمك {#check-a-token}

قبل أن يثق خادمك برمز يرسله إليه متصفح أو تطبيق، تحقّق من أن:

- الحساب أو @hivesigner هو من وقّعه فعلًا؛
- أنه أُنشئ لتطبيقك؛
- أنه النوع الذي تتوقعه؛
- أنه حديث بما يكفي.

### اسأل الواجهة {#check-with-the-api}

استدعِ `/api/me` بالرمز. فالرمز الصالح يعيد الحساب في `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

والرمز غير الصالح يعيد `401` مع `invalid_grant`. راجع [GET /api/me](/docs/api#me).

`/api/me` يؤكّد التوقيع. لكن إجابته لا تسمّي التطبيق الذي أُنشئ الرمز له. لذلك فكّ ترميز الرمز أيضًا وتحقّق بنفسك من `app` و`type` وعمره. فالرمز المُنشأ لتطبيق آخر يجب ألا يسجّل دخول أحد إلى تطبيقك.

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

لا تقبل الواجهة إلا الرموز التي تسمّي تطبيقًا. تحقّق [بنفسك](#check-it-yourself) من رمز تسجيل الدخول القادم من موقع بلا حساب تطبيق.

### تحقّق بنفسك {#check-it-yourself}

1. فُكّ ترميز الرمز.
2. تحقّق من أن `signed_message.type` هو النوع الذي تتوقعه: `posting` لرمز وصول، و`login` لرمز تسجيل دخول.
3. تحقّق من أن `signed_message.app` هو حساب تطبيقك. وللموقع بلا حساب تطبيق، تحقّق من عدم وجود أي حساب.
4. تحقّق من العمر انطلاقًا من `timestamp`.
5. احسب بصمة sha256 لـ `JSON.stringify({ signed_message, authors, timestamp })`.
6. استخرج المفتاح العام من `signatures[0]` ومن تلك البصمة.
7. اقرأ الحساب `authors[0]` من سلسلة Hive الآن، لأن المستخدمين يستطيعون تغيير مفاتيحهم. ويجب أن يكون المفتاح المستخرج واحدًا من مفاتيح النشر أو المفاتيح النشطة الحالية للحساب. أما الرمز القادم من `/api/oauth2/token` فيوقّعه @hivesigner: فلتلك الرموز اقبل مفتاح نشر حاليًا لحساب @hivesigner.

في Node.js مع [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk)، التي تصدّر `PrivateKey` و`PublicKey` و`Signature` و`callRPC` تحت `@ecency/sdk/hive`:

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

استخدمها هكذا:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

ومكتبة dhive (`@hiveio/dhive`) تصلح أيضًا: احسب البصمة بـ `cryptoUtils.sha256(message)` واستخرج المفتاح بـ `Signature.fromString(signatures[0]).recover(digest).toString()`.

## حافظ على أمان الرموز {#keep-tokens-safe}

كل من يحمل رمز نشر يستطيع البثّ باسم المستخدم عبر تطبيقك إلى أن تنتهي صلاحيته. عامله ككلمة مرور.

- **احتفظ بالرموز على خادمك،** أو في ملف تعريف ارتباط httpOnly وSecure. واحتفظ برموز التجديد ومفتاحك السري للعميل على الخادم وحده.
- **لا تضع الرمز أبدًا في عنوان URL تسجّله.** فالتدفق بالرمز يسلّم الرمز في سلسلة استعلام عنوان الاستدعاء الخاص بك. اقرأه على خادمك ثم أعد التوجيه إلى عنوان بلا رمز. واترك سلسلة استعلام عنوان الاستدعاء خارج سجلاتك.
- **لا تحمّل شيئًا من مواقع أخرى في صفحة عنوان الاستدعاء،** كي لا يُرسل العنوان الذي يحمل الرمز إليها. وترويسة `Referrer-Policy: no-referrer` على تلك الصفحة تساعد.
- **لا ترسل الرمز إلا إلى خادمك أنت وإلى `https://hivesigner.com/api/`.**

## تسجيل الخروج وإزالة الوصول {#sign-out}

- **تسجيل خروج المستخدم** يعني التخلّص من الرمز: احذفه من جلستك أو من ملف تعريف الارتباط. ويمكنك أيضًا استدعاء [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) لإخبار Hivesigner بأن المستخدم سجّل الخروج. لكن تطبيقك يتخلّص من الرمز بنفسه على أي حال.
- **قطع وصول تطبيقك نهائيًا** قرار المستخدم. فعلى https://hivesigner.com/authorized-apps، أو على `https://hivesigner.com/revoke/APP`، يزيل حساب تطبيقك من صلاحية النشر الخاصة به على السلسلة. وبعد ذلك لا تبثّ الواجهة نيابةً عنه عبر تطبيقك.
