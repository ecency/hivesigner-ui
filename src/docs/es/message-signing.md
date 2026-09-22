Tu aplicación puede pedir a una persona que firme un mensaje de texto con su clave de publicación o activa. La firma demuestra que controla la cuenta. No se transmite nada: el mensaje nunca llega a la cadena de bloques. Hivesigner firma igual que el `requestSignBuffer` de Hive Keychain, así que el código de servidor que comprueba una firma de Keychain también comprueba una de Hivesigner.

## Solicita una firma {#request}

Envía a la persona a `https://hivesigner.com/sign-buffer` con estos parámetros de consulta:

| Parámetro | Obligatorio | Significado |
| --- | --- | --- |
| `message` | Sí | El texto exacto que se firma. Debe contener algo más que espacios. |
| `redirect_uri` | Sí | Adónde envía Hivesigner el resultado. Consulta [Reglas de la URL de retorno](#callback-rules). |
| `authority` | No | `posting` o `active`, en cualquier combinación de mayúsculas y minúsculas (`Posting` también vale). `posting` cuando falta o está vacío. Cualquier otro valor se rechaza. |
| `client_id` | No | La cuenta de tu aplicación. `clientId` también se lee. Con él, `redirect_uri` debe ser una de las URL de retorno de tu aplicación. |
| `state` | No | Cualquier valor. Hivesigner lo devuelve sin cambios. |
| `account` | No | La cuenta que esperas que firme. Hivesigner la selecciona cuando está en el dispositivo y la ignora en caso contrario. `select_account` también se lee. |

Construye la URL con `URLSearchParams`, para que cada valor quede codificado:

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### Reglas de la URL de retorno {#callback-rules}

- La URL de retorno debe ser `https://`. El `http://` simple solo funciona en bucle local: `localhost`, `127.0.0.1` o `[::1]`.
- **Con `client_id`**, la URL de retorno debe estar registrada en esa cuenta de aplicación, con la misma comprobación que para el inicio de sesión. Consulta [URL de retorno](/docs/register-app#callback-rules). Hivesigner lee las URL de retorno de la aplicación desde Hive cuando se abre la solicitud y no firma nada hasta haberlas leído. Cuando no se puede llegar a Hive, la persona recibe un botón **Reintentar**.
- **Sin `client_id`**, cualquier URL de retorno que cumpla la primera regla vale. Hivesigner nombra entonces al host de la URL de retorno como solicitante, por ejemplo "HOST te pide que firmes un mensaje.".

Envía `client_id` cuando tengas una cuenta de aplicación. La persona ve entonces el nombre y la cuenta de tu aplicación. Solo tus URL de retorno registradas pueden recibir la firma.

Hivesigner rechaza una solicitud sin mensaje, con un `authority` desconocido, con una URL de retorno ausente o inutilizable, con un `client_id` que no es una cuenta de Hive o con una URL de retorno que no está registrada en esa aplicación. La persona ve "Esta solicitud de firma no se puede usar: necesita un mensaje, una clave de publicación o activa y una URL de redirección segura registrada para la aplicación. Vuelve al sitio e inténtalo de nuevo." y un botón **Informar de este problema**.

### Lo que ve la persona {#what-the-user-sees}

- Un encabezado que nombra tu aplicación (o el host de la URL de retorno) y "Te envía a HOST".
- El mensaje entero, exactamente como se va a firmar. Los caracteres que podrían ocultar texto o cambiar su dirección se muestran como códigos, por ejemplo `\u{200B}`.
- "Se firma con tu clave de publicación" o "Se firma con tu clave activa".
- Un aviso: "Tu firma demuestra a cualquiera que la vea que @USERNAME firmó exactamente este texto. Firma solo un mensaje que entiendas."
- **Firmar** y **Cancelar**. Una cuenta bloqueada pide antes su código de acceso.

[Solicitudes de firma de mensajes](/docs/signing#message-requests) describe la pantalla para las personas.

## Lo que recibe tu URL de retorno {#callback}

Cuando la persona selecciona **Firmar**, Hivesigner la envía a tu URL de retorno con estos parámetros de consulta:

| Parámetro | Valor |
| --- | --- |
| `signature` | La firma, como cadena hexadecimal de 130 caracteres |
| `public_key` | La clave pública de la clave que firmó, por ejemplo `STM...` |
| `username` | La cuenta que firmó |
| `authority` | `posting` o `active` |
| `state` | Tu `state`, siempre que la solicitud llevara uno (incluido uno vacío) |

Hivesigner los añade a la consulta de tu URL de retorno, después de `?` o `&` y antes de cualquier `#fragment`. Tu propia consulta se queda como está.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Cuando la persona selecciona **Cancelar**, Hivesigner abre su lista de cuentas. Tu URL de retorno no recibe nada.

> **Advertencia:** Cualquiera puede abrir tu URL de retorno con valores inventados. Trata cada parámetro como una afirmación hasta que tu servidor haya comprobado la firma.

## Verifica la firma {#verify}

Comprueba la firma en tu servidor:

1. Guarda en tu servidor el mensaje que pediste, junto con su `state`. No te fíes de una copia que vuelva desde el navegador.
2. Haz el hash del mensaje: sha256 sobre sus bytes UTF-8.
3. Recupera la clave pública a partir de la firma y de ese hash.
4. Carga la cuenta desde Hive. Comprueba que la clave recuperada pertenece a la autoridad que pediste, con peso suficiente para firmar sola.
5. Comprueba que `state` es el que emitiste. Acepta cada mensaje una sola vez.

Este ejemplo usa dhive (https://www.npmjs.com/package/@hiveio/dhive):

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

La misma comprobación sirve para una firma del `requestSignBuffer` de Hive Keychain. Compara con la clave que recuperaste: `public_key` en la URL de retorno es solo una pista.

## Mensajes que Hivesigner no firma {#refused-messages}

Un mensaje que es un objeto JSON con una clave `signed_message` tiene la forma de un token de Hivesigner. Firmarlo daría al solicitante acceso a la cuenta de la persona. Hivesigner nunca firma un mensaje así. Le dice a la persona "Este mensaje es un token de Hivesigner. Firmarlo daría al sitio acceso a tu cuenta, así que no se puede firmar."

Usa texto normal, o JSON sin ninguna clave `signed_message`. Di para qué sirve la firma y añade un valor que generes una sola vez, por ejemplo:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## La herramienta Firmar mensaje {#sign-message-tool}

Las personas también pueden firmar un mensaje por su cuenta en https://hivesigner.com/signmessage (**Firmar mensaje**) y comprobar uno en https://hivesigner.com/verifymessage (**Verificar mensaje**). Consulta [Firma un mensaje tú mismo](/docs/signing#sign-message).

Esa herramienta firma de forma distinta a `/sign-buffer`. Firma un cuerpo de token de Hivesigner que contiene el mensaje, la cuenta y la hora. Comparte el resultado como **Token de verificación**. Comprueba un token así en la página **Verificar mensaje** o como se describe en [Compruébalo tú mismo](/docs/tokens#check-it-yourself), no con el código de arriba.
