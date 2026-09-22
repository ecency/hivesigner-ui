L’SDK JavaScript ufficiale costruisce gli URL di accesso e i link di firma e chiama l’API di Hivesigner per te. Per Python esistono librerie della comunità. Qualunque altro linguaggio può chiamare direttamente l’[API REST](/docs/api).

## SDK JavaScript {#javascript}

L’SDK è il pacchetto npm `hivesigner`. Il suo sorgente è su https://github.com/ecency/hivesigner-sdk. È scritto in TypeScript e porta con sé i suoi tipi.

La versione 4 richiede Node.js 18 o più recente, perché usa il `fetch` integrato. Nei browser richiede ES2017 o più recente. Dove non c’è un `fetch` globale, aggiungi un polyfill prima di usare l’SDK. Su un Node.js più vecchio resta alla versione 3.

### Installazione {#install}

```bash
npm install hivesigner
```

Per una pagina senza passo di build, carica il bundle per il browser. Definisce un `hivesigner` globale:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Creare un client {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Opzione | Significato |
| --- | --- |
| `app` | L’account della tua app, inviato come `client_id`. |
| `callbackURL` | Dove Hivesigner riporta la persona. Deve essere uno dei callback della tua app, carattere per carattere (un callback di loopback con http semplice può differire per host e porta, vedi [Callback](/docs/register-app#callback-rules)). |
| `scope` | Un elenco, unito da virgole nel parametro `scope`. Vedi [Ambiti](/docs/oauth2#scopes). |
| `responseType` | `'code'` per il flusso con codice. Ometti per il flusso con token. |
| `accessToken` | Il token di accesso della persona, quando ne hai già uno. |
| `apiURL` | L’origine dell’API. L’SDK vi aggiunge `/api/`. Il valore predefinito è `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` e `setApiURL` cambiano il client più avanti. Ognuno restituisce il client.

### Far accedere la persona {#sign-in}

`getLoginURL(state, account)` restituisce l’URL di accesso:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` torna immutato al tuo callback. Usalo per legare la risposta alla richiesta.
- `account` è facoltativo: un nome utente. Hivesigner seleziona quell’account quando è sul dispositivo e altrimenti lo ignora.

In un browser, `client.login({ state: 'STATE' })` manda la persona allo stesso URL, senza account.

Nel flusso con token il tuo callback riceve `access_token`, `expires_in` e `username`. Dai il token al client:

```js
client.setAccessToken('ACCESS_TOKEN');
```

L’SDK non ha un metodo per lo scambio del flusso con codice. È il tuo server a mandare il codice e il client secret all’API, come mostra [Scambiare il codice](/docs/oauth2#exchange-code).

### Ottenere la persona {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` è l’account Hive della persona così come lo restituisce la blockchain. `scope` elenca ciò che il token permette.

### Trasmettere {#broadcast}

`broadcast(operations)` manda le operazioni all’API, che le trasmette per la persona. L’API accetta solo operazioni di pubblicazione il cui autore è la persona del token: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` con autorità di pubblicazione, `claim_reward_balance` e `account_update2` per i metadati del profilo. Vedi [Che cosa accetta broadcast](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Nomina la persona in ogni operazione. L’API non sostituisce `__signer`.

Questi metodi di comodo costruiscono un’operazione ciascuno e chiamano `broadcast`:

| Metodo | Trasmette |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` va da `-10000` a `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Per un post nuovo `parentAuthor` è `''`. `jsonMetadata` può essere un oggetto: l’SDK lo trasforma in stringa. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Passa `[]` come `requiredAuths` e `['USERNAME']` come `requiredPostingAuths`. `json` è una stringa. |
| `reblog(account, author, permlink)` | `custom_json` con id `follow`, che ricondivide il post |
| `follow(follower, following)` | `custom_json` con id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` con id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` con id `follow`, `what: ['ignore']` (silenzia) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Gli importi sono stringhe come `'0.000 HIVE'`, `'0.000 HBD'` e `'1.000000 VESTS'`. |

`updateUserMetadata()` è deprecato. Per cambiare il profilo di una persona, trasmetti `account_update2` con un nuovo `posting_json_metadata`.

### Disconnettersi {#log-out}

`revokeToken()` è la chiamata di disconnessione dell’SDK. Manda il token all’endpoint di revoca dell’API e poi lo toglie dal client. Quando la chiamata fallisce, chiama tu `removeAccessToken()`. Cancella il token anche da dove la tua app lo ha conservato.

Per chiudere per sempre l’accesso alla tua app, la persona lo toglie su https://hivesigner.com/authorized-apps. Vedi [Vedere e togliere l’accesso a un’app](/docs/signing-in#remove-access).

### Link di firma {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` e `sendTransaction(tx, params)` restituiscono un link `https://hivesigner.com/sign/...`. `params` accetta `callback`, `no_broadcast` e `signer`. Vedi [Link di firma](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

In TypeScript i tipi richiedono il terzo argomento: passa `undefined` per riavere il link.

In un browser passa una funzione come terzo argomento per aprire il link in una nuova scheda. La funzione non viene chiamata e non viene restituito nulla. Chiamala da un gestore di clic, altrimenti il browser può bloccare la nuova scheda e la chiamata solleva un errore.

### Promise e callback {#promises-and-callbacks}

`me`, `broadcast`, i metodi di comodo e `revokeToken` restituiscono una promise. Passa una funzione come ultimo argomento per usare invece un callback. Riceve `(error, result)`.

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

Quando l’API risponde con un errore, la promise viene rifiutata con il corpo di errore dell’API, `{ error, error_description }`. Con un callback quel corpo è l’argomento `error`. Quando la risposta non è JSON, il rifiuto porta l’errore di analisi.

## Python {#python}

Queste librerie vengono dalla comunità. Le curano i loro autori, non il team di Hivesigner. Confrontale con l’[API REST](/docs/api) prima di affidarti a loro.

| Libreria | Autore |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, modulo `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
