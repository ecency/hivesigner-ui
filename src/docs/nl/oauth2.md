Stuur mensen naar Hivesigner om bij jouw app in te loggen. Daar bekijken ze jouw verzoek en keuren het goed. Hivesigner stuurt ze daarna terug naar jouw callback met een token (de tokenstroom) of met een code die jouw server voor tokens inwisselt (de codestroom). Deze pagina behandelt beide stromen, elke parameter en de reikwijdten.

## Voordat je begint {#before-you-start}

- Registreer jouw app: een Hive-account ervoor, met jouw callbacks erin. Zie [Je app registreren](/docs/register-app).
- Om via de API uit te zenden moet het account van jouw app ook [@hivesigner posting-bevoegdheid geven](/docs/register-app#grant-hivesigner).
- Voor de codestroom stel je een [clientgeheim](/docs/register-app#client-secret) in.

## De autorisatie-URL {#authorize-url}

Stuur de persoon naar dit adres:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Codeer elke waarde voor de URL. `URLSearchParams` doet dat voor je:

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### Parameters {#parameters}

| Parameter | Verplicht | Wat het doet |
| --- | --- | --- |
| `client_id` | Ja, voor een app | De naam van het account van jouw app. `clientId` wordt ook gelezen. Zonder deze is het verzoek een verzoek om alleen in te loggen vanaf een site zonder app-account: zie [Inloggen zonder posting-toegang](/docs/login-only). |
| `redirect_uri` | Ja | Waar Hivesigner de persoon naartoe terugstuurt. Moet precies een van de doorstuur-URI's van jouw app zijn. Zie [Callbacks](/docs/register-app#callbacks). |
| `scope` | Nee | `login`, `posting` of `offline`. Zie [Reikwijdten](#scopes). Zonder deze vraagt het verzoek posting-toegang. |
| `response_type` | Nee | `code` start de [codestroom](#code-flow). Elke andere waarde, of geen, betekent de [tokenstroom](#token-flow). |
| `state` | Aanbevolen | Een willekeurige waarde die Hivesigner ongewijzigd teruggeeft. Zie [Het verzoek beschermen met state](#state). |
| `account` | Nee | Een Hive-gebruikersnaam. Staat dat account op het apparaat van de persoon, dan kiest Hivesigner het. Anders wordt het genegeerd. `select_account` wordt ook gelezen. |

De persoon kan op het toestemmingsscherm nog steeds naar een ander account wisselen. Haal het account altijd uit het token of uit de code-uitwisseling, nooit uit wat je hebt gevraagd.

## Reikwijdten {#scopes}

Hive heeft één posting-bevoegdheid. Daarom heeft Hivesigner twee niveaus van toegang, alleen inloggen en posting, en niets fijners daartussen.

| `scope` | Wat de persoon goedkeurt | Stroom | `type` van het toegangstoken |
| --- | --- | --- | --- |
| `login` | «De gebruikersnaam van je account bekijken». Er wordt niets verleend. | Tokenstroom (voeg geen `response_type=code` toe) | `login` |
| `posting` | Posting-toegang. De eerste keer wordt hiermee het account van jouw app aan de posting-bevoegdheid van de persoon toegevoegd. | Tokenstroom, of codestroom met `response_type=code` | `posting` |
| `offline` | Posting-toegang, zoals hierboven | Codestroom | `posting`, met een `refresh`-token |

In de codestroom krijgt de callback eerst een code (een token met `type` `code`) die jouw server voor het toegangstoken inwisselt.

- **Geen reikwijdte** betekent `posting`.
- **Een waarde die ergens `offline` bevat** betekent `offline`, bijvoorbeeld het oude `offline,vote,comment`.
- **Elke andere waarde** betekent `posting`. Daaronder vallen ook de oude operatienamen als `vote`, `comment`, `vote,comment`, `comment_options` of `custom_json`. Ze beperken het token niet: elk posting-token staat dezelfde operaties toe. Zie [Wat broadcast aanneemt](/docs/api#broadcast-rules).

Vraag `login` wanneer jouw app alleen hoeft te weten wie de persoon is. Zie [Inloggen zonder posting-toegang](/docs/login-only).

## De tokenstroom {#token-flow}

De browser van de persoon krijgt het toegangstoken rechtstreeks. Jouw app heeft geen geheim nodig.

1. Stuur de persoon naar de autorisatie-URL:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. De persoon keurt goed. Hivesigner stuurt door naar jouw callback:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner voegt zijn parameters toe met `?` wanneer jouw callback geen query heeft en met `&` wanneer die er wel een heeft. `state` staat er alleen als je een niet-lege waarde hebt gestuurd.

3. Vergelijk op jouw callback eerst [`state`](#state). Controleer daarna [het token](/docs/tokens#check-a-token) op jouw server. Het bijbehorende account staat in het token: vertrouw niet alleen op de parameter `username`, want iedereen kan een URL aanpassen.
4. Bewaar het token op jouw server of in een httpOnly-cookie. Stuur door naar een schone URL zodat het token uit de adresbalk verdwijnt.
5. Gebruik het token met de [API](/docs/api) tot het na `expires_in` seconden verloopt (7 dagen). Stuur de persoon daarna opnieuw naar de autorisatie-URL. Wie al posting-toegang heeft gegeven ziet «Inloggen bij APP» en «Je hebt @myapp al eerder geautoriseerd. Er worden geen nieuwe rechten verleend.».

## De codestroom {#code-flow}

Jouw server krijgt een code en wisselt die in voor een toegangstoken en een verversingstoken. Later kan hij ze zonder de persoon vernieuwen. Gebruik dit wanneer jouw server langere tijd voor gebruikers handelt.

1. Stuur de persoon naar de autorisatie-URL met `scope=offline`:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` doet hetzelfde.

2. De persoon keurt posting-toegang goed. Hivesigner stuurt door naar jouw callback:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [Vergelijk `state`](#state). Wissel de code daarna meteen in, vanaf jouw server.

### De code inwisselen {#exchange-code}

Stuur de code en jouw clientgeheim naar `/api/oauth2/token` in de inhoud van een POST-verzoek:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

Het antwoord:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Dezelfde aanroep in Node.js 18 of nieuwer:

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- Zet de code en het geheim in de inhoud van het verzoek, nooit in de URL.
- Stuur geen `Authorization`-header met dit verzoek mee.
- Gebruik de `username` uit dit antwoord. Die komt uit de code, die de persoon heeft ondertekend.
- Bewaar het toegangstoken en het verversingstoken op jouw server.

### Verversen {#refresh}

Verloopt het toegangstoken, stuur dan het verversingstoken met jouw clientgeheim naar hetzelfde eindpunt:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

Het antwoord heeft dezelfde vorm, met een nieuw toegangstoken en een nieuw verversingstoken. Bewaar ze allebei in plaats van de oude.

## Het verzoek beschermen met state {#state}

Zonder `state` zou een andere site jouw gebruiker met een zelfgekozen token of code naar jouw callback kunnen sturen. Jouw app zou de persoon dan bij andermans account inloggen. `state` bindt elke terugkomst aan de browser die de inlog begon.

1. Maak per inlog een willekeurige waarde, minstens 16 willekeurige bytes. Hexadecimaal houdt haar vrij van tekens die codering nodig hebben.
2. Bewaar haar op een plek waar alleen deze browser haar opnieuw kan tonen: de sessie van jouw server, of een kortlevende httpOnly- en Secure-cookie met `SameSite=Lax`.
3. Stuur haar als `state` in de autorisatie-URL.
4. Vergelijk op jouw callback de parameter `state` met de bewaarde waarde. Ontbreekt die of verschilt hij, stop dan: gebruik het token noch de code.
5. Verwijder de bewaarde waarde, zodat elke waarde één keer werkt.

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner geeft dezelfde `state`-waarde terug die het ontving. Een lege laat het weg.

## Wat de persoon ziet {#what-the-user-sees}

Het toestemmingsscherm toont de afbeelding en naam van jouw app, «Hive-account @myapp» en «Stuurt je door naar HOST», waarbij HOST uit jouw callback komt. Daarna:

- **Eerste posting-verzoek.** De kop luidt «APP vraagt toegang tot je account.». De kaart **Reikwijdte** somt op wat jouw app zal kunnen doen. Een melding luidt «Eerste autorisatie: hiermee wordt @myapp op de blockchain toegevoegd aan je posting-bevoegdheid, waarvoor eenmalig je active-sleutel nodig is. Dat account kan dan namens jou posten totdat je de toegang intrekt.». De knop luidt **Autoriseren**. Heeft het apparaat van de persoon geen active-sleutel voor dat account, dan vraagt het scherm die ter plekke.
- **Inloggen.** Bij `scope=login`, of bij posting-toegang die de persoon eerder gaf, luidt de kop «Inloggen bij APP» en de knop **Inloggen**.
- **Het account.** «Autoriseren als» of «Inloggen als», gevolgd door het gekozen account. De persoon kan hier van account wisselen.
- **Een vergrendeld account.** Boven de knop staat een veld voor de toegangscode. Eén klik ontgrendelt het account en gaat door.
- **Geen account op het apparaat.** De knop luidt **Doorgaan**. Die opent het formulier om een account toe te voegen en komt daarna terug bij het verzoek.

Na een eerste posting-verzoek wacht Hivesigner tot de nieuwe toestemming op de blockchain zichtbaar is voordat het doorstuurt. Dat kan een paar seconden duren. Voor het hele scherm vanuit de persoon gezien, zie [Inloggen bij apps](/docs/signing-in).

## Annuleren en geweigerde verzoeken {#cancel}

- **Annuleren.** De persoon gaat naar zijn accountlijst in Hivesigner. Er gaat niets naar jouw callback: er is geen foutparameter. Houd jouw inlogknop beschikbaar zodat de persoon opnieuw kan beginnen. Wacht niet op een terugkomst.
- **Geweigerde verzoeken.** Een niet-geregistreerde callback, een onbekende `client_id` of een ontbrekende `redirect_uri` tonen een fout in Hivesigner met een knop **Dit probleem melden**. Er gaat niets naar jouw callback. Zie [Wat gebruikers zien als er iets niet klopt](/docs/register-app#refused-requests).

## De oude inlogverzoek-URL {#legacy-login-request}

Hivesigner neemt de oudere inlog-URL nog steeds aan, bewaard voor integraties van vroeger. Gebruik `/oauth2/authorize` voor nieuwe.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

Die opent hetzelfde toestemmingsscherm, met dezelfde callbackcontroles en dezelfde doorverwijzing. De parameters leest hij anders:

- `scope` is `login` of `posting`. Elke andere waarde, of geen, betekent `login`.
- `offline` wordt niet gelezen. Voeg voor de codestroom `response_type=code` toe.
- `account` wordt niet gelezen.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` volgt dezelfde regels.
