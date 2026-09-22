Офіційний JavaScript SDK будує адреси входу й посилання для підпису та викликає API Hivesigner за вас. Для Python є бібліотеки спільноти. Будь-яка інша мова може звертатися до [REST API](/docs/api) напряму.

## JavaScript SDK {#javascript}

SDK це пакет npm `hivesigner`. Його вихідний код лежить на https://github.com/ecency/hivesigner-sdk. Він написаний на TypeScript і постачається зі своїми типами.

Версія 4 потребує Node.js 18 або новішого, бо використовує вбудований `fetch`. У браузерах їй потрібен ES2017 або новіший. Там, де глобального `fetch` немає, додайте поліфіл перед використанням SDK. На старішому Node.js лишайтеся на версії 3.

### Встановлення {#install}

```bash
npm install hivesigner
```

Для сторінки без кроку збірки завантажте браузерний бандл. Він визначає глобальну змінну `hivesigner`:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Створіть клієнта {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Опція | Що означає |
| --- | --- |
| `app` | Обліковий запис вашого застосунку, надсилається як `client_id`. |
| `callbackURL` | Куди Hivesigner повертає користувача. Має збігатися з однією з адрес зворотного виклику вашого застосунку символ у символ (петльова адреса зі звичайним http може відрізнятися хостом і портом, див. [Адреси зворотного виклику](/docs/register-app#callback-rules)). |
| `scope` | Перелік, з’єднаний комами в параметр `scope`. Див. [Рівні доступу](/docs/oauth2#scopes). |
| `responseType` | `'code'` для потоку з кодом. Для потоку з токеном не задавайте. |
| `accessToken` | Токен доступу користувача, коли він у вас уже є. |
| `apiURL` | Походження API. SDK додає до нього `/api/`. Типове значення це `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` і `setApiURL` змінюють клієнта пізніше. Кожен із них повертає клієнта.

### Виконайте вхід користувача {#sign-in}

`getLoginURL(state, account)` повертає адресу входу:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` повертається на вашу адресу зворотного виклику без змін. Використовуйте його, щоб прив’язати відповідь до запиту.
- `account` необов’язковий: ім’я користувача. Hivesigner вибирає цей обліковий запис, коли він є на пристрої, і ігнорує його інакше.

У браузері `client.login({ state: 'STATE' })` надсилає користувача на ту саму адресу, без облікового запису.

У потоці з токеном ваша адреса зворотного виклику отримує `access_token`, `expires_in` і `username`. Передайте токен клієнтові:

```js
client.setAccessToken('ACCESS_TOKEN');
```

SDK не має методу для обміну в потоці з кодом. Ваш сервер надсилає код і секрет клієнта до API сам, як показано в [Обміняйте код](/docs/oauth2#exchange-code).

### Отримайте користувача {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` це обліковий запис Hive користувача в тому вигляді, у якому його повертає блокчейн. `scope` перелічує те, що дозволяє токен.

### Надсилайте транзакції {#broadcast}

`broadcast(operations)` надсилає операції до API, який надсилає їх у мережу за користувача. API приймає лише операції публікації, автором яких є користувач токена: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` з повноваженнями публікації, `claim_reward_balance` і `account_update2` для метаданих профілю. Див. [Що приймає broadcast](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Називайте користувача в кожній операції. API не підставляє `__signer`.

Ці помічники будують по одній операції й викликають `broadcast`:

| Метод | Що надсилає |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` іде від `-10000` до `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Для нового допису `parentAuthor` це `''`. `jsonMetadata` може бути об’єктом: SDK перетворює його на рядок. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Передавайте `[]` як `requiredAuths` і `['USERNAME']` як `requiredPostingAuths`. `json` це рядок. |
| `reblog(account, author, permlink)` | `custom_json` з id `follow`, який робить репост допису |
| `follow(follower, following)` | `custom_json` з id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` з id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` з id `follow`, `what: ['ignore']` (приглушення) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Суми це рядки на кшталт `'0.000 HIVE'`, `'0.000 HBD'` і `'1.000000 VESTS'`. |

`updateUserMetadata()` застарів. Щоб змінити профіль користувача, надішліть `account_update2` з новим `posting_json_metadata`.

### Вихід {#log-out}

`revokeToken()` це виклик виходу в SDK. Він надсилає токен на кінцеву точку відкликання в API, а потім прибирає його з клієнта. Коли виклик відхилено, викличте `removeAccessToken()` самі. Також видаліть токен звідусіль, де його зберіг ваш застосунок.

Щоб назавжди припинити доступ вашого застосунку, користувач прибирає його на https://hivesigner.com/authorized-apps. Див. [Перегляд і прибирання доступу застосунку](/docs/signing-in#remove-access).

### Посилання для підпису {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` і `sendTransaction(tx, params)` повертають посилання `https://hivesigner.com/sign/...`. `params` приймає `callback`, `no_broadcast` і `signer`. Див. [Посилання для підпису](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

У TypeScript типи вимагають третього аргументу: передайте `undefined`, щоб отримати посилання назад.

У браузері передайте третім аргументом функцію, щоб посилання натомість відкрилося в новій вкладці. Функцію не викликають, і нічого не повертається. Викликайте це з обробника кліку, інакше браузер може заблокувати нову вкладку, і виклик видасть помилку.

### Проміси й зворотні виклики {#promises-and-callbacks}

`me`, `broadcast`, помічники й `revokeToken` повертають проміс. Щоб натомість скористатися зворотним викликом, передайте функцію останнім аргументом. Вона отримує `(error, result)`.

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

Коли API відповідає помилкою, проміс відхиляється з тілом помилки API, `{ error, error_description }`. Зі зворотним викликом це тіло є аргументом `error`. Коли відповідь не є JSON, проміс відхиляється з помилкою розбору.

## Python {#python}

Ці бібліотеки походять від спільноти. Їх підтримують їхні автори, а не команда Hivesigner. Звірте їх із [REST API](/docs/api), перш ніж на них покладатися.

| Бібліотека | Автор |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, модуль `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
