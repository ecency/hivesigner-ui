Hivesigner, kendisine eklediğiniz Hive hesaplarının anahtarlarıyla imzalar. Bir hesabı kullandığınız her tarayıcıda bir kez eklersiniz. Hivesigner o hesabın anahtarlarını o tarayıcıda tutar; bir erişim kodu belirlediyseniz şifreleyerek saklar.

## Hesap ekleme {#add-account}

1. Tarayıcınızın adres çubuğunda `https://hivesigner.com` yazdığını doğrulayın. Bkz. [Önce adresi kontrol edin](/docs/safety#check-the-address).
2. [hivesigner.com/import](https://hivesigner.com/import) adresini açın. Bu tarayıcıda henüz hesap yoksa ana sayfadaki **Hivesigner'ı kurun** aynı formu açar.
3. **Kullanıcı adı** alanına Hive kullanıcı adınızı `@` olmadan küçük harflerle yazın.
4. **Özel anahtar** alanına özel anahtarlarınızdan birini yapıştırın. Önce [Hangi anahtarı eklemeli](/docs/accounts#which-key) bölümüne bakın.
5. **Erişim koduyla koru (önerilir)** seçeneğini işaretli bırakın ve bir **Erişim kodu** belirleyin. En az 4 karakter gerekir. Bkz. [Erişim koduyla koruyun](/docs/accounts#passcode).
6. **Hesap ekle**'yi seçin.

Hivesigner, hiçbir şeyi kaydetmeden önce anahtarı Hive ağındaki hesabınızla karşılaştırır. Anahtarın genel kısmını, hesabınızın listelediği anahtarlarla kıyaslar. Özel anahtarın kendisi hiçbir yere gönderilmez. Kullanıcı adı bir Hive hesabı değilse ya da anahtar o hesaba ait değilse form şunu yazar: “Geçersiz kullanıcı adı veya anahtar. Ana şifrenizi ya da sahip, aktif, gönderi veya memo anahtarınızı kullanın.”

Eklediğiniz hesap seçili hesap olur: Hivesigner'ın kendi ekranlarında kullandığı hesap. Forma bir istekten geldiyseniz Hivesigner sizi o isteğe geri götürür. Aksi hâlde **Hesaplar** sayfasını açar.

### Bir hesaba başka bir anahtar ekleme {#add-a-key}

Burada zaten bulunan bir hesaba ikinci bir anahtar eklemek için (örneğin gönderi anahtarının yanına aktif anahtarı) hesabı yeni anahtarla tekrar ekleyin. Hivesigner mevcut anahtarları korur ve yenisini ekler. Zaten bulunan bir tür için gelen yeni anahtar eskisinin yerini alır.

Hesabın bir erişim kodu varsa **Erişim koduyla koru (önerilir)** seçeneğini işaretli bırakın ve aynı erişim kodunu girin. Hivesigner başka bir şeyi kabul etmez:

- Erişim kodu girilmezse form şunu yazar: “Bu hesap bu cihazda korunuyor. Anahtarı eklemek için hesabın erişim kodunu girin.”
- Farklı bir kod girilirse şunu yazar: “Yanlış erişim kodu. Anahtar kaydedilmedi.”

## Hangi anahtarı eklemeli {#which-key}

Bir Hive hesabının birkaç özel anahtarı vardır. Her biri farklı işlemlere izin verir. Bu anahtarları Hive hesabınızı oluşturan cüzdandan veya uygulamadan, genellikle anahtarlar ya da şifre sayfasından aldınız. Hivesigner bunları size gösteremez.

| Anahtar | Hivesigner'ın kullandığı yerler |
| --- | --- |
| Gönderi | Uygulamalara giriş, oy verme, gönderi ve yorum paylaşma, takip etme, profilinizi düzenleme ve ödüllerinizi talep etme. |
| Aktif | Transfer, power up ve power down, devretme, birikim ve dönüştürme gibi cüzdan işlemleri. Tanık ve teklif oyları. Bir uygulamayı ilk kez yetkilendirme ve bir uygulamanın yetkisini iptal etme. |
| Sahip | Sahip anahtarınızı veya kurtarma hesabınızı değiştirme. Günlük kullanımda gerekmez. |
| Memo | Hiçbir şey. Form kabul eder ama yalnızca memo anahtarı olan bir hesap giriş yapamaz: istek ekranı o zaman “Devam etmek üzere @KULLANICI hesabı için bir gönderi anahtarı veya aktif anahtar ekleyin” yazar. |

Günlük kullanım için gönderi anahtarını ekleyin. Aktif anahtarı yalnızca bir cüzdan işlemi ya da bir uygulamayı ilk kez yetkilendirmek için gerektiğinde ekleyin. Bir ekran bu cihazda bulunmayan bir anahtara ihtiyaç duyduğunda bunu söyler ve eklemenize izin verir.

Ana şifreniz de **Özel anahtar** alanında çalışır. Hivesigner ondan anahtarlarınızı türetir ve hesabınızla hâlâ eşleşen her anahtarı, sahip anahtarı dahil, saklar. Anahtarları ayrı ayrı eklemek sahip anahtarını bu cihazın dışında tutar.

> **Not:** Hivesigner her işlemi tam olarak gerektirdiği anahtarla imzalar. Bu, 2025'teki bir hard fork'tan beri yürürlükte olan bir Hive kuralıdır. Aktif anahtar artık oy gibi bir gönderi işlemini imzalayamaz. Sahip anahtarı artık bir cüzdan işlemini imzalayamaz. Aktif anahtar burada olsa bile gönderi anahtarını ekleyin.

Bir uygulamaya giriş yapmak farklıdır: bu bir işlem değildir. Hivesigner sizi gönderi anahtarıyla, bu cihazda hesabın gönderi anahtarı yoksa aktif anahtarla içeri alır.

## Erişim koduyla koruyun {#passcode}

Erişim kodu, yalnızca bu tarayıcı için seçtiğiniz bir paroladır. Hive parolanız değildir ve anahtarlarınızdan biri de değildir. Hivesigner bununla hesabın anahtarlarını saklamadan önce şifreler. Onları çözmek için kodu yeniden sorar.

- Hivesigner erişim kodunuzu saklamaz ve hiçbir yere göndermez. Kimse sizin için kurtaramaz.
- Bu cihazdaki her hesabın kendi erişim kodu vardır. Hepsi için aynısını kullanabilirsiniz.
- Daha uzun bir kodu tahmin etmek daha zordur. Erişim kodu olarak Hive ana şifrenizi veya anahtarlarınızdan birini kullanmayın.

Erişim kodu olmadan Hivesigner hesabın anahtarlarını bu tarayıcıda şifrelemeden saklar. Her açılışta anahtarları kendisi çözer, bu yüzden bu tarayıcıyı kullanan herkes onlarla imza atabilir. **Hesaplar** sayfası böyle hesapları **Erişim kodu yok** ile işaretler.

Erişim kodu olmayan bir hesaba kod eklemek için hesabı anahtarlarından biriyle ve bir erişim koduyla tekrar ekleyin. Hivesigner o zaman hesabın bütün anahtarlarını bu kodla şifreler.

Bir erişim kodunu değiştirmek için [hesabı kaldırın](/docs/accounts#remove-account) ve yeni kodla yeniden ekleyin. Kaldırmak hesabın bütün anahtarlarını bu tarayıcıdan siler, bu yüzden her anahtarı tekrar ekleyin (önce gönderi anahtarını, kullanıyorsanız sonra aktif anahtarı).

## Bir hesabın kilidini açma {#unlock}

Erişim kodu olan bir hesap, Hivesigner her açıldığında kilitli başlar: yeni bir sekmede, bir yeniden yüklemeden sonra ya da bir uygulama sizi buraya yönlendirdiğinde. Kilidi önceden açmanız gerekmez. Anahtarlara ihtiyaç duyan ekran, kendi düğmesinin üstünde bir **Erişim kodu** alanı gösterir (örneğin **Giriş yap**, **Onayla** veya **Kilidi aç**). Tek tıklama hesabın kilidini açar ve devam eder.

Yanlış bir kod “Yanlış erişim kodu.” yazar ve hiçbir şey imzalanmaz.

Hivesigner kilidi açılmış anahtarları yalnızca bellekte tutar, depolamada asla. Hesap, siz sekmeyi kapatana veya yeniden yükleyene kadar o sekmede açık kalır.

## Hesap değiştirme {#switch-accounts}

**Hesaplar** sayfası bu cihazdaki hesapları A'dan Z'ye listeler. Seçili hesapta bir onay işareti bulunur. 6 hesaptan itibaren bir **Hesap ara** alanı listeyi süzer.

Bir hesabı seçerek onu seçili hesap yapın. Hivesigner burada erişim kodunu sormaz. Anahtarlara ihtiyaç duyan ekran sorar.

Bir istek ekranında, hesabı belirten satırın (“Giriş yapan hesap”, “Yetkilendiren hesap” veya “İmzalayan hesap”) yanında bir **Hesap değiştir** bağlantısı bulunur. Aynı listeyi yerinde açar, böylece isteği terk etmeden başka bir hesap seçebilirsiniz. Listenin altındaki **Başka bir hesap ekle**, **Hesap ekle** formunu açar ve ardından sizi isteğe geri getirir.

## Hesap kaldırma {#remove-account}

1. **Hesaplar** sayfasını açın.
2. Hesabın yanındaki **✕** işaretini seçin. Ekran okuyucular için etiketi **Hivesigner'dan kaldır @KULLANICI** şeklindedir.
3. Tarayıcı “@KULLANICI hesabı bu cihazdan kaldırılsın mı? Bu hesabın buradaki anahtarları silinecek.” diye sorduğunda onaylayın.

Bir hesabı kaldırmak anahtarlarını yalnızca bu tarayıcıdan siler. Hive hesabınız değişmez. Yetkilendirdiğiniz uygulamalar erişimlerini korur, çünkü bu erişim Hive blok zincirinde saklanır. Erişimi kaldırmak için bkz. [Bir uygulamanın erişimini görme ve kaldırma](/docs/signing-in#remove-access).

Seçili hesabı kaldırırsanız bu cihazdaki başka bir hesap seçili hesap olur.

Tarayıcı Hivesigner'ın değişikliği kaydetmesine izin vermezse şunu görürsünüz: “Yalnızca bu oturum için kaldırıldı: depolama kullanılamıyor, bu yüzden sayfayı yeniden yüklediğinizde bu hesap geri gelecek.”

## Erişim kodunuzu unutursanız {#forgotten-passcode}

Bir erişim kodunu kimse kurtaramaz, Hivesigner de kurtaramaz. Hive hesabınız etkilenmez: erişim kodu yalnızca anahtarlarınızın bu tarayıcıdaki kopyasını korur.

1. [Hesabı kaldırın](/docs/accounts#remove-account).
2. Anahtarıyla ve yeni bir erişim koduyla [yeniden ekleyin](/docs/accounts#add-account).

Hive blok zincirinde hiçbir şey değişmez. Yetkilendirdiğiniz uygulamalar erişimlerini korur.

## Anahtarlarınızın saklandığı yer {#where-keys-are-stored}

Hivesigner anahtarlarınızı yalnızca bu cihazdaki bu tarayıcıda, tarayıcının hivesigner.com için ayırdığı depolama alanında saklar.

- Anahtarlar eşitlenmez. Başka bir tarayıcı, başka bir tarayıcı profili ya da başka bir cihaz onlara sahip olmaz. Hesabı orada da ekleyin.
- hivesigner.com için site verilerini veya tarama verilerini silmek anahtarları da siler. Bir gizli pencereyi kapatmak da öyle.
- Hivesigner bir yedek değildir. Anahtarlarınızı ya da ana şifrenizi başka bir yerde güvenle saklayın.
