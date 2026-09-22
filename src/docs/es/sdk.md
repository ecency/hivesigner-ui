El SDK oficial de JavaScript construye URL de inicio de sesión y enlaces de firma y llama a la API de Hivesigner por ti. Para Python existen bibliotecas de la comunidad. Cualquier otro lenguaje puede llamar directamente a la [API REST](/docs/api).

## SDK de JavaScript {#javascript}

El SDK es el paquete npm `hivesigner`. Su código fuente está en https://github.com/ecency/hivesigner-sdk. Está escrito en TypeScript y trae sus tipos.

La versión 4 necesita Node.js 18 o posterior, porque usa el `fetch` integrado. En los navegadores necesita ES2017 o posterior. Donde no haya un `fetch` global, añade un polyfill antes de usar el SDK. En un Node.js más antiguo, quédate en la versión 3.

### Instalación {#install}

```bash
npm install hivesigner
```

Para una página sin proceso de compilación, carga el paquete de navegador. Define un `hivesigner` global:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Crea un cliente {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Opción | Significado |
| --- | --- |
| `app` | La cuenta de tu aplicación, enviada como `client_id`. |
| `callbackURL` | Adónde devuelve Hivesigner a la persona. Debe ser una de las URL de retorno de tu aplicación, carácter por carácter (una URL de retorno de bucle local con http simple puede tener otro host y otro puerto, consulta [URL de retorno](/docs/register-app#callback-rules)). |
| `scope` | Una lista, unida con comas en el parámetro `scope`. Consulta [Alcances](/docs/oauth2#scopes). |
| `responseType` | `'code'` para el flujo de código. Omítelo para el flujo de token. |
| `accessToken` | El token de acceso de la persona, cuando ya tienes uno. |
| `apiURL` | El origen de la API. El SDK le añade `/api/`. El valor por defecto es `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` y `setApiURL` cambian el cliente más adelante. Cada uno devuelve el cliente.

### Inicia la sesión de la persona {#sign-in}

`getLoginURL(state, account)` devuelve la URL de inicio de sesión:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` vuelve a tu URL de retorno sin cambios. Úsalo para atar la respuesta a la solicitud.
- `account` es opcional: un nombre de usuario. Hivesigner selecciona esa cuenta cuando está en el dispositivo y la ignora en caso contrario.

En un navegador, `client.login({ state: 'STATE' })` envía a la persona a la misma URL, sin cuenta.

En el flujo de token, tu URL de retorno recibe `access_token`, `expires_in` y `username`. Dale el token al cliente:

```js
client.setAccessToken('ACCESS_TOKEN');
```

El SDK no tiene ningún método para el intercambio del flujo de código. Tu servidor envía por su cuenta el código y el secreto de cliente a la API, como muestra [Intercambia el código](/docs/oauth2#exchange-code).

### Obtén la persona {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` es la cuenta de Hive de la persona tal como la devuelve la cadena. `scope` lista lo que permite el token.

### Transmite {#broadcast}

`broadcast(operations)` envía operaciones a la API, que las transmite por la persona. La API solo acepta operaciones de publicación cuyo autor es la persona del token: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` con autoridad de publicación, `claim_reward_balance` y `account_update2` para los metadatos de perfil. Consulta [Qué acepta broadcast](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Nombra a la persona en cada operación. La API no sustituye `__signer`.

Estos ayudantes construyen una operación cada uno y llaman a `broadcast`:

| Método | Transmite |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` va de `-10000` a `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Para una publicación nueva, `parentAuthor` es `''`. `jsonMetadata` puede ser un objeto: el SDK lo convierte en cadena. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Pasa `[]` como `requiredAuths` y `['USERNAME']` como `requiredPostingAuths`. `json` es una cadena. |
| `reblog(account, author, permlink)` | `custom_json` con id `follow`, que republica la publicación |
| `follow(follower, following)` | `custom_json` con id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` con id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` con id `follow`, `what: ['ignore']` (silenciar) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Los importes son cadenas como `'0.000 HIVE'`, `'0.000 HBD'` y `'1.000000 VESTS'`. |

`updateUserMetadata()` está obsoleto. Para cambiar el perfil de una persona, transmite `account_update2` con un `posting_json_metadata` nuevo.

### Cierra la sesión {#log-out}

`revokeToken()` es la llamada de cierre de sesión del SDK. Envía el token al punto final de revocación de la API y después lo quita del cliente. Cuando la llamada se rechaza, llama tú mismo a `removeAccessToken()`. Borra también el token dondequiera que tu aplicación lo haya guardado.

Para terminar con el acceso de tu aplicación para siempre, la persona lo retira en https://hivesigner.com/authorized-apps. Consulta [Ver y retirar el acceso de una aplicación](/docs/signing-in#remove-access).

### Enlaces de firma {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` y `sendTransaction(tx, params)` devuelven un enlace `https://hivesigner.com/sign/...`. `params` acepta `callback`, `no_broadcast` y `signer`. Consulta [Enlaces de firma](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

En TypeScript los tipos exigen el tercer argumento: pasa `undefined` para recibir el enlace.

En un navegador, pasa una función como tercer argumento para abrir el enlace en una pestaña nueva. La función no se llama y no se devuelve nada. Llámala desde un manejador de clic, o el navegador puede bloquear la pestaña nueva y la llamada lanza un error.

### Promesas y funciones de retorno {#promises-and-callbacks}

`me`, `broadcast`, los ayudantes y `revokeToken` devuelven una promesa. Pasa una función como último argumento para usar una función de retorno en su lugar. Recibe `(error, result)`.

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

Cuando la API responde con un error, la promesa se rechaza con el cuerpo de error de la API, `{ error, error_description }`. Con una función de retorno, ese cuerpo es el argumento `error`. Cuando la respuesta no es JSON, se rechaza con el error de análisis.

## Python {#python}

Estas bibliotecas vienen de la comunidad. Las mantienen sus autores, no el equipo de Hivesigner. Compruébalas contra la [API REST](/docs/api) antes de confiar en ellas.

| Biblioteca | Autor |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, módulo `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
