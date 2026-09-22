Zvanični JavaScript SDK sastavlja adrese za prijavu i veze za potpis i poziva Hivesigner API umesto vas. Za Python postoje biblioteke zajednice. Svaki drugi jezik može neposredno da poziva [REST API](/docs/api).

## JavaScript SDK {#javascript}

SDK je npm paket `hivesigner`. Njegov izvorni kod je na https://github.com/ecency/hivesigner-sdk. Napisan je u TypeScript-u i donosi sopstvene tipove.

Verziji 4 treba Node.js 18 ili noviji, jer koristi ugrađeni `fetch`. U pregledačima joj treba ES2017 ili noviji. Tamo gde nema globalnog `fetch`, dodajte polifil pre upotrebe SDK-a. Na starijem Node.js-u ostanite na verziji 3.

### Instalacija {#install}

```bash
npm install hivesigner
```

Za stranicu bez koraka izgradnje učitajte paket za pregledač. On definiše globalni `hivesigner`:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Napravite klijenta {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Opcija | Značenje |
| --- | --- |
| `app` | Nalog vaše aplikacije, šalje se kao `client_id`. |
| `callbackURL` | Kuda Hivesigner vraća osobu. Mora da bude jedna od povratnih adresa vaše aplikacije, znak po znak (povratna adresa na povratnoj petlji sa običnim http sme da se razlikuje po domaćinu i portu, pogledajte [Povratne adrese](/docs/register-app#callback-rules)). |
| `scope` | Spisak, spojen zarezima u parametar `scope`. Pogledajte [Opsezi pristupa](/docs/oauth2#scopes). |
| `responseType` | `'code'` za tok sa kodom. Za tok sa tokenom izostavite. |
| `accessToken` | Token pristupa osobe, ako ga već imate. |
| `apiURL` | Izvor API-ja. SDK mu dodaje `/api/`. Podrazumevano je `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` i `setApiURL` menjaju klijenta kasnije. Svaki od njih vraća klijenta.

### Prijavite osobu {#sign-in}

`getLoginURL(state, account)` vraća adresu za prijavu:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` se nepromenjen vraća na vašu povratnu adresu. Koristite ga da biste vezali odgovor za zahtev.
- `account` nije obavezan: to je korisničko ime. Hivesigner bira taj nalog kada je na uređaju, a inače ga zanemaruje.

U pregledaču `client.login({ state: 'STATE' })` šalje osobu na istu adresu, bez naloga.

U toku sa tokenom vaša povratna adresa dobija `access_token`, `expires_in` i `username`. Predajte token klijentu:

```js
client.setAccessToken('ACCESS_TOKEN');
```

SDK nema metod za razmenu u toku sa kodom. Vaš server sam šalje kod i tajnu klijenta API-ju, kao što pokazuje [Razmenite kod](/docs/oauth2#exchange-code).

### Dobavite osobu {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` je Hive nalog osobe onakav kakav ga blokčejn vraća. `scope` nabraja šta token dopušta.

### Emitovanje {#broadcast}

`broadcast(operations)` šalje operacije API-ju, koji ih emituje u ime osobe. API prihvata samo operacije objavljivanja čiji je autor osoba iz tokena: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` sa ovlašćenjem za objavljivanje, `claim_reward_balance` i `account_update2` za metapodatke profila. Pogledajte [Šta broadcast prihvata](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Navedite osobu u svakoj operaciji. API ne zamenjuje `__signer`.

Ovi pomoćni metodi sastavljaju po jednu operaciju i pozivaju `broadcast`:

| Metod | Šta emituje |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` ide od `-10000` do `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Za novu objavu `parentAuthor` je `''`. `jsonMetadata` sme da bude objekat: SDK ga pretvara u niz. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Prosledite `[]` kao `requiredAuths` i `['USERNAME']` kao `requiredPostingAuths`. `json` je niz. |
| `reblog(account, author, permlink)` | `custom_json` sa id `follow`, koji ponovo deli objavu |
| `follow(follower, following)` | `custom_json` sa id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` sa id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` sa id `follow`, `what: ['ignore']` (utišavanje) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Iznosi su nizovi poput `'0.000 HIVE'`, `'0.000 HBD'` i `'1.000000 VESTS'`. |

`updateUserMetadata()` je zastareo. Da biste promenili profil osobe, emitujte `account_update2` sa novim `posting_json_metadata`.

### Odjava {#log-out}

`revokeToken()` je poziv odjave u SDK-u. Šalje token na krajnju tačku za opoziv u API-ju, pa ga zatim uklanja iz klijenta. Kada poziv ne uspe, sami pozovite `removeAccessToken()`. Obrišite token i tamo gde ga je vaša aplikacija sačuvala.

Da biste zauvek okončali pristup vaše aplikacije, osoba ga uklanja na https://hivesigner.com/authorized-apps. Pogledajte [Pregled i uklanjanje pristupa aplikacije](/docs/signing-in#remove-access).

### Veze za potpis {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` i `sendTransaction(tx, params)` vraćaju vezu `https://hivesigner.com/sign/...`. `params` prima `callback`, `no_broadcast` i `signer`. Pogledajte [Veze za potpis](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

U TypeScript-u tipovi traže treći argument: prosledite `undefined` da biste dobili vezu.

U pregledaču prosledite funkciju kao treći argument da bi se veza otvorila u novoj kartici. Ta funkcija se ne poziva i ništa se ne vraća. Pozovite je iz rukovaoca klikom, jer inače pregledač može da spreči novu karticu, a poziv izbaci grešku.

### Obećanja i povratni pozivi {#promises-and-callbacks}

`me`, `broadcast`, pomoćni metodi i `revokeToken` vraćaju obećanje. Prosledite funkciju kao poslednji argument da biste umesto toga koristili povratni poziv. On dobija `(error, result)`.

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

Kada API odgovori greškom, obećanje biva odbijeno telom greške API-ja, `{ error, error_description }`. Uz povratni poziv to telo je argument `error`. Kada odgovor nije JSON, odbijanje nosi grešku raščlanjivanja.

## Python {#python}

Ove biblioteke dolaze iz zajednice. Održavaju ih njihovi autori, a ne tim Hivesigner-a. Uporedite ih sa [REST API-jem](/docs/api) pre nego što se oslonite na njih.

| Biblioteka | Autor |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, modul `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
