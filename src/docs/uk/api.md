API Hivesigner міститься за адресою `https://hivesigner.com/api/`. Він повертає обліковий запис користувача, який увійшов, надсилає за нього операції публікації, обмінює коди на токени й перелічує застосунки, що користуються Hivesigner. Ця сторінка описує кожну кінцеву точку з її запитами, відповідями й помилками.

## Запити й автентифікація {#authentication}

- **Базова адреса:** `https://hivesigner.com/api/`. Кожна кінцева точка нижче подана відносно `https://hivesigner.com`.
- **Токен:** надсилайте його в заголовку `Authorization` як є: `Authorization: ACCESS_TOKEN`. Префікс `Bearer ` теж приймається. Ви також можете надіслати його як `access_token` у рядку запиту або в тілі, але заголовок тримає токен поза URL-адресами й журналами.
- **Тіла:** JSON із `Content-Type: application/json` або форма (`application/x-www-form-urlencoded`).
- **Відповіді:** JSON.
- **Браузери:** API дозволяє міждоменні запити, тож вебзастосунок може викликати його напряму.

Щоб отримати токен, див. [Вхід через OAuth2](/docs/oauth2). Про те, що містить токен, див. [Токени](/docs/tokens).

## Помилки {#errors}

Відповідь з помилкою має статус помилки HTTP і таке тіло:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Статус | `error` | Коли |
| --- | --- | --- |
| 401 | `invalid_grant` | Токена немає або він недійсний, або він не того виду для цієї кінцевої точки («The token has invalid role»). На `/api/oauth2/token` також «The code or secret is not valid». |
| 401 | `invalid_scope` | `/api/broadcast`: операція, якої токен не дозволяє. В описі названо операції. |
| 401 | `unauthorized_client` | `/api/broadcast`: операція, автором якої не є користувач токена, `account_update2`, що торкається ключів, відсутній дозвіл на повноваження публікації або обліковий запис, який не вдалося завантажити. Опис каже, що саме. |
| 500 | `server_error` | `/api/broadcast`: мережа Hive відхилила транзакцію. `error_description` несе її повідомлення. |
| 503 | `unavailable` | `/api/apps`: каталог ще будується. |

## GET /api/me {#me}

Повертає обліковий запис, якому належить токен. Використовуйте це, щоб дізнатися, хто ввійшов, або щоб [перевірити токен](/docs/tokens#check-with-the-api).

- **Методи:** `GET` або `POST`.
- **Токен:** токен доступу, зокрема токен `login`, у якому названо застосунок.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Скорочена відповідь:

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

| Поле | Що означає |
| --- | --- |
| `user` | Ім’я користувача Hive, якому належить токен. `_id` і `name` повторюють його. |
| `account` | Увесь обліковий запис у тому вигляді, у якому його повертає `condenser_api.get_accounts` Hive. |
| `scope` | Що дозволяє токен: `["login"]` для токена входу, інакше операції, які приймає `/api/broadcast`. |
| `user_metadata` | Метадані профілю облікового запису, розібрані з JSON. |

`/api/me` не називає застосунок, для якого створено токен. Щоб це перевірити, розкодуйте токен: див. [Запитайте API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Підписує операції публікації для користувача токена ключем публікації @hivesigner і надсилає їх у Hive.

- **Метод:** `POST`.
- **Токен:** токен доступу `posting`, з потоку з токеном або з потоку з кодом.
- **Що має бути до того:** користувач надав обліковому запису вашого застосунку повноваження публікації (це робить екран згоди), а обліковий запис вашого застосунку [надав повноваження публікації @hivesigner](/docs/register-app#grant-hivesigner).
- **Тіло:** `{ "operations": [...] }`, де кожна операція це `[name, fields]`, як у блокчейні Hive. Усі операції одного запиту потрапляють в одну транзакцію.

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

Той самий запит через curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Підписка це операція `custom_json`:

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

API відповідає, щойно вузол Hive прийняв транзакцію. `result.id` це ID транзакції:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Коли мережа відхиляє транзакцію, відповіддю є `500` із `server_error`. Її `error_description` несе повідомлення мережі, а `response` несе необроблену помилку.

### Що приймає broadcast {#broadcast-rules}

Токен публікації дозволяє API надсилати лише ці операції й жодних інших. У кожній із них користувач токена має бути обліковим записом у вказаному полі:

| Операція | Користувач токена має бути |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | Першим обліковим записом у `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Будь-яку іншу операцію** відхилено з `invalid_scope`. Токен `login` не дозволяє жодної операції.
- **Операцію для іншого облікового запису** відхилено з `unauthorized_client`. Токен надсилає транзакції лише за свого користувача.
- **`account_update2`** може змінювати лише метадані облікового запису. Операцію з полем `owner`, `active` чи `posting` відхилено з `unauthorized_client`.
- **`custom_json`**: лишайте `required_auths` порожнім. API підписує повноваженнями публікації, тож операція, якій потрібні активні повноваження, зазнає невдачі в мережі.

Перекази та інші операції з гаманцем потребують активного ключа користувача. Надсилайте їх натомість як [посилання для підпису](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

Обмінює код на токени або токен оновлення на нові токени. Викликайте це лише зі свого сервера. Див. [Потік з кодом](/docs/oauth2#code-flow).

- **Метод:** `POST`, зі значеннями в тілі.
- **Тіло:** `code` і `client_secret` або `refresh_token` і `client_secret`.
- **Заголовки:** не надсилайте заголовок `Authorization`.

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

Кожен виклик повертає новий токен доступу й новий токен оновлення. Обидва підписані @hivesigner. `expires_in` це час життя токена доступу в секундах (7 днів).

Помилки: `401 invalid_grant`. Опис це «The token has invalid role», коли надіслане значення не є дійсним кодом чи токеном оновлення. Це «The code or secret is not valid», коли код або секрет не збігається.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Повідомляє Hivesigner, що користувач вийшов із вашого застосунку. Токен ваш застосунок відкидає сам.

- **Метод:** `POST`.
- **Токен:** токен доступу, у заголовку `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

`revokeToken()` із JavaScript SDK робить цей виклик і потім забуває токен. Щоб назавжди прибрати доступ вашого застосунку, користувач прибирає його на https://hivesigner.com/authorized-apps. Див. [Вихід і прибирання доступу](/docs/tokens#sign-out).

## GET /api/apps {#apps}

Публічний каталог застосунків: застосунки, які надсилають транзакції через Hivesigner, упорядковані за кількістю людей, які ними користуються. Токен не потрібен. https://hivesigner.com/apps показує той самий перелік.

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

| Поле | Що означає |
| --- | --- |
| `updated_at` | Коли каталог востаннє було побудовано. |
| `building` | `true`, доки перша побудова не має даних. `apps` тоді порожній. |
| `window_days` | Скільки днів охоплює впорядкування. |
| `featured` | Імена користувачів, які показуються першими, у цьому порядку. |
| `apps[].username` | Обліковий запис застосунку. |
| `apps[].name`, `about` | З профілю облікового запису застосунку або `null`. |
| `apps[].website` | Вебсайт із профілю, коли він відповідає на власному домені. Інакше `null`. |
| `apps[].site` | Результат перевірки вебсайту: `ok`, `no_website`, `invalid`, `redirected`, `blocked` або `unreachable`. Запис зі значенням `redirected` також має `redirects_to`. |
| `apps[].users` | Щоденні унікальні користувачі, підсумовані за період. |
| `apps[].requests` | Успішні запити до API, зроблені для застосунку за період. |
| `apps[].first_seen`, `last_seen` | Перший день, коли Hivesigner записав застосунок, і останній день, коли ним користувалися, або `null`. |
| `apps[].new` | `true`, коли застосунок уперше з’явився в межах періоду. |

Відповідь може кешуватися до 5 хвилин. Доки каталог не побудовано вперше, API відповідає `503` з `unavailable`. Спробуйте пізніше.

Назви й описи публікує кожен обліковий запис застосунку сам. Hivesigner їх не перевіряє.
