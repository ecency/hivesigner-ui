يفتح رابط التوقيع معاملة Hive في Hivesigner. يراجعها المستخدم ويوافق عليها بمفتاحه هو ويبثّها Hivesigner من متصفحه. وبعدها يستطيع Hivesigner إعادة المستخدم إلى تطبيقك ومعه معرّف المعاملة. ولا تحتاج روابط التوقيع إلى حساب تطبيق ولا إلى رمز. وهي تغطي كل العمليات الـ 41 التي يدعمها Hivesigner، بما فيها التحويلات وغيرها من الإجراءات التي تحتاج المفتاح النشط.

## كيف يعمل رابط التوقيع {#how-it-works}

1. يبني تطبيقك رابطًا يحمل عملية واحدة أو أكثر.
2. يفتح المستخدم الرابط. ويعرض Hivesigner كل عملية بكلمات واضحة على شاشة "تأكيد المعاملة"، مع المفتاح الذي تحتاجه.
3. يوافق المستخدم. ويوقّع Hivesigner المعاملة في المتصفح بمفتاح الحساب المحدد في Hivesigner. ثم يرسل المعاملة إلى شبكة Hive.
4. وعندما يسمّي الرابط عنوان استدعاء، يرسل Hivesigner المستخدم إليه ومعه معرّف المعاملة.

لا يرى تطبيقك أي مفتاح أبدًا. ويستطيع أي موقع إنشاء رابط توقيع: فلا يوجد `client_id` يُرسل.

## أشكال الروابط {#link-forms}

يقرأ Hivesigner نوعين من روابط التوقيع: الروابط المرمَّزة والروابط القديمة.

### الروابط المرمَّزة {#encoded-links}

يحمل الرابط المرمَّز العمليات على هيئة JSON، مرمَّزة بـ base64url. ويستخدم صيغة `hive://sign/...` الخاصة بحزمة `hive-uri`، مع استبدال `hive://` بـ `https://hivesigner.com/`.

| الشكل | ما يحمله `B64U` |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | عملية واحدة: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | قائمة عمليات: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | معاملة كاملة، بترويستها الخاصة |

`B64U` هو نص JSON، مرمَّزًا بـ UTF-8 ثم بـ base64 مع استبدال `+` بـ `-` و`/` بـ `_` وحشو `=` بـ `.`.

مع `op` و`ops`، يبني Hivesigner المعاملة حول العمليات. فيملأ كتلة المرجع ووقت الانتهاء.

ومع `tx`، يحتفظ Hivesigner بقيم `ref_block_num` و`ref_block_prefix` و`expiration` الخاصة بالمعاملة. كما يحتفظ بالتوقيعات التي تحملها المعاملة بالفعل. وهذا يتيح لعدة حسابات توقيع معاملة واحدة بالتناوب، لحساب يتحكم به عدة أشخاص. ويرفض Hivesigner معاملة لا تكون قائمة `extensions` فيها فارغة.

> **ملاحظة:** يوحّد Hivesigner بعض القيم قبل التوقيع، مثل المبالغ والحقول المتروكة على قيمها الافتراضية. وقد يصبح للمعاملة الموقّعة عندئذٍ معرّف مختلف عن الذي بنيته. اقرأ المعرّف من عنوان الاستدعاء.

### الروابط القديمة {#legacy-links}

يسمّي الرابط القديم عملية واحدة في المسار ويضع حقولها في الاستعلام:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- اكتب اسم العملية بصيغة snake case (`transfer_to_vesting`) أو camel case (`transferToVesting`) أو kebab case (`transfer-to-vesting`).
- أعطِ كل حقل كمعامل استعلام باسم الحقل. ورمّز كل قيمة بترميز URL.
- اكتب القوائم والكائنات بصيغة JSON، مثل `required_posting_auths=["alice"]`. ويمكن أيضًا فصل قائمة المعرّفات أو الأسماء بفواصل: `proposal_ids=379,380`.
- اكتب القيم المنطقية `true` أو `false`.

يحمل الرابط القديم عملية واحدة. استخدم رابطًا مرمَّزًا لأكثر من واحدة.

### قيم الحقول {#field-values}

تنطبق هذه القواعد على كل الأشكال:

- **القيم الافتراضية.** الحقل الذي تتركه يأخذ قيمته الافتراضية. والحساب الفاعل (`voter` و`from` و`owner` وما شابهها) يأخذ افتراضيًا الحساب الموقّع. و`weight` التصويت يأخذ افتراضيًا `10000` (100%).
- **المبالغ** رقم ورمز: `1.000 HIVE` أو `0.500 HBD` أو `100.000000 VESTS`. ويكتب Hivesigner قيم HIVE وHBD بثلاث منازل عشرية وقيم VESTS بست.
- **قوة HIVE.** الحقل الذي يقبل VESTS يقبل أيضًا مبلغًا بـ HP، مثل `100 HP`. ويحوّله Hivesigner إلى VESTS بالسعر الحالي قبل أن يتمكّن المستخدم من الموافقة.
- **`__signer`** في أي قيمة تصبح اسم الحساب الموقّع. فمثلًا يستطيع `custom_json` للمتابعة أن يسمّي `__signer` كمتابِع داخل `json` الخاص به.
- **الأعداد الصحيحة** يجب أن تكون أعدادًا صحيحة داخل المدى الذي تقبله السلسلة، مثل `-10000` إلى `10000` لـ `weight` التصويت.

يرفض Hivesigner الرابط كله عندما لا تناسب قيمة حقلها، أو عندما تكون العملية غير معروفة، أو عندما لا يحمل الرابط أي عملية. ويرى المستخدم "عذرًا، حدث خطأ ما. البيانات المقدَّمة غير صالحة." ولا يُوقَّع شيء.

## المعاملات {#parameters}

أضف هذه إلى سلسلة استعلام أي رابط توقيع:

| المعامل | المعنى |
| --- | --- |
| `cb` | عنوان الاستدعاء، مرمَّزًا بـ base64url. وهذا ما تكتبه `hive-uri` لخيار `callback` لديها. |
| `redirect_uri` | عنوان الاستدعاء كنص عادي مرمَّز بترميز URL. وتستخدمه الروابط القديمة. ويستخدمه الرابط المرمَّز عندما لا يكون لديه `cb`. |
| `nb` | التوقيع فقط. يوقّع Hivesigner المعاملة دون بثّها. ضع `{{sig}}` في عنوان الاستدعاء لاستلام التوقيع (راجع [عناصر عنوان الاستدعاء](#callback-placeholders)). وأي قيمة تصلح، حتى الفارغة (`nb=`). |
| `s` | الحساب الذي يجب أن يوقّع. وعندما يكون حساب آخر محددًا، يطلب Hivesigner من المستخدم التبديل إلى هذا. ولا يوقّع بأي حساب آخر. |

استخدم عنوان استدعاء `https://`. ويتجاهل Hivesigner أي عنوان استدعاء ليس عنوان `http` أو `https` ويبقى عندئذٍ على شاشة النتيجة عنده.

يختار Hivesigner المفتاح من العمليات. ولا يوجد معامل لاختياره: فـ Hivesigner يتجاهل `authority` (ومعامل `a` في `hive-uri`) في روابط التوقيع. راجع [أي مفتاح يحتاجه الرابط](#which-key).

### عناصر عنوان الاستدعاء {#callback-placeholders}

بعد موافقة المستخدم، يملأ Hivesigner هذه العناصر في عنوان الاستدعاء:

| العنصر | القيمة |
| --- | --- |
| `{{id}}` | معرّف المعاملة |
| `{{sig}}` | التوقيع، لرابط التوقيع فقط (`nb`) |
| `{{block}}` | يُترك فارغًا |
| `{{txn}}` | يُترك فارغًا |
| `{{data}}` | يُترك فارغًا |

عنوان الاستدعاء الذي لا يحمل أيًّا من هذه العناصر يستلم معرّف المعاملة مضافًا باسم `id`، بعد `?` أو `&`:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

يعيد Hivesigner التوجيه بمجرد أن تقبل عقدة Hive المعاملة. وقد لا تكون المعاملة في كتلة بعد. ابحث عنها بمعرّفها عندما تحتاج إلى التأكد من إدراجها.

ولا يُستدعى عنوانك عندما ترفض الشبكة المعاملة (يرى المستخدم الخطأ) ولا عندما يغادر المستخدم دون موافقة.

## ابنِ رابطًا {#build-a-link}

### باستخدام hive-uri {#with-hive-uri}

ترمّز حزمة `hive-uri` (https://www.npmjs.com/package/hive-uri) العمليات إلى روابط. استخدم الإصدار 0.2.8 أو أحدث، فهو يرمّز أي نص Unicode ترميزًا صحيحًا.

```bash
npm install hive-uri
```

```js
import { encodeOp, encodeOps } from 'hive-uri';

// One vote. __signer becomes the account that signs.
const vote = encodeOp(
  ['vote', { voter: '__signer', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
  { callback: 'https://YOUR_APP/voted?tx={{id}}' },
);

// Two transfers in one transaction.
const payout = encodeOps(
  [
    ['transfer', { from: '__signer', to: 'RECIPIENT_1', amount: '1.000 HIVE', memo: 'MEMO' }],
    ['transfer', { from: '__signer', to: 'RECIPIENT_2', amount: '2.000 HIVE', memo: 'MEMO' }],
  ],
  { callback: 'https://YOUR_APP/paid' },
);

const voteLink = vote.replace('hive://', 'https://hivesigner.com/');
const payoutLink = payout.replace('hive://', 'https://hivesigner.com/');
```

يأخذ كائن الخيارات `callback` (يُكتب `cb`) و`no_broadcast: true` (يُكتب `nb`) و`signer` (يُكتب `s`). وتفعل `encodeTx` الشيء نفسه لمعاملة كاملة.

### باستخدام حزمة JavaScript SDK {#with-the-sdk}

تحتوي حزمة `hivesigner` على `sendOperation` و`sendOperations` و`sendTransaction`. وهي تأخذ الوسائط نفسها التي تأخذها مرمّزات `hive-uri` وتعيد رابط `https://hivesigner.com/sign/...`:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

في TypeScript تشترط الأنواع الوسيط الثالث: مرّر `undefined` لتستعيد الرابط. وفي المتصفح، تجعلها دالة تُمرَّر كوسيط ثالث تفتح الرابط في تبويب جديد بدل إعادته. راجع [حزم التطوير](/docs/sdk#sign-links).

### دون شيفرة {#signs-page}

يسرد https://hivesigner.com/signs ("توقيع معاملة") كل عملية مدعومة مع نموذج لحقولها. فيبني رابط `/sign/op/` ويفتحه.

## أي مفتاح يحتاجه الرابط {#which-key}

تحتاج كل عملية مفتاحًا واحدًا: مفتاح النشر أو المفتاح النشط أو مفتاح المالك. و[الجدول أدناه](#supported-operations) يسردها. وثلاث عمليات تعتمد على قيمها:

- `custom_json` تحتاج المفتاح النشط عندما يسمّي `required_auths` حسابًا. وإلا فهي تحتاج مفتاح النشر.
- `account_update` تحتاج مفتاح المالك عندما تضبط `owner`. وإلا فهي تحتاج المفتاح النشط.
- `account_update2` تحتاج مفتاح المالك عندما تضبط `owner`. وتحتاج المفتاح النشط عندما تضبط `active` أو `posting` أو `memo_key` أو `json_metadata`. ومع `posting_json_metadata` وحدها، تحتاج مفتاح النشر.

يوقّع Hivesigner الرابط بمفتاح واحد، ولذلك يجب أن تحتاج كل العمليات في رابط واحد المفتاح نفسه. ويرفض Hivesigner توقيع رابط يخلط بينها ويخبر المستخدم بالسبب. أرسل تلك العمليات في روابط منفصلة.

وعندما لا يحمل الحساب المحدد المفتاح على الجهاز، يقول Hivesigner أي مفتاح ينقص ويعرض إضافته. راجع [عندما ينقص المفتاح](/docs/signing#missing-key).

## ما يراه المستخدم {#what-the-user-sees}

- شاشة عنوانها "تأكيد المعاملة"، فيها بطاقة لكل عملية: ملخّص بكلمات واضحة، والمفتاح الذي تحتاجه، والقيم التي تحملها.
- "ستتم إعادة توجيهك إلى HOST." عندما يحمل الرابط عنوان استدعاء. استخدم عنوان استدعاء على موقعك أنت، ليتعرّف المستخدمون على المضيف.
- تحذير عندما تتصرف عملية باسم حساب غير الحساب الموقّع.
- **موافقة**، أو **توقيع** لرابط التوقيع فقط. والحساب المقفل يطلب رمز المرور أولًا.
- بعد البثّ، "تم بث المعاملة بنجاح" مع معرّف المعاملة. ثم إعادة التوجيه إلى عنوان الاستدعاء الخاص بك.

[المراجعة والتوقيع](/docs/signing#confirm-screen) تصف الشاشة للمستخدمين.

## العمليات المدعومة {#supported-operations}

يوقّع Hivesigner هذه العمليات الـ 41، بأسمائها على السلسلة. وأي عملية غيرها تُرفض. والاسم هو الذي يعرضه Hivesigner على شاشة التأكيد.

| العملية | المفتاح | الاسم |
| --- | --- | --- |
| `transfer` | النشط | تحويل |
| `recurrent_transfer` | النشط | تحويل متكرر |
| `delegate_vesting_shares` | النشط | تفويض قوة HIVE |
| `transfer_to_vesting` | النشط | تحويل إلى قوة HIVE (Power up) |
| `set_withdraw_vesting_route` | النشط | تعيين مسار سحب قوة HIVE |
| `withdraw_vesting` | النشط | سحب قوة HIVE (Power down) |
| `transfer_to_savings` | النشط | تحويل إلى المدخرات |
| `transfer_from_savings` | النشط | تحويل من المدخرات |
| `cancel_transfer_from_savings` | النشط | إلغاء التحويل من المدخرات |
| `convert` | النشط | تحويل HBD إلى HIVE |
| `collateralized_convert` | النشط | تحويل HIVE إلى HBD |
| `account_witness_vote` | النشط | التصويت لشاهد |
| `witness_update` | النشط | تحديث الشاهد |
| `witness_set_properties` | النشط | تعيين خصائص الشاهد |
| `account_witness_proxy` | النشط | وكيل الحوكمة |
| `claim_account` | النشط | المطالبة برصيد إنشاء حساب |
| `account_create` | النشط | إنشاء حساب |
| `create_claimed_account` | النشط | إنشاء حساب باستخدام أرصدة الحسابات |
| `vote` | النشر | تصويت |
| `limit_order_create` | النشط | إنشاء أمر محدد السعر |
| `limit_order_create2` | النشط | إنشاء أمر محدد السعر |
| `limit_order_cancel` | النشط | إلغاء أمر محدد السعر |
| `claim_reward_balance` | النشر | استلام المكافآت |
| `comment` | النشر | منشور أو تعليق |
| `comment_options` | النشر | خيارات المنشور أو التعليق |
| `custom_json` | النشر، أو النشط عندما يكون `required_auths` مضبوطًا | عملية مخصصة |
| `delete_comment` | النشر | حذف تعليق |
| `account_update` | النشط، أو المالك عندما يكون `owner` مضبوطًا | تحديث الحساب (الصلاحية النشطة) |
| `account_update2` | النشر أو النشط أو المالك، بحسب الحقل | تحديث الحساب (صلاحية النشر) |
| `change_recovery_account` | المالك | تغيير حساب الاسترداد |
| `create_proposal` | النشط | إنشاء مقترح |
| `remove_proposal` | النشط | إزالة مقترح |
| `update_proposal_votes` | النشط | تحديث التصويت على المقترحات |
| `update_proposal` | النشط | تحديث مقترح |
| `escrow_transfer` | النشط | تحويل بضمان |
| `escrow_approve` | النشط | موافقة الضمان |
| `escrow_dispute` | النشط | نزاع الضمان |
| `escrow_release` | النشط | تحرير الضمان |
| `account_create_with_delegation` | النشط | إنشاء حساب مع تفويض |
| `request_account_recovery` | النشط | طلب استرداد حساب |
| `recover_account` | المالك | استرداد الحساب |
