Hivesigner firma con le chiavi degli account Hive che gli aggiungi. Un account si aggiunge una volta in ogni browser che usi. Hivesigner tiene poi le sue chiavi in quel browser, cifrate con un codice di accesso se ne imposti uno.

## Aggiungere un account {#add-account}

1. Controlla che la barra degli indirizzi del browser mostri `https://hivesigner.com`. Vedi [Controlla prima l’indirizzo](/docs/safety#check-the-address).
2. Apri [hivesigner.com/import](https://hivesigner.com/import). Se questo browser non ha ancora nessun account, **Configura Hivesigner** nella pagina iniziale apre lo stesso modulo.
3. In **Nome utente**, inserisci il tuo nome utente Hive in minuscolo, senza la `@`.
4. In **Chiave privata**, incolla una delle tue chiavi private. Leggi prima [Quale chiave aggiungere](/docs/accounts#which-key).
5. Lascia selezionato **Proteggi con un codice di accesso (consigliato)** e scegli un **Codice di accesso**. Servono almeno 4 caratteri. Vedi [Proteggilo con un codice di accesso](/docs/accounts#passcode).
6. Seleziona **Aggiungi account**.

Prima di salvare qualsiasi cosa, Hivesigner confronta la chiave con il tuo account sulla rete Hive. Confronta la parte pubblica della chiave con le chiavi elencate dal tuo account. La chiave privata in sé non viene inviata da nessuna parte. Se il nome utente non corrisponde a un account Hive, o se la chiave non gli appartiene, il modulo dice «Nome utente o chiave non validi. Usa la tua password principale o la tua chiave proprietario, attiva, di pubblicazione o memo.»

L’account che aggiungi diventa l’account selezionato: quello che Hivesigner usa nelle sue schermate. Se sei arrivato al modulo da una richiesta, Hivesigner ti riporta a quella richiesta. Altrimenti apre la pagina **Account**.

### Aggiungere un’altra chiave a un account {#add-a-key}

Per aggiungere una seconda chiave a un account già presente qui (per esempio la chiave attiva accanto a quella di pubblicazione), aggiungi di nuovo l’account con la chiave nuova. Hivesigner mantiene le chiavi che ha già e aggiunge quella nuova. Una chiave nuova per un ruolo già presente sostituisce quella vecchia.

Se l’account ha un codice di accesso, lascia selezionato **Proteggi con un codice di accesso (consigliato)** e inserisci lo stesso codice. Hivesigner rifiuta qualsiasi altra cosa:

- Senza codice di accesso, il modulo dice «Questo account è protetto su questo dispositivo. Inserisci il suo codice di accesso per aggiungere la chiave.»
- Con un codice diverso, dice «Codice di accesso errato. La chiave non è stata salvata.»

## Quale chiave aggiungere {#which-key}

Un account Hive ha diverse chiavi private. Ognuna consente azioni diverse. Le hai ricevute dal portafoglio o dall’app che ha creato il tuo account Hive, di solito nella sua pagina delle chiavi o della password. Hivesigner non può mostrartele.

| Chiave | A cosa serve in Hivesigner |
| --- | --- |
| Pubblicazione | Accedere alle app, votare, pubblicare e commentare, seguire, modificare il profilo e riscuotere le ricompense. |
| Attiva | Operazioni di portafoglio come trasferimenti, power up o power down, deleghe, risparmi e conversioni. Voti per witness e proposte. Autorizzare un’app la prima volta e revocare un’app. |
| Proprietario | Cambiare la chiave proprietario o l’account di recupero. Nell’uso quotidiano non serve mai. |
| Memo | Nulla. Il modulo la accetta, ma un account che ha solo la chiave memo non può accedere: la schermata della richiesta mostra allora «Aggiungi una chiave di pubblicazione o una chiave attiva di @UTENTE per continuare». |

Aggiungi la chiave di pubblicazione per l’uso quotidiano. Aggiungi la chiave attiva solo quando ti serve per un’operazione di portafoglio o per autorizzare un’app la prima volta. Quando una schermata ha bisogno di una chiave che questo dispositivo non ha, lo dice e ti permette di aggiungerla.

Anche la tua password principale funziona nel campo **Chiave privata**. Hivesigner ne deriva le tue chiavi e salva ogni chiave che corrisponde ancora al tuo account, compresa quella proprietario. Aggiungendo le chiavi una per una, la chiave proprietario resta fuori da questo dispositivo.

> **Nota:** Hivesigner firma ogni transazione esattamente con la chiave che le serve. Segue una regola di Hive in vigore da un hard fork del 2025. Una chiave attiva non può più firmare un’azione di pubblicazione come un voto. Una chiave proprietario non può più firmare un’operazione di portafoglio. Aggiungi la chiave di pubblicazione anche se la chiave attiva è già qui.

Accedere a un’app è diverso: non è una transazione. Hivesigner ti fa accedere con la chiave di pubblicazione, oppure con quella attiva quando questo dispositivo non ha la chiave di pubblicazione dell’account.

## Proteggilo con un codice di accesso {#passcode}

Il codice di accesso è una password che scegli solo per questo browser. Non è la tua password Hive e non è nessuna delle tue chiavi. Hivesigner lo usa per cifrare le chiavi dell’account prima di salvarle e lo richiede per decifrarle.

- Hivesigner non salva il tuo codice di accesso e non lo invia da nessuna parte. Nessuno può recuperarlo per te.
- Ogni account su questo dispositivo ha il proprio codice di accesso. Puoi usare lo stesso per tutti.
- Un codice più lungo è più difficile da indovinare. Non usare come codice di accesso la tua password principale Hive né una delle tue chiavi.

Senza codice di accesso, Hivesigner salva le chiavi dell’account in questo browser senza cifratura. Le apre da solo a ogni avvio, quindi chiunque usi questo browser può firmare con quelle chiavi. La pagina **Account** contrassegna un account così con **Nessun codice di accesso**.

Per aggiungere un codice di accesso a un account che non ne ha, aggiungi di nuovo l’account con una delle sue chiavi e un codice di accesso. Hivesigner cifra allora tutte le chiavi dell’account con quel codice.

Per cambiare un codice di accesso, [rimuovi l’account](/docs/accounts#remove-account) e aggiungilo di nuovo con il codice nuovo. La rimozione cancella da questo browser tutte le chiavi dell’account, quindi aggiungi di nuovo ogni chiave (quella di pubblicazione e poi quella attiva, se la usi).

## Sbloccare un account {#unlock}

Un account con codice di accesso parte bloccato ogni volta che Hivesigner si apre: in una scheda nuova, dopo un ricaricamento o quando un’app ti manda qui. Non serve sbloccarlo in anticipo. La schermata che ha bisogno delle chiavi mostra un campo **Codice di accesso** sopra il proprio pulsante (per esempio **Accedi**, **Approva** o **Sblocca**). Un clic sblocca l’account e prosegue.

Un codice errato mostra «Codice di accesso errato.» e non viene firmato nulla.

Hivesigner tiene le chiavi sbloccate solo in memoria, mai nell’archiviazione. L’account resta sbloccato in quella scheda finché non la chiudi o non la ricarichi.

## Cambiare account {#switch-accounts}

La pagina **Account** elenca gli account di questo dispositivo dalla A alla Z. L’account selezionato ha un segno di spunta. Da 6 account in su, un campo **Cerca account** filtra l’elenco.

Seleziona un account per renderlo l’account selezionato. Qui Hivesigner non chiede il codice di accesso. Lo chiede la schermata che ha bisogno delle chiavi.

Nella schermata di una richiesta, la riga che indica l’account («Accesso come», «Autorizzazione come» o «Firma come») ha un link **Cambia account**. Apre lo stesso elenco sul posto, così puoi scegliere un altro account senza lasciare la richiesta. **Aggiungi un altro account**, sotto l’elenco, apre il modulo **Aggiungi account** e poi ti riporta alla richiesta.

## Rimuovere un account {#remove-account}

1. Apri la pagina **Account**.
2. Seleziona la **✕** accanto all’account. La sua etichetta per gli screen reader è **Rimuovi da Hivesigner @UTENTE**.
3. Conferma quando il browser chiede «Rimuovere @UTENTE da questo dispositivo? Le chiavi di questo account salvate qui verranno eliminate.»

Rimuovere un account cancella le sue chiavi solo da questo browser. Il tuo account Hive non cambia. Le app che hai autorizzato mantengono l’accesso, perché quell’accesso è salvato sulla blockchain Hive. Per toglierlo, vedi [Vedere e togliere l’accesso di un’app](/docs/signing-in#remove-access).

Se rimuovi l’account selezionato, un altro account di questo dispositivo diventa quello selezionato.

Se il browser non lascia salvare la modifica a Hivesigner, vedi «Rimosso solo per questa sessione: l’archiviazione non è disponibile, quindi questo account ricomparirà quando ricarichi la pagina.»

## Se dimentichi il codice di accesso {#forgotten-passcode}

Nessuno può recuperare un codice di accesso, neanche Hivesigner. Il tuo account Hive non ne risente: il codice protegge solo la copia delle tue chiavi presente in questo browser.

1. [Rimuovi l’account](/docs/accounts#remove-account) da questo dispositivo.
2. [Aggiungilo di nuovo](/docs/accounts#add-account) con la sua chiave e un nuovo codice di accesso.

Sulla blockchain Hive non cambia nulla. Le app che hai autorizzato mantengono l’accesso.

## Dove sono salvate le tue chiavi {#where-keys-are-stored}

Hivesigner salva le tue chiavi solo in questo browser, su questo dispositivo, nell’archiviazione che il browser riserva a hivesigner.com.

- Non vengono sincronizzate. Un altro browser, un altro profilo del browser o un altro dispositivo non le hanno. Aggiungi l’account anche lì.
- Cancellare i dati del sito o i dati di navigazione per hivesigner.com le elimina. Lo stesso vale per la chiusura di una finestra anonima.
- Hivesigner non è un backup. Conserva le tue chiavi o la tua password principale al sicuro da un’altra parte.
