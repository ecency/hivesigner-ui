Tulisan Hive menunjuk gambar lewat URL, jadi sebuah aplikasi memerlukan tempat untuk mengunggahnya. imagehoster adalah hosting gambar sumber terbuka yang dibuat untuk Hive. Ia dapat menerima unggahan dari orang yang masuk ke aplikasi Anda dengan Hivesigner: token akses mereka menggantikan tanda tangan dengan kunci mereka.

## Cara kerjanya {#how-it-works}

1. Orang itu masuk ke aplikasi Anda dengan Hivesigner, dengan akses posting. Aplikasi Anda menerima token akses. Lihat [Masuk dengan OAuth2](/docs/oauth2).
2. Aplikasi Anda mengirim gambar ke imagehoster Anda, dengan token itu di dalam URL.
3. imagehoster memeriksa token dan akunnya, menyimpan gambar dan menjawab dengan URL-nya.
4. Aplikasi Anda memasang URL itu di dalam tulisan.

## Menjalankan imagehoster sendiri {#run-your-own}

Sebuah imagehoster disiapkan untuk satu akun aplikasi: `app_account` di bagian `[upload_limits]` pada konfigurasinya. Kirimkan kepadanya token yang dibuat untuk akun aplikasi itu. Instansi publik milik aplikasi lain: images.ecency.com disiapkan untuk akun aplikasi Ecency dan images.hive.blog untuk milik Hive.blog. Untuk menerima unggahan dari pengguna Anda, jalankan instansi Anda sendiri dengan akun aplikasi Anda.

Kode sumber dan panduan pemasangan:

- imagehoster komunitas Hive: https://gitlab.syncad.com/hive/imagehoster
- imagehoster milik Ecency: https://github.com/ecency/imagehoster

Di konfigurasi, isikan akun aplikasi Anda:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

Bagian yang sama menetapkan reputasi minimum yang diperlukan sebuah akun untuk mengunggah (`reputation`) dan kuota unggah tiap akun (`max` unggahan per `duration` milidetik). Atur `redis_url` agar kuota itu benar-benar berlaku. `max_image_size` menentukan berkas terbesar, dalam bita.

## Mengunggah gambar {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Tokennya.** Letakkan token akses orang itu di dalam jalur, persis seperti yang Hivesigner berikan kepada aplikasi Anda. Pakai token dari proses masuk dengan akses posting untuk aplikasi Anda. Token masuk saja, dari permintaan tanpa `client_id`, tidak menyebut aplikasi mana pun dan akan ditolak.
- **Badannya.** Kirim `multipart/form-data` dengan satu berkas gambar. imagehoster mengambil berkas pertama, apa pun nama ruasnya.
- **Ukurannya.** Kirim tajuk `Content-Length`. Berkas tidak boleh lebih besar daripada `max_image_size` milik instansi itu.

Jawabannya berupa JSON. Kalau berhasil, jawaban itu memuat URL gambarnya:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

Kalau gagal, imagehoster menjawab dengan status galat HTTP. Sebagian besar kegagalan juga membawa nama galat:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Catatan:** Token itu berjalan di dalam URL. Sajikan imagehoster Anda hanya lewat https dan jaga agar log aksesnya tetap tertutup.

## Contoh {#example}

Fungsi peramban ini mengunggah berkas dari sebuah isian berkas atau dari tarik lepas. Peramban memasang tajuk multipart dan panjangnya untuk Anda: jangan menetapkan `Content-Type` sendiri.

```js
// IMAGEHOSTER_URL is the address of your imagehoster, such as 'https://YOUR_IMAGEHOSTER'.
async function uploadImage(file, accessToken) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${IMAGEHOSTER_URL}/hs/${accessToken}`, {
    method: 'POST',
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.name ?? `Upload failed with status ${response.status}`);
  }
  return result.url;
}

const url = await uploadImage(input.files[0], ACCESS_TOKEN);
const markdown = `![](${url})`; // add this to the post body
```
