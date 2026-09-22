Aplikasi dapat meminta Anda menandatangani transaksi Hive, misalnya vote, transfer, atau postingan. Aplikasi mengirimkan tautan yang membuka Hivesigner. Hivesigner menunjukkan dengan bahasa yang jelas apa yang dilakukan permintaan itu, kunci apa yang diperlukannya, dan ke mana Anda diarahkan setelahnya. Tidak ada yang ditandatangani sebelum Anda menyetujuinya. Aplikasi juga dapat meminta Anda menandatangani sebuah pesan, yang tidak pernah sampai ke blockchain.

## Layar Konfirmasi transaksi {#confirm-screen}

Tautan tanda tangan membuka layar berjudul “Konfirmasi transaksi”. Layar itu menampilkan satu kartu untuk setiap operasi dalam permintaan. Operasi adalah satu tindakan di Hive, misalnya satu vote atau satu transfer.

Ketika sebuah permintaan memuat lebih dari satu operasi, kartunya diberi nomor dan baris di atasnya menyatakan “Permintaan ini berisi 3 operasi. Tinjau semuanya sebelum menyetujui.”

### Ringkasannya {#summary}

Setiap kartu dimulai dengan satu kalimat yang menyatakan apa yang dilakukan operasi itu, beserta nilai-nilai dari permintaan. Misalnya:

| Operasi | Yang tertulis di kartu |
| --- | --- |
| Sebuah transfer | Kirim 1.000 HIVE ke @bob (dan memonya di bawahnya, seperti Memo: ...) |
| Sebuah vote | Beri upvote pada @alice/postingan-saya (dan bobot vote di bawahnya, misalnya 100%) |
| Sebuah postingan atau balasan | Terbitkan postingan “Judul saya”, atau Balas @alice/postingan-saya |
| Tindakan yang didefinisikan sebuah aplikasi Hive | Tindakan kustom (follow) |
| Perubahan pada siapa yang mengendalikan sebuah akun | Perbarui otoritas akun |

Operasi lain menampilkan namanya, seperti “Power Up” atau “Delegasikan Hive Power”.

Di sebelah kalimat itu, label huruf kapital menunjukkan kunci yang diperlukan operasi tersebut: POSTING, ACTIVE, atau OWNER.

### Perinciannya {#details}

Di bawah kalimat itu, kartu memuat daftar nilai yang dibawa operasi:

- akun yang atas namanya operasi itu bertindak
- untuk postingan atau komentar: permlink (alamat postingan), komunitas atau tag, isi, dan metadata
- untuk tindakan kustom: setiap nilai datanya, satu per baris, agar tidak ada yang terpotong
- untuk perubahan otoritas: ambang batas, kunci, dan akun yang ditetapkannya

Perubahan otoritas juga memberi tahu bila perubahan itu akan menghapus kunci Anda, dengan “kunci: TIDAK ADA (kunci Anda akan dihapus)”. Ambang batas yang tidak ada ditampilkan sebagai “ambang batas TIDAK DIATUR (dihitung sebagai 0)”.

Pada ringkasan dan perincian, karakter yang dapat menyembunyikan teks atau mengubah arahnya ditampilkan sebagai `�`. Apa yang Anda baca tidak dapat berpura-pura menjadi sesuatu yang lain.

**Tampilkan operasi mentah** membuka operasi persis seperti yang akan ditandatangani.

Ketika jumlahnya dinyatakan dalam Hive Power, Hivesigner mengonversinya dengan kurs saat ini. Ia menampilkan “Memuat kurs Hive Power saat ini…” dan menunggu kurs itu sebelum Anda dapat menyetujui.

Beberapa permintaan membawa transaksi yang disiapkan di tempat lain, misalnya untuk akun yang dikelola beberapa orang. Layar lalu menyatakan “Permintaan ini menyertakan header transaksinya sendiri. Kedaluwarsa: TANGGAL.” Jika orang lain sudah menandatanganinya, ditambahkan “Permintaan ini sudah memuat 2 tanda tangan.”

## Kunci apa yang diperlukan {#which-key}

Di bawah kartu-kartu itu, satu baris menyebut kunci yang diperlukan seluruh permintaan: “Akan ditandatangani dengan kunci posting Anda”, “Akan ditandatangani dengan kunci active Anda”, atau “Akan ditandatangani dengan kunci owner Anda”.

Hivesigner menandatangani persis dengan kunci itu. Kunci active tidak dapat menandatangani vote dan kunci owner tidak dapat menandatangani transfer. Ini aturan Hive sejak hard fork pada 2025. Lihat [Kunci mana yang ditambahkan](/docs/accounts#which-key).

Semua operasi dalam satu permintaan harus memerlukan kunci yang sama. Bila tidak, baris itu berbunyi “Transaksi ini memerlukan lebih dari satu otoritas dan tidak dapat ditandatangani dengan satu kunci.” Tidak ada tombol untuk menyetujuinya. Kembalilah ke aplikasi.

Permintaan dengan kunci owner jarang terjadi. Permintaan itu mengubah siapa yang dapat mengendalikan atau memulihkan akun Anda. Bacalah dua kali. Lihat [Baca sebelum menyetujui](/docs/safety#read-before-approving).

### Ketika kuncinya tidak ada {#missing-key}

Jika akun yang dipilih tidak memiliki kunci itu di perangkat ini, layar memberi tahu Anda. Misalnya: “Tindakan ini memerlukan kunci active Anda, tetapi kunci active @PENGGUNA tidak tersimpan di sini.”

1. Pilih **Tambahkan akun lain** di bawah pesan tersebut. Formulir **Tambahkan akun** akan terbuka.
2. Masukkan nama pengguna yang sama dan kunci yang belum ada. Jika akun itu punya kode sandi, masukkan juga kode sandinya.
3. Pilih **Tambahkan akun**. Hivesigner menambahkan kuncinya dan mengembalikan Anda ke permintaan.

Jika akunnya terkunci, layar menampilkan kolom **Kode sandi** di atas tombol. Satu klik membuka kunci akun dan menyetujui. Jika ternyata kuncinya memang tidak ada, layar memberi tahu Anda setelah kunci akun terbuka.

Jika peramban ini belum memiliki akun, tombolnya berbunyi **Lanjutkan** dan membuka formulir **Tambahkan akun**.

## Menyetujui atau menandatangani {#approve}

Baris akun di atas tombol berbunyi “Menandatangani sebagai” beserta akun yang menandatangani. **Ganti akun** memungkinkan Anda memilih akun lain. Lihat [Berpindah antar akun](/docs/accounts#switch-accounts).

- **Setujui** menandatangani transaksi di peramban Anda dan mengirimkannya ke jaringan Hive. Hasilnya berbunyi “Transaksi berhasil disiarkan” dengan **ID transaksi** yang membuka transaksi itu di penjelajah blok.
- **Tanda tangani** muncul sebagai gantinya ketika permintaan hanya meminta tanda tangan. Hivesigner menandatangani transaksi tanpa mengirimkannya ke jaringan. Ia menyerahkan tanda tangannya ke aplikasi, atau menampilkannya bila permintaan tidak menyebut situs mana pun.

Jika jaringan menolak transaksi itu, Anda melihat “Transaksi Anda tidak disiarkan” beserta “Pesan kesalahan” dari jaringan. Anda dapat mencoba lagi.

## Situs tempat Anda kembali {#return-site}

Ketika permintaan menyebut situs tujuan kembali, pemberitahuan di bagian atas berbunyi “Anda akan dialihkan ke HOST.” Setelah Anda menyetujui, Hivesigner mengarahkan Anda ke sana. Pastikan HOST adalah situs asal Anda.

Ketika permintaan tidak menyebut situs mana pun, Hivesigner tetap berada di halaman hasil.

## Permintaan untuk akun lain {#another-account}

Sebuah permintaan bisa dibuat untuk akun selain akun yang sedang dipilih. Hivesigner menunjukkannya dengan dua cara.

**Permintaan harus ditandatangani akun lain.** Layar berbunyi “Permintaan ini harus ditandatangani oleh @AKUN. Beralihlah ke akun tersebut.” Baris akun berbunyi “Akun yang dipilih” dan daftar akun terbuka di bawahnya. Pilih akun itu, atau tambahkan dengan **Tambahkan akun lain**. Hivesigner tidak menandatangani permintaan itu dengan akun lain mana pun.

**Sebuah operasi bertindak atas nama akun lain.** Ini terjadi pada akun yang dikelola beberapa orang. Peringatan di bagian atas berbunyi “Permintaan ini tidak bertindak atas nama @PENGGUNA, melainkan atas nama @AKUN. Lanjutkan hanya jika Anda juga mengelola akun tersebut.” Perincian setiap kartu menyebut akun yang atas namanya kartu itu bertindak.

## Permintaan yang tidak dapat dibaca Hivesigner {#invalid-requests}

Hivesigner tidak pernah menandatangani permintaan yang tidak dapat dibacanya dan ditampilkannya secara utuh kepada Anda. Itu termasuk operasi yang tidak dikenalnya, permintaan tanpa operasi, nilai yang tidak cocok dengan operasinya (angka yang bukan angka, jumlah yang salah bentuk), dan data tambahan yang tidak dapat ditampilkannya.

Layar lalu berbunyi “Ups, terjadi kesalahan. Data yang diberikan tidak valid.” Kembalilah ke aplikasi. Untuk memberi tahu tim Hivesigner, pilih **Laporkan masalah ini**.

## Permintaan penandatanganan pesan {#message-requests}

Sebagian aplikasi meminta Anda menandatangani pesan, bukan transaksi, misalnya untuk membuktikan bahwa akun itu milik Anda. Pesan adalah teks. Menandatanganinya tidak mengubah apa pun di blockchain.

Layar menampilkan:

- Judul seperti “APLIKASI meminta Anda menandatangani sebuah pesan.” Ketika aplikasi memiliki akun Hive, baris di bawahnya menyebutkannya: “Akun Hive @AKUN_APLIKASI”.
- “Mengarahkan Anda ke HOST”: situs yang menerima tanda tangannya. Baris yang sama muncul lagi di samping tombol.
- **Pesan**: seluruh teksnya, persis seperti yang akan ditandatangani. Karakter yang dapat menyembunyikan teks atau mengubah arahnya ditampilkan sebagai kode yang disorot, seperti `\u{200B}`.
- Kunci yang dipakai: “Akan ditandatangani dengan kunci posting Anda” atau “Akan ditandatangani dengan kunci active Anda”. Hivesigner tidak pernah menandatangani pesan dengan kunci owner.
- Sebuah peringatan: “Tanda tangan Anda membuktikan kepada siapa pun yang melihatnya bahwa @PENGGUNA menandatangani teks persis ini. Tanda tangani hanya pesan yang Anda pahami.”
- Baris akun, “Menandatangani sebagai”, dengan **Ganti akun**.

Pilih **Tanda tangani** untuk menandatangani. Hivesigner mengembalikan Anda ke situs itu beserta tanda tangannya, nama pengguna Anda, jenis kuncinya, dan kunci publik yang membuat tanda tangan tersebut. Kunci publik adalah bagian dari pasangan kunci yang boleh dibagikan: kunci itu tidak dapat menandatangani apa pun.

Pilih **Batal** untuk membuka halaman **Akun**. Situs itu tidak menerima apa pun.

Jika akun tidak memiliki kunci itu di perangkat ini, layar memberi tahu Anda. Misalnya: “Tindakan ini memerlukan kunci posting Anda, tetapi kunci posting @PENGGUNA tidak tersimpan di sini.” Pilih **Ganti akun**, lalu **Tambahkan akun lain**. [Tambahkan kunci yang belum ada](/docs/accounts#add-a-key) untuk akun yang sama. Hivesigner mengembalikan Anda ke permintaan.

### Mengapa sebagian pesan ditolak {#refused-messages}

**Pesan yang berfungsi sebagai proses masuk Hivesigner.** Sebagian teks memiliki bentuk yang persis sama dengan proses masuk Hivesigner. Menandatanganinya akan memberi situs itu akses ke akun Anda. Hivesigner tidak pernah menandatangani teks semacam itu dan menyatakan “Pesan ini adalah token Hivesigner. Menandatanganinya akan memberi situs akses ke akun Anda, jadi pesan ini tidak dapat ditandatangani.”

**Permintaan yang tidak dapat dipakai Hivesigner.** Hivesigner menolak permintaan tanpa pesan atau tanpa alamat pengembalian. Ia juga menolak permintaan untuk kunci selain posting atau active, permintaan yang menyebut aplikasi yang bukan akun Hive, atau permintaan yang alamat pengembaliannya tidak aman atau tidak terdaftar untuk aplikasi itu. Ia menyatakan “Permintaan tanda tangan ini tidak dapat digunakan: diperlukan pesan, kunci posting atau active dan URL pengalihan aman yang terdaftar untuk aplikasi. Kembali ke situs dan coba lagi.”

Jika Hivesigner tidak dapat membaca detail aplikasi dari jaringan Hive, ia menyatakan “Tidak dapat memuat detail akun dari jaringan Hive.” Ia tidak menandatangani apa pun sampai bisa. Pilih **Coba lagi**.

## Menandatangani pesan sendiri {#sign-message}

Anda dapat menandatangani pesan sendiri untuk membuktikan bahwa Anda mengendalikan sebuah akun.

1. Buka [hivesigner.com/signmessage](https://hivesigner.com/signmessage). Bagian kaki situs menautkannya sebagai **Tanda tangani pesan**.
2. Jika akun yang dipilih terkunci, masukkan kode sandinya dan pilih **Buka kunci**. Jika belum ada akun yang dipilih, halaman itu menautkan ke daftar akun Anda.
3. Ketik teksnya di **Pesan**. Hivesigner menghilangkan spasi dan pergantian baris di awal dan akhir.
4. Pilih kuncinya di **Kunci untuk menandatangani**. Di situ tercantum kunci akun terpilih yang ada di perangkat ini, dari yang paling kuat. Yang paling kuat terpilih sejak awal. Gantilah ke **Posting** kecuali Anda memerlukan kunci lain.
5. Pilih **Tanda tangani pesan**.

**Ringkasan tanda tangan** menampilkan **Penulis**, **Otoritas yang digunakan**, sebuah **Token verifikasi**, dan sebuah **Tautan verifikasi**. Token verifikasi memuat pesan, nama pengguna Anda, dan tanda tangannya dalam satu potongan teks. Bagikan tautan atau tokennya kepada pihak yang perlu memeriksa pesan tersebut.

Tanda tangan tidak membocorkan kunci Anda. Namun tanda tangan menunjukkan kunci mana yang membuatnya.

## Memverifikasi sebuah pesan {#verify-message}

1. Buka [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage). Bagian kaki situs menautkannya sebagai **Verifikasi pesan**.
2. Tempelkan tokennya di **Token verifikasi** lalu pilih **Verifikasi tanda tangan**.

Tautan verifikasi membuka halaman ini dan memeriksa pesannya sendiri.

Hasilnya berbunyi “Tanda tangan valid untuk PENGGUNA” atau “Tanda tangan tidak dapat diverifikasi dengan kunci akun.” Di bawahnya, Anda melihat **Penulis**, **Kunci publik hasil pemulihan**, **Otoritas yang cocok** (jenis kunci yang menandatangani), dan **Pesan**.

Hivesigner memeriksa tanda tangan terhadap kunci yang dimiliki akun itu sekarang di jaringan Hive. Pesan yang ditandatangani dengan kunci yang sejak itu sudah diganti akunnya tidak lagi lolos verifikasi.
