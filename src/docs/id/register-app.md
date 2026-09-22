Aplikasi yang memasukkan orang dengan Hivesigner adalah sebuah akun Hive. Namanya adalah `client_id` yang Anda kirim. Profilnya memuat pengaturan yang dibaca Hivesigner: callback yang boleh menerima token dan, untuk alur kode, sebuah rahasia klien. Untuk menyiarkan lewat API, akun aplikasi juga memberikan otoritas posting kepada @hivesigner. Halaman ini menelusuri tiap langkahnya.

## Yang Anda perlukan {#what-you-need}

| Anda ingin | Akun aplikasi dan callback | Rahasia klien | Izin untuk @hivesigner |
| --- | --- | --- | --- |
| Memasukkan orang dan menyiarkan dengan alur token | Ya | Tidak | Ya |
| Memasukkan orang dan menyiarkan dengan alur kode (token penyegaran) | Ya | Ya | Ya |
| Hanya memasukkan orang, dengan token yang menyebut aplikasi Anda | Ya | Tidak | Tidak |
| Hanya memasukkan orang, dari situs tanpa akun Hive | Tidak | Tidak | Tidak |
| Mengirim tautan tanda tangan | Tidak | Tidak | Tidak |

Untuk dua baris terakhir, lihat [Masuk tanpa akses posting](/docs/login-only) dan [Tautan tanda tangan](/docs/sign-links).

## Membuat akun aplikasi {#app-account}

1. Buat akun Hive untuk aplikasi Anda, misalnya di https://ecency.com/signup. Pakai akun terpisah untuk aplikasi, bukan akun pribadi Anda. Namanya adalah `client_id` Anda. Pengguna melihatnya di layar persetujuan di samping «Akun Hive». Akun Hive tidak dapat diganti namanya, jadi pilihlah namanya dengan cermat.
2. Tambahkan akun itu ke Hivesigner di https://hivesigner.com/import (**Tambahkan akun**). Pakai kunci active atau kata sandi utama: izin di bawah memerlukan kunci active.

## Mengisi pengaturan aplikasi {#app-settings}

Buka https://hivesigner.com/profile dengan akun aplikasi terpilih lalu atur:

- **Akun ini adalah aplikasi.** Nyalakan. Ini menandai akun itu sebagai aplikasi, dan itulah yang diperiksa API sebelum menerima kode atau token penyegaran untuknya.
- **URI pengalihan.** Callback Anda, satu per baris. Lihat [Callback](#callbacks).
- **Pembuat.** Siapa yang merawat aplikasi. Direktori aplikasi di https://hivesigner.com/apps menampilkannya.
- **Status.** Produksi atau uji coba, untuk catatan Anda sendiri. Hivesigner memperlakukan keduanya sama.
- **Rahasia klien.** Hanya diperlukan untuk [alur kode](/docs/oauth2#code-flow). Lihat [Rahasia klien](#client-secret).

Isi juga **Nama** dan **URL gambar profil**. Layar persetujuan menampilkan gambar dan nama aplikasi Anda. Direktori aplikasi di https://hivesigner.com/apps menampilkan namanya, **Tentang** dan **Situs web**.

Menyimpan akan memperbarui profil akun secara on-chain dan memerlukan kunci posting akun itu. Hivesigner membaca callback Anda dari akun itu ketika sebuah permintaan masuk dibuka, jadi perubahan berlaku begitu transaksinya masuk ke sebuah blok.

> **Catatan:** Nama, gambar dan keterangan diterbitkan oleh akun aplikasi Anda sendiri. Karena itu layar persetujuan juga menampilkan nama akun yang sebenarnya (`@myapp`) dan host tujuan pengiriman orangnya: keduanya itulah yang benar-benar dipakai oleh pemberian izin dan pengalihan.

## Callback {#callbacks}

Callback (yaitu `redirect_uri` dalam sebuah permintaan masuk) adalah tempat Hivesigner mengembalikan orang itu dengan sebuah token atau kode. Hivesigner hanya mengirimkannya ke callback yang terdaftar pada akun aplikasi Anda.

### Aturannya {#callback-rules}

- **Cocok persis.** `redirect_uri` dalam permintaan harus salah satu URI pengalihan Anda, aksara demi aksara: skema, host, porta, jalur dan kueri.
- **https saja.** Callback harus memakai `https://`. `http://` biasa hanya diterima pada loopback: `localhost`, `127.0.0.1` atau `[::1]`.
- **Porta loopback boleh berubah.** Callback loopback terdaftar dengan http biasa cocok dengan host dan porta loopback mana pun yang jalur, kueri, fragmen dan info penggunanya sama. Callback loopback yang terdaftar dengan `https://` tetap harus cocok persis.
- **Tanpa skema sendiri.** Callback seperti `myapp://callback` ditolak. Lihat [Aplikasi ponsel dan desktop](#native-apps).
- **Tanpa fragmen.** Jangan menambahkan `#fragment` pada callback.

Halaman profil menolak menyimpan callback yang tidak akan pernah bisa bekerja, dengan pesan «Bukan callback yang dapat digunakan (https, atau http di localhost)».

### Contoh {#callback-examples}

Dengan URI pengalihan berikut terdaftar:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| `redirect_uri` dalam permintaan | Hasil |
| --- | --- |
| `https://myapp.example/auth/callback` | Diterima: cocok persis |
| `https://myapp.example/auth/callback/` | Ditolak: ada `/` tambahan |
| `https://myapp.example/auth/callback?next=home` | Ditolak: kuerinya berbeda |
| `https://www.myapp.example/auth/callback` | Ditolak: host lain |
| `http://myapp.example/auth/callback` | Ditolak: http biasa di luar loopback |
| `http://localhost:3000/auth` | Diterima: cocok persis |
| `http://127.0.0.1:51234/auth` | Diterima: loopback, jalur sama, porta lain |
| `http://[::1]:3000/auth` | Diterima: loopback, jalur sama |
| `http://127.0.0.1:3000/other` | Ditolak: jalur lain |
| `https://localhost:3000/auth` | Ditolak: https tidak cocok dengan pendaftaran http biasa |
| `myapp://auth` | Ditolak: skema sendiri |

Untuk menerima kueri pada callback Anda, daftarkan callback itu dengan kueri yang persis sama. Hivesigner mempertahankan kueri milik callback Anda dan menambahkan parameternya sesudah itu.

### Aplikasi ponsel dan desktop {#native-apps}

Hivesigner meletakkan token di dalam URL callback. Skema sendiri seperti `myapp://` tidak terikat pada satu aplikasi: aplikasi lain di perangkat yang sama dapat mengakuinya dan menerima token itu. Karena itu Hivesigner menolak skema sendiri dan hanya mengirim token ke alamat https atau ke loopback pada perangkat orang itu.

Aplikasi asli memakai salah satu dari cara ini:

- **Tautan https miliknya sendiri.** Daftarkan callback pada ranah Anda yang dibuka sistem operasi di dalam aplikasi Anda (App Links di Android atau Universal Links di iOS).
- **Callback loopback.** Aplikasi menyimak pengalihan di `127.0.0.1`. Daftarkan `http://127.0.0.1/auth` (atau `localhost`) lalu pakai porta bebas mana pun saat berjalan: portanya tidak harus sama.

## Rahasia klien {#client-secret}

Rahasia klien membuktikan bahwa penukaran kode datang dari server Anda. Ini wajib untuk [alur kode](/docs/oauth2#code-flow): server Anda mengirimkannya bersama tiap kode atau token penyegaran ke `/api/oauth2/token`. Alur token tidak memakainya.

- **Buat nilai acak yang panjang**, misalnya dengan `openssl rand -hex 32`.
- **Pasang di halaman profil.** Hivesigner hanya menyimpan hash sha256-nya, di dalam profil akun aplikasi Anda. Membiarkan ruas itu kosong akan mempertahankan rahasia yang sekarang.
- **Simpan di server Anda.** Jangan pernah menaruhnya di halaman web, aplikasi ponsel atau URL.
- **Untuk menggantinya,** pasang yang baru dan perbarui server Anda pada saat yang sama.

## Memberi @hivesigner otoritas posting {#grant-hivesigner}

API menyiarkan dengan kunci posting akun @hivesigner. Hive hanya menerima tanda tangan itu untuk pengguna Anda ketika akun aplikasi Anda sudah menambahkan @hivesigner ke otoritas posting miliknya. Lihat [Rantai otoritas posting](/docs/how-it-works#authority-chain).

1. Pilih akun aplikasi Anda di Hivesigner.
2. Buka https://hivesigner.com/authorize/hivesigner.
3. Halaman itu berbunyi «Otorisasi @hivesigner» dan «@hivesigner akan dapat memposting, berkomentar, memberi vote, dan mengikuti sebagai @myapp.». Pilih **Otorisasi**. Ini memerlukan kunci active akun aplikasi.

Anda melakukannya sekali saja. Tanpa itu, tiap siaran gagal dengan `unauthorized_client` dan «Broadcaster account doesn't have permission to broadcast for @myapp». Aplikasi yang hanya memasukkan orang tidak memerlukannya.

Izin ini juga membolehkan @hivesigner memposting sebagai akun aplikasi Anda sendiri, satu alasan lagi untuk memakai akun aplikasi hanya untuk aplikasi itu.

Aplikasi yang menyiarkan lewat Hivesigner dengan izin ini dapat muncul di direktori aplikasi pada https://hivesigner.com/apps, diurutkan menurut berapa banyak orang yang memakainya.

## Yang dilihat pengguna ketika ada yang salah {#refused-requests}

Hivesigner menolak permintaan yang tidak dapat dijawabnya dengan aman. Ia menampilkan sebuah pesan dan tombol **Laporkan masalah ini**. Permintaan itu tidak dapat disetujui. Tidak ada yang dikirim ke callback Anda.

| Masalah | Yang dibaca orang itu |
| --- | --- |
| `redirect_uri` bukan salah satu URI pengalihan Anda | «URL pengalihan aplikasi ini tidak terdaftar. Demi keamanan Anda, proses masuk diblokir.» |
| `client_id` bukan akun Hive | «@myapp bukan akun Hive, jadi tidak ada aplikasi yang dapat diotorisasi. Kembali ke situs tersebut dan coba lagi.» |
| Akun tidak ditandai sebagai aplikasi | «@myapp tidak disiapkan sebagai aplikasi, sehingga tidak dapat memasukkan Anda. Kembali ke situs dan coba lagi.» Nyalakan **Akun ini adalah aplikasi**, seperti di atas. |
| Tidak ada `redirect_uri` dalam permintaan | «Permintaan otorisasi ini tidak lengkap: tidak menyebutkan aplikasi atau URL pengalihan. Kembali ke aplikasi tersebut dan coba lagi.» |

Kalau pengguna Anda melaporkan salah satu hal ini, bandingkan `redirect_uri` yang dikirim aplikasi Anda dengan URI pengalihan Anda, aksara demi aksara.

## Daftar periksa {#checklist}

1. Sebuah akun Hive untuk aplikasi, ditambahkan ke Hivesigner dengan kunci active-nya.
2. Di https://hivesigner.com/profile: «Akun ini adalah aplikasi» menyala, URI pengalihan terdaftar, sebuah rahasia klien terpasang kalau Anda memakai alur kode.
3. @hivesigner diotorisasi di https://hivesigner.com/authorize/hivesigner, kalau Anda menyiarkan lewat API.
4. Sebuah tautan masuk yang mengirim persis salah satu URI pengalihan Anda. Lihat [Masuk dengan OAuth2](/docs/oauth2).
