I post di Hive puntano alle immagini tramite URL, quindi a un’app serve un posto dove caricarle. Un imagehoster è un servizio di hosting di immagini open source pensato per Hive. Può accettare caricamenti dalle persone che hanno effettuato l’accesso alla tua app con Hivesigner: il loro token di accesso prende il posto di una firma con la loro chiave.

## Come funziona {#how-it-works}

1. La persona accede alla tua app con Hivesigner, con i permessi di pubblicazione. La tua app riceve un token di accesso. Vedi [Accedere con OAuth2](/docs/oauth2).
2. La tua app manda l’immagine al tuo imagehoster, con quel token nell’URL.
3. L’imagehoster controlla il token e l’account, salva l’immagine e risponde con il suo URL.
4. La tua app mette quell’URL nel post.

## Gestire un imagehoster tuo {#run-your-own}

Un imagehoster è configurato per un solo account app: `app_account` nella sezione `[upload_limits]` della sua configurazione. Mandagli token creati per quell’account app. Le istanze pubbliche appartengono ad altre app: images.ecency.com è configurato per l’account app di Ecency e images.hive.blog per quello di Hive.blog. Per accettare i caricamenti dei tuoi utenti, gestisci una tua istanza con il tuo account app.

Il codice sorgente e le guide di installazione:

- L’imagehoster della comunità Hive: https://gitlab.syncad.com/hive/imagehoster
- L’imagehoster di Ecency: https://github.com/ecency/imagehoster

Nella configurazione imposta il tuo account app:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

La stessa sezione imposta la reputazione minima che serve a un account per caricare (`reputation`) e la quota di caricamento di ogni account (`max` caricamenti ogni `duration` millisecondi). Configura `redis_url` perché la quota venga davvero applicata. `max_image_size` fissa il file più grande, in byte.

## Caricare un’immagine {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Il token.** Metti il token di accesso della persona nel percorso, così come Hivesigner lo ha dato alla tua app. Usa un token da un accesso con permessi di pubblicazione per la tua app. Un token di solo accesso, da una richiesta senza `client_id`, non nomina nessuna app e viene rifiutato.
- **Il corpo.** Manda `multipart/form-data` con un file immagine. L’imagehoster prende il primo file, qualunque sia il nome del suo campo.
- **La dimensione.** Manda un’intestazione `Content-Length`. Il file non deve superare il `max_image_size` dell’istanza.

La risposta è JSON. In caso di successo contiene l’URL dell’immagine:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

In caso di errore l’imagehoster risponde con uno stato di errore HTTP. La maggior parte degli errori porta anche un nome:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Nota:** Il token viaggia nell’URL. Servi il tuo imagehoster solo via https e tieni privati i suoi registri di accesso.

## Esempio {#example}

Questa funzione per il browser carica un file da un campo file o da un trascinamento. Il browser imposta per te le intestazioni multipart e la lunghezza: non impostare `Content-Type` da solo.

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
