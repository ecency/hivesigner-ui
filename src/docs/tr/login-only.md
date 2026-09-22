Bazı uygulamaların yalnızca bir kişinin Hive üzerinde kim olduğunu bilmesi gerekir. Onun adına hiç gönderi paylaşmaz, oy vermez ya da bir şey yayınlamazlar. Hivesigner kişileri böyle bir uygulamaya hiçbir gönderi yetkisi olmadan giriş yaptırabilir. Kullanıcı bir Hive hesabını denetlediğini kanıtlar. Uygulamanız hesabın adını öğrenir. Bu sayfa bunun iki yolunu ve sonucu güvenle denetlemeyi anlatır.

## İki yol {#two-ways}

- **Uygulama hesabıyla:** uygulamanızın kendi Hive hesabı vardır ve `scope=login` ister. Token uygulamanızı adlandırır.
- **Uygulama hesabı olmadan:** kendi Hive hesabı olmayan bir site yalnızca bir `redirect_uri` gönderir. Token hiçbir uygulamayı adlandırmaz. Siteniz onu kendisi denetler.

Hiçbiri kullanıcıdan ya da uygulama hesabınızdan bir izin gerektirmez, bu yüzden kullanıcının hesabında hiçbir şey değişmez. Hivesigner girişi gönderi anahtarıyla imzalar; cihazda o hesabın gönderi anahtarı yoksa aktif anahtarla imzalar.

## Uygulama hesabıyla {#app-account}

1. [Uygulamanızı kaydedin](/docs/register-app): Hive hesabını oluşturun ve geri çağırma adreslerinizi listeleyin. İstemci gizli anahtarına da @hivesigner iznine de ihtiyacınız yoktur.
2. Kullanıcıyı şuraya gönderin:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. Kullanıcı, **Kapsam** bölümünde “Hesabınızın kullanıcı adını görüntüleme” yazan “APP uygulamasına giriş yap” ekranını görür. **Giriş yap** seçerler.
4. Hivesigner geri çağırma adresinize yönlendirir:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [`state` değerini karşılaştırın](/docs/oauth2#state), sonra token'ı denetleyin. Bu, uygulamanızı adlandıran bir `login` token'ıdır, bu yüzden şu ikisinden biri işe yarar:
   - onunla [`GET /api/me`](/docs/api#me) çağrısını yapın; yanıtta hesap `user` alanında, `scope` ise `["login"]` olarak gelir, sonra token'ı çözüp `type` ve `app` değerlerini denetleyin ([API'ye sorun](/docs/tokens#check-with-the-api));
   - ya da `type: 'login'` ve uygulamanızın adıyla [kendiniz denetleyin](/docs/tokens#check-it-yourself).

Bir `login` token'ı yayın yapamaz: `/api/broadcast` onunla gönderilen her operasyonu reddeder.

## Uygulama hesabı olmadan {#no-app-account}

1. Kullanıcıyı, `client_id` olmadan yalnızca bir `redirect_uri` taşıyan yetkilendirme adresine gönderin:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   Geri çağırma adresi `https://` olmalı ya da geri döngüde `http://` olmalıdır (`localhost`, `127.0.0.1`, `[::1]`). Onu kaydedeceğiniz bir liste yoktur. Hivesigner burada `scope` ve `response_type` değerlerini yok sayar: yanıt her zaman bir giriş token'ıdır.

2. Kullanıcı “HOST Hive kullanıcı adınızı doğrulamak istiyor.” yazısını görür; HOST, geri çağırma adresinizin ana makinesidir. **Giriş yap** seçerler.
3. Hivesigner geri çağırma adresinize yönlendirir:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [`state` değerini karşılaştırın](/docs/oauth2#state), sonra token'ı kendiniz denetleyin. API, hiçbir uygulamayı adlandırmayan bir token'ı kabul etmez, bu yüzden imzayı hesabın anahtarlarına karşı sunucunuz doğrular. Bkz. [Kendiniz denetleyin](/docs/tokens#check-it-yourself); `type: 'login'` ile ve `app` olmadan.

Geri çağırma adresi bir web adresi değilse ya da geri döngü dışında düz `http://` ise Hivesigner isteği reddeder ve kullanıcıya nedenini söyler.

## Hangisini kullanmalı {#which-one}

| | Uygulama hesabıyla | Uygulama hesabı olmadan |
| --- | --- | --- |
| Kullanıcının gördüğü | Uygulamanızın adı, resmi ve Hive hesabı | Yalnızca sitenizin ana makinesi |
| Kurulum | Geri çağırma adresleri listelenmiş bir Hive hesabı | Yok |
| Token'ın adlandırdığı | Sizin uygulamanız | Hiçbir uygulama |
| Token'ı denetleme | `/api/me` ya da kendi kodunuz | Kendi kodunuz |
| Sonradan gönderi erişimi | Aynı hesap: `posting` isteyin ve [@hivesigner'a izin verin](/docs/register-app#grant-hivesigner) | Önce bir uygulama hesabı gerekir |

Yapabiliyorsanız bir uygulama hesabı kullanın. Kullanıcılar uygulamanızın adını ve resmini görür. Sunucunuz başka bir uygulama için üretilmiş token'ları reddedebilir. Sonradan aynı hesapla gönderi erişimine geçebilirsiniz.

İkinci yolu, sitenizin bir Hive hesabı yoksa ve istemiyorsanız kullanın.

## Girişi güvenle denetleyin {#check-safely}

- **İsteği `state` ile bağlayın.** Her giriş için rastgele bir değer üretin, onu kullanıcının oturumunda saklayın, geri çağırma adresinizde karşılaştırın ve bir kez kullanın. Bkz. [İsteği state ile koruyun](/docs/oauth2#state).
- **Türü denetleyin.** Yalnızca `signed_message.type` değeri `login` olanı kabul edin. Bir kod ya da yenileme token'ı giriş değildir.
- **Uygulamayı denetleyin.** Uygulama hesabıyla `signed_message.app` sizin uygulamanız olmalıdır. Uygulama hesabı olmadan ise hiç `app` olmamalıdır.
- **Yaşı denetleyin.** Token'ı yönlendirmeden hemen sonra denetlersiniz, bu yüzden onu yalnızca `timestamp` değerinden sonraki birkaç dakika içinde kabul edin (örneğin bir dakikalık saat farkıyla 5 dakika).
- **Her token'ı bir kez kullanın.** Başarılı bir denetimden sonra kendi oturumunuzu başlatın (örneğin httpOnly bir çerezle) ve Hivesigner token'ını atın. Kabul ettiğiniz token'ları, yaş denetimini geçemeyecek kadar eskiyene dek kayıtta tutun. Yeniden gördüklerinizi reddedin.
- **Token'ı günlüklerin dışında tutun.** O, geri çağırma adresinizin sorgu dizesiyle gelir. Bkz. [Token'ları güvende tutun](/docs/tokens#keep-tokens-safe).

## Örnekler {#examples}

https://hivesearcher.com ve https://openhive.chat gibi siteler, arama ve sohbet gibi zincir dışında kalan özellikler için kişilerin Hive hesaplarıyla giriş yapmasına izin verir. Kişinin kim olduğunu bilmeleri yeter, fazlası gerekmez.
