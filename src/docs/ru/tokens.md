Токен Hivesigner — это короткое подписанное утверждение. В нём названы аккаунт Hive, приложение, для которого он создан, и время подписи. Ваш сервер может проверить токен через API или самостоятельно. На этой странице показано, что содержит токен, сколько он действует и оба способа проверки.

## Как выглядит токен {#format}

Токен — это объект JSON, закодированный в base64url, с одним отличием от обычного base64url: для заполнения используется `.` вместо `=`. То есть по сравнению с обычным base64 `+` становится `-`, `/` становится `_`, а `=` становится `.`. Любой токен начинается с `eyJzaWduZWRfbWVzc2FnZSI6`.

После раскодирования токен доступа из потока с токеном выглядит так:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Поле | Значение |
| --- | --- |
| `signed_message.type` | Что это за токен: `login`, `posting`, `code` или `refresh`. Смотрите [Виды токенов](#kinds). |
| `signed_message.app` | Аккаунт приложения, для которого создан токен. У токена входа с сайта без аккаунта приложения его нет. |
| `authors[0]` | Аккаунт Hive, которому принадлежит токен. |
| `timestamp` | Когда он подписан, в секундах с 1970-01-01 UTC. |
| `signatures[0]` | Подпись в виде шестнадцатеричной строки. |
| `authority` | Только в токенах, подписанных в браузере: каким ключом человека сделана подпись, `posting` или `active`. Это поле находится вне подписанных данных. Чтобы узнать, какой ключ подписал, восстановите его из подписи. |

Подпись — это подпись secp256k1 по хешу sha256 от `JSON.stringify({ signed_message, authors, timestamp })`, с ключами именно в таком порядке.

### Раскодируйте токен {#decode}

В Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

В браузере:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Раскодирование — это не проверка. Любой может составить строку, которая раскодируется в такой вид. [Проверьте токен](#check-a-token), прежде чем ему доверять.

## Виды токенов {#kinds}

| Токен | `type` | `app` | Кем подписан | Откуда вы его получаете |
| --- | --- | --- | --- | --- |
| Токен доступа, поток с токеном | `posting` | Ваше приложение | Постинг-ключом человека или его активным ключом, когда у Hivesigner нет постинг-ключа для этого аккаунта | `access_token` на вашем адресе возврата |
| Токен входа, `scope=login` | `login` | Ваше приложение | Постинг- или активным ключом человека | `access_token` на вашем адресе возврата |
| Токен входа, сайт без аккаунта приложения | `login` | Нет | Постинг- или активным ключом человека | `access_token` на вашем адресе возврата |
| Код | `code` | Ваше приложение | Постинг- или активным ключом человека | `code` на вашем адресе возврата |
| Токен доступа, поток с кодом | `posting` | Ваше приложение | Постинг-ключом @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Токен обновления | `refresh` | Ваше приложение | Постинг-ключом @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Код и токен обновления не являются токенами доступа. Никогда не принимайте их как вход.

## Сколько действует токен {#lifetime}

Токен доступа действует 7 дней: `expires_in` равен 604800 секундам, отсчёт идёт от его `timestamp`. Когда срок истёк:

- **Поток с токеном:** отправьте человека войти ещё раз. Тот, кто уже авторизовал ваше приложение, видит «Вход в APP», и ему хватит одного щелчка.
- **Поток с кодом:** ваш сервер получает новый токен доступа с помощью токена обновления и вашего секрета клиента. Смотрите [Обновление](/docs/oauth2#refresh).

Считайте токен истёкшим, как только его `timestamp` старше 7 дней. Для всего, что вы проверяете сразу после перенаправления, принимайте гораздо меньший возраст. Код обменивайте сразу. Токен входа принимайте только в пределах нескольких минут от его `timestamp`.

## Проверьте токен на своём сервере {#check-a-token}

Прежде чем ваш сервер доверится токену, присланному браузером или приложением, проверьте, что:

- его действительно подписал аккаунт или @hivesigner;
- он создан для вашего приложения;
- это тот вид токена, которого вы ждёте;
- он достаточно свежий.

### Спросите API {#check-with-the-api}

Вызовите `/api/me` с этим токеном. Действительный токен возвращает аккаунт в `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Недействительный токен возвращает `401` с `invalid_grant`. Смотрите [GET /api/me](/docs/api#me).

`/api/me` подтверждает подпись. Но его ответ не называет приложение, для которого создан токен. Поэтому раскодируйте токен и сами проверьте его `app`, `type` и возраст. Токен, созданный для другого приложения, не должен выполнять вход в ваше.

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

API принимает только токены, называющие приложение. Токен входа с сайта без аккаунта приложения проверяйте [сами](#check-it-yourself).

### Проверьте сами {#check-it-yourself}

1. Раскодируйте токен.
2. Проверьте, что `signed_message.type` — тот вид, которого вы ждёте: `posting` для токена доступа, `login` для токена входа.
3. Проверьте, что `signed_message.app` — аккаунт вашего приложения. Для сайта без аккаунта приложения проверьте, что его вообще нет.
4. Проверьте возраст по `timestamp`.
5. Вычислите хеш sha256 от `JSON.stringify({ signed_message, authors, timestamp })`.
6. Восстановите открытый ключ из `signatures[0]` и этого хеша.
7. Прочитайте аккаунт `authors[0]` из блокчейна Hive прямо сейчас, потому что люди могут менять ключи. Восстановленный ключ должен быть одним из его нынешних постинг- или активных ключей. Токен из `/api/oauth2/token` подписывает @hivesigner: для таких принимайте нынешний постинг-ключ аккаунта @hivesigner.

В Node.js с [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), который даёт `PrivateKey`, `PublicKey`, `Signature` и `callRPC` в `@ecency/sdk/hive`:

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

Используйте так:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

Библиотека dhive (`@hiveio/dhive`) тоже подходит: хеш считайте через `cryptoUtils.sha256(message)`, а ключ восстанавливайте через `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Храните токены безопасно {#keep-tokens-safe}

Любой, у кого есть постинг-токен, может до истечения срока отправлять операции от имени человека через ваше приложение. Обращайтесь с ним как с паролем.

- **Держите токены на своём сервере** или в cookie с httpOnly и Secure. Токены обновления и секрет клиента держите только на сервере.
- **Никогда не помещайте токен в адрес, который вы записываете в журнал.** Поток с токеном доставляет токен в строке запроса вашего адреса возврата. Прочитайте его на сервере, а затем перенаправьте на адрес без него. Строку запроса адреса возврата держите вне журналов.
- **Не загружайте ничего с других сайтов на странице своего адреса возврата,** чтобы адрес с токеном к ним не ушёл. Заголовок `Referrer-Policy: no-referrer` на этой странице помогает.
- **Отправляйте токен только на свой сервер и на `https://hivesigner.com/api/`.**

## Выход и отзыв доступа {#sign-out}

- **Выйти за человека** означает выбросить токен: удалите его из своей сессии или cookie. Можно также вызвать [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke), чтобы сообщить Hivesigner о выходе. Ваше приложение в любом случае выбрасывает токен само.
- **Навсегда закрыть доступ вашему приложению** — решение человека. На https://hivesigner.com/authorized-apps или на `https://hivesigner.com/revoke/APP` он убирает аккаунт вашего приложения из своих постинг-полномочий в блокчейне. После этого API больше не отправляет операции за него через ваше приложение.
