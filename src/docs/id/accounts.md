Hivesigner menandatangani dengan kunci dari akun Hive yang Anda tambahkan ke dalamnya. Anda menambahkan sebuah akun satu kali di setiap peramban yang Anda gunakan. Setelah itu Hivesigner menyimpan kunci akun tersebut di peramban itu, terenkripsi dengan kode sandi jika Anda menyetelnya.

## Menambahkan akun {#add-account}

1. Pastikan bilah alamat peramban Anda menampilkan `https://hivesigner.com`. Lihat [Periksa alamatnya lebih dulu](/docs/safety#check-the-address).
2. Buka [hivesigner.com/import](https://hivesigner.com/import). Jika peramban ini belum memiliki akun, tombol **Siapkan Hivesigner** di halaman depan membuka formulir yang sama.
3. Pada **Nama pengguna**, masukkan nama pengguna Hive Anda dengan huruf kecil, tanpa `@`.
4. Pada **Kunci privat**, tempelkan salah satu kunci privat Anda. Baca dulu [Kunci mana yang ditambahkan](/docs/accounts#which-key).
5. Biarkan **Lindungi dengan kode sandi (disarankan)** tetap tercentang dan pilih sebuah **Kode sandi**. Panjangnya minimal 4 karakter. Lihat [Lindungi dengan kode sandi](/docs/accounts#passcode).
6. Pilih **Tambahkan akun**.

Hivesigner memeriksa kunci itu terhadap akun Anda di jaringan Hive sebelum menyimpan apa pun. Ia membandingkan bagian publik dari kunci dengan kunci yang terdaftar pada akun Anda. Kunci privatnya sendiri tidak dikirim ke mana pun. Jika nama penggunanya bukan akun Hive, atau kuncinya bukan milik akun itu, formulir menampilkan “Nama pengguna atau kunci tidak valid. Gunakan kata sandi master Anda atau kunci owner, active, posting, atau memo Anda.”

Akun yang Anda tambahkan menjadi akun yang dipilih: akun yang dipakai Hivesigner di layar-layarnya. Jika Anda tiba di formulir ini dari sebuah permintaan, Hivesigner mengembalikan Anda ke permintaan itu. Jika tidak, ia membuka halaman **Akun**.

### Menambahkan kunci lain ke sebuah akun {#add-a-key}

Untuk menambahkan kunci kedua pada akun yang sudah ada di sini (misalnya kunci active di samping kunci posting), tambahkan akun itu lagi dengan kunci yang baru. Hivesigner mempertahankan kunci yang sudah ada dan menambahkan yang baru. Kunci baru untuk jenis yang sudah ada akan menggantikan yang lama.

Jika akun itu memiliki kode sandi, biarkan **Lindungi dengan kode sandi (disarankan)** tetap tercentang dan masukkan kode sandi yang sama. Hivesigner menolak selain itu:

- Tanpa kode sandi, formulir menampilkan “Akun ini terlindungi di perangkat ini. Masukkan kode sandinya untuk menambahkan kunci.”
- Dengan kode sandi yang berbeda, ia menampilkan “Kode sandi salah. Kunci tidak disimpan.”

## Kunci mana yang ditambahkan {#which-key}

Sebuah akun Hive memiliki beberapa kunci privat. Masing-masing mengizinkan tindakan yang berbeda. Anda mendapatkannya dari dompet atau aplikasi yang membuat akun Hive Anda, biasanya di halaman kunci atau kata sandinya. Hivesigner tidak dapat menunjukkannya kepada Anda.

| Kunci | Kegunaannya di Hivesigner |
| --- | --- |
| Posting | Masuk ke aplikasi, memberi vote, memposting dan berkomentar, mengikuti, menyunting profil, dan mengklaim imbalan Anda. |
| Active | Tindakan dompet seperti transfer, power up atau power down, delegasi, tabungan, dan konversi. Vote untuk witness dan proposal. Mengotorisasi aplikasi pertama kali dan mencabut izin aplikasi. |
| Owner | Mengubah kunci owner atau akun pemulihan Anda. Sehari-hari Anda tidak membutuhkannya. |
| Memo | Tidak ada. Formulir menerimanya, tetapi akun yang hanya punya kunci memo tidak dapat masuk: layar permintaan lalu menampilkan “Tambahkan kunci posting atau active untuk @PENGGUNA agar dapat melanjutkan”. |

Tambahkan kunci posting untuk penggunaan sehari-hari. Tambahkan kunci active hanya saat Anda memerlukannya untuk tindakan dompet atau untuk mengotorisasi aplikasi pertama kali. Ketika sebuah layar memerlukan kunci yang tidak ada di perangkat ini, layar itu memberi tahu Anda dan memungkinkan Anda menambahkannya.

Kata sandi master Anda juga berfungsi di kolom **Kunci privat**. Hivesigner menurunkan kunci-kunci Anda darinya dan menyimpan setiap kunci yang masih cocok dengan akun Anda, termasuk kunci owner. Menambahkan kunci satu per satu membuat kunci owner tidak ikut masuk ke perangkat ini.

> **Catatan:** Hivesigner menandatangani setiap transaksi persis dengan kunci yang diperlukan. Ini mengikuti aturan Hive yang berlaku sejak hard fork pada 2025. Kunci active tidak lagi dapat menandatangani tindakan tingkat posting seperti vote. Kunci owner tidak lagi dapat menandatangani tindakan dompet. Tambahkan kunci posting meski kunci active sudah ada di sini.

Masuk ke sebuah aplikasi berbeda: itu bukan transaksi. Hivesigner memasukkan Anda dengan kunci posting, atau dengan kunci active ketika perangkat ini tidak memiliki kunci posting untuk akun tersebut.

## Lindungi dengan kode sandi {#passcode}

Kode sandi adalah kata sandi yang Anda pilih khusus untuk peramban ini. Itu bukan kata sandi Hive Anda dan bukan salah satu kunci Anda. Hivesigner memakainya untuk mengenkripsi kunci akun sebelum menyimpannya, lalu memintanya lagi untuk membukanya.

- Hivesigner tidak menyimpan kode sandi Anda dan tidak mengirimkannya ke mana pun. Tidak ada yang dapat memulihkannya untuk Anda.
- Setiap akun di perangkat ini punya kode sandinya sendiri. Anda boleh memakai kode yang sama untuk semuanya.
- Kode sandi yang lebih panjang lebih sulit ditebak. Jangan gunakan kata sandi master Hive atau salah satu kunci Anda sebagai kode sandi.

Tanpa kode sandi, Hivesigner menyimpan kunci akun di peramban ini tanpa enkripsi. Hivesigner membukanya sendiri setiap kali dijalankan, sehingga siapa pun yang memakai peramban ini dapat menandatangani dengan kunci itu. Halaman **Akun** menandai akun seperti itu dengan **Tanpa kode sandi**.

Untuk menambahkan kode sandi pada akun yang belum punya, tambahkan akun itu lagi dengan salah satu kuncinya dan sebuah kode sandi. Hivesigner lalu mengenkripsi semua kunci akun tersebut dengan kode sandi itu.

Untuk mengganti kode sandi, [hapus akunnya](/docs/accounts#remove-account) lalu tambahkan lagi dengan kode sandi yang baru. Menghapus akan menghilangkan semua kunci akun itu dari peramban ini, jadi tambahkan kembali setiap kunci (kunci posting, lalu kunci active jika Anda memakainya).

## Membuka kunci akun {#unlock}

Akun yang memiliki kode sandi selalu terkunci setiap kali Hivesigner dibuka: di tab baru, setelah dimuat ulang, atau ketika sebuah aplikasi mengarahkan Anda ke sana. Anda tidak perlu membukanya lebih dulu. Layar yang memerlukan kunci menampilkan kolom **Kode sandi** di atas tombolnya sendiri (misalnya **Masuk**, **Setujui**, atau **Buka kunci**). Satu klik membuka kunci akun dan melanjutkan.

Kode sandi yang salah menampilkan “Kode sandi salah.” dan tidak ada yang ditandatangani.

Hivesigner menyimpan kunci yang sudah terbuka hanya di memori, tidak pernah di penyimpanan. Akun tetap terbuka di tab itu sampai Anda menutup atau memuat ulang tab tersebut.

## Berpindah antar akun {#switch-accounts}

Halaman **Akun** memuat akun di perangkat ini dari A sampai Z. Akun yang dipilih diberi tanda centang. Mulai dari 6 akun, kolom **Cari akun** menyaring daftarnya.

Pilih sebuah akun untuk menjadikannya akun yang dipilih. Di sini Hivesigner tidak meminta kode sandi. Yang memintanya adalah layar yang memerlukan kunci.

Pada layar permintaan, baris yang menyebut akun (“Masuk sebagai”, “Mengotorisasi sebagai”, atau “Menandatangani sebagai”) memiliki tautan **Ganti akun**. Tautan itu membuka daftar yang sama di tempat, sehingga Anda dapat memilih akun lain tanpa meninggalkan permintaan. **Tambahkan akun lain** di bawah daftar membuka formulir **Tambahkan akun** dan mengembalikan Anda ke permintaan setelahnya.

## Menghapus akun {#remove-account}

1. Buka halaman **Akun**.
2. Pilih **✕** di samping akun tersebut. Labelnya untuk pembaca layar adalah **Hapus dari Hivesigner @PENGGUNA**.
3. Konfirmasi saat peramban bertanya “Hapus @PENGGUNA dari perangkat ini? Kunci akun ini yang tersimpan di sini akan dihapus.”

Menghapus akun hanya menghilangkan kuncinya dari peramban ini. Akun Hive Anda tidak berubah. Aplikasi yang Anda otorisasi tetap memegang aksesnya, karena akses itu tersimpan di blockchain Hive. Untuk mencabutnya, lihat [Melihat dan mencabut akses aplikasi](/docs/signing-in#remove-access).

Jika Anda menghapus akun yang sedang dipilih, akun lain di perangkat ini menjadi akun yang dipilih.

Jika peramban tidak mengizinkan Hivesigner menyimpan perubahan, Anda melihat “Hanya dihapus untuk sesi ini: penyimpanan tidak tersedia, sehingga akun ini akan muncul kembali saat Anda memuat ulang halaman.”

## Jika Anda lupa kode sandi {#forgotten-passcode}

Tidak ada yang dapat memulihkan kode sandi, termasuk Hivesigner. Akun Hive Anda tidak terpengaruh: kode sandi hanya melindungi salinan kunci Anda di peramban ini.

1. [Hapus akun itu](/docs/accounts#remove-account) dari perangkat ini.
2. [Tambahkan lagi](/docs/accounts#add-account) dengan kuncinya dan kode sandi baru.

Tidak ada yang berubah di blockchain Hive. Aplikasi yang Anda otorisasi tetap memegang aksesnya.

## Tempat kunci Anda disimpan {#where-keys-are-stored}

Hivesigner menyimpan kunci Anda hanya di peramban ini, di perangkat ini, pada penyimpanan yang disediakan peramban untuk hivesigner.com.

- Kunci itu tidak disinkronkan. Peramban lain, profil peramban lain, atau perangkat lain tidak memilikinya. Tambahkan akun di sana juga.
- Menghapus data situs atau data penjelajahan untuk hivesigner.com akan menghapusnya. Begitu pula menutup jendela penyamaran.
- Hivesigner bukan cadangan. Simpan kunci atau kata sandi master Anda dengan aman di tempat lain.
