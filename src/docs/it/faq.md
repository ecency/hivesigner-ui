Risposte brevi alle domande più comuni. Ognuna rimanda alla pagina con i dettagli.

## Usare Hivesigner {#using-hivesigner}

### Hivesigner è gratuito? {#is-it-free}

Sì. Hivesigner non fa pagare né le persone né le app. Il suo codice sorgente è aperto con licenza MIT.

### Hivesigner vede mai le mie chiavi? {#keys}

No. Le tue chiavi restano nel tuo browser, sul tuo dispositivo. Hivesigner firma lì. Non vengono mai inviate ai server di Hivesigner né alle app che usi. Vedi [Dove sono salvate le tue chiavi](/docs/accounts#where-keys-are-stored) e [Tieni al sicuro le tue chiavi](/docs/safety).

### E se dimentico il codice di accesso? {#forgotten-passcode}

Nessuno può recuperare un codice di accesso, neanche Hivesigner. Rimuovi l’account da Hivesigner e aggiungilo di nuovo con la tua chiave Hive e un nuovo codice di accesso. Il tuo account Hive e le app che hai autorizzato non cambiano. Vedi [Se dimentichi il codice di accesso](/docs/accounts#forgotten-passcode).

### Posso usare Hivesigner sul telefono? {#phone}

Sì. Apri https://hivesigner.com nel browser del telefono e aggiungi lì il tuo account. Le tue chiavi restano salvate solo in quel browser, quindi aggiungi l’account su ogni dispositivo che usi. Vedi [Aggiungere e gestire gli account](/docs/accounts).

### Quali app usano Hivesigner? {#which-apps}

https://hivesigner.com/apps elenca le app che trasmettono su Hive tramite Hivesigner, a partire dalle più usate. Ogni app pubblica da sé il proprio nome e la propria descrizione. Hivesigner non li verifica. Aprendo un’app lì compare una pagina che permette di darle l’accesso di pubblicazione. Vedi [Autorizzare un’app dalla directory](/docs/signing-in#directory).

### Che rapporto c’è tra Hivesigner e Hive Keychain? {#hive-keychain}

Sono strumenti distinti. Hive Keychain è un’estensione per browser e un’app per telefono. Hivesigner è un sito web, quindi non c’è nulla da installare. Quando un’app ti chiede di firmare un messaggio, la firma è dello stesso tipo prodotto da Hive Keychain, quindi l’app verifica l’una e l’altra con lo stesso codice. Il token di verifica della pagina **Firma messaggio** di Hivesigner si controlla nella pagina **Verifica messaggio** di Hivesigner. Vedi [Firma dei messaggi](/docs/message-signing).

## Sviluppare con Hivesigner {#building}

### Posso usare Hivesigner in un’app per telefono? {#mobile-app}

Sì. Manda la persona su Hivesigner in un browser e usa un indirizzo di ritorno che la tua app possa ricevere: un link https di tua proprietà (Android App Links o iOS Universal Links) oppure un indirizzo di loopback come `http://127.0.0.1/auth`. Gli schemi personalizzati come `myapp://` vengono rifiutati. Vedi [App per telefono e per computer](/docs/register-app#native-apps).

### Mi serve un account app? {#app-account}

Serve per far accedere le persone con l’accesso di pubblicazione e per trasmettere tramite l’API. Vedi [Registra la tua app](/docs/register-app). I [link di firma](/docs/sign-links) e la [firma dei messaggi](/docs/message-signing) funzionano anche senza. Lo stesso vale per l’[accesso senza permessi di pubblicazione](/docs/login-only).

### L’API può inviare trasferimenti? {#transfers}

No. L’API trasmette solo operazioni di livello pubblicazione, come voti, commenti e seguiti. Per i trasferimenti e le altre azioni che richiedono la chiave attiva, usa i [link di firma](/docs/sign-links): la persona approva ciascuno con la propria chiave.

### Quali linguaggi hanno un SDK? {#languages}

L’SDK ufficiale è per JavaScript. Per Python esistono librerie della community. Qualsiasi linguaggio può chiamare l’API REST. Vedi [SDK](/docs/sdk) e [API REST](/docs/api).

## Aiuto {#help}

### Dove posso trovare aiuto? {#get-help}

Chiedi nel server Discord di HiveDevs: https://discord.gg/pNJn7wh. Segnala un bug come issue nel repository GitHub che lo riguarda: https://github.com/ecency/hivesigner-ui per il sito web, https://github.com/ecency/hivesigner-api per l’API o https://github.com/ecency/hivesigner-sdk per l’SDK JavaScript. In una schermata che rifiuta una richiesta, **Segnala questo problema** invia il problema al team di Hivesigner.

### Come posso contribuire? {#contribute}

Hivesigner è open source su GitHub, nei tre repository qui sopra. Apri una issue con un bug o un’idea. Invia una pull request con una correzione.
