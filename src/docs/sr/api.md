Hivesigner API nalazi se na adresi `https://hivesigner.com/api/`. Vraća nalog prijavljene osobe, emituje operacije objavljivanja u njeno ime, menja kodove za tokene i nabraja aplikacije koje koriste Hivesigner. Ova stranica opisuje svaku krajnju tačku sa njenim zahtevima, odgovorima i greškama.

## Zahtevi i potvrda identiteta {#authentication}

- **Osnovna adresa:** `https://hivesigner.com/api/`. Svaka krajnja tačka ispod data je u odnosu na `https://hivesigner.com`.
- **Token:** šaljite ga takvog kakav jeste u zaglavlju `Authorization`: `Authorization: ACCESS_TOKEN`. Prihvata se i prefiks `Bearer `. Možete ga poslati i kao `access_token` u upitnom delu ili u telu, ali ga zaglavlje drži van adresa i dnevnika.
- **Tela:** JSON sa `Content-Type: application/json` ili obrazac (`application/x-www-form-urlencoded`).
- **Odgovori:** JSON.
- **Pregledači:** API dopušta zahteve sa drugog izvora, pa veb aplikacija može da ga poziva neposredno.

Kako doći do tokena, pogledajte [Prijava preko OAuth2](/docs/oauth2). Šta token sadrži, pogledajte [Tokeni](/docs/tokens).

## Greške {#errors}

Odgovor sa greškom ima HTTP status greške i ovakvo telo:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Status | `error` | Kada |
| --- | --- | --- |
| 401 | `invalid_grant` | Tokena nema ili nije ispravan, ili je pogrešne vrste za ovu krajnju tačku («The token has invalid role»). Na `/api/oauth2/token` i «The code or secret is not valid». |
| 401 | `invalid_scope` | `/api/broadcast`: operacija koju token ne dopušta. Opis navodi te operacije. |
| 401 | `unauthorized_client` | `/api/broadcast`: operacija čiji autor nije osoba iz tokena, `account_update2` koji dira ključeve, nedostatak odobrenja za ovlašćenje za objavljivanje ili nalog koji nije mogao da se učita. Opis kaže koji je slučaj. |
| 500 | `server_error` | `/api/broadcast`: Hive mreža je odbila transakciju. `error_description` nosi njenu poruku. |
| 503 | `unavailable` | `/api/apps`: spisak se još sastavlja. |

## GET /api/me {#me}

Vraća nalog kome token pripada. Koristite to da biste saznali ko se prijavio ili da biste [proverili token](/docs/tokens#check-with-the-api).

- **Metode:** `GET` ili `POST`.
- **Token:** token pristupa, uključujući `login` token koji navodi aplikaciju.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Odgovor, skraćeno:

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

| Polje | Značenje |
| --- | --- |
| `user` | Hive korisničko ime kome token pripada. `_id` i `name` ga ponavljaju. |
| `account` | Ceo nalog, onako kako ga vraća `condenser_api.get_accounts` na Hive-u. |
| `scope` | Šta token dopušta: `["login"]` za token za prijavu, inače operacije koje `/api/broadcast` prihvata. |
| `user_metadata` | Metapodaci profila naloga, pročitani iz JSON-a. |

`/api/me` ne navodi aplikaciju za koju je token napravljen. Da biste to proverili, dekodirajte token: pogledajte [Pitajte API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Potpisuje operacije objavljivanja osobe iz tokena ključem za objavljivanje naloga @hivesigner i emituje ih u Hive mrežu.

- **Metoda:** `POST`.
- **Token:** token pristupa `posting`, iz toka sa tokenom ili iz toka sa kodom.
- **Da bi radilo:** osoba je dala ovlašćenje za objavljivanje nalogu vaše aplikacije (to radi ekran saglasnosti), a nalog vaše aplikacije je [dao ovlašćenje za objavljivanje nalogu @hivesigner](/docs/register-app#grant-hivesigner).
- **Telo:** `{ "operations": [...] }`, gde je svaka operacija `[name, fields]`, kao na Hive blokčejnu. Sve operacije iz jednog zahteva ulaze u jednu transakciju.

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

Isti zahtev preko curl-a:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Praćenje je operacija `custom_json`:

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

API odgovara čim Hive čvor prihvati transakciju. `result.id` je identifikator transakcije:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Kada mreža odbije transakciju, odgovor je `500` uz `server_error`. Njegov `error_description` nosi poruku mreže, a `response` sirovu grešku.

### Šta broadcast prihvata {#broadcast-rules}

Token za objavljivanje dopušta API-ju da emituje ove operacije i nijednu drugu. U svakoj od njih osoba iz tokena mora da bude nalog u prikazanom polju:

| Operacija | Osoba iz tokena mora da bude |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | Prvi nalog u `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Svaka druga operacija** biva odbijena uz `invalid_scope`. Token `login` ne dopušta nijednu operaciju.
- **Operacija za drugi nalog** biva odbijena uz `unauthorized_client`. Token emituje samo u ime svoje osobe.
- **`account_update2`** može da menja samo metapodatke naloga. Operacija sa poljem `owner`, `active` ili `posting` biva odbijena uz `unauthorized_client`.
- **`custom_json`**: ostavite `required_auths` praznim. API potpisuje ovlašćenjem za objavljivanje, pa operacija kojoj treba aktivno ovlašćenje ne prolazi u mreži.

Prenosima i drugim operacijama sa novčanikom treba aktivni ključ osobe. Njih šaljite kao [veze za potpis](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

Menja kod za tokene ili token za osvežavanje za nove tokene. Pozivajte to samo sa svog servera. Pogledajte [Tok sa kodom](/docs/oauth2#code-flow).

- **Metoda:** `POST`, sa vrednostima u telu.
- **Telo:** `code` i `client_secret`, ili `refresh_token` i `client_secret`.
- **Zaglavlja:** nemojte slati zaglavlje `Authorization`.

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

Svaki poziv vraća nov token pristupa i nov token za osvežavanje. Oba potpisuje @hivesigner. `expires_in` je trajanje tokena pristupa u sekundama (7 dana).

Greške: `401 invalid_grant`. Opis je «The token has invalid role» kada poslata vrednost nije ispravan kod ni token za osvežavanje. Opis je «The code or secret is not valid» kada se kod ili tajna ne poklapaju.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Javlja Hivesigner-u da se osoba odjavila iz vaše aplikacije. Token vaša aplikacija odbacuje sama.

- **Metoda:** `POST`.
- **Token:** token pristupa, u zaglavlju `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

`revokeToken()` iz JavaScript SDK-a obavlja ovaj poziv, pa zatim zaboravlja token. Da bi pristup vaše aplikacije bio uklonjen zauvek, osoba ga uklanja na https://hivesigner.com/authorized-apps. Pogledajte [Odjava i uklanjanje pristupa](/docs/tokens#sign-out).

## GET /api/apps {#apps}

Javni spisak aplikacija: aplikacije koje emituju preko Hivesigner-a, poređane po tome koliko ih ljudi koristi. Token nije potreban. https://hivesigner.com/apps prikazuje isti spisak.

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

| Polje | Značenje |
| --- | --- |
| `updated_at` | Kada je spisak poslednji put sastavljen. |
| `building` | `true` dok prvo sastavljanje nema podatke. `apps` je tada prazan. |
| `window_days` | Broj dana koje rangiranje obuhvata. |
| `featured` | Korisnička imena koja se prikazuju prva, tim redom. |
| `apps[].username` | Nalog aplikacije. |
| `apps[].name`, `about` | Iz profila naloga aplikacije ili `null`. |
| `apps[].website` | Veb-sajt iz profila, kada odgovara na sopstvenom domenu. Inače `null`. |
| `apps[].site` | Ishod provere veb-sajta: `ok`, `no_website`, `invalid`, `redirected`, `blocked` ili `unreachable`. Stavka `redirected` ima i `redirects_to`. |
| `apps[].users` | Različiti korisnici po danu, sabrani kroz ceo period. |
| `apps[].requests` | Uspešni zahtevi API-ju obavljeni za aplikaciju tokom perioda. |
| `apps[].first_seen`, `last_seen` | Prvi dan kada je Hivesigner zabeležio aplikaciju i poslednji dan kada je korišćena, ili `null`. |
| `apps[].new` | `true` kada se aplikacija prvi put pojavila unutar perioda. |

Odgovor sme da stoji u kešu do 5 minuta. Pre nego što spisak bude prvi put sastavljen, API odgovara `503` uz `unavailable`. Pokušajte kasnije.

Imena i opise objavljuje svaki nalog aplikacije sam. Hivesigner nijedan od njih ne proverava.
