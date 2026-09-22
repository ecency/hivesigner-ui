Manche Apps müssen nur wissen, wer eine Person auf Hive ist. Sie posten, stimmen und übertragen nie etwas für sie. Hivesigner kann Menschen in einer solchen App ganz ohne Posting-Berechtigung anmelden. Die Person beweist, dass sie ein Hive-Konto kontrolliert. Ihre App erfährt dessen Namen. Diese Seite zeigt die zwei Wege und wie Sie das Ergebnis sicher prüfen.

## Zwei Wege {#two-ways}

- **Mit App-Konto:** Ihre App hat ein eigenes Hive-Konto und fragt `scope=login` an. Das Token nennt Ihre App.
- **Ohne App-Konto:** Eine Website ohne eigenes Hive-Konto sendet nur eine `redirect_uri`. Das Token nennt keine App. Ihre Website prüft es selbst.

Keiner der Wege braucht eine Erteilung der Person oder Ihres App-Kontos, am Konto der Person ändert sich also nichts. Hivesigner signiert die Anmeldung mit dem Posting-Schlüssel oder mit dem Active-Schlüssel, wenn das Gerät keinen Posting-Schlüssel für das Konto hat.

## Mit App-Konto {#app-account}

1. [Registrieren Sie Ihre App](/docs/register-app): Erstellen Sie ihr Hive-Konto und listen Sie Ihre Callbacks auf. Sie brauchen kein Client-Secret und keine Erteilung an @hivesigner.
2. Schicken Sie die Person zu:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. Die Person sieht "Anmelden bei APP" mit dem **Berechtigungsumfang** "Den Benutzernamen Ihres Kontos einsehen". Sie wählt **Anmelden**.
4. Hivesigner leitet zu Ihrem Callback weiter:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [Vergleichen Sie `state`](/docs/oauth2#state) und prüfen Sie dann das Token. Es ist ein `login`-Token, das Ihre App nennt, also funktioniert beides:
   - rufen Sie damit [`GET /api/me`](/docs/api#me) auf, was mit dem Konto in `user` und `scope` `["login"]` antwortet, dekodieren Sie dann das Token und prüfen Sie `type` und `app` ([Die API fragen](/docs/tokens#check-with-the-api));
   - oder [prüfen Sie es selbst](/docs/tokens#check-it-yourself) mit `type: 'login'` und dem Namen Ihrer App.

Ein `login`-Token kann nichts übertragen: `/api/broadcast` lehnt jede damit gesendete Operation ab.

## Ohne App-Konto {#no-app-account}

1. Schicken Sie die Person mit einer `redirect_uri` und ohne `client_id` zur Autorisierungs-URL:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   Der Callback muss `https://` sein oder `http://` auf Loopback (`localhost`, `127.0.0.1`, `[::1]`). Es gibt keine Liste, in der Sie ihn registrieren. Hivesigner ignoriert hier `scope` und `response_type`: Die Antwort ist immer ein Anmeldetoken.

2. Die Person sieht "HOST möchte Ihren Hive-Benutzernamen bestätigen.", wobei HOST der Host Ihres Callbacks ist. Sie wählt **Anmelden**.
3. Hivesigner leitet zu Ihrem Callback weiter:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [Vergleichen Sie `state`](/docs/oauth2#state) und prüfen Sie das Token dann selbst. Die API akzeptiert kein Token, das keine App nennt, also prüft Ihr Server die Signatur gegen die Schlüssel des Kontos. Siehe [Selbst prüfen](/docs/tokens#check-it-yourself), mit `type: 'login'` und ohne `app`.

Ist der Callback keine Web-Adresse oder einfaches `http://` außerhalb von Loopback, lehnt Hivesigner die Anfrage ab und sagt der Person, warum.

## Welchen Weg wählen {#which-one}

| | Mit App-Konto | Ohne App-Konto |
| --- | --- | --- |
| Was die Person sieht | Name, Bild und Hive-Konto Ihrer App | Nur den Host Ihrer Website |
| Einrichtung | Ein Hive-Konto mit aufgelisteten Callbacks | Keine |
| Das Token nennt | Ihre App | Keine App |
| Token prüfen mit | `/api/me` oder eigenem Code | Eigenem Code |
| Posting-Zugriff später | Mit demselben Konto: `posting` anfragen und [@hivesigner berechtigen](/docs/register-app#grant-hivesigner) | Braucht zuerst ein App-Konto |

Nutzen Sie ein App-Konto, wenn Sie können. Die Nutzer sehen Name und Bild Ihrer App. Ihr Server kann Tokens ablehnen, die für eine andere App erstellt wurden. Später können Sie mit demselben Konto auf Posting-Zugriff wechseln.

Nutzen Sie den zweiten Weg, wenn Ihre Website kein Hive-Konto hat und keines möchte.

## Die Anmeldung sicher prüfen {#check-safely}

- **Binden Sie die Anfrage mit `state`.** Erzeugen Sie je Anmeldung einen Zufallswert, speichern Sie ihn in der Sitzung der Person, vergleichen Sie ihn am Callback und verwenden Sie ihn einmal. Siehe [Die Anfrage mit state schützen](/docs/oauth2#state).
- **Prüfen Sie den Typ.** Akzeptieren Sie nur `signed_message.type` `login`. Ein Code oder ein Refresh-Token ist keine Anmeldung.
- **Prüfen Sie die App.** Mit App-Konto muss `signed_message.app` Ihre App sein. Ohne App-Konto darf kein `app` vorhanden sein.
- **Prüfen Sie das Alter.** Sie prüfen das Token direkt nach der Weiterleitung, akzeptieren Sie es also nur innerhalb weniger Minuten nach seinem `timestamp` (zum Beispiel 5 Minuten, mit einer Minute Uhrabweichung).
- **Verwenden Sie jedes Token einmal.** Starten Sie nach erfolgreicher Prüfung Ihre eigene Sitzung (zum Beispiel ein httpOnly-Cookie) und verwerfen Sie das Hivesigner-Token. Führen Sie Buch über die angenommenen Tokens, bis sie zu alt für die Altersprüfung sind. Lehnen Sie jedes ab, das Ihnen erneut begegnet.
- **Halten Sie das Token aus Protokollen heraus.** Es kommt im Query-String Ihres Callbacks an. Siehe [Tokens sicher aufbewahren](/docs/tokens#keep-tokens-safe).

## Beispiele {#examples}

Websites wie https://hivesearcher.com und https://openhive.chat lassen Menschen sich mit ihrem Hive-Konto anmelden, für Funktionen, die off-chain bleiben, etwa Suche und Chat. Sie müssen wissen, wer die Person ist, und sonst nichts.
