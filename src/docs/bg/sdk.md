Официалният JavaScript SDK съставя адреси за вход и връзки за подпис и извиква API на Hivesigner вместо вас. За Python съществуват библиотеки от общността. Всеки друг език може да извиква [REST API](/docs/api) директно.

## JavaScript SDK {#javascript}

SDK е npm пакетът `hivesigner`. Изходният му код е на https://github.com/ecency/hivesigner-sdk. Написан е на TypeScript и носи своите типове.

Версия 4 изисква Node.js 18 или по-нов, защото използва вградения `fetch`. В браузъри изисква ES2017 или по-нов. Където няма глобален `fetch`, добавете polyfill, преди да използвате SDK. На по-стар Node.js останете на версия 3.

### Инсталиране {#install}

```bash
npm install hivesigner
```

За страница без стъпка на компилация заредете браузърния пакет. Той дефинира глобален `hivesigner`:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Създайте клиент {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Опция | Значение |
| --- | --- |
| `app` | Акаунтът на вашето приложение, изпращан като `client_id`. |
| `callbackURL` | Къде Hivesigner връща потребителя. Трябва да е един от адресите за обратно извикване на приложението ви, символ по символ (локален адрес с обикновен http може да се различава по хост и порт, вижте [Адреси за обратно извикване](/docs/register-app#callback-rules)). |
| `scope` | Списък, съединен със запетаи в параметъра `scope`. Вижте [Обхвати](/docs/oauth2#scopes). |
| `responseType` | `'code'` за потока с код. Пропуснете го за потока с токен. |
| `accessToken` | Токенът за достъп на потребителя, когато вече имате такъв. |
| `apiURL` | Произходът на API. SDK добавя `/api/` към него. По подразбиране е `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` и `setApiURL` променят клиента по-късно. Всяка от тях връща клиента.

### Впишете потребителя {#sign-in}

`getLoginURL(state, account)` връща адреса за вход:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` се връща към вашия адрес за обратно извикване непроменен. Използвайте го, за да свържете отговора със заявката.
- `account` е незадължителен: потребителско име. Hivesigner избира този акаунт, когато е на устройството, и го пренебрегва иначе.

В браузър `client.login({ state: 'STATE' })` изпраща потребителя към същия адрес, без акаунт.

В потока с токен вашият адрес получава `access_token`, `expires_in` и `username`. Дайте токена на клиента:

```js
client.setAccessToken('ACCESS_TOKEN');
```

SDK няма метод за размяната в потока с код. Вашият сървър сам изпраща кода и клиентската тайна към API, както показва [Разменете кода](/docs/oauth2#exchange-code).

### Вземете потребителя {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` е Hive акаунтът на потребителя, както го връща блокчейнът. `scope` изброява какво позволява токенът.

### Излъчване {#broadcast}

`broadcast(operations)` изпраща операции към API, който ги излъчва от името на потребителя. API приема само posting операции, чийто автор е потребителят на токена: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` с posting правомощия, `claim_reward_balance` и `account_update2` за метаданните на профила. Вижте [Какво приема broadcast](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Назовавайте потребителя във всяка операция. API не замества `__signer`.

Тези помощни функции съставят по една операция и извикват `broadcast`:

| Метод | Излъчва |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` върви от `-10000` до `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. За нова публикация `parentAuthor` е `''`. `jsonMetadata` може да е обект: SDK го превръща в низ. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Подайте `[]` като `requiredAuths` и `['USERNAME']` като `requiredPostingAuths`. `json` е низ. |
| `reblog(account, author, permlink)` | `custom_json` с id `follow`, което препубликува публикацията |
| `follow(follower, following)` | `custom_json` с id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` с id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` с id `follow`, `what: ['ignore']` (заглушаване) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Сумите са низове като `'0.000 HIVE'`, `'0.000 HBD'` и `'1.000000 VESTS'`. |

`updateUserMetadata()` е остаряла. За да промените профила на потребител, излъчете `account_update2` с нов `posting_json_metadata`.

### Изход {#log-out}

`revokeToken()` е извикването за изход в SDK. То изпраща токена към крайната точка за отмяна на API и след това го премахва от клиента. Когато извикването бъде отхвърлено, извикайте `removeAccessToken()` сами. Изтрийте токена и там, където приложението ви го е съхранило.

За да прекратите достъпа на приложението си завинаги, потребителят го премахва на https://hivesigner.com/authorized-apps. Вижте [Вижте и премахнете достъпа на приложение](/docs/signing-in#remove-access).

### Връзки за подпис {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` и `sendTransaction(tx, params)` връщат връзка `https://hivesigner.com/sign/...`. `params` приема `callback`, `no_broadcast` и `signer`. Вижте [Връзки за подпис](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

В TypeScript типовете изискват третия аргумент: подайте `undefined`, за да получите връзката.

В браузър подайте функция като трети аргумент, за да отворите връзката в нов раздел. Функцията не се извиква и нищо не се връща. Извиквайте я от обработчик на кликване, иначе браузърът може да блокира новия раздел и извикването да хвърли грешка.

### Обещания и функции за обратно извикване {#promises-and-callbacks}

`me`, `broadcast`, помощните функции и `revokeToken` връщат обещание. Подайте функция като последен аргумент, за да използвате функция за обратно извикване вместо това. Тя получава `(error, result)`.

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

Когато API отговори с грешка, обещанието се отхвърля с тялото на грешката от API, `{ error, error_description }`. С функция за обратно извикване това тяло е аргументът `error`. Когато отговорът не е JSON, отхвърлянето е с грешката при разчитането.

## Python {#python}

Тези библиотеки идват от общността. Поддържат ги техните автори, не екипът на Hivesigner. Проверете ги спрямо [REST API](/docs/api), преди да разчитате на тях.

| Библиотека | Автор |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, модул `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
