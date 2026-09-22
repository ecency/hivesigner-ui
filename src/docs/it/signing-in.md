Quando un’app ti permette di accedere con Hivesigner, ti manda su hivesigner.com con una richiesta. Hivesigner mostra chi sta chiedendo, che cosa chiede e quale dei tuoi account risponde. Lì decidi tu. L’app non riceve mai le tue chiavi: ottiene una prova del tuo nome utente, firmata nel tuo browser.

## La schermata della richiesta {#request-screen}

Dall’alto verso il basso, la schermata mostra:

- **L’app.** La sua immagine e un titolo. Quando l’app chiede l’accesso di pubblicazione per la prima volta, il titolo dice «APP chiede l’accesso al tuo account.» Altrimenti dice «Accedi a APP». Il nome che vi compare lo sceglie l’app.
- **Account Hive @ACCOUNT_APP.** Il vero account Hive dell’app. Un’app può chiamarsi come vuole, ma non può cambiare questo nome. Controllalo.
- **Ti porta a HOST.** Il sito a cui Hivesigner ti rimanda quando approvi.
- **Ambito.** Ciò che l’app chiede: [solo accesso o accesso di pubblicazione](/docs/signing-in#scopes).
- **La riga dell’account.** «Autorizzazione come» o «Accesso come», con l’account che l’app otterrà e un link **Cambia account**. Vedi [Scegli l’account](/docs/signing-in#choose-account).
- **Il pulsante.** **Autorizza** o **Accedi**. Se l’account è bloccato, sopra compare un campo **Codice di accesso** e un clic sblocca l’account e prosegue.
- **Annulla.** Ti porta alla tua pagina **Account**. Hivesigner non invia nulla all’app.

Se questo browser non ha ancora nessun account, il pulsante dice **Continua**. Apre il modulo **Aggiungi account** e poi ti riporta alla richiesta. Vedi [Aggiungere un account](/docs/accounts#add-account).

## Solo accesso o accesso di pubblicazione {#scopes}

Un’app chiede una di queste due cose. Non c’è niente nel mezzo.

### Solo accesso {#sign-in-only}

**Ambito** mostra «Vedere il nome utente del tuo account». L’app scopre quale account Hive sei, confermato dalla tua firma. Non ottiene alcun permesso di agire al posto tuo. Il pulsante dice **Accedi**.

Anche un sito senza un proprio account Hive può chiederti di accedere. La sua schermata dice «HOST vuole confermare il tuo nome utente Hive.» Una richiesta così è sempre di solo accesso. Hivesigner indica il sito con il suo indirizzo, perché quell’indirizzo è l’unica cosa che puoi verificare su di esso.

### Accesso di pubblicazione {#posting-access}

**Ambito** mostra «Con la tua autorità di pubblicazione, APP potrà:» seguito da che cosa significa:

- **Pubblicare e commentare:** pubblicare post e commenti a tuo nome.
- **Votare:** dare voti positivi e negativi con il tuo account.
- **Seguire e aggiornare il tuo feed:** seguire, silenziare e ripubblicare a tuo nome.

L’autorità di pubblicazione è la parte del tuo account Hive che governa le azioni di tutti i giorni. Approvando, l’account Hive dell’app viene aggiunto alla tua autorità di pubblicazione. È una sola concessione sulla blockchain Hive, non un elenco di permessi separati.

## Che cosa consente l’accesso di pubblicazione {#what-posting-access-allows}

Con l’accesso di pubblicazione, l’app può fare a tuo nome tutto ciò che può fare la tua chiave di pubblicazione:

- pubblicare, modificare ed eliminare i tuoi post e i tuoi commenti
- votare
- seguire, silenziare e ripubblicare
- modificare il tuo profilo
- riscuotere le tue ricompense sul tuo portafoglio
- altre azioni quotidiane che le app e i giochi di Hive utilizzano

Non può mai:

- muovere i tuoi fondi: inviare HIVE o HBD, fare power up o power down, delegare Hive Power o usare i tuoi risparmi
- cambiare le tue chiavi o chi controlla il tuo account
- dare accesso ad altre app

> **Attenzione:** autorizza solo le app di cui ti fidi. L’accesso di pubblicazione dura finché non lo revochi. È salvato sulla blockchain Hive, non in Hivesigner: rimuovere l’account da Hivesigner non lo fa cessare.

## La prima volta che autorizzi un’app {#first-time}

La prima volta che dai a un’app l’accesso di pubblicazione, la schermata mostra questo avviso: «Prima autorizzazione: questa operazione aggiunge @ACCOUNT_APP alla tua autorità di pubblicazione sulla blockchain e richiede la tua chiave attiva una sola volta. Quell’account potrà pubblicare a tuo nome finché non lo revochi.»

Cambiare chi può pubblicare per il tuo account è una modifica dell’account stesso, quindi serve la tua chiave attiva. Se questo dispositivo non ce l’ha, la schermata la chiede sul posto:

1. Incolla la chiave attiva in **Chiave attiva o password principale di @UTENTE**. Hivesigner la confronta con il tuo account sulla rete Hive e la salva su questo dispositivo insieme alle altre chiavi. Se incolli la password principale, Hivesigner ne conserva solo la chiave attiva, più quella di pubblicazione se questo dispositivo non ce l’ha.
2. Se l’account non ha un codice di accesso, il modulo propone **Proteggi con un codice di accesso (consigliato)**, selezionato per impostazione predefinita. Se ne ha uno e Hivesigner ne ha di nuovo bisogno, il modulo lo chiede in **Codice di accesso per @UTENTE**.
3. Seleziona **Aggiungi chiave attiva**, poi **Autorizza**.

Hivesigner invia poi la modifica alla rete Hive dal tuo browser. Aspetta che la modifica compaia sulla blockchain prima di rimandarti all’app, con l’accesso eseguito. Se ci vuole troppo tempo, vedi «L’autorizzazione è stata inviata, ma è ancora in fase di conferma. Riprova tra un momento.»

La chiave attiva resta poi su questo dispositivo. Per tenere qui solo la chiave di pubblicazione, vedi [Aggiungi solo le chiavi che ti servono](/docs/safety#only-the-keys-you-need).

## Autorizzare un’app dalla directory {#directory}

Ogni app su [hivesigner.com/apps](https://hivesigner.com/apps) apre una pagina intitolata «Autorizza @ACCOUNT_APP». Mostra ciò che l’app pubblica su di sé e la frase «@ACCOUNT_APP potrà pubblicare, commentare, votare e seguire come @UTENTE.»

Selezionare **Autorizza** dà subito all’app l’accesso di pubblicazione, come fa la schermata della prima autorizzazione. Serve la tua chiave attiva. Nessuna app te lo ha chiesto, quindi usala solo quando è davvero ciò che vuoi. **Annulla** ti porta alla tua pagina **Account**.

Quando il tuo account ha già dato all’app l’accesso di pubblicazione, la pagina dice «Autorizzazione concessa a @ACCOUNT_APP.» e propone **Continua**.

## Tornare a un’app {#coming-back}

Quando il tuo account ha già dato a un’app l’accesso di pubblicazione, non viene concesso nulla di nuovo. La schermata è più breve:

- Il titolo dice «Accedi a APP».
- Una riga dice «Hai già autorizzato @ACCOUNT_APP. Non viene concesso nessun nuovo permesso.»
- La riga dell’account dice «Accesso come».
- Il pulsante dice **Accedi**.

Per questo ti serve solo la chiave di pubblicazione (o la chiave attiva). Se nel frattempo hai revocato l’app, ricompare la schermata della prima autorizzazione.

## Scegli l’account {#choose-account}

La riga dell’account indica l’account che l’app otterrà. Controllala prima di approvare, soprattutto se hai più account su questo dispositivo.

- Seleziona **Cambia account** per aprire sul posto l’elenco dei tuoi account. Scegline un altro e la schermata passa a quell’account.
- Seleziona **Aggiungi un altro account** sotto l’elenco per aggiungere un account non ancora presente su questo dispositivo. Hivesigner poi ti riporta alla richiesta.

Un’app può suggerire quale account usare. Se quell’account è su questo dispositivo, Hivesigner lo seleziona. Puoi comunque cambiarlo.

## Quando Hivesigner rifiuta una richiesta {#refused-requests}

Hivesigner non ti lascia approvare una richiesta che non può verificare. La schermata mostra invece uno di questi messaggi:

| Messaggio | Che cosa significa |
| --- | --- |
| «L’URL di reindirizzamento di questa app non è registrato. Per la tua sicurezza, l’accesso è bloccato.» | L’indirizzo di ritorno non è tra quelli che l’app ha elencato sul suo account Hive. |
| «@ACCOUNT_APP non è un account Hive, quindi non c’è nessuna app da autorizzare. Torna al sito e riprova.» | La richiesta indica un’app che non esiste. |
| «Questo sito ha chiesto di ricevere il tuo accesso tramite un indirizzo http:// non cifrato. Hivesigner lo invia solo tramite https. Chiedi al sito di usare un indirizzo sicuro.» | L’indirizzo di ritorno non è sicuro. |
| «Questo sito ha chiesto di ricevere il tuo accesso a un indirizzo che non è un URL web. Torna al sito e riprova.» | L’indirizzo di ritorno non è un indirizzo web. |
| «Questa richiesta di autorizzazione è incompleta: non indica alcuna app o alcun URL di reindirizzamento. Torna all’app e riprova.» | Alla richiesta mancano delle parti. |

Torna all’app e riprova. Se il problema resta, seleziona **Segnala questo problema**. Questo invia il link e la tua nota facoltativa al team di Hivesigner, con i segreti oscurati.

Se Hivesigner non riesce a raggiungere la rete Hive, mostra «Impossibile caricare i dati dell’account dalla rete Hive.» Seleziona **Riprova**.

## Vedere e togliere l’accesso di un’app {#remove-access}

1. Apri [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps). Il piè di pagina vi rimanda con la voce **App autorizzate**.
2. La pagina mostra «App che possono pubblicare come @UTENTE.» per l’account selezionato, con ogni app sotto. Per vedere le app di un altro account, selezionalo prima nella pagina **Account**.
3. Se l’account è bloccato, inserisci il suo codice di accesso e seleziona **Sblocca**.
4. Seleziona **Revoca** accanto all’app. Quando la chiave attiva è su questo dispositivo, l’accesso dell’app viene tolto subito.

L’elenco mostra ogni account che può pubblicare come il tuo di propria iniziativa, compresi quelli aggiunti con altri strumenti.

La revoca è una modifica del tuo account sulla blockchain Hive, quindi richiede la chiave attiva una volta. Se questo dispositivo non ce l’ha, **Revoca** apre una pagina per quell’app («Revoca @ACCOUNT_APP») che chiede lì la chiave attiva. Dice «@ACCOUNT_APP non potrà più agire come @UTENTE.» Aggiungi la chiave, poi seleziona **Revoca**.

Quando revochi un’app, Hivesigner toglie l’account dell’app dall’autorità di pubblicazione del tuo account (e dalla sua autorità attiva, se è anche lì). Da quel momento l’app non può più pubblicare, votare né agire al posto tuo. Se in seguito l’app chiede di nuovo l’accesso di pubblicazione, vedrai la schermata della prima autorizzazione.

La revoca non ti disconnette dal sito web dell’app. Se vuoi, esci anche da lì.
