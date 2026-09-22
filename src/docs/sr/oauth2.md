Šaljite ljude na Hivesigner da se prijave u vašu aplikaciju. Tamo pregledaju vaš zahtev i odobravaju ga. Hivesigner ih potom vraća na vašu povratnu adresu sa tokenom (tok sa tokenom) ili sa kodom koji vaš server menja za tokene (tok sa kodom). Ova stranica pokriva oba toka, svaki parametar i opsege pristupa.

## Pre nego što počnete {#before-you-start}

- Registrujte aplikaciju: Hive nalog za nju, sa navedenim povratnim adresama. Pogledajte [Registrujte aplikaciju](/docs/register-app).
- Da biste emitovali preko API-ja, nalog vaše aplikacije mora i da [da ovlašćenje za objavljivanje nalogu @hivesigner](/docs/register-app#grant-hivesigner).
- Za tok sa kodom postavite [tajnu klijenta](/docs/register-app#client-secret).

## Adresa za ovlašćenje {#authorize-url}

Pošaljite osobu na ovu adresu:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Kodirajte svaku vrednost za adresu. `URLSearchParams` to radi umesto vas:

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### Parametri {#parameters}

| Parametar | Obavezan | Šta radi |
| --- | --- | --- |
| `client_id` | Da, za aplikaciju | Ime naloga vaše aplikacije. Čita se i `clientId`. Bez njega je zahtev samo zahtev za prijavu sa sajta bez naloga aplikacije: pogledajte [Prijava bez pristupa objavljivanju](/docs/login-only). |
| `redirect_uri` | Da | Kuda Hivesigner vraća osobu. Mora da bude tačno jedna od URI adresa za preusmeravanje vaše aplikacije. Pogledajte [Povratne adrese](/docs/register-app#callbacks). |
| `scope` | Ne | `login`, `posting` ili `offline`. Pogledajte [Opsezi pristupa](#scopes). Bez njega zahtev traži pristup objavljivanju. |
| `response_type` | Ne | `code` pokreće [tok sa kodom](#code-flow). Svaka druga vrednost, ili nijedna, znači [tok sa tokenom](#token-flow). |
| `state` | Preporučen | Nasumična vrednost koju Hivesigner vraća nepromenjenu. Pogledajte [Zaštitite zahtev preko state](#state). |
| `account` | Ne | Hive korisničko ime. Kada je taj nalog na uređaju osobe, Hivesigner ga bira. Inače ga zanemaruje. Čita se i `select_account`. |

Osoba i dalje može da pređe na drugi nalog na ekranu saglasnosti. Nalog uvek uzimajte iz tokena ili iz razmene koda, nikada iz onoga što ste tražili.

## Opsezi pristupa {#scopes}

Hive ima jedno ovlašćenje za objavljivanje. Zato Hivesigner ima dva nivoa pristupa, samo prijavu i objavljivanje, i ništa finije između.

| `scope` | Šta osoba odobrava | Tok | `type` tokena pristupa |
| --- | --- | --- | --- |
| `login` | «Pregled korisničkog imena vašeg naloga». Ništa se ne dodeljuje. | Tok sa tokenom (nemojte dodavati `response_type=code`) | `login` |
| `posting` | Pristup objavljivanju. Prvi put se time nalog vaše aplikacije dodaje u ovlašćenje za objavljivanje te osobe. | Tok sa tokenom, ili tok sa kodom uz `response_type=code` | `posting` |
| `offline` | Pristup objavljivanju, kao gore | Tok sa kodom | `posting`, uz token `refresh` |

U toku sa kodom povratna adresa najpre dobija kod (token sa `type` vrednošću `code`) koji vaš server menja za token pristupa.

- **Nenaveden opseg** znači `posting`.
- **Vrednost koja bilo gde sadrži `offline`** znači `offline`, na primer stara `offline,vote,comment`.
- **Svaka druga vrednost** znači `posting`. Tu spadaju i stara imena operacija poput `vote`, `comment`, `vote,comment`, `comment_options` ili `custom_json`. Ona ne ograničavaju token: svaki token za objavljivanje dopušta iste operacije. Pogledajte [Šta broadcast prihvata](/docs/api#broadcast-rules).

Tražite `login` kada vašoj aplikaciji treba samo da zna ko je osoba. Pogledajte [Prijava bez pristupa objavljivanju](/docs/login-only).

## Tok sa tokenom {#token-flow}

Pregledač osobe dobija token pristupa neposredno. Vašoj aplikaciji ne treba nikakva tajna.

1. Pošaljite osobu na adresu za ovlašćenje:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. Osoba odobrava. Hivesigner preusmerava na vašu povratnu adresu:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner dodaje svoje parametre znakom `?` kada vaša adresa nema upitni deo, a znakom `&` kada ga ima. `state` postoji samo ako ste poslali vrednost koja nije prazna.

3. Na svojoj povratnoj adresi prvo [uporedite `state`](#state). Zatim [proverite token](/docs/tokens#check-a-token) na svom serveru. Nalog kome pripada nalazi se u samom tokenu: nemojte se oslanjati samo na parametar `username`, jer adresu može da izmeni bilo ko.
4. Token držite na svom serveru ili u httpOnly kolačiću. Preusmerite na čistu adresu da bi token nestao iz adresne trake.
5. Koristite token sa [API-jem](/docs/api) dok ne istekne posle `expires_in` sekundi (7 dana). Zatim ponovo pošaljite osobu na adresu za ovlašćenje. Ko je već dao pristup objavljivanju vidi «Prijava na APP» i «Već ste ranije ovlastili aplikaciju @myapp. Ne dodeljuju se nova ovlašćenja.».

## Tok sa kodom {#code-flow}

Vaš server dobija kod i menja ga za token pristupa i token za osvežavanje. Kasnije može da ih obnavlja bez osobe. Koristite ga kada vaš server duže vreme radi u ime korisnika.

1. Pošaljite osobu na adresu za ovlašćenje sa `scope=offline`:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` radi isto.

2. Osoba odobrava pristup objavljivanju. Hivesigner preusmerava na vašu povratnu adresu:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [Uporedite `state`](#state). Zatim odmah razmenite kod, sa svog servera.

### Razmenite kod {#exchange-code}

Pošaljite kod i svoju tajnu klijenta na `/api/oauth2/token` u telu POST zahteva:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

Odgovor:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Isti poziv u Node.js-u 18 ili novijem:

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- Kod i tajnu stavite u telo zahteva, nikada u adresu.
- Uz ovaj zahtev nemojte slati zaglavlje `Authorization`.
- Koristite `username` iz ovog odgovora. Potiče iz koda koji je osoba potpisala.
- Token pristupa i token za osvežavanje držite na svom serveru.

### Osvežavanje {#refresh}

Kada token pristupa istekne, pošaljite token za osvežavanje sa svojom tajnom klijenta na istu krajnju tačku:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

Odgovor ima isti oblik, sa novim tokenom pristupa i novim tokenom za osvežavanje. Sačuvajte oba umesto starih.

## Zaštitite zahtev preko state {#state}

Bez `state` drugi sajt bi mogao da pošalje vašeg korisnika na vašu povratnu adresu sa tokenom ili kodom po svom izboru. Vaša aplikacija bi tada prijavila osobu na tuđi nalog. `state` vezuje svaki povratak za pregledač u kome je prijava počela.

1. Napravite nasumičnu vrednost za svaku prijavu, najmanje 16 nasumičnih bajtova. Heksadecimalni zapis je čuva od znakova kojima treba kodiranje.
2. Čuvajte je tamo gde samo ovaj pregledač može ponovo da je pokaže: sesija vašeg servera ili kratkotrajan httpOnly i Secure kolačić sa `SameSite=Lax`.
3. Pošaljite je kao `state` u adresi za ovlašćenje.
4. Na svojoj povratnoj adresi uporedite parametar `state` sa sačuvanom vrednošću. Ako ga nema ili se razlikuje, stanite: nemojte koristiti ni token ni kod.
5. Obrišite sačuvanu vrednost, da bi svaka radila jednom.

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner vraća istu vrednost `state` koju je dobio. Praznu izostavlja.

## Šta osoba vidi {#what-the-user-sees}

Ekran saglasnosti prikazuje sliku i ime vaše aplikacije, «Hive nalog @myapp» i «Preusmerava vas na HOST», gde HOST dolazi sa vaše povratne adrese. Zatim:

- **Prvi zahtev za objavljivanje.** Naslov glasi «APP traži pristup vašem nalogu.». Kartica **Opseg pristupa** nabraja šta će vaša aplikacija moći da radi. Obaveštenje glasi «Prvo ovlašćivanje: ovim se @myapp dodaje u vaše ovlašćenje za objavljivanje u blokčejnu, za šta je jednom potreban vaš aktivni ključ. Taj nalog će moći da objavljuje u vaše ime dok mu ne opozovete pristup.». Dugme glasi **Ovlasti**. Kada uređaj osobe nema aktivni ključ za taj nalog, ekran ga traži tu na mestu.
- **Prijava.** Za `scope=login`, ili za pristup objavljivanju koji je osoba ranije dala, naslov glasi «Prijava na APP», a dugme **Prijavi se**.
- **Nalog.** «Ovlašćujete kao» ili «Prijavljujete se kao», pa izabrani nalog. Osoba ovde može da promeni nalog.
- **Zaključan nalog.** Iznad dugmeta stoji polje za pristupnu šifru. Jedan klik otključava nalog i nastavlja.
- **Nema naloga na uređaju.** Dugme glasi **Nastavi**. Otvara obrazac za dodavanje naloga, pa se vraća na zahtev.

Posle prvog zahteva za objavljivanje Hivesigner čeka da novo odobrenje postane vidljivo u blokčejnu, pa tek onda preusmerava. To može da potraje nekoliko sekundi. Ceo ekran iz ugla osobe opisuje [Prijava na aplikacije](/docs/signing-in).

## Otkazivanje i odbijeni zahtevi {#cancel}

- **Otkazivanje.** Osoba odlazi na svoj spisak naloga u Hivesigner-u. Na vašu povratnu adresu ne stiže ništa: nema parametra greške. Ostavite dugme za prijavu dostupno da bi osoba mogla da počne iznova. Nemojte čekati povratak.
- **Odbijeni zahtevi.** Neregistrovana povratna adresa, nepoznat `client_id` ili nedostatak `redirect_uri` prikazuju grešku u Hivesigner-u sa dugmetom **Prijavi ovaj problem**. Na vašu povratnu adresu ne stiže ništa. Pogledajte [Šta ljudi vide kada nešto nije u redu](/docs/register-app#refused-requests).

## Stara adresa zahteva za prijavu {#legacy-login-request}

Hivesigner i dalje prihvata stariju adresu za prijavu, zadržanu zbog ranijih povezivanja. Za nova koristite `/oauth2/authorize`.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

Ona otvara isti ekran saglasnosti, sa istim proverama povratne adrese i istim preusmeravanjem. Svoje parametre, međutim, čita drugačije:

- `scope` je `login` ili `posting`. Svaka druga vrednost, ili nijedna, znači `login`.
- `offline` se ne čita. Za tok sa kodom dodajte `response_type=code`.
- `account` se ne čita.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` prati ista pravila.
