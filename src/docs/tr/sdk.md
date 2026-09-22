Resmî JavaScript SDK'sı giriş adreslerini ve imza bağlantılarını sizin yerinize oluşturur ve Hivesigner API'sini çağırır. Python için topluluk kütüphaneleri vardır. Başka herhangi bir dil [REST API](/docs/api) uç noktalarını doğrudan çağırabilir.

## JavaScript SDK {#javascript}

SDK, `hivesigner` adlı npm paketidir. Kaynağı https://github.com/ecency/hivesigner-sdk adresindedir. TypeScript ile yazılmıştır ve türlerini birlikte getirir.

Sürüm 4, yerleşik `fetch` işlevini kullandığı için Node.js 18 ya da sonrasını gerektirir. Tarayıcılarda ES2017 ya da sonrasını gerektirir. Genel bir `fetch` olmayan yerlerde SDK'yı kullanmadan önce bir polyfill ekleyin. Daha eski bir Node.js üzerinde sürüm 3'te kalın.

### Kurulum {#install}

```bash
npm install hivesigner
```

Derleme adımı olmayan bir sayfa için tarayıcı paketini yükleyin. O, `hivesigner` adlı genel bir değişken tanımlar:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Bir istemci oluşturun {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Seçenek | Anlamı |
| --- | --- |
| `app` | Uygulama hesabınız, `client_id` olarak gönderilir. |
| `callbackURL` | Hivesigner'ın kullanıcıyı geri gönderdiği yer. Uygulamanızın geri çağırma adreslerinden biriyle karakteri karakterine aynı olmalıdır (düz http kullanan bir geri döngü adresi ana makine ve port bakımından farklı olabilir, bkz. [Geri çağırma adresleri](/docs/register-app#callback-rules)). |
| `scope` | Bir liste; virgüllerle birleştirilip `scope` parametresine konur. Bkz. [Kapsamlar](/docs/oauth2#scopes). |
| `responseType` | Kod akışı için `'code'`. Token akışında yazmayın. |
| `accessToken` | Kullanıcının erişim token'ı, elinizde zaten varsa. |
| `apiURL` | API'nin kaynağı. SDK sonuna `/api/` ekler. Varsayılanı `https://hivesigner.com` değeridir. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` ve `setApiURL` istemciyi sonradan değiştirir. Her biri istemciyi döndürür.

### Kullanıcıyı giriş yaptırın {#sign-in}

`getLoginURL(state, account)` giriş adresini döndürür:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` geri çağırma adresinize değişmeden döner. Yanıtı isteğe bağlamak için kullanın.
- `account` isteğe bağlıdır: bir kullanıcı adı. Hivesigner o hesap cihazdaysa onu seçer, değilse yok sayar.

Bir tarayıcıda `client.login({ state: 'STATE' })`, kullanıcıyı hesap belirtmeden aynı adrese gönderir.

Token akışında geri çağırma adresiniz `access_token`, `expires_in` ve `username` değerlerini alır. Token'ı istemciye verin:

```js
client.setAccessToken('ACCESS_TOKEN');
```

SDK'da kod akışının takası için bir yöntem yoktur. Sunucunuz kodu ve istemci gizli anahtarını API'ye kendisi gönderir; [Kodu takas edin](/docs/oauth2#exchange-code) bunu gösterir.

### Kullanıcıyı alın {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account`, zincirin döndürdüğü biçimde kullanıcının Hive hesabıdır. `scope`, token'ın neye izin verdiğini listeler.

### Yayınlayın {#broadcast}

`broadcast(operations)` operasyonları API'ye gönderir ve API onları kullanıcı adına yayınlar. API yalnızca token'ın kullanıcısının yazdığı gönderi operasyonlarını kabul eder: `vote`, `comment`, `delete_comment`, `comment_options`, gönderi yetkisiyle `custom_json`, `claim_reward_balance` ve profil verisi için `account_update2`. Bkz. [Yayın neyi kabul eder](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Kullanıcıyı her operasyonda adlandırın. API `__signer` değerini yerine koymaz.

Şu yardımcılar birer operasyon oluşturur ve `broadcast` işlevini çağırır:

| Yöntem | Ne yayınlar |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` değeri `-10000` ile `10000` (%100) arasındadır. |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Yeni bir gönderi için `parentAuthor` değeri `''` olur. `jsonMetadata` bir nesne olabilir: SDK onu dizeye çevirir. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. `requiredAuths` olarak `[]`, `requiredPostingAuths` olarak `['USERNAME']` gönderin. `json` bir dizedir. |
| `reblog(account, author, permlink)` | Gönderiyi yeniden paylaşan, id değeri `follow` olan bir `custom_json` |
| `follow(follower, following)` | id değeri `follow` ve `what: ['blog']` olan bir `custom_json` |
| `unfollow(unfollower, unfollowing)` | id değeri `follow` ve `what: []` olan bir `custom_json` |
| `ignore(follower, following)` | id değeri `follow` ve `what: ['ignore']` olan bir `custom_json` (sessize alma) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Tutarlar `'0.000 HIVE'`, `'0.000 HBD'` ve `'1.000000 VESTS'` gibi dizelerdir. |

`updateUserMetadata()` artık kullanılmıyor. Bir kullanıcının profilini değiştirmek için yeni bir `posting_json_metadata` ile `account_update2` yayınlayın.

### Çıkış yapın {#log-out}

`revokeToken()`, SDK'nın çıkış çağrısıdır. Token'ı API'nin iptal uç noktasına gönderir ve sonra onu istemciden kaldırır. Çağrı reddedildiğinde `removeAccessToken()` işlevini kendiniz çağırın. Token'ı uygulamanızın sakladığı yerden de silin.

Uygulamanızın erişimini tümüyle bitirmek için kullanıcı onu https://hivesigner.com/authorized-apps adresinden kaldırır. Bkz. [Bir uygulamanın erişimini görme ve kaldırma](/docs/signing-in#remove-access).

### İmza bağlantıları {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` ve `sendTransaction(tx, params)` bir `https://hivesigner.com/sign/...` bağlantısı döndürür. `params` değeri `callback`, `no_broadcast` ve `signer` alır. Bkz. [İmza bağlantıları](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

TypeScript içinde türler üçüncü argümanı zorunlu kılar: bağlantıyı geri almak için `undefined` gönderin.

Bir tarayıcıda, bağlantıyı bunun yerine yeni bir sekmede açmak için üçüncü argüman olarak bir işlev gönderin. O işlev çağrılmaz ve hiçbir şey döndürülmez. Onu bir tıklama işleyicisinden çağırın, yoksa tarayıcı yeni sekmeyi engelleyebilir ve çağrı hata verir.

### Promise'ler ve geri çağırmalar {#promises-and-callbacks}

`me`, `broadcast`, yardımcılar ve `revokeToken` bir promise döndürür. Bunun yerine geri çağırma kullanmak için son argüman olarak bir işlev gönderin. O işlev `(error, result)` alır.

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

API bir hatayla yanıt verdiğinde promise, API'nin hata gövdesiyle reddedilir: `{ error, error_description }`. Geri çağırma kullanıyorsanız o gövde `error` argümanıdır. Yanıt JSON değilse promise ayrıştırma hatasıyla reddedilir.

## Python {#python}

Şu kütüphaneler topluluktan gelir. Onları Hivesigner ekibi değil, yazarları sürdürür. Güvenmeden önce [REST API](/docs/api) ile karşılaştırın.

| Kütüphane | Yazar |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, `beem.hivesigner` modülü: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
