Bir uygulama Hivesigner ile giriş yapmanıza izin verdiğinde, sizi bir istekle birlikte hivesigner.com adresine gönderir. Hivesigner kimin istediğini, ne istediğini ve hangi hesabınızın yanıt verdiğini gösterir. Kararı orada siz verirsiniz. Uygulama anahtarlarınızı hiçbir zaman almaz: aldığı şey, tarayıcınızda imzalanmış, kullanıcı adınıza dair bir kanıttır.

## İstek ekranı {#request-screen}

Yukarıdan aşağıya ekranda şunlar görünür:

- **Uygulama.** Görseli ve bir başlık. Uygulama ilk kez gönderi erişimi istediğinde başlık “UYGULAMA hesabınıza erişim istiyor.” şeklindedir. Diğer durumlarda “UYGULAMA uygulamasına giriş yap” yazar. Buradaki adı uygulama kendisi seçer.
- **Hive hesabı @UYGULAMA_HESABI.** Uygulamanın gerçek Hive hesabı. Bir uygulama kendine istediği adı verebilir ama bu adı değiştiremez. Kontrol edin.
- **Yönlendirileceğiniz adres: HOST.** Onayladığınızda Hivesigner'ın sizi geri gönderdiği site.
- **Kapsam.** Uygulamanın istediği şey: [yalnızca giriş veya gönderi erişimi](/docs/signing-in#scopes).
- **Hesap satırı.** “Yetkilendiren hesap” veya “Giriş yapan hesap” ifadesiyle birlikte uygulamanın alacağı hesap ve bir **Hesap değiştir** bağlantısı. Bkz. [Hesabı seçin](/docs/signing-in#choose-account).
- **Düğme.** **Yetkilendir** veya **Giriş yap**. Hesap kilitliyse üstünde bir **Erişim kodu** alanı belirir; tek tıklama hesabın kilidini açar ve devam eder.
- **İptal.** Sizi **Hesaplar** sayfanıza götürür. Hivesigner uygulamaya hiçbir şey göndermez.

Bu tarayıcıda henüz hesap yoksa düğmede **Devam et** yazar. **Hesap ekle** formunu açar ve ardından sizi isteğe geri getirir. Bkz. [Hesap ekleme](/docs/accounts#add-account).

## Yalnızca giriş veya gönderi erişimi {#scopes}

Bir uygulama bu ikisinden birini ister. Arada bir seçenek yoktur.

### Yalnızca giriş {#sign-in-only}

**Kapsam** alanında “Hesabınızın kullanıcı adını görüntüleme” yazar. Uygulama, imzanızla doğrulanmış biçimde hangi Hive hesabı olduğunuzu öğrenir. Sizin adınıza işlem yapma izni almaz. Düğmede **Giriş yap** yazar.

Kendi Hive hesabı olmayan bir site de giriş yapmanızı isteyebilir. Ekranında “HOST Hive kullanıcı adınızı doğrulamak istiyor.” yazar. Böyle bir istek her zaman yalnızca giriştir. Hivesigner siteyi adresiyle anar, çünkü o adres hakkında kontrol edebileceğiniz tek şeydir.

### Gönderi erişimi {#posting-access}

**Kapsam** alanında “Gönderi yetkinizle UYGULAMA şunları yapabilecek:” yazar ve ardından bunun anlamı sıralanır:

- **Gönderi paylaşma ve yorum yapma:** sizin adınıza gönderi ve yorum yayımlama.
- **Oy verme:** hesabınızla artı ve eksi oy verme.
- **Takip etme ve akışınızı güncelleme:** sizin adınıza takip etme, sessize alma ve yeniden paylaşma.

Gönderi yetkisi, Hive hesabınızın günlük işlemleri denetleyen bölümüdür. Onaylamak, uygulamanın Hive hesabını gönderi yetkinize ekler. Bu, Hive blok zincirinde tek bir izin verme işlemidir; ayrı ayrı izinlerden oluşan bir liste değildir.

## Gönderi erişimi neye izin verir {#what-posting-access-allows}

Gönderi erişimiyle uygulama, gönderi anahtarınızın yapabildiği her şeyi sizin adınıza yapabilir:

- gönderilerinizi ve yorumlarınızı yayımlamak, düzenlemek ve silmek
- oy vermek
- takip etmek, sessize almak ve yeniden paylaşmak
- profilinizi düzenlemek
- ödüllerinizi kendi cüzdanınıza talep etmek
- Hive uygulamalarının ve oyunlarının kullandığı diğer günlük işlemler

Şunları asla yapamaz:

- paranızı hareket ettirmek: HIVE veya HBD göndermek, power up ya da power down yapmak, Hive Power devretmek veya birikiminizi kullanmak
- anahtarlarınızı ya da hesabınızı kimin denetlediğini değiştirmek
- başka uygulamalara erişim vermek

> **Uyarı:** Yalnızca güvendiğiniz uygulamaları yetkilendirin. Gönderi erişimi siz iptal edene kadar sürer. Hivesigner'da değil Hive blok zincirinde saklanır: hesabı Hivesigner'dan kaldırmak bu erişimi sona erdirmez.

## Bir uygulamayı ilk kez yetkilendirdiğinizde {#first-time}

Bir uygulamaya ilk kez gönderi erişimi verdiğinizde ekranda şu bildirim çıkar: “İlk yetkilendirme: Bu adım @UYGULAMA_HESABI hesabını zincir üzerindeki gönderi yetkinize ekler ve bunun için bir kez aktif anahtarınız gerekir. Siz yetkiyi iptal edene kadar bu hesap sizin adınıza gönderi paylaşabilecek.”

Hesabınız adına kimin gönderi paylaşabileceğini değiştirmek hesabın kendisinde bir değişikliktir, bu yüzden aktif anahtarınız gerekir. Bu cihazda yoksa ekran anahtarı yerinde ister:

1. Aktif anahtarınızı **@KULLANICI için aktif anahtar veya ana şifre** alanına yapıştırın. Hivesigner anahtarı Hive ağındaki hesabınızla karşılaştırır ve diğer anahtarlarınızla birlikte bu cihaza kaydeder. Ana şifrenizi yapıştırırsanız Hivesigner ondan yalnızca aktif anahtarı, bu cihazda gönderi anahtarı yoksa onu da saklar.
2. Hesabın erişim kodu yoksa form varsayılan olarak işaretli **Erişim koduyla koru (önerilir)** seçeneğini sunar. Hesabın kodu varsa ve Hivesigner'ın buna yeniden ihtiyacı olursa, form bunu **@KULLANICI için erişim kodu** alanında ister.
3. **Aktif anahtar ekle**'yi, ardından **Yetkilendir**'i seçin.

Hivesigner değişikliği tarayıcınızdan Hive ağına gönderir. Sizi giriş yapmış hâlde uygulamaya geri göndermeden önce değişikliğin blok zincirinde görünmesini bekler. Bu çok uzun sürerse şunu görürsünüz: “Yetkilendirme gönderildi ancak hâlâ onaylanıyor. Lütfen birazdan tekrar deneyin.”

Aktif anahtar sonrasında bu cihazda kalır. Burada yalnızca gönderi anahtarını tutmak için bkz. [Yalnızca ihtiyacınız olan anahtarları ekleyin](/docs/safety#only-the-keys-you-need).

## Dizinden bir uygulamayı yetkilendirme {#directory}

[hivesigner.com/apps](https://hivesigner.com/apps) adresindeki her uygulama, “Yetkilendir: @UYGULAMA_HESABI” başlıklı bir sayfa açar. Sayfa, uygulamanın kendisi hakkında yayımladıklarını ve şu cümleyi gösterir: “@UYGULAMA_HESABI, @KULLANICI hesabı adına gönderi paylaşabilecek, yorum yapabilecek, oy verebilecek ve takip edebilecek.”

**Yetkilendir**'i seçmek, ilk yetkilendirme ekranında olduğu gibi uygulamaya hemen gönderi erişimi verir. Bunun için aktif anahtarınız gerekir. Bunu hiçbir uygulama sizden istemedi, bu yüzden yalnızca bilerek yapmak istediğinizde kullanın. **İptal** sizi **Hesaplar** sayfanıza götürür.

Hesabınız uygulamaya gönderi erişimini zaten verdiyse sayfa “@UYGULAMA_HESABI yetkilendirildi.” yazar ve **Devam et** sunar.

## Bir uygulamaya geri dönme {#coming-back}

Hesabınız bir uygulamaya gönderi erişimini zaten verdiyse yeni bir izin verilmez. Ekran daha kısadır:

- Başlıkta “UYGULAMA uygulamasına giriş yap” yazar.
- Bir satırda “@UYGULAMA_HESABI uygulamasını daha önce yetkilendirdiniz. Yeni bir izin verilmiyor.” yazar.
- Hesap satırında “Giriş yapan hesap” yazar.
- Düğmede **Giriş yap** yazar.

Bunun için yalnızca gönderi anahtarınız (veya aktif anahtarınız) gerekir. Aradan yetkiyi iptal ettiyseniz ilk yetkilendirme ekranı yeniden çıkar.

## Hesabı seçin {#choose-account}

Hesap satırı, uygulamanın alacağı hesabı belirtir. Özellikle bu cihazda birden fazla hesabınız varsa onaylamadan önce kontrol edin.

- Hesap listenizi yerinde açmak için **Hesap değiştir**'i seçin. Başka birini seçtiğinizde ekran o hesaba geçer.
- Bu cihazda henüz bulunmayan bir hesabı eklemek için listenin altındaki **Başka bir hesap ekle**'yi seçin. Hivesigner ardından sizi isteğe geri getirir.

Bir uygulama hangi hesabın kullanılacağını önerebilir. O hesap bu cihazdaysa Hivesigner onu seçer. Yine de değiştirebilirsiniz.

## Hivesigner bir isteği reddettiğinde {#refused-requests}

Hivesigner, doğrulayamadığı bir isteği onaylamanıza izin vermez. Bunun yerine ekranda şu mesajlardan biri görünür:

| Mesaj | Anlamı |
| --- | --- |
| “Bu uygulamanın yönlendirme URL'si kayıtlı değil. Güvenliğiniz için giriş engellendi.” | Geri dönüş adresi, uygulamanın Hive hesabında listelediği adreslerden biri değil. |
| “@UYGULAMA_HESABI bir Hive hesabı değil, bu yüzden yetkilendirilecek bir uygulama yok. Siteye geri dönüp tekrar deneyin.” | İstek, var olmayan bir uygulamayı belirtiyor. |
| “Bu site, giriş bilgilerinizin şifrelenmemiş bir http:// adresine gönderilmesini istedi. Hivesigner bu bilgileri yalnızca https üzerinden gönderir. Siteden güvenli bir adres kullanmasını isteyin.” | Geri dönüş adresi güvenli değil. |
| “Bu site, giriş bilgilerinizin web URL'si olmayan bir adrese gönderilmesini istedi. Siteye geri dönüp tekrar deneyin.” | Geri dönüş adresi bir web adresi değil. |
| “Bu yetkilendirme isteği eksik: bir uygulama veya yönlendirme URL'si belirtilmemiş. Uygulamaya geri dönüp tekrar deneyin.” | İsteğin bazı parçaları eksik. |

Uygulamaya dönüp tekrar deneyin. Sorun sürerse **Bu sorunu bildir**'i seçin. Bu, bağlantıyı ve isteğe bağlı notunuzu, gizli bilgiler gizlenmiş hâlde Hivesigner ekibine gönderir.

Hivesigner Hive ağına ulaşamazsa “Hesap bilgileri Hive ağından yüklenemedi.” yazar. **Tekrar dene**'yi seçin.

## Bir uygulamanın erişimini görme ve kaldırma {#remove-access}

1. [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps) adresini açın. Alt bilgi buraya **Yetkili uygulamalar** bağlantısıyla götürür.
2. Sayfa, seçili hesap için “@KULLANICI adına gönderi paylaşabilen uygulamalar.” yazar ve altında uygulamaları listeler. Başka bir hesabın uygulamalarını görmek için önce **Hesaplar** sayfasında o hesabı seçin.
3. Hesap kilitliyse erişim kodunu girip **Kilidi aç**'ı seçin.
4. Uygulamanın yanındaki **Yetkiyi iptal et**'i seçin. Aktif anahtar bu cihazdaysa uygulamanın erişimi hemen kaldırılır.

Liste, kendi başına sizin adınıza gönderi paylaşabilen bütün hesapları gösterir; başka araçlarla eklediğiniz hesaplar dahil.

Yetkiyi iptal etmek Hive blok zincirindeki hesabınızda bir değişikliktir, bu yüzden bir kez aktif anahtarınız gerekir. Bu cihazda yoksa **Yetkiyi iptal et**, o uygulama için bir sayfa açar (“Yetkiyi iptal et: @UYGULAMA_HESABI”) ve aktif anahtarı orada ister. Sayfada “@UYGULAMA_HESABI artık @KULLANICI hesabı adına işlem yapamayacak.” yazar. Anahtarı ekleyin ve **Yetkiyi iptal et**'i seçin.

Bir uygulamanın yetkisini iptal ettiğinizde Hivesigner, uygulamanın hesabını hesabınızın gönderi yetkisinden çıkarır (varsa aktif yetkisinden de). O andan itibaren uygulama sizin adınıza gönderi paylaşamaz, oy veremez ve işlem yapamaz. Uygulama ileride yeniden gönderi erişimi isterse ilk yetkilendirme ekranını görürsünüz.

Yetkiyi iptal etmek sizi uygulamanın kendi web sitesinden çıkarmaz. İsterseniz oradan da çıkış yapın.
