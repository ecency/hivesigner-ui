تبني حزمة JavaScript الرسمية عناوين تسجيل الدخول وروابط التوقيع وتستدعي واجهة Hivesigner نيابةً عنك. ولـ Python توجد مكتبات من المجتمع. وأي لغة أخرى تستطيع استدعاء [واجهة REST](/docs/api) مباشرةً.

## حزمة JavaScript {#javascript}

الحزمة هي حزمة npm باسم `hivesigner`. وشيفرتها المصدرية على https://github.com/ecency/hivesigner-sdk. وهي مكتوبة بـ TypeScript وتأتي بأنواعها.

يحتاج الإصدار 4 إلى Node.js 18 أو أحدث، لأنه يستخدم `fetch` المدمج. وفي المتصفحات يحتاج إلى ES2017 أو أحدث. وحيث لا يوجد `fetch` عام، أضف polyfill قبل استخدام الحزمة. وعلى Node.js أقدم، ابقَ على الإصدار 3.

### التثبيت {#install}

```bash
npm install hivesigner
```

لصفحة بلا خطوة بناء، حمّل حزمة المتصفح. فهي تعرّف `hivesigner` عامًا:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### أنشئ عميلًا {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| الخيار | المعنى |
| --- | --- |
| `app` | حساب تطبيقك، يُرسل باسم `client_id`. |
| `callbackURL` | المكان الذي يعيد Hivesigner المستخدم إليه. ويجب أن يكون أحد عناوين الاستدعاء الخاصة بتطبيقك، حرفًا بحرف (وعنوان الاستدعاء المحلي بـ http العادي قد يختلف في المضيف والمنفذ، راجع [عناوين الاستدعاء](/docs/register-app#callback-rules)). |
| `scope` | قائمة، تُوصل بفواصل داخل معامل `scope`. راجع [النطاقات](/docs/oauth2#scopes). |
| `responseType` | القيمة `'code'` للتدفق بالكود. اتركه للتدفق بالرمز. |
| `accessToken` | رمز وصول المستخدم، إن كان لديك واحد بالفعل. |
| `apiURL` | أصل الواجهة. وتضيف الحزمة `/api/` إليه. والقيمة الافتراضية هي `https://hivesigner.com`. |

و`setApp` و`setCallbackURL` و`setScope` و`setAccessToken` و`removeAccessToken` و`setApiURL` تغيّر العميل لاحقًا. وكل واحدة تعيد العميل.

### سجّل دخول المستخدم {#sign-in}

تعيد `getLoginURL(state, account)` عنوان تسجيل الدخول:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- تعود `state` إلى عنوان الاستدعاء الخاص بك دون تغيير. استخدمها لربط الإجابة بالطلب.
- و`account` اختياري: اسم مستخدم. ويحدّد Hivesigner ذلك الحساب عندما يكون على الجهاز ويتجاهله فيما عدا ذلك.

في المتصفح، ترسل `client.login({ state: 'STATE' })` المستخدم إلى العنوان نفسه، بلا حساب.

في التدفق بالرمز، يستلم عنوان الاستدعاء الخاص بك `access_token` و`expires_in` و`username`. أعطِ الرمز للعميل:

```js
client.setAccessToken('ACCESS_TOKEN');
```

ولا تملك الحزمة أي دالة لتبادل التدفق بالكود. فخادمك يرسل الكود والمفتاح السري للعميل إلى الواجهة بنفسه، كما يوضح [استبدل الكود](/docs/oauth2#exchange-code).

### احصل على المستخدم {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` هو حساب Hive الخاص بالمستخدم كما تعيده السلسلة. و`scope` يسرد ما يسمح به الرمز.

### البثّ {#broadcast}

ترسل `broadcast(operations)` العمليات إلى الواجهة، التي تبثّها نيابةً عن المستخدم. ولا تقبل الواجهة إلا عمليات النشر التي يكون مؤلفها مستخدم الرمز: `vote` و`comment` و`delete_comment` و`comment_options` و`custom_json` بصلاحية النشر و`claim_reward_balance` و`account_update2` لبيانات الملف الشخصي. راجع [ما يقبله البثّ](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

سمِّ المستخدم في كل عملية. فالواجهة لا تستبدل `__signer`.

وهذه الدوال المساعدة تبني عملية واحدة لكل منها وتستدعي `broadcast`:

| الدالة | تبثّ |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. و`weight` يمتد من `-10000` إلى `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. وللمنشور الجديد يكون `parentAuthor` هو `''`. و`jsonMetadata` يمكن أن يكون كائنًا: فالحزمة تحوّله إلى نص. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. مرّر `[]` كـ `requiredAuths` و`['USERNAME']` كـ `requiredPostingAuths`. و`json` نص. |
| `reblog(account, author, permlink)` | `custom_json` بمعرّف `follow`، يعيد نشر المنشور |
| `follow(follower, following)` | `custom_json` بمعرّف `follow`، مع `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` بمعرّف `follow`، مع `what: []` |
| `ignore(follower, following)` | `custom_json` بمعرّف `follow`، مع `what: ['ignore']` (كتم) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. والمبالغ نصوص مثل `'0.000 HIVE'` و`'0.000 HBD'` و`'1.000000 VESTS'`. |

و`updateUserMetadata()` متوقفة. ولتغيير الملف الشخصي لمستخدم، ابثّ `account_update2` مع `posting_json_metadata` جديد.

### تسجيل الخروج {#log-out}

`revokeToken()` هي دالة تسجيل الخروج في الحزمة. فهي ترسل الرمز إلى نقطة الإلغاء في الواجهة ثم تزيله من العميل. وعندما يُرفض الاستدعاء، استدعِ `removeAccessToken()` بنفسك. واحذف الرمز أيضًا أينما خزّنه تطبيقك.

ولإنهاء وصول تطبيقك نهائيًا، يزيله المستخدم على https://hivesigner.com/authorized-apps. راجع [عرض وصول تطبيق وإزالته](/docs/signing-in#remove-access).

### روابط التوقيع {#sign-links}

تعيد `sendOperation(op, params)` و`sendOperations(ops, params)` و`sendTransaction(tx, params)` رابط `https://hivesigner.com/sign/...`. ويأخذ `params` القيم `callback` و`no_broadcast` و`signer`. راجع [روابط التوقيع](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

في TypeScript تشترط الأنواع الوسيط الثالث: مرّر `undefined` لتستعيد الرابط.

وفي المتصفح، مرّر دالة كوسيط ثالث لفتح الرابط في تبويب جديد. ولا تُستدعى الدالة ولا يُعاد شيء. استدعِها من معالج نقر، وإلا فقد يحجب المتصفح التبويب الجديد ويرمي الاستدعاء خطأ.

### الوعود ودوال الاستدعاء {#promises-and-callbacks}

تعيد `me` و`broadcast` والدوال المساعدة و`revokeToken` وعدًا. ومرّر دالة كوسيط أخير لاستخدام دالة استدعاء بدلًا من ذلك. فهي تستقبل `(error, result)`.

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

وعندما تجيب الواجهة بخطأ، يُرفض الوعد بجسم خطأ الواجهة، `{ error, error_description }`. ومع دالة الاستدعاء، يكون ذلك الجسم هو الوسيط `error`. وعندما لا تكون الإجابة JSON، يُرفض بخطأ التحليل.

## Python {#python}

هذه المكتبات من المجتمع. ويتولى صيانتها مؤلفوها، لا فريق Hivesigner. راجعها مقابل [واجهة REST](/docs/api) قبل أن تعتمد عليها.

| المكتبة | المؤلف |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem، الوحدة `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
