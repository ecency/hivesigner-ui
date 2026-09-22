Hivesigner token je kratka potpisana izjava. U njoj su navedeni Hive nalog, aplikacija za koju je napravljen i vreme potpisivanja. Vaš server može da proveri token preko API-ja ili sam. Ova stranica pokazuje šta token sadrži, koliko traje i oba načina provere.

## Kako token izgleda {#format}

Token je JSON objekat kodiran u base64url, sa jednom razlikom u odnosu na uobičajeni base64url: za popunu se koristi `.` umesto `=`. U poređenju sa običnim base64, `+` postaje `-`, `/` postaje `_`, a `=` postaje `.`. Svaki token počinje sa `eyJzaWduZWRfbWVzc2FnZSI6`.

Kada se dekodira, token pristupa iz toka sa tokenom izgleda ovako:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Polje | Značenje |
| --- | --- |
| `signed_message.type` | Šta je token: `login`, `posting`, `code` ili `refresh`. Pogledajte [Vrste tokena](#kinds). |
| `signed_message.app` | Nalog aplikacije za koju je token napravljen. Token za prijavu sa sajta bez naloga aplikacije ga nema. |
| `authors[0]` | Hive nalog kome token pripada. |
| `timestamp` | Kada je potpisan, u sekundama od 1970-01-01 UTC. |
| `signatures[0]` | Potpis, kao heksadecimalni niz. |
| `authority` | Samo u tokenima potpisanim u pregledaču: kojim ključem osobe je potpisano, `posting` ili `active`. Ovo polje je van potpisanih podataka. Da biste znali koji ključ je potpisao, izvedite ga iz potpisa. |

Potpis je secp256k1 potpis nad sha256 otiskom od `JSON.stringify({ signed_message, authors, timestamp })`, sa ključevima baš tim redom.

### Dekodirajte token {#decode}

U Node.js-u:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

U pregledaču:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Dekodiranje nije provera. Svako može da sastavi niz koji se dekodira u ovaj oblik. [Proverite token](#check-a-token) pre nego što mu poverujete.

## Vrste tokena {#kinds}

| Token | `type` | `app` | Potpisao | Odakle ga dobijate |
| --- | --- | --- | --- | --- |
| Token pristupa, tok sa tokenom | `posting` | Vaša aplikacija | Ključ za objavljivanje osobe, ili njen aktivni ključ kada Hivesigner nema ključ za objavljivanje za taj nalog | `access_token` na vašoj povratnoj adresi |
| Token za prijavu, `scope=login` | `login` | Vaša aplikacija | Ključ za objavljivanje ili aktivni ključ osobe | `access_token` na vašoj povratnoj adresi |
| Token za prijavu, sajt bez naloga aplikacije | `login` | Nema | Ključ za objavljivanje ili aktivni ključ osobe | `access_token` na vašoj povratnoj adresi |
| Kod | `code` | Vaša aplikacija | Ključ za objavljivanje ili aktivni ključ osobe | `code` na vašoj povratnoj adresi |
| Token pristupa, tok sa kodom | `posting` | Vaša aplikacija | Ključ za objavljivanje naloga @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Token za osvežavanje | `refresh` | Vaša aplikacija | Ključ za objavljivanje naloga @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Kod i token za osvežavanje nisu tokeni pristupa. Nikada nijedan od njih ne prihvatajte kao prijavu.

## Koliko token traje {#lifetime}

Token pristupa traje 7 dana: `expires_in` iznosi 604800 sekundi, računato od njegovog `timestamp`. Kada istekne:

- **Tok sa tokenom:** pošaljite osobu da se ponovo prijavi. Ko je već ovlastio vašu aplikaciju vidi «Prijava na APP» i treba mu jedan klik.
- **Tok sa kodom:** vaš server dobija novi token pristupa pomoću tokena za osvežavanje i vaše tajne klijenta. Pogledajte [Osvežavanje](/docs/oauth2#refresh).

Smatrajte token isteklim čim njegov `timestamp` bude stariji od 7 dana. Za sve što proveravate odmah posle preusmeravanja prihvatajte mnogo manju starost. Kod razmenite odmah. Token za prijavu prihvatajte samo u roku od nekoliko minuta od njegovog `timestamp`.

## Proverite token na svom serveru {#check-a-token}

Pre nego što vaš server poveruje tokenu koji mu šalje pregledač ili aplikacija, proverite da:

- ga je zaista potpisao nalog ili @hivesigner;
- je napravljen za vašu aplikaciju;
- je one vrste koju očekujete;
- je dovoljno svež.

### Pitajte API {#check-with-the-api}

Pozovite `/api/me` sa tim tokenom. Ispravan token vraća nalog u `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Neispravan token vraća `401` uz `invalid_grant`. Pogledajte [GET /api/me](/docs/api#me).

`/api/me` potvrđuje potpis. Ali njegov odgovor ne navodi aplikaciju za koju je token napravljen. Zato dekodirajte i token i sami proverite njegove `app`, `type` i starost. Token napravljen za drugu aplikaciju ne sme nikoga da prijavi u vašu.

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

API prihvata samo tokene koji navode aplikaciju. Token za prijavu sa sajta bez naloga aplikacije proverite [sami](#check-it-yourself).

### Proverite sami {#check-it-yourself}

1. Dekodirajte token.
2. Proverite da je `signed_message.type` ona vrsta koju očekujete: `posting` za token pristupa, `login` za token za prijavu.
3. Proverite da je `signed_message.app` nalog vaše aplikacije. Za sajt bez naloga aplikacije proverite da ga uopšte nema.
4. Proverite starost prema `timestamp`.
5. Izračunajte sha256 otisak od `JSON.stringify({ signed_message, authors, timestamp })`.
6. Izvedite javni ključ iz `signatures[0]` i tog otiska.
7. Pročitajte nalog `authors[0]` sa Hive blokčejna baš sada, jer ljudi mogu da menjaju ključeve. Izvedeni ključ mora da bude jedan od njegovih sadašnjih ključeva za objavljivanje ili aktivnih ključeva. Token sa `/api/oauth2/token` potpisuje @hivesigner: za takve prihvatite sadašnji ključ za objavljivanje naloga @hivesigner.

U Node.js-u uz [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), koji nudi `PrivateKey`, `PublicKey`, `Signature` i `callRPC` pod `@ecency/sdk/hive`:

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

Koristite ovako:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

I biblioteka dhive (`@hiveio/dhive`) radi posao: otisak izračunajte pomoću `cryptoUtils.sha256(message)`, a ključ izvedite pomoću `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Čuvajte tokene bezbedno {#keep-tokens-safe}

Ko ima token za objavljivanje može do njegovog isteka da emituje u ime osobe preko vaše aplikacije. Postupajte s njim kao sa lozinkom.

- **Čuvajte tokene na svom serveru** ili u kolačiću sa httpOnly i Secure. Tokene za osvežavanje i svoju tajnu klijenta držite samo na serveru.
- **Nikada ne stavljajte token u adresu koju beležite.** Tok sa tokenom donosi token u upitnom delu vaše povratne adrese. Pročitajte ga na serveru, pa preusmerite na adresu bez njega. Upitni deo povratne adrese ostavite van svojih dnevnika.
- **Na stranici povratne adrese ne učitavajte ništa sa drugih sajtova,** da adresa sa tokenom ne bi otišla njima. Zaglavlje `Referrer-Policy: no-referrer` na toj stranici pomaže.
- **Token šaljite samo svom serveru i na `https://hivesigner.com/api/`.**

## Odjava i uklanjanje pristupa {#sign-out}

- **Odjaviti osobu** znači odbaciti token: obrišite ga iz svoje sesije ili kolačića. Možete i da pozovete [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) da biste Hivesigner-u javili da se osoba odjavila. Vaša aplikacija ionako sama odbacuje token.
- **Trajno prekinuti pristup vaše aplikacije** jeste odluka osobe. Na https://hivesigner.com/authorized-apps ili na `https://hivesigner.com/revoke/APP` ona uklanja nalog vaše aplikacije iz svog ovlašćenja za objavljivanje u blokčejnu. Posle toga API više ne emituje u njeno ime preko vaše aplikacije.
