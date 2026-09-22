يستطيع تطبيقك أن يطلب من المستخدم توقيع رسالة نصية بمفتاح النشر أو بالمفتاح النشط. ويثبت التوقيع أنه يتحكم بالحساب. ولا يُبثّ شيء: فالرسالة لا تصل إلى سلسلة الكتل أبدًا. ويوقّع Hivesigner بالطريقة نفسها التي يوقّع بها `requestSignBuffer` في Hive Keychain، ولذلك فإن شيفرة الخادم التي تتحقق من توقيع Keychain تتحقق كذلك من توقيع Hivesigner.

## اطلب توقيعًا {#request}

أرسل المستخدم إلى `https://hivesigner.com/sign-buffer` مع معاملات الاستعلام هذه:

| المعامل | مطلوب | المعنى |
| --- | --- | --- |
| `message` | نعم | النص المراد توقيعه بالضبط. ويجب أن يحمل أكثر من مسافات. |
| `redirect_uri` | نعم | المكان الذي يرسل Hivesigner النتيجة إليه. راجع [قواعد عنوان الاستدعاء](#callback-rules). |
| `authority` | لا | `posting` أو `active`، بأي حالة أحرف (`Posting` تصلح أيضًا). ويكون `posting` عند غيابه أو عند تركه فارغًا. وأي قيمة أخرى تُرفض. |
| `client_id` | لا | حساب تطبيقك. ويُقرأ `clientId` أيضًا. ومعه يجب أن يكون `redirect_uri` أحد عناوين الاستدعاء الخاصة بتطبيقك. |
| `state` | لا | أي قيمة. ويعيدها Hivesigner دون تغيير. |
| `account` | لا | الحساب الذي تتوقع أن يوقّع. ويحدّده Hivesigner عندما يكون على الجهاز ويتجاهله فيما عدا ذلك. ويُقرأ `select_account` أيضًا. |

ابنِ العنوان باستخدام `URLSearchParams`، ليُرمَّز كل قيمة:

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### قواعد عنوان الاستدعاء {#callback-rules}

- يجب أن يكون عنوان الاستدعاء `https://`. ولا يعمل `http://` العادي إلا على العنوان المحلي: `localhost` أو `127.0.0.1` أو `[::1]`.
- **مع `client_id`**، يجب أن يكون عنوان الاستدعاء مسجَّلًا على حساب التطبيق ذاك، بالمطابقة نفسها المتبعة في تسجيل الدخول. راجع [عناوين الاستدعاء](/docs/register-app#callback-rules). ويقرأ Hivesigner عناوين استدعاء التطبيق من Hive عند فتح الطلب ولا يوقّع شيئًا قبل أن يقرأها. وعندما يتعذّر الوصول إلى Hive، يحصل المستخدم على زر **إعادة المحاولة**.
- **بدون `client_id`**، يصلح أي عنوان استدعاء يتبع القاعدة الأولى. ويسمّي Hivesigner عندئذٍ مضيف عنوان الاستدعاء كطالب، مثل "يطلب منك HOST توقيع رسالة.".

أرسل `client_id` عندما يكون لديك حساب تطبيق. فيرى المستخدم عندها اسم تطبيقك وحسابه. ولا يستطيع استلام التوقيع إلا عناوين الاستدعاء المسجَّلة لديك.

يرفض Hivesigner أي طلب بلا رسالة، أو بـ `authority` غير معروف، أو بعنوان استدعاء مفقود أو غير صالح، أو بـ `client_id` ليس حسابًا على Hive، أو بعنوان استدعاء غير مسجَّل على ذلك التطبيق. ويرى المستخدم "لا يمكن استخدام طلب التوقيع هذا: يلزمه رسالة ومفتاح نشر أو مفتاح نشط وعنوان URL آمن لإعادة التوجيه مسجَّل للتطبيق. ارجع إلى الموقع وحاول مرة أخرى." وزرّ **الإبلاغ عن هذه المشكلة**.

### ما يراه المستخدم {#what-the-user-sees}

- عنوان يسمّي تطبيقك (أو مضيف عنوان الاستدعاء) و"ينقلك إلى HOST".
- الرسالة كاملة، كما ستُوقَّع تمامًا. والأحرف التي قد تخفي نصًا أو تغيّر اتجاهه تُعرض على هيئة رموز مثل `\u{200B}`.
- "التوقيع بمفتاح النشر الخاص بك" أو "التوقيع بمفتاحك النشط".
- تحذير: "يُثبت توقيعك لكل من يراه أن @USERNAME وقّع هذا النص بعينه. لا توقّع إلا رسالة تفهمها."
- **توقيع** و**إلغاء**. والحساب المقفل يطلب رمز المرور أولًا.

[طلبات توقيع الرسائل](/docs/signing#message-requests) تصف الشاشة للمستخدمين.

## ما يستلمه عنوان الاستدعاء {#callback}

عندما يختار المستخدم **توقيع**، يرسله Hivesigner إلى عنوان الاستدعاء الخاص بك مع معاملات الاستعلام هذه:

| المعامل | القيمة |
| --- | --- |
| `signature` | التوقيع، كسلسلة ست عشرية من 130 حرفًا |
| `public_key` | المفتاح العام للمفتاح الذي وقّع، مثل `STM...` |
| `username` | الحساب الذي وقّع |
| `authority` | `posting` أو `active` |
| `state` | قيمة `state` الخاصة بك، كلما حمل الطلب واحدة (حتى الفارغة) |

يضيفها Hivesigner إلى استعلام عنوانك، بعد `?` أو `&` وقبل أي `#fragment`. ويبقى استعلامك أنت كما هو.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

وعندما يختار المستخدم **إلغاء**، يفتح Hivesigner قائمة حساباته. ولا يستلم عنوانك شيئًا.

> **تحذير:** يستطيع أي شخص فتح عنوان الاستدعاء الخاص بك بقيم مختلقة. عامل كل معامل على أنه ادّعاء إلى أن يتحقق خادمك من التوقيع.

## تحقّق من التوقيع {#verify}

تحقّق من التوقيع على خادمك:

1. احتفظ على خادمك بالرسالة التي طلبتها، مع قيمة `state` الخاصة بها. ولا تثق بنسخة تعود من المتصفح.
2. احسب بصمة الرسالة: sha256 على بايتات UTF-8 الخاصة بها.
3. استخرج المفتاح العام من التوقيع ومن تلك البصمة.
4. حمّل الحساب من Hive. وتحقّق من أن المفتاح المستخرج يخصّ الصلاحية التي طلبتها، بوزن يكفي للتوقيع وحده.
5. تحقّق من أن `state` هي التي أصدرتها. واقبل كل رسالة مرة واحدة.

يستخدم هذا المثال dhive (https://www.npmjs.com/package/@hiveio/dhive):

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

والتحقق نفسه يصلح لتوقيع من `requestSignBuffer` في Hive Keychain. قارن بالمفتاح الذي استخرجته: فـ `public_key` في عنوان الاستدعاء مجرد إشارة.

## الرسائل التي لا يوقّعها Hivesigner {#refused-messages}

الرسالة التي هي كائن JSON بمفتاح `signed_message` لها شكل رمز Hivesigner. وتوقيعها يمنح الطالب الوصول إلى حساب المستخدم. ولا يوقّع Hivesigner رسالة كهذه أبدًا. بل يقول للمستخدم "هذه الرسالة رمز من Hivesigner. توقيعها يمنح الموقع الوصول إلى حسابك، لذلك لا يمكن توقيعها."

استخدم نصًا عاديًا، أو JSON بلا مفتاح `signed_message`. وقل فيمَ يُستخدم التوقيع وأضف قيمة تولّدها مرة واحدة، مثل:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## أداة توقيع الرسالة {#sign-message-tool}

يستطيع الأشخاص أيضًا توقيع رسالة بأنفسهم على https://hivesigner.com/signmessage (**توقيع رسالة**) والتحقق من واحدة على https://hivesigner.com/verifymessage (**التحقق من رسالة**). راجع [وقّع رسالة بنفسك](/docs/signing#sign-message).

وتلك الأداة توقّع بطريقة تختلف عن `/sign-buffer`. فهي توقّع جسم رمز Hivesigner يحمل الرسالة والحساب والوقت. وتشارك النتيجة على هيئة **رمز التحقق**. تحقّق من رمز كهذا على صفحة **التحقق من رسالة** أو بالطريقة الموصوفة في [تحقّق بنفسك](/docs/tokens#check-it-yourself)، لا بالشيفرة أعلاه.
