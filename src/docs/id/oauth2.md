Kirim orang ke Hivesigner untuk masuk ke aplikasi Anda. Di sana mereka meninjau permintaan Anda dan menyetujuinya. Hivesigner lalu mengembalikan mereka ke callback Anda dengan sebuah token (alur token) atau dengan sebuah kode yang ditukar server Anda dengan token (alur kode). Halaman ini mencakup kedua alur, tiap parameter dan cakupannya.

## Sebelum mulai {#before-you-start}

- Daftarkan aplikasi Anda: sebuah akun Hive untuknya, dengan callback Anda terdaftar. Lihat [Daftarkan aplikasi Anda](/docs/register-app).
- Untuk menyiarkan lewat API, akun aplikasi Anda juga harus [memberi otoritas posting kepada @hivesigner](/docs/register-app#grant-hivesigner).
- Untuk alur kode, pasang sebuah [rahasia klien](/docs/register-app#client-secret).

## URL otorisasi {#authorize-url}

Kirim orang itu ke alamat ini:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Sandikan tiap nilai untuk URL. `URLSearchParams` melakukannya untuk Anda:

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### Parameter {#parameters}

| Parameter | Wajib | Fungsinya |
| --- | --- | --- |
| `client_id` | Ya, untuk sebuah aplikasi | Nama akun aplikasi Anda. `clientId` juga dibaca. Tanpa itu, permintaan ini adalah permintaan masuk saja dari situs tanpa akun aplikasi: lihat [Masuk tanpa akses posting](/docs/login-only). |
| `redirect_uri` | Ya | Ke mana Hivesigner mengembalikan orang itu. Harus persis salah satu URI pengalihan aplikasi Anda. Lihat [Callback](/docs/register-app#callbacks). |
| `scope` | Tidak | `login`, `posting` atau `offline`. Lihat [Cakupan](#scopes). Tanpa itu, permintaan meminta akses posting. |
| `response_type` | Tidak | `code` memulai [alur kode](#code-flow). Nilai lain apa pun, atau tanpa nilai, berarti [alur token](#token-flow). |
| `state` | Disarankan | Nilai acak yang dikembalikan Hivesigner tanpa perubahan. Lihat [Lindungi permintaan dengan state](#state). |
| `account` | Tidak | Sebuah nama pengguna Hive. Ketika akun itu ada di perangkat orang tersebut, Hivesigner memilihnya. Kalau tidak, diabaikan. `select_account` juga dibaca. |

Orang itu tetap dapat berpindah ke akun lain di layar persetujuan. Ambillah akun selalu dari token atau dari penukaran kode, jangan pernah dari apa yang Anda minta.

## Cakupan {#scopes}

Hive punya satu otoritas posting. Karena itu Hivesigner punya dua tingkat akses, masuk saja dan posting, tanpa apa pun yang lebih halus di antaranya.

| `scope` | Yang disetujui orang itu | Alur | `type` token akses |
| --- | --- | --- | --- |
| `login` | «Melihat nama pengguna akun Anda». Tidak ada yang diberikan. | Alur token (jangan menambahkan `response_type=code`) | `login` |
| `posting` | Akses posting. Pertama kali, ini menambahkan akun aplikasi Anda ke otoritas posting orang itu. | Alur token, atau alur kode dengan `response_type=code` | `posting` |
| `offline` | Akses posting, seperti di atas | Alur kode | `posting`, dengan sebuah token `refresh` |

Dalam alur kode, callback mula-mula menerima sebuah kode (token dengan `type` `code`) yang ditukar server Anda dengan token akses.

- **Tanpa cakupan** berarti `posting`.
- **Nilai yang memuat `offline`** di mana saja berarti `offline`, misalnya `offline,vote,comment` yang lama.
- **Nilai lain apa pun** berarti `posting`. Termasuk nama-nama operasi lama seperti `vote`, `comment`, `vote,comment`, `comment_options` atau `custom_json`. Semua itu tidak membatasi token: tiap token posting mengizinkan operasi yang sama. Lihat [Yang diterima broadcast](/docs/api#broadcast-rules).

Mintalah `login` ketika aplikasi Anda hanya perlu tahu siapa orangnya. Lihat [Masuk tanpa akses posting](/docs/login-only).

## Alur token {#token-flow}

Peramban orang itu menerima token akses secara langsung. Aplikasi Anda tidak memerlukan rahasia apa pun.

1. Kirim orang itu ke URL otorisasi:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. Orang itu menyetujui. Hivesigner mengalihkan ke callback Anda:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner menambahkan parameternya dengan `?` ketika callback Anda tidak punya kueri dan dengan `&` ketika punya. `state` hanya ada ketika Anda mengirim nilai yang tidak kosong.

3. Di callback Anda, [bandingkan `state`](#state) lebih dulu. Lalu [periksa token](/docs/tokens#check-a-token) di server Anda. Akun pemilik token ada di dalam token itu: jangan bersandar hanya pada parameter `username`, karena siapa pun dapat menyunting sebuah URL.
4. Simpan token di server Anda atau di kuki httpOnly. Alihkan ke URL yang bersih agar token itu keluar dari bilah alamat.
5. Pakai token dengan [API](/docs/api) sampai kedaluwarsa setelah `expires_in` detik (7 hari). Setelah itu kirim orang itu ke URL otorisasi lagi. Orang yang sudah memberi akses posting melihat «Masuk ke APP» dan «Anda sudah pernah mengotorisasi @myapp. Tidak ada izin baru yang diberikan.».

## Alur kode {#code-flow}

Server Anda menerima sebuah kode lalu menukarnya dengan token akses dan token penyegaran. Nanti server dapat memperbaruinya tanpa orang itu. Pakai cara ini ketika server Anda bertindak untuk pengguna dalam waktu panjang.

1. Kirim orang itu ke URL otorisasi dengan `scope=offline`:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` melakukan hal yang sama.

2. Orang itu menyetujui akses posting. Hivesigner mengalihkan ke callback Anda:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [Bandingkan `state`](#state). Lalu tukarkan kodenya segera, dari server Anda.

### Menukarkan kode {#exchange-code}

Kirim kode dan rahasia klien Anda ke `/api/oauth2/token` di dalam badan sebuah permintaan POST:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

Jawabannya:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Panggilan yang sama di Node.js 18 atau yang lebih baru:

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- Taruh kode dan rahasia di dalam badan permintaan, jangan pernah di URL.
- Jangan mengirim tajuk `Authorization` apa pun dengan permintaan ini.
- Pakai `username` dari jawaban ini. Nilai itu berasal dari kode, yang ditandatangani orang tersebut.
- Simpan token akses dan token penyegaran di server Anda.

### Penyegaran {#refresh}

Ketika token akses kedaluwarsa, kirim token penyegaran bersama rahasia klien Anda ke titik akhir yang sama:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

Jawabannya berbentuk sama, dengan token akses baru dan token penyegaran baru. Simpan keduanya menggantikan yang lama.

## Lindungi permintaan dengan state {#state}

Tanpa `state`, situs lain dapat mengirim pengguna Anda ke callback Anda dengan token atau kode pilihannya sendiri. Aplikasi Anda lalu akan memasukkan orang itu ke akun orang lain. `state` mengikat tiap kepulangan pada peramban yang memulai proses masuk.

1. Buat nilai acak untuk tiap proses masuk, sekurangnya 16 bita acak. Heksadesimal menjaganya bebas dari aksara yang perlu disandikan.
2. Simpan di tempat yang hanya dapat ditunjukkan kembali oleh peramban ini: sesi server Anda, atau kuki httpOnly dan Secure berumur pendek dengan `SameSite=Lax`.
3. Kirimkan sebagai `state` di URL otorisasi.
4. Di callback Anda, bandingkan parameter `state` dengan nilai yang tersimpan. Kalau hilang atau berbeda, berhentilah: jangan memakai token maupun kodenya.
5. Hapus nilai yang tersimpan, supaya masing-masing hanya berlaku sekali.

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner mengembalikan nilai `state` yang sama seperti yang diterimanya. Nilai kosong ia abaikan.

## Yang dilihat orang itu {#what-the-user-sees}

Layar persetujuan menampilkan gambar dan nama aplikasi Anda, «Akun Hive @myapp» dan «Mengarahkan Anda ke HOST», dengan HOST diambil dari callback Anda. Lalu:

- **Permintaan posting pertama.** Judulnya berbunyi «APP meminta akses ke akun Anda.». Kartu **Cakupan** memuat daftar apa saja yang akan dapat dilakukan aplikasi Anda. Sebuah pemberitahuan berbunyi «Otorisasi pertama kali: tindakan ini menambahkan @myapp ke otoritas posting Anda secara on-chain dan memerlukan kunci active Anda satu kali. Akun tersebut akan dapat memposting sebagai Anda sampai Anda mencabut izinnya.». Tombolnya berbunyi **Otorisasi**. Ketika perangkat orang itu tidak memuat kunci active untuk akun tersebut, layar memintanya di tempat.
- **Masuk.** Untuk `scope=login`, atau untuk akses posting yang sudah diberikan sebelumnya, judulnya berbunyi «Masuk ke APP» dan tombolnya berbunyi **Masuk**.
- **Akunnya.** «Mengotorisasi sebagai» atau «Masuk sebagai», diikuti akun yang terpilih. Orang itu dapat berpindah akun di sini.
- **Akun terkunci.** Sebuah ruas kode sandi ada di atas tombol. Satu klik membuka kunci akun dan melanjutkan.
- **Tidak ada akun di perangkat.** Tombolnya berbunyi **Lanjutkan**. Tombol itu membuka formulir penambahan akun lalu kembali ke permintaan.

Setelah permintaan posting pertama, Hivesigner menunggu sampai izin baru itu terlihat di rantai sebelum mengalihkan. Ini bisa memakan beberapa detik. Untuk layar lengkapnya dari sisi orang itu, lihat [Masuk ke aplikasi](/docs/signing-in).

## Pembatalan dan permintaan yang ditolak {#cancel}

- **Pembatalan.** Orang itu menuju daftar akunnya di Hivesigner. Tidak ada yang dikirim ke callback Anda: tidak ada parameter galat. Biarkan tombol masuk Anda tetap tersedia supaya orang itu dapat memulai lagi. Jangan menunggu kepulangan apa pun.
- **Permintaan yang ditolak.** Callback yang tidak terdaftar, `client_id` yang tidak dikenal atau `redirect_uri` yang hilang menampilkan galat di Hivesigner dengan tombol **Laporkan masalah ini**. Tidak ada yang dikirim ke callback Anda. Lihat [Yang dilihat pengguna ketika ada yang salah](/docs/register-app#refused-requests).

## URL permintaan masuk yang lama {#legacy-login-request}

Hivesigner masih menerima URL masuk yang lebih lama, yang dipertahankan untuk pemaduan lama. Pakai `/oauth2/authorize` untuk yang baru.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

URL itu membuka layar persetujuan yang sama, dengan pemeriksaan callback yang sama dan pengalihan yang sama. Ia membaca parameternya dengan cara berbeda:

- `scope` bernilai `login` atau `posting`. Nilai lain apa pun, atau tanpa nilai, berarti `login`.
- `offline` tidak dibaca. Untuk alur kode, tambahkan `response_type=code`.
- `account` tidak dibaca.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` mengikuti aturan yang sama.
