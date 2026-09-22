Le app possono chiederti di firmare una transazione Hive, come un voto, un trasferimento o un post. Ti mandano un link che apre Hivesigner. Hivesigner mostra con parole semplici che cosa fa la richiesta, quale chiave le serve e dove ti manda dopo. Nulla viene firmato finché non approvi. Le app possono anche chiederti di firmare un messaggio, che non arriva mai sulla blockchain.

## La schermata Conferma transazione {#confirm-screen}

Un link di firma apre una schermata intitolata «Conferma transazione». Mostra una scheda per ogni operazione contenuta nella richiesta. Un’operazione è una singola azione su Hive, come un voto o un trasferimento.

Quando una richiesta contiene più di un’operazione, le schede sono numerate e una riga sopra dice «Questa richiesta contiene 3 operazioni. Controllale tutte prima di approvare.»

### Il riepilogo {#summary}

Ogni scheda inizia con una frase che dice che cosa fa l’operazione, con i valori presi dalla richiesta. Per esempio:

| Operazione | Che cosa dice la scheda |
| --- | --- |
| Un trasferimento | Invia 1.000 HIVE a @bob (e sotto il memo, nella forma Memo: ...) |
| Un voto | Voto positivo a @alice/mio-post (e sotto il peso del voto, per esempio 100%) |
| Un post o una risposta | Pubblica il post «Il mio titolo», oppure Rispondi a @alice/mio-post |
| Un’azione definita da un’app di Hive | Azione personalizzata (follow) |
| Una modifica di chi controlla un account | Aggiorna le autorità dell’account |

Le altre operazioni mostrano il proprio nome, come «Power up» o «Delega Hive Power».

Accanto alla frase, un’etichetta in maiuscolo indica la chiave che serve all’operazione: PUBBLICAZIONE, ATTIVA o PROPRIETARIO.

### I dettagli {#details}

Sotto la frase, la scheda elenca i valori che l’operazione porta con sé:

- l’account per conto del quale l’operazione agisce
- per un post o un commento: il permalink (l’indirizzo del post), la community o il tag, il corpo e i metadati
- per un’azione personalizzata: ogni valore dei suoi dati, uno per riga, così che nulla venga troncato
- per una modifica delle autorità: la soglia, le chiavi e gli account che imposta

Una modifica delle autorità segnala anche quando toglierebbe le tue chiavi, con «chiavi: NESSUNA (la tua chiave viene rimossa)». Una soglia mancante compare come «soglia NON IMPOSTATA (trattata come 0)».

Nel riepilogo e nei dettagli, i caratteri che potrebbero nascondere del testo o cambiarne la direzione sono mostrati come `�`. Ciò che leggi non può fingersi qualcos’altro.

**Mostra l’operazione grezza** (o **Mostra le operazioni grezze**) apre le operazioni esatte che verranno firmate.

Quando un importo è espresso in Hive Power, Hivesigner lo converte al tasso attuale. Mostra «Caricamento del tasso attuale di Hive Power…» e attende quel tasso prima di lasciarti approvare.

Alcune richieste portano una transazione preparata altrove, per esempio per un account controllato da più persone. La schermata dice allora «Questa richiesta fornisce una propria intestazione di transazione. Scadenza: DATA.» Se altri l’hanno già firmata, aggiunge «Contiene già 2 firme.»

## Quale chiave serve {#which-key}

Sotto le schede, una riga indica la chiave che serve all’intera richiesta: «Verrà firmata con la tua chiave di pubblicazione», «Verrà firmata con la tua chiave attiva» oppure «Verrà firmata con la tua chiave proprietario».

Hivesigner firma esattamente con quella chiave. Una chiave attiva non può firmare un voto e una chiave proprietario non può firmare un trasferimento. È una regola di Hive dal hard fork del 2025. Vedi [Quale chiave aggiungere](/docs/accounts#which-key).

Tutte le operazioni di una stessa richiesta devono richiedere la stessa chiave. Quando non è così, la riga dice «Questa transazione richiede più di un’autorità e non può essere firmata con una sola chiave.» Non c’è nessun pulsante per approvare. Torna all’app.

Le richieste con la chiave proprietario sono rare. Cambiano chi può controllare o recuperare il tuo account. Leggile due volte. Vedi [Leggi prima di approvare](/docs/safety#read-before-approving).

### Quando la chiave manca {#missing-key}

Se l’account selezionato non ha quella chiave su questo dispositivo, la schermata lo dice. Per esempio: «Serve la tua chiave attiva, che @UTENTE non ha qui.»

1. Seleziona **Aggiungi un altro account** sotto il messaggio. Si apre il modulo **Aggiungi account**.
2. Inserisci lo stesso nome utente e la chiave mancante. Se l’account ha un codice di accesso, inserisci anche quello.
3. Seleziona **Aggiungi account**. Hivesigner aggiunge la chiave e ti riporta alla richiesta.

Se l’account è bloccato, la schermata mostra un campo **Codice di accesso** sopra il pulsante. Un clic sblocca l’account e approva. Se poi risulta che la chiave manca, la schermata te lo dice dopo lo sblocco.

Se questo browser non ha ancora nessun account, il pulsante dice **Continua** e apre il modulo **Aggiungi account**.

## Approvare o firmare {#approve}

La riga dell’account sopra il pulsante dice «Firma come» con l’account che firma. **Cambia account** ti permette di sceglierne un altro. Vedi [Cambiare account](/docs/accounts#switch-accounts).

- **Approva** firma la transazione nel tuo browser e la invia alla rete Hive. Il risultato dice «Transazione trasmessa con successo» con un **ID transazione** che apre la transazione in un block explorer.
- **Firma** compare al suo posto quando la richiesta chiede solo una firma. Hivesigner firma la transazione senza inviarla alla rete. Consegna la firma all’app, oppure la mostra quando la richiesta non indica nessun sito.

Se la rete rifiuta la transazione, vedi «La tua transazione non è stata trasmessa» con il «Messaggio di errore» fornito dalla rete. Puoi riprovare.

## Il sito a cui torni {#return-site}

Quando la richiesta indica un sito di ritorno, un avviso in alto dice «Verrai reindirizzato a HOST.» Dopo l’approvazione, Hivesigner ti manda lì. Controlla che HOST sia il sito da cui sei arrivato.

Quando la richiesta non indica nessun sito, Hivesigner resta sul risultato.

## Una richiesta per un altro account {#another-account}

Una richiesta può essere fatta per un account diverso da quello selezionato. Hivesigner lo mostra in due modi.

**La richiesta deve essere firmata da un altro account.** La schermata dice «Questa richiesta deve essere firmata da @ACCOUNT. Passa a quell’account.» La riga dell’account dice «Account selezionato» e sotto si apre l’elenco degli account. Scegli quell’account oppure aggiungilo con **Aggiungi un altro account**. Hivesigner non firma la richiesta con nessun altro account.

**Un’operazione agisce per conto di un altro account.** Succede con gli account gestiti da più persone. Un avviso in alto dice «Questa richiesta non agisce per conto di @UTENTE, ma per conto di @ACCOUNT. Continua solo se gestisci quell’account.» I dettagli di ogni scheda indicano l’account per conto del quale agisce.

## Le richieste che Hivesigner non può leggere {#invalid-requests}

Hivesigner non firma mai una richiesta che non può leggere e mostrarti per intero. Rientrano qui un’operazione che non conosce, una richiesta senza operazioni, un valore che non si adatta all’operazione (un numero che non è un numero, un importo malformato) e dati in più che non può mostrare.

La schermata dice allora «Ops, qualcosa è andato storto. I dati forniti non sono validi.» Torna all’app. Per avvisare il team di Hivesigner, seleziona **Segnala questo problema**.

## Le richieste di firma di un messaggio {#message-requests}

Alcune app ti chiedono di firmare un messaggio invece di una transazione, per esempio per dimostrare che un account è tuo. Un messaggio è testo. Firmarlo non cambia nulla sulla blockchain.

La schermata mostra:

- Un titolo come «APP ti chiede di firmare un messaggio.» Quando l’app ha un account Hive, la riga sotto lo indica: «Account Hive @ACCOUNT_APP».
- «Ti porta a HOST»: il sito che riceve la firma. La stessa riga compare di nuovo accanto al pulsante.
- **Messaggio**: il testo per intero, esattamente come verrà firmato. I caratteri che potrebbero nascondere del testo o cambiarne la direzione compaiono come codici evidenziati, per esempio `\u{200B}`.
- La chiave usata: «Verrà firmata con la tua chiave di pubblicazione» oppure «Verrà firmata con la tua chiave attiva». Hivesigner non firma mai un messaggio con la chiave proprietario.
- Un avviso: «La tua firma dimostra a chiunque la veda che @UTENTE ha firmato esattamente questo testo. Firma solo un messaggio che comprendi.»
- La riga dell’account, «Firma come», con **Cambia account**.

Seleziona **Firma** per firmare. Hivesigner ti riporta al sito con la firma, il tuo nome utente, il tipo di chiave e la chiave pubblica che ha prodotto la firma. Una chiave pubblica è la metà condivisibile di una coppia di chiavi: non può firmare nulla.

Seleziona **Annulla** per andare alla tua pagina **Account**. Il sito non riceve nulla.

Se l’account non ha quella chiave su questo dispositivo, la schermata lo dice. Per esempio: «Serve la tua chiave di pubblicazione, che @UTENTE non ha qui.» Seleziona **Cambia account**, poi **Aggiungi un altro account**. [Aggiungi la chiave mancante](/docs/accounts#add-a-key) per lo stesso account. Hivesigner ti riporta alla richiesta.

### Perché alcuni messaggi vengono rifiutati {#refused-messages}

**Un messaggio che funziona come un accesso a Hivesigner.** Certi testi hanno esattamente la forma di un accesso a Hivesigner. Firmarli darebbe al sito l’accesso al tuo account. Hivesigner non firma mai un testo così e dice «Questo messaggio è un token Hivesigner. Firmarlo darebbe al sito l’accesso al tuo account, quindi non può essere firmato.»

**Una richiesta che Hivesigner non può usare.** Hivesigner rifiuta una richiesta senza messaggio o senza indirizzo di ritorno. Rifiuta anche una richiesta per una chiave diversa da quella di pubblicazione o attiva, una che indica come app qualcosa che non è un account Hive, o una il cui indirizzo di ritorno non è sicuro o non è registrato per l’app. Dice «Questa richiesta di firma non è utilizzabile: servono un messaggio, una chiave di pubblicazione o attiva e un URL di reindirizzamento sicuro registrato per l’app. Torna al sito e riprova.»

Se Hivesigner non riesce a leggere i dati dell’app dalla rete Hive, dice «Impossibile caricare i dati dell’account dalla rete Hive.» Finché non ci riesce non firma nulla. Seleziona **Riprova**.

## Firmare un messaggio per conto proprio {#sign-message}

Puoi firmare un messaggio di tua iniziativa per dimostrare che controlli un account.

1. Apri [hivesigner.com/signmessage](https://hivesigner.com/signmessage). Il piè di pagina vi rimanda con la voce **Firma messaggio**.
2. Se l’account selezionato è bloccato, inserisci il suo codice di accesso e seleziona **Sblocca**. Se non c’è nessun account selezionato, la pagina rimanda ai tuoi account.
3. Scrivi il testo in **Messaggio**. Hivesigner toglie spazi e a capo all’inizio e alla fine.
4. Scegli la chiave in **Chiave per la firma**. Vi sono elencate le chiavi dell’account selezionato presenti su questo dispositivo, dalla più forte. All’inizio è scelta la più forte. Passa a **Pubblicazione** a meno che non ti serva un’altra chiave.
5. Seleziona **Firma messaggio**.

Il **Riepilogo della firma** mostra **Autore**, **Autorità usata**, un **Token di verifica** e un **Link di verifica**. Il token di verifica riunisce in un unico testo il messaggio, il tuo nome utente e la firma. Condividi il link o il token con chi deve controllare il messaggio.

Una firma non rivela la tua chiave. Mostra però quale chiave l’ha prodotta.

## Verificare un messaggio {#verify-message}

1. Apri [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage). Il piè di pagina vi rimanda con la voce **Verifica messaggio**.
2. Incolla il token in **Token di verifica** e seleziona **Verifica firma**.

Un link di verifica apre questa pagina e controlla il messaggio da solo.

Il risultato dice «La firma è valida per UTENTE» oppure «Impossibile verificare la firma con le chiavi dell’account.» Sotto compaiono **Autore**, **Chiave pubblica recuperata**, **Autorità corrispondente** (il tipo di chiave che ha firmato) e **Messaggio**.

Hivesigner verifica la firma con le chiavi che l’account ha adesso sulla rete Hive. Un messaggio firmato con una chiave che l’account ha poi sostituito non viene più verificato.
