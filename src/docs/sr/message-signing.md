Vaša aplikacija može da zatraži od osobe da tekstualnu poruku potpiše svojim ključem za objavljivanje ili aktivnim ključem. Potpis dokazuje da ta osoba upravlja nalogom. Ništa se ne emituje: poruka nikada ne stiže na blokčejn. Hivesigner potpisuje isto kao `requestSignBuffer` iz Hive Keychain-a, pa serverski kod koji proverava Keychain potpis proverava i Hivesigner potpis.

## Zatražite potpis {#request}

Pošaljite osobu na `https://hivesigner.com/sign-buffer` sa ovim parametrima upita:

| Parametar | Obavezan | Značenje |
| --- | --- | --- |
| `message` | Da | Tačan tekst koji se potpisuje. Mora da sadrži nešto više od razmaka. |
| `redirect_uri` | Da | Kuda Hivesigner šalje ishod. Pogledajte [Pravila povratne adrese](#callback-rules). |
| `authority` | Ne | `posting` ili `active`, bilo kojim slovima (`Posting` takođe važi). Kada ga nema ili je prazan, uzima se `posting`. Svaka druga vrednost biva odbijena. |
| `client_id` | Ne | Nalog vaše aplikacije. Čita se i `clientId`. Uz njega `redirect_uri` mora da bude jedna od povratnih adresa vaše aplikacije. |
| `state` | Ne | Bilo koja vrednost. Hivesigner je vraća nepromenjenu. |
| `account` | Ne | Nalog od kojeg očekujete potpis. Hivesigner ga bira kada je na uređaju, a inače ga zanemaruje. Čita se i `select_account`. |

Sastavite adresu pomoću `URLSearchParams`, da bi svaka vrednost bila kodirana:

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### Pravila povratne adrese {#callback-rules}

- Povratna adresa mora da bude `https://`. Običan `http://` radi samo na povratnoj petlji: `localhost`, `127.0.0.1` ili `[::1]`.
- **Uz `client_id`** povratna adresa mora da bude registrovana na tom nalogu aplikacije i proverava se isto kao pri prijavi. Pogledajte [Povratne adrese](/docs/register-app#callback-rules). Hivesigner čita povratne adrese aplikacije sa Hive-a kada se zahtev otvori i ništa ne potpisuje dok ih ne pročita. Kada do Hive-a ne može da se dopre, osoba dobija dugme **Pokušaj ponovo**.
- **Bez `client_id`** odgovara svaka povratna adresa koja poštuje prvo pravilo. Hivesigner tada kao podnosioca navodi domaćina te adrese, na primer «HOST traži da potpišete poruku.».

Šaljite `client_id` kada imate nalog aplikacije. Osoba tada vidi ime i nalog vaše aplikacije. Potpis mogu da dobiju samo vaše registrovane povratne adrese.

Hivesigner odbija zahtev bez poruke, sa nepoznatim `authority`, sa povratnom adresom koje nema ili je neupotrebljiva, sa `client_id` koji nije Hive nalog ili sa povratnom adresom koja nije registrovana na toj aplikaciji. Osoba vidi «Ovaj zahtev za potpis ne može da se koristi: potrebni su poruka, ključ za objavljivanje ili aktivni ključ i bezbedan URL za preusmeravanje registrovan za aplikaciju. Vratite se na sajt i pokušajte ponovo.» i dugme **Prijavi ovaj problem**.

### Šta osoba vidi {#what-the-user-sees}

- Naslov sa imenom vaše aplikacije (ili domaćinom povratne adrese) i «Preusmerava vas na HOST».
- Celu poruku, tačno onakvu kakva će biti potpisana. Znaci koji bi mogli da sakriju tekst ili promene njegov smer prikazuju se kao kodovi poput `\u{200B}`.
- «Potpisuje se vašim ključem za objavljivanje» ili «Potpisuje se vašim aktivnim ključem».
- Upozorenje: «Vaš potpis dokazuje svakome ko ga vidi da je @USERNAME potpisao upravo ovaj tekst. Potpisujte samo poruku koju razumete.»
- **Potpiši** i **Otkaži**. Zaključan nalog prvo traži svoju pristupnu šifru.

[Zahtevi za potpis poruke](/docs/signing#message-requests) opisuju taj ekran za ljude.

## Šta vaša povratna adresa dobija {#callback}

Kada osoba izabere **Potpiši**, Hivesigner je šalje na vašu povratnu adresu sa ovim parametrima upita:

| Parametar | Vrednost |
| --- | --- |
| `signature` | Potpis, kao heksadecimalni niz od 130 znakova |
| `public_key` | Javni ključ onog ključa koji je potpisao, poput `STM...` |
| `username` | Nalog koji je potpisao |
| `authority` | `posting` ili `active` |
| `state` | Vaš `state`, kad god ga je zahtev imao (uključujući i prazan) |

Hivesigner ih dodaje u upitni deo vaše adrese, posle `?` ili `&` i pre svakog `#fragment`. Vaš sopstveni upitni deo ostaje kakav jeste.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Kada osoba izabere **Otkaži**, Hivesigner otvara njen spisak naloga. Vaša povratna adresa ne dobija ništa.

> **Upozorenje:** Vašu povratnu adresu svako može da otvori sa izmišljenim vrednostima. Svaki parametar smatrajte samo tvrdnjom dok vaš server ne proveri potpis.

## Proverite potpis {#verify}

Potpis proverite na svom serveru:

1. Poruku koju ste tražili čuvajte na svom serveru, zajedno sa njenim `state`. Ne verujte kopiji koja se vrati iz pregledača.
2. Izračunajte otisak poruke: sha256 nad njenim UTF-8 bajtovima.
3. Izvedite javni ključ iz potpisa i tog otiska.
4. Učitajte nalog sa Hive-a. Proverite da izvedeni ključ pripada ovlašćenju koje ste tražili i da ima dovoljnu težinu da potpiše sam.
5. Proverite da je `state` onaj koji ste izdali. Svaku poruku prihvatite jednom.

Ovaj primer koristi dhive (https://www.npmjs.com/package/@hiveio/dhive):

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

Ista provera važi i za potpis iz `requestSignBuffer` u Hive Keychain-u. Upoređujte sa ključem koji ste izveli: `public_key` na povratnoj adresi je samo nagoveštaj.

## Poruke koje Hivesigner ne potpisuje {#refused-messages}

Poruka koja je JSON objekat sa ključem `signed_message` ima oblik Hivesigner tokena. Njeno potpisivanje bi podnosiocu dalo pristup nalogu osobe. Hivesigner takvu poruku nikada ne potpisuje. Osobi kaže «Ova poruka je Hivesigner token. Njeno potpisivanje bi sajtu dalo pristup vašem nalogu, zato ne može da se potpiše.»

Koristite običan tekst ili JSON bez ključa `signed_message`. Recite čemu potpis služi i dodajte vrednost koju napravite jednom, na primer:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## Alat Potpiši poruku {#sign-message-tool}

Ljudi mogu i sami da potpišu poruku na https://hivesigner.com/signmessage (**Potpiši poruku**) i da je provere na https://hivesigner.com/verifymessage (**Proveri poruku**). Pogledajte [Sami potpišite poruku](/docs/signing#sign-message).

Taj alat potpisuje drugačije od `/sign-buffer`. Potpisuje telo Hivesigner tokena u kome su poruka, nalog i vreme. Ishod deli kao **Token za proveru**. Takav token proveravajte na stranici **Proveri poruku** ili onako kako opisuje [Proverite sami](/docs/tokens#check-it-yourself), a ne kodom iznad.
