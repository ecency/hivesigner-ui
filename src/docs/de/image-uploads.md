Hive-Beiträge verweisen per URL auf Bilder, also braucht eine App einen Ort, an den sie sie hochlädt. Ein imagehoster ist ein quelloffener Bild-Hoster für Hive. Er kann Uploads von Menschen annehmen, die sich mit Hivesigner in Ihrer App angemeldet haben: Ihr Zugriffstoken tritt an die Stelle einer Signatur mit ihrem Schlüssel.

## So funktioniert es {#how-it-works}

1. Die Person meldet sich mit Hivesigner und Posting-Zugriff in Ihrer App an. Ihre App erhält ein Zugriffstoken. Siehe [Anmelden mit OAuth2](/docs/oauth2).
2. Ihre App sendet das Bild mit diesem Token in der URL an Ihren imagehoster.
3. Der imagehoster prüft Token und Konto, speichert das Bild und antwortet mit dessen URL.
4. Ihre App setzt die URL in den Beitrag.

## Einen eigenen imagehoster betreiben {#run-your-own}

Ein imagehoster ist für genau ein App-Konto eingerichtet: `app_account` im Abschnitt `[upload_limits]` seiner Konfiguration. Senden Sie ihm Tokens, die für dieses App-Konto erstellt wurden. Die öffentlichen Instanzen gehören anderen Apps: images.ecency.com ist für das App-Konto von Ecency eingerichtet und images.hive.blog für das von Hive.blog. Um Uploads Ihrer Nutzer anzunehmen, betreiben Sie eine eigene Instanz mit Ihrem App-Konto.

Der Quellcode und die Einrichtungsanleitungen:

- Der imagehoster der Hive-Community: https://gitlab.syncad.com/hive/imagehoster
- Der imagehoster von Ecency: https://github.com/ecency/imagehoster

Tragen Sie in der Konfiguration Ihr App-Konto ein:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

Derselbe Abschnitt legt die Mindestreputation fest, die ein Konto zum Hochladen braucht (`reputation`), und das Upload-Kontingent je Konto (`max` Uploads pro `duration` Millisekunden). Konfigurieren Sie `redis_url`, damit das Kontingent wirklich greift. `max_image_size` legt die größte Datei fest, in Bytes.

## Ein Bild hochladen {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Das Token.** Setzen Sie das Zugriffstoken der Person in den Pfad, so wie Hivesigner es Ihrer App gegeben hat. Nutzen Sie ein Token aus einer Anmeldung mit Posting-Zugriff für Ihre App. Ein reines Anmeldetoken aus einer Anfrage ohne `client_id` nennt keine App und wird abgelehnt.
- **Der Body.** Senden Sie `multipart/form-data` mit einer Bilddatei. Der imagehoster nimmt die erste Datei, egal wie ihr Feld heißt.
- **Die Größe.** Senden Sie einen `Content-Length`-Header. Die Datei darf nicht größer sein als das `max_image_size` der Instanz.

Die Antwort ist JSON. Bei Erfolg enthält sie die URL des Bildes:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

Bei einem Fehler antwortet der imagehoster mit einem HTTP-Fehlerstatus. Die meisten Fehler tragen auch einen Fehlernamen:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Hinweis:** Das Token reist in der URL mit. Liefern Sie Ihren imagehoster nur über https aus und halten Sie seine Zugriffsprotokolle privat.

## Beispiel {#example}

Diese Browser-Funktion lädt eine Datei aus einem Dateifeld oder von einem Drop hoch. Der Browser setzt die Multipart-Header und die Länge für Sie: Setzen Sie `Content-Type` nicht selbst.

```js
// IMAGEHOSTER_URL is the address of your imagehoster, such as 'https://YOUR_IMAGEHOSTER'.
async function uploadImage(file, accessToken) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${IMAGEHOSTER_URL}/hs/${accessToken}`, {
    method: 'POST',
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.name ?? `Upload failed with status ${response.status}`);
  }
  return result.url;
}

const url = await uploadImage(input.files[0], ACCESS_TOKEN);
const markdown = `![](${url})`; // add this to the post body
```
