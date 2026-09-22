Aplikasi Anda dapat meminta seseorang menandatangani pesan teks dengan kunci posting atau active miliknya. Tanda tangan itu membuktikan bahwa orang tersebut menguasai akunnya. Tidak ada yang disiarkan: pesannya tidak pernah sampai ke rantai blok. Hivesigner menandatangani dengan cara yang sama seperti `requestSignBuffer` milik Hive Keychain, jadi kode server yang memeriksa tanda tangan Keychain juga memeriksa tanda tangan Hivesigner.

## Meminta tanda tangan {#request}

Kirim orang itu ke `https://hivesigner.com/sign-buffer` dengan parameter kueri berikut:

| Parameter | Wajib | Arti |
| --- | --- | --- |
| `message` | Ya | Teks persis yang akan ditandatangani. Isinya harus lebih dari sekadar spasi. |
| `redirect_uri` | Ya | Ke mana Hivesigner mengirim hasilnya. Lihat [Aturan callback](#callback-rules). |
| `authority` | Tidak | `posting` atau `active`, dengan huruf besar-kecil apa pun (`Posting` juga bisa). `posting` ketika tidak ada atau kosong. Nilai lain apa pun ditolak. |
| `client_id` | Tidak | Akun aplikasi Anda. `clientId` juga dibaca. Dengan itu, `redirect_uri` harus salah satu callback aplikasi Anda. |
| `state` | Tidak | Nilai apa pun. Hivesigner mengembalikannya tanpa perubahan. |
| `account` | Tidak | Akun yang Anda harapkan menandatangani. Hivesigner memilihnya ketika akun itu ada di perangkat dan mengabaikannya kalau tidak. `select_account` juga dibaca. |

Susun URL-nya dengan `URLSearchParams`, supaya tiap nilai tersandi:

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

### Aturan callback {#callback-rules}

- Callback harus `https://`. `http://` biasa hanya bekerja pada loopback: `localhost`, `127.0.0.1` atau `[::1]`.
- **Dengan `client_id`**, callback harus terdaftar pada akun aplikasi itu, dicocokkan seperti pada proses masuk. Lihat [Callback](/docs/register-app#callback-rules). Hivesigner membaca callback aplikasi dari Hive ketika permintaan itu dibuka dan tidak menandatangani apa pun sebelum membacanya. Ketika Hive tidak dapat dihubungi, orang itu mendapat tombol **Coba lagi**.
- **Tanpa `client_id`**, callback mana pun yang mengikuti aturan pertama sudah cukup. Hivesigner lalu menyebut host callback itu sebagai peminta, misalnya «HOST meminta Anda menandatangani sebuah pesan.».

Kirim `client_id` ketika Anda punya akun aplikasi. Orang itu lalu melihat nama dan akun aplikasi Anda. Hanya callback terdaftar Anda yang dapat menerima tanda tangannya.

Hivesigner menolak permintaan tanpa pesan, dengan `authority` yang tidak dikenal, dengan callback yang hilang atau tidak dapat dipakai, dengan `client_id` yang bukan akun Hive, atau dengan callback yang tidak terdaftar pada aplikasi itu. Orang itu melihat «Permintaan tanda tangan ini tidak dapat digunakan: diperlukan pesan, kunci posting atau active dan URL pengalihan aman yang terdaftar untuk aplikasi. Kembali ke situs dan coba lagi.» dan tombol **Laporkan masalah ini**.

### Yang dilihat orang itu {#what-the-user-sees}

- Judul yang menyebut aplikasi Anda (atau host callback) dan «Mengarahkan Anda ke HOST».
- Seluruh pesannya, persis seperti yang akan ditandatangani. Aksara yang dapat menyembunyikan teks atau mengubah arahnya ditampilkan sebagai kode seperti `\u{200B}`.
- «Akan ditandatangani dengan kunci posting Anda» atau «Akan ditandatangani dengan kunci active Anda».
- Sebuah peringatan: «Tanda tangan Anda membuktikan kepada siapa pun yang melihatnya bahwa @USERNAME menandatangani teks persis ini. Tanda tangani hanya pesan yang Anda pahami.»
- **Tanda tangani** dan **Batal**. Akun terkunci meminta kode sandinya lebih dulu.

[Permintaan penandatanganan pesan](/docs/signing#message-requests) menjelaskan layar ini untuk pengguna.

## Yang diterima callback Anda {#callback}

Ketika orang itu memilih **Tanda tangani**, Hivesigner mengirimnya ke callback Anda dengan parameter kueri berikut:

| Parameter | Nilai |
| --- | --- |
| `signature` | Tanda tangannya, sebagai untai heksadesimal 130 aksara |
| `public_key` | Kunci publik dari kunci yang menandatangani, misalnya `STM...` |
| `username` | Akun yang menandatangani |
| `authority` | `posting` atau `active` |
| `state` | `state` Anda, kapan pun permintaan itu punya satu (termasuk yang kosong) |

Hivesigner menambahkannya ke kueri callback Anda, sesudah `?` atau `&` dan sebelum `#fragment` mana pun. Kueri Anda sendiri tetap apa adanya.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Ketika orang itu memilih **Batal**, Hivesigner membuka daftar akunnya. Callback Anda tidak menerima apa pun.

> **Peringatan:** Siapa pun dapat membuka callback Anda dengan nilai karangan. Perlakukan tiap parameter sebagai klaim sampai server Anda memeriksa tanda tangannya.

## Memeriksa tanda tangan {#verify}

Periksa tanda tangannya di server Anda:

1. Simpan pesan yang Anda minta di server Anda, beserta `state` miliknya. Jangan memercayai salinan yang kembali dari peramban.
2. Hitung hash pesannya: sha256 atas bita UTF-8-nya.
3. Pulihkan kunci publik dari tanda tangan dan hash itu.
4. Muat akunnya dari Hive. Periksa bahwa kunci yang dipulihkan termasuk otoritas yang Anda minta, dengan bobot yang cukup untuk menandatangani sendirian.
5. Periksa bahwa `state` itu memang yang Anda terbitkan. Terima tiap pesan satu kali saja.

Contoh ini memakai dhive (https://www.npmjs.com/package/@hiveio/dhive):

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

Pemeriksaan yang sama berlaku untuk tanda tangan dari `requestSignBuffer` milik Hive Keychain. Bandingkan dengan kunci yang Anda pulihkan: `public_key` di callback hanyalah petunjuk.

## Pesan yang tidak ditandatangani Hivesigner {#refused-messages}

Pesan yang berupa objek JSON dengan kunci `signed_message` punya bentuk sebuah token Hivesigner. Menandatanganinya akan memberi si peminta akses ke akun orang itu. Hivesigner tidak pernah menandatangani pesan semacam itu. Ia memberi tahu orangnya «Pesan ini adalah token Hivesigner. Menandatanganinya akan memberi situs akses ke akun Anda, jadi pesan ini tidak dapat ditandatangani.»

Pakai teks biasa, atau JSON tanpa kunci `signed_message`. Sebutkan untuk apa tanda tangan itu dan tambahkan nilai yang Anda buat sekali saja, misalnya:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## Alat Tanda tangani pesan {#sign-message-tool}

Orang juga dapat menandatangani pesan sendiri di https://hivesigner.com/signmessage (**Tanda tangani pesan**) dan memeriksa pesan di https://hivesigner.com/verifymessage (**Verifikasi pesan**). Lihat [Menandatangani pesan sendiri](/docs/signing#sign-message).

Alat itu menandatangani dengan cara berbeda dari `/sign-buffer`. Ia menandatangani badan token Hivesigner yang memuat pesan, akun dan waktunya. Hasilnya dibagikan sebagai **Token verifikasi**. Periksa token semacam itu di halaman **Verifikasi pesan** atau seperti dijelaskan di [Memeriksa sendiri](/docs/tokens#check-it-yourself), bukan dengan kode di atas.
