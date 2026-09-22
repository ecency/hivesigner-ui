Ketika sebuah aplikasi mengizinkan Anda masuk dengan Hivesigner, aplikasi itu mengarahkan Anda ke hivesigner.com dengan sebuah permintaan. Hivesigner menunjukkan siapa yang meminta, apa yang diminta, dan akun mana milik Anda yang menjawabnya. Anda yang memutuskan di sana. Aplikasi tidak pernah menerima kunci Anda: yang diterimanya adalah bukti atas nama pengguna Anda, yang ditandatangani di peramban Anda.

## Layar permintaan {#request-screen}

Dari atas ke bawah, layar menampilkan:

- **Aplikasinya.** Gambar dan judulnya. Ketika aplikasi meminta akses posting untuk pertama kali, judulnya berbunyi “APLIKASI meminta akses ke akun Anda.” Selain itu judulnya berbunyi “Masuk ke APLIKASI”. Nama di dalamnya dipilih oleh aplikasi.
- **Akun Hive @AKUN_APLIKASI.** Akun Hive yang sebenarnya milik aplikasi itu. Aplikasi boleh menamai dirinya apa saja, tetapi nama ini tidak dapat diubahnya. Periksalah.
- **Mengarahkan Anda ke HOST.** Situs tujuan Hivesigner mengembalikan Anda ketika Anda menyetujui.
- **Cakupan.** Yang diminta aplikasi: [hanya masuk atau akses posting](/docs/signing-in#scopes).
- **Baris akun.** “Mengotorisasi sebagai” atau “Masuk sebagai”, dengan akun yang akan diterima aplikasi dan tautan **Ganti akun**. Lihat [Memilih akun](/docs/signing-in#choose-account).
- **Tombolnya.** **Otorisasi** atau **Masuk**. Jika akunnya terkunci, kolom **Kode sandi** muncul di atasnya, dan satu klik membuka kunci akun lalu melanjutkan.
- **Batal.** Membawa Anda ke halaman **Akun**. Hivesigner tidak mengirim apa pun ke aplikasi.

Jika peramban ini belum memiliki akun, tombolnya berbunyi **Lanjutkan**. Tombol itu membuka formulir **Tambahkan akun** dan mengembalikan Anda ke permintaan setelahnya. Lihat [Menambahkan akun](/docs/accounts#add-account).

## Hanya masuk atau akses posting {#scopes}

Aplikasi meminta salah satu dari dua hal ini. Tidak ada yang di antaranya.

### Hanya masuk {#sign-in-only}

**Cakupan** menampilkan “Melihat nama pengguna akun Anda”. Aplikasi mengetahui Anda adalah akun Hive yang mana, dikuatkan oleh tanda tangan Anda. Aplikasi tidak mendapat izin apa pun untuk bertindak atas nama Anda. Tombolnya berbunyi **Masuk**.

Situs yang tidak memiliki akun Hive sendiri juga dapat meminta Anda masuk. Layarnya berbunyi “HOST ingin mengonfirmasi nama pengguna Hive Anda.” Permintaan seperti itu selalu hanya untuk masuk. Hivesigner menyebut situs tersebut dengan alamatnya, karena alamat itulah satu-satunya hal yang dapat Anda periksa tentangnya.

### Akses posting {#posting-access}

**Cakupan** menampilkan “Dengan otoritas posting Anda, APLIKASI akan dapat:” diikuti penjelasan artinya:

- **Memposting dan berkomentar:** menerbitkan postingan dan komentar atas nama Anda.
- **Memberi vote:** memberi upvote dan downvote dengan akun Anda.
- **Mengikuti dan memperbarui beranda Anda:** mengikuti, membisukan, dan memposting ulang atas nama Anda.

Otoritas posting adalah bagian dari akun Hive Anda yang mengatur tindakan sehari-hari. Menyetujui berarti menambahkan akun Hive milik aplikasi ke otoritas posting Anda. Itu satu pemberian izin di blockchain Hive, bukan daftar izin yang terpisah-pisah.

## Apa yang diizinkan oleh akses posting {#what-posting-access-allows}

Dengan akses posting, aplikasi dapat melakukan sebagai Anda apa pun yang dapat dilakukan kunci posting Anda:

- menerbitkan, menyunting, dan menghapus postingan serta komentar Anda
- memberi vote
- mengikuti, membisukan, dan memposting ulang
- menyunting profil Anda
- mengklaim imbalan Anda ke dompet Anda sendiri
- tindakan sehari-hari lain yang dipakai aplikasi dan permainan di Hive

Aplikasi tidak pernah dapat:

- memindahkan dana Anda: mengirim HIVE atau HBD, power up atau power down, mendelegasikan Hive Power, atau memakai tabungan Anda
- mengubah kunci Anda atau siapa yang mengendalikan akun Anda
- memberikan akses kepada aplikasi lain

> **Peringatan:** Otorisasi hanya aplikasi yang Anda percaya. Akses posting berlaku sampai Anda mencabutnya. Akses itu tersimpan di blockchain Hive, bukan di Hivesigner: menghapus akun dari Hivesigner tidak mengakhirinya.

## Pertama kali Anda mengotorisasi aplikasi {#first-time}

Pertama kali Anda memberi sebuah aplikasi akses posting, layar menampilkan pemberitahuan ini: “Otorisasi pertama kali: tindakan ini menambahkan @AKUN_APLIKASI ke otoritas posting Anda secara on-chain dan memerlukan kunci active Anda satu kali. Akun tersebut akan dapat memposting sebagai Anda sampai Anda mencabut izinnya.”

Mengubah siapa yang boleh memposting untuk akun Anda adalah perubahan pada akun itu sendiri, jadi diperlukan kunci active Anda. Jika perangkat ini tidak memilikinya, layar memintanya di tempat:

1. Tempelkan kunci active Anda di **Kunci active atau kata sandi master untuk @PENGGUNA**. Hivesigner memeriksanya terhadap akun Anda di jaringan Hive lalu menyimpannya di perangkat ini bersama kunci Anda yang lain. Jika Anda menempelkan kata sandi master, Hivesigner hanya menyimpan kunci active darinya, ditambah kunci posting bila perangkat ini belum memilikinya.
2. Jika akun belum punya kode sandi, formulir menawarkan **Lindungi dengan kode sandi (disarankan)**, tercentang secara bawaan. Jika akun sudah punya dan Hivesigner memerlukannya lagi, formulir memintanya di **Kode sandi untuk @PENGGUNA**.
3. Pilih **Tambahkan kunci active**, lalu **Otorisasi**.

Hivesigner lalu mengirim perubahan itu ke jaringan Hive dari peramban Anda. Ia menunggu sampai perubahan tersebut tampak di blockchain sebelum mengembalikan Anda ke aplikasi dalam keadaan sudah masuk. Jika terlalu lama, Anda melihat “Otorisasi sudah dikirim tetapi masih menunggu konfirmasi. Silakan coba lagi sebentar lagi.”

Setelah itu kunci active tetap di perangkat ini. Untuk hanya menyimpan kunci posting di sini, lihat [Tambahkan hanya kunci yang Anda perlukan](/docs/safety#only-the-keys-you-need).

## Mengotorisasi aplikasi dari direktori {#directory}

Setiap aplikasi di [hivesigner.com/apps](https://hivesigner.com/apps) membuka halaman berjudul “Otorisasi @AKUN_APLIKASI”. Halaman itu menampilkan apa yang diterbitkan aplikasi tentang dirinya dan kalimat “@AKUN_APLIKASI akan dapat memposting, berkomentar, memberi vote, dan mengikuti sebagai @PENGGUNA.”

Memilih **Otorisasi** langsung memberi aplikasi akses posting, sebagaimana layar otorisasi pertama kali. Tindakan itu memerlukan kunci active Anda. Tidak ada aplikasi yang memintanya, jadi gunakan hanya bila memang Anda bermaksud demikian. **Batal** membawa Anda ke halaman **Akun**.

Jika akun Anda sudah memberi aplikasi itu akses posting, halaman menampilkan “@AKUN_APLIKASI telah diotorisasi.” dan menawarkan **Lanjutkan**.

## Kembali ke sebuah aplikasi {#coming-back}

Jika akun Anda sudah memberi aplikasi itu akses posting, tidak ada izin baru yang diberikan. Layarnya lebih ringkas:

- Judulnya berbunyi “Masuk ke APLIKASI”.
- Sebuah baris menyatakan “Anda sudah pernah mengotorisasi @AKUN_APLIKASI. Tidak ada izin baru yang diberikan.”
- Baris akun berbunyi “Masuk sebagai”.
- Tombolnya berbunyi **Masuk**.

Untuk ini Anda hanya memerlukan kunci posting (atau kunci active). Jika sementara itu Anda mencabut izin aplikasi, layar otorisasi pertama kali muncul lagi.

## Memilih akun {#choose-account}

Baris akun menyebut akun yang akan diterima aplikasi. Periksalah sebelum menyetujui, terutama bila Anda punya beberapa akun di perangkat ini.

- Pilih **Ganti akun** untuk membuka daftar akun Anda di tempat. Pilih akun lain dan layar berganti ke akun itu.
- Pilih **Tambahkan akun lain** di bawah daftar untuk menambahkan akun yang belum ada di perangkat ini. Hivesigner mengembalikan Anda ke permintaan setelahnya.

Aplikasi dapat menyarankan akun mana yang dipakai. Jika akun itu ada di perangkat ini, Hivesigner memilihnya. Anda tetap dapat menggantinya.

## Ketika Hivesigner menolak sebuah permintaan {#refused-requests}

Hivesigner tidak membiarkan Anda menyetujui permintaan yang tidak dapat diperiksanya. Sebagai gantinya, layar menampilkan salah satu pesan berikut:

| Pesan | Artinya |
| --- | --- |
| “URL pengalihan aplikasi ini tidak terdaftar. Demi keamanan Anda, proses masuk diblokir.” | Alamat pengembalian bukan salah satu yang didaftarkan aplikasi pada akun Hive-nya. |
| “@AKUN_APLIKASI bukan akun Hive, jadi tidak ada aplikasi yang dapat diotorisasi. Kembali ke situs tersebut dan coba lagi.” | Permintaan itu menyebut aplikasi yang tidak ada. |
| “Situs ini meminta agar data login Anda dikirim melalui alamat http:// biasa. Hivesigner hanya mengirimkannya melalui https. Minta situs tersebut menggunakan alamat yang aman.” | Alamat pengembaliannya tidak aman. |
| “Situs ini meminta agar data login Anda dikirim ke alamat yang bukan URL web. Kembali ke situs tersebut dan coba lagi.” | Alamat pengembaliannya bukan alamat web. |
| “Permintaan otorisasi ini tidak lengkap: tidak menyebutkan aplikasi atau URL pengalihan. Kembali ke aplikasi tersebut dan coba lagi.” | Ada bagian yang hilang dari permintaan itu. |

Kembalilah ke aplikasi dan coba lagi. Jika masalahnya berlanjut, pilih **Laporkan masalah ini**. Tautan dan catatan opsional Anda akan dikirim ke tim Hivesigner, dengan bagian rahasianya disamarkan.

Jika Hivesigner tidak dapat menjangkau jaringan Hive, ia menampilkan “Tidak dapat memuat detail akun dari jaringan Hive.” Pilih **Coba lagi**.

## Melihat dan mencabut akses aplikasi {#remove-access}

1. Buka [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps). Bagian kaki situs menautkannya sebagai **Aplikasi yang diotorisasi**.
2. Halaman itu menampilkan “Aplikasi yang dapat memposting sebagai @PENGGUNA.” untuk akun yang dipilih, dengan setiap aplikasi di bawahnya. Untuk melihat aplikasi akun lain, pilih dulu akun itu di halaman **Akun**.
3. Jika akunnya terkunci, masukkan kode sandinya dan pilih **Buka kunci**.
4. Pilih **Cabut** di samping aplikasi tersebut. Bila kunci active ada di perangkat ini, akses aplikasi langsung dicabut.

Daftar itu menampilkan setiap akun yang dapat memposting sebagai akun Anda secara mandiri, termasuk akun yang Anda tambahkan dengan alat lain.

Mencabut izin adalah perubahan pada akun Anda di blockchain Hive, jadi memerlukan kunci active Anda satu kali. Jika perangkat ini tidak memilikinya, **Cabut** membuka halaman untuk aplikasi itu (“Cabut izin @AKUN_APLIKASI”) yang meminta kunci active di tempat. Halaman itu menyatakan “@AKUN_APLIKASI tidak akan dapat lagi bertindak sebagai @PENGGUNA.” Tambahkan kuncinya, lalu pilih **Cabut**.

Ketika Anda mencabut izin sebuah aplikasi, Hivesigner mengeluarkan akun aplikasi itu dari otoritas posting akun Anda (dan dari otoritas active-nya, bila ada di sana). Sejak saat itu aplikasi tidak dapat lagi memposting, memberi vote, atau bertindak sebagai Anda. Jika nanti aplikasi itu meminta akses posting lagi, Anda melihat layar otorisasi pertama kali.

Mencabut izin tidak mengeluarkan Anda dari situs web aplikasi itu sendiri. Keluarlah dari sana juga jika Anda mau.
