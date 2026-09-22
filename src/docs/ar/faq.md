إجابات موجزة عن الأسئلة الشائعة. كل إجابة تحيل إلى الصفحة التي فيها التفاصيل.

## استخدام Hivesigner {#using-hivesigner}

### هل Hivesigner مجاني؟ {#is-it-free}

نعم. لا يتقاضى Hivesigner رسومًا من الأشخاص ولا من التطبيقات. وشيفرته المصدرية مفتوحة برخصة MIT.

### هل يرى Hivesigner مفاتيحي في أي وقت؟ {#keys}

لا. تبقى مفاتيحك في متصفحك على جهازك، وهناك يوقّع Hivesigner. لا تُرسل أبدًا إلى خوادم Hivesigner ولا إلى التطبيقات التي تستخدمها. انظر [أين تُخزَّن مفاتيحك](/docs/accounts#where-keys-are-stored) و[حافظ على أمان مفاتيحك](/docs/safety).

### ماذا لو نسيت رمز المرور؟ {#forgotten-passcode}

لا أحد يستطيع استرجاع رمز المرور، ولا حتى Hivesigner. أزِل الحساب من Hivesigner وأضِفه من جديد بمفتاح Hive ورمز مرور جديد. لن يتغير حسابك على Hive ولا التطبيقات التي خوّلتها. انظر [إذا نسيت رمز المرور](/docs/accounts#forgotten-passcode).

### هل أستطيع استخدام Hivesigner على هاتفي؟ {#phone}

نعم. افتح https://hivesigner.com في متصفح هاتفك وأضِف حسابك هناك. تُخزَّن مفاتيحك في ذلك المتصفح وحده، لذا أضِف الحساب على كل جهاز تستخدمه. انظر [إضافة الحسابات وإدارتها](/docs/accounts).

### أي التطبيقات تستخدم Hivesigner؟ {#which-apps}

يسرد https://hivesigner.com/apps التطبيقات التي تبث المعاملات إلى Hive عبر Hivesigner، مرتّبةً من الأكثر استخدامًا. وكل تطبيق ينشر اسمه ووصفه بنفسه، ولا يتحقق Hivesigner منهما. وفتح تطبيق هناك يعرض صفحة تتيح منحه صلاحية النشر. انظر [تخويل تطبيق من الدليل](/docs/signing-in#directory).

### ما علاقة Hivesigner بـ Hive Keychain؟ {#hive-keychain}

هما أداتان منفصلتان. Hive Keychain إضافة متصفح وتطبيق هاتف، أما Hivesigner فموقع ويب ولا شيء فيه للتثبيت. وحين يطلب منك تطبيق توقيع رسالة، يكون التوقيع من النوع نفسه الذي ينتجه Hive Keychain، فيتحقق التطبيق من كليهما بالشيفرة نفسها. ورمز التحقق الناتج من صفحة **توقيع رسالة** في Hivesigner يُفحص في صفحة **التحقق من رسالة** في Hivesigner. انظر [توقيع الرسائل](/docs/message-signing).

## التطوير باستخدام Hivesigner {#building}

### هل أستطيع استخدام Hivesigner في تطبيق هاتف؟ {#mobile-app}

نعم. أرسِل المستخدم إلى Hivesigner في متصفح، واستخدم عنوان عودة يستطيع تطبيقك استقباله: رابط https تملكه أنت (Android App Links أو iOS Universal Links) أو عنوان استرجاع محلي مثل `http://127.0.0.1/auth`. أما المخططات الخاصة مثل `myapp://` فمرفوضة. انظر [تطبيقات الهاتف وسطح المكتب](/docs/register-app#native-apps).

### هل أحتاج إلى حساب للتطبيق؟ {#app-account}

تحتاج إليه لتسجيل دخول الأشخاص مع صلاحية النشر، وللبث عبر واجهة API. انظر [سجّل تطبيقك](/docs/register-app). أما [روابط التوقيع](/docs/sign-links) و[توقيع الرسائل](/docs/message-signing) فتعمل من دونه، وكذلك [تسجيل الدخول بلا صلاحية نشر](/docs/login-only).

### هل تستطيع واجهة API إرسال التحويلات؟ {#transfers}

لا. تبث واجهة API عمليات مستوى النشر فقط، مثل التصويت والتعليقات والمتابعة. أما التحويلات وسائر العمليات التي تحتاج إلى المفتاح النشط فاستخدم لها [روابط التوقيع](/docs/sign-links): يوافق المستخدم على كل واحدة بمفتاحه هو.

### أي اللغات لها SDK؟ {#languages}

الـ SDK الرسمية مخصصة لـ JavaScript. وتوجد مكتبات من المجتمع للغة Python. وتستطيع أي لغة استدعاء واجهة REST API. انظر [حِزم SDK](/docs/sdk) و[واجهة REST API](/docs/api).

## المساعدة {#help}

### أين أجد المساعدة؟ {#get-help}

اسأل في خادم HiveDevs على Discord: https://discord.gg/pNJn7wh. وأبلغ عن الأخطاء بفتح issue في مستودع GitHub المعني: https://github.com/ecency/hivesigner-ui للموقع، أو https://github.com/ecency/hivesigner-api لواجهة API، أو https://github.com/ecency/hivesigner-sdk لـ SDK الخاصة بـ JavaScript. وفي الشاشة التي ترفض طلبًا، يرسل زر **الإبلاغ عن هذه المشكلة** المشكلة إلى فريق Hivesigner.

### كيف أساهم؟ {#contribute}

Hivesigner مفتوح المصدر على GitHub في المستودعات الثلاثة أعلاه. افتح issue بخطأ أو فكرة، وأرسِل pull request بإصلاح.
