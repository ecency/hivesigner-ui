Kunci Hive Anda mengendalikan akun Anda. Siapa pun yang memilikinya dapat bertindak sebagai Anda. Hivesigner menyimpannya di peramban Anda dan menunjukkan apa yang Anda tanda tangani. Kebiasaan berikut menjaganya tetap aman.

## Periksa alamatnya lebih dulu {#check-the-address}

Sebelum mengetikkan kunci atau kode sandi, lihat bilah alamat peramban Anda. Bilah itu harus menampilkan `https://hivesigner.com`.

- Halaman palsu meniru tampilan Hivesigner, bukan alamatnya. Baca alamatnya sampai habis: `hivesigner.com.example.net` bukan hivesigner.com.
- Perhatikan adanya kata tambahan, huruf yang hilang atau tertukar, atau akhiran yang berbeda.
- Hivesigner menampilkan alamat tempat ia berjalan di bilah atasnya. Halaman palsu bisa menuliskan teks apa pun di sana, jadi percayalah pada bilah alamat peramban.
- Untuk menambahkan kunci, ketik sendiri alamatnya atau gunakan markah buku. Jangan mengikuti tautan dari pesan, iklan, atau hasil pencarian.

## Yang tidak pernah perlu Anda berikan {#never-needed}

- Masuk, memposting, memberi vote, tindakan dompet, dan mengotorisasi aplikasi tidak pernah memerlukan kata sandi master atau kunci owner Anda. Lihat [Kunci mana yang ditambahkan](/docs/accounts#which-key).
- Aplikasi yang menggunakan Hivesigner tidak pernah membutuhkan kunci Anda. Aplikasi mengarahkan Anda ke hivesigner.com. Kunci Anda tetap di peramban Anda. Situs yang meminta Anda mengetikkan kunci di halamannya sendiri tidak sedang bertanya melalui Hivesigner.
- Jangan pernah memberikan kunci atau kode sandi Anda kepada siapa pun yang memintanya, baik lewat obrolan, email, maupun permintaan dukungan.

## Tambahkan hanya kunci yang Anda perlukan {#only-the-keys-you-need}

- Tambahkan kunci posting untuk penggunaan sehari-hari.
- Tambahkan kunci active hanya untuk tindakan dompet, untuk mengotorisasi aplikasi pertama kali, atau untuk mencabut izin aplikasi.
- Hindari menambahkan kata sandi master Anda. Jika Anda menambahkannya, Hivesigner menyimpan setiap kunci yang dihasilkannya, termasuk kunci owner.

Setelah Anda mengotorisasi aplikasi untuk pertama kali, kunci active tetap berada di perangkat ini. Untuk hanya menyimpan kunci posting di sini, [hapus akunnya](/docs/accounts#remove-account). Lalu [tambahkan lagi](/docs/accounts#add-account) hanya dengan kunci posting.

## Gunakan kode sandi {#use-a-passcode}

Tanpa kode sandi, Hivesigner menyimpan kunci Anda di peramban ini tanpa enkripsi. Hivesigner membukanya sendiri setiap kali dijalankan, sehingga siapa pun yang memakai peramban ini dapat menandatangani sebagai Anda. Halaman **Akun** menandai akun seperti itu dengan **Tanpa kode sandi**.

- Pilih kode sandi yang tidak dapat ditebak orang lain. Hivesigner menerima 4 karakter atau lebih. Makin panjang, makin sulit ditebak.
- Jangan gunakan kata sandi master Hive atau salah satu kunci Anda sebagai kode sandi.

Di komputer yang juga dipakai orang lain:

- Selalu gunakan kode sandi.
- Tutup tab Hivesigner setelah selesai. Akun yang sudah dibuka kuncinya tetap terbuka di tab itu sampai Anda menutup atau memuat ulang tab tersebut.
- Di komputer yang bukan milik Anda, [hapus akunnya](/docs/accounts#remove-account) sebelum pergi. Lebih baik lagi, jangan menambahkan kunci Anda di sana sama sekali.

## Baca sebelum menyetujui {#read-before-approving}

- **Periksa akunnya.** Baris yang berbunyi “Masuk sebagai”, “Mengotorisasi sebagai”, atau “Menandatangani sebagai” menyebut akun yang menjawab permintaan. Ganti jika akunnya keliru.
- **Periksa ke mana Anda akan diarahkan.** “Mengarahkan Anda ke HOST” dan “Anda akan dialihkan ke HOST.” menyebut situs yang menerima hasilnya. Situs itu harus sama dengan situs asal Anda.
- **Periksa siapa yang meminta.** Aplikasi memilih sendiri nama tampilannya. Baris “Akun Hive @AKUN_APLIKASI” menunjukkan akun Hive yang sebenarnya. Di halaman untuk mengotorisasi atau mencabut izin aplikasi, Hivesigner menyatakan tentang profil aplikasi: “Semua informasi di atas dipublikasikan oleh akun aplikasi itu sendiri. Hivesigner tidak memverifikasi satu pun darinya.”
- **Periksa kuncinya.** Vote, postingan, atau mengikuti memerlukan kunci posting. Jika Anda bermaksud memberi vote tetapi layar meminta kunci active atau owner, permintaan itu melakukan hal lain. Berhentilah.
- **Baca perubahan otoritas.** “kunci: TIDAK ADA (kunci Anda akan dihapus)” berarti perubahan itu akan mengeluarkan kunci Anda dari akun Anda. Setujui perubahan pada kunci Anda hanya jika Anda sendiri yang memulainya.
- **Baca peringatannya.** “Permintaan ini tidak bertindak atas nama @PENGGUNA, melainkan atas nama @AKUN.” berarti permintaan itu bertindak untuk akun lain.
- **Tanda tangani hanya pesan yang Anda pahami.** Pesan yang ditandatangani membuktikan kepada siapa pun bahwa Anda menandatangani teks persis itu.

Lihat [Meninjau dan menandatangani](/docs/signing) untuk semua yang ditampilkan layar penandatanganan.

## Mengenali halaman palsu {#spot-a-fake-page}

Halaman yang tampak seperti Hivesigner itu palsu jika:

- **Alamatnya bukan hivesigner.com.** Inilah satu-satunya tanda yang selalu berlaku.
- **Halaman itu menolak kunci posting Anda.** Hivesigner yang asli menerima kunci posting dan memakainya untuk memasukkan Anda. Halaman yang bersikeras meminta kata sandi master atau kunci owner bukanlah Hivesigner.
- **Halaman itu tidak mengenal akun yang Anda tambahkan.** Peramban memisahkan penyimpanan setiap situs. Situs palsu di alamat lain tidak dapat melihat akun yang Anda tambahkan di hivesigner.com, jadi ia meminta kunci lagi. Hivesigner yang asli mengingatnya di peramban ini dan hanya meminta kode sandi, jika Anda menyetelnya. Hivesigner meminta kunci hanya ketika sebuah permintaan memerlukan kunci yang tidak ada di perangkat ini, dan saat itu ia menyebutkan kuncinya. Misalnya: “Tindakan ini memerlukan kunci active Anda, tetapi kunci active @PENGGUNA tidak tersimpan di sini.”

Peramban baru atau perangkat baru juga tidak memiliki akun Anda. Di sana, periksa alamatnya sebelum menambahkan akun.

Jika Anda pernah mengetikkan kunci di halaman palsu, anggap kunci itu sudah dicuri. Gantilah di Hive secepat mungkin.

## Kodenya bersifat sumber terbuka {#open-source}

Kode Hivesigner terbuka untuk umum di [github.com/ecency/hivesigner-ui](https://github.com/ecency/hivesigner-ui). Siapa pun dapat membacanya dan memeriksa bagaimana kunci Anda diperlakukan. Untuk melaporkan masalah, buat issue di [github.com/ecency/hivesigner-ui/issues](https://github.com/ecency/hivesigner-ui/issues). Halaman **Tentang** menautkannya sebagai **Laporkan bug**.
