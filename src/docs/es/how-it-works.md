Hivesigner permite que las personas usen su cuenta de Hive en tu aplicación sin darle sus claves. Tiene dos partes: un firmador en el navegador en https://hivesigner.com y una API en `https://hivesigner.com/api/`. Esta página explica qué hace cada parte y las dos formas en que una aplicación las usa.

## El firmador en el navegador {#browser-signer}

El firmador en el navegador es el sitio web de Hivesigner. Las personas añaden allí sus cuentas de Hive. Sus claves se quedan en su propio navegador: Hivesigner no envía ninguna clave a ningún servidor. Tu aplicación nunca ve ninguna.

El firmador firma tres tipos de cosas, siempre después de que la persona haya visto lo que firma:

- **Tokens de inicio de sesión.** Tu aplicación envía a alguien a Hivesigner para iniciar sesión. Hivesigner muestra el nombre de tu aplicación y lo que pide. Cuando la persona lo aprueba, Hivesigner firma con su clave una declaración corta que nombra su cuenta y tu aplicación. Esa declaración firmada es el token que recibe tu aplicación. Consulta [Iniciar sesión con OAuth2](/docs/oauth2) y [Tokens](/docs/tokens).
- **Transacciones.** Un enlace de firma abre una transacción para revisarla. Cuando la persona la aprueba, Hivesigner la firma con la clave que necesita. Después la envía a la red Hive desde el navegador, salvo que el enlace pida solo la firma. Consulta [Enlaces de firma](/docs/sign-links).
- **Mensajes.** Tu aplicación puede pedir a una persona que firme un texto con su clave, para demostrar que controla la cuenta. Consulta [Firma de mensajes](/docs/message-signing).

## La API {#api}

La API transmite operaciones de publicación en nombre de una persona que inició sesión en tu aplicación: publicaciones y comentarios, votos, seguimientos y otras operaciones `custom_json`, reclamaciones de recompensas y actualizaciones de perfil. Tu aplicación envía las operaciones junto con el token de la persona. La API comprueba el token, firma la transacción con la clave de publicación de la cuenta @hivesigner y la transmite a Hive.

La API también devuelve la cuenta de la persona que inició sesión, intercambia códigos por tokens y lista las aplicaciones que usan Hivesigner. Consulta [API REST](/docs/api).

## La cadena de autoridad de publicación {#authority-chain}

En Hive, una cuenta puede dejar que otra cuenta actúe con su autoridad de publicación. La API se apoya en dos de estas concesiones:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **La persona añade la cuenta de tu aplicación a su autoridad de publicación.** La pantalla de consentimiento hace esto la primera vez que alguien aprueba el acceso de publicación para tu aplicación. Requiere su clave activa una sola vez.
2. **La cuenta de tu aplicación añade a @hivesigner a su autoridad de publicación.** Esto lo haces una vez, cuando [registras tu aplicación](/docs/register-app#grant-hivesigner).

Antes de transmitir, la API comprueba que ambas concesiones están en su sitio. Solo transmite operaciones cuyo autor es la persona que el token nombra.

La persona puede retirar el acceso de tu aplicación cuando quiera en https://hivesigner.com/authorized-apps. Después de eso, la API ya no puede publicar por ella a través de tu aplicación.

## Dos formas de integración {#two-ways-to-integrate}

### Iniciar sesión y luego transmitir por la API {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

La persona aprueba una vez. A partir de ahí tu aplicación puede votar, comentar y publicar por ella sin volver a preguntar, hasta que el token caduque o la persona retire el acceso de tu aplicación. Usa esta vía para las acciones sociales del día a día.

Necesitas una cuenta de aplicación con URL de retorno registradas y la concesión a @hivesigner. Consulta [Registra tu aplicación](/docs/register-app). Si solo quieres saber quién es la persona, consulta [Inicio de sesión sin acceso de publicación](/docs/login-only).

### Enlaces de firma {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

La persona ve cada transacción antes de que se firme. Los enlaces de firma cubren 41 operaciones de Hive, incluidas las transferencias y otras acciones de monedero que requieren la clave activa. La API nunca maneja esas. No necesitas una cuenta de aplicación para los enlaces de firma. Consulta [Enlaces de firma](/docs/sign-links).

### Cuál elegir {#which-to-choose}

- **Acciones de publicación frecuentes** (votos, comentarios, seguimientos): inicia sesión con OAuth2 y luego usa la API.
- **Acciones de monedero**, o cualquier cosa que necesite la clave activa: usa enlaces de firma.
- **Ambas**: muchas aplicaciones inician la sesión de las personas con OAuth2 para las funciones sociales y usan enlaces de firma para las transferencias.
- **Solo la identidad de la persona**: consulta [Inicio de sesión sin acceso de publicación](/docs/login-only).

## Código fuente {#source-code}

Hivesigner es de código abierto:

- El firmador en el navegador: https://github.com/ecency/hivesigner-ui
- La API: https://github.com/ecency/hivesigner-api
- El SDK de JavaScript (paquete npm `hivesigner`): https://github.com/ecency/hivesigner-sdk. Consulta [SDK](/docs/sdk).
