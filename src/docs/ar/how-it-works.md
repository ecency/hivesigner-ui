يتيح Hivesigner للأشخاص استخدام حساب Hive الخاص بهم في تطبيقك دون إعطاء تطبيقك مفاتيحهم. وهو يتكوّن من جزأين: موقّع في المتصفح على https://hivesigner.com وواجهة برمجة تطبيقات على `https://hivesigner.com/api/`. تشرح هذه الصفحة ما يفعله كل جزء والطريقتين اللتين يستخدمهما التطبيق.

## الموقّع في المتصفح {#browser-signer}

الموقّع في المتصفح هو موقع Hivesigner. يضيف الأشخاص إليه حسابات Hive الخاصة بهم. تبقى مفاتيحهم في متصفحهم: لا يرسل Hivesigner أي مفتاح إلى أي خادم. ولا يرى تطبيقك أي مفتاح أبدًا.

يوقّع الموقّع ثلاثة أنواع من الأشياء، وفي كل مرة بعد أن يرى المستخدم ما يوقّعه:

- **رموز تسجيل الدخول.** يرسل تطبيقك شخصًا إلى Hivesigner لتسجيل الدخول. يعرض Hivesigner اسم تطبيقك وما يطلبه. وعندما يوافق المستخدم، يوقّع Hivesigner بمفتاحه بيانًا قصيرًا يسمّي حسابه وتطبيقك. ذلك البيان الموقّع هو الرمز الذي يستلمه تطبيقك. راجع [تسجيل الدخول باستخدام OAuth2](/docs/oauth2) و[الرموز](/docs/tokens).
- **المعاملات.** يفتح رابط التوقيع معاملة لمراجعتها. وعندما يوافق المستخدم، يوقّعها Hivesigner بالمفتاح الذي تحتاجه. ثم يرسلها إلى شبكة Hive من المتصفح، ما لم يطلب الرابط التوقيع وحده. راجع [روابط التوقيع](/docs/sign-links).
- **الرسائل.** يمكن لتطبيقك أن يطلب من المستخدم توقيع نص بمفتاحه، ليثبت أنه يتحكّم بالحساب. راجع [توقيع الرسائل](/docs/message-signing).

## واجهة برمجة التطبيقات {#api}

تبثّ الواجهة عمليات النشر نيابةً عن مستخدم سجّل الدخول إلى تطبيقك: المنشورات والتعليقات والتصويتات والمتابعات وغيرها من عمليات `custom_json`، والمطالبة بالمكافآت وتحديثات الملف الشخصي. يرسل تطبيقك العمليات مع رمز المستخدم. تتحقق الواجهة من الرمز، وتوقّع المعاملة بمفتاح النشر الخاص بحساب @hivesigner، ثم تبثّها إلى Hive.

كما تعيد الواجهة حساب المستخدم الذي سجّل الدخول، وتستبدل الرموز بالأكواد، وتسرد التطبيقات التي تستخدم Hivesigner. راجع [واجهة REST](/docs/api).

## سلسلة صلاحية النشر {#authority-chain}

على Hive، يمكن لحساب أن يسمح لحساب آخر بالتصرف بصلاحية النشر الخاصة به. وتعتمد الواجهة على اثنين من هذه التفويضات:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **يضيف المستخدم حساب تطبيقك إلى صلاحية النشر الخاصة به.** تقوم شاشة الموافقة بذلك في أول مرة يوافق فيها مستخدم على وصول النشر لتطبيقك. ويتطلب ذلك مفتاحه النشط مرة واحدة.
2. **يضيف حساب تطبيقك @hivesigner إلى صلاحية النشر الخاصة به.** تفعل ذلك مرة واحدة، عند [تسجيل تطبيقك](/docs/register-app#grant-hivesigner).

قبل البثّ، تتحقق الواجهة من وجود كلا التفويضين. ولا تبثّ إلا العمليات التي يكون مؤلفها هو المستخدم الذي يسمّيه الرمز.

يمكن للمستخدم إزالة وصول تطبيقك في أي وقت على https://hivesigner.com/authorized-apps. وبعد ذلك لا تستطيع الواجهة النشر نيابةً عنه عبر تطبيقك.

## طريقتان للتكامل {#two-ways-to-integrate}

### تسجيل الدخول ثم البثّ عبر الواجهة {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

يوافق المستخدم مرة واحدة. وبعدها يستطيع تطبيقك التصويت والتعليق والنشر نيابةً عنه دون سؤاله مجددًا، إلى أن ينتهي صلاحية الرمز أو يزيل المستخدم وصول تطبيقك. استخدم هذه الطريقة للإجراءات الاجتماعية اليومية.

تحتاج إلى حساب تطبيق بعناوين استدعاء مسجَّلة وتفويض @hivesigner. راجع [تسجيل تطبيقك](/docs/register-app). وإذا كنت تريد فقط معرفة هوية المستخدم، فراجع [تسجيل الدخول دون وصول النشر](/docs/login-only).

### روابط التوقيع {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

يرى المستخدم كل معاملة قبل توقيعها. تغطي روابط التوقيع 41 عملية على Hive، منها التحويلات وغيرها من إجراءات المحفظة التي تحتاج المفتاح النشط. ولا تتعامل الواجهة مع تلك العمليات أبدًا. ولا تحتاج إلى حساب تطبيق لروابط التوقيع. راجع [روابط التوقيع](/docs/sign-links).

### أيّهما تختار {#which-to-choose}

- **إجراءات النشر المتكررة** (التصويتات والتعليقات والمتابعات): سجّل الدخول باستخدام OAuth2 ثم استخدم الواجهة.
- **إجراءات المحفظة**، أو أي شيء يحتاج المفتاح النشط: استخدم روابط التوقيع.
- **كلتاهما**: كثير من التطبيقات تسجّل دخول الأشخاص باستخدام OAuth2 للميزات الاجتماعية وتستخدم روابط التوقيع للتحويلات.
- **هوية المستخدم فقط**: راجع [تسجيل الدخول دون وصول النشر](/docs/login-only).

## الشيفرة المصدرية {#source-code}

Hivesigner مفتوح المصدر:

- الموقّع في المتصفح: https://github.com/ecency/hivesigner-ui
- الواجهة: https://github.com/ecency/hivesigner-api
- حزمة JavaScript SDK (حزمة npm باسم `hivesigner`): https://github.com/ecency/hivesigner-sdk. راجع [حزم التطوير](/docs/sdk).
