Официальный SDK для JavaScript собирает адреса входа и ссылки подписи и вызывает API Hivesigner за вас. Для Python есть библиотеки сообщества. Любой другой язык может обращаться к [REST API](/docs/api) напрямую.

## SDK для JavaScript {#javascript}

SDK — это пакет npm `hivesigner`. Его исходный код находится на https://github.com/ecency/hivesigner-sdk. Он написан на TypeScript и поставляется со своими типами.

Версии 4 нужен Node.js 18 или новее, потому что она использует встроенный `fetch`. В браузерах ей нужен ES2017 или новее. Там, где глобального `fetch` нет, добавьте полифил перед использованием SDK. На более старом Node.js оставайтесь на версии 3.

### Установка {#install}

```bash
npm install hivesigner
```

Для страницы без шага сборки загрузите браузерную сборку. Она определяет глобальный `hivesigner`:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Создайте клиент {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Настройка | Значение |
| --- | --- |
| `app` | Аккаунт вашего приложения, отправляется как `client_id`. |
| `callbackURL` | Куда Hivesigner вернёт человека. Должен быть одним из адресов возврата вашего приложения, символ в символ (петлевой адрес на обычном http может отличаться хостом и портом, смотрите [Адреса возврата](/docs/register-app#callback-rules)). |
| `scope` | Список, соединяемый запятыми в параметр `scope`. Смотрите [Области доступа](/docs/oauth2#scopes). |
| `responseType` | `'code'` для потока с кодом. Для потока с токеном не указывайте. |
| `accessToken` | Токен доступа человека, если он у вас уже есть. |
| `apiURL` | Источник API. SDK добавляет к нему `/api/`. По умолчанию `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` и `setApiURL` меняют клиент позже. Каждый из них возвращает клиент.

### Выполните вход человека {#sign-in}

`getLoginURL(state, account)` возвращает адрес входа:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` возвращается на ваш адрес возврата без изменений. Используйте его, чтобы связать ответ с запросом.
- `account` необязателен: это имя пользователя. Hivesigner выбирает этот аккаунт, если он есть на устройстве, и не учитывает его в противном случае.

В браузере `client.login({ state: 'STATE' })` отправляет человека по тому же адресу, без аккаунта.

В потоке с токеном ваш адрес возврата получает `access_token`, `expires_in` и `username`. Передайте токен клиенту:

```js
client.setAccessToken('ACCESS_TOKEN');
```

Метода для обмена в потоке с кодом в SDK нет. Ваш сервер сам отправляет код и секрет клиента в API, как показано в [Обменяйте код](/docs/oauth2#exchange-code).

### Получите человека {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` — это аккаунт Hive человека в том виде, в каком его возвращает сеть. `scope` перечисляет, что разрешает токен.

### Отправка операций {#broadcast}

`broadcast(operations)` отправляет операции в API, а тот отправляет их в сеть за человека. API принимает только постинг-операции, автором которых является человек из токена: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` с постинг-полномочиями, `claim_reward_balance` и `account_update2` для метаданных профиля. Смотрите [Что принимает broadcast](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Называйте человека в каждой операции. API не подставляет `__signer`.

Эти вспомогательные методы собирают по одной операции и вызывают `broadcast`:

| Метод | Что отправляет |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` идёт от `-10000` до `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Для новой записи `parentAuthor` равен `''`. `jsonMetadata` может быть объектом: SDK превратит его в строку. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Передавайте `[]` как `requiredAuths` и `['USERNAME']` как `requiredPostingAuths`. `json` — это строка. |
| `reblog(account, author, permlink)` | `custom_json` с id `follow`, который делится записью заново |
| `follow(follower, following)` | `custom_json` с id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` с id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` с id `follow`, `what: ['ignore']` (скрыть) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Суммы — это строки вида `'0.000 HIVE'`, `'0.000 HBD'` и `'1.000000 VESTS'`. |

`updateUserMetadata()` устарел. Чтобы изменить профиль человека, отправьте `account_update2` с новым `posting_json_metadata`.

### Выход {#log-out}

`revokeToken()` — это вызов выхода в SDK. Он отправляет токен на адрес отзыва в API, а затем убирает его из клиента. Если вызов не удался, вызовите `removeAccessToken()` сами. Удалите токен и оттуда, где ваше приложение его сохранило.

Чтобы навсегда прекратить доступ вашего приложения, человек убирает его на https://hivesigner.com/authorized-apps. Смотрите [Посмотреть и убрать доступ приложения](/docs/signing-in#remove-access).

### Ссылки подписи {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` и `sendTransaction(tx, params)` возвращают ссылку `https://hivesigner.com/sign/...`. `params` принимает `callback`, `no_broadcast` и `signer`. Смотрите [Ссылки подписи](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

В TypeScript типы требуют третий аргумент: передайте `undefined`, чтобы получить ссылку.

В браузере передайте функцию третьим аргументом, чтобы открыть ссылку в новой вкладке. Эта функция не вызывается, и ничего не возвращается. Вызывайте её из обработчика щелчка, иначе браузер может заблокировать новую вкладку, и вызов выдаст ошибку.

### Промисы и обратные вызовы {#promises-and-callbacks}

`me`, `broadcast`, вспомогательные методы и `revokeToken` возвращают промис. Передайте функцию последним аргументом, чтобы вместо этого использовать обратный вызов. Он получает `(error, result)`.

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

Когда API отвечает ошибкой, промис отклоняется с телом ошибки API, `{ error, error_description }`. При обратном вызове это тело и будет аргументом `error`. Когда ответ не в формате JSON, отклонение несёт ошибку разбора.

## Python {#python}

Эти библиотеки пришли от сообщества. Их сопровождают их авторы, а не команда Hivesigner. Сверьте их с [REST API](/docs/api), прежде чем на них полагаться.

| Библиотека | Автор |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, модуль `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
