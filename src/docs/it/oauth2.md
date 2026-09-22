Manda le persone su Hivesigner per accedere alla tua app. Lì esaminano la tua richiesta e la approvano. Hivesigner le riporta poi al tuo callback con un token (il flusso con token) o con un codice che il tuo server scambia con dei token (il flusso con codice). Questa pagina copre entrambi i flussi, ogni parametro e gli ambiti.

## Prima di cominciare {#before-you-start}

- Registra la tua app: un account Hive per essa, con i tuoi callback elencati. Vedi [Registra la tua app](/docs/register-app).
- Per trasmettere tramite l’API, l’account della tua app deve anche [concedere l’autorità di pubblicazione a @hivesigner](/docs/register-app#grant-hivesigner).
- Per il flusso con codice imposta un [client secret](/docs/register-app#client-secret).

## L’URL di autorizzazione {#authorize-url}

Manda la persona a questo indirizzo:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Codifica ogni valore per l’URL. `URLSearchParams` lo fa per te:

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

| Parametro | Obbligatorio | Che cosa fa |
| --- | --- | --- |
| `client_id` | Sì, per un’app | Il nome dell’account della tua app. Viene letto anche `clientId`. Senza di esso la richiesta è una richiesta di solo accesso da un sito senza account app: vedi [Accesso senza permessi di pubblicazione](/docs/login-only). |
| `redirect_uri` | Sì | Dove Hivesigner riporta la persona. Deve essere esattamente uno degli URI di reindirizzamento della tua app. Vedi [Callback](/docs/register-app#callbacks). |
| `scope` | No | `login`, `posting` o `offline`. Vedi [Ambiti](#scopes). Senza di esso la richiesta chiede i permessi di pubblicazione. |
| `response_type` | No | `code` avvia il [flusso con codice](#code-flow). Qualunque altro valore, o nessuno, significa [flusso con token](#token-flow). |
| `state` | Consigliato | Un valore casuale che Hivesigner restituisce immutato. Vedi [Proteggere la richiesta con state](#state). |
| `account` | No | Un nome utente Hive. Quando quell’account è sul dispositivo della persona, Hivesigner lo seleziona. Altrimenti lo ignora. Viene letto anche `select_account`. |

La persona può comunque passare a un altro account nella schermata di consenso. Prendi l’account sempre dal token o dallo scambio del codice, mai da ciò che hai chiesto.

## Ambiti {#scopes}

Hive ha una sola autorità di pubblicazione. Per questo Hivesigner ha due livelli di accesso, solo accesso e pubblicazione, e niente di più fine nel mezzo.

| `scope` | Che cosa approva la persona | Flusso | `type` del token di accesso |
| --- | --- | --- | --- |
| `login` | «Vedere il nome utente del tuo account». Non viene concesso nulla. | Flusso con token (non aggiungere `response_type=code`) | `login` |
| `posting` | I permessi di pubblicazione. La prima volta questo aggiunge l’account della tua app all’autorità di pubblicazione della persona. | Flusso con token, o flusso con codice con `response_type=code` | `posting` |
| `offline` | I permessi di pubblicazione, come sopra | Flusso con codice | `posting`, con un token `refresh` |

Nel flusso con codice il callback riceve prima un codice (un token di `type` `code`) che il tuo server scambia con il token di accesso.

- **Nessun ambito** significa `posting`.
- **Un valore che contiene `offline`** in qualunque punto significa `offline`, per esempio il vecchio `offline,vote,comment`.
- **Qualunque altro valore** significa `posting`. Ci rientrano i vecchi nomi di operazioni come `vote`, `comment`, `vote,comment`, `comment_options` o `custom_json`. Non limitano il token: ogni token di pubblicazione permette le stesse operazioni. Vedi [Che cosa accetta broadcast](/docs/api#broadcast-rules).

Chiedi `login` quando alla tua app basta sapere chi è la persona. Vedi [Accesso senza permessi di pubblicazione](/docs/login-only).

## Il flusso con token {#token-flow}

Il browser della persona riceve il token di accesso direttamente. Alla tua app non serve nessun segreto.

1. Manda la persona all’URL di autorizzazione:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. La persona approva. Hivesigner reindirizza al tuo callback:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner aggiunge i suoi parametri con `?` quando il tuo callback non ha query e con `&` quando ne ha una. `state` c’è solo se ne hai mandato uno non vuoto.

3. Sul tuo callback [confronta prima `state`](#state). Poi [controlla il token](/docs/tokens#check-a-token) sul tuo server. L’account a cui si riferisce è dentro il token: non fidarti del solo parametro `username`, perché chiunque può modificare un URL.
4. Tieni il token sul tuo server o in un cookie httpOnly. Reindirizza a un URL pulito perché il token esca dalla barra degli indirizzi.
5. Usa il token con l’[API](/docs/api) finché non scade dopo `expires_in` secondi (7 giorni). Poi manda di nuovo la persona all’URL di autorizzazione. Chi ha già concesso i permessi di pubblicazione vede «Accedi a APP» e «Hai già autorizzato @myapp. Non viene concesso nessun nuovo permesso.».

## Il flusso con codice {#code-flow}

Il tuo server riceve un codice e lo scambia con un token di accesso e un token di aggiornamento. Più avanti può rinnovarli senza la persona. Usalo quando il tuo server agisce per gli utenti a lungo.

1. Manda la persona all’URL di autorizzazione con `scope=offline`:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` fa la stessa cosa.

2. La persona approva i permessi di pubblicazione. Hivesigner reindirizza al tuo callback:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [Confronta `state`](#state). Poi scambia subito il codice, dal tuo server.

### Scambiare il codice {#exchange-code}

Manda il codice e il tuo client secret a `/api/oauth2/token` nel corpo di una richiesta POST:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

La risposta:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

La stessa chiamata in Node.js 18 o più recente:

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

- Metti il codice e il segreto nel corpo della richiesta, mai nell’URL.
- Non mandare nessuna intestazione `Authorization` con questa richiesta.
- Usa lo `username` di questa risposta. Viene dal codice, che la persona ha firmato.
- Tieni il token di accesso e il token di aggiornamento sul tuo server.

### Aggiornare {#refresh}

Quando il token di accesso scade, manda il token di aggiornamento con il tuo client secret allo stesso endpoint:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

La risposta ha la stessa forma, con un nuovo token di accesso e un nuovo token di aggiornamento. Conserva entrambi al posto dei vecchi.

## Proteggere la richiesta con state {#state}

Senza `state` un altro sito potrebbe mandare il tuo utente al tuo callback con un token o un codice a sua scelta. La tua app farebbe allora accedere la persona all’account di qualcun altro. `state` lega ogni ritorno al browser che ha iniziato l’accesso.

1. Genera un valore casuale per ogni accesso, almeno 16 byte casuali. L’esadecimale lo tiene libero da caratteri che richiedono codifica.
2. Conservalo dove solo questo browser può ripresentarlo: la sessione del tuo server, o un cookie httpOnly e Secure di breve durata con `SameSite=Lax`.
3. Mandalo come `state` nell’URL di autorizzazione.
4. Sul tuo callback confronta il parametro `state` con il valore conservato. Se manca o è diverso, fermati: non usare né il token né il codice.
5. Cancella il valore conservato, così ognuno vale una volta sola.

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

Hivesigner restituisce lo stesso valore di `state` che ha ricevuto. Uno vuoto lo lascia fuori.

## Che cosa vede la persona {#what-the-user-sees}

La schermata di consenso mostra l’immagine e il nome della tua app, «Account Hive @myapp» e «Ti porta a HOST», dove HOST viene dal tuo callback. Poi:

- **Prima richiesta di pubblicazione.** Il titolo dice «APP chiede l’accesso al tuo account.». La scheda **Ambito** elenca che cosa potrà fare la tua app. Un avviso dice «Prima autorizzazione: questa operazione aggiunge @myapp alla tua autorità di pubblicazione sulla blockchain e richiede la tua chiave attiva una sola volta. Quell’account potrà pubblicare a tuo nome finché non lo revochi.». Il pulsante dice **Autorizza**. Quando il dispositivo della persona non ha una chiave attiva per quell’account, la schermata la chiede lì per lì.
- **Accesso.** Per `scope=login`, o per permessi di pubblicazione già concessi prima, il titolo dice «Accedi a APP» e il pulsante dice **Accedi**.
- **L’account.** «Autorizzazione come» o «Accesso come», seguito dall’account selezionato. La persona può cambiare account qui.
- **Un account bloccato.** Sopra il pulsante c’è un campo per il codice di accesso. Un clic sblocca l’account e prosegue.
- **Nessun account sul dispositivo.** Il pulsante dice **Continua**. Apre il modulo per aggiungere un account e poi torna alla richiesta.

Dopo una prima richiesta di pubblicazione Hivesigner aspetta che la nuova concessione sia visibile sulla blockchain prima di reindirizzare. Possono volerci alcuni secondi. Per la schermata completa dal lato della persona vedi [Accedere alle app](/docs/signing-in).

## Annullamento e richieste rifiutate {#cancel}

- **Annullamento.** La persona va al suo elenco di account in Hivesigner. Al tuo callback non viene mandato nulla: non c’è nessun parametro di errore. Tieni disponibile il tuo pulsante di accesso perché la persona possa ricominciare. Non aspettare nessun ritorno.
- **Richieste rifiutate.** Un callback non registrato, un `client_id` sconosciuto o un `redirect_uri` mancante mostrano un errore in Hivesigner con un pulsante **Segnala questo problema**. Al tuo callback non viene mandato nulla. Vedi [Che cosa vedono gli utenti quando qualcosa non va](/docs/register-app#refused-requests).

## Il vecchio URL di richiesta di accesso {#legacy-login-request}

Hivesigner accetta ancora il vecchio URL di accesso, conservato per le integrazioni di un tempo. Per quelle nuove usa `/oauth2/authorize`.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

Apre la stessa schermata di consenso, con gli stessi controlli sul callback e lo stesso reindirizzamento. Legge i suoi parametri in modo diverso:

- `scope` vale `login` o `posting`. Qualunque altro valore, o nessuno, significa `login`.
- `offline` non viene letto. Per il flusso con codice aggiungi `response_type=code`.
- `account` non viene letto.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` segue le stesse regole.
