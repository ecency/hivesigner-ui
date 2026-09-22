Un’app che fa accedere le persone con Hivesigner è un account Hive. Il suo nome è il `client_id` che invii. Il suo profilo contiene le impostazioni che Hivesigner legge: i callback a cui può mandare i token e, per il flusso con codice, un client secret. Per trasmettere tramite l’API, l’account app concede anche l’autorità di pubblicazione a @hivesigner. Questa pagina segue ogni passo.

## Che cosa ti serve {#what-you-need}

| Vuoi | Account app e callback | Client secret | Concessione a @hivesigner |
| --- | --- | --- | --- |
| Far accedere le persone e trasmettere con il flusso con token | Sì | No | Sì |
| Far accedere le persone e trasmettere con il flusso con codice (token di aggiornamento) | Sì | Sì | Sì |
| Solo far accedere le persone, con un token che nomina la tua app | Sì | No | No |
| Solo far accedere le persone, da un sito senza account Hive | No | No | No |
| Inviare link di firma | No | No | No |

Per le ultime due righe vedi [Accesso senza permessi di pubblicazione](/docs/login-only) e [Link di firma](/docs/sign-links).

## Creare l’account app {#app-account}

1. Crea un account Hive per la tua app, per esempio su https://ecency.com/signup. Usa un account a parte per l’app, non il tuo personale. Il suo nome è il tuo `client_id`. Gli utenti lo vedono nella schermata di consenso accanto ad «Account Hive». Un account Hive non si può rinominare, quindi scegli il nome con cura.
2. Aggiungi l’account a Hivesigner su https://hivesigner.com/import (**Aggiungi account**). Usa la chiave attiva o la password principale: la concessione più sotto richiede la chiave attiva.

## Compilare le impostazioni dell’app {#app-settings}

Apri https://hivesigner.com/profile con l’account app selezionato e imposta:

- **Questo account è un'app.** Attivalo. Segna l’account come app, cosa che l’API controlla prima di accettare un codice o un token di aggiornamento per esso.
- **URI di reindirizzamento.** I tuoi callback, uno per riga. Vedi [Callback](#callbacks).
- **Creatore.** Chi cura l’app. La directory delle app su https://hivesigner.com/apps lo mostra.
- **Stato.** Produzione o prova, per i tuoi archivi. Hivesigner tratta i due allo stesso modo.
- **Client secret.** Serve solo per il [flusso con codice](/docs/oauth2#code-flow). Vedi [Client secret](#client-secret).

Compila anche **Nome** e **URL dell’immagine del profilo**. La schermata di consenso mostra l’immagine e il nome della tua app. La directory delle app su https://hivesigner.com/apps mostra il nome, **Informazioni** e **Sito web**.

Il salvataggio aggiorna il profilo dell’account sulla blockchain e richiede la sua chiave di pubblicazione. Hivesigner legge i tuoi callback dall’account quando si apre una richiesta di accesso, quindi una modifica vale appena la transazione entra in un blocco.

> **Nota:** Nome, immagine e descrizione li pubblica l’account della tua app stesso. Per questo la schermata di consenso mostra anche il vero nome dell’account (`@myapp`) e l’host verso cui manda la persona: sono quelli che la concessione e il reindirizzamento usano davvero.

## Callback {#callbacks}

Un callback (il `redirect_uri` di una richiesta di accesso) è il posto in cui Hivesigner riporta la persona con un token o un codice. Hivesigner lo manda solo a un callback elencato sull’account della tua app.

### Le regole {#callback-rules}

- **Corrispondenza esatta.** Il `redirect_uri` della richiesta deve essere uno dei tuoi URI di reindirizzamento, carattere per carattere: schema, host, porta, percorso e query.
- **Solo https.** Un callback deve usare `https://`. L’`http://` semplice è accettato solo su loopback: `localhost`, `127.0.0.1` o `[::1]`.
- **Le porte di loopback possono cambiare.** Un callback di loopback registrato con http semplice corrisponde a qualunque host e porta di loopback con lo stesso percorso, query, frammento e informazioni utente. Un callback di loopback registrato con `https://` resta una corrispondenza esatta.
- **Niente schemi propri.** Un callback come `myapp://callback` viene rifiutato. Vedi [App mobili e desktop](#native-apps).
- **Niente frammenti.** Non aggiungere un `#fragment` a un callback.

La pagina del profilo si rifiuta di salvare un callback che non potrebbe mai funzionare, con «URL di callback non utilizzabile (https, oppure http su localhost)».

### Esempi {#callback-examples}

Con questi URI di reindirizzamento registrati:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| `redirect_uri` nella richiesta | Esito |
| --- | --- |
| `https://myapp.example/auth/callback` | Accettato: corrispondenza esatta |
| `https://myapp.example/auth/callback/` | Rifiutato: `/` in più |
| `https://myapp.example/auth/callback?next=home` | Rifiutato: la query è diversa |
| `https://www.myapp.example/auth/callback` | Rifiutato: un altro host |
| `http://myapp.example/auth/callback` | Rifiutato: http semplice fuori dal loopback |
| `http://localhost:3000/auth` | Accettato: corrispondenza esatta |
| `http://127.0.0.1:51234/auth` | Accettato: loopback, stesso percorso, altra porta |
| `http://[::1]:3000/auth` | Accettato: loopback, stesso percorso |
| `http://127.0.0.1:3000/other` | Rifiutato: un altro percorso |
| `https://localhost:3000/auth` | Rifiutato: https non corrisponde a una registrazione con http semplice |
| `myapp://auth` | Rifiutato: schema proprio |

Per accettare una query sul tuo callback, registra il callback con quella query esatta. Hivesigner conserva la query del tuo callback e aggiunge i suoi parametri dopo di essa.

### App mobili e desktop {#native-apps}

Hivesigner mette il token nell’URL di callback. Uno schema proprio come `myapp://` non è legato a una sola app: un’altra app sullo stesso dispositivo può rivendicarlo e ricevere il token. Per questo Hivesigner rifiuta gli schemi propri e manda i token solo a un indirizzo https o al loopback sul dispositivo della persona.

Un’app nativa usa invece una di queste vie:

- **Un link https che le appartiene.** Registra un callback sul tuo dominio che il sistema operativo apre nella tua app (App Links su Android o Universal Links su iOS).
- **Un callback di loopback.** L’app ascolta il reindirizzamento su `127.0.0.1`. Registra `http://127.0.0.1/auth` (o `localhost`) e usa una porta libera qualsiasi in esecuzione: la porta non deve corrispondere.

## Client secret {#client-secret}

Il client secret dimostra che uno scambio di codice viene dal tuo server. È obbligatorio per il [flusso con codice](/docs/oauth2#code-flow): il tuo server lo manda con ogni codice o token di aggiornamento a `/api/oauth2/token`. Il flusso con token non lo usa.

- **Genera un valore casuale lungo**, per esempio con `openssl rand -hex 32`.
- **Impostalo nella pagina del profilo.** Hivesigner conserva solo il suo hash sha256, nel profilo dell’account della tua app. Lasciare il campo vuoto mantiene il segreto attuale.
- **Tienilo sul tuo server.** Non metterlo mai in una pagina web, in un’app mobile o in un URL.
- **Per cambiarlo,** impostane uno nuovo e aggiorna il tuo server nello stesso momento.

## Concedere a @hivesigner l’autorità di pubblicazione {#grant-hivesigner}

L’API trasmette con la chiave di pubblicazione dell’account @hivesigner. Hive accetta quella firma per i tuoi utenti solo quando l’account della tua app ha aggiunto @hivesigner alla propria autorità di pubblicazione. Vedi [La catena dell’autorità di pubblicazione](/docs/how-it-works#authority-chain).

1. Seleziona l’account della tua app in Hivesigner.
2. Apri https://hivesigner.com/authorize/hivesigner.
3. La pagina dice «Autorizza @hivesigner» e «@hivesigner potrà pubblicare, commentare, votare e seguire come @myapp.». Scegli **Autorizza**. Serve la chiave attiva dell’account app.

Lo fai una volta sola. Senza di esso ogni trasmissione fallisce con `unauthorized_client` e «Broadcaster account doesn't have permission to broadcast for @myapp». A un’app di solo accesso non serve.

Questa concessione permette anche a @hivesigner di pubblicare come l’account della tua app stesso, un motivo in più per tenere l’account app solo per l’app.

Le app che trasmettono tramite Hivesigner con questa concessione attiva possono comparire nella directory delle app su https://hivesigner.com/apps, ordinate per quante persone le usano.

## Che cosa vedono gli utenti quando qualcosa non va {#refused-requests}

Hivesigner rifiuta una richiesta a cui non può rispondere in sicurezza. Mostra un messaggio e un pulsante **Segnala questo problema**. La richiesta non si può approvare. Al tuo callback non viene mandato nulla.

| Problema | Che cosa legge la persona |
| --- | --- |
| Il `redirect_uri` non è uno dei tuoi URI di reindirizzamento | «L’URL di reindirizzamento di questa app non è registrato. Per la tua sicurezza, l’accesso è bloccato.» |
| Il `client_id` non è un account Hive | «@myapp non è un account Hive, quindi non c’è nessuna app da autorizzare. Torna al sito e riprova.» |
| L’account non è segnato come app | «@myapp non è configurato come app, quindi non può farti accedere. Torna al sito e riprova.» Attiva **Questo account è un'app**, come sopra. |
| Nella richiesta manca il `redirect_uri` | «Questa richiesta di autorizzazione è incompleta: non indica alcuna app o alcun URL di reindirizzamento. Torna all’app e riprova.» |

Se i tuoi utenti segnalano uno di questi casi, confronta il `redirect_uri` che la tua app manda con i tuoi URI di reindirizzamento, carattere per carattere.

## Elenco di controllo {#checklist}

1. Un account Hive per l’app, aggiunto a Hivesigner con la sua chiave attiva.
2. Su https://hivesigner.com/profile: «Questo account è un'app» attivo, gli URI di reindirizzamento elencati, un client secret impostato se usi il flusso con codice.
3. @hivesigner autorizzato su https://hivesigner.com/authorize/hivesigner, se trasmetti tramite l’API.
4. Un link di accesso che manda esattamente uno dei tuoi URI di reindirizzamento. Vedi [Accedere con OAuth2](/docs/oauth2).
