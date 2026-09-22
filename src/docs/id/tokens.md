Token Hivesigner adalah pernyataan singkat yang ditandatangani. Token itu menyebut sebuah akun Hive, aplikasi tempat token itu dibuat dan waktu penandatanganannya. Server Anda dapat memeriksa token lewat API atau sendiri. Halaman ini menunjukkan isi sebuah token, berapa lama token berlaku dan kedua cara memeriksanya.

## Seperti apa token itu {#format}

Token adalah objek JSON yang disandikan dalam base64url, dengan satu perbedaan dari base64url baku: pengganjalnya memakai `.` alih-alih `=`. Jadi dibandingkan base64 biasa, `+` menjadi `-`, `/` menjadi `_` dan `=` menjadi `.`. Tiap token dimulai dengan `eyJzaWduZWRfbWVzc2FnZSI6`.

Setelah didekode, token akses dari alur token tampak seperti ini:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Ruas | Arti |
| --- | --- |
| `signed_message.type` | Token ini apa: `login`, `posting`, `code` atau `refresh`. Lihat [Macam-macam token](#kinds). |
| `signed_message.app` | Akun aplikasi tempat token itu dibuat. Token masuk untuk situs tanpa akun aplikasi tidak punya ini. |
| `authors[0]` | Akun Hive yang menjadi pemilik token. |
| `timestamp` | Kapan ditandatangani, dalam detik sejak 1970-01-01 UTC. |
| `signatures[0]` | Tanda tangannya, sebagai untai heksadesimal. |
| `authority` | Hanya pada token yang ditandatangani di peramban: kunci mana milik orang itu yang menandatangani, `posting` atau `active`. Ruas ini berada di luar data yang ditandatangani. Untuk tahu kunci mana yang menandatangani, pulihkan dari tanda tangannya. |

Tanda tangannya adalah tanda tangan secp256k1 atas hash sha256 dari `JSON.stringify({ signed_message, authors, timestamp })`, dengan kunci-kunci dalam urutan itu.

### Mendekode token {#decode}

Di Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

Di peramban:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Mendekode bukan memeriksa. Siapa pun dapat menyusun untai yang terdekode menjadi bentuk ini. [Periksa token](#check-a-token) sebelum Anda memercayainya.

## Macam-macam token {#kinds}

| Token | `type` | `app` | Ditandatangani oleh | Dari mana Anda mendapatkannya |
| --- | --- | --- | --- | --- |
| Token akses, alur token | `posting` | Aplikasi Anda | Kunci posting orang itu, atau kunci active-nya ketika Hivesigner tidak punya kunci posting untuk akun itu | `access_token` di callback Anda |
| Token masuk, `scope=login` | `login` | Aplikasi Anda | Kunci posting atau active orang itu | `access_token` di callback Anda |
| Token masuk, situs tanpa akun aplikasi | `login` | Tidak ada | Kunci posting atau active orang itu | `access_token` di callback Anda |
| Kode | `code` | Aplikasi Anda | Kunci posting atau active orang itu | `code` di callback Anda |
| Token akses, alur kode | `posting` | Aplikasi Anda | Kunci posting @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Token penyegaran | `refresh` | Aplikasi Anda | Kunci posting @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Kode dan token penyegaran bukanlah token akses. Jangan pernah menerima salah satunya sebagai proses masuk.

## Berapa lama token berlaku {#lifetime}

Token akses berlaku 7 hari: `expires_in` bernilai 604800 detik, dihitung dari `timestamp` miliknya. Setelah kedaluwarsa:

- **Alur token:** kirim orang itu untuk masuk lagi. Orang yang sudah mengotorisasi aplikasi Anda melihat «Masuk ke APP» dan cukup satu klik.
- **Alur kode:** server Anda mendapat token akses baru dengan token penyegaran dan rahasia klien Anda. Lihat [Penyegaran](/docs/oauth2#refresh).

Anggap sebuah token kedaluwarsa begitu `timestamp` miliknya lebih tua dari 7 hari. Terimalah usia yang jauh lebih pendek untuk apa pun yang Anda periksa tepat setelah pengalihan. Tukarkan kode segera. Terima token masuk hanya dalam beberapa menit sejak `timestamp` miliknya.

## Memeriksa token di server Anda {#check-a-token}

Sebelum server Anda memercayai token yang dikirim sebuah peramban atau aplikasi, periksa bahwa:

- akun itu atau @hivesigner benar-benar menandatanganinya;
- token itu dibuat untuk aplikasi Anda;
- token itu jenis yang Anda harapkan;
- token itu cukup baru.

### Bertanya ke API {#check-with-the-api}

Panggil `/api/me` dengan token itu. Token yang sah mengembalikan akun di `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Token yang tidak sah mengembalikan `401` dengan `invalid_grant`. Lihat [GET /api/me](/docs/api#me).

`/api/me` menegaskan tanda tangannya. Jawabannya tidak menyebut aplikasi tempat token itu dibuat. Jadi dekode juga tokennya dan periksa sendiri `app`, `type` serta usianya. Token yang dibuat untuk aplikasi lain tidak boleh memasukkan siapa pun ke aplikasi Anda.

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

API hanya menerima token yang menyebut sebuah aplikasi. Periksa [sendiri](#check-it-yourself) token masuk dari situs tanpa akun aplikasi.

### Memeriksa sendiri {#check-it-yourself}

1. Dekode tokennya.
2. Periksa bahwa `signed_message.type` adalah jenis yang Anda harapkan: `posting` untuk token akses, `login` untuk token masuk.
3. Periksa bahwa `signed_message.app` adalah akun aplikasi Anda. Untuk situs tanpa akun aplikasi, periksa bahwa memang tidak ada.
4. Periksa usianya dari `timestamp`.
5. Hitung hash sha256 dari `JSON.stringify({ signed_message, authors, timestamp })`.
6. Pulihkan kunci publik dari `signatures[0]` dan hash itu.
7. Baca akun `authors[0]` dari rantai blok Hive sekarang juga, karena pengguna dapat mengganti kunci mereka. Kunci yang dipulihkan harus salah satu kunci posting atau active yang berlaku saat ini. Token dari `/api/oauth2/token` ditandatangani oleh @hivesigner: untuk token itu, terima kunci posting akun @hivesigner yang berlaku saat ini.

Di Node.js dengan [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), yang menyediakan `PrivateKey`, `PublicKey`, `Signature` dan `callRPC` di bawah `@ecency/sdk/hive`:

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

Pakai seperti ini:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

Pustaka dhive (`@hiveio/dhive`) juga bisa: hitung hash-nya dengan `cryptoUtils.sha256(message)` dan pulihkan kuncinya dengan `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Menjaga keamanan token {#keep-tokens-safe}

Siapa pun yang memegang token posting dapat menyiarkan sebagai orang itu lewat aplikasi Anda sampai token itu kedaluwarsa. Perlakukan token seperti kata sandi.

- **Simpan token di server Anda,** atau di kuki httpOnly dan Secure. Simpan token penyegaran dan rahasia klien Anda hanya di server.
- **Jangan pernah menaruh token di URL yang Anda catat.** Alur token mengantarkan token di rangkaian kueri callback Anda. Bacalah di server Anda, lalu alihkan ke URL tanpa token itu. Jauhkan rangkaian kueri callback dari log Anda.
- **Jangan memuat apa pun dari situs lain di halaman callback Anda,** supaya alamat yang memuat token itu tidak terkirim kepada mereka. Tajuk `Referrer-Policy: no-referrer` di halaman itu membantu.
- **Kirim token hanya ke server Anda sendiri dan ke `https://hivesigner.com/api/`.**

## Keluar dan mencabut akses {#sign-out}

- **Mengeluarkan seseorang** berarti membuang tokennya: hapus dari sesi atau kuki Anda. Anda juga dapat memanggil [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) untuk memberi tahu Hivesigner bahwa orang itu sudah keluar. Aplikasi Anda tetap membuang tokennya sendiri.
- **Memutus akses aplikasi Anda selamanya** adalah pilihan orang itu. Di https://hivesigner.com/authorized-apps, atau di `https://hivesigner.com/revoke/APP`, ia mencabut akun aplikasi Anda dari otoritas posting miliknya secara on-chain. Setelah itu API tidak lagi menyiarkan untuknya lewat aplikasi Anda.
