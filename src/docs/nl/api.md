De API van Hivesigner staat op `https://hivesigner.com/api/`. Ze geeft het account van de ingelogde persoon terug, zendt posting-operaties voor hem uit, wisselt codes om voor tokens en somt de apps op die Hivesigner gebruiken. Deze pagina beschrijft elk eindpunt met zijn verzoeken, antwoorden en fouten.

## Verzoeken en authenticatie {#authentication}

- **Basis-URL:** `https://hivesigner.com/api/`. Elk eindpunt hieronder is relatief ten opzichte van `https://hivesigner.com`.
- **Het token:** stuur het onveranderd mee als `Authorization`-header: `Authorization: ACCESS_TOKEN`. Een voorvoegsel `Bearer ` wordt ook aangenomen. Je kunt het ook als `access_token` in de querystring of de inhoud sturen, maar de header houdt het uit URL's en logboeken.
- **Inhoud:** JSON met `Content-Type: application/json`, of een formulier (`application/x-www-form-urlencoded`).
- **Antwoorden:** JSON.
- **Browsers:** de API staat cross-origin-verzoeken toe, dus een webapp kan haar rechtstreeks aanroepen.

Voor een token, zie [Inloggen met OAuth2](/docs/oauth2). Voor wat er in een token staat, zie [Tokens](/docs/tokens).

## Fouten {#errors}

Een foutantwoord heeft een HTTP-foutstatus en deze inhoud:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Status | `error` | Wanneer |
| --- | --- | --- |
| 401 | `invalid_grant` | Het token ontbreekt of is ongeldig, of het is de verkeerde soort voor dit eindpunt («The token has invalid role»). Op `/api/oauth2/token` ook «The code or secret is not valid». |
| 401 | `invalid_scope` | `/api/broadcast`: een operatie die het token niet toestaat. De omschrijving noemt de operaties. |
| 401 | `unauthorized_client` | `/api/broadcast`: een operatie waarvan de auteur niet de persoon van het token is, een `account_update2` die sleutels raakt, een ontbrekende toestemming voor posting-bevoegdheid of een account dat niet kon worden geladen. De omschrijving zegt welke. |
| 500 | `server_error` | `/api/broadcast`: het Hive-netwerk heeft de transactie geweigerd. `error_description` draagt het bericht ervan. |
| 503 | `unavailable` | `/api/apps`: de gids wordt nog opgebouwd. |

## GET /api/me {#me}

Geeft het account terug waar het token bij hoort. Gebruik dit om te weten wie is ingelogd, of om [een token te controleren](/docs/tokens#check-with-the-api).

- **Methoden:** `GET` of `POST`.
- **Token:** een toegangstoken, ook een `login`-token dat een app noemt.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Het antwoord, ingekort:

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

| Veld | Betekenis |
| --- | --- |
| `user` | De Hive-gebruikersnaam waar het token bij hoort. `_id` en `name` herhalen die. |
| `account` | Het hele account, zoals `condenser_api.get_accounts` van Hive het teruggeeft. |
| `scope` | Wat het token toestaat: `["login"]` voor een inlogtoken, anders de operaties die `/api/broadcast` aanneemt. |
| `user_metadata` | De profielmetadata van het account, uit JSON gelezen. |

`/api/me` noemt niet de app waarvoor het token is gemaakt. Om dat te controleren decodeer je het token: zie [De API vragen](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Ondertekent posting-operaties voor de persoon van het token met de posting-sleutel van @hivesigner en zendt ze uit naar Hive.

- **Methode:** `POST`.
- **Token:** een `posting`-toegangstoken, uit de tokenstroom of de codestroom.
- **Voordat dit werkt:** de persoon heeft het account van jouw app posting-bevoegdheid gegeven (het toestemmingsscherm doet dat) en het account van jouw app heeft [@hivesigner posting-bevoegdheid gegeven](/docs/register-app#grant-hivesigner).
- **Inhoud:** `{ "operations": [...] }`, waarbij elke operatie `[name, fields]` is zoals op de Hive-blockchain. Alle operaties van één verzoek komen in één transactie.

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

Hetzelfde verzoek met curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Iemand volgen is een `custom_json`-operatie:

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

De API antwoordt zodra een Hive-knooppunt de transactie heeft aangenomen. `result.id` is het transactie-ID:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Weigert het netwerk de transactie, dan is het antwoord `500` met `server_error`. De `error_description` draagt het bericht van het netwerk en `response` de ruwe fout.

### Wat broadcast aanneemt {#broadcast-rules}

Met een posting-token mag de API deze operaties uitzenden en geen andere. In elke operatie moet de persoon van het token het account in het getoonde veld zijn:

| Operatie | De persoon van het token moet zijn |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | Het eerste account in `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Elke andere operatie** wordt geweigerd met `invalid_scope`. Een `login`-token staat helemaal geen operatie toe.
- **Een operatie voor een ander account** wordt geweigerd met `unauthorized_client`. Een token zendt alleen ooit uit voor de eigen persoon.
- **`account_update2`** mag alleen de metadata van het account wijzigen. Een operatie met een veld `owner`, `active` of `posting` wordt geweigerd met `unauthorized_client`.
- **`custom_json`**: laat `required_auths` leeg. De API ondertekent met posting-bevoegdheid, dus een operatie die active-bevoegdheid nodig heeft mislukt op het netwerk.

Overboekingen en andere portemonnee-operaties hebben de active-sleutel van de persoon nodig. Stuur die in plaats daarvan als [ondertekeningslinks](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

Wisselt een code om voor tokens, of een verversingstoken voor nieuwe tokens. Roep dit alleen vanaf jouw server aan. Zie [De codestroom](/docs/oauth2#code-flow).

- **Methode:** `POST`, met de waarden in de inhoud.
- **Inhoud:** `code` en `client_secret`, of `refresh_token` en `client_secret`.
- **Headers:** stuur geen `Authorization`-header mee.

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

Elke aanroep geeft een nieuw toegangstoken en een nieuw verversingstoken terug. Beide zijn door @hivesigner ondertekend. `expires_in` is de levensduur van het toegangstoken in seconden (7 dagen).

Fouten: `401 invalid_grant`. De omschrijving is «The token has invalid role» wanneer de verstuurde waarde geen geldige code of geldig verversingstoken is. Ze is «The code or secret is not valid» wanneer de code of het geheim niet klopt.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Vertelt Hivesigner dat de persoon bij jouw app is uitgelogd. Jouw app gooit het token zelf weg.

- **Methode:** `POST`.
- **Token:** het toegangstoken, in de `Authorization`-header.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

De `revokeToken()` van de JavaScript-SDK doet deze aanroep en vergeet daarna het token. Om de toegang van jouw app voorgoed weg te halen, haalt de persoon haar weg op https://hivesigner.com/authorized-apps. Zie [Uitloggen en toegang weghalen](/docs/tokens#sign-out).

## GET /api/apps {#apps}

De openbare appgids: apps die via Hivesigner uitzenden, gerangschikt naar hoeveel mensen ze gebruiken. Er is geen token voor nodig. https://hivesigner.com/apps toont dezelfde lijst.

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

| Veld | Betekenis |
| --- | --- |
| `updated_at` | Wanneer de gids voor het laatst is opgebouwd. |
| `building` | `true` totdat de eerste opbouw gegevens heeft. `apps` is dan leeg. |
| `window_days` | Het aantal dagen dat de rangschikking beslaat. |
| `featured` | De gebruikersnamen die eerst worden getoond, in die volgorde. |
| `apps[].username` | Het account van de app. |
| `apps[].name`, `about` | Uit het profiel van het app-account, of `null`. |
| `apps[].website` | De website uit het profiel, wanneer die op het eigen domein antwoordt. Anders `null`. |
| `apps[].site` | De uitkomst van de websitecontrole: `ok`, `no_website`, `invalid`, `redirected`, `blocked` of `unreachable`. Een vermelding `redirected` heeft ook `redirects_to`. |
| `apps[].users` | Verschillende gebruikers per dag, opgeteld over de periode. |
| `apps[].requests` | Geslaagde API-verzoeken die in die periode voor de app zijn gedaan. |
| `apps[].first_seen`, `last_seen` | De eerste dag dat Hivesigner de app noteerde en de laatste dag dat ze is gebruikt, of `null`. |
| `apps[].new` | `true` wanneer de app voor het eerst binnen de periode verscheen. |

Het antwoord mag tot 5 minuten in de cache staan. Voordat de gids voor het eerst is opgebouwd, antwoordt de API `503` met `unavailable`. Probeer het later opnieuw.

De namen en omschrijvingen publiceert elk app-account zelf. Hivesigner controleert er geen enkele.
