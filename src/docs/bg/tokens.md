Токенът на Hivesigner е кратко подписано твърдение. То назовава Hive акаунт, приложението, за което е създадено, и времето на подписване. Вашият сървър може да провери токен през API или сам. Тази страница показва какво съдържа токенът, колко дълго е валиден и двата начина за проверка.

## Как изглежда токенът {#format}

Токенът е JSON обект, кодиран в base64url, с една разлика от стандартния base64url: за допълване се използва `.` вместо `=`. Спрямо обикновения base64 `+` става `-`, `/` става `_`, а `=` става `.`. Всеки токен започва с `eyJzaWduZWRfbWVzc2FnZSI6`.

Декодиран, токен за достъп от потока с токен изглежда така:

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
| `signed_message.type` | Какъв е токенът: `login`, `posting`, `code` или `refresh`. Вижте [Видове токени](#kinds). |
| `signed_message.app` | Акаунтът на приложението, за което е създаден токенът. Токен за вход от сайт без акаунт за приложение няма такъв. |
| `authors[0]` | Hive акаунтът, за който е токенът. |
| `timestamp` | Кога е подписан, в секунди от 1970-01-01 UTC. |
| `signatures[0]` | Подписът, като шестнадесетичен низ. |
| `authority` | Само в токени, подписани в браузъра: кой от ключовете на потребителя е подписал, `posting` или `active`. Това поле е извън подписаните данни. За да знаете кой ключ е подписал, възстановете го от подписа. |

Подписът е secp256k1 подпис върху sha256 хеша на `JSON.stringify({ signed_message, authors, timestamp })`, с ключовете в този ред.

### Декодиране на токен {#decode}

В Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

В браузър:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Декодирането не е проверка. Всеки може да състави низ, който се декодира до този вид. [Проверете токена](#check-a-token), преди да му се доверите.

## Видове токени {#kinds}

| Токен | `type` | `app` | Подписан от | Откъде го получавате |
| --- | --- | --- | --- | --- |
| Токен за достъп, поток с токен | `posting` | Вашето приложение | posting ключа на потребителя или неговия active ключ, когато Hivesigner няма posting ключ за акаунта | `access_token` на вашия адрес за обратно извикване |
| Токен за вход, `scope=login` | `login` | Вашето приложение | posting или active ключа на потребителя | `access_token` на вашия адрес за обратно извикване |
| Токен за вход, сайт без акаунт за приложение | `login` | Няма | posting или active ключа на потребителя | `access_token` на вашия адрес за обратно извикване |
| Код | `code` | Вашето приложение | posting или active ключа на потребителя | `code` на вашия адрес за обратно извикване |
| Токен за достъп, поток с код | `posting` | Вашето приложение | posting ключа на @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Токен за обновяване | `refresh` | Вашето приложение | posting ключа на @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Кодът и токенът за обновяване не са токени за достъп. Никога не приемайте нито един от тях като вход.

## Колко дълго е валиден токенът {#lifetime}

Токенът за достъп е валиден 7 дни: `expires_in` е 604800 секунди, броени от неговия `timestamp`. Когато изтече:

- **Поток с токен:** изпратете потребителя да влезе отново. Който вече е упълномощил приложението ви, вижда "Вход в APP" и му трябва едно кликване.
- **Поток с код:** вашият сървър получава нов токен за достъп с токена за обновяване и вашата клиентска тайна. Вижте [Обновяване](/docs/oauth2#refresh).

Смятайте токена за изтекъл веднага щом неговият `timestamp` стане по-стар от 7 дни. Приемайте много по-малка възраст за всичко, което проверявате веднага след пренасочването. Разменяйте кода веднага. Приемайте токен за вход само в рамките на няколко минути от неговия `timestamp`.

## Проверете токена на своя сървър {#check-a-token}

Преди сървърът ви да се довери на токен, изпратен от браузър или приложение, проверете, че:

- акаунтът или @hivesigner наистина го е подписал;
- създаден е за вашето приложение;
- това е видът токен, който очаквате;
- достатъчно скорошен е.

### Попитайте API {#check-with-the-api}

Извикайте `/api/me` с токена. Валиден токен връща акаунта в `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Невалиден токен връща `401` с `invalid_grant`. Вижте [GET /api/me](/docs/api#me).

`/api/me` потвърждава подписа. Отговорът му не назовава приложението, за което е създаден токенът. Затова декодирайте токена и проверете сами неговите `app`, `type` и възраст. Токен, създаден за друго приложение, не бива да вписва никого във вашето.

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

API приема само токени, които назовават приложение. Проверете [сами](#check-it-yourself) токен за вход от сайт без акаунт за приложение.

### Проверете го сами {#check-it-yourself}

1. Декодирайте токена.
2. Проверете, че `signed_message.type` е видът, който очаквате: `posting` за токен за достъп, `login` за токен за вход.
3. Проверете, че `signed_message.app` е акаунтът на вашето приложение. За сайт без акаунт за приложение проверете, че такъв няма.
4. Проверете възрастта от `timestamp`.
5. Изчислете sha256 хеша на `JSON.stringify({ signed_message, authors, timestamp })`.
6. Възстановете публичния ключ от `signatures[0]` и този хеш.
7. Прочетете акаунта `authors[0]` от блокчейна Hive сега, защото потребителите могат да сменят ключовете си. Възстановеният ключ трябва да е един от текущите му posting или active ключове. Токен от `/api/oauth2/token` е подписан от @hivesigner: за такива приемайте текущ posting ключ на акаунта @hivesigner.

В Node.js с [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), който изнася `PrivateKey`, `PublicKey`, `Signature` и `callRPC` под `@ecency/sdk/hive`:

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

Използвайте го така:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

Библиотеката dhive (`@hiveio/dhive`) също върши работа: изчислете хеша с `cryptoUtils.sha256(message)` и възстановете ключа с `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Пазете токените {#keep-tokens-safe}

Всеки, който държи posting токен, може да излъчва като потребителя през вашето приложение, докато токенът не изтече. Отнасяйте се с него като с парола.

- **Дръжте токените на своя сървър** или в httpOnly, Secure бисквитка. Токените за обновяване и клиентската тайна дръжте само на сървъра.
- **Никога не поставяйте токен в URL адрес, който записвате.** Потокът с токен доставя токена в query низа на вашия адрес за обратно извикване. Прочетете го на сървъра и след това пренасочете към URL адрес без него. Оставете query низа на този адрес извън дневниците си.
- **Не зареждайте нищо от други сайтове на страницата на адреса за обратно извикване,** за да не се изпраща към тях адресът с токена. Заглавка `Referrer-Policy: no-referrer` на тази страница помага.
- **Изпращайте токен само към собствения си сървър и към `https://hivesigner.com/api/`.**

## Изход и премахване на достъпа {#sign-out}

- **Изход на потребител** означава да изхвърлите токена: изтрийте го от сесията или бисквитката си. Можете също да извикате [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke), за да кажете на Hivesigner, че потребителят е излязъл. Приложението ви така или иначе изхвърля токена само.
- **Прекратяването на достъпа на приложението ви завинаги** е решение на потребителя. На https://hivesigner.com/authorized-apps или на `https://hivesigner.com/revoke/APP` той премахва акаунта на вашето приложение от своите posting правомощия в блокчейна. След това API вече не излъчва от негово име през вашето приложение.
