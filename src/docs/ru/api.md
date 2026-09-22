API Hivesigner находится по адресу `https://hivesigner.com/api/`. Он возвращает аккаунт вошедшего человека, отправляет за него постинг-операции, обменивает коды на токены и перечисляет приложения, которые используют Hivesigner. На этой странице описан каждый адрес с его запросами, ответами и ошибками.

## Запросы и аутентификация {#authentication}

- **Базовый адрес:** `https://hivesigner.com/api/`. Каждый адрес ниже указан относительно `https://hivesigner.com`.
- **Токен:** отправляйте его как есть в заголовке `Authorization`: `Authorization: ACCESS_TOKEN`. Принимается и префикс `Bearer `. Можно отправить его и как `access_token` в строке запроса или в теле, но заголовок удерживает его вне адресов и журналов.
- **Тела:** JSON с `Content-Type: application/json` или форма (`application/x-www-form-urlencoded`).
- **Ответы:** JSON.
- **Браузеры:** API разрешает запросы с другого источника, поэтому веб-приложение может обращаться к нему напрямую.

Как получить токен, смотрите в [Вход через OAuth2](/docs/oauth2). Что содержит токен, смотрите в [Токены](/docs/tokens).

## Ошибки {#errors}

Ответ с ошибкой имеет статус ошибки HTTP и такое тело:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Статус | `error` | Когда |
| --- | --- | --- |
| 401 | `invalid_grant` | Токена нет либо он недействителен, либо он не того вида для этого адреса («The token has invalid role»). На `/api/oauth2/token` также «The code or secret is not valid». |
| 401 | `invalid_scope` | `/api/broadcast`: операция, которую токен не разрешает. В описании названы операции. |
| 401 | `unauthorized_client` | `/api/broadcast`: операция, автором которой не является человек из токена, `account_update2`, затрагивающий ключи, отсутствующее разрешение на постинг-полномочия или аккаунт, который не удалось загрузить. В описании сказано, какой именно случай. |
| 500 | `server_error` | `/api/broadcast`: сеть Hive отклонила транзакцию. `error_description` несёт её сообщение. |
| 503 | `unavailable` | `/api/apps`: каталог ещё строится. |

## GET /api/me {#me}

Возвращает аккаунт, которому принадлежит токен. Используйте это, чтобы узнать, кто вошёл, или чтобы [проверить токен](/docs/tokens#check-with-the-api).

- **Методы:** `GET` или `POST`.
- **Токен:** токен доступа, в том числе токен `login`, называющий приложение.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Ответ, сокращённо:

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
| `user` | Имя пользователя Hive, которому принадлежит токен. `_id` и `name` повторяют его. |
| `account` | Аккаунт целиком, в том виде, в каком его возвращает `condenser_api.get_accounts` в Hive. |
| `scope` | Что разрешает токен: `["login"]` для токена входа, иначе операции, которые принимает `/api/broadcast`. |
| `user_metadata` | Метаданные профиля аккаунта, прочитанные из JSON. |

`/api/me` не называет приложение, для которого создан токен. Чтобы это проверить, раскодируйте токен: смотрите [Спросите API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Подписывает постинг-операции человека из токена постинг-ключом @hivesigner и отправляет их в сеть Hive.

- **Метод:** `POST`.
- **Токен:** токен доступа `posting`, из потока с токеном или из потока с кодом.
- **Чтобы это работало:** человек дал постинг-полномочия аккаунту вашего приложения (это делает экран согласия), а аккаунт вашего приложения [дал постинг-полномочия @hivesigner](/docs/register-app#grant-hivesigner).
- **Тело:** `{ "operations": [...] }`, где каждая операция — это `[name, fields]`, как в блокчейне Hive. Все операции одного запроса попадают в одну транзакцию.

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

Тот же запрос через curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Подписка — это операция `custom_json`:

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

API отвечает, как только узел Hive принял транзакцию. `result.id` — это идентификатор транзакции:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Когда сеть отклоняет транзакцию, ответом будет `500` с `server_error`. Его `error_description` несёт сообщение сети, а `response` — необработанную ошибку.

### Что принимает broadcast {#broadcast-rules}

Постинг-токен позволяет API отправлять эти операции и никакие другие. В каждой из них человек из токена должен быть аккаунтом в указанном поле:

| Операция | Человек из токена должен быть |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | Первым аккаунтом в `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Любая другая операция** отклоняется с `invalid_scope`. Токен `login` не разрешает ни одной операции.
- **Операция за другой аккаунт** отклоняется с `unauthorized_client`. Токен отправляет операции только за своего человека.
- **`account_update2`** может менять лишь метаданные аккаунта. Операция с полем `owner`, `active` или `posting` отклоняется с `unauthorized_client`.
- **`custom_json`**: оставляйте `required_auths` пустым. API подписывает постинг-полномочиями, поэтому операция, которой нужны активные полномочия, не пройдёт в сети.

Переводам и другим кошельковым операциям нужен активный ключ человека. Отправляйте их как [ссылки подписи](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

Обменивает код на токены или токен обновления на новые токены. Вызывайте это только со своего сервера. Смотрите [Поток с кодом](/docs/oauth2#code-flow).

- **Метод:** `POST`, значения в теле.
- **Тело:** `code` и `client_secret` либо `refresh_token` и `client_secret`.
- **Заголовки:** не отправляйте заголовок `Authorization`.

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

Каждый вызов возвращает новый токен доступа и новый токен обновления. Оба подписаны @hivesigner. `expires_in` — это срок жизни токена доступа в секундах (7 дней).

Ошибки: `401 invalid_grant`. Описание будет «The token has invalid role», когда присланное значение не является действительным кодом или токеном обновления. Оно будет «The code or secret is not valid», когда код или секрет не совпадают.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Сообщает Hivesigner, что человек вышел из вашего приложения. Токен ваше приложение выбрасывает само.

- **Метод:** `POST`.
- **Токен:** токен доступа, в заголовке `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

Метод `revokeToken()` из SDK для JavaScript выполняет этот вызов, а затем забывает токен. Чтобы навсегда убрать доступ вашего приложения, человек убирает его на https://hivesigner.com/authorized-apps. Смотрите [Выход и отзыв доступа](/docs/tokens#sign-out).

## GET /api/apps {#apps}

Открытый каталог приложений: приложения, которые отправляют операции через Hivesigner, упорядоченные по числу пользователей. Токен не нужен. https://hivesigner.com/apps показывает тот же список.

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
| `updated_at` | Когда каталог строился в последний раз. |
| `building` | `true`, пока в первой сборке нет данных. `apps` тогда пуст. |
| `window_days` | Сколько дней охватывает рейтинг. |
| `featured` | Имена пользователей, показываемые первыми, в этом порядке. |
| `apps[].username` | Аккаунт приложения. |
| `apps[].name`, `about` | Из профиля аккаунта приложения или `null`. |
| `apps[].website` | Сайт из профиля, если он отвечает на собственном домене. Иначе `null`. |
| `apps[].site` | Результат проверки сайта: `ok`, `no_website`, `invalid`, `redirected`, `blocked` или `unreachable`. У записи `redirected` есть ещё `redirects_to`. |
| `apps[].users` | Разные пользователи за день, просуммированные за период. |
| `apps[].requests` | Успешные запросы к API, сделанные для приложения за период. |
| `apps[].first_seen`, `last_seen` | Первый день, когда Hivesigner записал приложение, и последний день его использования, или `null`. |
| `apps[].new` | `true`, когда приложение впервые появилось внутри периода. |

Ответ может храниться в кеше до 5 минут. Пока каталог не собран впервые, API отвечает `503` с `unavailable`. Попробуйте позже.

Названия и описания публикует каждый аккаунт приложения сам. Hivesigner ни одно из них не проверяет.
