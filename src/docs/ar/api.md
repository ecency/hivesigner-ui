واجهة Hivesigner على `https://hivesigner.com/api/`. تعيد حساب المستخدم الذي سجّل الدخول، وتبثّ عمليات النشر نيابةً عنه، وتستبدل الأكواد بالرموز، وتسرد التطبيقات التي تستخدم Hivesigner. تصف هذه الصفحة كل نقطة نهاية مع طلباتها وإجاباتها وأخطائها.

## الطلبات والمصادقة {#authentication}

- **العنوان الأساسي:** `https://hivesigner.com/api/`. وكل نقطة نهاية أدناه نسبية إلى `https://hivesigner.com`.
- **الرمز:** أرسله كترويسة `Authorization` كما هو: `Authorization: ACCESS_TOKEN`. ويُقبل أيضًا البادئة `Bearer `. ويمكنك إرساله كذلك باسم `access_token` في سلسلة الاستعلام أو في الجسم، لكن الترويسة تبقيه خارج العناوين والسجلات.
- **الأجسام:** JSON مع `Content-Type: application/json`، أو نموذج (`application/x-www-form-urlencoded`).
- **الإجابات:** JSON.
- **المتصفحات:** تسمح الواجهة بالطلبات عبر الأصول، فيستطيع تطبيق ويب استدعاءها مباشرةً.

للحصول على رمز، راجع [تسجيل الدخول باستخدام OAuth2](/docs/oauth2). ولمعرفة ما يحتويه الرمز، راجع [الرموز](/docs/tokens).

## الأخطاء {#errors}

إجابة الخطأ لها حالة HTTP للخطأ وهذا الجسم:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| الحالة | `error` | متى |
| --- | --- | --- |
| 401 | `invalid_grant` | الرمز مفقود أو غير صالح، أو أنه من النوع الخطأ لهذه النقطة ("The token has invalid role"). وعلى `/api/oauth2/token` أيضًا "The code or secret is not valid". |
| 401 | `invalid_scope` | `/api/broadcast`: عملية لا يسمح بها الرمز. ويسمّي الوصف العمليات. |
| 401 | `unauthorized_client` | `/api/broadcast`: عملية ليس مؤلفها مستخدم الرمز، أو `account_update2` تمسّ المفاتيح، أو تفويض صلاحية نشر مفقود، أو حساب تعذّر تحميله. ويقول الوصف أيّها. |
| 500 | `server_error` | `/api/broadcast`: رفضت شبكة Hive المعاملة. ويحمل `error_description` رسالتها. |
| 503 | `unavailable` | `/api/apps`: الدليل ما زال قيد البناء. |

## GET /api/me {#me}

تعيد الحساب الذي يخصّه الرمز. استخدمها لمعرفة من سجّل الدخول، أو [للتحقق من رمز](/docs/tokens#check-with-the-api).

- **الطرق:** `GET` أو `POST`.
- **الرمز:** رمز وصول، بما في ذلك رمز `login` يسمّي تطبيقًا.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

الإجابة، مختصرة:

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

| الحقل | المعنى |
| --- | --- |
| `user` | اسم مستخدم Hive الذي يخصّه الرمز. ويكرّره `_id` و`name`. |
| `account` | الحساب كاملًا، كما تعيده `condenser_api.get_accounts` في Hive. |
| `scope` | ما يسمح به الرمز: `["login"]` لرمز تسجيل دخول، وإلا فالعمليات التي يقبلها `/api/broadcast`. |
| `user_metadata` | بيانات الملف الشخصي للحساب، محلّلة من JSON. |

لا يسمّي `/api/me` التطبيق الذي أُنشئ الرمز له. وللتحقق من ذلك، فُكّ ترميز الرمز: راجع [اسأل الواجهة](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

توقّع عمليات النشر نيابةً عن مستخدم الرمز بمفتاح النشر الخاص بـ @hivesigner وتبثّها إلى Hive.

- **الطريقة:** `POST`.
- **الرمز:** رمز وصول `posting`، من التدفق بالرمز أو التدفق بالكود.
- **قبل أن تعمل:** يكون المستخدم قد منح حساب تطبيقك صلاحية النشر (تفعل ذلك شاشة الموافقة) ويكون حساب تطبيقك قد [منح @hivesigner صلاحية النشر](/docs/register-app#grant-hivesigner).
- **الجسم:** `{ "operations": [...] }`، حيث تكون كل عملية `[name, fields]` كما على سلسلة Hive. وكل العمليات في طلب واحد تدخل في معاملة واحدة.

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

الطلب نفسه باستخدام curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

المتابعة عملية `custom_json`:

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

تجيب الواجهة بمجرد أن تقبل عقدة Hive المعاملة. و`result.id` هو معرّف المعاملة:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

وعندما ترفض الشبكة المعاملة، تكون الإجابة `500` مع `server_error`. ويحمل `error_description` رسالة الشبكة ويحمل `response` الخطأ الخام.

### ما يقبله البثّ {#broadcast-rules}

يسمح رمز النشر للواجهة ببثّ هذه العمليات لا غير. وفي كل واحدة، يجب أن يكون مستخدم الرمز هو الحساب المذكور في الحقل المبيّن:

| العملية | يجب أن يكون مستخدم الرمز |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | أول حساب في `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **أي عملية أخرى** تُرفض بـ `invalid_scope`. ورمز `login` لا يسمح بأي عملية على الإطلاق.
- **عملية لحساب آخر** تُرفض بـ `unauthorized_client`. فالرمز لا يبثّ أبدًا إلا نيابةً عن مستخدمه هو.
- **`account_update2`** لا يمكنها تغيير غير بيانات الحساب الوصفية. وأي عملية تحمل حقل `owner` أو `active` أو `posting` تُرفض بـ `unauthorized_client`.
- **`custom_json`**: اترك `required_auths` فارغًا. فالواجهة توقّع بصلاحية النشر، ولذلك تفشل على الشبكة أي عملية تحتاج الصلاحية النشطة.

التحويلات وغيرها من عمليات المحفظة تحتاج المفتاح النشط للمستخدم. أرسلها بدلًا من ذلك على هيئة [روابط توقيع](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

تستبدل كودًا برموز، أو رمز تجديد برموز جديدة. استدعِها من خادمك فقط. راجع [التدفق بالكود](/docs/oauth2#code-flow).

- **الطريقة:** `POST`، مع القيم في الجسم.
- **الجسم:** `code` و`client_secret`، أو `refresh_token` و`client_secret`.
- **الترويسات:** لا ترسل أي ترويسة `Authorization`.

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

كل استدعاء يعيد رمز وصول جديدًا ورمز تجديد جديدًا. ويوقّعهما @hivesigner. و`expires_in` هو عمر رمز الوصول بالثواني (7 أيام).

الأخطاء: `401 invalid_grant`. ويكون الوصف "The token has invalid role" عندما لا تكون القيمة المرسلة كودًا ولا رمز تجديد صالحًا. ويكون "The code or secret is not valid" عندما لا يتطابق الكود أو المفتاح السري.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

تخبر Hivesigner بأن المستخدم سجّل الخروج من تطبيقك. ويتخلّص تطبيقك من الرمز بنفسه.

- **الطريقة:** `POST`.
- **الرمز:** رمز الوصول، في ترويسة `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

تجري `revokeToken()` في حزمة JavaScript SDK هذا الاستدعاء ثم تنسى الرمز. ولإزالة وصول تطبيقك نهائيًا، يزيله المستخدم على https://hivesigner.com/authorized-apps. راجع [تسجيل الخروج وإزالة الوصول](/docs/tokens#sign-out).

## GET /api/apps {#apps}

دليل التطبيقات العام: التطبيقات التي تبثّ عبر Hivesigner، مرتّبة بحسب عدد مستخدميها. ولا يحتاج أي رمز. ويعرض https://hivesigner.com/apps القائمة نفسها.

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

| الحقل | المعنى |
| --- | --- |
| `updated_at` | آخر مرة بُني فيها الدليل. |
| `building` | `true` إلى أن تصبح لدى أول بناء بيانات. ويكون `apps` عندئذٍ فارغًا. |
| `window_days` | عدد الأيام التي يغطيها الترتيب. |
| `featured` | أسماء المستخدمين المعروضة أولًا، بالترتيب. |
| `apps[].username` | حساب التطبيق. |
| `apps[].name`, `about` | من الملف الشخصي لحساب التطبيق، أو `null`. |
| `apps[].website` | الموقع الإلكتروني من الملف الشخصي، إذا استجاب على نطاقه هو. وإلا `null`. |
| `apps[].site` | نتيجة فحص الموقع الإلكتروني: `ok` أو `no_website` أو `invalid` أو `redirected` أو `blocked` أو `unreachable`. والمُدخل `redirected` يحمل أيضًا `redirects_to`. |
| `apps[].users` | المستخدمون المتمايزون يوميًا، مجموعين على المدة. |
| `apps[].requests` | طلبات الواجهة الناجحة التي جرت للتطبيق خلال المدة. |
| `apps[].first_seen`, `last_seen` | أول يوم سجّل فيه Hivesigner التطبيق وآخر يوم استُخدم فيه، أو `null`. |
| `apps[].new` | `true` عندما يظهر التطبيق لأول مرة داخل المدة. |

قد تبقى الإجابة في ذاكرة مؤقتة حتى 5 دقائق. وقبل بناء الدليل أول مرة، تجيب الواجهة بـ `503` مع `unavailable`. أعد المحاولة لاحقًا.

الأسماء والأوصاف ينشرها كل حساب تطبيق بنفسه. ولا يتحقق Hivesigner من أي منها.
