API Hivesigner berada di `https://hivesigner.com/api/`. API ini mengembalikan akun orang yang sudah masuk, menyiarkan operasi posting untuknya, menukar kode dengan token dan mendaftar aplikasi yang memakai Hivesigner. Halaman ini menjelaskan tiap titik akhir beserta permintaan, jawaban dan galatnya.

## Permintaan dan autentikasi {#authentication}

- **URL dasar:** `https://hivesigner.com/api/`. Tiap titik akhir di bawah bersifat relatif terhadap `https://hivesigner.com`.
- **Tokennya:** kirim apa adanya sebagai tajuk `Authorization`: `Authorization: ACCESS_TOKEN`. Awalan `Bearer ` juga diterima. Anda juga dapat mengirimnya sebagai `access_token` di rangkaian kueri atau di badan, tetapi tajuk menjauhkannya dari URL dan log.
- **Badan:** JSON dengan `Content-Type: application/json`, atau sebuah formulir (`application/x-www-form-urlencoded`).
- **Jawaban:** JSON.
- **Peramban:** API mengizinkan permintaan lintas asal, jadi aplikasi web dapat memanggilnya langsung.

Untuk mendapatkan token, lihat [Masuk dengan OAuth2](/docs/oauth2). Untuk isi sebuah token, lihat [Token](/docs/tokens).

## Galat {#errors}

Jawaban galat punya status galat HTTP dan badan ini:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Status | `error` | Kapan |
| --- | --- | --- |
| 401 | `invalid_grant` | Token tidak ada atau tidak sah, atau jenisnya salah untuk titik akhir ini ("The token has invalid role"). Di `/api/oauth2/token`, juga "The code or secret is not valid". |
| 401 | `invalid_scope` | `/api/broadcast`: operasi yang tidak diizinkan token. Keterangannya menyebut operasi-operasi itu. |
| 401 | `unauthorized_client` | `/api/broadcast`: operasi yang penulisnya bukan orang pemilik token, sebuah `account_update2` yang menyentuh kunci, izin otoritas posting yang belum ada, atau akun yang gagal dimuat. Keterangannya menyebut yang mana. |
| 500 | `server_error` | `/api/broadcast`: jaringan Hive menolak transaksinya. `error_description` membawa pesan dari jaringan. |
| 503 | `unavailable` | `/api/apps`: direktorinya masih dibangun. |

## GET /api/me {#me}

Mengembalikan akun pemilik token. Pakai ini untuk mengetahui siapa yang masuk, atau untuk [memeriksa sebuah token](/docs/tokens#check-with-the-api).

- **Metode:** `GET` atau `POST`.
- **Token:** sebuah token akses, termasuk token `login` yang menyebut sebuah aplikasi.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Jawabannya, dipendekkan:

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| Ruas | Arti |
| --- | --- |
| `user` | Nama pengguna Hive pemilik token. `_id` dan `name` mengulanginya. |
| `account` | Seluruh akun, seperti yang dikembalikan `condenser_api.get_accounts` milik Hive. |
| `scope` | Yang diizinkan token: `["login"]` untuk token masuk, selain itu operasi-operasi yang diterima `/api/broadcast`. |
| `user_metadata` | Metadata profil akun itu, dibaca dari JSON. |

`/api/me` tidak menyebut aplikasi tempat token itu dibuat. Untuk memeriksanya, dekode tokennya: lihat [Bertanya ke API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Menandatangani operasi posting milik orang pemilik token dengan kunci posting @hivesigner lalu menyiarkannya ke Hive.

- **Metode:** `POST`.
- **Token:** token akses `posting`, dari alur token atau alur kode.
- **Sebelum ini bekerja:** orang itu sudah memberi otoritas posting kepada akun aplikasi Anda (layar persetujuan melakukannya) dan akun aplikasi Anda sudah [memberi otoritas posting kepada @hivesigner](/docs/register-app#grant-hivesigner).
- **Badan:** `{ "operations": [...] }`, dengan tiap operasi berupa `[name, fields]` seperti di rantai blok Hive. Semua operasi dalam satu permintaan masuk ke satu transaksi.

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

Permintaan yang sama dengan curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Mengikuti seseorang adalah operasi `custom_json`:

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

API menjawab begitu sebuah simpul Hive menerima transaksinya. `result.id` adalah id transaksinya:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Ketika jaringan menolak transaksinya, jawabannya `500` dengan `server_error`. `error_description` miliknya membawa pesan jaringan dan `response` membawa galat mentahnya.

### Yang diterima broadcast {#broadcast-rules}

Token posting membolehkan API menyiarkan operasi-operasi ini dan tidak yang lain. Pada tiap operasi, orang pemilik token harus menjadi akun pada ruas yang ditunjukkan:

| Operasi | Orang pemilik token harus menjadi |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | Akun pertama di `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Operasi lain apa pun** ditolak dengan `invalid_scope`. Token `login` tidak mengizinkan satu operasi pun.
- **Operasi untuk akun lain** ditolak dengan `unauthorized_client`. Sebuah token hanya pernah menyiarkan untuk orangnya sendiri.
- **`account_update2`** hanya dapat mengubah metadata akun. Operasi dengan ruas `owner`, `active` atau `posting` ditolak dengan `unauthorized_client`.
- **`custom_json`**: biarkan `required_auths` kosong. API menandatangani dengan otoritas posting, jadi operasi yang memerlukan otoritas active akan gagal di jaringan.

Transfer dan operasi dompet lainnya memerlukan kunci active orang itu. Kirimkan semua itu sebagai [tautan tanda tangan](/docs/sign-links) saja.

## POST /api/oauth2/token {#oauth2-token}

Menukar kode dengan token, atau token penyegaran dengan token baru. Panggil hanya dari server Anda. Lihat [Alur kode](/docs/oauth2#code-flow).

- **Metode:** `POST`, dengan nilai-nilainya di badan.
- **Badan:** `code` dan `client_secret`, atau `refresh_token` dan `client_secret`.
- **Tajuk:** jangan mengirim tajuk `Authorization` apa pun.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Tiap panggilan mengembalikan token akses baru dan token penyegaran baru. Keduanya ditandatangani @hivesigner. `expires_in` adalah umur token akses dalam detik (7 hari).

Galat: `401 invalid_grant`. Keterangannya "The token has invalid role" ketika nilai yang dikirim bukan kode atau token penyegaran yang sah. Keterangannya "The code or secret is not valid" ketika kode atau rahasianya tidak cocok.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Memberi tahu Hivesigner bahwa orang itu sudah keluar dari aplikasi Anda. Aplikasi Anda membuang tokennya sendiri.

- **Metode:** `POST`.
- **Token:** token akses, di tajuk `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

`revokeToken()` milik SDK JavaScript melakukan panggilan ini lalu melupakan tokennya. Untuk mencabut akses aplikasi Anda selamanya, orang itu mencabutnya di https://hivesigner.com/authorized-apps. Lihat [Keluar dan mencabut akses](/docs/tokens#sign-out).

## GET /api/apps {#apps}

Direktori aplikasi publik: aplikasi yang menyiarkan lewat Hivesigner, diurutkan menurut berapa banyak orang yang memakainya. Tidak memerlukan token. https://hivesigner.com/apps menampilkan daftar yang sama.

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| Ruas | Arti |
| --- | --- |
| `updated_at` | Kapan direktori terakhir dibangun. |
| `building` | `true` sampai pembangunan pertama punya data. `apps` waktu itu kosong. |
| `window_days` | Jumlah hari yang dicakup pemeringkatan. |
| `featured` | Nama pengguna yang ditampilkan lebih dulu, dalam urutan itu. |
| `apps[].username` | Akun aplikasinya. |
| `apps[].name`, `about` | Dari profil akun aplikasi, atau `null`. |
| `apps[].website` | Situs web dari profil, ketika situs itu menjawab di ranahnya sendiri. Kalau tidak, `null`. |
| `apps[].site` | Hasil pemeriksaan situs web: `ok`, `no_website`, `invalid`, `redirected`, `blocked` atau `unreachable`. Entri `redirected` juga punya `redirects_to`. |
| `apps[].users` | Pengguna berbeda per hari, dijumlahkan sepanjang rentang itu. |
| `apps[].requests` | Permintaan API yang berhasil untuk aplikasi itu sepanjang rentang tersebut. |
| `apps[].first_seen`, `last_seen` | Hari pertama Hivesigner mencatat aplikasi itu dan hari terakhir aplikasi itu dipakai, atau `null`. |
| `apps[].new` | `true` ketika aplikasi itu pertama kali muncul dalam rentang tersebut. |

Jawabannya boleh disinggahkan sampai 5 menit. Sebelum direktori dibangun pertama kali, API menjawab `503` dengan `unavailable`. Coba lagi nanti.

Nama dan keterangannya diterbitkan oleh tiap akun aplikasi sendiri. Hivesigner tidak memeriksa satu pun.
