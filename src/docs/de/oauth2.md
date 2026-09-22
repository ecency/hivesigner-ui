Schicken Sie Menschen zu Hivesigner, um sich in Ihrer App anzumelden. Dort prüfen sie Ihre Anfrage und stimmen ihr zu. Hivesigner schickt sie dann mit einem Token (Token-Flow) oder mit einem Code, den Ihr Server gegen Tokens tauscht (Code-Flow), zurück zu Ihrem Callback. Diese Seite behandelt beide Flows, jeden Parameter und die Berechtigungsumfänge.

## Bevor Sie beginnen {#before-you-start}

- Registrieren Sie Ihre App: ein Hive-Konto dafür, mit Ihren aufgelisteten Callbacks. Siehe [Ihre App registrieren](/docs/register-app).
- Um über die API zu übertragen, muss Ihr App-Konto außerdem [@hivesigner die Posting-Berechtigung erteilen](/docs/register-app#grant-hivesigner).
- Für den Code-Flow setzen Sie ein [Client-Secret](/docs/register-app#client-secret).

## Die Autorisierungs-URL {#authorize-url}

Schicken Sie die Person zu dieser Adresse:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Kodieren Sie jeden Wert URL-gerecht. `URLSearchParams` erledigt das für Sie:

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

### Parameter {#parameters}

| Parameter | Pflicht | Was er bewirkt |
| --- | --- | --- |
| `client_id` | Ja, für eine App | Der Name Ihres App-Kontos. `clientId` wird auch gelesen. Ohne ihn ist die Anfrage eine reine Anmeldeanfrage von einer Website ohne App-Konto: siehe [Anmelden ohne Posting-Zugriff](/docs/login-only). |
| `redirect_uri` | Ja | Wohin Hivesigner die Person zurückschickt. Muss exakt eine der Weiterleitungs-URIs Ihrer App sein. Siehe [Callbacks](/docs/register-app#callbacks). |
| `scope` | Nein | `login`, `posting` oder `offline`. Siehe [Berechtigungsumfänge](#scopes). Ohne ihn fragt die Anfrage Posting-Zugriff an. |
| `response_type` | Nein | `code` startet den [Code-Flow](#code-flow). Jeder andere Wert oder gar keiner bedeutet [Token-Flow](#token-flow). |
| `state` | Empfohlen | Ein Zufallswert, den Hivesigner unverändert zurückgibt. Siehe [Die Anfrage mit state schützen](#state). |
| `account` | Nein | Ein Hive-Benutzername. Ist dieses Konto auf dem Gerät der Person, wählt Hivesigner es aus. Sonst wird es ignoriert. `select_account` wird auch gelesen. |

Die Person kann auf dem Zustimmungsbildschirm trotzdem zu einem anderen Konto wechseln. Nehmen Sie das Konto immer aus dem Token oder aus dem Code-Tausch, nie aus dem, was Sie angefragt haben.

## Berechtigungsumfänge {#scopes}

Hive hat eine einzige Posting-Berechtigung. Deshalb hat Hivesigner zwei Zugriffsstufen, nur Anmelden und Posting, und nichts Feineres dazwischen.

| `scope` | Wozu die Person zustimmt | Flow | `type` des Zugriffstokens |
| --- | --- | --- | --- |
| `login` | "Den Benutzernamen Ihres Kontos einsehen". Es wird nichts erteilt. | Token-Flow (fügen Sie kein `response_type=code` hinzu) | `login` |
| `posting` | Posting-Zugriff. Beim ersten Mal fügt das Ihr App-Konto zur Posting-Berechtigung der Person hinzu. | Token-Flow oder Code-Flow mit `response_type=code` | `posting` |
| `offline` | Posting-Zugriff, wie oben | Code-Flow | `posting`, mit einem `refresh`-Token |

Im Code-Flow erhält der Callback zuerst einen Code (ein Token vom `type` `code`), den Ihr Server gegen das Zugriffstoken tauscht.

- **Kein Berechtigungsumfang** bedeutet `posting`.
- **Ein Wert, der irgendwo `offline` enthält,** bedeutet `offline`, zum Beispiel das alte `offline,vote,comment`.
- **Jeder andere Wert** bedeutet `posting`. Dazu gehören die alten Operationsnamen wie `vote`, `comment`, `vote,comment`, `comment_options` oder `custom_json`. Sie begrenzen das Token nicht: Jedes Posting-Token erlaubt dieselben Operationen. Siehe [Was broadcast annimmt](/docs/api#broadcast-rules).

Fragen Sie `login` an, wenn Ihre App nur wissen muss, wer die Person ist. Siehe [Anmelden ohne Posting-Zugriff](/docs/login-only).

## Der Token-Flow {#token-flow}

Der Browser der Person erhält das Zugriffstoken direkt. Ihre App braucht kein Secret.

1. Schicken Sie die Person zur Autorisierungs-URL:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. Die Person stimmt zu. Hivesigner leitet zu Ihrem Callback weiter:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner hängt seine Parameter mit `?` an, wenn Ihr Callback keine Query hat, und mit `&`, wenn er eine hat. `state` ist nur dabei, wenn Sie einen nicht leeren Wert gesendet haben.

3. Vergleichen Sie an Ihrem Callback zuerst [`state`](#state). Prüfen Sie dann [das Token](/docs/tokens#check-a-token) auf Ihrem Server. Das zugehörige Konto steht im Token: Verlassen Sie sich nicht allein auf den Parameter `username`, denn eine URL kann jeder bearbeiten.
4. Bewahren Sie das Token auf Ihrem Server oder in einem httpOnly-Cookie auf. Leiten Sie auf eine saubere URL weiter, damit das Token die Adresszeile verlässt.
5. Nutzen Sie das Token mit der [API](/docs/api), bis es nach `expires_in` Sekunden abläuft (7 Tage). Schicken Sie die Person danach erneut zur Autorisierungs-URL. Wer bereits Posting-Zugriff erteilt hat, sieht "Anmelden bei APP" und "Sie haben @myapp bereits autorisiert. Es werden keine neuen Rechte erteilt.".

## Der Code-Flow {#code-flow}

Ihr Server erhält einen Code und tauscht ihn gegen ein Zugriffstoken und ein Refresh-Token. Er kann beide später ohne die Person erneuern. Nutzen Sie das, wenn Ihr Server über längere Zeit für Nutzer handelt.

1. Schicken Sie die Person mit `scope=offline` zur Autorisierungs-URL:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` bewirkt dasselbe.

2. Die Person stimmt dem Posting-Zugriff zu. Hivesigner leitet zu Ihrem Callback weiter:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [Vergleichen Sie `state`](#state). Tauschen Sie den Code dann sofort ein, von Ihrem Server aus.

### Den Code tauschen {#exchange-code}

Senden Sie den Code und Ihr Client-Secret im Body einer POST-Anfrage an `/api/oauth2/token`:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

Die Antwort:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Derselbe Aufruf in Node.js 18 oder neuer:

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

- Legen Sie Code und Secret in den Body der Anfrage, nie in die URL.
- Senden Sie zu dieser Anfrage keinen `Authorization`-Header.
- Nutzen Sie `username` aus dieser Antwort. Es stammt aus dem Code, den die Person signiert hat.
- Bewahren Sie Zugriffstoken und Refresh-Token auf Ihrem Server auf.

### Erneuern {#refresh}

Läuft das Zugriffstoken ab, senden Sie das Refresh-Token mit Ihrem Client-Secret an denselben Endpunkt:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

Die Antwort hat dieselbe Form, mit einem neuen Zugriffstoken und einem neuen Refresh-Token. Speichern Sie beide anstelle der alten.

## Die Anfrage mit state schützen {#state}

Ohne `state` könnte eine andere Website Ihren Nutzer mit einem selbst gewählten Token oder Code zu Ihrem Callback schicken. Ihre App würde die Person dann im Konto einer fremden Person anmelden. `state` bindet jeden Rücklauf an den Browser, der die Anmeldung begonnen hat.

1. Erzeugen Sie je Anmeldung einen Zufallswert, mindestens 16 zufällige Bytes. Hex hält ihn frei von Zeichen, die kodiert werden müssen.
2. Speichern Sie ihn dort, wo nur dieser Browser ihn wieder vorzeigen kann: in der Sitzung Ihres Servers oder in einem kurzlebigen httpOnly-, Secure-Cookie mit `SameSite=Lax`.
3. Senden Sie ihn als `state` in der Autorisierungs-URL.
4. Vergleichen Sie an Ihrem Callback den Parameter `state` mit dem gespeicherten Wert. Fehlt er oder weicht er ab, brechen Sie ab: Nutzen Sie weder Token noch Code.
5. Löschen Sie den gespeicherten Wert, damit jeder nur einmal funktioniert.

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

Hivesigner gibt denselben `state`-Wert zurück, den es erhalten hat. Einen leeren lässt es weg.

## Was die Person sieht {#what-the-user-sees}

Der Zustimmungsbildschirm zeigt Bild und Namen Ihrer App, "Hive-Konto @myapp" und "Leitet Sie weiter zu HOST", wobei HOST aus Ihrem Callback stammt. Dann:

- **Erste Posting-Anfrage.** Die Überschrift lautet "APP fordert Zugriff auf Ihr Konto an.". Die Karte **Berechtigungsumfang** listet auf, was Ihre App tun können wird. Ein Hinweis lautet "Erstmalige Autorisierung: Dadurch wird @myapp on-chain zu Ihrer Posting-Berechtigung hinzugefügt, wofür einmalig Ihr Active-Schlüssel nötig ist. Dieses Konto kann dann in Ihrem Namen posten, bis Sie die Berechtigung widerrufen.". Die Schaltfläche lautet **Autorisieren**. Hat das Gerät der Person keinen Active-Schlüssel für das Konto, fragt der Bildschirm ihn an Ort und Stelle ab.
- **Anmeldung.** Bei `scope=login` oder bei zuvor erteiltem Posting-Zugriff lautet die Überschrift "Anmelden bei APP" und die Schaltfläche **Anmelden**.
- **Das Konto.** "Autorisieren als" oder "Anmelden als", gefolgt vom ausgewählten Konto. Die Person kann hier das Konto wechseln.
- **Ein gesperrtes Konto.** Über der Schaltfläche steht ein Feld für den Zugangscode. Ein Klick entsperrt das Konto und macht weiter.
- **Kein Konto auf dem Gerät.** Die Schaltfläche lautet **Weiter**. Sie öffnet das Formular zum Hinzufügen eines Kontos und kehrt danach zur Anfrage zurück.

Nach einer ersten Posting-Anfrage wartet Hivesigner, bis die neue Erteilung on-chain sichtbar ist, und leitet erst dann weiter. Das kann einige Sekunden dauern. Den vollständigen Bildschirm aus Sicht der Person zeigt [Bei Apps anmelden](/docs/signing-in).

## Abbruch und abgelehnte Anfragen {#cancel}

- **Abbruch.** Die Person landet in ihrer Kontoliste in Hivesigner. An Ihren Callback geht nichts: Es gibt keinen Fehlerparameter. Halten Sie Ihre Anmeldeschaltfläche bereit, damit die Person neu beginnen kann. Warten Sie nicht auf einen Rücklauf.
- **Abgelehnte Anfragen.** Ein nicht registrierter Callback, eine unbekannte `client_id` oder eine fehlende `redirect_uri` zeigen in Hivesigner einen Fehler mit einer Schaltfläche **Dieses Problem melden**. An Ihren Callback geht nichts. Siehe [Was Nutzer sehen, wenn etwas nicht stimmt](/docs/register-app#refused-requests).

## Die alte Login-Request-URL {#legacy-login-request}

Hivesigner akzeptiert weiterhin die ältere Anmelde-URL, die für alte Integrationen erhalten bleibt. Nutzen Sie für neue `/oauth2/authorize`.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

Sie öffnet denselben Zustimmungsbildschirm, mit denselben Callback-Prüfungen und derselben Weiterleitung. Ihre Parameter liest sie anders:

- `scope` ist `login` oder `posting`. Jeder andere Wert oder gar keiner bedeutet `login`.
- `offline` wird nicht gelesen. Für den Code-Flow fügen Sie `response_type=code` hinzu.
- `account` wird nicht gelesen.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` folgt denselben Regeln.
