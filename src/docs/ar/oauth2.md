أرسل الأشخاص إلى Hivesigner لتسجيل الدخول إلى تطبيقك. يراجعون طلبك هناك ويوافقون عليه. ثم يعيدهم Hivesigner إلى عنوان الاستدعاء الخاص بك ومعهم رمز (التدفق بالرمز) أو كود يستبدله خادمك برموز (التدفق بالكود). تغطي هذه الصفحة التدفقين وكل المعاملات والنطاقات.

## قبل أن تبدأ {#before-you-start}

- سجّل تطبيقك: حساب Hive له، مع إدراج عناوين الاستدعاء الخاصة بك. راجع [تسجيل تطبيقك](/docs/register-app).
- للبثّ عبر الواجهة، يجب أيضًا أن [يمنح حساب تطبيقك صلاحية النشر إلى @hivesigner](/docs/register-app#grant-hivesigner).
- للتدفق بالكود، اضبط [مفتاحًا سريًا للعميل](/docs/register-app#client-secret).

## عنوان التخويل {#authorize-url}

أرسل المستخدم إلى هذا العنوان:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

رمّز كل قيمة بترميز URL. و`URLSearchParams` تفعل ذلك نيابةً عنك:

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

### المعاملات {#parameters}

| المعامل | مطلوب | ما يفعله |
| --- | --- | --- |
| `client_id` | نعم، للتطبيق | اسم حساب تطبيقك. ويُقرأ `clientId` أيضًا. وبدونه يكون الطلب طلب تسجيل دخول فقط من موقع بلا حساب تطبيق: راجع [تسجيل الدخول دون وصول النشر](/docs/login-only). |
| `redirect_uri` | نعم | المكان الذي يعيد Hivesigner المستخدم إليه. ويجب أن يكون أحد عناوين URI لإعادة التوجيه الخاصة بتطبيقك، تمامًا. راجع [عناوين الاستدعاء](/docs/register-app#callbacks). |
| `scope` | لا | `login` أو `posting` أو `offline`. راجع [النطاقات](#scopes). وبدونه يطلب الطلب وصول النشر. |
| `response_type` | لا | القيمة `code` تبدأ [التدفق بالكود](#code-flow). وأي قيمة أخرى، أو لا قيمة، تعني [التدفق بالرمز](#token-flow). |
| `state` | مستحسن | قيمة عشوائية يعيدها Hivesigner دون تغيير. راجع [احمِ الطلب بـ state](#state). |
| `account` | لا | اسم مستخدم على Hive. فإذا كان ذلك الحساب على جهاز المستخدم، حدّده Hivesigner. وإلا جرى تجاهله. ويُقرأ `select_account` أيضًا. |

يظل بإمكان المستخدم التبديل إلى حساب آخر على شاشة الموافقة. خذ الحساب دائمًا من الرمز أو من تبادل الكود، لا مما طلبته.

## النطاقات {#scopes}

لدى Hive صلاحية نشر واحدة. لذلك لدى Hivesigner مستويان للوصول، تسجيل الدخول فقط والنشر، وليس بينهما شيء أدقّ.

| `scope` | ما يوافق عليه المستخدم | التدفق | `type` رمز الوصول |
| --- | --- | --- | --- |
| `login` | "عرض اسم المستخدم لحسابك". لا يُمنح شيء. | التدفق بالرمز (لا تضف `response_type=code`) | `login` |
| `posting` | وصول النشر. وفي المرة الأولى يضيف هذا حساب تطبيقك إلى صلاحية النشر لدى المستخدم. | التدفق بالرمز، أو التدفق بالكود مع `response_type=code` | `posting` |
| `offline` | وصول النشر، كما أعلاه | التدفق بالكود | `posting`، مع رمز `refresh` |

في التدفق بالكود، يستلم عنوان الاستدعاء أولًا كودًا (رمزًا من `type` يساوي `code`) يستبدله خادمك برمز الوصول.

- **بلا نطاق** تعني `posting`.
- **أي قيمة تحتوي على `offline`** في أي موضع تعني `offline`، مثل القديمة `offline,vote,comment`.
- **أي قيمة أخرى** تعني `posting`. ويشمل ذلك أسماء العمليات القديمة مثل `vote` و`comment` و`vote,comment` و`comment_options` و`custom_json`. وهي لا تحدّ الرمز: فكل رموز النشر تسمح بالعمليات نفسها. راجع [ما يقبله البثّ](/docs/api#broadcast-rules).

اطلب `login` عندما يحتاج تطبيقك فقط إلى معرفة هوية المستخدم. راجع [تسجيل الدخول دون وصول النشر](/docs/login-only).

## التدفق بالرمز {#token-flow}

يستلم متصفح المستخدم رمز الوصول مباشرةً. ولا يحتاج تطبيقك إلى أي مفتاح سري.

1. أرسل المستخدم إلى عنوان التخويل:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. يوافق المستخدم. ويعيد Hivesigner التوجيه إلى عنوان الاستدعاء الخاص بك:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   يضيف Hivesigner معاملاته بعلامة `?` عندما لا يحمل عنوانك استعلامًا وبعلامة `&` عندما يحمل واحدًا. ولا يكون `state` موجودًا إلا إذا أرسلت قيمة غير فارغة.

3. على عنوان الاستدعاء، [قارن `state`](#state) أولًا. ثم [تحقّق من الرمز](/docs/tokens#check-a-token) على خادمك. فالحساب الذي يخصّه الرمز موجود داخله: لا تعتمد على المعامل `username` وحده، لأن بإمكان أي شخص تحرير عنوان URL.
4. احتفظ بالرمز على خادمك أو في ملف تعريف ارتباط httpOnly. وأعد التوجيه إلى عنوان نظيف ليخرج الرمز من شريط العناوين.
5. استخدم الرمز مع [الواجهة](/docs/api) إلى أن تنتهي صلاحيته بعد `expires_in` ثانية (7 أيام). ثم أرسل المستخدم إلى عنوان التخويل مرة أخرى. ومن سبق أن منح وصول النشر يرى "تسجيل الدخول إلى APP" و"سبق أن خوّلت @myapp. لن يُمنح أي إذن جديد.".

## التدفق بالكود {#code-flow}

يستلم خادمك كودًا ويستبدله برمز وصول ورمز تجديد. ويمكنه تجديدهما لاحقًا دون المستخدم. استخدمه عندما يتصرف خادمك نيابةً عن المستخدمين لفترة طويلة.

1. أرسل المستخدم إلى عنوان التخويل مع `scope=offline`:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   و`scope=posting&response_type=code` تفعل الشيء نفسه.

2. يوافق المستخدم على وصول النشر. ويعيد Hivesigner التوجيه إلى عنوان الاستدعاء الخاص بك:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [قارن `state`](#state). ثم استبدل الكود فورًا، من خادمك.

### استبدل الكود {#exchange-code}

أرسل الكود ومفتاحك السري للعميل إلى `/api/oauth2/token` في جسم طلب POST:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

الإجابة:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

الاستدعاء نفسه في Node.js 18 أو أحدث:

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

- ضع الكود والمفتاح السري في جسم الطلب، لا في عنوان URL.
- لا ترسل أي ترويسة `Authorization` مع هذا الطلب.
- استخدم `username` من هذه الإجابة. فهو يأتي من الكود الذي وقّعه المستخدم.
- احتفظ برمز الوصول ورمز التجديد على خادمك.

### التجديد {#refresh}

عندما تنتهي صلاحية رمز الوصول، أرسل رمز التجديد مع مفتاحك السري للعميل إلى النقطة نفسها:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

الإجابة لها الشكل نفسه، مع رمز وصول جديد ورمز تجديد جديد. خزّن الاثنين بدل القديمين.

## احمِ الطلب بـ state {#state}

بدون `state`، يمكن لموقع آخر أن يرسل مستخدمك إلى عنوان الاستدعاء الخاص بك برمز أو كود من اختياره هو. عندها يسجّل تطبيقك دخول المستخدم إلى حساب شخص آخر. و`state` يربط كل عودة بالمتصفح الذي بدأ تسجيل الدخول.

1. ولّد قيمة عشوائية لكل تسجيل دخول، لا تقل عن 16 بايت عشوائية. والصيغة الست عشرية تبقيها خالية من الأحرف التي تحتاج ترميزًا.
2. خزّنها حيث لا يستطيع تقديمها مجددًا إلا هذا المتصفح: جلسة خادمك، أو ملف تعريف ارتباط قصير العمر httpOnly وSecure مع `SameSite=Lax`.
3. أرسلها باسم `state` في عنوان التخويل.
4. على عنوان الاستدعاء، قارن المعامل `state` بالقيمة المخزّنة. وإذا كان مفقودًا أو مختلفًا، فتوقّف: لا تستخدم الرمز ولا الكود.
5. احذف القيمة المخزّنة، ليعمل كلٌّ منها مرة واحدة.

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

يعيد Hivesigner قيمة `state` نفسها التي استلمها. ويحذف القيمة الفارغة.

## ما يراه المستخدم {#what-the-user-sees}

تعرض شاشة الموافقة صورة تطبيقك واسمه، و"حساب Hive @myapp" و"ينقلك إلى HOST"، مع أخذ HOST من عنوان الاستدعاء الخاص بك. ثم:

- **أول طلب نشر.** يقول العنوان "يطلب APP الوصول إلى حسابك.". وتسرد بطاقة **النطاق** ما سيستطيع تطبيقك فعله. ويقول إشعار "تخويل لأول مرة: ستتم إضافة @myapp إلى صلاحية النشر الخاصة بك على السلسلة، ويتطلب ذلك مفتاحك النشط مرة واحدة. سيتمكّن ذلك الحساب من النشر باسمك إلى أن تلغي تخويله.". ويقول الزر **تخويل**. وعندما لا يحمل جهاز المستخدم مفتاحًا نشطًا للحساب، تطلبه الشاشة في مكانها.
- **تسجيل الدخول.** مع `scope=login`، أو مع وصول النشر الذي منحه المستخدم من قبل، يقول العنوان "تسجيل الدخول إلى APP" ويقول الزر **تسجيل الدخول**.
- **الحساب.** "التخويل باسم" أو "تسجيل الدخول باسم"، يتبعه الحساب المحدد. ويمكن للمستخدم تبديل الحسابات هنا.
- **حساب مقفل.** يظهر حقل رمز المرور فوق الزر. ونقرة واحدة تفتح قفل الحساب وتتابع.
- **لا يوجد حساب على الجهاز.** يقول الزر **متابعة**. فيفتح نموذج إضافة حساب ثم يعود إلى الطلب.

بعد أول طلب نشر، ينتظر Hivesigner حتى يصبح التفويض الجديد مرئيًا على السلسلة قبل إعادة التوجيه. وقد يستغرق ذلك بضع ثوانٍ. ولرؤية الشاشة كاملة من جهة المستخدم، راجع [تسجيل الدخول إلى التطبيقات](/docs/signing-in).

## الإلغاء والطلبات المرفوضة {#cancel}

- **الإلغاء.** ينتقل المستخدم إلى قائمة حساباته في Hivesigner. ولا يُرسل شيء إلى عنوان الاستدعاء الخاص بك: فلا يوجد معامل خطأ. أبقِ زر تسجيل الدخول متاحًا ليبدأ المستخدم من جديد. ولا تنتظر أي عودة.
- **الطلبات المرفوضة.** عنوان استدعاء غير مسجَّل، أو `client_id` غير معروف، أو `redirect_uri` مفقود، كل ذلك يعرض خطأ في Hivesigner مع زر **الإبلاغ عن هذه المشكلة**. ولا يُرسل شيء إلى عنوان الاستدعاء الخاص بك. راجع [ما يراه المستخدمون عندما يحدث خلل](/docs/register-app#refused-requests).

## عنوان طلب تسجيل الدخول القديم {#legacy-login-request}

ما زال Hivesigner يقبل عنوان تسجيل الدخول الأقدم، المحفوظ للتكاملات القديمة. استخدم `/oauth2/authorize` للتكاملات الجديدة.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

فهو يفتح شاشة الموافقة نفسها، بالفحوص نفسها لعنوان الاستدعاء وبإعادة التوجيه نفسها. لكنه يقرأ معاملاته بطريقة مختلفة:

- `scope` يكون `login` أو `posting`. وأي قيمة أخرى، أو لا قيمة، تعني `login`.
- `offline` لا يُقرأ. وللتدفق بالكود، أضف `response_type=code`.
- `account` لا يُقرأ.

و`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` يتبع القواعد نفسها.
