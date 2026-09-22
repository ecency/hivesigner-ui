Alcune app devono solo sapere chi è una persona su Hive. Non pubblicano, non votano e non trasmettono mai niente per lei. Hivesigner può far accedere le persone a un’app del genere senza alcuna autorità di pubblicazione. La persona dimostra di controllare un account Hive. La tua app ne apprende il nome. Questa pagina mostra i due modi di farlo e come controllare il risultato in sicurezza.

## Due modi {#two-ways}

- **Con un account app:** la tua app ha un proprio account Hive e chiede `scope=login`. Il token nomina la tua app.
- **Senza un account app:** un sito senza account Hive manda solo un `redirect_uri`. Il token non nomina nessuna app. Il tuo sito lo controlla da sé.

Nessuno dei due richiede una concessione dalla persona o dall’account della tua app, quindi nell’account della persona non cambia nulla. Hivesigner firma l’accesso con la chiave di pubblicazione, oppure con la chiave attiva quando il dispositivo non ha una chiave di pubblicazione per quell’account.

## Con un account app {#app-account}

1. [Registra la tua app](/docs/register-app): crea il suo account Hive ed elenca i tuoi callback. Non ti servono né un client secret né la concessione a @hivesigner.
2. Manda la persona a:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. La persona vede «Accedi a APP» con l’**Ambito** «Vedere il nome utente del tuo account». Sceglie **Accedi**.
4. Hivesigner reindirizza al tuo callback:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [Confronta `state`](/docs/oauth2#state), poi controlla il token. È un token `login` che nomina la tua app, quindi va bene una di queste due strade:
   - chiama [`GET /api/me`](/docs/api#me) con esso, che risponde con l’account in `user` e `scope` `["login"]`, poi decodifica il token e controlla `type` e `app` ([Chiedere all’API](/docs/tokens#check-with-the-api));
   - oppure [controllalo tu stesso](/docs/tokens#check-it-yourself) con `type: 'login'` e il nome della tua app.

Un token `login` non può trasmettere nulla: `/api/broadcast` rifiuta ogni operazione inviata con esso.

## Senza un account app {#no-app-account}

1. Manda la persona all’URL di autorizzazione con un `redirect_uri` e senza `client_id`:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   Il callback deve essere `https://`, oppure `http://` su loopback (`localhost`, `127.0.0.1`, `[::1]`). Non c’è nessun elenco in cui registrarlo. Qui Hivesigner ignora `scope` e `response_type`: la risposta è sempre un token di accesso.

2. La persona vede «HOST vuole confermare il tuo nome utente Hive.», dove HOST è l’host del tuo callback. Sceglie **Accedi**.
3. Hivesigner reindirizza al tuo callback:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [Confronta `state`](/docs/oauth2#state), poi controlla il token da te. L’API non accetta un token che non nomina nessuna app, quindi il tuo server verifica la firma contro le chiavi dell’account. Vedi [Controllare da sé](/docs/tokens#check-it-yourself), con `type: 'login'` e senza `app`.

Quando il callback non è un indirizzo web, o è `http://` semplice fuori dal loopback, Hivesigner rifiuta la richiesta e spiega alla persona il motivo.

## Quale usare {#which-one}

| | Con un account app | Senza un account app |
| --- | --- | --- |
| Che cosa vede la persona | Nome, immagine e account Hive della tua app | Solo l’host del tuo sito |
| Preparazione | Un account Hive con i tuoi callback elencati | Nessuna |
| Il token nomina | La tua app | Nessuna app |
| Controlla il token con | `/api/me` o codice tuo | Codice tuo |
| Permessi di pubblicazione più avanti | Con lo stesso account: chiedi `posting` e [concedi a @hivesigner](/docs/register-app#grant-hivesigner) | Serve prima un account app |

Usa un account app quando puoi. Gli utenti vedono il nome e l’immagine della tua app. Il tuo server può rifiutare i token creati per un’altra app. Più avanti potrai passare ai permessi di pubblicazione con lo stesso account.

Usa la seconda via quando il tuo sito non ha un account Hive e non ne vuole uno.

## Controllare l’accesso in sicurezza {#check-safely}

- **Lega la richiesta con `state`.** Genera un valore casuale per ogni accesso, conservalo nella sessione della persona, confrontalo sul tuo callback e usalo una volta sola. Vedi [Proteggere la richiesta con state](/docs/oauth2#state).
- **Controlla il tipo.** Accetta solo `signed_message.type` uguale a `login`. Un codice o un token di aggiornamento non è un accesso.
- **Controlla l’app.** Con un account app, `signed_message.app` deve essere la tua app. Senza, non deve esserci nessun `app`.
- **Controlla l’età.** Controlli il token subito dopo il reindirizzamento, quindi accettalo solo entro pochi minuti dal suo `timestamp` (per esempio 5 minuti, con un minuto di scarto di orologio).
- **Usa ogni token una volta sola.** Dopo un controllo riuscito, avvia la tua sessione (per esempio un cookie httpOnly) e butta via il token di Hivesigner. Tieni traccia dei token accettati finché non sono troppo vecchi per superare il controllo dell’età. Rifiuta qualunque token tu riveda.
- **Tieni il token fuori dai registri.** Arriva nella stringa di query del tuo callback. Vedi [Tenere al sicuro i token](/docs/tokens#keep-tokens-safe).

## Esempi {#examples}

Siti come https://hivesearcher.com e https://openhive.chat permettono alle persone di accedere con il loro account Hive per funzioni che restano fuori dalla blockchain, come la ricerca e la chat. Devono sapere chi è la persona e niente di più.
