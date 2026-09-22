Una aplicación que inicia la sesión de las personas con Hivesigner es una cuenta de Hive. Su nombre es el `client_id` que envías. Su perfil guarda los ajustes que Hivesigner lee: las URL de retorno a las que puede enviar tokens y, para el flujo de código, un secreto de cliente. Para transmitir por la API, la cuenta de la aplicación también concede autoridad de publicación a @hivesigner. Esta página recorre cada paso.

## Lo que necesitas {#what-you-need}

| Quieres | Cuenta de aplicación y URL de retorno | Secreto de cliente | Concesión a @hivesigner |
| --- | --- | --- | --- |
| Iniciar sesión y transmitir con el flujo de token | Sí | No | Sí |
| Iniciar sesión y transmitir con el flujo de código (tokens de actualización) | Sí | Sí | Sí |
| Solo iniciar sesión, con un token que nombre tu aplicación | Sí | No | No |
| Solo iniciar sesión, desde un sitio sin cuenta de Hive | No | No | No |
| Enviar enlaces de firma | No | No | No |

Para las dos últimas filas, consulta [Inicio de sesión sin acceso de publicación](/docs/login-only) y [Enlaces de firma](/docs/sign-links).

## Crea la cuenta de la aplicación {#app-account}

1. Crea una cuenta de Hive para tu aplicación, por ejemplo en https://ecency.com/signup. Usa una cuenta aparte para la aplicación, no la tuya personal. Su nombre es tu `client_id`. Las personas lo ven en la pantalla de consentimiento junto a "Cuenta de Hive". Una cuenta de Hive no se puede renombrar, así que elige el nombre con cuidado.
2. Añade la cuenta a Hivesigner en https://hivesigner.com/import (**Añadir cuenta**). Usa la clave activa o la contraseña maestra: la concesión que viene más abajo necesita la clave activa.

## Rellena los ajustes de la aplicación {#app-settings}

Abre https://hivesigner.com/profile con la cuenta de la aplicación seleccionada y configura:

- **Esta cuenta es una aplicación.** Actívalo. Marca la cuenta como aplicación, algo que la API comprueba antes de aceptar un código o un token de actualización para ella.
- **URI de redirección.** Tus URL de retorno, una por línea. Consulta [URL de retorno](#callbacks).
- **Creador.** Quién mantiene la aplicación. El directorio de aplicaciones en https://hivesigner.com/apps lo muestra.
- **Estado.** Producción o pruebas, para tus propios registros. Hivesigner trata ambos igual.
- **Secreto de cliente.** Solo hace falta para el [flujo de código](/docs/oauth2#code-flow). Consulta [Secreto de cliente](#client-secret).

Rellena también **Nombre** y **URL de la foto de perfil**. La pantalla de consentimiento muestra la imagen y el nombre de tu aplicación. El directorio de aplicaciones en https://hivesigner.com/apps muestra el nombre, **Acerca de** y **Sitio web**.

Guardar actualiza el perfil de la cuenta en la cadena de bloques y necesita su clave de publicación. Hivesigner lee tus URL de retorno desde la cuenta cuando se abre una solicitud de inicio de sesión, así que un cambio se aplica en cuanto la transacción está en un bloque.

> **Nota:** El nombre, la imagen y la descripción los publica la propia cuenta de tu aplicación. Por eso la pantalla de consentimiento muestra además el nombre real de la cuenta (`@myapp`) y el host al que envía a la persona: eso es lo que la concesión y la redirección usan de verdad.

## URL de retorno {#callbacks}

Una URL de retorno (el `redirect_uri` de una solicitud de inicio de sesión) es el lugar al que Hivesigner devuelve a la persona con un token o un código. Hivesigner solo la envía a una URL de retorno listada en la cuenta de tu aplicación.

### Las reglas {#callback-rules}

- **Coincidencia exacta.** El `redirect_uri` de la solicitud debe ser una de tus URI de redirección, carácter por carácter: esquema, host, puerto, ruta y consulta.
- **Solo https.** Una URL de retorno debe usar `https://`. El `http://` simple solo se acepta en bucle local: `localhost`, `127.0.0.1` o `[::1]`.
- **Los puertos de bucle local pueden cambiar.** Una URL de retorno de bucle local registrada con http simple coincide con cualquier host y puerto de bucle local que tenga la misma ruta, consulta, fragmento e información de usuario. Una URL de retorno de bucle local registrada con `https://` sigue siendo una coincidencia exacta.
- **Nada de esquemas propios.** Una URL de retorno como `myapp://callback` se rechaza. Consulta [Aplicaciones móviles y de escritorio](#native-apps).
- **Nada de fragmentos.** No añadas un `#fragment` a una URL de retorno.

La página de perfil se niega a guardar una URL de retorno que nunca podría funcionar, con "URL de retorno no válida (https, o http en localhost)".

### Ejemplos {#callback-examples}

Con estas URI de redirección registradas:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| `redirect_uri` en la solicitud | Resultado |
| --- | --- |
| `https://myapp.example/auth/callback` | Aceptada: coincidencia exacta |
| `https://myapp.example/auth/callback/` | Rechazada: `/` de más |
| `https://myapp.example/auth/callback?next=home` | Rechazada: la consulta es distinta |
| `https://www.myapp.example/auth/callback` | Rechazada: otro host |
| `http://myapp.example/auth/callback` | Rechazada: http simple fuera del bucle local |
| `http://localhost:3000/auth` | Aceptada: coincidencia exacta |
| `http://127.0.0.1:51234/auth` | Aceptada: bucle local, misma ruta, otro puerto |
| `http://[::1]:3000/auth` | Aceptada: bucle local, misma ruta |
| `http://127.0.0.1:3000/other` | Rechazada: otra ruta |
| `https://localhost:3000/auth` | Rechazada: https no coincide con un registro de http simple |
| `myapp://auth` | Rechazada: esquema propio |

Para aceptar una consulta en tu URL de retorno, registra la URL de retorno con esa consulta exacta. Hivesigner conserva la consulta propia de tu URL de retorno y añade sus parámetros después.

### Aplicaciones móviles y de escritorio {#native-apps}

Hivesigner pone el token en la URL de retorno. Un esquema propio como `myapp://` no está ligado a una sola aplicación: otra aplicación del mismo dispositivo puede reclamarlo y recibir el token. Por eso Hivesigner rechaza los esquemas propios y envía los tokens solo a una dirección https o al bucle local del propio dispositivo de la persona.

Una aplicación nativa usa una de estas vías:

- **Un enlace https que le pertenece.** Registra una URL de retorno en tu dominio que el sistema operativo abra en tu aplicación (App Links de Android o Universal Links de iOS).
- **Una URL de retorno de bucle local.** La aplicación escucha en `127.0.0.1` la redirección. Registra `http://127.0.0.1/auth` (o `localhost`) y usa cualquier puerto libre en tiempo de ejecución: el puerto no tiene que coincidir.

## Secreto de cliente {#client-secret}

El secreto de cliente demuestra que un intercambio de código viene de tu servidor. Es obligatorio para el [flujo de código](/docs/oauth2#code-flow): tu servidor lo envía con cada código o token de actualización a `/api/oauth2/token`. El flujo de token no lo usa.

- **Genera un valor aleatorio largo**, por ejemplo con `openssl rand -hex 32`.
- **Configúralo en la página de perfil.** Hivesigner guarda solo su hash sha256, en el perfil de la cuenta de tu aplicación. Dejar el campo en blanco mantiene el secreto actual.
- **Guárdalo en tu servidor.** Nunca lo pongas en una página web, en una aplicación móvil ni en una URL.
- **Para cambiarlo,** configura uno nuevo y actualiza tu servidor al mismo tiempo.

## Concede autoridad de publicación a @hivesigner {#grant-hivesigner}

La API transmite con la clave de publicación de la cuenta @hivesigner. Hive acepta esa firma para tus usuarios solo cuando la cuenta de tu aplicación ha añadido a @hivesigner a su propia autoridad de publicación. Consulta [La cadena de autoridad de publicación](/docs/how-it-works#authority-chain).

1. Selecciona la cuenta de tu aplicación en Hivesigner.
2. Abre https://hivesigner.com/authorize/hivesigner.
3. La página dice "Autorizar @hivesigner" y "@hivesigner podrá publicar, comentar, votar y seguir como @myapp.". Selecciona **Autorizar**. Esto necesita la clave activa de la cuenta de la aplicación.

Esto se hace una sola vez. Sin ello, cada transmisión falla con `unauthorized_client` y "Broadcaster account doesn't have permission to broadcast for @myapp". Una aplicación que solo inicia sesión no lo necesita.

Esta concesión también permite que @hivesigner publique como la propia cuenta de tu aplicación, una razón más para dedicar la cuenta de la aplicación solo a la aplicación.

Las aplicaciones que transmiten a través de Hivesigner con esta concesión activa pueden aparecer en el directorio de aplicaciones en https://hivesigner.com/apps, ordenadas por cuánta gente las usa.

## Lo que ven las personas cuando algo va mal {#refused-requests}

Hivesigner rechaza una solicitud que no puede atender con seguridad. Muestra un mensaje y un botón **Informar de este problema**. La solicitud no se puede aprobar. No se envía nada a tu URL de retorno.

| Problema | Lo que lee la persona |
| --- | --- |
| El `redirect_uri` no es una de tus URI de redirección | "La URL de redirección de esta aplicación no está registrada. Por tu seguridad, se ha bloqueado el inicio de sesión." |
| El `client_id` no es una cuenta de Hive | "@myapp no es una cuenta de Hive, así que no hay ninguna aplicación que autorizar. Vuelve al sitio e inténtalo de nuevo." |
| La cuenta no está marcada como aplicación | "@myapp no está configurada como aplicación, así que no puede iniciar tu sesión. Vuelve al sitio e inténtalo de nuevo." Activa **Esta cuenta es una aplicación**, como arriba. |
| Falta el `redirect_uri` en la solicitud | "Esta solicitud de autorización está incompleta: no indica ninguna aplicación o ninguna URL de redirección. Vuelve a la aplicación e inténtalo de nuevo." |

Si tus usuarios informan de alguno de estos casos, compara el `redirect_uri` que envía tu aplicación con tus URI de redirección, carácter por carácter.

## Lista de comprobación {#checklist}

1. Una cuenta de Hive para la aplicación, añadida a Hivesigner con su clave activa.
2. En https://hivesigner.com/profile: "Esta cuenta es una aplicación" activado, las URI de redirección listadas y un secreto de cliente configurado si usas el flujo de código.
3. @hivesigner autorizado en https://hivesigner.com/authorize/hivesigner, si transmites por la API.
4. Un enlace de inicio de sesión que envíe exactamente una de tus URI de redirección. Consulta [Iniciar sesión con OAuth2](/docs/oauth2).
