La API de Hivesigner está en `https://hivesigner.com/api/`. Devuelve la cuenta de la persona que inició sesión, transmite operaciones de publicación por ella, intercambia códigos por tokens y lista las aplicaciones que usan Hivesigner. Esta página describe cada punto final con sus peticiones, respuestas y errores.

## Peticiones y autenticación {#authentication}

- **URL base:** `https://hivesigner.com/api/`. Todos los puntos finales de abajo son relativos a `https://hivesigner.com`.
- **El token:** envíalo como cabecera `Authorization`, tal cual: `Authorization: ACCESS_TOKEN`. También se acepta un prefijo `Bearer `. Puedes enviarlo además como `access_token` en la cadena de consulta o en el cuerpo, pero la cabecera lo mantiene fuera de las URL y de los registros.
- **Cuerpos:** JSON con `Content-Type: application/json`, o un formulario (`application/x-www-form-urlencoded`).
- **Respuestas:** JSON.
- **Navegadores:** la API permite peticiones de origen cruzado, así que una aplicación web puede llamarla directamente.

Para obtener un token, consulta [Iniciar sesión con OAuth2](/docs/oauth2). Para saber qué contiene un token, consulta [Tokens](/docs/tokens).

## Errores {#errors}

Una respuesta de error tiene un estado HTTP de error y este cuerpo:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Estado | `error` | Cuándo |
| --- | --- | --- |
| 401 | `invalid_grant` | El token falta o no es válido, o es del tipo equivocado para este punto final ("The token has invalid role"). En `/api/oauth2/token`, también "The code or secret is not valid". |
| 401 | `invalid_scope` | `/api/broadcast`: una operación que el token no permite. La descripción nombra las operaciones. |
| 401 | `unauthorized_client` | `/api/broadcast`: una operación cuyo autor no es la persona del token, un `account_update2` que toca claves, una concesión de autoridad de publicación que falta o una cuenta que no se pudo cargar. La descripción dice cuál. |
| 500 | `server_error` | `/api/broadcast`: la red Hive rechazó la transacción. `error_description` lleva su mensaje. |
| 503 | `unavailable` | `/api/apps`: el directorio todavía se está construyendo. |

## GET /api/me {#me}

Devuelve la cuenta a la que corresponde el token. Úsalo para saber quién inició sesión, o para [comprobar un token](/docs/tokens#check-with-the-api).

- **Métodos:** `GET` o `POST`.
- **Token:** un token de acceso, incluido un token `login` que nombre una aplicación.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

La respuesta, abreviada:

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

| Campo | Significado |
| --- | --- |
| `user` | El nombre de usuario de Hive al que corresponde el token. `_id` y `name` lo repiten. |
| `account` | La cuenta entera, tal como la devuelve `condenser_api.get_accounts` de Hive. |
| `scope` | Lo que permite el token: `["login"]` para un token de inicio de sesión, y si no las operaciones que `/api/broadcast` acepta. |
| `user_metadata` | Los metadatos de perfil de la cuenta, analizados desde JSON. |

`/api/me` no nombra la aplicación para la que se creó el token. Para comprobar eso, decodifica el token: consulta [Pregunta a la API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Firma operaciones de publicación en nombre de la persona del token con la clave de publicación de @hivesigner y las transmite a Hive.

- **Método:** `POST`.
- **Token:** un token de acceso `posting`, del flujo de token o del flujo de código.
- **Antes de que funcione:** la persona ha concedido autoridad de publicación a la cuenta de tu aplicación (la pantalla de consentimiento lo hace) y la cuenta de tu aplicación ha [concedido autoridad de publicación a @hivesigner](/docs/register-app#grant-hivesigner).
- **Cuerpo:** `{ "operations": [...] }`, donde cada operación es `[name, fields]` como en la cadena de bloques de Hive. Todas las operaciones de una petición van en una sola transacción.

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

La misma petición con curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Un seguimiento es una operación `custom_json`:

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

La API responde una vez que un nodo de Hive ha aceptado la transacción. `result.id` es el identificador de la transacción:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Cuando la red rechaza la transacción, la respuesta es `500` con `server_error`. Su `error_description` lleva el mensaje de la red y `response` lleva el error en bruto.

### Qué acepta broadcast {#broadcast-rules}

Un token de publicación permite a la API transmitir estas operaciones y ninguna otra. En cada una, la persona del token debe ser la cuenta del campo indicado:

| Operación | La persona del token debe ser |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | La primera cuenta de `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Cualquier otra operación** se rechaza con `invalid_scope`. Un token `login` no permite ninguna operación.
- **Una operación para otra cuenta** se rechaza con `unauthorized_client`. Un token solo transmite por su propia persona.
- **`account_update2`** solo puede cambiar los metadatos de la cuenta. Una operación con un campo `owner`, `active` o `posting` se rechaza con `unauthorized_client`.
- **`custom_json`**: deja `required_auths` vacío. La API firma con autoridad de publicación, así que una operación que necesite autoridad activa falla en la red.

Las transferencias y otras operaciones de monedero necesitan la clave activa de la persona. Envíalas como [enlaces de firma](/docs/sign-links) en su lugar.

## POST /api/oauth2/token {#oauth2-token}

Intercambia un código por tokens, o un token de actualización por tokens nuevos. Llámalo solo desde tu servidor. Consulta [El flujo de código](/docs/oauth2#code-flow).

- **Método:** `POST`, con los valores en el cuerpo.
- **Cuerpo:** `code` y `client_secret`, o `refresh_token` y `client_secret`.
- **Cabeceras:** no envíes ninguna cabecera `Authorization`.

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

Cada llamada devuelve un token de acceso nuevo y un token de actualización nuevo. Ambos los firma @hivesigner. `expires_in` es la vida del token de acceso en segundos (7 días).

Errores: `401 invalid_grant`. La descripción es "The token has invalid role" cuando el valor enviado no es un código ni un token de actualización válido. Es "The code or secret is not valid" cuando el código o el secreto no coinciden.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Le dice a Hivesigner que la persona cerró sesión en tu aplicación. Tu aplicación descarta el token por su cuenta.

- **Método:** `POST`.
- **Token:** el token de acceso, en la cabecera `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

El `revokeToken()` del SDK de JavaScript hace esta llamada y después olvida el token. Para retirar el acceso de tu aplicación para siempre, la persona lo retira en https://hivesigner.com/authorized-apps. Consulta [Cerrar sesión y retirar el acceso](/docs/tokens#sign-out).

## GET /api/apps {#apps}

El directorio público de aplicaciones: aplicaciones que transmiten a través de Hivesigner, ordenadas por cuánta gente las usa. No necesita ningún token. https://hivesigner.com/apps muestra la misma lista.

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

| Campo | Significado |
| --- | --- |
| `updated_at` | Cuándo se construyó el directorio por última vez. |
| `building` | `true` hasta que la primera construcción tiene datos. `apps` está entonces vacío. |
| `window_days` | El número de días que cubre la clasificación. |
| `featured` | Los nombres de usuario que se muestran primero, en orden. |
| `apps[].username` | La cuenta de la aplicación. |
| `apps[].name`, `about` | Del perfil de la cuenta de la aplicación, o `null`. |
| `apps[].website` | El sitio web del perfil, cuando responde en su propio dominio. Si no, `null`. |
| `apps[].site` | El resultado de la comprobación del sitio web: `ok`, `no_website`, `invalid`, `redirected`, `blocked` o `unreachable`. Una entrada `redirected` tiene además `redirects_to`. |
| `apps[].users` | Personas distintas por día, sumadas sobre la ventana. |
| `apps[].requests` | Peticiones a la API correctas hechas para la aplicación durante la ventana. |
| `apps[].first_seen`, `last_seen` | El primer día en que Hivesigner registró la aplicación y el último día en que se usó, o `null`. |
| `apps[].new` | `true` cuando la aplicación apareció por primera vez dentro de la ventana. |

La respuesta puede quedar en caché hasta 5 minutos. Antes de que el directorio se construya por primera vez, la API responde `503` con `unavailable`. Reinténtalo más tarde.

Los nombres y las descripciones los publica cada cuenta de aplicación por su cuenta. Hivesigner no verifica ninguno.
