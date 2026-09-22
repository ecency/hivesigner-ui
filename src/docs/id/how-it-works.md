Hivesigner memungkinkan orang memakai akun Hive mereka di aplikasi Anda tanpa memberikan kunci mereka kepada aplikasi Anda. Hivesigner punya dua bagian: penanda tangan di peramban pada https://hivesigner.com dan sebuah API pada `https://hivesigner.com/api/`. Halaman ini menjelaskan apa yang dilakukan tiap bagian dan dua cara sebuah aplikasi memakainya.

## Penanda tangan di peramban {#browser-signer}

Penanda tangan di peramban adalah situs Hivesigner. Orang menambahkan akun Hive mereka di sana. Kunci mereka tetap berada di peramban mereka sendiri: Hivesigner tidak mengirim kunci apa pun ke server mana pun. Aplikasi Anda tidak pernah melihat satu pun.

Penanda tangan menandatangani tiga macam hal, dan selalu setelah orangnya melihat apa yang ia tandatangani:

- **Token masuk.** Aplikasi Anda mengirim seseorang ke Hivesigner untuk masuk. Hivesigner menampilkan nama aplikasi Anda dan apa yang dimintanya. Ketika orang itu menyetujui, Hivesigner menandatangani pernyataan singkat dengan kuncinya yang menyebut akunnya dan aplikasi Anda. Pernyataan bertanda tangan itulah token yang diterima aplikasi Anda. Lihat [Masuk dengan OAuth2](/docs/oauth2) dan [Token](/docs/tokens).
- **Transaksi.** Tautan tanda tangan membuka sebuah transaksi untuk ditinjau. Ketika orang itu menyetujui, Hivesigner menandatanganinya dengan kunci yang diperlukan. Lalu mengirimkannya ke jaringan Hive dari peramban, kecuali tautan itu hanya meminta tanda tangannya saja. Lihat [Tautan tanda tangan](/docs/sign-links).
- **Pesan.** Aplikasi Anda dapat meminta seseorang menandatangani teks dengan kuncinya, untuk membuktikan bahwa ia menguasai akun itu. Lihat [Penandatanganan pesan](/docs/message-signing).

## API {#api}

API menyiarkan operasi posting untuk orang yang sudah masuk ke aplikasi Anda: tulisan dan komentar, vote, mengikuti dan operasi `custom_json` lainnya, pengambilan hadiah dan pembaruan profil. Aplikasi Anda mengirim operasi bersama token orang itu. API memeriksa token, menandatangani transaksi dengan kunci posting akun @hivesigner, lalu menyiarkannya ke Hive.

API juga mengembalikan akun orang yang sudah masuk, menukar kode dengan token dan mendaftar aplikasi yang memakai Hivesigner. Lihat [REST API](/docs/api).

## Rantai otoritas posting {#authority-chain}

Di Hive sebuah akun dapat membiarkan akun lain bertindak dengan otoritas posting miliknya. API bersandar pada dua pemberian izin semacam itu:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **Orang itu menambahkan akun aplikasi Anda ke otoritas posting miliknya.** Layar persetujuan melakukan ini pertama kali seseorang menyetujui akses posting untuk aplikasi Anda. Ini memerlukan kunci active orang itu satu kali.
2. **Akun aplikasi Anda menambahkan @hivesigner ke otoritas posting miliknya.** Ini Anda lakukan sekali, ketika [mendaftarkan aplikasi Anda](/docs/register-app#grant-hivesigner).

Sebelum menyiarkan, API memeriksa bahwa kedua izin itu ada. API hanya menyiarkan operasi yang penulisnya adalah orang yang disebut token.

Orang itu dapat mencabut akses aplikasi Anda kapan saja di https://hivesigner.com/authorized-apps. Setelah itu API tidak dapat lagi memposting untuknya lewat aplikasi Anda.

## Dua cara memadukan {#two-ways-to-integrate}

### Masuk, lalu menyiarkan lewat API {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

Orang itu menyetujui sekali. Setelah itu aplikasi Anda dapat memberi vote, berkomentar dan memposting untuknya tanpa bertanya lagi, sampai token kedaluwarsa atau orang itu mencabut akses aplikasi Anda. Pakai cara ini untuk tindakan sosial sehari-hari.

Anda memerlukan akun aplikasi dengan callback terdaftar dan izin untuk @hivesigner. Lihat [Daftarkan aplikasi Anda](/docs/register-app). Kalau Anda hanya ingin tahu siapa orangnya, lihat [Masuk tanpa akses posting](/docs/login-only).

### Tautan tanda tangan {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

Orang itu melihat setiap transaksi sebelum ditandatangani. Tautan tanda tangan mencakup 41 operasi Hive, termasuk transfer dan tindakan dompet lain yang memerlukan kunci active. API tidak pernah menangani semua itu. Anda tidak memerlukan akun aplikasi untuk tautan tanda tangan. Lihat [Tautan tanda tangan](/docs/sign-links).

### Mana yang dipilih {#which-to-choose}

- **Tindakan posting yang sering** (vote, komentar, mengikuti): masukkan orang dengan OAuth2, lalu pakai API.
- **Tindakan dompet**, atau apa pun yang memerlukan kunci active: pakai tautan tanda tangan.
- **Keduanya**: banyak aplikasi memasukkan orang dengan OAuth2 untuk fitur sosial dan memakai tautan tanda tangan untuk transfer.
- **Hanya identitas orangnya**: lihat [Masuk tanpa akses posting](/docs/login-only).

## Kode sumber {#source-code}

Hivesigner bersifat sumber terbuka:

- Penanda tangan di peramban: https://github.com/ecency/hivesigner-ui
- API: https://github.com/ecency/hivesigner-api
- SDK JavaScript (paket npm `hivesigner`): https://github.com/ecency/hivesigner-sdk. Lihat [SDK](/docs/sdk).
