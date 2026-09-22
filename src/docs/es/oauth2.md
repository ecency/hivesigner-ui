Envía a las personas a Hivesigner para que inicien sesión en tu aplicación. Allí revisan tu solicitud y la aprueban. Hivesigner las devuelve entonces a tu URL de retorno con un token (el flujo de token) o con un código que tu servidor intercambia por tokens (el flujo de código). Esta página cubre ambos flujos, todos los parámetros y los alcances.

## Antes de empezar {#before-you-start}

- Registra tu aplicación: una cuenta de Hive para ella, con tus URL de retorno listadas. Consulta [Registra tu aplicación](/docs/register-app).
- Para transmitir por la API, la cuenta de tu aplicación también debe [conceder autoridad de publicación a @hivesigner](/docs/register-app#grant-hivesigner).
- Para el flujo de código, configura un [secreto de cliente](/docs/register-app#client-secret).

## La URL de autorización {#authorize-url}

Envía a la persona a esta dirección:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Codifica en URL cada valor. `URLSearchParams` lo hace por ti:

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### Parámetros {#parameters}

| Parámetro | Obligatorio | Qué hace |
| --- | --- | --- |
| `client_id` | Sí, para una aplicación | El nombre de la cuenta de tu aplicación. `clientId` también se lee. Sin él, la solicitud es una solicitud de solo inicio de sesión desde un sitio sin cuenta de aplicación: consulta [Inicio de sesión sin acceso de publicación](/docs/login-only). |
| `redirect_uri` | Sí | Adónde devuelve Hivesigner a la persona. Debe ser una de las URI de redirección de tu aplicación, exactamente. Consulta [URL de retorno](/docs/register-app#callbacks). |
| `scope` | No | `login`, `posting` u `offline`. Consulta [Alcances](#scopes). Sin él, la solicitud pide acceso de publicación. |
| `response_type` | No | `code` inicia el [flujo de código](#code-flow). Cualquier otro valor, o ninguno, significa el [flujo de token](#token-flow). |
| `state` | Recomendado | Un valor aleatorio que Hivesigner devuelve sin cambios. Consulta [Protege la solicitud con state](#state). |
| `account` | No | Un nombre de usuario de Hive. Cuando esa cuenta está en el dispositivo de la persona, Hivesigner la selecciona. En caso contrario se ignora. `select_account` también se lee. |

La persona todavía puede cambiar a otra cuenta en la pantalla de consentimiento. Toma siempre la cuenta del token o del intercambio de código, nunca de lo que pediste.

## Alcances {#scopes}

Hive tiene una sola autoridad de publicación. Por eso Hivesigner tiene dos niveles de acceso, solo inicio de sesión y publicación, sin nada más fino entre medias.

| `scope` | Lo que aprueba la persona | Flujo | `type` del token de acceso |
| --- | --- | --- | --- |
| `login` | "Ver el nombre de usuario de tu cuenta". No se concede nada. | Flujo de token (no añadas `response_type=code`) | `login` |
| `posting` | Acceso de publicación. La primera vez, esto añade la cuenta de tu aplicación a la autoridad de publicación de la persona. | Flujo de token, o flujo de código con `response_type=code` | `posting` |
| `offline` | Acceso de publicación, como arriba | Flujo de código | `posting`, con un token `refresh` |

En el flujo de código, la URL de retorno recibe primero un código (un token de `type` `code`) que tu servidor intercambia por el token de acceso.

- **Sin alcance** significa `posting`.
- **Un valor que contiene `offline`** en cualquier parte significa `offline`, por ejemplo el antiguo `offline,vote,comment`.
- **Cualquier otro valor** significa `posting`. Esto incluye los antiguos nombres de operación como `vote`, `comment`, `vote,comment`, `comment_options` o `custom_json`. No limitan el token: todos los tokens de publicación permiten las mismas operaciones. Consulta [Qué acepta broadcast](/docs/api#broadcast-rules).

Pide `login` cuando tu aplicación solo necesita saber quién es la persona. Consulta [Inicio de sesión sin acceso de publicación](/docs/login-only).

## El flujo de token {#token-flow}

El navegador de la persona recibe el token de acceso directamente. Tu aplicación no necesita ningún secreto.

1. Envía a la persona a la URL de autorización:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. La persona lo aprueba. Hivesigner redirige a tu URL de retorno:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner añade sus parámetros con `?` cuando tu URL de retorno no tiene consulta y con `&` cuando la tiene. `state` solo está ahí cuando enviaste uno no vacío.

3. En tu URL de retorno, [compara `state`](#state) primero. Después [comprueba el token](/docs/tokens#check-a-token) en tu servidor. La cuenta a la que corresponde está en el token: no te fíes solo del parámetro `username`, porque cualquiera puede editar una URL.
4. Guarda el token en tu servidor o en una cookie httpOnly. Redirige a una URL limpia para que el token salga de la barra de direcciones.
5. Usa el token con la [API](/docs/api) hasta que caduque pasados `expires_in` segundos (7 días). Después envía otra vez a la persona a la URL de autorización. Quien ya concedió acceso de publicación ve "Iniciar sesión en APP" y "Ya autorizaste a @myapp. No se concede ningún permiso nuevo.".

## El flujo de código {#code-flow}

Tu servidor recibe un código y lo intercambia por un token de acceso y un token de actualización. Después puede renovarlos sin la persona. Úsalo cuando tu servidor actúa por los usuarios durante mucho tiempo.

1. Envía a la persona a la URL de autorización con `scope=offline`:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` hace lo mismo.

2. La persona aprueba el acceso de publicación. Hivesigner redirige a tu URL de retorno:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [Compara `state`](#state). Después intercambia el código enseguida, desde tu servidor.

### Intercambia el código {#exchange-code}

Envía el código y tu secreto de cliente a `/api/oauth2/token` en el cuerpo de una petición POST:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

La respuesta:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

La misma llamada en Node.js 18 o posterior:

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- Pon el código y el secreto en el cuerpo de la petición, nunca en la URL.
- No envíes ninguna cabecera `Authorization` con esta petición.
- Usa el `username` de esta respuesta. Viene del código, que la persona firmó.
- Guarda el token de acceso y el token de actualización en tu servidor.

### Actualizar {#refresh}

Cuando el token de acceso caduca, envía el token de actualización con tu secreto de cliente al mismo punto final:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

La respuesta tiene la misma forma, con un token de acceso nuevo y un token de actualización nuevo. Guarda ambos en lugar de los anteriores.

## Protege la solicitud con state {#state}

Sin `state`, otro sitio podría enviar a tu usuario a tu URL de retorno con un token o un código elegido por él. Tu aplicación iniciaría entonces la sesión de esa persona en la cuenta de otro. `state` ata cada retorno al navegador que empezó el inicio de sesión.

1. Genera un valor aleatorio para cada inicio de sesión, de al menos 16 bytes aleatorios. El hexadecimal lo mantiene libre de caracteres que necesiten codificación.
2. Guárdalo donde solo este navegador pueda volver a presentarlo: la sesión de tu servidor, o una cookie httpOnly y Secure de vida corta con `SameSite=Lax`.
3. Envíalo como `state` en la URL de autorización.
4. En tu URL de retorno, compara el parámetro `state` con el valor guardado. Si falta o es distinto, detente: no uses el token ni el código.
5. Borra el valor guardado, para que cada uno funcione una sola vez.

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner devuelve el mismo valor de `state` que recibió. Omite uno vacío.

## Lo que ve la persona {#what-the-user-sees}

La pantalla de consentimiento muestra la imagen y el nombre de tu aplicación, "Cuenta de Hive @myapp" y "Te envía a HOST", con HOST tomado de tu URL de retorno. Después:

- **Primera solicitud de publicación.** El encabezado dice "APP solicita acceso a tu cuenta.". La tarjeta **Alcance** lista lo que tu aplicación podrá hacer. Un aviso dice "Primera autorización: esto añade @myapp a tu autoridad de publicación en la cadena de bloques y requiere tu clave activa una sola vez. Esa cuenta podrá publicar en tu nombre hasta que la revoques.". El botón dice **Autorizar**. Cuando el dispositivo de la persona no tiene ninguna clave activa para la cuenta, la pantalla la pide allí mismo.
- **Inicio de sesión.** Para `scope=login`, o para el acceso de publicación que la persona ya concedió, el encabezado dice "Iniciar sesión en APP" y el botón dice **Iniciar sesión**.
- **La cuenta.** "Autorizando como" o "Iniciando sesión como", seguido de la cuenta seleccionada. La persona puede cambiar de cuenta aquí.
- **Una cuenta bloqueada.** Un campo de código de acceso aparece encima del botón. Un clic desbloquea la cuenta y continúa.
- **Ninguna cuenta en el dispositivo.** El botón dice **Continuar**. Abre el formulario de añadir cuenta y vuelve a la solicitud.

Tras una primera solicitud de publicación, Hivesigner espera hasta que la nueva concesión sea visible en la cadena de bloques antes de redirigir. Esto puede tardar unos segundos. Para ver la pantalla completa desde el lado de la persona, consulta [Iniciar sesión en aplicaciones](/docs/signing-in).

## Cancelaciones y solicitudes rechazadas {#cancel}

- **Cancelar.** La persona va a su lista de cuentas en Hivesigner. No se envía nada a tu URL de retorno: no hay ningún parámetro de error. Mantén tu botón de inicio de sesión disponible para que pueda empezar de nuevo. No esperes ningún retorno.
- **Solicitudes rechazadas.** Una URL de retorno no registrada, un `client_id` desconocido o un `redirect_uri` ausente muestran un error en Hivesigner con un botón **Informar de este problema**. No se envía nada a tu URL de retorno. Consulta [Lo que ven las personas cuando algo va mal](/docs/register-app#refused-requests).

## La URL antigua de solicitud de inicio de sesión {#legacy-login-request}

Hivesigner todavía acepta la URL de inicio de sesión más antigua, conservada para integraciones veteranas. Usa `/oauth2/authorize` para las nuevas.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

Abre la misma pantalla de consentimiento, con las mismas comprobaciones de URL de retorno y la misma redirección. Lee sus parámetros de otra forma:

- `scope` es `login` o `posting`. Cualquier otro valor, o ninguno, significa `login`.
- `offline` no se lee. Para el flujo de código, añade `response_type=code`.
- `account` no se lee.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` sigue las mismas reglas.
