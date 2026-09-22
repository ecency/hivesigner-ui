Tautan tanda tangan membuka sebuah transaksi Hive di Hivesigner. Orang itu meninjaunya, menyetujuinya dengan kuncinya sendiri dan Hivesigner menyiarkannya dari perambannya. Setelah itu Hivesigner dapat mengembalikan orang itu ke aplikasi Anda dengan id transaksinya. Tautan tanda tangan tidak memerlukan akun aplikasi maupun token. Tautan ini mencakup semua 41 operasi yang didukung Hivesigner, termasuk transfer dan tindakan lain yang memerlukan kunci active.

## Cara kerja tautan tanda tangan {#how-it-works}

1. Aplikasi Anda menyusun tautan yang membawa satu atau beberapa operasi.
2. Orang itu membuka tautannya. Hivesigner menampilkan tiap operasi dengan kata-kata yang jelas di layar «Konfirmasi transaksi», beserta kunci yang diperlukannya.
3. Orang itu menyetujui. Hivesigner menandatangani transaksinya di peramban dengan kunci akun yang terpilih di Hivesigner. Lalu mengirim transaksinya ke jaringan Hive.
4. Ketika tautan itu menyebut sebuah callback, Hivesigner mengirim orang itu ke sana dengan id transaksinya.

Aplikasi Anda tidak pernah melihat satu kunci pun. Situs mana pun dapat membuat tautan tanda tangan: tidak ada `client_id` yang perlu dikirim.

## Bentuk tautan {#link-forms}

Hivesigner membaca dua macam tautan tanda tangan: tautan tersandi dan tautan lama.

### Tautan tersandi {#encoded-links}

Tautan tersandi membawa operasinya sebagai JSON, disandikan dalam base64url. Tautan ini memakai bentuk `hive://sign/...` milik paket `hive-uri`, dengan `hive://` diganti `https://hivesigner.com/`.

| Bentuk | Isi `B64U` |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Satu operasi: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Sebuah daftar operasi: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Satu transaksi utuh, dengan tajuknya sendiri |

`B64U` adalah teks JSON itu, disandikan sebagai UTF-8, lalu sebagai base64 dengan `+` diganti `-`, `/` diganti `_` dan pengganjal `=` diganti `.`.

Untuk `op` dan `ops`, Hivesigner menyusun transaksinya di sekitar operasi-operasi itu. Ia mengisi blok rujukan dan masa berlakunya.

Untuk `tx`, Hivesigner mempertahankan `ref_block_num`, `ref_block_prefix` dan `expiration` milik transaksi itu. Ia juga mempertahankan tanda tangan yang sudah dibawa transaksi tersebut. Dengan begitu beberapa akun dapat menandatangani satu transaksi secara bergiliran, untuk akun yang dikuasai beberapa orang. Hivesigner menolak transaksi yang daftar `extensions`-nya tidak kosong.

> **Catatan:** Hivesigner menyeragamkan sebagian nilai sebelum menandatangani, misalnya jumlah dan ruas yang dibiarkan pada nilai bawaannya. Transaksi yang ditandatangani lalu bisa punya id yang berbeda dari yang Anda susun. Bacalah id itu dari callback.

### Tautan lama {#legacy-links}

Tautan lama menyebut satu operasi di jalurnya dan menaruh ruas-ruasnya di kueri:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Tulis nama operasinya dalam snake case (`transfer_to_vesting`), camel case (`transferToVesting`) atau kebab case (`transfer-to-vesting`).
- Berikan tiap ruas sebagai parameter kueri dengan nama ruas itu. Sandikan tiap nilai untuk URL.
- Tulis daftar dan objek sebagai JSON, misalnya `required_posting_auths=["alice"]`. Daftar id atau nama juga boleh dipisah koma: `proposal_ids=379,380`.
- Tulis nilai boolean sebagai `true` atau `false`.

Tautan lama membawa satu operasi. Untuk lebih dari satu, pakai tautan tersandi.

### Nilai ruas {#field-values}

Aturan ini berlaku untuk tiap bentuk:

- **Nilai bawaan.** Ruas yang Anda hilangkan memakai nilai bawaannya. Akun yang bertindak (`voter`, `from`, `owner` dan ruas serupa) secara bawaan adalah akun yang menandatangani. `weight` sebuah vote secara bawaan bernilai `10000` (100%).
- **Jumlah** berupa angka dan lambang: `1.000 HIVE`, `0.500 HBD` atau `100.000000 VESTS`. Hivesigner menulis HIVE dan HBD dengan 3 angka desimal dan VESTS dengan 6.
- **Hive Power.** Ruas yang menerima VESTS juga menerima jumlah dalam HP, misalnya `100 HP`. Hivesigner mengubahnya menjadi VESTS pada kurs saat itu sebelum orangnya dapat menyetujui.
- **`__signer`** di nilai mana pun berubah menjadi nama akun yang menandatangani. Misalnya `custom_json` untuk mengikuti dapat menyebut `__signer` sebagai pengikut di dalam `json` miliknya.
- **Bilangan bulat** harus berupa bilangan bulat dalam rentang yang diterima rantai, misalnya `-10000` sampai `10000` untuk `weight` sebuah vote.

Hivesigner menolak seluruh tautan ketika sebuah nilai tidak cocok dengan ruasnya, ketika sebuah operasi tidak dikenal, atau ketika tautan itu tidak membawa operasi apa pun. Orang itu melihat «Ups, terjadi kesalahan. Data yang diberikan tidak valid.» dan tidak ada yang ditandatangani.

## Parameter {#parameters}

Tambahkan ini ke rangkaian kueri tautan tanda tangan mana pun:

| Parameter | Arti |
| --- | --- |
| `cb` | URL callback, disandikan dalam base64url. Inilah yang ditulis `hive-uri` untuk pilihan `callback` miliknya. |
| `redirect_uri` | URL callback sebagai teks biasa yang disandikan untuk URL. Tautan lama memakai yang ini. Tautan tersandi memakainya ketika tidak punya `cb`. |
| `nb` | Tanda tangan saja. Hivesigner menandatangani transaksinya tanpa menyiarkannya. Taruh `{{sig}}` di callback untuk menerima tanda tangannya (lihat [Penanda tempat pada callback](#callback-placeholders)). Nilai apa pun bisa, bahkan yang kosong (`nb=`). |
| `s` | Akun yang harus menandatangani. Ketika akun lain yang terpilih, Hivesigner meminta orang itu berpindah ke akun ini. Ia tidak menandatangani dengan akun lain mana pun. |

Pakai callback `https://`. Hivesigner mengabaikan callback yang bukan URL `http` atau `https` lalu tetap berada di layar hasilnya sendiri.

Hivesigner memilih kuncinya dari operasi-operasi itu. Tidak ada parameter untuk memilihnya: pada tautan tanda tangan Hivesigner mengabaikan `authority` (dan parameter `a` milik `hive-uri`). Lihat [Kunci apa yang diperlukan sebuah tautan](#which-key).

### Penanda tempat pada callback {#callback-placeholders}

Setelah orang itu menyetujui, Hivesigner mengisi penanda tempat berikut di callback:

| Penanda tempat | Nilai |
| --- | --- |
| `{{id}}` | Id transaksinya |
| `{{sig}}` | Tanda tangannya, untuk tautan tanda tangan saja (`nb`) |
| `{{block}}` | Dibiarkan kosong |
| `{{txn}}` | Dibiarkan kosong |
| `{{data}}` | Dibiarkan kosong |

Callback tanpa satu pun penanda tempat ini menerima id transaksi yang ditambahkan sebagai `id`, sesudah `?` atau `&`:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner mengalihkan begitu sebuah simpul Hive menerima transaksinya. Transaksi itu mungkin belum masuk ke sebuah blok. Carilah dengan id-nya ketika Anda perlu tahu bahwa transaksi itu sudah termasuk.

Callback Anda tidak dipanggil ketika jaringan menolak transaksinya (orang itu melihat galatnya) maupun ketika orang itu pergi tanpa menyetujui.

## Menyusun tautan {#build-a-link}

### Dengan hive-uri {#with-hive-uri}

Paket `hive-uri` (https://www.npmjs.com/package/hive-uri) menyandikan operasi menjadi tautan. Pakai versi 0.2.8 atau yang lebih baru, yang menyandikan teks Unicode apa pun dengan benar.

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

Objek pilihannya menerima `callback` (ditulis `cb`), `no_broadcast: true` (ditulis `nb`) dan `signer` (ditulis `s`). `encodeTx` melakukan hal yang sama untuk satu transaksi utuh.

### Dengan SDK JavaScript {#with-the-sdk}

Paket `hivesigner` punya `sendOperation`, `sendOperations` dan `sendTransaction`. Semuanya menerima argumen yang sama seperti penyandi `hive-uri` dan mengembalikan tautan `https://hivesigner.com/sign/...`:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

Di TypeScript, tipenya mensyaratkan argumen ketiga: berikan `undefined` untuk mendapatkan tautannya. Di peramban, fungsi yang diberikan sebagai argumen ketiga membuat semuanya membuka tautan di tab baru alih-alih mengembalikannya. Lihat [SDK](/docs/sdk#sign-links).

### Tanpa kode {#signs-page}

https://hivesigner.com/signs («Tanda tangani transaksi») mendaftar tiap operasi yang didukung beserta formulir untuk ruas-ruasnya. Halaman itu menyusun tautan `/sign/op/` lalu membukanya.

## Kunci apa yang diperlukan sebuah tautan {#which-key}

Tiap operasi memerlukan satu kunci: posting, active atau owner. [Tabel di bawah](#supported-operations) mendaftarnya. Tiga operasi bergantung pada nilainya:

- `custom_json` memerlukan kunci active ketika `required_auths` menyebut sebuah akun. Kalau tidak, ia memerlukan kunci posting.
- `account_update` memerlukan kunci owner ketika ia menetapkan `owner`. Kalau tidak, ia memerlukan kunci active.
- `account_update2` memerlukan kunci owner ketika ia menetapkan `owner`. Ia memerlukan kunci active ketika menetapkan `active`, `posting`, `memo_key` atau `json_metadata`. Dengan `posting_json_metadata` saja, ia memerlukan kunci posting.

Hivesigner menandatangani satu tautan dengan satu kunci saja, jadi semua operasi dalam satu tautan harus memerlukan kunci yang sama. Hivesigner menolak menandatangani tautan yang mencampurnya dan menjelaskan alasannya kepada orang itu. Kirim operasi semacam itu dalam tautan terpisah.

Ketika akun yang terpilih tidak punya kunci itu di perangkatnya, Hivesigner menyebut kunci mana yang kurang dan menawarkan untuk menambahkannya. Lihat [Ketika kuncinya tidak ada](/docs/signing#missing-key).

## Yang dilihat orang itu {#what-the-user-sees}

- Layar berjudul «Konfirmasi transaksi», dengan satu kartu untuk tiap operasi: ringkasan dengan kata-kata yang jelas, kunci yang diperlukannya dan nilai-nilai yang dibawanya.
- «Anda akan dialihkan ke HOST.» ketika tautan itu punya callback. Pakai callback di situs Anda sendiri, supaya orang mengenali host-nya.
- Sebuah peringatan ketika sebuah operasi bertindak sebagai akun lain selain akun yang menandatangani.
- **Setujui**, atau **Tanda tangani** untuk tautan tanda tangan saja. Akun terkunci meminta kode sandinya lebih dulu.
- Setelah penyiaran, «Transaksi berhasil disiarkan» beserta id transaksinya. Lalu pengalihan ke callback Anda.

[Tinjau dan tanda tangani](/docs/signing#confirm-screen) menjelaskan layar ini untuk pengguna.

## Operasi yang didukung {#supported-operations}

Hivesigner menandatangani 41 operasi ini, dengan nama-namanya di rantai. Selain itu ditolak. Namanya adalah yang ditampilkan Hivesigner di layar konfirmasi.

| Operasi | Kunci | Nama |
| --- | --- | --- |
| `transfer` | Active | Transfer |
| `recurrent_transfer` | Active | Transfer berulang |
| `delegate_vesting_shares` | Active | Delegasikan Hive Power |
| `transfer_to_vesting` | Active | Power Up |
| `set_withdraw_vesting_route` | Active | Atur rute Power Down |
| `withdraw_vesting` | Active | Power Down |
| `transfer_to_savings` | Active | Transfer ke tabungan |
| `transfer_from_savings` | Active | Transfer dari tabungan |
| `cancel_transfer_from_savings` | Active | Batalkan transfer dari tabungan |
| `convert` | Active | Konversi HBD ke HIVE |
| `collateralized_convert` | Active | Konversi HIVE ke HBD |
| `account_witness_vote` | Active | Vote witness |
| `witness_update` | Active | Pembaruan witness |
| `witness_set_properties` | Active | Atur properti witness |
| `account_witness_proxy` | Active | Proxy tata kelola |
| `claim_account` | Active | Klaim akun |
| `account_create` | Active | Buat akun |
| `create_claimed_account` | Active | Buat akun dengan kredit akun |
| `vote` | Posting | Vote |
| `limit_order_create` | Active | Buat order limit |
| `limit_order_create2` | Active | Buat order limit |
| `limit_order_cancel` | Active | Batalkan order limit |
| `claim_reward_balance` | Posting | Klaim imbalan |
| `comment` | Posting | Postingan atau komentar |
| `comment_options` | Posting | Opsi postingan atau komentar |
| `custom_json` | Posting, atau Active ketika `required_auths` diisi | Operasi kustom |
| `delete_comment` | Posting | Hapus komentar |
| `account_update` | Active, atau Owner ketika `owner` diisi | Perbarui akun (active) |
| `account_update2` | Posting, Active atau Owner, menurut ruasnya | Perbarui akun (posting) |
| `change_recovery_account` | Owner | Ubah akun pemulihan |
| `create_proposal` | Active | Buat proposal |
| `remove_proposal` | Active | Hapus proposal |
| `update_proposal_votes` | Active | Perbarui vote proposal |
| `update_proposal` | Active | Perbarui proposal |
| `escrow_transfer` | Active | Transfer escrow |
| `escrow_approve` | Active | Persetujuan escrow |
| `escrow_dispute` | Active | Sengketa escrow |
| `escrow_release` | Active | Pelepasan escrow |
| `account_create_with_delegation` | Active | Buat akun dengan delegasi |
| `request_account_recovery` | Active | Minta pemulihan akun |
| `recover_account` | Owner | Pulihkan akun |
