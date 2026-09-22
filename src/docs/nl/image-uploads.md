Berichten op Hive verwijzen met een URL naar afbeeldingen, dus een app heeft een plek nodig om ze te uploaden. Een imagehoster is opensource afbeeldingshosting die voor Hive is gemaakt. Hij kan uploads aannemen van mensen die met Hivesigner bij jouw app zijn ingelogd: hun toegangstoken komt in de plaats van een handtekening met hun sleutel.

## Hoe het werkt {#how-it-works}

1. De persoon logt met Hivesigner bij jouw app in, met posting-toegang. Jouw app ontvangt een toegangstoken. Zie [Inloggen met OAuth2](/docs/oauth2).
2. Jouw app stuurt de afbeelding naar jouw imagehoster, met dat token in de URL.
3. De imagehoster controleert het token en het account, slaat de afbeelding op en antwoordt met de URL ervan.
4. Jouw app zet die URL in het bericht.

## Een eigen imagehoster draaien {#run-your-own}

Een imagehoster is ingesteld voor één app-account: `app_account` in het onderdeel `[upload_limits]` van zijn configuratie. Stuur hem tokens die voor dat app-account zijn gemaakt. De openbare instanties horen bij andere apps: images.ecency.com is ingesteld voor het app-account van Ecency en images.hive.blog voor dat van Hive.blog. Om uploads van jouw gebruikers aan te nemen, draai je een eigen instantie met jouw app-account.

De broncode en de installatiehandleidingen:

- De imagehoster van de Hive-gemeenschap: https://gitlab.syncad.com/hive/imagehoster
- De imagehoster van Ecency: https://github.com/ecency/imagehoster

Zet in de configuratie jouw app-account:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

Hetzelfde onderdeel bepaalt de minimale reputatie die een account nodig heeft om te uploaden (`reputation`) en het uploadquotum per account (`max` uploads per `duration` milliseconden). Stel `redis_url` in zodat het quotum echt geldt. `max_image_size` bepaalt het grootste bestand, in bytes.

## Een afbeelding uploaden {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Het token.** Zet het toegangstoken van de persoon in het pad, precies zoals Hivesigner het aan jouw app gaf. Gebruik een token uit een inlog met posting-toegang voor jouw app. Een token voor alleen inloggen, uit een verzoek zonder `client_id`, noemt geen app en wordt geweigerd.
- **De inhoud.** Stuur `multipart/form-data` met één afbeeldingsbestand. De imagehoster neemt het eerste bestand, wat de veldnaam ook is.
- **De grootte.** Stuur een `Content-Length`-header. Het bestand mag niet groter zijn dan de `max_image_size` van de instantie.

Het antwoord is JSON. Bij succes staat de URL van de afbeelding erin:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

Bij een fout antwoordt de imagehoster met een HTTP-foutstatus. De meeste fouten dragen ook een foutnaam:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Let op:** Het token reist mee in de URL. Bied jouw imagehoster alleen via https aan en houd de toegangslogboeken privé.

## Voorbeeld {#example}

Deze browserfunctie uploadt een bestand uit een bestandsveld of uit een sleepactie. De browser zet de multipart-headers en de lengte voor je: stel `Content-Type` niet zelf in.

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
