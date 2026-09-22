Sebagian aplikasi hanya perlu tahu siapa seseorang di Hive. Aplikasi itu tidak pernah memposting, memberi vote atau menyiarkan apa pun untuknya. Hivesigner dapat memasukkan orang ke aplikasi seperti itu tanpa otoritas posting sama sekali. Orang itu membuktikan bahwa ia menguasai sebuah akun Hive. Aplikasi Anda mengetahui namanya. Halaman ini menunjukkan dua caranya dan bagaimana memeriksa hasilnya dengan aman.

## Dua cara {#two-ways}

- **Dengan akun aplikasi:** aplikasi Anda punya akun Hive sendiri dan meminta `scope=login`. Token menyebut aplikasi Anda.
- **Tanpa akun aplikasi:** situs tanpa akun Hive sendiri hanya mengirim sebuah `redirect_uri`. Token tidak menyebut aplikasi mana pun. Situs Anda memeriksanya sendiri.

Keduanya tidak memerlukan izin dari orang itu maupun dari akun aplikasi Anda, jadi tidak ada yang berubah pada akun orang itu. Hivesigner menandatangani proses masuk dengan kunci posting, atau dengan kunci active ketika perangkat tidak punya kunci posting untuk akun itu.

## Dengan akun aplikasi {#app-account}

1. [Daftarkan aplikasi Anda](/docs/register-app): buat akun Hive-nya dan daftarkan callback Anda. Anda tidak memerlukan rahasia klien maupun izin untuk @hivesigner.
2. Kirim orang itu ke:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. Orang itu melihat «Masuk ke APP» dengan **Cakupan** «Melihat nama pengguna akun Anda». Ia memilih **Masuk**.
4. Hivesigner mengalihkan ke callback Anda:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [Bandingkan `state`](/docs/oauth2#state), lalu periksa tokennya. Ini token `login` yang menyebut aplikasi Anda, jadi kedua cara ini sama-sama bisa:
   - panggil [`GET /api/me`](/docs/api#me) dengannya, yang menjawab dengan akun di `user` dan `scope` `["login"]`, lalu dekode tokennya dan periksa `type` serta `app` ([Bertanya ke API](/docs/tokens#check-with-the-api));
   - atau [periksa sendiri](/docs/tokens#check-it-yourself) dengan `type: 'login'` dan nama aplikasi Anda.

Token `login` tidak dapat menyiarkan apa pun: `/api/broadcast` menolak setiap operasi yang dikirim dengannya.

## Tanpa akun aplikasi {#no-app-account}

1. Kirim orang itu ke URL otorisasi dengan sebuah `redirect_uri` dan tanpa `client_id`:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   Callback harus `https://`, atau `http://` pada loopback (`localhost`, `127.0.0.1`, `[::1]`). Tidak ada daftar tempat mendaftarkannya. Di sini Hivesigner mengabaikan `scope` dan `response_type`: jawabannya selalu berupa token masuk.

2. Orang itu melihat «HOST ingin mengonfirmasi nama pengguna Hive Anda.», dengan HOST adalah host callback Anda. Ia memilih **Masuk**.
3. Hivesigner mengalihkan ke callback Anda:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [Bandingkan `state`](/docs/oauth2#state), lalu periksa token itu sendiri. API tidak menerima token yang tidak menyebut aplikasi, jadi server Anda memeriksa tanda tangannya terhadap kunci-kunci akun itu. Lihat [Periksa sendiri](/docs/tokens#check-it-yourself), dengan `type: 'login'` dan tanpa `app`.

Kalau callback bukan alamat web, atau berupa `http://` biasa di luar loopback, Hivesigner menolak permintaan itu dan menjelaskan alasannya kepada orang tersebut.

## Mana yang dipakai {#which-one}

| | Dengan akun aplikasi | Tanpa akun aplikasi |
| --- | --- | --- |
| Yang dilihat orang itu | Nama, gambar dan akun Hive aplikasi Anda | Hanya host situs Anda |
| Persiapan | Sebuah akun Hive dengan callback terdaftar | Tidak ada |
| Token menyebut | Aplikasi Anda | Tidak ada aplikasi |
| Periksa token dengan | `/api/me` atau kode Anda sendiri | Kode Anda sendiri |
| Akses posting nanti | Dengan akun yang sama: minta `posting` dan [beri izin kepada @hivesigner](/docs/register-app#grant-hivesigner) | Perlu akun aplikasi lebih dulu |

Pakai akun aplikasi bila bisa. Pengguna melihat nama dan gambar aplikasi Anda. Server Anda dapat menolak token yang dibuat untuk aplikasi lain. Nanti Anda dapat beralih ke akses posting dengan akun yang sama.

Pakai cara kedua ketika situs Anda tidak punya akun Hive dan memang tidak menginginkannya.

## Memeriksa proses masuk dengan aman {#check-safely}

- **Ikat permintaan dengan `state`.** Buat nilai acak tiap kali masuk, simpan di sesi orang itu, bandingkan di callback Anda dan pakai satu kali saja. Lihat [Lindungi permintaan dengan state](/docs/oauth2#state).
- **Periksa jenisnya.** Terima hanya `signed_message.type` bernilai `login`. Kode atau token penyegaran bukanlah proses masuk.
- **Periksa aplikasinya.** Dengan akun aplikasi, `signed_message.app` harus aplikasi Anda. Tanpa akun aplikasi, tidak boleh ada `app` sama sekali.
- **Periksa usianya.** Anda memeriksa token itu tepat setelah pengalihan, jadi terimalah hanya dalam beberapa menit sejak `timestamp` miliknya (misalnya 5 menit, dengan selisih jam satu menit).
- **Pakai tiap token satu kali.** Setelah pemeriksaan berhasil, mulai sesi Anda sendiri (misalnya kuki httpOnly) dan buang token Hivesigner itu. Catat token yang sudah Anda terima sampai terlalu tua untuk lolos pemeriksaan usia. Tolak token mana pun yang Anda lihat lagi.
- **Jauhkan token dari log.** Token itu tiba di rangkaian kueri callback Anda. Lihat [Menjaga keamanan token](/docs/tokens#keep-tokens-safe).

## Contoh {#examples}

Situs seperti https://hivesearcher.com dan https://openhive.chat membiarkan orang masuk dengan akun Hive mereka untuk fitur yang tetap berada di luar rantai, seperti pencarian dan obrolan. Mereka perlu tahu siapa orangnya, dan tidak lebih.
