Wysyłaj ludzi do Hivesigner, aby zalogowali się do Twojej aplikacji. Tam przeglądają Twoje żądanie i je zatwierdzają. Hivesigner odsyła ich potem na Twój adres zwrotny z tokenem (przepływ z tokenem) albo z kodem, który Twój serwer wymienia na tokeny (przepływ z kodem). Ta strona obejmuje oba przepływy, wszystkie parametry i zakresy.

## Zanim zaczniesz {#before-you-start}

- Zarejestruj aplikację: konto Hive dla niej, z wypisanymi adresami zwrotnymi. Zobacz [Zarejestruj aplikację](/docs/register-app).
- Aby rozgłaszać przez API, konto Twojej aplikacji musi też [nadać uprawnienie do publikowania kontu @hivesigner](/docs/register-app#grant-hivesigner).
- Do przepływu z kodem ustaw [sekret klienta](/docs/register-app#client-secret).

## Adres autoryzacji {#authorize-url}

Wyślij osobę pod ten adres:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Zakoduj każdą wartość na potrzeby adresu. `URLSearchParams` zrobi to za Ciebie:

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

### Parametry {#parameters}

| Parametr | Wymagany | Co robi |
| --- | --- | --- |
| `client_id` | Tak, dla aplikacji | Nazwa konta Twojej aplikacji. Odczytywane jest też `clientId`. Bez niego żądanie jest żądaniem samego logowania z witryny bez konta aplikacji: zobacz [Logowanie bez dostępu do publikowania](/docs/login-only). |
| `redirect_uri` | Tak | Dokąd Hivesigner odsyła osobę. Musi być dokładnie jednym z adresów URI przekierowania Twojej aplikacji. Zobacz [Adresy zwrotne](/docs/register-app#callbacks). |
| `scope` | Nie | `login`, `posting` albo `offline`. Zobacz [Zakresy](#scopes). Bez niego żądanie prosi o dostęp do publikowania. |
| `response_type` | Nie | `code` rozpoczyna [przepływ z kodem](#code-flow). Każda inna wartość albo jej brak oznacza [przepływ z tokenem](#token-flow). |
| `state` | Zalecany | Losowa wartość, którą Hivesigner zwraca bez zmian. Zobacz [Chroń żądanie przez state](#state). |
| `account` | Nie | Nazwa użytkownika Hive. Gdy to konto jest na urządzeniu osoby, Hivesigner je wybiera. W przeciwnym razie pomija je. Odczytywane jest też `select_account`. |

Osoba wciąż może przełączyć się na inne konto na ekranie zgody. Konto zawsze bierz z tokenu albo z wymiany kodu, nigdy z tego, o co prosiłeś.

## Zakresy {#scopes}

Hive ma jedno uprawnienie do publikowania. Dlatego Hivesigner ma dwa poziomy dostępu, samo logowanie i publikowanie, a między nimi nic drobniejszego.

| `scope` | Co zatwierdza osoba | Przepływ | `type` tokenu dostępu |
| --- | --- | --- | --- |
| `login` | «Odczyt nazwy użytkownika Twojego konta». Nic nie zostaje przyznane. | Przepływ z tokenem (nie dodawaj `response_type=code`) | `login` |
| `posting` | Dostęp do publikowania. Za pierwszym razem dodaje to konto Twojej aplikacji do uprawnienia do publikowania osoby. | Przepływ z tokenem albo przepływ z kodem z `response_type=code` | `posting` |
| `offline` | Dostęp do publikowania, jak wyżej | Przepływ z kodem | `posting`, wraz z tokenem `refresh` |

W przepływie z kodem adres zwrotny dostaje najpierw kod (token o `type` równym `code`), który Twój serwer wymienia na token dostępu.

- **Brak zakresu** oznacza `posting`.
- **Wartość zawierająca gdziekolwiek `offline`** oznacza `offline`, na przykład dawne `offline,vote,comment`.
- **Każda inna wartość** oznacza `posting`. Dotyczy to też dawnych nazw operacji, takich jak `vote`, `comment`, `vote,comment`, `comment_options` czy `custom_json`. Nie ograniczają one tokenu: każdy token publikowania pozwala na te same operacje. Zobacz [Co przyjmuje broadcast](/docs/api#broadcast-rules).

Proś o `login`, gdy Twoja aplikacja musi tylko wiedzieć, kim jest osoba. Zobacz [Logowanie bez dostępu do publikowania](/docs/login-only).

## Przepływ z tokenem {#token-flow}

Przeglądarka osoby dostaje token dostępu wprost. Twoja aplikacja nie potrzebuje żadnego sekretu.

1. Wyślij osobę na adres autoryzacji:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. Osoba zatwierdza. Hivesigner przekierowuje na Twój adres zwrotny:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner dopisuje swoje parametry znakiem `?`, gdy Twój adres nie ma zapytania, i znakiem `&`, gdy je ma. `state` pojawia się tylko wtedy, gdy wysłałeś wartość niepustą.

3. Na swoim adresie zwrotnym najpierw [porównaj `state`](#state). Potem [sprawdź token](/docs/tokens#check-a-token) na swoim serwerze. Konto, którego dotyczy, jest w samym tokenie: nie polegaj wyłącznie na parametrze `username`, bo adres może zmienić każdy.
4. Trzymaj token na swoim serwerze albo w ciasteczku httpOnly. Przekieruj na czysty adres, aby token zniknął z paska adresu.
5. Używaj tokenu z [API](/docs/api), dopóki nie wygaśnie po `expires_in` sekundach (7 dni). Potem wyślij osobę ponownie na adres autoryzacji. Kto już nadał dostęp do publikowania, widzi «Zaloguj się do aplikacji APP» oraz «Aplikacja @myapp została już wcześniej autoryzowana. Nie przyznajesz żadnych nowych uprawnień.».

## Przepływ z kodem {#code-flow}

Twój serwer dostaje kod i wymienia go na token dostępu i token odświeżania. Później może je odnawiać bez udziału osoby. Użyj tego, gdy Twój serwer działa w imieniu użytkowników przez dłuższy czas.

1. Wyślij osobę na adres autoryzacji z `scope=offline`:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` robi to samo.

2. Osoba zatwierdza dostęp do publikowania. Hivesigner przekierowuje na Twój adres zwrotny:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [Porównaj `state`](#state). Potem od razu wymień kod, ze swojego serwera.

### Wymień kod {#exchange-code}

Wyślij kod i swój sekret klienta do `/api/oauth2/token` w treści żądania POST:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

Odpowiedź:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

To samo wywołanie w Node.js 18 lub nowszym:

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

- Kod i sekret umieść w treści żądania, nigdy w adresie.
- Nie wysyłaj z tym żądaniem żadnego nagłówka `Authorization`.
- Użyj `username` z tej odpowiedzi. Pochodzi z kodu, który osoba podpisała.
- Token dostępu i token odświeżania trzymaj na swoim serwerze.

### Odświeżanie {#refresh}

Gdy token dostępu wygaśnie, wyślij token odświeżania wraz ze swoim sekretem klienta na ten sam punkt końcowy:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

Odpowiedź ma tę samą postać, z nowym tokenem dostępu i nowym tokenem odświeżania. Zapisz oba w miejsce starych.

## Chroń żądanie przez state {#state}

Bez `state` inna witryna mogłaby wysłać Twojego użytkownika na Twój adres zwrotny z tokenem albo kodem własnego wyboru. Twoja aplikacja zalogowałaby wtedy osobę na cudze konto. `state` wiąże każdy powrót z przeglądarką, która rozpoczęła logowanie.

1. Utwórz losową wartość dla każdego logowania, co najmniej 16 losowych bajtów. Zapis szesnastkowy trzyma ją z dala od znaków wymagających kodowania.
2. Zapisz ją tam, gdzie tylko ta przeglądarka może ją znów okazać: w sesji Twojego serwera albo w krótkotrwałym ciasteczku httpOnly i Secure z `SameSite=Lax`.
3. Wyślij ją jako `state` w adresie autoryzacji.
4. Na swoim adresie zwrotnym porównaj parametr `state` z zapisaną wartością. Jeśli go brakuje albo się różni, zatrzymaj się: nie używaj ani tokenu, ani kodu.
5. Usuń zapisaną wartość, aby każda działała tylko raz.

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

Hivesigner zwraca dokładnie tę wartość `state`, którą dostał. Pustą pomija.

## Co widzi osoba {#what-the-user-sees}

Ekran zgody pokazuje obraz i nazwę Twojej aplikacji, «Konto Hive @myapp» oraz «Przekieruje Cię na adres HOST», gdzie HOST pochodzi z Twojego adresu zwrotnego. Dalej:

- **Pierwsze żądanie publikowania.** Nagłówek brzmi «APP prosi o dostęp do Twojego konta.». Karta **Zakres** wymienia, co Twoja aplikacja będzie mogła robić. Komunikat brzmi «Pierwsza autoryzacja: konto @myapp zostanie dodane w blockchainie do Twojego uprawnienia do publikowania, co jednorazowo wymaga Twojego klucza aktywnego. To konto będzie mogło publikować w Twoim imieniu, dopóki nie cofniesz uprawnienia.». Przycisk brzmi **Autoryzuj**. Gdy urządzenie osoby nie ma klucza aktywnego do tego konta, ekran prosi o niego na miejscu.
- **Logowanie.** Przy `scope=login` albo przy dostępie do publikowania nadanym wcześniej nagłówek brzmi «Zaloguj się do aplikacji APP», a przycisk **Zaloguj się**.
- **Konto.** «Autoryzujesz jako» albo «Logujesz się jako», a po tym wybrane konto. Osoba może tu zmienić konto.
- **Zablokowane konto.** Nad przyciskiem pojawia się pole kodu dostępu. Jedno kliknięcie odblokowuje konto i przechodzi dalej.
- **Brak konta na urządzeniu.** Przycisk brzmi **Dalej**. Otwiera formularz dodawania konta i wraca potem do żądania.

Po pierwszym żądaniu publikowania Hivesigner czeka, aż nowa zgoda będzie widoczna w blockchainie, i dopiero wtedy przekierowuje. Może to potrwać kilka sekund. Cały ekran z perspektywy osoby opisuje [Logowanie do aplikacji](/docs/signing-in).

## Anulowanie i odrzucone żądania {#cancel}

- **Anulowanie.** Osoba przechodzi do swojej listy kont w Hivesigner. Na Twój adres zwrotny nic nie trafia: nie ma żadnego parametru błędu. Zostaw przycisk logowania dostępny, aby osoba mogła zacząć od nowa. Nie czekaj na powrót.
- **Odrzucone żądania.** Niezarejestrowany adres zwrotny, nieznane `client_id` albo brak `redirect_uri` pokazują w Hivesigner błąd z przyciskiem **Zgłoś ten problem**. Na Twój adres zwrotny nic nie trafia. Zobacz [Co widzą użytkownicy, gdy coś jest nie tak](/docs/register-app#refused-requests).

## Dawny adres żądania logowania {#legacy-login-request}

Hivesigner wciąż przyjmuje starszy adres logowania, zachowany dla dawnych integracji. Do nowych używaj `/oauth2/authorize`.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

Otwiera ten sam ekran zgody, z tymi samymi sprawdzeniami adresu zwrotnego i tym samym przekierowaniem. Swoje parametry czyta jednak inaczej:

- `scope` to `login` albo `posting`. Każda inna wartość albo jej brak oznacza `login`.
- `offline` nie jest czytane. Do przepływu z kodem dodaj `response_type=code`.
- `account` nie jest czytane.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` działa według tych samych zasad.
