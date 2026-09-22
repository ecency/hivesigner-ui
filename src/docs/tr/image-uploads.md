Hive gönderileri görselleri adresleriyle gösterir, bu yüzden bir uygulamanın onları yükleyeceği bir yer gerekir. imagehoster, Hive için yazılmış açık kaynaklı bir görsel barındırma yazılımıdır. Uygulamanıza Hivesigner ile giriş yapmış kişilerden yükleme alabilir: erişim token'ları, anahtarla atılan bir imzanın yerini tutar.

## Nasıl çalışır {#how-it-works}

1. Kullanıcı uygulamanıza Hivesigner ile, gönderi erişimiyle giriş yapar. Uygulamanız bir erişim token'ı alır. Bkz. [OAuth2 ile giriş](/docs/oauth2).
2. Uygulamanız görseli, o token adreste olacak şekilde imagehoster'ınıza gönderir.
3. imagehoster token'ı ve hesabı denetler, görseli saklar ve adresiyle yanıt verir.
4. Uygulamanız adresi gönderiye koyar.

## Kendi imagehoster'ınızı çalıştırın {#run-your-own}

Bir imagehoster tek bir uygulama hesabı için ayarlanır: yapılandırmasının `[upload_limits]` bölümündeki `app_account`. Ona o uygulama hesabı için üretilmiş token'lar gönderin. Herkese açık örnekler başka uygulamalara aittir: images.ecency.com Ecency'nin uygulama hesabı, images.hive.blog ise Hive.blog'un hesabı için ayarlanmıştır. Kullanıcılarınızdan yükleme alabilmek için kendi örneğinizi kendi uygulama hesabınızla çalıştırın.

Kaynak kodu ve kurulum rehberleri:

- Hive topluluğunun imagehoster'ı: https://gitlab.syncad.com/hive/imagehoster
- Ecency'nin imagehoster'ı: https://github.com/ecency/imagehoster

Yapılandırmada uygulama hesabınızı ayarlayın:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

Aynı bölüm, bir hesabın yükleme yapması için gereken en düşük itibarı (`reputation`) ve her hesap için yükleme kotasını (`duration` milisaniyede `max` yükleme) ayarlar. Kotanın uygulanması için `redis_url` değerini yapılandırın. `max_image_size` ise en büyük dosyayı bayt olarak belirler.

## Bir görsel yükleyin {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Token.** Kullanıcının erişim token'ını, Hivesigner'ın uygulamanıza verdiği biçimde yola koyun. Uygulamanız için gönderi erişimiyle yapılmış bir girişten gelen token kullanın. `client_id` içermeyen bir istekten gelen, yalnızca giriş için üretilmiş bir token hiçbir uygulamayı adlandırmaz ve reddedilir.
- **Gövde.** Tek bir görsel dosyasıyla `multipart/form-data` gönderin. imagehoster, alan adı ne olursa olsun ilk dosyayı alır.
- **Boyut.** Bir `Content-Length` başlığı gönderin. Dosya, örneğin `max_image_size` değerinden büyük olmamalıdır.

Yanıt JSON'dur. Başarıda görselin adresini taşır:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

Başarısızlıkta imagehoster bir HTTP hata durumuyla yanıt verir. Çoğu başarısızlık ayrıca bir hata adı taşır:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Not:** Token adresin içinde yolculuk eder. imagehoster'ınızı yalnızca https üzerinden sunun ve erişim günlüklerini gizli tutun.

## Örnek {#example}

Bu tarayıcı işlevi, bir dosya alanından ya da bırakılan bir dosyadan yükleme yapar. Çok parçalı başlıkları ve uzunluğu tarayıcı sizin yerinize ayarlar: `Content-Type` başlığını kendiniz ayarlamayın.

```js
// IMAGEHOSTER_URL is the address of your imagehoster, such as 'https://YOUR_IMAGEHOSTER'.
async function uploadImage(file, accessToken) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${IMAGEHOSTER_URL}/hs/${accessToken}`, {
    method: 'POST',
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.name ?? `Upload failed with status ${response.status}`);
  }
  return result.url;
}

const url = await uploadImage(input.files[0], ACCESS_TOKEN);
const markdown = `![](${url})`; // add this to the post body
```
