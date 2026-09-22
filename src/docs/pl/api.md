API Hivesigner znajduje się pod adresem `https://hivesigner.com/api/`. Zwraca konto zalogowanej osoby, rozgłasza w jej imieniu operacje publikowania, wymienia kody na tokeny i podaje listę aplikacji korzystających z Hivesigner. Ta strona opisuje każdy punkt końcowy wraz z żądaniami, odpowiedziami i błędami.

## Żądania i uwierzytelnianie {#authentication}

- **Adres bazowy:** `https://hivesigner.com/api/`. Każdy punkt końcowy poniżej jest podany względem `https://hivesigner.com`.
- **Token:** wyślij go bez zmian jako nagłówek `Authorization`: `Authorization: ACCESS_TOKEN`. Przyjmowany jest też przedrostek `Bearer `. Możesz go wysłać także jako `access_token` w ciągu zapytania albo w treści, ale nagłówek trzyma go poza adresami i dziennikami.
- **Treści:** JSON z `Content-Type: application/json` albo formularz (`application/x-www-form-urlencoded`).
- **Odpowiedzi:** JSON.
- **Przeglądarki:** API zezwala na żądania z innych źródeł, więc aplikacja sieciowa może wywoływać je wprost.

Aby zdobyć token, zobacz [Logowanie przez OAuth2](/docs/oauth2). Co zawiera token, opisuje [Tokeny](/docs/tokens).

## Błędy {#errors}

Odpowiedź z błędem ma status błędu HTTP i taką treść:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Status | `error` | Kiedy |
| --- | --- | --- |
| 401 | `invalid_grant` | Brakuje tokenu albo jest nieprawidłowy, albo jest niewłaściwego rodzaju dla tego punktu końcowego («The token has invalid role»). Na `/api/oauth2/token` także «The code or secret is not valid». |
| 401 | `invalid_scope` | `/api/broadcast`: operacja, na którą token nie pozwala. Opis wymienia te operacje. |
| 401 | `unauthorized_client` | `/api/broadcast`: operacja, której autorem nie jest osoba z tokenu, `account_update2` dotykający kluczy, brak zgody na uprawnienie do publikowania albo konto, którego nie udało się wczytać. Opis mówi, który to przypadek. |
| 500 | `server_error` | `/api/broadcast`: sieć Hive odrzuciła transakcję. `error_description` niesie jej komunikat. |
| 503 | `unavailable` | `/api/apps`: katalog jest wciąż budowany. |

## GET /api/me {#me}

Zwraca konto, którego dotyczy token. Użyj tego, aby dowiedzieć się, kto się zalogował, albo aby [sprawdzić token](/docs/tokens#check-with-the-api).

- **Metody:** `GET` albo `POST`.
- **Token:** token dostępu, w tym token `login` wskazujący aplikację.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Odpowiedź, skrócona:

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| Pole | Znaczenie |
| --- | --- |
| `user` | Nazwa użytkownika Hive, której dotyczy token. `_id` i `name` ją powtarzają. |
| `account` | Całe konto, tak jak zwraca je `condenser_api.get_accounts` z Hive. |
| `scope` | Na co pozwala token: `["login"]` dla tokenu logowania, w innym razie operacje, które przyjmuje `/api/broadcast`. |
| `user_metadata` | Metadane profilu konta, odczytane z JSON. |

`/api/me` nie wskazuje aplikacji, dla której token powstał. Aby to sprawdzić, zdekoduj token: zobacz [Zapytaj API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Podpisuje operacje publikowania osoby z tokenu kluczem publikowania konta @hivesigner i rozgłasza je w sieci Hive.

- **Metoda:** `POST`.
- **Token:** token dostępu `posting`, z przepływu z tokenem albo z kodem.
- **Zanim zadziała:** osoba nadała uprawnienie do publikowania kontu Twojej aplikacji (robi to ekran zgody), a konto Twojej aplikacji [nadało uprawnienie do publikowania kontu @hivesigner](/docs/register-app#grant-hivesigner).
- **Treść:** `{ "operations": [...] }`, gdzie każda operacja ma postać `[name, fields]`, tak jak w blockchainie Hive. Wszystkie operacje z jednego żądania trafiają do jednej transakcji.

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

To samo żądanie przez curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Obserwowanie to operacja `custom_json`:

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

API odpowiada, gdy tylko węzeł Hive przyjmie transakcję. `result.id` to identyfikator transakcji:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Gdy sieć odrzuci transakcję, odpowiedzią jest `500` z `server_error`. Jej `error_description` niesie komunikat sieci, a `response` surowy błąd.

### Co przyjmuje broadcast {#broadcast-rules}

Token publikowania pozwala API rozgłaszać te operacje i żadne inne. W każdej z nich osoba z tokenu musi być kontem we wskazanym polu:

| Operacja | Osoba z tokenu musi być |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | Pierwszym kontem w `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Każda inna operacja** zostaje odrzucona z `invalid_scope`. Token `login` nie pozwala na żadną operację.
- **Operacja dla innego konta** zostaje odrzucona z `unauthorized_client`. Token rozgłasza wyłącznie w imieniu swojej osoby.
- **`account_update2`** może zmieniać tylko metadane konta. Operacja z polem `owner`, `active` albo `posting` zostaje odrzucona z `unauthorized_client`.
- **`custom_json`**: zostaw `required_auths` puste. API podpisuje uprawnieniem do publikowania, więc operacja wymagająca uprawnienia aktywnego zakończy się w sieci niepowodzeniem.

Przelewy i inne operacje portfela wymagają klucza aktywnego osoby. Wysyłaj je zamiast tego jako [linki podpisu](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

Wymienia kod na tokeny albo token odświeżania na nowe tokeny. Wywołuj to tylko ze swojego serwera. Zobacz [Przepływ z kodem](/docs/oauth2#code-flow).

- **Metoda:** `POST`, z wartościami w treści.
- **Treść:** `code` i `client_secret` albo `refresh_token` i `client_secret`.
- **Nagłówki:** nie wysyłaj żadnego nagłówka `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Każde wywołanie zwraca nowy token dostępu i nowy token odświeżania. Oba podpisuje @hivesigner. `expires_in` to czas życia tokenu dostępu w sekundach (7 dni).

Błędy: `401 invalid_grant`. Opis brzmi «The token has invalid role», gdy wysłana wartość nie jest prawidłowym kodem ani tokenem odświeżania. Brzmi «The code or secret is not valid», gdy kod albo sekret się nie zgadza.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Informuje Hivesigner, że osoba wylogowała się z Twojej aplikacji. Twoja aplikacja wyrzuca token sama.

- **Metoda:** `POST`.
- **Token:** token dostępu, w nagłówku `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

`revokeToken()` z SDK JavaScript wykonuje to wywołanie, a potem zapomina token. Aby trwale odebrać dostęp Twojej aplikacji, osoba usuwa go na https://hivesigner.com/authorized-apps. Zobacz [Wylogowanie i odebranie dostępu](/docs/tokens#sign-out).

## GET /api/apps {#apps}

Publiczny katalog aplikacji: aplikacje rozgłaszające przez Hivesigner, uszeregowane według liczby użytkowników. Nie wymaga tokenu. https://hivesigner.com/apps pokazuje tę samą listę.

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| Pole | Znaczenie |
| --- | --- |
| `updated_at` | Kiedy katalog był budowany ostatnio. |
| `building` | `true`, dopóki pierwsze budowanie nie ma danych. `apps` jest wtedy puste. |
| `window_days` | Liczba dni, które obejmuje ranking. |
| `featured` | Nazwy użytkowników pokazywane najpierw, w tej kolejności. |
| `apps[].username` | Konto aplikacji. |
| `apps[].name`, `about` | Z profilu konta aplikacji albo `null`. |
| `apps[].website` | Strona z profilu, gdy odpowiada we własnej domenie. W innym razie `null`. |
| `apps[].site` | Wynik sprawdzenia strony: `ok`, `no_website`, `invalid`, `redirected`, `blocked` albo `unreachable`. Wpis `redirected` ma też `redirects_to`. |
| `apps[].users` | Różni użytkownicy dziennie, zsumowani w całym okresie. |
| `apps[].requests` | Udane żądania do API wykonane dla aplikacji w tym okresie. |
| `apps[].first_seen`, `last_seen` | Pierwszy dzień, w którym Hivesigner zapisał aplikację, i ostatni dzień jej użycia albo `null`. |
| `apps[].new` | `true`, gdy aplikacja pojawiła się po raz pierwszy w tym okresie. |

Odpowiedź może być przechowywana w pamięci podręcznej do 5 minut. Zanim katalog powstanie po raz pierwszy, API odpowiada `503` z `unavailable`. Spróbuj później.

Nazwy i opisy publikuje każde konto aplikacji samodzielnie. Hivesigner żadnego z nich nie weryfikuje.
