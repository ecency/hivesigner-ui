L’API di Hivesigner si trova su `https://hivesigner.com/api/`. Restituisce l’account della persona che ha effettuato l’accesso, trasmette per lei le operazioni di pubblicazione, scambia codici con token ed elenca le app che usano Hivesigner. Questa pagina descrive ogni endpoint con le sue richieste, risposte ed errori.

## Richieste e autenticazione {#authentication}

- **URL di base:** `https://hivesigner.com/api/`. Ogni endpoint qui sotto è relativo a `https://hivesigner.com`.
- **Il token:** mandalo così com’è nell’intestazione `Authorization`: `Authorization: ACCESS_TOKEN`. È accettato anche un prefisso `Bearer `. Puoi mandarlo anche come `access_token` nella stringa di query o nel corpo, ma l’intestazione lo tiene fuori dagli URL e dai registri.
- **Corpi:** JSON con `Content-Type: application/json`, o un modulo (`application/x-www-form-urlencoded`).
- **Risposte:** JSON.
- **Browser:** l’API permette le richieste cross-origin, quindi un’app web può chiamarla direttamente.

Per ottenere un token vedi [Accedere con OAuth2](/docs/oauth2). Per ciò che un token contiene vedi [Token](/docs/tokens).

## Errori {#errors}

Una risposta di errore ha uno stato HTTP di errore e questo corpo:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Stato | `error` | Quando |
| --- | --- | --- |
| 401 | `invalid_grant` | Il token manca o non è valido, oppure è del tipo sbagliato per questo endpoint («The token has invalid role»). Su `/api/oauth2/token`, anche «The code or secret is not valid». |
| 401 | `invalid_scope` | `/api/broadcast`: un’operazione che il token non permette. La descrizione nomina le operazioni. |
| 401 | `unauthorized_client` | `/api/broadcast`: un’operazione il cui autore non è la persona del token, un `account_update2` che tocca le chiavi, una concessione dell’autorità di pubblicazione mancante o un account che non si è potuto caricare. La descrizione dice quale. |
| 500 | `server_error` | `/api/broadcast`: la rete Hive ha rifiutato la transazione. `error_description` riporta il suo messaggio. |
| 503 | `unavailable` | `/api/apps`: la directory è ancora in costruzione. |

## GET /api/me {#me}

Restituisce l’account a cui il token si riferisce. Usalo per sapere chi ha effettuato l’accesso, o per [controllare un token](/docs/tokens#check-with-the-api).

- **Metodi:** `GET` o `POST`.
- **Token:** un token di accesso, compreso un token `login` che nomina un’app.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

La risposta, in breve:

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| Campo | Significato |
| --- | --- |
| `user` | Il nome utente Hive a cui il token si riferisce. `_id` e `name` lo ripetono. |
| `account` | L’account intero, così come lo restituisce `condenser_api.get_accounts` di Hive. |
| `scope` | Che cosa permette il token: `["login"]` per un token di solo accesso, altrimenti le operazioni che `/api/broadcast` accetta. |
| `user_metadata` | I metadati del profilo dell’account, letti dal JSON. |

`/api/me` non nomina l’app per cui il token è stato creato. Per controllarlo, decodifica il token: vedi [Chiedere all’API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Firma le operazioni di pubblicazione della persona del token con la chiave di pubblicazione di @hivesigner e le trasmette a Hive.

- **Metodo:** `POST`.
- **Token:** un token di accesso `posting`, dal flusso con token o dal flusso con codice.
- **Perché funzioni:** la persona ha concesso l’autorità di pubblicazione all’account della tua app (lo fa la schermata di consenso) e l’account della tua app ha [concesso l’autorità di pubblicazione a @hivesigner](/docs/register-app#grant-hivesigner).
- **Corpo:** `{ "operations": [...] }`, dove ogni operazione è `[name, fields]` come sulla blockchain Hive. Tutte le operazioni di una richiesta finiscono in una sola transazione.

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

La stessa richiesta con curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Un follow è un’operazione `custom_json`:

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

L’API risponde appena un nodo Hive ha accettato la transazione. `result.id` è l’identificativo della transazione:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Quando la rete rifiuta la transazione, la risposta è `500` con `server_error`. Il suo `error_description` riporta il messaggio della rete e `response` riporta l’errore grezzo.

### Che cosa accetta broadcast {#broadcast-rules}

Un token di pubblicazione permette all’API di trasmettere queste operazioni e nessun’altra. In ognuna la persona del token deve essere l’account indicato nel campo mostrato:

| Operazione | La persona del token deve essere |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | Il primo account in `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Qualunque altra operazione** viene rifiutata con `invalid_scope`. Un token `login` non permette nessuna operazione.
- **Un’operazione per un altro account** viene rifiutata con `unauthorized_client`. Un token trasmette sempre e solo per la propria persona.
- **`account_update2`** può cambiare solo i metadati dell’account. Un’operazione con un campo `owner`, `active` o `posting` viene rifiutata con `unauthorized_client`.
- **`custom_json`**: lascia `required_auths` vuoto. L’API firma con l’autorità di pubblicazione, quindi un’operazione che richiede l’autorità attiva fallisce sulla rete.

Le trasferte e le altre operazioni del portafoglio richiedono la chiave attiva della persona. Mandale invece come [link di firma](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

Scambia un codice con dei token, o un token di aggiornamento con token nuovi. Chiamalo solo dal tuo server. Vedi [Il flusso con codice](/docs/oauth2#code-flow).

- **Metodo:** `POST`, con i valori nel corpo.
- **Corpo:** `code` e `client_secret`, oppure `refresh_token` e `client_secret`.
- **Intestazioni:** non mandare nessuna intestazione `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Ogni chiamata restituisce un nuovo token di accesso e un nuovo token di aggiornamento. Entrambi sono firmati da @hivesigner. `expires_in` è la durata del token di accesso in secondi (7 giorni).

Errori: `401 invalid_grant`. La descrizione è «The token has invalid role» quando il valore inviato non è un codice o un token di aggiornamento valido. È «The code or secret is not valid» quando il codice o il segreto non corrispondono.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Dice a Hivesigner che la persona si è disconnessa dalla tua app. La tua app butta via il token da sé.

- **Metodo:** `POST`.
- **Token:** il token di accesso, nell’intestazione `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

Il `revokeToken()` dell’SDK JavaScript fa questa chiamata e poi dimentica il token. Per togliere per sempre l’accesso alla tua app, la persona lo toglie su https://hivesigner.com/authorized-apps. Vedi [Disconnettersi e togliere l’accesso](/docs/tokens#sign-out).

## GET /api/apps {#apps}

La directory pubblica delle app: le app che trasmettono tramite Hivesigner, ordinate per quante persone le usano. Non serve nessun token. https://hivesigner.com/apps mostra lo stesso elenco.

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| Campo | Significato |
| --- | --- |
| `updated_at` | Quando la directory è stata costruita l’ultima volta. |
| `building` | `true` finché la prima costruzione non ha dati. `apps` è allora vuoto. |
| `window_days` | Il numero di giorni coperti dalla classifica. |
| `featured` | I nomi utente mostrati per primi, in quest’ordine. |
| `apps[].username` | L’account dell’app. |
| `apps[].name`, `about` | Dal profilo dell’account dell’app, oppure `null`. |
| `apps[].website` | Il sito web dal profilo, quando risponde sul proprio dominio. Altrimenti `null`. |
| `apps[].site` | L’esito del controllo del sito web: `ok`, `no_website`, `invalid`, `redirected`, `blocked` o `unreachable`. Una voce `redirected` ha anche `redirects_to`. |
| `apps[].users` | Utenti distinti al giorno, sommati sul periodo. |
| `apps[].requests` | Richieste all’API riuscite fatte per l’app nel periodo. |
| `apps[].first_seen`, `last_seen` | Il primo giorno in cui Hivesigner ha registrato l’app e l’ultimo giorno in cui è stata usata, oppure `null`. |
| `apps[].new` | `true` quando l’app è comparsa per la prima volta dentro il periodo. |

La risposta può restare in cache fino a 5 minuti. Prima che la directory sia costruita la prima volta, l’API risponde `503` con `unavailable`. Riprova più tardi.

I nomi e le descrizioni li pubblica ogni account app per conto suo. Hivesigner non ne verifica nessuno.
