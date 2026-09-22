Токен Hivesigner це коротке підписане твердження. У ньому названо обліковий запис Hive, застосунок, для якого його створено, і час підписання. Ваш сервер може перевірити токен через API або самостійно. Ця сторінка показує, що містить токен, як довго він діє і обидва способи перевірки.

## Який вигляд має токен {#format}

Токен це об’єкт JSON, закодований у base64url, з однією відмінністю від стандартного base64url: для доповнення використовується `.` замість `=`. Тобто порівняно зі звичайним base64 `+` стає `-`, `/` стає `_`, а `=` стає `.`. Кожен токен починається з `eyJzaWduZWRfbWVzc2FnZSI6`.

У розкодованому вигляді токен доступу з потоку з токеном має такий вигляд:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Поле | Що означає |
| --- | --- |
| `signed_message.type` | Що це за токен: `login`, `posting`, `code` або `refresh`. Див. [Види токенів](#kinds). |
| `signed_message.app` | Обліковий запис застосунку, для якого створено токен. Токен входу для сайту без облікового запису застосунку його не має. |
| `authors[0]` | Обліковий запис Hive, якому належить токен. |
| `timestamp` | Коли його підписано, у секундах від 1970-01-01 UTC. |
| `signatures[0]` | Підпис, у вигляді шістнадцяткового рядка. |
| `authority` | Лише в токенах, підписаних у браузері: яким із ключів користувача його підписано, `posting` чи `active`. Це поле лежить поза підписаними даними. Щоб дізнатися, який ключ підписав, відновіть його з підпису. |

Підпис це підпис secp256k1 над хешем sha256 значення `JSON.stringify({ signed_message, authors, timestamp })`, де ключі йдуть саме в такому порядку.

### Розкодуйте токен {#decode}

У Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

У браузері:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Розкодувати не означає перевірити. Будь-хто може скласти рядок, що розкодовується в таку форму. [Перевірте токен](#check-a-token), перш ніж йому довіряти.

## Види токенів {#kinds}

| Токен | `type` | `app` | Ким підписано | Де ви його отримуєте |
| --- | --- | --- | --- | --- |
| Токен доступу, потік з токеном | `posting` | Ваш застосунок | Ключем публікації користувача або його активним ключем, якщо Hivesigner не має ключа публікації для цього облікового запису | `access_token` на вашій адресі зворотного виклику |
| Токен входу, `scope=login` | `login` | Ваш застосунок | Ключем публікації або активним ключем користувача | `access_token` на вашій адресі зворотного виклику |
| Токен входу, сайт без облікового запису застосунку | `login` | Немає | Ключем публікації або активним ключем користувача | `access_token` на вашій адресі зворотного виклику |
| Код | `code` | Ваш застосунок | Ключем публікації або активним ключем користувача | `code` на вашій адресі зворотного виклику |
| Токен доступу, потік з кодом | `posting` | Ваш застосунок | Ключем публікації @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Токен оновлення | `refresh` | Ваш застосунок | Ключем публікації @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Код і токен оновлення не є токенами доступу. Ніколи не приймайте жоден із них як вхід.

## Як довго діє токен {#lifetime}

Токен доступу діє 7 днів: `expires_in` це 604800 секунд, відлічених від його `timestamp`. Коли він спливає:

- **Потік з токеном:** надішліть користувача увійти знову. Користувач, який уже авторизував ваш застосунок, бачить «Вхід до APP», і йому потрібен один клік.
- **Потік з кодом:** ваш сервер отримує новий токен доступу за допомогою токена оновлення й вашого секрета клієнта. Див. [Оновлення](/docs/oauth2#refresh).

Вважайте токен простроченим, щойно його `timestamp` старший за 7 днів. Для всього, що ви перевіряєте одразу після перенаправлення, приймайте значно менший вік. Обмінюйте код негайно. Токен входу приймайте лише протягом кількох хвилин від його `timestamp`.

## Перевірте токен на своєму сервері {#check-a-token}

Перш ніж ваш сервер довірить токену, надісланому браузером чи застосунком, перевірте, що:

- його справді підписав обліковий запис або @hivesigner;
- його створено для вашого застосунку;
- це той вид токена, на який ви чекаєте;
- він достатньо свіжий.

### Запитайте API {#check-with-the-api}

Викличте `/api/me` з токеном. Дійсний токен повертає обліковий запис у полі `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Недійсний токен повертає `401` з `invalid_grant`. Див. [GET /api/me](/docs/api#me).

`/api/me` підтверджує підпис. Його відповідь не називає застосунок, для якого створено токен. Тому також розкодуйте токен і перевірте його `app`, `type` і вік самостійно. Токен, створений для іншого застосунку, не повинен виконувати вхід у ваш.

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

API приймає лише токени, у яких названо застосунок. Токен входу із сайту без облікового запису застосунку перевіряйте [самостійно](#check-it-yourself).

### Перевірте самостійно {#check-it-yourself}

1. Розкодуйте токен.
2. Перевірте, що `signed_message.type` це той вид, на який ви чекаєте: `posting` для токена доступу, `login` для токена входу.
3. Перевірте, що `signed_message.app` це обліковий запис вашого застосунку. Для сайту без облікового запису застосунку перевірте, що його немає взагалі.
4. Перевірте вік за `timestamp`.
5. Обчисліть хеш sha256 значення `JSON.stringify({ signed_message, authors, timestamp })`.
6. Відновіть відкритий ключ із `signatures[0]` і цього хешу.
7. Прочитайте обліковий запис `authors[0]` із блокчейну Hive саме зараз, бо користувачі можуть змінювати свої ключі. Відновлений ключ має бути одним із його поточних ключів публікації або активних ключів. Токен із `/api/oauth2/token` натомість підписує @hivesigner: для таких приймайте поточний ключ публікації облікового запису @hivesigner.

У Node.js із [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), який експортує `PrivateKey`, `PublicKey`, `Signature` і `callRPC` під `@ecency/sdk/hive`:

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

Використовуйте це так:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

Бібліотека dhive (`@hiveio/dhive`) теж підходить: обчисліть хеш через `cryptoUtils.sha256(message)` і відновіть ключ через `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Тримайте токени в безпеці {#keep-tokens-safe}

Будь-хто, хто має токен публікації, може надсилати транзакції від імені користувача через ваш застосунок, доки той не спливе. Ставтеся до нього як до пароля.

- **Тримайте токени на своєму сервері** або в куки з httpOnly і Secure. Токени оновлення й секрет клієнта тримайте лише на сервері.
- **Ніколи не кладіть токен в URL-адресу, яку ви записуєте в журнали.** Потік з токеном передає токен у рядку запиту вашої адреси зворотного виклику. Прочитайте його на своєму сервері, а потім перенаправте на адресу без нього. Не записуйте рядок запиту адреси зворотного виклику в журнали.
- **Нічого не завантажуйте з інших сайтів на сторінці зворотного виклику**, щоб адреса з токеном їм не надсилалася. Заголовок `Referrer-Policy: no-referrer` на цій сторінці допомагає.
- **Надсилайте токен лише на власний сервер і на `https://hivesigner.com/api/`.**

## Вихід і прибирання доступу {#sign-out}

- **Вийти за користувача** означає відкинути токен: видаліть його зі своєї сесії або куки. Ви також можете викликати [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke), щоб повідомити Hivesigner, що користувач вийшов. Ваш застосунок усе одно відкидає токен сам.
- **Назавжди відрізати ваш застосунок** це вибір користувача. На https://hivesigner.com/authorized-apps або за адресою `https://hivesigner.com/revoke/APP` він прибирає обліковий запис вашого застосунку зі своїх повноважень публікації в блокчейні. Після цього API більше не надсилає транзакції за нього через ваш застосунок.
