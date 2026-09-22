Ihre App kann eine Person bitten, eine Textnachricht mit ihrem Posting- oder Active-Schlüssel zu signieren. Die Signatur beweist, dass die Person das Konto kontrolliert. Es wird nichts übertragen: Die Nachricht erreicht die Blockchain nie. Hivesigner signiert genauso wie `requestSignBuffer` von Hive Keychain, der Servercode, der eine Keychain-Signatur prüft, prüft also auch eine von Hivesigner.

## Eine Signatur anfragen {#request}

Schicken Sie die Person mit diesen Query-Parametern zu `https://hivesigner.com/sign-buffer`:

| Parameter | Pflicht | Bedeutung |
| --- | --- | --- |
| `message` | Ja | Der genaue Text, der signiert wird. Er muss mehr als Leerzeichen enthalten. |
| `redirect_uri` | Ja | Wohin Hivesigner das Ergebnis sendet. Siehe [Regeln für den Callback](#callback-rules). |
| `authority` | Nein | `posting` oder `active`, in beliebiger Groß- und Kleinschreibung (`Posting` geht auch). `posting`, wenn er fehlt oder leer ist. Jeder andere Wert wird abgelehnt. |
| `client_id` | Nein | Ihr App-Konto. `clientId` wird auch gelesen. Damit muss `redirect_uri` einer der Callbacks Ihrer App sein. |
| `state` | Nein | Ein beliebiger Wert. Hivesigner gibt ihn unverändert zurück. |
| `account` | Nein | Das Konto, von dem Sie die Signatur erwarten. Hivesigner wählt es aus, wenn es auf dem Gerät ist, und ignoriert es sonst. `select_account` wird auch gelesen. |

Bauen Sie die URL mit `URLSearchParams`, damit jeder Wert kodiert wird:

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

### Regeln für den Callback {#callback-rules}

- Der Callback muss `https://` sein. Einfaches `http://` geht nur auf Loopback: `localhost`, `127.0.0.1` oder `[::1]`.
- **Mit `client_id`** muss der Callback auf diesem App-Konto registriert sein, geprüft wie bei der Anmeldung. Siehe [Callbacks](/docs/register-app#callback-rules). Hivesigner liest die Callbacks der App aus Hive, sobald die Anfrage geöffnet wird, und signiert nichts, bevor es sie gelesen hat. Ist Hive nicht erreichbar, erhält die Person eine Schaltfläche **Erneut versuchen**.
- **Ohne `client_id`** genügt jeder Callback, der die erste Regel erfüllt. Hivesigner nennt dann den Host des Callbacks als Anfragenden, zum Beispiel "HOST bittet Sie, eine Nachricht zu signieren.".

Senden Sie `client_id`, wenn Sie ein App-Konto haben. Die Person sieht dann Name und Konto Ihrer App. Nur Ihre registrierten Callbacks können die Signatur erhalten.

Hivesigner lehnt eine Anfrage ohne Nachricht ab, mit unbekanntem `authority`, mit fehlendem oder unbrauchbarem Callback, mit einer `client_id`, die kein Hive-Konto ist, oder mit einem Callback, der auf dieser App nicht registriert ist. Die Person sieht "Diese Signaturanfrage kann nicht verwendet werden: Sie braucht eine Nachricht, einen Posting- oder Active-Schlüssel und eine sichere, für die App registrierte Weiterleitungs-URL. Gehen Sie zurück zur Website und versuchen Sie es erneut." und eine Schaltfläche **Dieses Problem melden**.

### Was die Person sieht {#what-the-user-sees}

- Eine Überschrift, die Ihre App (oder den Host des Callbacks) nennt, und "Leitet Sie weiter zu HOST".
- Die ganze Nachricht, genau so, wie sie signiert wird. Zeichen, die Text verbergen oder seine Richtung ändern könnten, erscheinen als Codes wie `\u{200B}`.
- "Wird mit Ihrem Posting-Schlüssel signiert" oder "Wird mit Ihrem Active-Schlüssel signiert".
- Eine Warnung: "Ihre Signatur beweist jedem, der sie sieht, dass @USERNAME genau diesen Text signiert hat. Signieren Sie nur eine Nachricht, die Sie verstehen."
- **Signieren** und **Abbrechen**. Ein gesperrtes Konto fragt zuerst seinen Zugangscode ab.

[Anfragen zum Signieren von Nachrichten](/docs/signing#message-requests) beschreibt den Bildschirm für Nutzer.

## Was Ihr Callback erhält {#callback}

Wählt die Person **Signieren**, schickt Hivesigner sie mit diesen Query-Parametern zu Ihrem Callback:

| Parameter | Wert |
| --- | --- |
| `signature` | Die Signatur, als Hex-Zeichenkette aus 130 Zeichen |
| `public_key` | Der öffentliche Schlüssel des signierenden Schlüssels, etwa `STM...` |
| `username` | Das Konto, das signiert hat |
| `authority` | `posting` oder `active` |
| `state` | Ihr `state`, sobald die Anfrage einen hatte (auch einen leeren) |

Hivesigner hängt sie an die Query Ihres Callbacks an, nach `?` oder `&` und vor jedem `#fragment`. Ihre eigene Query bleibt, wie sie ist.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Wählt die Person **Abbrechen**, öffnet Hivesigner ihre Kontoliste. Ihr Callback erhält nichts.

> **Warnung:** Jeder kann Ihren Callback mit erfundenen Werten öffnen. Behandeln Sie jeden Parameter als Behauptung, bis Ihr Server die Signatur geprüft hat.

## Die Signatur prüfen {#verify}

Prüfen Sie die Signatur auf Ihrem Server:

1. Bewahren Sie die angefragte Nachricht mit ihrem `state` auf Ihrem Server auf. Vertrauen Sie keiner Kopie, die aus dem Browser zurückkommt.
2. Hashen Sie die Nachricht: sha256 über ihre UTF-8-Bytes.
3. Gewinnen Sie den öffentlichen Schlüssel aus der Signatur und diesem Hash zurück.
4. Laden Sie das Konto aus Hive. Prüfen Sie, dass der zurückgewonnene Schlüssel zu der angefragten Berechtigung gehört, mit genug Gewicht, um allein zu signieren.
5. Prüfen Sie, dass `state` der ist, den Sie ausgegeben haben. Akzeptieren Sie jede Nachricht einmal.

Dieses Beispiel nutzt dhive (https://www.npmjs.com/package/@hiveio/dhive):

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

Dieselbe Prüfung funktioniert für eine Signatur aus `requestSignBuffer` von Hive Keychain. Vergleichen Sie mit dem Schlüssel, den Sie zurückgewonnen haben: `public_key` im Callback ist nur ein Hinweis.

## Nachrichten, die Hivesigner nicht signiert {#refused-messages}

Eine Nachricht, die ein JSON-Objekt mit einem Schlüssel `signed_message` ist, hat die Form eines Hivesigner-Tokens. Sie zu signieren gäbe dem Anfragenden Zugriff auf das Konto der Person. Hivesigner signiert eine solche Nachricht nie. Es sagt der Person "Diese Nachricht ist ein Hivesigner-Token. Wer sie signiert, gibt der Website Zugriff auf sein Konto, deshalb kann sie nicht signiert werden."

Nutzen Sie einfachen Text oder JSON ohne den Schlüssel `signed_message`. Sagen Sie, wofür die Signatur dient, und fügen Sie einen Wert hinzu, den Sie einmalig erzeugen, zum Beispiel:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## Das Werkzeug Nachricht signieren {#sign-message-tool}

Menschen können eine Nachricht auch selbst unter https://hivesigner.com/signmessage (**Nachricht signieren**) signieren und eine unter https://hivesigner.com/verifymessage (**Nachricht verifizieren**) prüfen. Siehe [Eine Nachricht selbst signieren](/docs/signing#sign-message).

Dieses Werkzeug signiert anders als `/sign-buffer`. Es signiert einen Hivesigner-Token-Body, der die Nachricht, das Konto und die Zeit enthält. Das Ergebnis teilt es als **Verifizierungstoken**. Prüfen Sie ein solches Token auf der Seite **Nachricht verifizieren** oder so, wie es [Selbst prüfen](/docs/tokens#check-it-yourself) beschreibt, nicht mit dem Code oben.
