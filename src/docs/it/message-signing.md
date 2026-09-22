La tua app può chiedere a una persona di firmare un messaggio di testo con la sua chiave di pubblicazione o attiva. La firma dimostra che la persona controlla l’account. Non viene trasmesso nulla: il messaggio non arriva mai sulla blockchain. Hivesigner firma allo stesso modo di `requestSignBuffer` di Hive Keychain, quindi il codice server che controlla una firma di Keychain controlla anche una firma di Hivesigner.

## Chiedere una firma {#request}

Manda la persona su `https://hivesigner.com/sign-buffer` con questi parametri di query:

| Parametro | Obbligatorio | Significato |
| --- | --- | --- |
| `message` | Sì | Il testo esatto da firmare. Deve contenere più di soli spazi. |
| `redirect_uri` | Sì | Dove Hivesigner manda il risultato. Vedi [Regole del callback](#callback-rules). |
| `authority` | No | `posting` o `active`, con qualunque combinazione di maiuscole (va bene anche `Posting`). `posting` quando manca o è vuoto. Qualunque altro valore viene rifiutato. |
| `client_id` | No | L’account della tua app. Viene letto anche `clientId`. Con esso, `redirect_uri` deve essere uno dei callback della tua app. |
| `state` | No | Un valore qualsiasi. Hivesigner lo restituisce immutato. |
| `account` | No | L’account da cui ti aspetti la firma. Hivesigner lo seleziona quando è sul dispositivo e altrimenti lo ignora. Viene letto anche `select_account`. |

Costruisci l’URL con `URLSearchParams`, così ogni valore viene codificato:

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

### Regole del callback {#callback-rules}

- Il callback deve essere `https://`. L’`http://` semplice funziona solo su loopback: `localhost`, `127.0.0.1` o `[::1]`.
- **Con `client_id`**, il callback deve essere registrato su quell’account app, verificato come per l’accesso. Vedi [Callback](/docs/register-app#callback-rules). Hivesigner legge i callback dell’app da Hive quando la richiesta si apre e non firma nulla finché non li ha letti. Quando Hive non è raggiungibile, la persona riceve un pulsante **Riprova**.
- **Senza `client_id`**, va bene qualunque callback che segua la prima regola. Hivesigner indica allora l’host del callback come richiedente, per esempio «HOST ti chiede di firmare un messaggio.».

Manda `client_id` quando hai un account app. La persona vede allora il nome e l’account della tua app. Solo i tuoi callback registrati possono ricevere la firma.

Hivesigner rifiuta una richiesta senza messaggio, con un `authority` sconosciuto, con un callback mancante o inutilizzabile, con un `client_id` che non è un account Hive o con un callback non registrato su quell’app. La persona vede «Questa richiesta di firma non è utilizzabile: servono un messaggio, una chiave di pubblicazione o attiva e un URL di reindirizzamento sicuro registrato per l’app. Torna al sito e riprova.» e un pulsante **Segnala questo problema**.

### Che cosa vede la persona {#what-the-user-sees}

- Un titolo che nomina la tua app (o l’host del callback) e «Ti porta a HOST».
- L’intero messaggio, esattamente come verrà firmato. I caratteri che potrebbero nascondere testo o cambiarne il verso sono mostrati come codici tipo `\u{200B}`.
- «Verrà firmata con la tua chiave di pubblicazione» oppure «Verrà firmata con la tua chiave attiva».
- Un avviso: «La tua firma dimostra a chiunque la veda che @USERNAME ha firmato esattamente questo testo. Firma solo un messaggio che comprendi.»
- **Firma** e **Annulla**. Un account bloccato chiede prima il suo codice di accesso.

[Richieste di firma di un messaggio](/docs/signing#message-requests) descrive la schermata per gli utenti.

## Che cosa riceve il tuo callback {#callback}

Quando la persona sceglie **Firma**, Hivesigner la manda al tuo callback con questi parametri di query:

| Parametro | Valore |
| --- | --- |
| `signature` | La firma, come stringa esadecimale di 130 caratteri |
| `public_key` | La chiave pubblica della chiave che ha firmato, tipo `STM...` |
| `username` | L’account che ha firmato |
| `authority` | `posting` o `active` |
| `state` | Il tuo `state`, ogni volta che la richiesta ne aveva uno (anche vuoto) |

Hivesigner li aggiunge alla query del tuo callback, dopo `?` o `&` e prima di qualunque `#fragment`. La tua query resta com’è.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Quando la persona sceglie **Annulla**, Hivesigner apre il suo elenco di account. Il tuo callback non riceve nulla.

> **Avvertenza:** Chiunque può aprire il tuo callback con valori inventati. Tratta ogni parametro come un’affermazione finché il tuo server non ha controllato la firma.

## Verificare la firma {#verify}

Controlla la firma sul tuo server:

1. Tieni sul tuo server il messaggio che hai chiesto, con il suo `state`. Non fidarti di una copia che torna dal browser.
2. Calcola l’hash del messaggio: sha256 sui suoi byte UTF-8.
3. Recupera la chiave pubblica dalla firma e da quell’hash.
4. Carica l’account da Hive. Controlla che la chiave recuperata appartenga all’autorità che hai chiesto, con peso sufficiente per firmare da sola.
5. Controlla che `state` sia quello che hai emesso. Accetta ogni messaggio una volta sola.

Questo esempio usa dhive (https://www.npmjs.com/package/@hiveio/dhive):

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

Lo stesso controllo vale per una firma di `requestSignBuffer` di Hive Keychain. Confronta con la chiave che hai recuperato: `public_key` nel callback è solo un’indicazione.

## Messaggi che Hivesigner non firma {#refused-messages}

Un messaggio che è un oggetto JSON con una chiave `signed_message` ha la forma di un token Hivesigner. Firmarlo darebbe al richiedente l’accesso all’account della persona. Hivesigner non firma mai un messaggio del genere. Dice alla persona «Questo messaggio è un token Hivesigner. Firmarlo darebbe al sito l’accesso al tuo account, quindi non può essere firmato.»

Usa testo semplice, o JSON senza la chiave `signed_message`. Di’ a che cosa serve la firma e aggiungi un valore che generi una volta sola, per esempio:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## Lo strumento Firma messaggio {#sign-message-tool}

Le persone possono anche firmare un messaggio da sole su https://hivesigner.com/signmessage (**Firma messaggio**) e verificarne uno su https://hivesigner.com/verifymessage (**Verifica messaggio**). Vedi [Firmare un messaggio da soli](/docs/signing#sign-message).

Quello strumento firma in modo diverso da `/sign-buffer`. Firma un corpo di token Hivesigner che contiene il messaggio, l’account e l’ora. Condivide il risultato come **Token di verifica**. Verifica un token del genere nella pagina **Verifica messaggio** o come descritto in [Controllare da sé](/docs/tokens#check-it-yourself), non con il codice qui sopra.
