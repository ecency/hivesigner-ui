Hivesigner API'si `https://hivesigner.com/api/` adresindedir. Giriş yapmış kullanıcının hesabını döndürür, onun adına gönderi operasyonlarını yayınlar, kodları token'larla takas eder ve Hivesigner kullanan uygulamaları listeler. Bu sayfa her uç noktayı istekleri, yanıtları ve hatalarıyla birlikte anlatır.

## İstekler ve kimlik doğrulama {#authentication}

- **Temel adres:** `https://hivesigner.com/api/`. Aşağıdaki her uç nokta `https://hivesigner.com` adresine görelidir.
- **Token:** onu `Authorization` başlığında olduğu gibi gönderin: `Authorization: ACCESS_TOKEN`. `Bearer ` öneki de kabul edilir. Onu sorgu dizesinde ya da gövdede `access_token` olarak da gönderebilirsiniz, ama başlık token'ı URL'lerin ve günlüklerin dışında tutar.
- **Gövdeler:** `Content-Type: application/json` ile JSON ya da form (`application/x-www-form-urlencoded`).
- **Yanıtlar:** JSON.
- **Tarayıcılar:** API çapraz kaynak isteklerine izin verir, bu yüzden bir web uygulaması onu doğrudan çağırabilir.

Bir token almak için bkz. [OAuth2 ile giriş](/docs/oauth2). Bir token'ın neler taşıdığı için bkz. [Token'lar](/docs/tokens).

## Hatalar {#errors}

Bir hata yanıtının bir HTTP hata durumu ve şu gövdesi olur:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Durum | `error` | Ne zaman |
| --- | --- | --- |
| 401 | `invalid_grant` | Token eksik ya da geçersiz, ya da bu uç nokta için yanlış türde (“The token has invalid role”). `/api/oauth2/token` üzerinde ayrıca “The code or secret is not valid”. |
| 401 | `invalid_scope` | `/api/broadcast`: token'ın izin vermediği bir operasyon. Açıklama operasyonları adlandırır. |
| 401 | `unauthorized_client` | `/api/broadcast`: token'ın kullanıcısının yazmadığı bir operasyon, anahtarlara dokunan bir `account_update2`, eksik bir gönderi yetkisi izni ya da yüklenemeyen bir hesap. Açıklama hangisi olduğunu söyler. |
| 500 | `server_error` | `/api/broadcast`: Hive ağı işlemi reddetti. `error_description` ağın iletisini taşır. |
| 503 | `unavailable` | `/api/apps`: dizin hâlâ oluşturuluyor. |

## GET /api/me {#me}

Token'ın ait olduğu hesabı döndürür. Kimin giriş yaptığını öğrenmek ya da bir [token'ı denetlemek](/docs/tokens#check-with-the-api) için kullanın.

- **Yöntemler:** `GET` ya da `POST`.
- **Token:** bir erişim token'ı, bir uygulamayı adlandıran `login` token'ı da dahil.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Kısaltılmış yanıt:

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| Alan | Anlamı |
| --- | --- |
| `user` | Token'ın ait olduğu Hive kullanıcı adı. `_id` ve `name` aynı değeri yineler. |
| `account` | Hive'ın `condenser_api.get_accounts` çağrısının döndürdüğü biçimde hesabın tamamı. |
| `scope` | Token'ın neye izin verdiği: giriş token'ı için `["login"]`, değilse `/api/broadcast` uç noktasının kabul ettiği operasyonlar. |
| `user_metadata` | Hesabın profil verisi, JSON'dan ayrıştırılmış olarak. |

`/api/me`, token'ın hangi uygulama için üretildiğini söylemez. Bunu denetlemek için token'ı çözün: bkz. [API'ye sorun](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Token'ın kullanıcısı için gönderi operasyonlarını @hivesigner gönderi anahtarıyla imzalar ve Hive ağına yayınlar.

- **Yöntem:** `POST`.
- **Token:** token akışından ya da kod akışından gelen bir `posting` erişim token'ı.
- **Çalışmadan önce gerekenler:** kullanıcı uygulama hesabınıza gönderi yetkisi vermiş olmalı (onay ekranı bunu yapar) ve uygulama hesabınız [@hivesigner'a gönderi yetkisi vermiş](/docs/register-app#grant-hivesigner) olmalıdır.
- **Gövde:** `{ "operations": [...] }`; burada her operasyon, Hive blok zincirindeki gibi `[name, fields]` biçimindedir. Bir istekteki bütün operasyonlar tek bir işleme girer.

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

Aynı istek curl ile:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Bir takip, `custom_json` operasyonudur:

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

Bir Hive düğümü işlemi kabul ettiğinde API yanıt verir. `result.id` işlem kimliğidir:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Ağ işlemi reddettiğinde yanıt `server_error` ile `500` olur. `error_description` ağın iletisini, `response` ise ham hatayı taşır.

### Yayın neyi kabul eder {#broadcast-rules}

Bir gönderi token'ı API'nin yalnızca şu operasyonları yayınlamasına izin verir, başkasına izin vermez. Her birinde token'ın kullanıcısı, gösterilen alandaki hesap olmalıdır:

| Operasyon | Token'ın kullanıcısı şu olmalı |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | `required_posting_auths` içindeki ilk hesap |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Başka bir operasyon** `invalid_scope` ile reddedilir. Bir `login` token'ı hiçbir operasyona izin vermez.
- **Başka bir hesap için bir operasyon** `unauthorized_client` ile reddedilir. Bir token yalnızca kendi kullanıcısı adına yayın yapar.
- **`account_update2`** yalnızca hesabın profil verisini değiştirebilir. `owner`, `active` ya da `posting` alanı taşıyan bir operasyon `unauthorized_client` ile reddedilir.
- **`custom_json`**: `required_auths` alanını boş bırakın. API gönderi yetkisiyle imzalar, bu yüzden aktif yetki gerektiren bir operasyon ağda başarısız olur.

Transferler ve diğer cüzdan operasyonları kullanıcının aktif anahtarını gerektirir. Bunları bunun yerine [imza bağlantısı](/docs/sign-links) olarak gönderin.

## POST /api/oauth2/token {#oauth2-token}

Bir kodu token'larla ya da bir yenileme token'ını yeni token'larla takas eder. Yalnızca sunucunuzdan çağırın. Bkz. [Kod akışı](/docs/oauth2#code-flow).

- **Yöntem:** `POST`, değerler gövdede.
- **Gövde:** `code` ve `client_secret` ya da `refresh_token` ve `client_secret`.
- **Başlıklar:** `Authorization` başlığı göndermeyin.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Her çağrı yeni bir erişim token'ı ve yeni bir yenileme token'ı döndürür. İkisini de @hivesigner imzalar. `expires_in`, erişim token'ının saniye cinsinden ömrüdür (7 gün).

Hatalar: `401 invalid_grant`. Gönderilen değer geçerli bir kod ya da yenileme token'ı değilse açıklama “The token has invalid role” olur. Kod ya da gizli anahtar eşleşmiyorsa “The code or secret is not valid” olur.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Hivesigner'a kullanıcının uygulamanızdan çıkış yaptığını bildirir. Token'ı uygulamanız kendisi atar.

- **Yöntem:** `POST`.
- **Token:** erişim token'ı, `Authorization` başlığında.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

JavaScript SDK'sının `revokeToken()` işlevi bu çağrıyı yapar ve sonra token'ı unutur. Uygulamanızın erişimini tümüyle kaldırmak için kullanıcı onu https://hivesigner.com/authorized-apps adresinden kaldırır. Bkz. [Çıkış yapma ve erişimi kaldırma](/docs/tokens#sign-out).

## GET /api/apps {#apps}

Herkese açık uygulama dizini: Hivesigner üzerinden yayın yapan uygulamalar, kaç kişinin onları kullandığına göre sıralanır. Token gerektirmez. https://hivesigner.com/apps aynı listeyi gösterir.

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| Alan | Anlamı |
| --- | --- |
| `updated_at` | Dizinin en son ne zaman oluşturulduğu. |
| `building` | İlk oluşturma veri taşıyana kadar `true`. `apps` o sırada boştur. |
| `window_days` | Sıralamanın kapsadığı gün sayısı. |
| `featured` | Önce gösterilen kullanıcı adları, o sırayla. |
| `apps[].username` | Uygulama hesabı. |
| `apps[].name`, `about` | Uygulama hesabının profilinden gelir ya da `null` olur. |
| `apps[].website` | Profildeki web sitesi, kendi alan adında yanıt veriyorsa. Değilse `null`. |
| `apps[].site` | Web sitesi denetiminin sonucu: `ok`, `no_website`, `invalid`, `redirected`, `blocked` ya da `unreachable`. `redirected` olan bir kaydın ayrıca `redirects_to` alanı olur. |
| `apps[].users` | Dönem boyunca toplanmış günlük ayrı kullanıcı sayısı. |
| `apps[].requests` | Dönem boyunca uygulama için yapılmış başarılı API istekleri. |
| `apps[].first_seen`, `last_seen` | Hivesigner'ın uygulamayı kaydettiği ilk gün ve kullanıldığı son gün ya da `null`. |
| `apps[].new` | Uygulama dönem içinde ilk kez göründüyse `true`. |

Yanıt 5 dakikaya kadar önbelleğe alınabilir. Dizin ilk kez oluşturulmadan önce API `unavailable` ile `503` yanıtı verir. Sonra yeniden deneyin.

Adları ve açıklamaları her uygulama hesabı kendisi yayımlar. Hivesigner bunları doğrulamaz.
