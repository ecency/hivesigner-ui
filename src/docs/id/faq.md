Jawaban singkat untuk pertanyaan yang sering diajukan. Setiap jawaban menautkan ke halaman yang memuat perinciannya.

## Menggunakan Hivesigner {#using-hivesigner}

### Apakah Hivesigner gratis? {#is-it-free}

Ya. Hivesigner tidak memungut biaya dari pengguna maupun aplikasi. Kode sumbernya terbuka di bawah lisensi MIT.

### Apakah Hivesigner pernah melihat kunci saya? {#keys}

Tidak. Kunci Anda tetap berada di peramban pada perangkat Anda. Hivesigner menandatangani di sana. Kunci itu tidak pernah dikirim ke server Hivesigner maupun ke aplikasi yang Anda gunakan. Lihat [Tempat kunci Anda disimpan](/docs/accounts#where-keys-are-stored) dan [Menjaga kunci Anda tetap aman](/docs/safety).

### Bagaimana jika saya lupa kode sandi? {#forgotten-passcode}

Tidak ada yang dapat memulihkan kode sandi, termasuk Hivesigner. Hapus akun itu dari Hivesigner lalu tambahkan lagi dengan kunci Hive Anda dan kode sandi baru. Akun Hive Anda dan aplikasi yang Anda otorisasi tidak berubah. Lihat [Jika Anda lupa kode sandi](/docs/accounts#forgotten-passcode).

### Bisakah saya memakai Hivesigner di ponsel? {#phone}

Bisa. Buka https://hivesigner.com di peramban ponsel Anda dan tambahkan akun Anda di sana. Kunci Anda hanya tersimpan di peramban itu, jadi tambahkan akun di setiap perangkat yang Anda gunakan. Lihat [Menambahkan dan mengelola akun](/docs/accounts).

### Aplikasi apa saja yang memakai Hivesigner? {#which-apps}

https://hivesigner.com/apps memuat daftar aplikasi yang menyiarkan transaksi ke Hive melalui Hivesigner, diurutkan dari yang paling banyak digunakan. Setiap aplikasi menerbitkan sendiri nama dan deskripsinya. Hivesigner tidak memverifikasinya. Membuka sebuah aplikasi di sana menampilkan halaman yang dapat memberinya akses posting. Lihat [Mengotorisasi aplikasi dari direktori](/docs/signing-in#directory).

### Apa hubungan Hivesigner dengan Hive Keychain? {#hive-keychain}

Keduanya alat yang terpisah. Hive Keychain adalah ekstensi peramban dan aplikasi ponsel. Hivesigner adalah situs web, jadi tidak ada yang perlu dipasang. Ketika sebuah aplikasi meminta Anda menandatangani pesan, tanda tangannya sejenis dengan yang dibuat Hive Keychain, sehingga aplikasi memeriksa keduanya dengan kode yang sama. Token verifikasi dari halaman **Tanda tangani pesan** milik Hivesigner diperiksa di halaman **Verifikasi pesan** milik Hivesigner. Lihat [Penandatanganan pesan](/docs/message-signing).

## Membangun dengan Hivesigner {#building}

### Bisakah saya memakai Hivesigner di aplikasi ponsel? {#mobile-app}

Bisa. Arahkan pengguna ke Hivesigner di peramban dan gunakan callback yang dapat diterima aplikasi Anda: tautan https yang Anda miliki (Android App Links atau iOS Universal Links) atau alamat loopback seperti `http://127.0.0.1/auth`. Skema khusus seperti `myapp://` ditolak. Lihat [Aplikasi ponsel dan desktop](/docs/register-app#native-apps).

### Apakah saya perlu akun aplikasi? {#app-account}

Anda memerlukannya untuk memasukkan pengguna dengan akses posting dan untuk menyiarkan transaksi melalui API. Lihat [Mendaftarkan aplikasi Anda](/docs/register-app). [Tautan tanda tangan](/docs/sign-links) dan [penandatanganan pesan](/docs/message-signing) berfungsi tanpa akun aplikasi. Begitu pula [masuk tanpa akses posting](/docs/login-only).

### Bisakah API mengirim transfer? {#transfers}

Tidak. API hanya menyiarkan operasi tingkat posting, seperti vote, komentar, dan mengikuti. Untuk transfer dan tindakan lain yang memerlukan kunci active, gunakan [tautan tanda tangan](/docs/sign-links): pengguna menyetujui masing-masing dengan kuncinya sendiri.

### Bahasa apa saja yang punya SDK? {#languages}

SDK resmi tersedia untuk JavaScript. Ada pustaka komunitas untuk Python. Bahasa apa pun dapat memanggil REST API. Lihat [SDK](/docs/sdk) dan [REST API](/docs/api).

## Bantuan {#help}

### Ke mana saya bisa meminta bantuan? {#get-help}

Bertanyalah di server Discord HiveDevs: https://discord.gg/pNJn7wh. Laporkan bug sebagai issue di repositori GitHub yang bersangkutan: https://github.com/ecency/hivesigner-ui untuk situsnya, https://github.com/ecency/hivesigner-api untuk API-nya, atau https://github.com/ecency/hivesigner-sdk untuk SDK JavaScript. Pada layar yang menolak sebuah permintaan, **Laporkan masalah ini** mengirimkan masalah tersebut kepada tim Hivesigner.

### Bagaimana saya bisa berkontribusi? {#contribute}

Hivesigner bersifat sumber terbuka di GitHub, pada ketiga repositori di atas. Buat issue berisi bug atau gagasan. Kirim pull request berisi perbaikan.
