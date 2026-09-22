Jouw app kan iemand vragen een tekstbericht met zijn posting- of active-sleutel te ondertekenen. De handtekening bewijst dat die persoon het account beheert. Er wordt niets uitgezonden: het bericht bereikt de blockchain nooit. Hivesigner ondertekent op dezelfde manier als `requestSignBuffer` van Hive Keychain, dus servercode die een handtekening van Keychain controleert controleert ook die van Hivesigner.

## Om een handtekening vragen {#request}

Stuur de persoon met deze queryparameters naar `https://hivesigner.com/sign-buffer`:

| Parameter | Verplicht | Betekenis |
| --- | --- | --- |
| `message` | Ja | De precieze tekst die wordt ondertekend. Er moet meer in staan dan spaties. |
| `redirect_uri` | Ja | Waar Hivesigner het resultaat naartoe stuurt. Zie [Regels voor de callback](#callback-rules). |
| `authority` | Nee | `posting` of `active`, in willekeurige hoofdletters of kleine letters (`Posting` kan ook). `posting` wanneer hij ontbreekt of leeg is. Elke andere waarde wordt geweigerd. |
| `client_id` | Nee | Het account van jouw app. `clientId` wordt ook gelezen. Daarmee moet `redirect_uri` een van de callbacks van jouw app zijn. |
| `state` | Nee | Elke waarde. Hivesigner geeft haar ongewijzigd terug. |
| `account` | Nee | Het account waarvan je de handtekening verwacht. Hivesigner kiest het wanneer het op het apparaat staat en negeert het anders. `select_account` wordt ook gelezen. |

Bouw de URL met `URLSearchParams`, zodat elke waarde wordt gecodeerd:

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### Regels voor de callback {#callback-rules}

- De callback moet `https://` zijn. Gewoon `http://` werkt alleen op loopback: `localhost`, `127.0.0.1` of `[::1]`.
- **Met `client_id`** moet de callback op dat app-account geregistreerd zijn, op dezelfde manier getoetst als bij inloggen. Zie [Callbacks](/docs/register-app#callback-rules). Hivesigner leest de callbacks van de app uit Hive wanneer het verzoek opengaat en ondertekent niets voordat het ze heeft gelezen. Is Hive niet bereikbaar, dan krijgt de persoon een knop **Opnieuw proberen**.
- **Zonder `client_id`** voldoet elke callback die de eerste regel volgt. Hivesigner noemt dan de host van de callback als de vrager, bijvoorbeeld «HOST vraagt je een bericht te ondertekenen.».

Stuur `client_id` mee wanneer je een app-account hebt. De persoon ziet dan de naam en het account van jouw app. Alleen jouw geregistreerde callbacks kunnen de handtekening ontvangen.

Hivesigner weigert een verzoek zonder bericht, met een onbekende `authority`, met een ontbrekende of onbruikbare callback, met een `client_id` die geen Hive-account is of met een callback die niet op die app is geregistreerd. De persoon ziet «Dit ondertekeningsverzoek is niet bruikbaar: het heeft een bericht, een posting- of active-sleutel en een veilige doorstuur-URL nodig die voor de app is geregistreerd. Ga terug naar de site en probeer het opnieuw.» en een knop **Dit probleem melden**.

### Wat de persoon ziet {#what-the-user-sees}

- Een kop die jouw app (of de host van de callback) noemt en «Stuurt je door naar HOST».
- Het hele bericht, precies zoals het wordt ondertekend. Tekens die tekst kunnen verbergen of de richting ervan kunnen wijzigen worden als codes getoond, zoals `\u{200B}`.
- «Wordt ondertekend met je posting-sleutel» of «Wordt ondertekend met je active-sleutel».
- Een waarschuwing: «Je handtekening bewijst aan iedereen die haar ziet dat @USERNAME precies deze tekst heeft ondertekend. Onderteken alleen een bericht dat je begrijpt.»
- **Ondertekenen** en **Annuleren**. Een vergrendeld account vraagt eerst zijn toegangscode.

[Verzoeken om een bericht te ondertekenen](/docs/signing#message-requests) beschrijft het scherm voor gebruikers.

## Wat jouw callback ontvangt {#callback}

Kiest de persoon **Ondertekenen**, dan stuurt Hivesigner hem met deze queryparameters naar jouw callback:

| Parameter | Waarde |
| --- | --- |
| `signature` | De handtekening, als hexadecimale tekenreeks van 130 tekens |
| `public_key` | De publieke sleutel van de sleutel die ondertekende, zoals `STM...` |
| `username` | Het account dat ondertekende |
| `authority` | `posting` of `active` |
| `state` | Jouw `state`, telkens als het verzoek er een had (ook een lege) |

Hivesigner voegt ze toe aan de query van jouw callback, na `?` of `&` en voor elk `#fragment`. Jouw eigen query blijft zoals hij is.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Kiest de persoon **Annuleren**, dan opent Hivesigner zijn accountlijst. Jouw callback krijgt niets.

> **Waarschuwing:** Iedereen kan jouw callback met verzonnen waarden openen. Behandel elke parameter als een bewering totdat jouw server de handtekening heeft gecontroleerd.

## De handtekening verifiëren {#verify}

Controleer de handtekening op jouw server:

1. Bewaar het bericht dat je vroeg met zijn `state` op jouw server. Vertrouw geen kopie die uit de browser terugkomt.
2. Bereken de hash van het bericht: sha256 over de UTF-8-bytes ervan.
3. Haal de publieke sleutel uit de handtekening en die hash.
4. Laad het account uit Hive. Controleer dat de teruggehaalde sleutel bij de bevoegdheid hoort die je vroeg, met genoeg gewicht om alleen te ondertekenen.
5. Controleer dat `state` de waarde is die je uitgaf. Neem elk bericht één keer aan.

Dit voorbeeld gebruikt dhive (https://www.npmjs.com/package/@hiveio/dhive):

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

Dezelfde controle werkt voor een handtekening van `requestSignBuffer` van Hive Keychain. Vergelijk met de sleutel die je hebt teruggehaald: `public_key` in de callback is slechts een aanwijzing.

## Berichten die Hivesigner niet ondertekent {#refused-messages}

Een bericht dat een JSON-object met een sleutel `signed_message` is, heeft de vorm van een Hivesigner-token. Het ondertekenen zou de vrager toegang tot het account van de persoon geven. Hivesigner ondertekent zo'n bericht nooit. Het zegt tegen de persoon «Dit bericht is een Hivesigner-token. Het ondertekenen zou de site toegang tot je account geven, daarom kan het niet worden ondertekend.»

Gebruik gewone tekst, of JSON zonder sleutel `signed_message`. Zeg waarvoor de handtekening dient en voeg een waarde toe die je één keer maakt, bijvoorbeeld:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## Het hulpmiddel Bericht ondertekenen {#sign-message-tool}

Mensen kunnen ook zelf een bericht ondertekenen op https://hivesigner.com/signmessage (**Bericht ondertekenen**) en er een controleren op https://hivesigner.com/verifymessage (**Bericht verifiëren**). Zie [Zelf een bericht ondertekenen](/docs/signing#sign-message).

Dat hulpmiddel ondertekent anders dan `/sign-buffer`. Het ondertekent de inhoud van een Hivesigner-token met daarin het bericht, het account en het tijdstip. Het deelt het resultaat als **Verificatietoken**. Controleer zo'n token op de pagina **Bericht verifiëren** of zoals beschreven in [Zelf controleren](/docs/tokens#check-it-yourself), niet met de code hierboven.
