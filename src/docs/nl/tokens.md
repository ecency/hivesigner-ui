Een Hivesigner-token is een korte ondertekende verklaring. Het noemt een Hive-account, de app waarvoor het is gemaakt en het tijdstip van ondertekening. Jouw server kan een token met de API of zelf controleren. Deze pagina laat zien wat een token bevat, hoe lang het geldt en beide manieren om het te controleren.

## Hoe een token eruitziet {#format}

Een token is een JSON-object, gecodeerd in base64url, met één verschil met het gewone base64url: de opvulling gebruikt `.` in plaats van `=`. Vergeleken met gewoon base64 wordt `+` dus `-`, `/` wordt `_` en `=` wordt `.`. Elk token begint met `eyJzaWduZWRfbWVzc2FnZSI6`.

Gedecodeerd ziet een toegangstoken uit de tokenstroom er zo uit:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Veld | Betekenis |
| --- | --- |
| `signed_message.type` | Wat het token is: `login`, `posting`, `code` of `refresh`. Zie [Soorten tokens](#kinds). |
| `signed_message.app` | Het app-account waarvoor het token is gemaakt. Een inlogtoken voor een site zonder app-account heeft dit niet. |
| `authors[0]` | Het Hive-account waar het token bij hoort. |
| `timestamp` | Wanneer het is ondertekend, in seconden sinds 1970-01-01 UTC. |
| `signatures[0]` | De handtekening, als hexadecimale tekenreeks. |
| `authority` | Alleen in tokens die in de browser zijn ondertekend: welke sleutel van de persoon heeft ondertekend, `posting` of `active`. Dit veld staat buiten de ondertekende gegevens. Wil je weten welke sleutel heeft ondertekend, haal die dan uit de handtekening. |

De handtekening is een secp256k1-handtekening over de sha256-hash van `JSON.stringify({ signed_message, authors, timestamp })`, met de sleutels in die volgorde.

### Een token decoderen {#decode}

In Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

In een browser:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Decoderen is geen controleren. Iedereen kan een tekenreeks maken die naar deze vorm decodeert. [Controleer een token](#check-a-token) voordat je het vertrouwt.

## Soorten tokens {#kinds}

| Token | `type` | `app` | Ondertekend door | Waar je het krijgt |
| --- | --- | --- | --- | --- |
| Toegangstoken, tokenstroom | `posting` | Jouw app | De posting-sleutel van de persoon, of zijn active-sleutel als Hivesigner geen posting-sleutel voor dat account heeft | `access_token` op jouw callback |
| Inlogtoken, `scope=login` | `login` | Jouw app | De posting- of active-sleutel van de persoon | `access_token` op jouw callback |
| Inlogtoken, site zonder app-account | `login` | Geen | De posting- of active-sleutel van de persoon | `access_token` op jouw callback |
| Code | `code` | Jouw app | De posting- of active-sleutel van de persoon | `code` op jouw callback |
| Toegangstoken, codestroom | `posting` | Jouw app | De posting-sleutel van @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Verversingstoken | `refresh` | Jouw app | De posting-sleutel van @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Een code en een verversingstoken zijn geen toegangstokens. Neem geen van beide ooit als inlog aan.

## Hoe lang een token geldt {#lifetime}

Een toegangstoken geldt 7 dagen: `expires_in` is 604800 seconden, geteld vanaf zijn `timestamp`. Als het is verlopen:

- **Tokenstroom:** stuur de persoon opnieuw naar de inlog. Wie jouw app al heeft geautoriseerd ziet «Inloggen bij APP» en heeft één klik nodig.
- **Codestroom:** jouw server haalt met het verversingstoken en jouw clientgeheim een nieuw toegangstoken op. Zie [Verversen](/docs/oauth2#refresh).

Beschouw een token als verlopen zodra de `timestamp` ouder is dan 7 dagen. Neem een veel kortere leeftijd aan voor alles wat je meteen na de doorverwijzing controleert. Wissel een code meteen in. Neem een inlogtoken alleen aan binnen een paar minuten na zijn `timestamp`.

## Een token op jouw server controleren {#check-a-token}

Voordat jouw server een token vertrouwt dat een browser of app stuurt, controleer je dat:

- het account of @hivesigner het echt heeft ondertekend;
- het voor jouw app is gemaakt;
- het de soort token is die je verwacht;
- het vers genoeg is.

### De API vragen {#check-with-the-api}

Roep `/api/me` met het token aan. Een geldig token geeft het account terug in `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Een ongeldig token geeft `401` met `invalid_grant`. Zie [GET /api/me](/docs/api#me).

`/api/me` bevestigt de handtekening. Het antwoord noemt niet de app waarvoor het token is gemaakt. Decodeer het token dus ook en controleer `app`, `type` en leeftijd zelf. Een token dat voor een andere app is gemaakt mag niemand bij jouw app laten inloggen.

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

De API neemt alleen tokens aan die een app noemen. Controleer een inlogtoken van een site zonder app-account [zelf](#check-it-yourself).

### Zelf controleren {#check-it-yourself}

1. Decodeer het token.
2. Controleer dat `signed_message.type` de verwachte soort is: `posting` voor een toegangstoken, `login` voor een inlogtoken.
3. Controleer dat `signed_message.app` het account van jouw app is. Voor een site zonder app-account controleer je dat er geen is.
4. Controleer de leeftijd aan de hand van `timestamp`.
5. Bereken de sha256-hash van `JSON.stringify({ signed_message, authors, timestamp })`.
6. Haal de publieke sleutel uit `signatures[0]` en die hash.
7. Lees het account `authors[0]` nu van de Hive-blockchain, want mensen kunnen hun sleutels wijzigen. De teruggehaalde sleutel moet een van zijn huidige posting- of active-sleutels zijn. Een token van `/api/oauth2/token` is door @hivesigner ondertekend: neem daarvoor een huidige posting-sleutel van het account @hivesigner aan.

In Node.js met [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), dat `PrivateKey`, `PublicKey`, `Signature` en `callRPC` onder `@ecency/sdk/hive` aanbiedt:

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

Zo gebruik je het:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

De bibliotheek dhive (`@hiveio/dhive`) kan ook: bereken de hash met `cryptoUtils.sha256(message)` en haal de sleutel op met `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Tokens veilig bewaren {#keep-tokens-safe}

Wie een posting-token heeft kan tot het verloopt via jouw app als die persoon uitzenden. Behandel het als een wachtwoord.

- **Bewaar tokens op jouw server,** of in een httpOnly- en Secure-cookie. Houd verversingstokens en jouw clientgeheim alleen op de server.
- **Zet een token nooit in een URL die je logt.** De tokenstroom levert het token in de querystring van jouw callback. Lees het op jouw server en stuur daarna door naar een URL zonder token. Houd de querystring van de callback uit je logboeken.
- **Laad niets van andere sites op jouw callbackpagina,** zodat het adres met het token niet naar hen gaat. Een header `Referrer-Policy: no-referrer` op die pagina helpt.
- **Stuur een token alleen naar jouw eigen server en naar `https://hivesigner.com/api/`.**

## Uitloggen en toegang weghalen {#sign-out}

- **Iemand uitloggen** betekent het token weggooien: verwijder het uit je sessie of cookie. Je kunt ook [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) aanroepen om Hivesigner te vertellen dat de persoon is uitgelogd. Jouw app gooit het token sowieso zelf weg.
- **De toegang van jouw app voorgoed afsluiten** is de keuze van de persoon. Op https://hivesigner.com/authorized-apps, of op `https://hivesigner.com/revoke/APP`, haalt hij het account van jouw app op de blockchain uit zijn posting-bevoegdheid. Daarna zendt de API niet meer via jouw app voor hem uit.
