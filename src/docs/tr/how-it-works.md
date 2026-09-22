Hivesigner, kişilerin Hive hesaplarını uygulamanızda kullanmasını sağlar ve bunu uygulamanıza anahtarlarını vermeden yapar. İki parçası vardır: https://hivesigner.com adresindeki tarayıcı imzalayıcısı ve `https://hivesigner.com/api/` adresindeki API. Bu sayfa her parçanın ne yaptığını ve bir uygulamanın bunları kullanmasının iki yolunu anlatır.

## Tarayıcı imzalayıcısı {#browser-signer}

Tarayıcı imzalayıcısı Hivesigner web sitesidir. Kişiler Hive hesaplarını oraya ekler. Anahtarları kendi tarayıcılarında kalır: Hivesigner hiçbir anahtarı hiçbir sunucuya göndermez. Uygulamanız hiçbirini görmez.

İmzalayıcı üç tür şeyi imzalar ve her birinde kullanıcı neyi imzaladığını önce görür:

- **Giriş token'ları.** Uygulamanız birini giriş yapması için Hivesigner'a gönderir. Hivesigner uygulamanızın adını ve istediği şeyi gösterir. Kullanıcı onayladığında Hivesigner, kendi hesabını ve uygulamanızı adlandıran kısa bir ifadeyi anahtarıyla imzalar. İmzalanan bu ifade, uygulamanızın aldığı token'dır. Bkz. [OAuth2 ile giriş](/docs/oauth2) ve [Token'lar](/docs/tokens).
- **İşlemler.** Bir imza bağlantısı, incelenmek üzere bir işlem açar. Kullanıcı onayladığında Hivesigner işlemi gereken anahtarla imzalar. Bağlantı yalnızca imzayı istemiyorsa işlemi tarayıcıdan Hive ağına gönderir. Bkz. [İmza bağlantıları](/docs/sign-links).
- **Mesajlar.** Uygulamanız bir kullanıcıdan, hesabı denetlediğini kanıtlamak için bir metni anahtarıyla imzalamasını isteyebilir. Bkz. [Mesaj imzalama](/docs/message-signing).

## API {#api}

API, uygulamanıza giriş yapmış bir kullanıcı adına gönderi yetkisindeki operasyonları yayınlar: gönderiler ve yorumlar, oylar, takipler ve diğer `custom_json` operasyonları, ödül talepleri ve profil güncellemeleri. Uygulamanız operasyonları kullanıcının token'ıyla birlikte gönderir. API token'ı denetler, işlemi @hivesigner hesabının gönderi anahtarıyla imzalar ve Hive ağına yayınlar.

API ayrıca giriş yapmış kullanıcının hesabını döndürür, kodları token'larla takas eder ve Hivesigner kullanan uygulamaları listeler. Bkz. [REST API](/docs/api).

## Gönderi yetkisi zinciri {#authority-chain}

Hive üzerinde bir hesap, başka bir hesabın kendi gönderi yetkisiyle işlem yapmasına izin verebilir. API bu izinlerin ikisine dayanır:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **Kullanıcı, uygulama hesabınızı kendi gönderi yetkisine ekler.** Onay ekranı bunu, kullanıcı uygulamanıza ilk kez gönderi erişimi verdiğinde yapar. Bunun için kullanıcının aktif anahtarı bir kez gerekir.
2. **Uygulama hesabınız @hivesigner'ı kendi gönderi yetkisine ekler.** Bunu bir kez, [uygulamanızı kaydederken](/docs/register-app#grant-hivesigner) yaparsınız.

API yayınlamadan önce her iki iznin de yerinde olduğunu denetler. Yalnızca token'ın adlandırdığı kullanıcının yazdığı operasyonları yayınlar.

Kullanıcı uygulamanızın erişimini istediği zaman https://hivesigner.com/authorized-apps adresinden kaldırabilir. Bundan sonra API artık uygulamanız üzerinden onun adına gönderi paylaşamaz.

## Entegrasyonun iki yolu {#two-ways-to-integrate}

### Giriş yapın, sonra API üzerinden yayınlayın {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

Kullanıcı bir kez onaylar. Bundan sonra uygulamanız, token'ın süresi dolana ya da kullanıcı uygulamanızın erişimini kaldırana kadar onun adına oy verebilir, yorum yapabilir ve gönderi paylaşabilir. Bunu günlük sosyal eylemler için kullanın.

Kayıtlı geri çağırma adresleri ve @hivesigner izni olan bir uygulama hesabına ihtiyacınız vardır. Bkz. [Uygulamanızı kaydedin](/docs/register-app). Yalnızca kullanıcının kim olduğunu öğrenmek istiyorsanız bkz. [Gönderi erişimi olmadan giriş](/docs/login-only).

### İmza bağlantıları {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

Kullanıcı her işlemi imzalanmadan önce görür. İmza bağlantıları 41 Hive operasyonunu kapsar, aktif anahtar gerektiren transferler ve diğer cüzdan eylemleri de buna dahildir. API bunları hiçbir zaman işlemez. İmza bağlantıları için bir uygulama hesabına ihtiyacınız yoktur. Bkz. [İmza bağlantıları](/docs/sign-links).

### Hangisini seçmeli {#which-to-choose}

- **Sık yapılan gönderi eylemleri** (oylar, yorumlar, takipler): OAuth2 ile giriş yapın, sonra API'yi kullanın.
- **Cüzdan eylemleri** ya da aktif anahtar gerektiren her şey: imza bağlantılarını kullanın.
- **Her ikisi**: birçok uygulama sosyal özellikler için kişileri OAuth2 ile giriş yaptırır ve transferler için imza bağlantılarını kullanır.
- **Yalnızca kullanıcının kimliği**: bkz. [Gönderi erişimi olmadan giriş](/docs/login-only).

## Kaynak kodu {#source-code}

Hivesigner açık kaynaklıdır:

- Tarayıcı imzalayıcısı: https://github.com/ecency/hivesigner-ui
- API: https://github.com/ecency/hivesigner-api
- JavaScript SDK (npm paketi `hivesigner`): https://github.com/ecency/hivesigner-sdk. Bkz. [SDK'lar](/docs/sdk).
