Un token Hivesigner è una breve dichiarazione firmata. Nomina un account Hive, l’app per cui è stato creato e il momento della firma. Il tuo server può controllare un token con l’API o da sé. Questa pagina mostra che cosa contiene un token, quanto dura ed entrambi i modi di controllarlo.

## Che aspetto ha un token {#format}

Un token è un oggetto JSON codificato in base64url, con una differenza rispetto al base64url standard: il riempimento usa `.` invece di `=`. Rispetto al base64 semplice, quindi, `+` diventa `-`, `/` diventa `_` e `=` diventa `.`. Ogni token inizia con `eyJzaWduZWRfbWVzc2FnZSI6`.

Decodificato, un token di accesso del flusso con token si presenta così:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Campo | Significato |
| --- | --- |
| `signed_message.type` | Che cos’è il token: `login`, `posting`, `code` o `refresh`. Vedi [Tipi di token](#kinds). |
| `signed_message.app` | L’account app per cui il token è stato creato. Un token di accesso per un sito senza account app non ne ha. |
| `authors[0]` | L’account Hive a cui il token si riferisce. |
| `timestamp` | Quando è stato firmato, in secondi dal 1970-01-01 UTC. |
| `signatures[0]` | La firma, come stringa esadecimale. |
| `authority` | Solo nei token firmati nel browser: quale chiave della persona ha firmato, `posting` o `active`. Questo campo sta fuori dai dati firmati. Per sapere quale chiave ha firmato, recuperala dalla firma. |

La firma è una firma secp256k1 sull’hash sha256 di `JSON.stringify({ signed_message, authors, timestamp })`, con le chiavi in quest’ordine.

### Decodificare un token {#decode}

In Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

In un browser:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Decodificare non è controllare. Chiunque può costruire una stringa che si decodifica in questa forma. [Controlla un token](#check-a-token) prima di fidartene.

## Tipi di token {#kinds}

| Token | `type` | `app` | Firmato da | Dove lo ottieni |
| --- | --- | --- | --- | --- |
| Token di accesso, flusso con token | `posting` | La tua app | La chiave di pubblicazione della persona, o la sua chiave attiva quando Hivesigner non ha una chiave di pubblicazione per quell’account | `access_token` sul tuo callback |
| Token di accesso, `scope=login` | `login` | La tua app | La chiave di pubblicazione o attiva della persona | `access_token` sul tuo callback |
| Token di accesso, sito senza account app | `login` | Nessuna | La chiave di pubblicazione o attiva della persona | `access_token` sul tuo callback |
| Codice | `code` | La tua app | La chiave di pubblicazione o attiva della persona | `code` sul tuo callback |
| Token di accesso, flusso con codice | `posting` | La tua app | La chiave di pubblicazione di @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Token di aggiornamento | `refresh` | La tua app | La chiave di pubblicazione di @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Un codice e un token di aggiornamento non sono token di accesso. Non accettare mai nessuno dei due come accesso.

## Quanto dura un token {#lifetime}

Un token di accesso dura 7 giorni: `expires_in` vale 604800 secondi, contati dal suo `timestamp`. Quando è scaduto:

- **Flusso con token:** manda la persona ad accedere di nuovo. Chi ha già autorizzato la tua app vede «Accedi a APP» e gli basta un clic.
- **Flusso con codice:** il tuo server ottiene un nuovo token di accesso con il token di aggiornamento e il tuo client secret. Vedi [Aggiornare](/docs/oauth2#refresh).

Considera scaduto un token appena il suo `timestamp` ha più di 7 giorni. Accetta un’età molto più breve per tutto ciò che controlli subito dopo il reindirizzamento. Scambia un codice subito. Accetta un token di accesso solo entro pochi minuti dal suo `timestamp`.

## Controllare un token sul tuo server {#check-a-token}

Prima che il tuo server si fidi di un token che un browser o un’app gli manda, controlla che:

- l’account o @hivesigner lo abbia davvero firmato;
- sia stato creato per la tua app;
- sia il tipo di token che ti aspetti;
- sia abbastanza recente.

### Chiedere all’API {#check-with-the-api}

Chiama `/api/me` con il token. Un token valido restituisce l’account in `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Un token non valido restituisce `401` con `invalid_grant`. Vedi [GET /api/me](/docs/api#me).

`/api/me` conferma la firma. La sua risposta non nomina l’app per cui il token è stato creato. Quindi decodifica anche il token e controlla da te `app`, `type` ed età. Un token creato per un’altra app non deve far accedere nessuno alla tua.

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

L’API accetta solo token che nominano un’app. Controlla [tu stesso](#check-it-yourself) un token di accesso proveniente da un sito senza account app.

### Controllare da sé {#check-it-yourself}

1. Decodifica il token.
2. Controlla che `signed_message.type` sia il tipo che ti aspetti: `posting` per un token di accesso, `login` per un token di solo accesso.
3. Controlla che `signed_message.app` sia l’account della tua app. Per un sito senza account app, controlla che non ce ne sia nessuno.
4. Controlla l’età a partire da `timestamp`.
5. Calcola l’hash sha256 di `JSON.stringify({ signed_message, authors, timestamp })`.
6. Recupera la chiave pubblica da `signatures[0]` e da quell’hash.
7. Leggi l’account `authors[0]` dalla blockchain Hive adesso, perché le persone possono cambiare le loro chiavi. La chiave recuperata deve essere una delle sue chiavi di pubblicazione o attive attuali. Un token da `/api/oauth2/token` è firmato invece da @hivesigner: per quelli accetta una chiave di pubblicazione attuale dell’account @hivesigner.

In Node.js con [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), che espone `PrivateKey`, `PublicKey`, `Signature` e `callRPC` sotto `@ecency/sdk/hive`:

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

Usalo così:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

Va bene anche la libreria dhive (`@hiveio/dhive`): calcola l’hash con `cryptoUtils.sha256(message)` e recupera la chiave con `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Tenere al sicuro i token {#keep-tokens-safe}

Chiunque abbia un token di pubblicazione può trasmettere come la persona tramite la tua app finché non scade. Trattalo come una password.

- **Tieni i token sul tuo server,** o in un cookie httpOnly e Secure. Tieni i token di aggiornamento e il tuo client secret solo sul server.
- **Non mettere mai un token in un URL che registri.** Il flusso con token consegna il token nella stringa di query del tuo callback. Leggilo sul tuo server, poi reindirizza a un URL senza di esso. Lascia la stringa di query del callback fuori dai tuoi registri.
- **Non caricare nulla da altri siti nella pagina del tuo callback,** perché l’indirizzo con il token non venga mandato a loro. Un’intestazione `Referrer-Policy: no-referrer` su quella pagina aiuta.
- **Manda un token solo al tuo server e a `https://hivesigner.com/api/`.**

## Disconnettersi e togliere l’accesso {#sign-out}

- **Disconnettere una persona** vuol dire buttare via il token: cancellalo dalla tua sessione o dal tuo cookie. Puoi anche chiamare [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) per dire a Hivesigner che la persona si è disconnessa. La tua app butta comunque via il token da sé.
- **Togliere per sempre l’accesso alla tua app** è una scelta della persona. Su https://hivesigner.com/authorized-apps, o su `https://hivesigner.com/revoke/APP`, toglie l’account della tua app dalla propria autorità di pubblicazione sulla blockchain. Dopo di che l’API non trasmette più per lei tramite la tua app.
