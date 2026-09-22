Wpisy w Hive wskazują obrazy adresem URL, więc aplikacja potrzebuje miejsca, do którego je wyśle. imagehoster to otwarty hosting obrazów stworzony dla Hive. Może przyjmować pliki od osób zalogowanych w Twojej aplikacji przez Hivesigner: ich token dostępu zastępuje podpis ich kluczem.

## Jak to działa {#how-it-works}

1. Osoba loguje się do Twojej aplikacji przez Hivesigner, z dostępem do publikowania. Twoja aplikacja dostaje token dostępu. Zobacz [Logowanie przez OAuth2](/docs/oauth2).
2. Twoja aplikacja wysyła obraz do Twojego imagehostera, z tym tokenem w adresie.
3. imagehoster sprawdza token i konto, zapisuje obraz i odpowiada jego adresem.
4. Twoja aplikacja wstawia ten adres do wpisu.

## Uruchom własnego imagehostera {#run-your-own}

imagehoster konfiguruje się dla jednego konta aplikacji: `app_account` w sekcji `[upload_limits]` jego konfiguracji. Wysyłaj mu tokeny utworzone dla tego konta aplikacji. Publiczne instancje należą do innych aplikacji: images.ecency.com jest skonfigurowany dla konta aplikacji Ecency, a images.hive.blog dla konta Hive.blog. Aby przyjmować pliki od swoich użytkowników, uruchom własną instancję ze swoim kontem aplikacji.

Kod źródłowy i instrukcje instalacji:

- imagehoster społeczności Hive: https://gitlab.syncad.com/hive/imagehoster
- imagehoster Ecency: https://github.com/ecency/imagehoster

W konfiguracji wpisz swoje konto aplikacji:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

Ta sama sekcja ustala minimalną reputację potrzebną do wysyłania (`reputation`) oraz limit wysyłek dla każdego konta (`max` wysyłek na `duration` milisekund). Skonfiguruj `redis_url`, aby limit naprawdę działał. `max_image_size` określa największy plik, w bajtach.

## Wyślij obraz {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Token.** Umieść token dostępu osoby w ścieżce, dokładnie tak, jak Hivesigner przekazał go Twojej aplikacji. Użyj tokenu z logowania z dostępem do publikowania dla Twojej aplikacji. Token samego logowania, z żądania bez `client_id`, nie wskazuje żadnej aplikacji i zostaje odrzucony.
- **Treść.** Wyślij `multipart/form-data` z jednym plikiem obrazu. imagehoster bierze pierwszy plik, niezależnie od nazwy pola.
- **Rozmiar.** Wyślij nagłówek `Content-Length`. Plik nie może być większy niż `max_image_size` danej instancji.

Odpowiedź jest w formacie JSON. Przy powodzeniu zawiera adres obrazu:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

Przy niepowodzeniu imagehoster odpowiada statusem błędu HTTP. Większość niepowodzeń niesie też nazwę błędu:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Uwaga:** Token podróżuje w adresie. Udostępniaj swojego imagehostera tylko przez https i trzymaj jego dzienniki dostępu w tajemnicy.

## Przykład {#example}

Ta funkcja przeglądarkowa wysyła plik z pola wyboru pliku albo z przeciągnięcia. Przeglądarka ustawia za Ciebie nagłówki wieloczęściowe i długość: nie ustawiaj `Content-Type` samodzielnie.

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
