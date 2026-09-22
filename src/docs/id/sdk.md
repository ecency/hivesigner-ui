SDK JavaScript resmi menyusun URL masuk dan tautan tanda tangan serta memanggil API Hivesigner untuk Anda. Untuk Python ada pustaka dari komunitas. Bahasa lain mana pun dapat memanggil [REST API](/docs/api) langsung.

## SDK JavaScript {#javascript}

SDK-nya adalah paket npm `hivesigner`. Sumbernya ada di https://github.com/ecency/hivesigner-sdk. Ditulis dalam TypeScript dan membawa tipenya sendiri.

Versi 4 memerlukan Node.js 18 atau yang lebih baru, karena memakai `fetch` bawaan. Di peramban ia memerlukan ES2017 atau yang lebih baru. Di tempat yang tidak punya `fetch` global, tambahkan polyfill sebelum memakai SDK. Pada Node.js yang lebih lama, tetaplah di versi 3.

### Pemasangan {#install}

```bash
npm install hivesigner
```

Untuk halaman tanpa langkah build, muat bundel peramban. Bundel itu mendefinisikan `hivesigner` global:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Membuat klien {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Pilihan | Arti |
| --- | --- |
| `app` | Akun aplikasi Anda, dikirim sebagai `client_id`. |
| `callbackURL` | Ke mana Hivesigner mengembalikan orang itu. Harus salah satu callback aplikasi Anda, aksara demi aksara (callback loopback dengan http biasa boleh berbeda host dan portanya, lihat [Callback](/docs/register-app#callback-rules)). |
| `scope` | Sebuah daftar, disambung dengan koma ke dalam parameter `scope`. Lihat [Cakupan](/docs/oauth2#scopes). |
| `responseType` | `'code'` untuk alur kode. Hilangkan untuk alur token. |
| `accessToken` | Token akses orang itu, kalau Anda sudah punya. |
| `apiURL` | Asal API-nya. SDK menambahkan `/api/` padanya. Bawaannya `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` dan `setApiURL` mengubah klien di kemudian waktu. Masing-masing mengembalikan klien itu.

### Memasukkan orangnya {#sign-in}

`getLoginURL(state, account)` mengembalikan URL masuk:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` kembali ke callback Anda tanpa perubahan. Pakai itu untuk mengikat jawaban pada permintaan.
- `account` bersifat pilihan: sebuah nama pengguna. Hivesigner memilih akun itu ketika akun tersebut ada di perangkat dan mengabaikannya kalau tidak.

Di peramban, `client.login({ state: 'STATE' })` mengirim orang itu ke URL yang sama, tanpa akun.

Dalam alur token, callback Anda menerima `access_token`, `expires_in` dan `username`. Berikan tokennya kepada klien:

```js
client.setAccessToken('ACCESS_TOKEN');
```

SDK tidak punya metode untuk penukaran pada alur kode. Server Anda sendiri yang mengirim kode dan rahasia klien ke API, seperti ditunjukkan [Menukarkan kode](/docs/oauth2#exchange-code).

### Mengambil orangnya {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` adalah akun Hive orang itu seperti yang dikembalikan rantai. `scope` mendaftar apa saja yang diizinkan token itu.

### Menyiarkan {#broadcast}

`broadcast(operations)` mengirim operasi ke API, yang menyiarkannya untuk orang itu. API hanya menerima operasi posting yang penulisnya adalah orang pemilik token: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` dengan otoritas posting, `claim_reward_balance` dan `account_update2` untuk metadata profil. Lihat [Yang diterima broadcast](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Sebutkan orangnya di tiap operasi. API tidak mengganti `__signer`.

Metode pembantu berikut masing-masing menyusun satu operasi lalu memanggil `broadcast`:

| Metode | Menyiarkan |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` berkisar dari `-10000` sampai `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Untuk tulisan baru, `parentAuthor` bernilai `''`. `jsonMetadata` boleh berupa objek: SDK mengubahnya menjadi untai. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Berikan `[]` sebagai `requiredAuths` dan `['USERNAME']` sebagai `requiredPostingAuths`. `json` berupa untai. |
| `reblog(account, author, permlink)` | `custom_json` dengan id `follow`, yang membagikan ulang tulisan itu |
| `follow(follower, following)` | `custom_json` dengan id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` dengan id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` dengan id `follow`, `what: ['ignore']` (bisukan) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Jumlahnya berupa untai seperti `'0.000 HIVE'`, `'0.000 HBD'` dan `'1.000000 VESTS'`. |

`updateUserMetadata()` sudah usang. Untuk mengubah profil seseorang, siarkan `account_update2` dengan `posting_json_metadata` yang baru.

### Keluar {#log-out}

`revokeToken()` adalah panggilan keluar milik SDK. Ia mengirim token ke titik akhir pencabutan API lalu menghapusnya dari klien. Ketika panggilan itu gagal, panggil `removeAccessToken()` sendiri. Hapus juga tokennya di mana pun aplikasi Anda menyimpannya.

Untuk mengakhiri akses aplikasi Anda selamanya, orang itu mencabutnya di https://hivesigner.com/authorized-apps. Lihat [Melihat dan mencabut akses sebuah aplikasi](/docs/signing-in#remove-access).

### Tautan tanda tangan {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` dan `sendTransaction(tx, params)` mengembalikan tautan `https://hivesigner.com/sign/...`. `params` menerima `callback`, `no_broadcast` dan `signer`. Lihat [Tautan tanda tangan](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

Di TypeScript, tipenya mensyaratkan argumen ketiga: berikan `undefined` untuk mendapatkan tautannya.

Di peramban, berikan sebuah fungsi sebagai argumen ketiga untuk membuka tautan di tab baru. Fungsi itu tidak dipanggil dan tidak ada yang dikembalikan. Panggil dari penangan klik, kalau tidak peramban dapat menghalangi tab baru itu dan panggilannya melempar galat.

### Promise dan callback {#promises-and-callbacks}

`me`, `broadcast`, metode pembantu dan `revokeToken` mengembalikan sebuah promise. Berikan sebuah fungsi sebagai argumen terakhir untuk memakai callback sebagai gantinya. Fungsi itu menerima `(error, result)`.

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

Ketika API menjawab dengan galat, promise itu ditolak dengan badan galat milik API, `{ error, error_description }`. Dengan callback, badan itulah argumen `error`. Ketika jawabannya bukan JSON, penolakannya membawa galat penguraian.

## Python {#python}

Pustaka berikut berasal dari komunitas. Penulisnya yang merawatnya, bukan tim Hivesigner. Bandingkan dengan [REST API](/docs/api) sebelum Anda bersandar padanya.

| Pustaka | Penulis |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, modul `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
