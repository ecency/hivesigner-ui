Le tue chiavi Hive controllano il tuo account. Chiunque le possieda può agire al posto tuo. Hivesigner le tiene nel tuo browser e ti mostra che cosa firmi. Queste abitudini le tengono al sicuro.

## Controlla prima l’indirizzo {#check-the-address}

Prima di digitare una chiave o un codice di accesso, guarda la barra degli indirizzi del browser. Deve mostrare `https://hivesigner.com`.

- Una pagina falsa copia l’aspetto di Hivesigner, non il suo indirizzo. Leggi l’indirizzo per intero: `hivesigner.com.example.net` non è hivesigner.com.
- Fai attenzione a una parola in più, a una lettera mancante o scambiata o a una terminazione diversa.
- Hivesigner mostra nella barra in alto l’indirizzo su cui è in esecuzione. Una pagina falsa può scriverci qualsiasi testo, quindi fidati della barra degli indirizzi del browser.
- Per aggiungere una chiave, digita tu stesso l’indirizzo oppure usa un segnalibro. Non seguire un link contenuto in un messaggio, in un annuncio o in un risultato di ricerca.

## Che cosa non devi mai comunicare {#never-needed}

- Accedere, pubblicare, votare, fare operazioni di portafoglio e autorizzare app non richiedono mai la tua password principale né la tua chiave proprietario. Vedi [Quale chiave aggiungere](/docs/accounts#which-key).
- Le app che usano Hivesigner non hanno mai bisogno delle tue chiavi. Ti mandano su hivesigner.com. Le tue chiavi restano nel tuo browser. Un sito che ti chiede di digitare una chiave su una sua pagina non te la sta chiedendo tramite Hivesigner.
- Non dare mai le tue chiavi o il tuo codice di accesso a chi te li chiede, né in chat, né via e-mail, né in una richiesta di assistenza.

## Aggiungi solo le chiavi che ti servono {#only-the-keys-you-need}

- Aggiungi la chiave di pubblicazione per l’uso quotidiano.
- Aggiungi la chiave attiva solo per le operazioni di portafoglio, per autorizzare un’app la prima volta o per revocare un’app.
- Evita di aggiungere la tua password principale. Se la aggiungi, Hivesigner salva ogni chiave che ne deriva, compresa quella proprietario.

Dopo aver autorizzato un’app per la prima volta, la chiave attiva resta su questo dispositivo. Per tenere qui solo la chiave di pubblicazione, [rimuovi l’account](/docs/accounts#remove-account). Poi [aggiungilo di nuovo](/docs/accounts#add-account) con la sola chiave di pubblicazione.

## Usa un codice di accesso {#use-a-passcode}

Senza codice di accesso, Hivesigner salva le tue chiavi in questo browser senza cifratura. Le apre da solo a ogni avvio, quindi chiunque usi questo browser può firmare al posto tuo. La pagina **Account** contrassegna un account così con **Nessun codice di accesso**.

- Scegli un codice di accesso che gli altri non possano indovinare. Hivesigner accetta 4 caratteri o più. Uno più lungo è più difficile da indovinare.
- Non usare come codice di accesso la tua password principale Hive né una delle tue chiavi.

Su un computer usato anche da altre persone:

- Usa sempre un codice di accesso.
- Chiudi la scheda di Hivesigner quando hai finito. Un account sbloccato resta sbloccato in quella scheda finché non la chiudi o non la ricarichi.
- Su un computer che non è tuo, [rimuovi l’account](/docs/accounts#remove-account) prima di andartene. Meglio ancora, non aggiungere lì le tue chiavi.

## Leggi prima di approvare {#read-before-approving}

- **Controlla l’account.** La riga che dice «Accesso come», «Autorizzazione come» o «Firma come» indica l’account che risponde. Cambialo se non è quello giusto.
- **Controlla dove andrai dopo.** «Ti porta a HOST» e «Verrai reindirizzato a HOST.» indicano il sito che riceve il risultato. Deve essere il sito da cui sei arrivato.
- **Controlla chi sta chiedendo.** Un’app sceglie da sé il proprio nome visualizzato. La riga «Account Hive @ACCOUNT_APP» mostra il suo vero account Hive. Nella pagina per autorizzare o revocare un’app, Hivesigner dice del profilo dell’app: «Tutte le informazioni qui sopra sono pubblicate dall’account stesso dell’app. Hivesigner non ne verifica nessuna.»
- **Controlla la chiave.** Un voto, un post o un seguito richiedono la chiave di pubblicazione. Se volevi votare e la schermata chiede la chiave attiva o proprietario, la richiesta fa altro. Fermati.
- **Leggi i cambi di autorità.** «chiavi: NESSUNA (la tua chiave viene rimossa)» significa che la modifica toglierebbe la tua chiave dal tuo account. Approva una modifica alle tue chiavi solo se l’hai avviata tu.
- **Leggi gli avvisi.** «Questa richiesta non agisce per conto di @UTENTE, ma per conto di @ACCOUNT.» significa che la richiesta agisce per un altro account.
- **Firma solo messaggi che comprendi.** Un messaggio firmato dimostra a chiunque che hai firmato esattamente quel testo.

Vedi [Controllare e firmare](/docs/signing) per tutto ciò che mostrano le schermate di firma.

## Riconoscere una pagina falsa {#spot-a-fake-page}

Una pagina che sembra Hivesigner è falsa quando:

- **L’indirizzo non è hivesigner.com.** È l’unico segnale che vale sempre.
- **Rifiuta la tua chiave di pubblicazione.** Il vero Hivesigner accetta la chiave di pubblicazione e ti fa accedere con quella. Una pagina che insiste sulla password principale o sulla chiave proprietario non è Hivesigner.
- **Non conosce gli account che hai aggiunto.** Il browser tiene separata l’archiviazione di ogni sito. Un sito falso su un altro indirizzo non può vedere gli account aggiunti su hivesigner.com, quindi chiede di nuovo una chiave. Il vero Hivesigner li ricorda in questo browser e chiede solo il codice di accesso, se ne hai impostato uno. Chiede una chiave solo quando una richiesta ne esige una che questo dispositivo non ha, e in quel caso dice quale. Per esempio: «Serve la tua chiave attiva, che @UTENTE non ha qui.»

Anche un browser nuovo o un dispositivo nuovo non hanno i tuoi account. Lì, controlla l’indirizzo prima di aggiungerne uno.

Se hai digitato una chiave su una pagina falsa, consideriamola rubata. Cambiala su Hive il prima possibile.

## Il codice è open source {#open-source}

Il codice di Hivesigner è pubblico su [github.com/ecency/hivesigner-ui](https://github.com/ecency/hivesigner-ui). Chiunque può leggerlo e controllare come tratta le tue chiavi. Per segnalare un problema, apri una issue su [github.com/ecency/hivesigner-ui/issues](https://github.com/ecency/hivesigner-ui/issues). La pagina **Informazioni** rimanda lì con la voce **Segnala un bug**.
