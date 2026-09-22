Oficjalne SDK JavaScript buduje adresy logowania i linki podpisu oraz wywołuje za Ciebie API Hivesigner. Dla Pythona istnieją biblioteki społeczności. Każdy inny język może wywoływać [API REST](/docs/api) wprost.

## SDK JavaScript {#javascript}

SDK to pakiet npm `hivesigner`. Jego kod źródłowy jest na https://github.com/ecency/hivesigner-sdk. Napisano go w TypeScript i zawiera własne typy.

Wersja 4 wymaga Node.js 18 albo nowszego, bo korzysta z wbudowanego `fetch`. W przeglądarkach wymaga ES2017 albo nowszego. Tam, gdzie nie ma globalnego `fetch`, dodaj polyfill przed użyciem SDK. Na starszym Node.js zostań przy wersji 3.

### Instalacja {#install}

```bash
npm install hivesigner
```

Do strony bez etapu budowania wczytaj pakiet przeglądarkowy. Definiuje on globalne `hivesigner`:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Utwórz klienta {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Opcja | Znaczenie |
| --- | --- |
| `app` | Konto Twojej aplikacji, wysyłane jako `client_id`. |
| `callbackURL` | Dokąd Hivesigner odsyła osobę. Musi być jednym z adresów zwrotnych Twojej aplikacji, znak po znaku (adres zwrotny na pętli zwrotnej ze zwykłym http może różnić się hostem i portem, zobacz [Adresy zwrotne](/docs/register-app#callback-rules)). |
| `scope` | Lista, łączona przecinkami w parametr `scope`. Zobacz [Zakresy](/docs/oauth2#scopes). |
| `responseType` | `'code'` dla przepływu z kodem. Pomiń przy przepływie z tokenem. |
| `accessToken` | Token dostępu osoby, jeśli już go masz. |
| `apiURL` | Źródło API. SDK dokleja do niego `/api/`. Domyślnie `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` i `setApiURL` zmieniają klienta później. Każda z nich zwraca klienta.

### Zaloguj osobę {#sign-in}

`getLoginURL(state, account)` zwraca adres logowania:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` wraca na Twój adres zwrotny bez zmian. Użyj go, aby związać odpowiedź z żądaniem.
- `account` jest opcjonalne: nazwa użytkownika. Hivesigner wybiera to konto, gdy jest na urządzeniu, a w innym razie je pomija.

W przeglądarce `client.login({ state: 'STATE' })` wysyła osobę pod ten sam adres, bez konta.

W przepływie z tokenem Twój adres zwrotny dostaje `access_token`, `expires_in` i `username`. Przekaż token klientowi:

```js
client.setAccessToken('ACCESS_TOKEN');
```

SDK nie ma metody do wymiany w przepływie z kodem. Twój serwer sam wysyła kod i sekret klienta do API, tak jak pokazuje [Wymień kod](/docs/oauth2#exchange-code).

### Pobierz osobę {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` to konto Hive osoby w takiej postaci, w jakiej zwraca je blockchain. `scope` wymienia, na co pozwala token.

### Rozgłaszanie {#broadcast}

`broadcast(operations)` wysyła operacje do API, które rozgłasza je w imieniu osoby. API przyjmuje wyłącznie operacje publikowania, których autorem jest osoba z tokenu: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` z uprawnieniem do publikowania, `claim_reward_balance` oraz `account_update2` dla metadanych profilu. Zobacz [Co przyjmuje broadcast](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Wskaż osobę w każdej operacji. API nie podstawia `__signer`.

Te metody pomocnicze budują po jednej operacji i wywołują `broadcast`:

| Metoda | Rozgłasza |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` biegnie od `-10000` do `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Dla nowego wpisu `parentAuthor` to `''`. `jsonMetadata` może być obiektem: SDK zamienia go na ciąg. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Podaj `[]` jako `requiredAuths` i `['USERNAME']` jako `requiredPostingAuths`. `json` jest ciągiem. |
| `reblog(account, author, permlink)` | `custom_json` z id `follow`, które udostępnia wpis ponownie |
| `follow(follower, following)` | `custom_json` z id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` z id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` z id `follow`, `what: ['ignore']` (wyciszenie) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Kwoty to ciągi, na przykład `'0.000 HIVE'`, `'0.000 HBD'` i `'1.000000 VESTS'`. |

`updateUserMetadata()` jest przestarzałe. Aby zmienić profil osoby, rozgłoś `account_update2` z nowym `posting_json_metadata`.

### Wylogowanie {#log-out}

`revokeToken()` to wywołanie wylogowania w SDK. Wysyła token do punktu unieważniania w API, a potem usuwa go z klienta. Gdy wywołanie się nie powiedzie, wywołaj `removeAccessToken()` samodzielnie. Usuń też token stamtąd, gdzie Twoja aplikacja go zapisała.

Aby trwale zakończyć dostęp Twojej aplikacji, osoba usuwa go na https://hivesigner.com/authorized-apps. Zobacz [Zobacz i odbierz dostęp aplikacji](/docs/signing-in#remove-access).

### Linki podpisu {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` i `sendTransaction(tx, params)` zwracają link `https://hivesigner.com/sign/...`. `params` przyjmuje `callback`, `no_broadcast` i `signer`. Zobacz [Linki podpisu](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

W TypeScript typy wymagają trzeciego argumentu: podaj `undefined`, aby otrzymać link.

W przeglądarce podaj funkcję jako trzeci argument, aby otworzyć link w nowej karcie. Funkcja nie jest wywoływana i nic nie zostaje zwrócone. Wywołaj ją z obsługi kliknięcia, bo inaczej przeglądarka może zablokować nową kartę, a wywołanie zgłosi błąd.

### Obietnice i wywołania zwrotne {#promises-and-callbacks}

`me`, `broadcast`, metody pomocnicze i `revokeToken` zwracają obietnicę. Podaj funkcję jako ostatni argument, aby użyć zamiast tego wywołania zwrotnego. Otrzyma ono `(error, result)`.

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

Gdy API odpowie błędem, obietnica zostaje odrzucona z treścią błędu API, `{ error, error_description }`. Przy wywołaniu zwrotnym ta treść jest argumentem `error`. Gdy odpowiedź nie jest JSON, odrzucenie niesie błąd parsowania.

## Python {#python}

Te biblioteki pochodzą od społeczności. Utrzymują je ich autorzy, a nie zespół Hivesigner. Zestaw je z [API REST](/docs/api), zanim na nich polegniesz.

| Biblioteka | Autor |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, moduł `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
