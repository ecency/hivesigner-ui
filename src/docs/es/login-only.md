Algunas aplicaciones solo necesitan saber quién es una persona en Hive. Nunca publican, votan ni transmiten nada por ella. Hivesigner puede iniciar la sesión de las personas en una aplicación así sin ninguna autoridad de publicación. La persona demuestra que controla una cuenta de Hive. Tu aplicación aprende su nombre. Esta página muestra las dos formas de hacerlo y cómo comprobar el resultado con seguridad.

## Dos formas {#two-ways}

- **Con cuenta de aplicación:** tu aplicación tiene su propia cuenta de Hive y pide `scope=login`. El token nombra tu aplicación.
- **Sin cuenta de aplicación:** un sitio sin cuenta de Hive propia envía solo un `redirect_uri`. El token no nombra ninguna aplicación. Tu sitio lo comprueba por su cuenta.

Ninguna necesita una concesión de la persona ni de la cuenta de tu aplicación, así que nada cambia en la cuenta de la persona. Hivesigner firma el inicio de sesión con la clave de publicación, o con la clave activa cuando el dispositivo no tiene ninguna clave de publicación para la cuenta.

## Con cuenta de aplicación {#app-account}

1. [Registra tu aplicación](/docs/register-app): crea su cuenta de Hive y lista tus URL de retorno. No necesitas secreto de cliente ni concesión a @hivesigner.
2. Envía a la persona a:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. La persona ve "Iniciar sesión en APP" con el **Alcance** "Ver el nombre de usuario de tu cuenta". Selecciona **Iniciar sesión**.
4. Hivesigner redirige a tu URL de retorno:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [Compara `state`](/docs/oauth2#state) y después comprueba el token. Es un token `login` que nombra tu aplicación, así que sirve cualquiera de estas vías:
   - llama a [`GET /api/me`](/docs/api#me) con él, que responde con la cuenta en `user` y `scope` `["login"]`, y después decodifica el token y comprueba `type` y `app` ([Pregunta a la API](/docs/tokens#check-with-the-api));
   - o [compruébalo tú mismo](/docs/tokens#check-it-yourself) con `type: 'login'` y el nombre de tu aplicación.

Un token `login` no puede transmitir: `/api/broadcast` rechaza cualquier operación enviada con él.

## Sin cuenta de aplicación {#no-app-account}

1. Envía a la persona a la URL de autorización con un `redirect_uri` y sin `client_id`:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   La URL de retorno debe ser `https://`, o `http://` en bucle local (`localhost`, `127.0.0.1`, `[::1]`). No hay ninguna lista donde registrarla. Hivesigner ignora aquí `scope` y `response_type`: la respuesta es siempre un token de inicio de sesión.

2. La persona ve "HOST quiere confirmar tu nombre de usuario de Hive.", donde HOST es el host de tu URL de retorno. Selecciona **Iniciar sesión**.
3. Hivesigner redirige a tu URL de retorno:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [Compara `state`](/docs/oauth2#state) y después comprueba el token tú mismo. La API no acepta un token que no nombre ninguna aplicación, así que tu servidor verifica la firma contra las claves de la cuenta. Consulta [Compruébalo tú mismo](/docs/tokens#check-it-yourself), con `type: 'login'` y sin `app`.

Cuando la URL de retorno no es una dirección web, o es `http://` simple fuera del bucle local, Hivesigner rechaza la solicitud y le dice a la persona por qué.

## Cuál usar {#which-one}

| | Con cuenta de aplicación | Sin cuenta de aplicación |
| --- | --- | --- |
| Lo que ve la persona | El nombre, la imagen y la cuenta de Hive de tu aplicación | Solo el host de tu sitio |
| Preparación | Una cuenta de Hive con tus URL de retorno listadas | Ninguna |
| El token nombra | Tu aplicación | Ninguna aplicación |
| Comprueba el token con | `/api/me` o tu propio código | Tu propio código |
| Acceso de publicación más adelante | Con la misma cuenta: pide `posting` y [concede a @hivesigner](/docs/register-app#grant-hivesigner) | Necesita antes una cuenta de aplicación |

Usa una cuenta de aplicación cuando puedas. Las personas ven el nombre y la imagen de tu aplicación. Tu servidor puede rechazar los tokens creados para otra aplicación. Más adelante puedes pasar al acceso de publicación con la misma cuenta.

Usa la segunda vía cuando tu sitio no tiene cuenta de Hive y no quiere ninguna.

## Comprueba el inicio de sesión con seguridad {#check-safely}

- **Ata la solicitud con `state`.** Genera un valor aleatorio por inicio de sesión, guárdalo en la sesión de la persona, compáralo en tu URL de retorno y úsalo una sola vez. Consulta [Protege la solicitud con state](/docs/oauth2#state).
- **Comprueba el tipo.** Acepta solo `signed_message.type` `login`. Un código o un token de actualización no son un inicio de sesión.
- **Comprueba la aplicación.** Con cuenta de aplicación, `signed_message.app` debe ser tu aplicación. Sin ella, no debe haber ningún `app`.
- **Comprueba la antigüedad.** Compruebas el token justo después de la redirección, así que acéptalo solo dentro de unos pocos minutos desde su `timestamp` (por ejemplo 5 minutos, con un minuto de diferencia de reloj).
- **Usa cada token una sola vez.** Después de una comprobación correcta, inicia tu propia sesión (por ejemplo una cookie httpOnly) y descarta el token de Hivesigner. Guarda un registro de los tokens que aceptaste hasta que sean demasiado antiguos para pasar la comprobación de antigüedad. Rechaza cualquiera que vuelvas a ver.
- **Mantén el token fuera de los registros.** Llega en la cadena de consulta de tu URL de retorno. Consulta [Mantén los tokens a salvo](/docs/tokens#keep-tokens-safe).

## Ejemplos {#examples}

Sitios como https://hivesearcher.com y https://openhive.chat permiten a las personas iniciar sesión con su cuenta de Hive para funciones que se quedan fuera de la cadena, como la búsqueda y el chat. Necesitan saber quién es la persona y nada más.
