Uygulamanız bir kullanıcıdan bir metni gönderi ya da aktif anahtarıyla imzalamasını isteyebilir. İmza, kullanıcının hesabı denetlediğini kanıtlar. Hiçbir şey yayınlanmaz: mesaj blok zincirine hiç ulaşmaz. Hivesigner, Hive Keychain'in `requestSignBuffer` işleviyle aynı şekilde imzalar, bu yüzden bir Keychain imzasını denetleyen sunucu kodu bir Hivesigner imzasını da denetler.

## Bir imza isteyin {#request}

Kullanıcıyı şu sorgu parametreleriyle `https://hivesigner.com/sign-buffer` adresine gönderin:

| Parametre | Gerekli | Anlamı |
| --- | --- | --- |
| `message` | Evet | İmzalanacak metnin tam kendisi. Boşluktan fazlasını taşımalıdır. |
| `redirect_uri` | Evet | Hivesigner'ın sonucu gönderdiği yer. Bkz. [Geri çağırma kuralları](#callback-rules). |
| `authority` | Hayır | `posting` ya da `active`, harf büyüklüğü fark etmez (`Posting` de olur). Yoksa ya da boşsa `posting`. Başka her değer reddedilir. |
| `client_id` | Hayır | Uygulama hesabınız. `clientId` de okunur. Bu varsa `redirect_uri`, uygulamanızın geri çağırma adreslerinden biri olmalıdır. |
| `state` | Hayır | Herhangi bir değer. Hivesigner onu değiştirmeden geri döndürür. |
| `account` | Hayır | İmzalamasını beklediğiniz hesap. Hivesigner o hesap cihazdaysa onu seçer, değilse yok sayar. `select_account` de okunur. |

Her değerin kodlanması için adresi `URLSearchParams` ile oluşturun:

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### Geri çağırma kuralları {#callback-rules}

- Geri çağırma adresi `https://` olmalıdır. Düz `http://` yalnızca geri döngüde çalışır: `localhost`, `127.0.0.1` ya da `[::1]`.
- **`client_id` varsa** geri çağırma adresi o uygulama hesabında kayıtlı olmalı ve girişteki gibi eşleştirilmelidir. Bkz. [Geri çağırma adresleri](/docs/register-app#callback-rules). Hivesigner uygulamanın geri çağırma adreslerini, istek açıldığında Hive'dan okur ve onları okuyana kadar hiçbir şey imzalamaz. Hive'a ulaşılamadığında kullanıcı bir **Tekrar dene** düğmesi görür.
- **`client_id` yoksa** ilk kurala uyan her geri çağırma adresi çalışır. Hivesigner bu durumda isteyen olarak geri çağırma adresinin ana makinesini adlandırır, örneğin “HOST bir mesajı imzalamanızı istiyor.”

Bir uygulama hesabınız varsa `client_id` gönderin. Kullanıcı o zaman uygulamanızın adını ve hesabını görür. İmzayı yalnızca kayıtlı geri çağırma adresleriniz alabilir.

Hivesigner; mesajı olmayan, `authority` değeri bilinmeyen, geri çağırma adresi eksik ya da kullanılamayan, `client_id` değeri bir Hive hesabı olmayan ya da geri çağırma adresi o uygulamada kayıtlı olmayan bir isteği reddeder. Kullanıcı “Bu imza isteği kullanılamaz: bir mesaj, bir gönderi veya aktif anahtar ve uygulama için kayıtlı güvenli bir yönlendirme URL'si gerekir. Siteye dönüp tekrar deneyin.” iletisini ve bir **Bu sorunu bildir** düğmesini görür.

### Kullanıcı ne görür {#what-the-user-sees}

- Uygulamanızı (ya da geri çağırma adresinin ana makinesini) adlandıran bir başlık ve “Yönlendirileceğiniz adres: HOST” yazısı.
- Mesajın tamamı, tam olarak imzalanacağı biçimde. Metni gizleyebilecek ya da yönünü değiştirebilecek karakterler `\u{200B}` gibi kodlar olarak gösterilir.
- “Gönderi anahtarınızla imzalanır” ya da “Aktif anahtarınızla imzalanır”.
- Bir uyarı: “İmzanız, onu gören herkese @USERNAME hesabının tam olarak bu metni imzaladığını kanıtlar. Yalnızca anladığınız bir mesajı imzalayın.”
- **İmzala** ve **İptal**. Kilitli bir hesap önce erişim kodunu ister.

[Mesaj imzalama istekleri](/docs/signing#message-requests) bu ekranı kullanıcılar için anlatır.

## Geri çağırma adresiniz ne alır {#callback}

Kullanıcı **İmzala** seçtiğinde Hivesigner onu şu sorgu parametreleriyle geri çağırma adresinize gönderir:

| Parametre | Değer |
| --- | --- |
| `signature` | İmza, 130 karakterlik onaltılık bir dize olarak |
| `public_key` | İmzalayan anahtarın genel anahtarı, örneğin `STM...` |
| `username` | İmzalayan hesap |
| `authority` | `posting` ya da `active` |
| `state` | İstekte bir `state` varsa sizin değeriniz (boş olan da dahil) |

Hivesigner bunları geri çağırma adresinizin sorgusuna, `?` ya da `&` sonrasına ve varsa `#fragment` öncesine ekler. Sizin kendi sorgunuz olduğu gibi kalır.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Kullanıcı **İptal** seçtiğinde Hivesigner onun hesap listesini açar. Geri çağırma adresiniz hiçbir şey almaz.

> **Uyarı:** Herkes geri çağırma adresinizi uydurma değerlerle açabilir. Sunucunuz imzayı denetleyene kadar her parametreyi bir iddia sayın.

## İmzayı doğrulayın {#verify}

İmzayı sunucunuzda denetleyin:

1. İstediğiniz mesajı `state` değeriyle birlikte sunucunuzda tutun. Tarayıcıdan geri gelen bir kopyaya güvenmeyin.
2. Mesajı özetleyin: UTF-8 baytları üzerinde sha256.
3. Genel anahtarı imzadan ve o özetten geri kazanın.
4. Hesabı Hive'dan yükleyin. Geri kazanılan anahtarın, istediğiniz yetkiye ait olduğunu ve tek başına imzalamaya yetecek ağırlıkta olduğunu denetleyin.
5. `state` değerinin sizin verdiğiniz değer olduğunu denetleyin. Her mesajı bir kez kabul edin.

Bu örnek dhive (https://www.npmjs.com/package/@hiveio/dhive) kullanır:

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

Aynı denetim Hive Keychain'in `requestSignBuffer` işlevinden gelen bir imza için de çalışır. Geri kazandığınız anahtarla karşılaştırın: geri çağırmadaki `public_key` yalnızca bir ipucudur.

## Hivesigner'ın imzalamadığı mesajlar {#refused-messages}

`signed_message` anahtarı taşıyan bir JSON nesnesi olan mesaj, bir Hivesigner token'ının biçimindedir. Onu imzalamak isteyene kullanıcının hesabına erişim verir. Hivesigner böyle bir mesajı hiçbir zaman imzalamaz. Kullanıcıya “Bu mesaj bir Hivesigner token'ıdır. İmzalamak siteye hesabınıza erişim verir, bu yüzden imzalanamaz.” der.

Düz metin ya da `signed_message` anahtarı olmayan JSON kullanın. İmzanın ne için olduğunu yazın ve bir kez ürettiğiniz bir değer ekleyin, örneğin:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## Mesaj imzalama aracı {#sign-message-tool}

Kişiler bir mesajı https://hivesigner.com/signmessage adresinde kendileri de imzalayabilir (**Mesaj imzala**) ve https://hivesigner.com/verifymessage adresinde birini denetleyebilir (**Mesaj doğrula**). Bkz. [Bir mesajı kendiniz imzalayın](/docs/signing#sign-message).

O araç `/sign-buffer` adresinden farklı imzalar. Mesajı, hesabı ve zamanı taşıyan bir Hivesigner token gövdesini imzalar. Sonucu bir **Doğrulama token'ı** olarak paylaşır. Böyle bir token'ı **Mesaj doğrula** sayfasında ya da [Kendiniz denetleyin](/docs/tokens#check-it-yourself) bölümünde anlatıldığı gibi denetleyin, yukarıdaki kodla değil.
