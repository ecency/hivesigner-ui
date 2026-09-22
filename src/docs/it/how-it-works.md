Hivesigner permette alle persone di usare il loro account Hive nella tua app senza darle le proprie chiavi. Ha due parti: un firmatario nel browser su https://hivesigner.com e un’API su `https://hivesigner.com/api/`. Questa pagina spiega che cosa fa ogni parte e i due modi in cui un’app le usa.

## Il firmatario nel browser {#browser-signer}

Il firmatario nel browser è il sito di Hivesigner. Le persone vi aggiungono i loro account Hive. Le loro chiavi restano nel loro browser: Hivesigner non manda nessuna chiave a nessun server. La tua app non ne vede mai una.

Il firmatario firma tre tipi di cose, ogni volta dopo che la persona ha visto che cosa sta firmando:

- **Token di accesso.** La tua app manda qualcuno su Hivesigner per accedere. Hivesigner mostra il nome della tua app e ciò che chiede. Quando la persona approva, Hivesigner firma con la sua chiave una breve dichiarazione che nomina il suo account e la tua app. Quella dichiarazione firmata è il token che la tua app riceve. Vedi [Accedere con OAuth2](/docs/oauth2) e [Token](/docs/tokens).
- **Transazioni.** Un link di firma apre una transazione da esaminare. Quando la persona approva, Hivesigner la firma con la chiave che serve. Poi la manda alla rete Hive dal browser, a meno che il link chieda solo la firma. Vedi [Link di firma](/docs/sign-links).
- **Messaggi.** La tua app può chiedere a una persona di firmare un testo con la sua chiave, per dimostrare che controlla l’account. Vedi [Firma dei messaggi](/docs/message-signing).

## L’API {#api}

L’API trasmette le operazioni di pubblicazione per una persona che ha effettuato l’accesso alla tua app: post e commenti, voti, follow e altre operazioni `custom_json`, riscossione delle ricompense e aggiornamenti del profilo. La tua app manda le operazioni insieme al token della persona. L’API controlla il token, firma la transazione con la chiave di pubblicazione dell’account @hivesigner e la trasmette a Hive.

L’API restituisce anche l’account della persona che ha effettuato l’accesso, scambia codici con token ed elenca le app che usano Hivesigner. Vedi [API REST](/docs/api).

## La catena dell’autorità di pubblicazione {#authority-chain}

Su Hive un account può lasciare che un altro account agisca con la sua autorità di pubblicazione. L’API si appoggia su due di queste concessioni:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **La persona aggiunge l’account della tua app alla propria autorità di pubblicazione.** La schermata di consenso lo fa la prima volta che qualcuno approva l’accesso di pubblicazione per la tua app. Serve una volta sola la chiave attiva della persona.
2. **L’account della tua app aggiunge @hivesigner alla propria autorità di pubblicazione.** Lo fai una volta, quando [registri la tua app](/docs/register-app#grant-hivesigner).

Prima di trasmettere, l’API controlla che entrambe le concessioni ci siano. Trasmette solo operazioni il cui autore è la persona nominata dal token.

La persona può togliere l’accesso alla tua app quando vuole su https://hivesigner.com/authorized-apps. Dopo di che l’API non può più pubblicare per lei tramite la tua app.

## Due modi di integrare {#two-ways-to-integrate}

### Accedere, poi trasmettere tramite l’API {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

La persona approva una volta. Dopo di che la tua app può votare, commentare e pubblicare per lei senza chiedere di nuovo, finché il token non scade o finché la persona non toglie l’accesso alla tua app. Usa questa via per le azioni sociali di tutti i giorni.

Ti servono un account app con i callback registrati e la concessione a @hivesigner. Vedi [Registra la tua app](/docs/register-app). Se vuoi solo sapere chi è la persona, vedi [Accesso senza permessi di pubblicazione](/docs/login-only).

### Link di firma {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

La persona vede ogni transazione prima che venga firmata. I link di firma coprono 41 operazioni di Hive, comprese le trasferte e le altre azioni del portafoglio che richiedono la chiave attiva. L’API non le gestisce mai. Per i link di firma non ti serve un account app. Vedi [Link di firma](/docs/sign-links).

### Quale scegliere {#which-to-choose}

- **Azioni di pubblicazione frequenti** (voti, commenti, follow): fai accedere la persona con OAuth2 e poi usa l’API.
- **Azioni del portafoglio**, o qualunque cosa richieda la chiave attiva: usa i link di firma.
- **Entrambi**: molte app fanno accedere le persone con OAuth2 per le funzioni sociali e usano i link di firma per le trasferte.
- **Solo l’identità della persona**: vedi [Accesso senza permessi di pubblicazione](/docs/login-only).

## Codice sorgente {#source-code}

Hivesigner è open source:

- Il firmatario nel browser: https://github.com/ecency/hivesigner-ui
- L’API: https://github.com/ecency/hivesigner-api
- L’SDK JavaScript (pacchetto npm `hivesigner`): https://github.com/ecency/hivesigner-sdk. Vedi [SDK](/docs/sdk).
