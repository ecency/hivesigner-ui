Bir imza bağlantısı, bir Hive işlemini Hivesigner'da açar. Kullanıcı işlemi inceler, kendi anahtarıyla onaylar ve Hivesigner onu tarayıcısından yayınlar. Hivesigner sonra kullanıcıyı işlem kimliğiyle birlikte uygulamanıza geri gönderebilir. İmza bağlantıları için uygulama hesabı da token da gerekmez. Bunlar Hivesigner'ın desteklediği 41 operasyonun tamamını kapsar, aktif anahtar gerektiren transferler ve diğer eylemler de dahil.

## Bir imza bağlantısı nasıl çalışır {#how-it-works}

1. Uygulamanız bir ya da daha çok operasyon taşıyan bir bağlantı oluşturur.
2. Kullanıcı bağlantıyı açar. Hivesigner her operasyonu “İşlemi onayla” ekranında sade sözcüklerle, gerektirdiği anahtarla birlikte gösterir.
3. Kullanıcı onaylar. Hivesigner işlemi tarayıcıda, Hivesigner'da seçili hesabın anahtarıyla imzalar. Sonra işlemi Hive ağına gönderir.
4. Bağlantı bir geri çağırma adresi belirtiyorsa Hivesigner kullanıcıyı işlem kimliğiyle oraya gönderir.

Uygulamanız hiçbir zaman bir anahtar görmez. Her site bir imza bağlantısı oluşturabilir: gönderilecek bir `client_id` yoktur.

## Bağlantı biçimleri {#link-forms}

Hivesigner iki tür imza bağlantısı okur: kodlanmış bağlantılar ve eski bağlantılar.

### Kodlanmış bağlantılar {#encoded-links}

Kodlanmış bir bağlantı operasyonları JSON olarak, base64url ile kodlanmış biçimde taşır. `hive-uri` paketinin `hive://sign/...` biçimini kullanır ve `hive://` yerine `https://hivesigner.com/` gelir.

| Biçim | `B64U` neyi taşır |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Tek bir operasyon: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Operasyon listesi: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Kendi başlığıyla birlikte bütün bir işlem |

`B64U`, JSON metninin UTF-8 olarak, sonra base64 olarak kodlanmış hâlidir; `+` yerine `-`, `/` yerine `_` ve `=` doldurması yerine `.` gelir.

`op` ve `ops` için Hivesigner işlemi operasyonların çevresinde kendisi oluşturur. Referans bloğunu ve son kullanma zamanını kendisi doldurur.

`tx` için Hivesigner işlemin kendi `ref_block_num`, `ref_block_prefix` ve `expiration` değerlerini korur. İşlemin halihazırda taşıdığı imzaları da korur. Bu, birkaç kişinin denetlediği bir hesap için birden çok hesabın tek bir işlemi sırayla imzalamasını sağlar. Hivesigner, `extensions` listesi boş olmayan bir işlemi reddeder.

> **Not:** Hivesigner imzalamadan önce bazı değerleri düzenler, örneğin tutarları ve varsayılan değerinde bırakılmış alanları. İmzalanan işlemin kimliği bu yüzden sizin oluşturduğunuzdan farklı olabilir. Kimliği geri çağırma adresinden okuyun.

### Eski bağlantılar {#legacy-links}

Eski bir bağlantı tek bir operasyonu yolda adlandırır ve alanlarını sorguya koyar:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Operasyon adını snake case (`transfer_to_vesting`), camel case (`transferToVesting`) ya da kebab case (`transfer-to-vesting`) yazın.
- Her alanı, alanın adını taşıyan bir sorgu parametresi olarak verin. Her değeri URL için kodlayın.
- Listeleri ve nesneleri JSON olarak yazın, örneğin `required_posting_auths=["alice"]`. Kimliklerden ya da adlardan oluşan bir liste virgülle de ayrılabilir: `proposal_ids=379,380`.
- Mantıksal değerleri `true` ya da `false` olarak yazın.

Eski bir bağlantı tek bir operasyon taşır. Birden fazlası için kodlanmış bağlantı kullanın.

### Alan değerleri {#field-values}

Şu kurallar her biçim için geçerlidir:

- **Varsayılanlar.** Yazmadığınız bir alan varsayılan değerini alır. İşlemi yapan hesap (`voter`, `from`, `owner` ve benzeri alanlar) varsayılan olarak imzalayan hesaptır. Bir oyun `weight` değeri varsayılan olarak `10000` (%100) olur.
- **Tutarlar** bir sayı ve bir simgeden oluşur: `1.000 HIVE`, `0.500 HBD` ya da `100.000000 VESTS`. Hivesigner HIVE ve HBD değerlerini 3, VESTS değerlerini 6 ondalıkla yazar.
- **Hive Power.** VESTS alan bir alan, `100 HP` gibi HP cinsinden bir tutarı da kabul eder. Hivesigner bunu, kullanıcı onaylayabilmeden önce güncel kura göre VESTS değerine çevirir.
- **`__signer`**, herhangi bir değerin içinde geçtiğinde imzalayan hesabın adına dönüşür. Örneğin bir takip `custom_json` operasyonu, kendi `json` alanının içinde takipçi olarak `__signer` değerini kullanabilir.
- **Tam sayılar**, zincirin kabul ettiği aralıkta tam sayı olmalıdır, örneğin bir oyun `weight` değeri için `-10000` ile `10000` arası.

Bir değer alanına uymadığında, bir operasyon bilinmediğinde ya da bağlantı hiçbir operasyon taşımadığında Hivesigner bağlantının tamamını reddeder. Kullanıcı “Hay aksi, bir şeyler ters gitti. Sağlanan veriler geçersiz.” iletisini görür ve hiçbir şey imzalanmaz.

## Parametreler {#parameters}

Şunları herhangi bir imza bağlantısının sorgu dizesine ekleyin:

| Parametre | Anlamı |
| --- | --- |
| `cb` | base64url ile kodlanmış geri çağırma adresi. `hive-uri` paketinin `callback` seçeneği için yazdığı değer budur. |
| `redirect_uri` | Düz URL kodlamasıyla yazılmış geri çağırma adresi. Eski bağlantılar bunu kullanır. Kodlanmış bir bağlantı ise `cb` yoksa bunu kullanır. |
| `nb` | Yalnızca imzala. Hivesigner işlemi yayınlamadan imzalar. İmzayı almak için geri çağırma adresinize `{{sig}}` koyun (bkz. [Geri çağırma yer tutucuları](#callback-placeholders)). Herhangi bir değer, boş bir değer bile (`nb=`) işe yarar. |
| `s` | İmzalaması gereken hesap. Başka bir hesap seçiliyse Hivesigner kullanıcıdan buna geçmesini ister. Başka hiçbir hesapla imzalamaz. |

`https://` bir geri çağırma adresi kullanın. Hivesigner, `http` ya da `https` adresi olmayan bir geri çağırma adresini yok sayar ve kendi sonuç ekranında kalır.

Hivesigner anahtarı operasyonlardan seçer. Anahtarı seçmek için bir parametre yoktur: Hivesigner imza bağlantılarında `authority` değerini (ve `hive-uri` paketinin `a` parametresini) yok sayar. Bkz. [Bir bağlantı hangi anahtarı gerektirir](#which-key).

### Geri çağırma yer tutucuları {#callback-placeholders}

Kullanıcı onayladıktan sonra Hivesigner geri çağırma adresindeki şu yer tutucuları doldurur:

| Yer tutucu | Değer |
| --- | --- |
| `{{id}}` | İşlem kimliği |
| `{{sig}}` | İmza, yalnızca imzalayan (`nb`) bir bağlantı için |
| `{{block}}` | Boş bırakılır |
| `{{txn}}` | Boş bırakılır |
| `{{data}}` | Boş bırakılır |

Bunların hiçbirini taşımayan bir geri çağırma adresine işlem kimliği `id` olarak, `?` ya da `&` sonrasına eklenir:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner, bir Hive düğümü işlemi kabul eder etmez yönlendirir. İşlem henüz bir blokta olmayabilir. Bloğa girdiğini bilmeniz gerektiğinde işlemi kimliğiyle arayın.

Ağ işlemi reddettiğinde (kullanıcı hatayı görür) ya da kullanıcı onaylamadan ayrıldığında geri çağırma adresiniz çağrılmaz.

## Bir bağlantı oluşturun {#build-a-link}

### hive-uri ile {#with-hive-uri}

`hive-uri` paketi (https://www.npmjs.com/package/hive-uri) operasyonları bağlantılara kodlar. Herhangi bir Unicode metni doğru kodlayan 0.2.8 ya da sonraki bir sürümü kullanın.

```bash
npm install hive-uri
```

```js
import { encodeOp, encodeOps } from 'hive-uri';

// One vote. __signer becomes the account that signs.
const vote = encodeOp(
  ['vote', { voter: '__signer', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
  { callback: 'https://YOUR_APP/voted?tx={{id}}' },
);

// Two transfers in one transaction.
const payout = encodeOps(
  [
    ['transfer', { from: '__signer', to: 'RECIPIENT_1', amount: '1.000 HIVE', memo: 'MEMO' }],
    ['transfer', { from: '__signer', to: 'RECIPIENT_2', amount: '2.000 HIVE', memo: 'MEMO' }],
  ],
  { callback: 'https://YOUR_APP/paid' },
);

const voteLink = vote.replace('hive://', 'https://hivesigner.com/');
const payoutLink = payout.replace('hive://', 'https://hivesigner.com/');
```

Seçenek nesnesi `callback` (`cb` olarak yazılır), `no_broadcast: true` (`nb` olarak yazılır) ve `signer` (`s` olarak yazılır) değerlerini alır. `encodeTx` aynı işi bütün bir işlem için yapar.

### JavaScript SDK ile {#with-the-sdk}

`hivesigner` paketinde `sendOperation`, `sendOperations` ve `sendTransaction` işlevleri bulunur. Bunlar `hive-uri` kodlayıcılarıyla aynı argümanları alır ve `https://hivesigner.com/sign/...` bağlantısını döndürür:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

TypeScript içinde türler üçüncü argümanı zorunlu kılar: bağlantıyı geri almak için `undefined` gönderin. Bir tarayıcıda, üçüncü argüman olarak gönderilen bir işlev, bağlantının döndürülmesi yerine yeni bir sekmede açılmasını sağlar. Bkz. [SDK'lar](/docs/sdk#sign-links).

### Kod yazmadan {#signs-page}

https://hivesigner.com/signs (“İşlem imzala”), desteklenen her operasyonu alanları için bir formla birlikte listeler. Bir `/sign/op/` bağlantısı oluşturur ve açar.

## Bir bağlantı hangi anahtarı gerektirir {#which-key}

Her operasyon tek bir anahtar gerektirir: gönderi, aktif ya da sahip. [Aşağıdaki tablo](#supported-operations) bunları listeler. Üç operasyon kendi değerlerine bağlıdır:

- `custom_json`, `required_auths` bir hesap adlandırdığında aktif anahtarı gerektirir. Değilse gönderi anahtarını gerektirir.
- `account_update`, `owner` değerini ayarladığında sahip anahtarını gerektirir. Değilse aktif anahtarı gerektirir.
- `account_update2`, `owner` değerini ayarladığında sahip anahtarını gerektirir. `active`, `posting`, `memo_key` ya da `json_metadata` değerini ayarladığında aktif anahtarı gerektirir. Yalnızca `posting_json_metadata` varsa gönderi anahtarını gerektirir.

Hivesigner bir bağlantıyı tek bir anahtarla imzalar, bu yüzden bir bağlantıdaki bütün operasyonlar aynı anahtarı gerektirmelidir. Hivesigner bunları karıştıran bir bağlantıyı imzalamayı reddeder ve kullanıcıya nedenini söyler. Böyle operasyonları ayrı bağlantılarla gönderin.

Seçili hesapta anahtar cihazda yoksa Hivesigner hangi anahtarın eksik olduğunu söyler ve eklemeyi önerir. Bkz. [Anahtar eksik olduğunda](/docs/signing#missing-key).

## Kullanıcı ne görür {#what-the-user-sees}

- “İşlemi onayla” başlıklı bir ekran ve her operasyon için bir kart: sade sözcüklerle bir özet, gerektirdiği anahtar ve taşıdığı değerler.
- Bağlantının bir geri çağırma adresi olduğunda “Şu adrese yönlendirileceksiniz: HOST.” yazısı. Kullanıcıların ana makineyi tanıması için kendi sitenizde bir geri çağırma adresi kullanın.
- Bir operasyon, imzalayan hesaptan başka bir hesap adına iş yaptığında bir uyarı.
- **Onayla** ya da yalnızca imzalayan bir bağlantı için **İmzala**. Kilitli bir hesap önce erişim kodunu ister.
- Yayından sonra işlem kimliğiyle birlikte “İşlem ağa başarıyla yayınlandı” yazısı. Sonra geri çağırma adresinize yönlendirme.

[İnceleme ve imzalama](/docs/signing#confirm-screen) bu ekranı kullanıcılar için anlatır.

## Desteklenen operasyonlar {#supported-operations}

Hivesigner şu 41 operasyonu zincirdeki adlarıyla imzalar. Başka her şey reddedilir. Ad, Hivesigner'ın onay ekranında gösterdiği addır.

| Operasyon | Anahtar | Ad |
| --- | --- | --- |
| `transfer` | Aktif | Aktarım |
| `recurrent_transfer` | Aktif | Tekrarlanan aktarım |
| `delegate_vesting_shares` | Aktif | Hive Power devri |
| `transfer_to_vesting` | Aktif | Power Up |
| `set_withdraw_vesting_route` | Aktif | Power Down rotası ayarlama |
| `withdraw_vesting` | Aktif | Power Down |
| `transfer_to_savings` | Aktif | Birikime aktarım |
| `transfer_from_savings` | Aktif | Birikimden aktarım |
| `cancel_transfer_from_savings` | Aktif | Birikimden aktarım iptali |
| `convert` | Aktif | HBD'den HIVE'a dönüştürme |
| `collateralized_convert` | Aktif | HIVE'dan HBD'ye dönüştürme |
| `account_witness_vote` | Aktif | Witness oyu |
| `witness_update` | Aktif | Witness güncellemesi |
| `witness_set_properties` | Aktif | Witness özelliklerini ayarlama |
| `account_witness_proxy` | Aktif | Yönetişim vekili |
| `claim_account` | Aktif | Hesap kredisi talep etme |
| `account_create` | Aktif | Hesap oluşturma |
| `create_claimed_account` | Aktif | Hesap kredisiyle hesap oluşturma |
| `vote` | Gönderi | Oy |
| `limit_order_create` | Aktif | Limit emri oluşturma |
| `limit_order_create2` | Aktif | Limit emri oluşturma |
| `limit_order_cancel` | Aktif | Limit emri iptali |
| `claim_reward_balance` | Gönderi | Ödülleri talep etme |
| `comment` | Gönderi | Gönderi veya yorum |
| `comment_options` | Gönderi | Gönderi veya yorum seçenekleri |
| `custom_json` | Gönderi, `required_auths` ayarlıysa Aktif | Özel operasyon |
| `delete_comment` | Gönderi | Yorum silme |
| `account_update` | Aktif, `owner` ayarlıysa Sahip | Hesap güncelleme (aktif) |
| `account_update2` | Alanına göre Gönderi, Aktif ya da Sahip | Hesap güncelleme (gönderi) |
| `change_recovery_account` | Sahip | Kurtarma hesabını değiştirme |
| `create_proposal` | Aktif | Teklif oluşturma |
| `remove_proposal` | Aktif | Teklif kaldırma |
| `update_proposal_votes` | Aktif | Teklif oylarını güncelleme |
| `update_proposal` | Aktif | Teklif güncelleme |
| `escrow_transfer` | Aktif | Emanet aktarımı |
| `escrow_approve` | Aktif | Emanet onayı |
| `escrow_dispute` | Aktif | Emanet ihtilafı |
| `escrow_release` | Aktif | Emanetin serbest bırakılması |
| `account_create_with_delegation` | Aktif | Hive Power devriyle hesap oluşturma |
| `request_account_recovery` | Aktif | Hesap kurtarma talebi |
| `recover_account` | Sahip | Hesap kurtarma |
