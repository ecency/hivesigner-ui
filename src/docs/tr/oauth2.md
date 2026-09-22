Kişileri uygulamanıza giriş yapmaları için Hivesigner'a gönderin. İsteğinizi orada inceleyip onaylarlar. Hivesigner sonra onları geri çağırma adresinize bir token ile (token akışı) ya da sunucunuzun token'larla takas edeceği bir kod ile (kod akışı) geri gönderir. Bu sayfa iki akışı, her parametreyi ve kapsamları anlatır.

## Başlamadan önce {#before-you-start}

- Uygulamanızı kaydedin: onun için bir Hive hesabı, geri çağırma adresleri listelenmiş olarak. Bkz. [Uygulamanızı kaydedin](/docs/register-app).
- API üzerinden yayın yapmak için uygulama hesabınızın ayrıca [@hivesigner'a gönderi yetkisi vermesi](/docs/register-app#grant-hivesigner) gerekir.
- Kod akışı için bir [istemci gizli anahtarı](/docs/register-app#client-secret) ayarlayın.

## Yetkilendirme adresi {#authorize-url}

Kullanıcıyı şu adrese gönderin:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Her değeri URL için kodlayın. `URLSearchParams` bunu sizin yerinize yapar:

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### Parametreler {#parameters}

| Parametre | Gerekli | Ne yapar |
| --- | --- | --- |
| `client_id` | Bir uygulama için evet | Uygulama hesabınızın adı. `clientId` de okunur. Bu olmadan istek, uygulama hesabı olmayan bir siteden gelen yalnızca giriş isteği olur: bkz. [Gönderi erişimi olmadan giriş](/docs/login-only). |
| `redirect_uri` | Evet | Hivesigner'ın kullanıcıyı geri gönderdiği yer. Uygulamanızın Yönlendirme URI'lerinden biriyle tam olarak aynı olmalıdır. Bkz. [Geri çağırma adresleri](/docs/register-app#callbacks). |
| `scope` | Hayır | `login`, `posting` ya da `offline`. Bkz. [Kapsamlar](#scopes). Bu olmadan istek gönderi erişimi ister. |
| `response_type` | Hayır | `code` değeri [kod akışını](#code-flow) başlatır. Başka bir değer ya da hiçbiri [token akışı](#token-flow) demektir. |
| `state` | Önerilir | Hivesigner'ın değiştirmeden geri döndürdüğü rastgele bir değer. Bkz. [İsteği state ile koruyun](#state). |
| `account` | Hayır | Bir Hive kullanıcı adı. O hesap kullanıcının cihazındaysa Hivesigner onu seçer. Değilse yok sayılır. `select_account` de okunur. |

Kullanıcı onay ekranında yine de başka bir hesaba geçebilir. Hesabı her zaman token'dan ya da kod takasından alın, hiçbir zaman istediğiniz şeyden değil.

## Kapsamlar {#scopes}

Hive'da tek bir gönderi yetkisi vardır. Bu yüzden Hivesigner'da iki erişim düzeyi bulunur, yalnızca giriş ve gönderi; ikisinin arasında daha ince bir ayrım yoktur.

| `scope` | Kullanıcının onayladığı | Akış | Erişim token'ının `type` değeri |
| --- | --- | --- | --- |
| `login` | “Hesabınızın kullanıcı adını görüntüleme”. Hiçbir yetki verilmez. | Token akışı (`response_type=code` eklemeyin) | `login` |
| `posting` | Gönderi erişimi. İlk seferde bu, uygulama hesabınızı kullanıcının gönderi yetkisine ekler. | Token akışı ya da `response_type=code` ile kod akışı | `posting` |
| `offline` | Yukarıdaki gibi gönderi erişimi | Kod akışı | Bir `refresh` token'ıyla birlikte `posting` |

Kod akışında geri çağırma adresi önce bir kod alır (`type` değeri `code` olan bir token) ve sunucunuz bunu erişim token'ıyla takas eder.

- **Kapsam yoksa** `posting` demektir.
- **İçinde herhangi bir yerde `offline` geçen bir değer** `offline` demektir, örneğin eski `offline,vote,comment` değeri.
- **Başka herhangi bir değer** `posting` demektir. Buna `vote`, `comment`, `vote,comment`, `comment_options` ya da `custom_json` gibi eski operasyon adları da dahildir. Bunlar token'ı sınırlamaz: her gönderi token'ı aynı operasyonlara izin verir. Bkz. [Yayın neyi kabul eder](/docs/api#broadcast-rules).

Uygulamanızın yalnızca kullanıcının kim olduğunu bilmesi gerekiyorsa `login` isteyin. Bkz. [Gönderi erişimi olmadan giriş](/docs/login-only).

## Token akışı {#token-flow}

Kullanıcının tarayıcısı erişim token'ını doğrudan alır. Uygulamanızın hiçbir gizli anahtara ihtiyacı yoktur.

1. Kullanıcıyı yetkilendirme adresine gönderin:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. Kullanıcı onaylar. Hivesigner geri çağırma adresinize yönlendirir:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner kendi parametrelerini, geri çağırma adresinizde sorgu yoksa `?` ile, varsa `&` ile ekler. `state` yalnızca boş olmayan bir değer gönderdiyseniz oradadır.

3. Geri çağırma adresinizde önce [`state` değerini karşılaştırın](#state). Sonra [token'ı denetleyin](/docs/tokens#check-a-token) ve bunu sunucunuzda yapın. Token'ın ait olduğu hesap token'ın içindedir: yalnızca `username` parametresine güvenmeyin, çünkü herkes bir URL'yi düzenleyebilir.
4. Token'ı sunucunuzda ya da httpOnly bir çerezde tutun. Token'ın adres çubuğundan çıkması için temiz bir adrese yönlendirin.
5. Token'ı, `expires_in` saniye (7 gün) sonra süresi dolana kadar [API](/docs/api) ile kullanın. Sonra kullanıcıyı yeniden yetkilendirme adresine gönderin. Gönderi erişimini zaten vermiş bir kullanıcı “APP uygulamasına giriş yap” ve “@myapp uygulamasını daha önce yetkilendirdiniz. Yeni bir izin verilmiyor.” yazılarını görür.

## Kod akışı {#code-flow}

Sunucunuz bir kod alır ve onu bir erişim token'ı ile bir yenileme token'ıyla takas eder. Sonrasında bunları kullanıcı olmadan yenileyebilir. Sunucunuz kullanıcılar adına uzun süre iş yapıyorsa bunu kullanın.

1. Kullanıcıyı `scope=offline` ile yetkilendirme adresine gönderin:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` aynı işi yapar.

2. Kullanıcı gönderi erişimini onaylar. Hivesigner geri çağırma adresinize yönlendirir:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [`state` değerini karşılaştırın](#state). Sonra kodu hemen, sunucunuzdan takas edin.

### Kodu takas edin {#exchange-code}

Kodu ve istemci gizli anahtarınızı bir POST isteğinin gövdesinde `/api/oauth2/token` adresine gönderin:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

Yanıt:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Aynı çağrı Node.js 18 ya da sonrasında:

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- Kodu ve gizli anahtarı isteğin gövdesine koyun, hiçbir zaman URL'ye koymayın.
- Bu istekle birlikte `Authorization` başlığı göndermeyin.
- Bu yanıttaki `username` değerini kullanın. O değer, kullanıcının imzaladığı koddan gelir.
- Erişim token'ını ve yenileme token'ını sunucunuzda tutun.

### Yenileme {#refresh}

Erişim token'ının süresi dolduğunda, yenileme token'ını istemci gizli anahtarınızla birlikte aynı uç noktaya gönderin:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

Yanıt aynı biçimdedir ve yeni bir erişim token'ı ile yeni bir yenileme token'ı taşır. İkisini de eskilerin yerine saklayın.

## İsteği state ile koruyun {#state}

`state` olmadan, başka bir site kullanıcınızı kendi seçtiği bir token ya da kodla geri çağırma adresinize gönderebilir. Uygulamanız da kullanıcıyı başka birinin hesabına giriş yaptırır. `state`, her geri dönüşü girişi başlatan tarayıcıya bağlar.

1. Her giriş için rastgele bir değer üretin, en az 16 rastgele bayt. Onaltılık yazım, kodlanması gereken karakterler içermemesini sağlar.
2. Onu yalnızca bu tarayıcının yeniden sunabileceği bir yerde saklayın: sunucu oturumunuzda ya da `SameSite=Lax` ayarlı, kısa ömürlü, httpOnly ve Secure bir çerezde.
3. Onu yetkilendirme adresinde `state` olarak gönderin.
4. Geri çağırma adresinizde `state` parametresini sakladığınız değerle karşılaştırın. Eksikse ya da farklıysa durun: token'ı da kodu da kullanmayın.
5. Saklanan değeri silin, böylece her biri yalnızca bir kez işe yarar.

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner aldığı `state` değerinin aynısını geri döndürür. Boş olanı ise yazmaz.

## Kullanıcı ne görür {#what-the-user-sees}

Onay ekranı uygulamanızın resmini ve adını, “Hive hesabı @myapp” ve “Yönlendirileceğiniz adres: HOST” yazılarını gösterir; HOST değeri geri çağırma adresinizden alınır. Sonra:

- **İlk gönderi isteği.** Başlıkta “APP hesabınıza erişim istiyor.” yazar. **Kapsam** kartı uygulamanızın yapabileceklerini listeler. Bir bildirimde “İlk yetkilendirme: Bu adım @myapp hesabını zincir üzerindeki gönderi yetkinize ekler ve bunun için bir kez aktif anahtarınız gerekir. Siz yetkiyi iptal edene kadar bu hesap sizin adınıza gönderi paylaşabilecek.” yazar. Düğmede **Yetkilendir** yazar. Kullanıcının cihazında o hesabın aktif anahtarı yoksa ekran onu orada ister.
- **Giriş.** `scope=login` için ya da kullanıcının daha önce verdiği gönderi erişimi için başlıkta “APP uygulamasına giriş yap”, düğmede **Giriş yap** yazar.
- **Hesap.** “Yetkilendiren hesap” ya da “Giriş yapan hesap” yazısının ardından seçili hesap gelir. Kullanıcı hesapları burada değiştirebilir.
- **Kilitli bir hesap.** Düğmenin üstünde bir erişim kodu alanı bulunur. Tek tıklama hesabın kilidini açar ve devam eder.
- **Cihazda hesap yok.** Düğmede **Devam et** yazar. Bu, hesap ekleme formunu açar ve isteğe geri döner.

İlk gönderi isteğinden sonra Hivesigner, yönlendirmeden önce yeni iznin zincir üzerinde görünmesini bekler. Bu birkaç saniye sürebilir. Ekranın tamamını kullanıcı tarafından görmek için bkz. [Uygulamalara giriş](/docs/signing-in).

## İptal ve reddedilen istekler {#cancel}

- **İptal.** Kullanıcı Hivesigner'daki hesap listesine gider. Geri çağırma adresinize hiçbir şey gönderilmez: bir hata parametresi de yoktur. Giriş düğmenizi erişilebilir tutun ki kullanıcı yeniden başlayabilsin. Bir geri dönüş beklemeyin.
- **Reddedilen istekler.** Kayıtlı olmayan bir geri çağırma adresi, bilinmeyen bir `client_id` ya da eksik bir `redirect_uri`, Hivesigner'da bir hata ve bir **Bu sorunu bildir** düğmesi gösterir. Geri çağırma adresinize hiçbir şey gönderilmez. Bkz. [Bir şey yanlış olduğunda kullanıcılar ne görür](/docs/register-app#refused-requests).

## Eski giriş isteği adresi {#legacy-login-request}

Hivesigner eski giriş adresini hâlâ kabul eder; bu, eski entegrasyonlar için korunmuştur. Yeni olanlar için `/oauth2/authorize` kullanın.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

Aynı onay ekranını, aynı geri çağırma denetimleriyle ve aynı yönlendirmeyle açar. Parametrelerini farklı okur:

- `scope` değeri `login` ya da `posting` olur. Başka bir değer ya da hiçbiri `login` demektir.
- `offline` okunmaz. Kod akışı için `response_type=code` ekleyin.
- `account` okunmaz.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` aynı kurallara uyar.
