Das offizielle JavaScript-SDK baut Anmelde-URLs und Signaturlinks und ruft die Hivesigner-API für Sie auf. Für Python gibt es Bibliotheken aus der Community. Jede andere Sprache kann die [REST-API](/docs/api) direkt aufrufen.

## JavaScript-SDK {#javascript}

Das SDK ist das npm-Paket `hivesigner`. Sein Quellcode liegt unter https://github.com/ecency/hivesigner-sdk. Es ist in TypeScript geschrieben und bringt seine Typen mit.

Version 4 braucht Node.js 18 oder neuer, weil sie das eingebaute `fetch` nutzt. In Browsern braucht sie ES2017 oder neuer. Wo es kein globales `fetch` gibt, fügen Sie vor der Nutzung des SDK ein Polyfill hinzu. Auf einem älteren Node.js bleiben Sie bei Version 3.

### Installation {#install}

```bash
npm install hivesigner
```

Für eine Seite ohne Build-Schritt laden Sie das Browser-Bundle. Es definiert ein globales `hivesigner`:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Einen Client erstellen {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Option | Bedeutung |
| --- | --- |
| `app` | Ihr App-Konto, gesendet als `client_id`. |
| `callbackURL` | Wohin Hivesigner die Person zurückschickt. Muss einer der Callbacks Ihrer App sein, Zeichen für Zeichen (ein Loopback-Callback mit einfachem http darf sich in Host und Port unterscheiden, siehe [Callbacks](/docs/register-app#callback-rules)). |
| `scope` | Eine Liste, mit Kommas zum Parameter `scope` verbunden. Siehe [Berechtigungsumfänge](/docs/oauth2#scopes). |
| `responseType` | `'code'` für den Code-Flow. Für den Token-Flow weglassen. |
| `accessToken` | Das Zugriffstoken der Person, falls Sie schon eines haben. |
| `apiURL` | Der Origin der API. Das SDK hängt `/api/` daran an. Standard ist `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` und `setApiURL` ändern den Client später. Jede davon liefert den Client zurück.

### Die Person anmelden {#sign-in}

`getLoginURL(state, account)` liefert die Anmelde-URL:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` kommt unverändert zu Ihrem Callback zurück. Binden Sie damit die Antwort an die Anfrage.
- `account` ist optional: ein Benutzername. Hivesigner wählt dieses Konto aus, wenn es auf dem Gerät ist, und ignoriert es sonst.

Im Browser schickt `client.login({ state: 'STATE' })` die Person zur selben URL, ohne Konto.

Im Token-Flow erhält Ihr Callback `access_token`, `expires_in` und `username`. Geben Sie das Token an den Client:

```js
client.setAccessToken('ACCESS_TOKEN');
```

Für den Tausch im Code-Flow hat das SDK keine Methode. Ihr Server sendet Code und Client-Secret selbst an die API, wie [Den Code tauschen](/docs/oauth2#exchange-code) zeigt.

### Die Person abrufen {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` ist das Hive-Konto der Person, so wie die Blockchain es liefert. `scope` listet auf, was das Token erlaubt.

### Übertragen {#broadcast}

`broadcast(operations)` sendet Operationen an die API, die sie für die Person überträgt. Die API akzeptiert nur Posting-Operationen, deren Autor die Person des Tokens ist: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` mit Posting-Berechtigung, `claim_reward_balance` und `account_update2` für Profil-Metadaten. Siehe [Was broadcast annimmt](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Nennen Sie die Person in jeder Operation. Die API ersetzt `__signer` nicht.

Diese Hilfsmethoden bauen je eine Operation und rufen `broadcast` auf:

| Methode | Überträgt |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` reicht von `-10000` bis `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Für einen neuen Beitrag ist `parentAuthor` gleich `''`. `jsonMetadata` darf ein Objekt sein: Das SDK macht eine Zeichenkette daraus. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Übergeben Sie `[]` als `requiredAuths` und `['USERNAME']` als `requiredPostingAuths`. `json` ist eine Zeichenkette. |
| `reblog(account, author, permlink)` | `custom_json` mit der id `follow`, das den Beitrag teilt |
| `follow(follower, following)` | `custom_json` mit der id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` mit der id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` mit der id `follow`, `what: ['ignore']` (stummschalten) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Beträge sind Zeichenketten wie `'0.000 HIVE'`, `'0.000 HBD'` und `'1.000000 VESTS'`. |

`updateUserMetadata()` ist veraltet. Um das Profil einer Person zu ändern, übertragen Sie `account_update2` mit neuem `posting_json_metadata`.

### Abmelden {#log-out}

`revokeToken()` ist der Abmelde-Aufruf des SDK. Er sendet das Token an den Widerrufs-Endpunkt der API und entfernt es danach aus dem Client. Scheitert der Aufruf, rufen Sie `removeAccessToken()` selbst auf. Löschen Sie das Token auch dort, wo Ihre App es gespeichert hat.

Um den Zugriff Ihrer App dauerhaft zu beenden, entfernt die Person ihn unter https://hivesigner.com/authorized-apps. Siehe [Zugriff einer App sehen und entfernen](/docs/signing-in#remove-access).

### Signaturlinks {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` und `sendTransaction(tx, params)` liefern einen Link `https://hivesigner.com/sign/...`. `params` nimmt `callback`, `no_broadcast` und `signer`. Siehe [Signaturlinks](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

In TypeScript verlangen die Typen das dritte Argument: Übergeben Sie `undefined`, um den Link zu erhalten.

Übergeben Sie im Browser eine Funktion als drittes Argument, um den Link stattdessen in einem neuen Tab zu öffnen. Die Funktion wird nicht aufgerufen und es wird nichts zurückgegeben. Rufen Sie sie aus einem Klick-Handler auf, sonst blockiert der Browser womöglich den neuen Tab und der Aufruf wirft einen Fehler.

### Promises und Callbacks {#promises-and-callbacks}

`me`, `broadcast`, die Hilfsmethoden und `revokeToken` liefern ein Promise. Übergeben Sie eine Funktion als letztes Argument, um stattdessen einen Callback zu nutzen. Er erhält `(error, result)`.

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

Antwortet die API mit einem Fehler, wird das Promise mit dem Fehler-Body der API abgelehnt, `{ error, error_description }`. Mit einem Callback ist dieser Body das Argument `error`. Ist die Antwort kein JSON, wird mit dem Parse-Fehler abgelehnt.

## Python {#python}

Diese Bibliotheken kommen aus der Community. Sie werden von ihren Autoren betreut, nicht vom Hivesigner-Team. Prüfen Sie sie gegen die [REST-API](/docs/api), bevor Sie sich auf sie verlassen.

| Bibliothek | Autor |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, Modul `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
