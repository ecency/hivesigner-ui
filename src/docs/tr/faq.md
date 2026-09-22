Sık sorulan sorulara kısa yanıtlar. Her yanıt, ayrıntıların bulunduğu sayfaya bağlanır.

## Hivesigner'ı kullanmak {#using-hivesigner}

### Hivesigner ücretsiz mi? {#is-it-free}

Evet. Hivesigner ne kullanıcılardan ne de uygulamalardan ücret alır. Kaynak kodu MIT lisansıyla açıktır.

### Hivesigner anahtarlarımı hiç görür mü? {#keys}

Hayır. Anahtarlarınız cihazınızdaki tarayıcıda kalır. Hivesigner imzalamayı orada yapar. Anahtarlar ne Hivesigner'ın sunucularına ne de kullandığınız uygulamalara gönderilir. Bkz. [Anahtarlarınızın saklandığı yer](/docs/accounts#where-keys-are-stored) ve [Anahtarlarınızı güvende tutun](/docs/safety).

### Erişim kodumu unutursam ne olur? {#forgotten-passcode}

Bir erişim kodunu kimse kurtaramaz, Hivesigner de kurtaramaz. Hesabı Hivesigner'dan kaldırın ve Hive anahtarınızla ve yeni bir erişim koduyla yeniden ekleyin. Hive hesabınız ve yetkilendirdiğiniz uygulamalar değişmez. Bkz. [Erişim kodunuzu unutursanız](/docs/accounts#forgotten-passcode).

### Hivesigner'ı telefonumda kullanabilir miyim? {#phone}

Evet. Telefonunuzun tarayıcısında https://hivesigner.com adresini açın ve hesabınızı orada ekleyin. Anahtarlarınız yalnızca o tarayıcıda saklanır, bu yüzden kullandığınız her cihazda hesabı ekleyin. Bkz. [Hesap ekleme ve yönetme](/docs/accounts).

### Hangi uygulamalar Hivesigner'ı kullanıyor? {#which-apps}

https://hivesigner.com/apps adresinde, Hivesigner üzerinden Hive ağına işlem yayınlayan uygulamalar en çok kullanılanlar önce olacak şekilde listelenir. Her uygulama kendi adını ve açıklamasını kendisi yayımlar. Hivesigner bunları doğrulamaz. Orada bir uygulamayı açmak, ona gönderi erişimi verebileceğiniz bir sayfa gösterir. Bkz. [Dizinden bir uygulamayı yetkilendirme](/docs/signing-in#directory).

### Hivesigner ile Hive Keychain arasındaki ilişki nedir? {#hive-keychain}

Bunlar ayrı araçlardır. Hive Keychain bir tarayıcı eklentisi ve bir mobil uygulamadır. Hivesigner ise bir web sitesidir, bu yüzden kurulacak bir şey yoktur. Bir uygulama sizden bir mesajı imzalamanızı istediğinde üretilen imza, Hive Keychain'in ürettiğiyle aynı türdendir; böylece uygulama her ikisini de aynı kodla doğrular. Hivesigner'ın kendi **Mesaj imzala** sayfasından çıkan doğrulama token'ı, Hivesigner'ın **Mesaj doğrula** sayfasında kontrol edilir. Bkz. [Mesaj imzalama](/docs/message-signing).

## Hivesigner ile geliştirme {#building}

### Hivesigner'ı bir mobil uygulamada kullanabilir miyim? {#mobile-app}

Evet. Kullanıcıyı tarayıcıdaki Hivesigner'a gönderin ve uygulamanızın alabileceği bir geri dönüş adresi kullanın: uygulamanızın sahibi olduğu bir https bağlantısı (Android App Links veya iOS Universal Links) ya da `http://127.0.0.1/auth` gibi bir geri döngü adresi. `myapp://` gibi özel şemalar reddedilir. Bkz. [Mobil ve masaüstü uygulamalar](/docs/register-app#native-apps).

### Bir uygulama hesabına ihtiyacım var mı? {#app-account}

Kullanıcıları gönderi erişimiyle içeri almak ve API üzerinden işlem yayınlamak için gerekir. Bkz. [Uygulamanızı kaydedin](/docs/register-app). [İmza bağlantıları](/docs/sign-links) ve [mesaj imzalama](/docs/message-signing) bu hesap olmadan da çalışır. [Gönderi erişimi olmadan giriş](/docs/login-only) de öyle.

### API transfer gönderebilir mi? {#transfers}

Hayır. API yalnızca gönderi düzeyindeki işlemleri yayınlar: oylar, yorumlar, takipler gibi. Transferler ve aktif anahtar gerektiren diğer işlemler için [imza bağlantılarını](/docs/sign-links) kullanın: kullanıcı her birini kendi anahtarıyla onaylar.

### Hangi diller için SDK var? {#languages}

Resmî SDK JavaScript içindir. Python için topluluk kütüphaneleri vardır. Her dil REST API'yi çağırabilir. Bkz. [SDK'lar](/docs/sdk) ve [REST API](/docs/api).

## Yardım {#help}

### Nereden yardım alabilirim? {#get-help}

HiveDevs Discord sunucusunda sorun: https://discord.gg/pNJn7wh. Bir hatayı ilgili GitHub deposunda issue olarak bildirin: web sitesi için https://github.com/ecency/hivesigner-ui, API için https://github.com/ecency/hivesigner-api, JavaScript SDK için https://github.com/ecency/hivesigner-sdk. Bir isteği reddeden ekranda **Bu sorunu bildir**, sorunu Hivesigner ekibine gönderir.

### Nasıl katkıda bulunabilirim? {#contribute}

Hivesigner, yukarıdaki üç depoda GitHub üzerinde açık kaynaktır. Bir hata ya da fikir için issue açın. Bir düzeltme için pull request gönderin.
