Bir Hivesigner token'ı, imzalanmış kısa bir ifadedir. Bir Hive hesabını, kendisi için üretildiği uygulamayı ve imzalanma zamanını adlandırır. Sunucunuz bir token'ı API ile ya da kendi başına denetleyebilir. Bu sayfa bir token'ın neler taşıdığını, ne kadar süre geçerli olduğunu ve denetlemenin iki yolunu gösterir.

## Bir token neye benzer {#format}

Token, base64url ile kodlanmış bir JSON nesnesidir; standart base64url'den tek farkı, doldurmanın `=` yerine `.` kullanmasıdır. Yani düz base64 ile karşılaştırıldığında `+` yerine `-`, `/` yerine `_` ve `=` yerine `.` gelir. Her token `eyJzaWduZWRfbWVzc2FnZSI6` ile başlar.

Çözüldüğünde, token akışından gelen bir erişim token'ı şöyle görünür:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Alan | Anlamı |
| --- | --- |
| `signed_message.type` | Token'ın türü: `login`, `posting`, `code` ya da `refresh`. Bkz. [Token türleri](#kinds). |
| `signed_message.app` | Token'ın kendisi için üretildiği uygulama hesabı. Uygulama hesabı olmayan bir site için üretilen giriş token'ında bu alan yoktur. |
| `authors[0]` | Token'ın ait olduğu Hive hesabı. |
| `timestamp` | İmzalanma zamanı, 1970-01-01 UTC'den bu yana saniye olarak. |
| `signatures[0]` | İmza, onaltılık bir dize olarak. |
| `authority` | Yalnızca tarayıcıda imzalanan token'larda bulunur: kullanıcının hangi anahtarının imzaladığı, `posting` ya da `active`. Bu alan imzalanan verinin dışındadır. Hangi anahtarın imzaladığını bilmek için anahtarı imzadan geri kazanın. |

İmza, `JSON.stringify({ signed_message, authors, timestamp })` değerinin sha256 özeti üzerinde alınmış bir secp256k1 imzasıdır ve anahtarlar bu sırada bulunur.

### Bir token'ı çözün {#decode}

Node.js içinde:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

Tarayıcıda:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Çözmek denetlemek değildir. Herkes bu biçime çözülen bir dize üretebilir. Güvenmeden önce [token'ı denetleyin](#check-a-token).

## Token türleri {#kinds}

| Token | `type` | `app` | İmzalayan | Nereden alırsınız |
| --- | --- | --- | --- | --- |
| Erişim token'ı, token akışı | `posting` | Sizin uygulamanız | Kullanıcının gönderi anahtarı ya da Hivesigner o hesap için gönderi anahtarı tutmuyorsa aktif anahtarı | Geri çağırma adresinizdeki `access_token` |
| Giriş token'ı, `scope=login` | `login` | Sizin uygulamanız | Kullanıcının gönderi ya da aktif anahtarı | Geri çağırma adresinizdeki `access_token` |
| Giriş token'ı, uygulama hesabı olmayan site | `login` | Yok | Kullanıcının gönderi ya da aktif anahtarı | Geri çağırma adresinizdeki `access_token` |
| Kod | `code` | Sizin uygulamanız | Kullanıcının gönderi ya da aktif anahtarı | Geri çağırma adresinizdeki `code` |
| Erişim token'ı, kod akışı | `posting` | Sizin uygulamanız | @hivesigner hesabının gönderi anahtarı | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Yenileme token'ı | `refresh` | Sizin uygulamanız | @hivesigner hesabının gönderi anahtarı | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Bir kod ve bir yenileme token'ı erişim token'ı değildir. İkisini de hiçbir zaman giriş olarak kabul etmeyin.

## Bir token ne kadar geçerlidir {#lifetime}

Bir erişim token'ı 7 gün geçerlidir: `expires_in` değeri 604800 saniyedir ve `timestamp` değerinden itibaren sayılır. Süresi dolduğunda:

- **Token akışı:** kullanıcıyı yeniden giriş yapmaya gönderin. Uygulamanızı zaten yetkilendirmiş bir kullanıcı “APP uygulamasına giriş yap” yazısını görür ve tek tıklama yeter.
- **Kod akışı:** sunucunuz, yenileme token'ı ve istemci gizli anahtarınızla yeni bir erişim token'ı alır. Bkz. [Yenileme](/docs/oauth2#refresh).

Bir token'ı, `timestamp` değeri 7 günden eskiyse süresi dolmuş sayın. Yönlendirmeden hemen sonra denetlediğiniz her şey için çok daha kısa bir yaş kabul edin. Bir kodu hemen takas edin. Bir giriş token'ını yalnızca `timestamp` değerinden sonraki birkaç dakika içinde kabul edin.

## Bir token'ı sunucunuzda denetleyin {#check-a-token}

Sunucunuz, bir tarayıcının ya da bir uygulamanın gönderdiği token'a güvenmeden önce şunları denetlesin:

- token'ı gerçekten hesabın ya da @hivesigner'ın imzaladığını;
- uygulamanız için üretildiğini;
- beklediğiniz türde olduğunu;
- yeterince yeni olduğunu.

### API'ye sorun {#check-with-the-api}

Token ile `/api/me` adresini çağırın. Geçerli bir token hesabı `user` alanında döndürür:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Geçersiz bir token `invalid_grant` ile `401` döndürür. Bkz. [GET /api/me](/docs/api#me).

`/api/me` imzayı doğrular. Yanıtı, token'ın hangi uygulama için üretildiğini söylemez. Bu yüzden token'ı ayrıca kendiniz çözün ve `app`, `type` ile yaşını denetleyin. Başka bir uygulama için üretilmiş bir token, sizinkine kimseyi giriş yaptırmamalıdır.

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

API yalnızca bir uygulamayı adlandıran token'ları kabul eder. Uygulama hesabı olmayan bir siteden gelen giriş token'ını [kendiniz](#check-it-yourself) denetleyin.

### Kendiniz denetleyin {#check-it-yourself}

1. Token'ı çözün.
2. `signed_message.type` değerinin beklediğiniz tür olduğunu denetleyin: erişim token'ı için `posting`, giriş token'ı için `login`.
3. `signed_message.app` değerinin uygulama hesabınız olduğunu denetleyin. Uygulama hesabı olmayan bir site için hiç olmadığını denetleyin.
4. `timestamp` değerinden yaşını denetleyin.
5. `JSON.stringify({ signed_message, authors, timestamp })` değerinin sha256 özetini hesaplayın.
6. Genel anahtarı `signatures[0]` ve bu özetten geri kazanın.
7. `authors[0]` hesabını Hive blok zincirinden şimdi okuyun, çünkü kullanıcılar anahtarlarını değiştirebilir. Geri kazanılan anahtar, hesabın güncel gönderi ya da aktif anahtarlarından biri olmalıdır. `/api/oauth2/token` adresinden gelen bir token'ı ise @hivesigner imzalar: bunlar için @hivesigner hesabının güncel bir gönderi anahtarını kabul edin.

Node.js içinde, `PrivateKey`, `PublicKey`, `Signature` ve `callRPC` işlevlerini `@ecency/sdk/hive` altında dışa aktaran [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk) ile:

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

Kullanımı şöyledir:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

dhive kütüphanesi (`@hiveio/dhive`) de çalışır: özeti `cryptoUtils.sha256(message)` ile hesaplayın ve anahtarı `Signature.fromString(signatures[0]).recover(digest).toString()` ile geri kazanın.

## Token'ları güvende tutun {#keep-tokens-safe}

Bir gönderi token'ını elinde tutan herkes, süresi dolana kadar uygulamanız üzerinden kullanıcı adına yayın yapabilir. Ona bir parola gibi davranın.

- **Token'ları sunucunuzda tutun** ya da httpOnly ve Secure bir çerezde saklayın. Yenileme token'larını ve istemci gizli anahtarınızı yalnızca sunucuda tutun.
- **Bir token'ı günlüğe yazdığınız bir URL'ye hiç koymayın.** Token akışı token'ı geri çağırma adresinizin sorgu dizesinde iletir. Onu sunucunuzda okuyun, sonra token içermeyen bir adrese yönlendirin. Geri çağırma adresinin sorgu dizesini günlüklerinizin dışında bırakın.
- **Geri çağırma sayfanızda başka sitelerden hiçbir şey yüklemeyin**, böylece token'ı taşıyan adres onlara gönderilmez. O sayfadaki bir `Referrer-Policy: no-referrer` başlığı yardımcı olur.
- **Bir token'ı yalnızca kendi sunucunuza ve `https://hivesigner.com/api/` adresine gönderin.**

## Çıkış yapma ve erişimi kaldırma {#sign-out}

- **Bir kullanıcıyı çıkış yaptırmak**, token'ı atmak demektir: onu oturumunuzdan ya da çerezinizden silin. Hivesigner'a kullanıcının çıkış yaptığını bildirmek için [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) adresini de çağırabilirsiniz. Uygulamanız yine de token'ı kendisi atar.
- **Uygulamanızın erişimini tümüyle kesmek** kullanıcının kararıdır. https://hivesigner.com/authorized-apps adresinde ya da `https://hivesigner.com/revoke/APP` adresinde uygulama hesabınızı zincir üzerindeki gönderi yetkisinden çıkarırlar. Bundan sonra API artık uygulamanız üzerinden onların adına yayın yapmaz.
