Kişileri Hivesigner ile giriş yaptıran bir uygulama, bir Hive hesabıdır. Hesabın adı, gönderdiğiniz `client_id` değeridir. Profili, Hivesigner'ın okuduğu ayarları taşır: token gönderebileceği geri çağırma adresleri ve kod akışı için bir istemci gizli anahtarı. API üzerinden yayın yapmak için uygulama hesabı ayrıca @hivesigner'a gönderi yetkisi verir. Bu sayfa her adımı sırayla anlatır.

## Nelere ihtiyacınız var {#what-you-need}

| Yapmak istediğiniz | Uygulama hesabı ve geri çağırma adresleri | İstemci gizli anahtarı | @hivesigner izni |
| --- | --- | --- | --- |
| Kişileri giriş yaptırmak ve token akışıyla yayın yapmak | Evet | Hayır | Evet |
| Kişileri giriş yaptırmak ve kod akışıyla yayın yapmak (yenileme token'ları) | Evet | Evet | Evet |
| Yalnızca kişileri giriş yaptırmak, uygulamanızı adlandıran bir token ile | Evet | Hayır | Hayır |
| Yalnızca kişileri giriş yaptırmak, Hive hesabı olmayan bir siteden | Hayır | Hayır | Hayır |
| İmza bağlantıları göndermek | Hayır | Hayır | Hayır |

Son iki satır için bkz. [Gönderi erişimi olmadan giriş](/docs/login-only) ve [İmza bağlantıları](/docs/sign-links).

## Uygulama hesabını oluşturun {#app-account}

1. Uygulamanız için bir Hive hesabı oluşturun, örneğin https://ecency.com/signup adresinden. Uygulama için kendi kişisel hesabınızı değil ayrı bir hesap kullanın. Hesabın adı `client_id` değerinizdir. Kullanıcılar bunu onay ekranında “Hive hesabı” yazısının yanında görür. Bir Hive hesabının adı sonradan değiştirilemez, bu yüzden adı özenle seçin.
2. Hesabı https://hivesigner.com/import adresinden Hivesigner'a ekleyin (**Hesap ekle**). Aktif anahtarı ya da ana parolayı kullanın: aşağıdaki izin için aktif anahtar gerekir.

## Uygulama ayarlarını doldurun {#app-settings}

Uygulama hesabı seçiliyken https://hivesigner.com/profile adresini açın ve şunları ayarlayın:

- **Bu hesap bir uygulamadır.** Bunu açın. Hesabı bir uygulama olarak işaretler ve API, bir kodu ya da yenileme token'ını kabul etmeden önce bunu denetler.
- **Yönlendirme URI'leri.** Geri çağırma adresleriniz, her satıra bir tane. Bkz. [Geri çağırma adresleri](#callbacks).
- **Oluşturan.** Uygulamayı kimin sürdürdüğü. https://hivesigner.com/apps adresindeki uygulama dizini bunu gösterir.
- **Durum.** Kendi kayıtlarınız için üretim ya da deneme ortamı. Hivesigner ikisine de aynı şekilde davranır.
- **İstemci gizli anahtarı.** Yalnızca [kod akışı](/docs/oauth2#code-flow) için gerekir. Bkz. [İstemci gizli anahtarı](#client-secret).

**Ad** ve **Profil resmi URL'si** alanlarını da doldurun. Onay ekranı uygulamanızın resmini ve adını gösterir. https://hivesigner.com/apps adresindeki uygulama dizini adı, **Hakkında** ve **Web sitesi** bilgisini gösterir.

Kaydetmek, hesabın profilini zincir üzerinde günceller ve gönderi anahtarını gerektirir. Hivesigner geri çağırma adreslerinizi, bir giriş isteği açıldığında hesaptan okur, bu yüzden bir değişiklik işlem bir bloğa girer girmez geçerli olur.

> **Not:** Ad, resim ve açıklama uygulama hesabınızın kendisi tarafından yayımlanır. Bu yüzden onay ekranı gerçek hesap adını (`@myapp`) ve kullanıcıyı gönderdiği ana makineyi de gösterir: izin ile yönlendirmede asıl kullanılan bunlardır.

## Geri çağırma adresleri {#callbacks}

Geri çağırma adresi (bir giriş isteğindeki `redirect_uri`), Hivesigner'ın kullanıcıyı bir token ya da kodla geri gönderdiği yerdir. Hivesigner bunu yalnızca uygulama hesabınızda listelenmiş bir adrese gönderir.

### Kurallar {#callback-rules}

- **Tam eşleşme.** İstekteki `redirect_uri`, Yönlendirme URI'lerinizden biriyle karakteri karakterine aynı olmalıdır: şema, ana makine, port, yol ve sorgu.
- **Yalnızca https.** Bir geri çağırma adresi `https://` kullanmalıdır. Düz `http://` yalnızca geri döngüde kabul edilir: `localhost`, `127.0.0.1` ya da `[::1]`.
- **Geri döngü portları değişebilir.** Kayıtlı düz http geri döngü adresi, aynı yol, sorgu, parça ve kullanıcı bilgisine sahip her geri döngü ana makinesi ve portuyla eşleşir. Kayıtlı bir `https://` geri döngü adresi ise tam eşleşme olarak kalır.
- **Özel şema yok.** `myapp://callback` gibi bir adres reddedilir. Bkz. [Mobil ve masaüstü uygulamalar](#native-apps).
- **Parça yok.** Bir geri çağırma adresine `#fragment` eklemeyin.

Profil sayfası, hiçbir zaman çalışamayacak bir adresi kaydetmeyi “Kullanılamayan geri çağırma adresleri (https ya da localhost üzerinde http olmalı)” diyerek reddeder.

### Örnekler {#callback-examples}

Şu Yönlendirme URI'leri kayıtlıyken:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| İstekteki `redirect_uri` | Sonuç |
| --- | --- |
| `https://myapp.example/auth/callback` | Kabul edildi: tam eşleşme |
| `https://myapp.example/auth/callback/` | Reddedildi: fazladan `/` |
| `https://myapp.example/auth/callback?next=home` | Reddedildi: sorgu farklı |
| `https://www.myapp.example/auth/callback` | Reddedildi: başka bir ana makine |
| `http://myapp.example/auth/callback` | Reddedildi: geri döngü dışında düz http |
| `http://localhost:3000/auth` | Kabul edildi: tam eşleşme |
| `http://127.0.0.1:51234/auth` | Kabul edildi: geri döngü, aynı yol, başka bir port |
| `http://[::1]:3000/auth` | Kabul edildi: geri döngü, aynı yol |
| `http://127.0.0.1:3000/other` | Reddedildi: başka bir yol |
| `https://localhost:3000/auth` | Reddedildi: https, düz http kaydıyla eşleşmez |
| `myapp://auth` | Reddedildi: özel şema |

Geri çağırma adresinizde bir sorgu kabul etmek için adresi tam olarak o sorguyla kaydedin. Hivesigner sizin sorgunuzu olduğu gibi tutar ve kendi parametrelerini sonrasına ekler.

### Mobil ve masaüstü uygulamalar {#native-apps}

Hivesigner token'ı geri çağırma adresinin içine koyar. `myapp://` gibi özel bir şema tek bir uygulamaya bağlı değildir: aynı cihazdaki başka bir uygulama onu sahiplenip token'ı alabilir. Bu yüzden Hivesigner özel şemaları reddeder ve token'ları yalnızca bir https adresine ya da kullanıcının kendi cihazındaki geri döngüye gönderir.

Yerel bir uygulama bunun yerine şunlardan birini kullanır:

- **Sahibi olduğu bir https bağlantısı.** Kendi alan adınızda, işletim sisteminin uygulamanızda açtığı bir adres kaydedin (Android App Links ya da iOS Universal Links).
- **Bir geri döngü adresi.** Uygulama yönlendirme için `127.0.0.1` üzerinde dinler. `http://127.0.0.1/auth` (ya da `localhost`) adresini kaydedin ve çalışma zamanında boş olan herhangi bir portu kullanın: portun eşleşmesi gerekmez.

## İstemci gizli anahtarı {#client-secret}

İstemci gizli anahtarı, bir kod takasının sizin sunucunuzdan geldiğini kanıtlar. [Kod akışı](/docs/oauth2#code-flow) için gereklidir: sunucunuz onu her kod ya da yenileme token'ıyla birlikte `/api/oauth2/token` adresine gönderir. Token akışı bunu kullanmaz.

- **Uzun ve rastgele bir değer üretin**, örneğin `openssl rand -hex 32` ile.
- **Profil sayfasında ayarlayın.** Hivesigner yalnızca sha256 özetini saklar ve bunu uygulama hesabınızın profilinde tutar. Alanı boş bırakmak mevcut gizli anahtarı korur.
- **Sunucunuzda tutun.** Onu hiçbir zaman bir web sayfasına, bir mobil uygulamaya ya da bir URL'ye koymayın.
- **Değiştirmek için** yenisini ayarlayın ve sunucunuzu aynı anda güncelleyin.

## @hivesigner'a gönderi yetkisi verin {#grant-hivesigner}

API, @hivesigner hesabının gönderi anahtarıyla yayın yapar. Hive bu imzayı kullanıcılarınız için ancak uygulama hesabınız @hivesigner'ı kendi gönderi yetkisine eklemişse kabul eder. Bkz. [Gönderi yetkisi zinciri](/docs/how-it-works#authority-chain).

1. Hivesigner'da uygulama hesabınızı seçin.
2. https://hivesigner.com/authorize/hivesigner adresini açın.
3. Sayfada “Yetkilendir: @hivesigner” ve “@hivesigner, @myapp hesabı adına gönderi paylaşabilecek, yorum yapabilecek, oy verebilecek ve takip edebilecek.” yazar. **Yetkilendir** düğmesini seçin. Bunun için uygulama hesabının aktif anahtarı gerekir.

Bunu bir kez yaparsınız. Bu olmadan her yayın `unauthorized_client` hatası ve “Broadcaster account doesn't have permission to broadcast for @myapp” iletisiyle başarısız olur. Yalnızca giriş yaptıran bir uygulamanın buna ihtiyacı yoktur.

Bu izin, @hivesigner'ın uygulama hesabınızın kendi adına da gönderi paylaşmasına izin verir; bu da uygulama hesabını yalnızca uygulama için kullanmanın bir başka nedenidir.

Bu izin yerindeyken Hivesigner üzerinden yayın yapan uygulamalar, https://hivesigner.com/apps adresindeki uygulama dizininde kaç kişinin onları kullandığına göre sıralanarak görünebilir.

## Bir şey yanlış olduğunda kullanıcılar ne görür {#refused-requests}

Hivesigner güvenle yanıtlayamayacağı bir isteği reddeder. Bir ileti ve bir **Bu sorunu bildir** düğmesi gösterir. İstek onaylanamaz. Geri çağırma adresinize hiçbir şey gönderilmez.

| Sorun | Kullanıcının okuduğu |
| --- | --- |
| `redirect_uri`, Yönlendirme URI'lerinizden biri değil | “Bu uygulamanın yönlendirme URL'si kayıtlı değil. Güvenliğiniz için giriş engellendi.” |
| `client_id` bir Hive hesabı değil | “@myapp bir Hive hesabı değil, bu yüzden yetkilendirilecek bir uygulama yok. Siteye geri dönüp tekrar deneyin.” |
| Hesap uygulama olarak işaretlenmemiş | “@myapp uygulama olarak ayarlanmadığı için sizi oturum açtıramaz. Siteye dönüp yeniden deneyin.” Yukarıda anlatıldığı gibi **Bu hesap bir uygulamadır** ayarını açın. |
| İstekte `redirect_uri` yok | “Bu yetkilendirme isteği eksik: bir uygulama veya yönlendirme URL'si belirtilmemiş. Uygulamaya geri dönüp tekrar deneyin.” |

Kullanıcılarınız bunlardan birini bildirirse, uygulamanızın gönderdiği `redirect_uri` değerini Yönlendirme URI'lerinizle karakter karakter karşılaştırın.

## Kontrol listesi {#checklist}

1. Uygulama için bir Hive hesabı, aktif anahtarıyla Hivesigner'a eklenmiş.
2. https://hivesigner.com/profile adresinde: “Bu hesap bir uygulamadır” açık, Yönlendirme URI'leri listelenmiş, kod akışını kullanıyorsanız bir istemci gizli anahtarı ayarlanmış.
3. API üzerinden yayın yapıyorsanız https://hivesigner.com/authorize/hivesigner adresinde @hivesigner yetkilendirilmiş.
4. Yönlendirme URI'lerinizden birini tam olarak gönderen bir giriş bağlantısı. Bkz. [OAuth2 ile giriş](/docs/oauth2).
