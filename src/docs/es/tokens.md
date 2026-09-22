Un token de Hivesigner es una declaración firmada corta. Nombra una cuenta de Hive, la aplicación para la que se creó y el momento en que se firmó. Tu servidor puede comprobar un token con la API o por sí mismo. Esta página muestra qué contiene un token, cuánto dura y las dos formas de comprobarlo.

## Qué aspecto tiene un token {#format}

Un token es un objeto JSON codificado en base64url, con una diferencia respecto al base64url estándar: el relleno usa `.` en lugar de `=`. Así que, comparado con el base64 normal, `+` pasa a ser `-`, `/` pasa a ser `_` y `=` pasa a ser `.`. Todos los tokens empiezan por `eyJzaWduZWRfbWVzc2FnZSI6`.

Decodificado, un token de acceso del flujo de token tiene este aspecto:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Campo | Significado |
| --- | --- |
| `signed_message.type` | Qué es el token: `login`, `posting`, `code` o `refresh`. Consulta [Tipos de token](#kinds). |
| `signed_message.app` | La cuenta de aplicación para la que se creó el token. Un token de inicio de sesión para un sitio sin cuenta de aplicación no tiene ninguna. |
| `authors[0]` | La cuenta de Hive a la que corresponde el token. |
| `timestamp` | Cuándo se firmó, en segundos desde el 1970-01-01 UTC. |
| `signatures[0]` | La firma, como cadena hexadecimal. |
| `authority` | Solo en los tokens firmados en el navegador: cuál de las claves de la persona firmó, `posting` o `active`. Este campo queda fuera de los datos firmados. Para saber qué clave firmó, recupérala de la firma. |

La firma es una firma secp256k1 sobre el hash sha256 de `JSON.stringify({ signed_message, authors, timestamp })`, con las claves en ese orden.

### Decodifica un token {#decode}

En Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

En un navegador:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Decodificar no es comprobar. Cualquiera puede construir una cadena que se decodifique con esta forma. [Comprueba un token](#check-a-token) antes de fiarte de él.

## Tipos de token {#kinds}

| Token | `type` | `app` | Firmado por | Dónde lo obtienes |
| --- | --- | --- | --- | --- |
| Token de acceso, flujo de token | `posting` | Tu aplicación | La clave de publicación de la persona, o su clave activa cuando Hivesigner no tiene ninguna clave de publicación para la cuenta | `access_token` en tu URL de retorno |
| Token de inicio de sesión, `scope=login` | `login` | Tu aplicación | La clave de publicación o activa de la persona | `access_token` en tu URL de retorno |
| Token de inicio de sesión, sitio sin cuenta de aplicación | `login` | Ninguna | La clave de publicación o activa de la persona | `access_token` en tu URL de retorno |
| Código | `code` | Tu aplicación | La clave de publicación o activa de la persona | `code` en tu URL de retorno |
| Token de acceso, flujo de código | `posting` | Tu aplicación | La clave de publicación de @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Token de actualización | `refresh` | Tu aplicación | La clave de publicación de @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Un código y un token de actualización no son tokens de acceso. Nunca aceptes ninguno de los dos como inicio de sesión.

## Cuánto dura un token {#lifetime}

Un token de acceso dura 7 días: `expires_in` es 604800 segundos, contados desde su `timestamp`. Cuando ha caducado:

- **Flujo de token:** envía a la persona a iniciar sesión otra vez. Quien ya autorizó tu aplicación ve "Iniciar sesión en APP" y necesita un clic.
- **Flujo de código:** tu servidor obtiene un token de acceso nuevo con el token de actualización y tu secreto de cliente. Consulta [Actualizar](/docs/oauth2#refresh).

Trata un token como caducado en cuanto su `timestamp` tenga más de 7 días. Acepta una antigüedad mucho menor para cualquier cosa que compruebes justo después de la redirección. Intercambia un código de inmediato. Acepta un token de inicio de sesión solo dentro de unos pocos minutos desde su `timestamp`.

## Comprueba un token en tu servidor {#check-a-token}

Antes de que tu servidor se fíe de un token que le envía un navegador o una aplicación, comprueba que:

- lo firmó de verdad la cuenta o @hivesigner;
- se creó para tu aplicación;
- es el tipo de token que esperas;
- es lo bastante reciente.

### Pregunta a la API {#check-with-the-api}

Llama a `/api/me` con el token. Un token válido devuelve la cuenta en `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Un token no válido devuelve `401` con `invalid_grant`. Consulta [GET /api/me](/docs/api#me).

`/api/me` confirma la firma. Su respuesta no nombra la aplicación para la que se creó el token. Así que decodifica también el token y comprueba tú mismo su `app`, su `type` y su antigüedad. Un token creado para otra aplicación no debe iniciar la sesión de nadie en la tuya.

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

La API solo acepta tokens que nombran una aplicación. Comprueba [tú mismo](#check-it-yourself) un token de inicio de sesión de un sitio sin cuenta de aplicación.

### Compruébalo tú mismo {#check-it-yourself}

1. Decodifica el token.
2. Comprueba que `signed_message.type` es el tipo que esperas: `posting` para un token de acceso, `login` para un token de inicio de sesión.
3. Comprueba que `signed_message.app` es la cuenta de tu aplicación. Para un sitio sin cuenta de aplicación, comprueba que no hay ninguna.
4. Comprueba la antigüedad a partir de `timestamp`.
5. Calcula el hash sha256 de `JSON.stringify({ signed_message, authors, timestamp })`.
6. Recupera la clave pública a partir de `signatures[0]` y de ese hash.
7. Lee la cuenta `authors[0]` de la cadena de bloques de Hive ahora, porque las personas pueden cambiar sus claves. La clave recuperada debe ser una de sus claves de publicación o activas actuales. Un token de `/api/oauth2/token` lo firma @hivesigner en su lugar: para esos, acepta una clave de publicación actual de la cuenta @hivesigner.

En Node.js con [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), que exporta `PrivateKey`, `PublicKey`, `Signature` y `callRPC` bajo `@ecency/sdk/hive`:

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

Úsalo así:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

La biblioteca dhive (`@hiveio/dhive`) también sirve: calcula el hash con `cryptoUtils.sha256(message)` y recupera la clave con `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Mantén los tokens a salvo {#keep-tokens-safe}

Cualquiera que tenga un token de publicación puede transmitir como la persona a través de tu aplicación hasta que caduque. Trátalo como una contraseña.

- **Guarda los tokens en tu servidor,** o en una cookie httpOnly y Secure. Guarda los tokens de actualización y tu secreto de cliente solo en el servidor.
- **Nunca pongas un token en una URL que registres.** El flujo de token entrega el token en la cadena de consulta de tu URL de retorno. Léelo en tu servidor y después redirige a una URL sin él. Deja la cadena de consulta de la URL de retorno fuera de tus registros.
- **No cargues nada de otros sitios en la página de tu URL de retorno,** para que la dirección con el token no se les envíe. Una cabecera `Referrer-Policy: no-referrer` en esa página ayuda.
- **Envía un token solo a tu propio servidor y a `https://hivesigner.com/api/`.**

## Cerrar sesión y retirar el acceso {#sign-out}

- **Cerrar la sesión de una persona** significa descartar el token: bórralo de tu sesión o de tu cookie. También puedes llamar a [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) para decirle a Hivesigner que la persona cerró sesión. Tu aplicación descarta el token igualmente.
- **Cortar el acceso de tu aplicación para siempre** es decisión de la persona. En https://hivesigner.com/authorized-apps, o en `https://hivesigner.com/revoke/APP`, retira la cuenta de tu aplicación de su autoridad de publicación en la cadena de bloques. Después de eso, la API ya no transmite por ella a través de tu aplicación.
