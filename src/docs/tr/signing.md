Uygulamalar sizden bir Hive işlemini imzalamanızı isteyebilir: bir oy, bir transfer ya da bir gönderi gibi. Size Hivesigner'ı açan bir bağlantı gönderirler. Hivesigner, isteğin ne yaptığını, hangi anahtara ihtiyaç duyduğunu ve sonrasında sizi nereye göndereceğini sade bir dille gösterir. Siz onaylamadan hiçbir şey imzalanmaz. Uygulamalar ayrıca blok zincirine hiç ulaşmayan bir mesajı imzalamanızı da isteyebilir.

## İşlemi onayla ekranı {#confirm-screen}

Bir imza bağlantısı “İşlemi onayla” başlıklı bir ekran açar. İstekteki her operasyon için bir kart gösterir. Operasyon, Hive üzerindeki tek bir eylemdir: bir oy ya da bir transfer gibi.

Bir istek birden fazla operasyon taşıdığında kartlar numaralanır ve üstlerindeki satırda “Bu istek 3 operasyon içeriyor. Onaylamadan önce her birini inceleyin.” yazar.

### Özet {#summary}

Her kart, operasyonun ne yaptığını istekteki değerlerle birlikte anlatan bir cümleyle başlar. Örneğin:

| Operasyon | Kartta yazan |
| --- | --- |
| Bir transfer | @bob hesabına 1.000 HIVE gönder (ve altında not, Not: ... biçiminde) |
| Bir oy | Artı oy: @alice/gonderim (ve altında oy ağırlığı, örneğin 100%) |
| Bir gönderi veya yanıt | Gönderi yayınla: “Başlığım” ya da Yanıtla: @alice/gonderim |
| Bir Hive uygulamasının tanımladığı bir eylem | Özel eylem (follow) |
| Bir hesabı kimin denetlediğine dair değişiklik | Hesap yetkilerini güncelle |

Diğer operasyonlar adlarını gösterir: “Power Up” veya “Hive Power devri” gibi.

Cümlenin yanında, büyük harflerle yazılmış bir etiket operasyonun gerektirdiği anahtarı gösterir: GÖNDERİ, AKTİF veya SAHİP.

### Ayrıntılar {#details}

Cümlenin altında kart, operasyonun taşıdığı değerleri listeler:

- operasyonun adına işlem yaptığı hesap
- bir gönderi veya yorum için: kalıcı bağlantı (gönderinin adresi), topluluk ya da etiket, içerik ve meta veriler
- özel bir eylem için: verisinin her değeri, satır başına bir tane, hiçbir şey kesilmesin diye
- bir yetki değişikliği için: belirlediği eşik, anahtarlar ve hesaplar

Bir yetki değişikliği, anahtarlarınızı kaldıracaksa bunu “anahtarlar: YOK (anahtarınız kaldırılıyor)” ile bildirir. Eksik bir eşik “eşik AYARLANMAMIŞ (0 sayılır)” olarak görünür.

Özette ve ayrıntılarda, metni gizleyebilecek ya da yönünü değiştirebilecek karakterler `�` olarak gösterilir. Okuduğunuz şey başka bir şeymiş gibi görünemez.

**Ham operasyonu göster** (veya **Ham operasyonları göster**), imzalanacak operasyonların tam hâlini açar.

Bir tutar Hive Power cinsinden verildiğinde Hivesigner onu güncel orana göre çevirir. “Güncel Hive Power oranı yükleniyor…” yazar ve siz onaylayabilmeden önce bu oranı bekler.

Bazı istekler başka bir yerde hazırlanmış bir işlem taşır; örneğin birden çok kişinin yönettiği bir hesap için. Ekran o zaman “Bu istek kendi işlem başlığını gönderdi. Son geçerlilik: TARİH.” yazar. Başkaları daha önce imzaladıysa “Zaten 2 imza taşıyor.” eklenir.

## Hangi anahtara ihtiyaç duyar {#which-key}

Kartların altında tek bir satır, isteğin tamamının gerektirdiği anahtarı belirtir: “Gönderi anahtarınızla imzalanır”, “Aktif anahtarınızla imzalanır” veya “Sahip anahtarınızla imzalanır”.

Hivesigner tam olarak o anahtarla imzalar. Aktif anahtar bir oyu, sahip anahtarı bir transferi imzalayamaz. Bu, 2025'teki bir hard fork'tan beri geçerli bir Hive kuralıdır. Bkz. [Hangi anahtarı eklemeli](/docs/accounts#which-key).

Bir istekteki bütün operasyonlar aynı anahtarı gerektirmelidir. Gerektirmiyorlarsa satırda “Bu işlem birden fazla yetki türü gerektiriyor ve tek bir anahtarla imzalanamaz.” yazar. Onaylayacak bir düğme yoktur. Uygulamaya geri dönün.

Sahip anahtarı istekleri nadirdir. Hesabınızı kimin denetleyebileceğini ya da kurtarabileceğini değiştirirler. İki kez okuyun. Bkz. [Onaylamadan önce okuyun](/docs/safety#read-before-approving).

### Anahtar eksik olduğunda {#missing-key}

Seçili hesabın o anahtarı bu cihazda yoksa ekran bunu söyler. Örneğin: “Bunun için aktif anahtarınız gerekiyor, ancak burada @KULLANICI için bu anahtar kayıtlı değil.”

1. Mesajın altındaki **Başka bir hesap ekle**'yi seçin. **Hesap ekle** formunu açar.
2. Aynı kullanıcı adını ve eksik anahtarı girin. Hesabın erişim kodu varsa onu da girin.
3. **Hesap ekle**'yi seçin. Hivesigner anahtarı ekler ve sizi isteğe geri getirir.

Hesap kilitliyse ekran, düğmenin üstünde bir **Erişim kodu** alanı gösterir. Tek tıklama hesabın kilidini açar ve onaylar. Anahtarın gerçekten eksik olduğu ortaya çıkarsa ekran bunu kilit açıldıktan sonra söyler.

Bu tarayıcıda henüz hesap yoksa düğmede **Devam et** yazar ve **Hesap ekle** formunu açar.

## Onaylama veya imzalama {#approve}

Düğmenin üstündeki hesap satırında “İmzalayan hesap” ifadesiyle imzayı atan hesap yazar. **Hesap değiştir** başka bir hesap seçmenizi sağlar. Bkz. [Hesap değiştirme](/docs/accounts#switch-accounts).

- **Onayla**, işlemi tarayıcınızda imzalar ve Hive ağına gönderir. Sonuçta “İşlem ağa başarıyla yayınlandı” ve işlemi bir blok gezgininde açan bir **İşlem kimliği** görünür.
- İstek yalnızca bir imza istiyorsa onun yerine **İmzala** çıkar. Hivesigner işlemi ağa göndermeden imzalar. İmzayı uygulamaya teslim eder ya da istek hiçbir site belirtmiyorsa ekranda gösterir.

Ağ işlemi reddederse “İşleminiz ağa yayınlanmadı” ve ağın verdiği “Hata mesajı” görünür. Yeniden deneyebilirsiniz.

## Döneceğiniz site {#return-site}

İstek dönülecek bir site belirttiğinde üstteki bildirimde “Şu adrese yönlendirileceksiniz: HOST.” yazar. Onayladıktan sonra Hivesigner sizi oraya gönderir. HOST'un geldiğiniz site olduğunu doğrulayın.

İstek hiçbir site belirtmiyorsa Hivesigner sonuç ekranında kalır.

## Başka bir hesap için istek {#another-account}

Bir istek, seçili hesaptan farklı bir hesap için yapılmış olabilir. Hivesigner bunu iki şekilde gösterir.

**İsteğin başka bir hesapça imzalanması gerekir.** Ekranda “Bu istek @HESAP tarafından imzalanmalıdır. O hesaba geçin.” yazar. Hesap satırında “Seçili hesap” yazar ve altında hesap listesi açılır. O hesabı seçin ya da **Başka bir hesap ekle** ile ekleyin. Hivesigner isteği başka hiçbir hesapla imzalamaz.

**Bir operasyon başka bir hesap adına işlem yapıyor.** Bu, birden çok kişinin yönettiği hesaplarda olur. Üstteki uyarıda “Bu işlem @KULLANICI hesabı adına değil, @HESAP adına gerçekleştirilir. Yalnızca o hesabı da siz yönetiyorsanız devam edin.” yazar. Her kartın ayrıntıları, adına işlem yapılan hesabı belirtir.

## Hivesigner'ın okuyamadığı istekler {#invalid-requests}

Hivesigner, tam olarak okuyup size gösteremediği bir isteği asla imzalamaz. Buna tanımadığı bir operasyon, hiç operasyon içermeyen bir istek, operasyona uymayan bir değer (sayı olmayan bir sayı, bozuk biçimli bir tutar) ve gösteremediği fazladan veriler dahildir.

Ekran o zaman “Hay aksi, bir şeyler ters gitti. Sağlanan veriler geçersiz.” yazar. Uygulamaya geri dönün. Hivesigner ekibine bildirmek için **Bu sorunu bildir**'i seçin.

## Mesaj imzalama istekleri {#message-requests}

Bazı uygulamalar bir işlem yerine bir mesajı imzalamanızı ister; örneğin bir hesabın sizin olduğunu kanıtlamak için. Mesaj bir metindir. İmzalamak blok zincirinde hiçbir şeyi değiştirmez.

Ekran şunları gösterir:

- “UYGULAMA bir mesajı imzalamanızı istiyor.” gibi bir başlık. Uygulamanın bir Hive hesabı varsa alttaki satır onu belirtir: “Hive hesabı @UYGULAMA_HESABI”.
- “Yönlendirileceğiniz adres: HOST”: imzayı alan site. Aynı satır düğmenin yanında bir kez daha görünür.
- **Mesaj**: imzalanacağı hâliyle metnin tamamı. Metni gizleyebilecek ya da yönünü değiştirebilecek karakterler `\u{200B}` gibi vurgulanmış kodlar olarak gösterilir.
- Kullandığı anahtar: “Gönderi anahtarınızla imzalanır” veya “Aktif anahtarınızla imzalanır”. Hivesigner bir mesajı asla sahip anahtarıyla imzalamaz.
- Bir uyarı: “İmzanız, onu gören herkese @KULLANICI hesabının tam olarak bu metni imzaladığını kanıtlar. Yalnızca anladığınız bir mesajı imzalayın.”
- Hesap satırı: “İmzalayan hesap” ve **Hesap değiştir**.

İmzalamak için **İmzala**'yı seçin. Hivesigner sizi imzayla, kullanıcı adınızla, anahtar türüyle ve imzayı üreten genel anahtarla birlikte siteye geri gönderir. Genel anahtar, bir anahtar çiftinin paylaşılabilen yarısıdır: onunla hiçbir şey imzalanamaz.

**Hesaplar** sayfanıza gitmek için **İptal**'i seçin. Site hiçbir şey almaz.

Hesabın o anahtarı bu cihazda yoksa ekran bunu söyler. Örneğin: “Bunun için gönderi anahtarınız gerekiyor, ancak burada @KULLANICI için bu anahtar kayıtlı değil.” **Hesap değiştir**'i, ardından **Başka bir hesap ekle**'yi seçin. Aynı hesap için [eksik anahtarı ekleyin](/docs/accounts#add-a-key). Hivesigner sizi isteğe geri getirir.

### Bazı mesajlar neden reddedilir {#refused-messages}

**Hivesigner girişi olarak işleyen bir mesaj.** Bazı metinler tam olarak bir Hivesigner girişinin biçimindedir. Böyle bir metni imzalamak siteye hesabınıza erişim verirdi. Hivesigner böyle bir metni asla imzalamaz ve şunu yazar: “Bu mesaj bir Hivesigner token'ıdır. İmzalamak siteye hesabınıza erişim verir, bu yüzden imzalanamaz.”

**Hivesigner'ın kullanamayacağı bir istek.** Hivesigner, mesajı ya da geri dönüş adresi olmayan bir isteği reddeder. Gönderi ya da aktif dışında bir anahtar isteyen, Hive hesabı olmayan bir şeyi uygulama diye belirten veya geri dönüş adresi güvenli olmayan ya da uygulamaya kayıtlı olmayan istekleri de reddeder. Şunu yazar: “Bu imza isteği kullanılamaz: bir mesaj, bir gönderi veya aktif anahtar ve uygulama için kayıtlı güvenli bir yönlendirme URL'si gerekir. Siteye dönüp tekrar deneyin.”

Hivesigner uygulamanın bilgilerini Hive ağından okuyamazsa “Hesap bilgileri Hive ağından yüklenemedi.” yazar. Okuyana kadar hiçbir şey imzalamaz. **Tekrar dene**'yi seçin.

## Kendiniz bir mesaj imzalama {#sign-message}

Bir hesabı denetlediğinizi kanıtlamak için kendi başınıza bir mesaj imzalayabilirsiniz.

1. [hivesigner.com/signmessage](https://hivesigner.com/signmessage) adresini açın. Alt bilgi buraya **Mesaj imzala** bağlantısıyla götürür.
2. Seçili hesap kilitliyse erişim kodunu girip **Kilidi aç**'ı seçin. Seçili hesap yoksa sayfa hesaplarınıza bağlantı verir.
3. Metni **Mesaj** alanına yazın. Hivesigner baştaki ve sondaki boşlukları ve satır sonlarını kaldırır.
4. Anahtarı **İmza anahtarı** alanından seçin. Orada, seçili hesabın bu cihazdaki anahtarları en güçlüden başlayarak listelenir. Başlangıçta en güçlüsü seçilidir. Başka bir anahtara ihtiyacınız yoksa **Gönderi** olarak değiştirin.
5. **Mesajı imzala**'yı seçin.

**İmza özeti** bölümünde **Yazar**, **Kullanılan yetki**, bir **Doğrulama token'ı** ve bir **Doğrulama bağlantısı** görünür. Doğrulama token'ı; mesajı, kullanıcı adınızı ve imzayı tek bir metin parçasında toplar. Mesajı kontrol etmesi gereken kişiyle bağlantıyı ya da token'ı paylaşın.

Bir imza anahtarınızı açığa çıkarmaz. Ancak hangi anahtarla atıldığını gösterir.

## Bir mesajı doğrulama {#verify-message}

1. [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage) adresini açın. Alt bilgi buraya **Mesaj doğrula** bağlantısıyla götürür.
2. Token'ı **Doğrulama token'ı** alanına yapıştırın ve **İmzayı doğrula**'yı seçin.

Bir doğrulama bağlantısı bu sayfayı açar ve mesajı kendisi kontrol eder.

Sonuçta “İmza şu hesap için geçerli: KULLANICI” ya da “İmza, hesap anahtarlarıyla doğrulanamadı.” yazar. Altında **Yazar**, **İmzadan elde edilen genel anahtar**, **Eşleşen yetki** (imzayı atan anahtar türü) ve **Mesaj** görünür.

Hivesigner imzayı, hesabın Hive ağında şu anda sahip olduğu anahtarlarla karşılaştırır. Hesabın o zamandan beri değiştirdiği bir anahtarla imzalanmış bir mesaj artık doğrulanmaz.
