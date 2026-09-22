Token Hivesigner to krótkie podpisane oświadczenie. Wskazuje konto Hive, aplikację, dla której powstał, i czas podpisania. Twój serwer może sprawdzić token przez API albo samodzielnie. Ta strona pokazuje, co zawiera token, jak długo działa i obie drogi sprawdzenia.

## Jak wygląda token {#format}

Token to obiekt JSON zakodowany w base64url, z jedną różnicą wobec standardowego base64url: wypełnienie używa `.` zamiast `=`. W porównaniu ze zwykłym base64 `+` staje się `-`, `/` staje się `_`, a `=` staje się `.`. Każdy token zaczyna się od `eyJzaWduZWRfbWVzc2FnZSI6`.

Po zdekodowaniu token dostępu z przepływu z tokenem wygląda tak:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Pole | Znaczenie |
| --- | --- |
| `signed_message.type` | Czym jest token: `login`, `posting`, `code` albo `refresh`. Zobacz [Rodzaje tokenów](#kinds). |
| `signed_message.app` | Konto aplikacji, dla której token powstał. Token logowania dla witryny bez konta aplikacji go nie ma. |
| `authors[0]` | Konto Hive, którego token dotyczy. |
| `timestamp` | Czas podpisania, w sekundach od 1970-01-01 UTC. |
| `signatures[0]` | Podpis, jako ciąg szesnastkowy. |
| `authority` | Tylko w tokenach podpisanych w przeglądarce: który klucz osoby podpisał, `posting` czy `active`. To pole leży poza podpisanymi danymi. Aby wiedzieć, który klucz podpisał, odzyskaj go z podpisu. |

Podpis to podpis secp256k1 na skrócie sha256 z `JSON.stringify({ signed_message, authors, timestamp })`, z kluczami w tej właśnie kolejności.

### Zdekoduj token {#decode}

W Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

W przeglądarce:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Dekodowanie to nie sprawdzanie. Każdy może zbudować ciąg, który zdekoduje się do tej postaci. [Sprawdź token](#check-a-token), zanim mu zaufasz.

## Rodzaje tokenów {#kinds}

| Token | `type` | `app` | Podpisany przez | Skąd go bierzesz |
| --- | --- | --- | --- | --- |
| Token dostępu, przepływ z tokenem | `posting` | Twoją aplikację | Klucz publikowania osoby albo jej klucz aktywny, gdy Hivesigner nie ma klucza publikowania do tego konta | `access_token` na Twoim adresie zwrotnym |
| Token logowania, `scope=login` | `login` | Twoją aplikację | Klucz publikowania albo aktywny osoby | `access_token` na Twoim adresie zwrotnym |
| Token logowania, witryna bez konta aplikacji | `login` | Żadną | Klucz publikowania albo aktywny osoby | `access_token` na Twoim adresie zwrotnym |
| Kod | `code` | Twoją aplikację | Klucz publikowania albo aktywny osoby | `code` na Twoim adresie zwrotnym |
| Token dostępu, przepływ z kodem | `posting` | Twoją aplikację | Klucz publikowania konta @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Token odświeżania | `refresh` | Twoją aplikację | Klucz publikowania konta @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Kod i token odświeżania nie są tokenami dostępu. Nigdy nie przyjmuj żadnego z nich jako logowania.

## Jak długo działa token {#lifetime}

Token dostępu działa 7 dni: `expires_in` to 604800 sekund, liczone od jego `timestamp`. Po wygaśnięciu:

- **Przepływ z tokenem:** wyślij osobę, aby zalogowała się ponownie. Kto już autoryzował Twoją aplikację, widzi «Zaloguj się do aplikacji APP» i potrzebuje jednego kliknięcia.
- **Przepływ z kodem:** Twój serwer pobiera nowy token dostępu przy użyciu tokenu odświeżania i sekretu klienta. Zobacz [Odświeżanie](/docs/oauth2#refresh).

Uznaj token za wygasły, gdy tylko jego `timestamp` będzie starszy niż 7 dni. Do wszystkiego, co sprawdzasz zaraz po przekierowaniu, przyjmuj znacznie krótszy wiek. Kod wymieniaj od razu. Token logowania przyjmuj tylko w ciągu kilku minut od jego `timestamp`.

## Sprawdź token na swoim serwerze {#check-a-token}

Zanim Twój serwer zaufa tokenowi przysłanemu przez przeglądarkę albo aplikację, sprawdź, czy:

- konto albo @hivesigner naprawdę go podpisało;
- powstał dla Twojej aplikacji;
- jest tym rodzajem tokenu, którego oczekujesz;
- jest dość świeży.

### Zapytaj API {#check-with-the-api}

Wywołaj `/api/me` z tym tokenem. Prawidłowy token zwraca konto w `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Nieprawidłowy token zwraca `401` z `invalid_grant`. Zobacz [GET /api/me](/docs/api#me).

`/api/me` potwierdza podpis. Jego odpowiedź nie wskazuje jednak aplikacji, dla której token powstał. Dlatego zdekoduj też token i sprawdź samodzielnie jego `app`, `type` i wiek. Token utworzony dla innej aplikacji nie może nikogo zalogować do Twojej.

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

API przyjmuje tylko tokeny wskazujące aplikację. Token logowania z witryny bez konta aplikacji sprawdź [samodzielnie](#check-it-yourself).

### Sprawdź samodzielnie {#check-it-yourself}

1. Zdekoduj token.
2. Sprawdź, czy `signed_message.type` jest oczekiwanym rodzajem: `posting` dla tokenu dostępu, `login` dla tokenu logowania.
3. Sprawdź, czy `signed_message.app` to konto Twojej aplikacji. Dla witryny bez konta aplikacji sprawdź, że go w ogóle nie ma.
4. Sprawdź wiek na podstawie `timestamp`.
5. Policz skrót sha256 z `JSON.stringify({ signed_message, authors, timestamp })`.
6. Odzyskaj klucz publiczny z `signatures[0]` i tego skrótu.
7. Odczytaj konto `authors[0]` z blockchaina Hive właśnie teraz, bo użytkownicy mogą zmieniać klucze. Odzyskany klucz musi być jednym z jego obecnych kluczy publikowania albo aktywnych. Token z `/api/oauth2/token` podpisuje natomiast @hivesigner: dla takich przyjmij obecny klucz publikowania konta @hivesigner.

W Node.js z [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), który udostępnia `PrivateKey`, `PublicKey`, `Signature` i `callRPC` pod `@ecency/sdk/hive`:

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

Użyj tego tak:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

Biblioteka dhive (`@hiveio/dhive`) także się nadaje: policz skrót przez `cryptoUtils.sha256(message)`, a klucz odzyskaj przez `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Trzymaj tokeny bezpiecznie {#keep-tokens-safe}

Każdy, kto ma token publikowania, może aż do jego wygaśnięcia rozgłaszać jako ta osoba przez Twoją aplikację. Traktuj go jak hasło.

- **Trzymaj tokeny na swoim serwerze** albo w ciasteczku httpOnly i Secure. Tokeny odświeżania i sekret klienta trzymaj wyłącznie na serwerze.
- **Nigdy nie umieszczaj tokenu w adresie, który zapisujesz w dziennikach.** Przepływ z tokenem dostarcza go w ciągu zapytania Twojego adresu zwrotnego. Odczytaj go na serwerze, a potem przekieruj na adres bez niego. Ciąg zapytania adresu zwrotnego zostaw poza dziennikami.
- **Na stronie adresu zwrotnego nie ładuj niczego z innych witryn,** żeby adres z tokenem do nich nie trafił. Pomaga nagłówek `Referrer-Policy: no-referrer` na tej stronie.
- **Token wysyłaj tylko na swój serwer i na `https://hivesigner.com/api/`.**

## Wylogowanie i odebranie dostępu {#sign-out}

- **Wylogowanie osoby** oznacza wyrzucenie tokenu: usuń go ze swojej sesji albo ciasteczka. Możesz też wywołać [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke), aby powiedzieć Hivesigner, że osoba się wylogowała. Twoja aplikacja i tak wyrzuca token sama.
- **Trwałe odcięcie dostępu Twojej aplikacji** to decyzja osoby. Na https://hivesigner.com/authorized-apps albo na `https://hivesigner.com/revoke/APP` usuwa ona konto Twojej aplikacji ze swojego uprawnienia do publikowania w blockchainie. Po tym API nie rozgłasza już w jej imieniu przez Twoją aplikację.
