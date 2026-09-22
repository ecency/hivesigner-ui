API на Hivesigner е на `https://hivesigner.com/api/`. Той връща акаунта на влезлия потребител, излъчва posting операции от негово име, разменя кодове за токени и изброява приложенията, които използват Hivesigner. Тази страница описва всяка крайна точка с нейните заявки, отговори и грешки.

## Заявки и удостоверяване {#authentication}

- **Основен адрес:** `https://hivesigner.com/api/`. Всяка крайна точка по-долу е относителна спрямо `https://hivesigner.com`.
- **Токенът:** изпращайте го като заглавка `Authorization`, както е: `Authorization: ACCESS_TOKEN`. Приема се и префикс `Bearer `. Можете да го изпратите и като `access_token` в query низа или в тялото, но заглавката го пази извън URL адресите и дневниците.
- **Тела:** JSON с `Content-Type: application/json` или формуляр (`application/x-www-form-urlencoded`).
- **Отговори:** JSON.
- **Браузъри:** API позволява заявки от друг произход, така че уеб приложение може да го извиква директно.

За да получите токен, вижте [Вход с OAuth2](/docs/oauth2). За съдържанието на токена вижте [Токени](/docs/tokens).

## Грешки {#errors}

Отговорът при грешка има HTTP статус за грешка и това тяло:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Статус | `error` | Кога |
| --- | --- | --- |
| 401 | `invalid_grant` | Токенът липсва или не е валиден, или е от грешния вид за тази крайна точка ("The token has invalid role"). На `/api/oauth2/token` също "The code or secret is not valid". |
| 401 | `invalid_scope` | `/api/broadcast`: операция, която токенът не позволява. Описанието назовава операциите. |
| 401 | `unauthorized_client` | `/api/broadcast`: операция, чийто автор не е потребителят на токена, `account_update2`, който засяга ключове, липсващо разрешение за posting правомощия или акаунт, който не може да бъде зареден. Описанието казва кое от тях. |
| 500 | `server_error` | `/api/broadcast`: мрежата Hive отхвърли транзакцията. `error_description` носи нейното съобщение. |
| 503 | `unavailable` | `/api/apps`: директорията все още се изгражда. |

## GET /api/me {#me}

Връща акаунта, за който е токенът. Използвайте го, за да разберете кой е влязъл, или за да [проверите токен](/docs/tokens#check-with-the-api).

- **Методи:** `GET` или `POST`.
- **Токен:** токен за достъп, включително `login` токен, който назовава приложение.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Отговорът, съкратен:

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

| Поле | Значение |
| --- | --- |
| `user` | Потребителското име в Hive, за което е токенът. `_id` и `name` го повтарят. |
| `account` | Целият акаунт, както го връща `condenser_api.get_accounts` на Hive. |
| `scope` | Какво позволява токенът: `["login"]` за токен за вход, иначе операциите, които `/api/broadcast` приема. |
| `user_metadata` | Метаданните на профила на акаунта, разчетени от JSON. |

`/api/me` не назовава приложението, за което е създаден токенът. За да проверите това, декодирайте токена: вижте [Попитайте API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Подписва posting операции за потребителя на токена с posting ключа на @hivesigner и ги излъчва към Hive.

- **Метод:** `POST`.
- **Токен:** токен за достъп `posting`, от потока с токен или потока с код.
- **Преди да работи:** потребителят е дал posting правомощия на акаунта на вашето приложение (екранът за съгласие прави това) и акаунтът на приложението ви е [дал posting правомощия на @hivesigner](/docs/register-app#grant-hivesigner).
- **Тяло:** `{ "operations": [...] }`, където всяка операция е `[name, fields]` както в блокчейна Hive. Всички операции в една заявка влизат в една транзакция.

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

Същата заявка с curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Следването е операция `custom_json`:

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

API отговаря, щом възел на Hive приеме транзакцията. `result.id` е идентификаторът на транзакцията:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Когато мрежата отхвърли транзакцията, отговорът е `500` с `server_error`. Неговият `error_description` носи съобщението на мрежата, а `response` носи суровата грешка.

### Какво приема broadcast {#broadcast-rules}

posting токен позволява на API да излъчва тези операции и никакви други. Във всяка от тях потребителят на токена трябва да е акаунтът в посоченото поле:

| Операция | Потребителят на токена трябва да е |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | Първият акаунт в `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Всяка друга операция** се отказва с `invalid_scope`. `login` токен не позволява никаква операция.
- **Операция за друг акаунт** се отказва с `unauthorized_client`. Токенът излъчва само за собствения си потребител.
- **`account_update2`** може да променя само метаданните на акаунта. Операция с поле `owner`, `active` или `posting` се отказва с `unauthorized_client`.
- **`custom_json`**: оставете `required_auths` празно. API подписва с posting правомощия, затова операция, която изисква active правомощия, се проваля в мрежата.

Преводите и другите операции с портфейла изискват active ключа на потребителя. Изпращайте ги вместо това като [връзки за подпис](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

Разменя код за токени или токен за обновяване за нови токени. Извиквайте го само от своя сървър. Вижте [Потокът с код](/docs/oauth2#code-flow).

- **Метод:** `POST`, със стойностите в тялото.
- **Тяло:** `code` и `client_secret` или `refresh_token` и `client_secret`.
- **Заглавки:** не изпращайте заглавка `Authorization`.

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

Всяко извикване връща нов токен за достъп и нов токен за обновяване. И двата са подписани от @hivesigner. `expires_in` е животът на токена за достъп в секунди (7 дни).

Грешки: `401 invalid_grant`. Описанието е "The token has invalid role", когато изпратената стойност не е валиден код или токен за обновяване. То е "The code or secret is not valid", когато кодът или тайната не съвпадат.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Казва на Hivesigner, че потребителят е излязъл от вашето приложение. Приложението ви изхвърля токена само.

- **Метод:** `POST`.
- **Токен:** токенът за достъп, в заглавката `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

`revokeToken()` в JavaScript SDK прави това извикване и след това забравя токена. За да премахнете достъпа на приложението си завинаги, потребителят го премахва на https://hivesigner.com/authorized-apps. Вижте [Изход и премахване на достъпа](/docs/tokens#sign-out).

## GET /api/apps {#apps}

Публичната директория с приложения: приложения, които излъчват през Hivesigner, подредени по броя на хората, които ги използват. Не изисква токен. https://hivesigner.com/apps показва същия списък.

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

| Поле | Значение |
| --- | --- |
| `updated_at` | Кога директорията е изградена за последно. |
| `building` | `true`, докато първото изграждане няма данни. Тогава `apps` е празен. |
| `window_days` | Броят дни, които класирането обхваща. |
| `featured` | Потребителските имена, показвани първи, по ред. |
| `apps[].username` | Акаунтът на приложението. |
| `apps[].name`, `about` | От профила на акаунта на приложението или `null`. |
| `apps[].website` | Уебсайтът от профила, когато отговаря на собствения си домейн. Иначе `null`. |
| `apps[].site` | Резултатът от проверката на уебсайта: `ok`, `no_website`, `invalid`, `redirected`, `blocked` или `unreachable`. Запис `redirected` има и `redirects_to`. |
| `apps[].users` | Различни потребители на ден, сумирани за периода. |
| `apps[].requests` | Успешни заявки към API, направени за приложението през периода. |
| `apps[].first_seen`, `last_seen` | Първият ден, в който Hivesigner е записал приложението, и последният ден, в който е използвано, или `null`. |
| `apps[].new` | `true`, когато приложението се появява за първи път в периода. |

Отговорът може да е кеширан до 5 минути. Преди директорията да бъде изградена за първи път, API отговаря `503` с `unavailable`. Опитайте по-късно.

Имената и описанията се публикуват от всеки акаунт на приложение сам. Hivesigner не проверява нито едно от тях.
