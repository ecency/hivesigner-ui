De officiële JavaScript-SDK bouwt inlog-URL's en ondertekeningslinks en roept de API van Hivesigner voor je aan. Voor Python bestaan bibliotheken uit de gemeenschap. Elke andere taal kan de [REST-API](/docs/api) rechtstreeks aanroepen.

## JavaScript-SDK {#javascript}

De SDK is het npm-pakket `hivesigner`. De broncode staat op https://github.com/ecency/hivesigner-sdk. Hij is in TypeScript geschreven en brengt zijn typen mee.

Versie 4 vraagt Node.js 18 of nieuwer, omdat hij de ingebouwde `fetch` gebruikt. In browsers vraagt hij ES2017 of nieuwer. Waar geen globale `fetch` is, voeg je een polyfill toe voordat je de SDK gebruikt. Op een oudere Node.js blijf je bij versie 3.

### Installeren {#install}

```bash
npm install hivesigner
```

Voor een pagina zonder bouwstap laad je de browserbundel. Die maakt een globale `hivesigner`:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Een client maken {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Optie | Betekenis |
| --- | --- |
| `app` | Het account van jouw app, verstuurd als `client_id`. |
| `callbackURL` | Waar Hivesigner de persoon naartoe terugstuurt. Moet een van de callbacks van jouw app zijn, teken voor teken (een loopback-callback met gewoon http mag in host en poort verschillen, zie [Callbacks](/docs/register-app#callback-rules)). |
| `scope` | Een lijst, met komma's samengevoegd tot de parameter `scope`. Zie [Reikwijdten](/docs/oauth2#scopes). |
| `responseType` | `'code'` voor de codestroom. Laat weg voor de tokenstroom. |
| `accessToken` | Het toegangstoken van de persoon, als je er al een hebt. |
| `apiURL` | De oorsprong van de API. De SDK voegt er `/api/` aan toe. Standaard is `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` en `setApiURL` wijzigen de client later. Elk daarvan geeft de client terug.

### De persoon laten inloggen {#sign-in}

`getLoginURL(state, account)` geeft de inlog-URL terug:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` komt ongewijzigd terug bij jouw callback. Gebruik het om het antwoord aan het verzoek te binden.
- `account` is optioneel: een gebruikersnaam. Hivesigner kiest dat account wanneer het op het apparaat staat en negeert het anders.

In een browser stuurt `client.login({ state: 'STATE' })` de persoon naar dezelfde URL, zonder account.

In de tokenstroom ontvangt jouw callback `access_token`, `expires_in` en `username`. Geef het token aan de client:

```js
client.setAccessToken('ACCESS_TOKEN');
```

De SDK heeft geen methode voor de uitwisseling in de codestroom. Jouw server stuurt de code en het clientgeheim zelf naar de API, zoals [De code inwisselen](/docs/oauth2#exchange-code) laat zien.

### De persoon ophalen {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` is het Hive-account van de persoon zoals de blockchain het teruggeeft. `scope` somt op wat het token toestaat.

### Uitzenden {#broadcast}

`broadcast(operations)` stuurt operaties naar de API, die ze voor de persoon uitzendt. De API neemt alleen posting-operaties aan waarvan de auteur de persoon van het token is: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` met posting-bevoegdheid, `claim_reward_balance` en `account_update2` voor profielmetadata. Zie [Wat broadcast aanneemt](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Noem de persoon in elke operatie. De API vervangt `__signer` niet.

Deze hulpmethoden bouwen elk één operatie en roepen `broadcast` aan:

| Methode | Zendt uit |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` loopt van `-10000` tot `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Voor een nieuw bericht is `parentAuthor` gelijk aan `''`. `jsonMetadata` mag een object zijn: de SDK maakt er een tekenreeks van. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Geef `[]` als `requiredAuths` en `['USERNAME']` als `requiredPostingAuths`. `json` is een tekenreeks. |
| `reblog(account, author, permlink)` | `custom_json` met id `follow`, dat het bericht opnieuw deelt |
| `follow(follower, following)` | `custom_json` met id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` met id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` met id `follow`, `what: ['ignore']` (dempen) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Bedragen zijn tekenreeksen als `'0.000 HIVE'`, `'0.000 HBD'` en `'1.000000 VESTS'`. |

`updateUserMetadata()` is verouderd. Om het profiel van iemand te wijzigen, zend je `account_update2` uit met nieuwe `posting_json_metadata`.

### Uitloggen {#log-out}

`revokeToken()` is de uitlogaanroep van de SDK. Hij stuurt het token naar het intrekkingseindpunt van de API en haalt het daarna uit de client. Mislukt de aanroep, roep dan zelf `removeAccessToken()` aan. Verwijder het token ook daar waar jouw app het heeft bewaard.

Om de toegang van jouw app voorgoed te beëindigen, haalt de persoon haar weg op https://hivesigner.com/authorized-apps. Zie [De toegang van een app bekijken en weghalen](/docs/signing-in#remove-access).

### Ondertekeningslinks {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` en `sendTransaction(tx, params)` geven een link `https://hivesigner.com/sign/...` terug. `params` neemt `callback`, `no_broadcast` en `signer`. Zie [Ondertekeningslinks](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

In TypeScript eisen de typen het derde argument: geef `undefined` door om de link terug te krijgen.

Geef in een browser een functie als derde argument door om de link in een nieuw tabblad te openen. De functie wordt niet aangeroepen en er wordt niets teruggegeven. Roep haar aan vanuit een klikafhandelaar, anders kan de browser het nieuwe tabblad blokkeren en werpt de aanroep een fout.

### Promises en callbacks {#promises-and-callbacks}

`me`, `broadcast`, de hulpmethoden en `revokeToken` geven een promise terug. Geef een functie als laatste argument door om in plaats daarvan een callback te gebruiken. Die krijgt `(error, result)`.

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

Antwoordt de API met een fout, dan wordt de promise afgewezen met de foutinhoud van de API, `{ error, error_description }`. Met een callback is die inhoud het argument `error`. Is het antwoord geen JSON, dan draagt de afwijzing de ontleedfout.

## Python {#python}

Deze bibliotheken komen uit de gemeenschap. Hun auteurs onderhouden ze, niet het team van Hivesigner. Toets ze aan de [REST-API](/docs/api) voordat je erop vertrouwt.

| Bibliotheek | Auteur |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, module `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
