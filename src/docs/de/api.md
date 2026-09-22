Die Hivesigner-API liegt unter `https://hivesigner.com/api/`. Sie liefert das Konto der angemeldeten Person, überträgt Posting-Operationen für sie, tauscht Codes gegen Tokens und listet die Apps auf, die Hivesigner nutzen. Diese Seite beschreibt jeden Endpunkt mit seinen Anfragen, Antworten und Fehlern.

## Anfragen und Authentifizierung {#authentication}

- **Basis-URL:** `https://hivesigner.com/api/`. Jeder Endpunkt unten ist relativ zu `https://hivesigner.com`.
- **Das Token:** Senden Sie es unverändert als `Authorization`-Header: `Authorization: ACCESS_TOKEN`. Ein `Bearer `-Präfix wird ebenfalls akzeptiert. Sie können es auch als `access_token` im Query-String oder im Body senden, der Header hält es aber aus URLs und Protokollen heraus.
- **Bodys:** JSON mit `Content-Type: application/json` oder ein Formular (`application/x-www-form-urlencoded`).
- **Antworten:** JSON.
- **Browser:** Die API erlaubt Cross-Origin-Anfragen, eine Web-App kann sie also direkt aufrufen.

Ein Token bekommen Sie über [Anmelden mit OAuth2](/docs/oauth2). Was in einem Token steht, zeigt [Tokens](/docs/tokens).

## Fehler {#errors}

Eine Fehlerantwort hat einen HTTP-Fehlerstatus und diesen Body:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Status | `error` | Wann |
| --- | --- | --- |
| 401 | `invalid_grant` | Das Token fehlt oder ist ungültig, oder es ist die falsche Art für diesen Endpunkt ("The token has invalid role"). Bei `/api/oauth2/token` auch "The code or secret is not valid". |
| 401 | `invalid_scope` | `/api/broadcast`: eine Operation, die das Token nicht erlaubt. Die Beschreibung nennt die Operationen. |
| 401 | `unauthorized_client` | `/api/broadcast`: eine Operation, deren Autor nicht die Person des Tokens ist, ein `account_update2`, das Schlüssel berührt, eine fehlende Erteilung der Posting-Berechtigung oder ein Konto, das nicht geladen werden konnte. Die Beschreibung sagt, welcher Fall vorliegt. |
| 500 | `server_error` | `/api/broadcast`: Das Hive-Netzwerk hat die Transaktion abgelehnt. `error_description` trägt dessen Meldung. |
| 503 | `unavailable` | `/api/apps`: Das Verzeichnis wird noch aufgebaut. |

## GET /api/me {#me}

Liefert das Konto, zu dem das Token gehört. Damit erfahren Sie, wer sich angemeldet hat, oder [prüfen ein Token](/docs/tokens#check-with-the-api).

- **Methoden:** `GET` oder `POST`.
- **Token:** ein Zugriffstoken, auch ein `login`-Token, das eine App nennt.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Die Antwort, gekürzt:

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

| Feld | Bedeutung |
| --- | --- |
| `user` | Der Hive-Benutzername, zu dem das Token gehört. `_id` und `name` wiederholen ihn. |
| `account` | Das ganze Konto, so wie Hives `condenser_api.get_accounts` es liefert. |
| `scope` | Was das Token erlaubt: `["login"]` für ein Anmeldetoken, sonst die Operationen, die `/api/broadcast` annimmt. |
| `user_metadata` | Die Profil-Metadaten des Kontos, aus JSON gelesen. |

`/api/me` nennt nicht die App, für die das Token erstellt wurde. Um das zu prüfen, dekodieren Sie das Token: siehe [Die API fragen](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Signiert Posting-Operationen für die Person des Tokens mit dem Posting-Schlüssel von @hivesigner und überträgt sie an Hive.

- **Methode:** `POST`.
- **Token:** ein `posting`-Zugriffstoken, aus dem Token-Flow oder dem Code-Flow.
- **Damit es funktioniert:** Die Person hat Ihrem App-Konto die Posting-Berechtigung erteilt (das erledigt der Zustimmungsbildschirm) und Ihr App-Konto hat [@hivesigner die Posting-Berechtigung erteilt](/docs/register-app#grant-hivesigner).
- **Body:** `{ "operations": [...] }`, wobei jede Operation `[name, fields]` ist wie auf der Hive-Blockchain. Alle Operationen einer Anfrage landen in einer Transaktion.

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

Dieselbe Anfrage mit curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Ein Follow ist eine `custom_json`-Operation:

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

Die API antwortet, sobald ein Hive-Knoten die Transaktion angenommen hat. `result.id` ist die Transaktions-ID:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Lehnt das Netzwerk die Transaktion ab, lautet die Antwort `500` mit `server_error`. Deren `error_description` trägt die Meldung des Netzwerks und `response` den rohen Fehler.

### Was broadcast annimmt {#broadcast-rules}

Ein Posting-Token lässt die API diese Operationen übertragen und keine anderen. In jeder davon muss die Person des Tokens das Konto im gezeigten Feld sein:

| Operation | Die Person des Tokens muss sein |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | Das erste Konto in `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Jede andere Operation** wird mit `invalid_scope` abgelehnt. Ein `login`-Token erlaubt überhaupt keine Operation.
- **Eine Operation für ein anderes Konto** wird mit `unauthorized_client` abgelehnt. Ein Token überträgt immer nur für die eigene Person.
- **`account_update2`** darf nur die Metadaten des Kontos ändern. Eine Operation mit einem Feld `owner`, `active` oder `posting` wird mit `unauthorized_client` abgelehnt.
- **`custom_json`**: Lassen Sie `required_auths` leer. Die API signiert mit Posting-Berechtigung, eine Operation, die Active-Berechtigung braucht, scheitert also im Netzwerk.

Überweisungen und andere Wallet-Operationen brauchen den Active-Schlüssel der Person. Senden Sie sie stattdessen als [Signaturlinks](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

Tauscht einen Code gegen Tokens oder ein Refresh-Token gegen neue Tokens. Rufen Sie das nur von Ihrem Server aus auf. Siehe [Der Code-Flow](/docs/oauth2#code-flow).

- **Methode:** `POST`, mit den Werten im Body.
- **Body:** `code` und `client_secret` oder `refresh_token` und `client_secret`.
- **Header:** Senden Sie keinen `Authorization`-Header.

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

Jeder Aufruf liefert ein neues Zugriffstoken und ein neues Refresh-Token. Beide sind von @hivesigner signiert. `expires_in` ist die Lebensdauer des Zugriffstokens in Sekunden (7 Tage).

Fehler: `401 invalid_grant`. Die Beschreibung lautet "The token has invalid role", wenn der gesendete Wert kein gültiger Code und kein gültiges Refresh-Token ist. Sie lautet "The code or secret is not valid", wenn Code oder Secret nicht passen.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Teilt Hivesigner mit, dass die Person sich aus Ihrer App abgemeldet hat. Ihre App verwirft das Token selbst.

- **Methode:** `POST`.
- **Token:** das Zugriffstoken, im `Authorization`-Header.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

`revokeToken()` im JavaScript-SDK macht diesen Aufruf und vergisst danach das Token. Um den Zugriff Ihrer App dauerhaft zu entziehen, entfernt die Person ihn unter https://hivesigner.com/authorized-apps. Siehe [Abmelden und Zugriff entziehen](/docs/tokens#sign-out).

## GET /api/apps {#apps}

Das öffentliche App-Verzeichnis: Apps, die über Hivesigner übertragen, sortiert danach, wie viele Menschen sie nutzen. Es braucht kein Token. https://hivesigner.com/apps zeigt dieselbe Liste.

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

| Feld | Bedeutung |
| --- | --- |
| `updated_at` | Wann das Verzeichnis zuletzt aufgebaut wurde. |
| `building` | `true`, bis der erste Aufbau Daten hat. `apps` ist dann leer. |
| `window_days` | Die Zahl der Tage, die das Ranking abdeckt. |
| `featured` | Die zuerst gezeigten Benutzernamen, in dieser Reihenfolge. |
| `apps[].username` | Das App-Konto. |
| `apps[].name`, `about` | Aus dem Profil des App-Kontos oder `null`. |
| `apps[].website` | Die Website aus dem Profil, wenn sie auf ihrer eigenen Domain antwortet. Sonst `null`. |
| `apps[].site` | Das Ergebnis der Website-Prüfung: `ok`, `no_website`, `invalid`, `redirected`, `blocked` oder `unreachable`. Ein Eintrag `redirected` hat zusätzlich `redirects_to`. |
| `apps[].users` | Verschiedene Nutzer pro Tag, über den Zeitraum summiert. |
| `apps[].requests` | Erfolgreiche API-Anfragen, die im Zeitraum für die App gestellt wurden. |
| `apps[].first_seen`, `last_seen` | Der erste Tag, an dem Hivesigner die App erfasst hat, und der letzte Tag ihrer Nutzung, oder `null`. |
| `apps[].new` | `true`, wenn die App erstmals innerhalb des Zeitraums aufgetaucht ist. |

Die Antwort darf bis zu 5 Minuten zwischengespeichert werden. Bevor das Verzeichnis erstmals aufgebaut ist, antwortet die API mit `503` und `unavailable`. Versuchen Sie es später erneut.

Die Namen und Beschreibungen veröffentlicht jedes App-Konto selbst. Hivesigner prüft keine davon.
