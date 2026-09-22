Respuestas breves a preguntas frecuentes. Cada una enlaza con la página que da los detalles.

## Usar Hivesigner {#using-hivesigner}

### ¿Hivesigner es gratuito? {#is-it-free}

Sí. Hivesigner no cobra ni a las personas ni a las aplicaciones. Su código fuente es abierto, bajo la licencia MIT.

### ¿Hivesigner llega a ver mis claves? {#keys}

No. Tus claves se quedan en tu navegador, en tu dispositivo. Hivesigner firma ahí. Nunca se envían a los servidores de Hivesigner ni a las aplicaciones que usas. Consulta [Dónde se guardan tus claves](/docs/accounts#where-keys-are-stored) y [Protege tus claves](/docs/safety).

### ¿Qué pasa si olvido mi código de acceso? {#forgotten-passcode}

Nadie puede recuperar un código de acceso, tampoco Hivesigner. Quita la cuenta de Hivesigner y añádela de nuevo con tu clave de Hive y un código de acceso nuevo. Tu cuenta de Hive y las aplicaciones que autorizaste no cambian. Consulta [Si olvidas tu código de acceso](/docs/accounts#forgotten-passcode).

### ¿Puedo usar Hivesigner en el móvil? {#phone}

Sí. Abre https://hivesigner.com en el navegador de tu móvil y añade ahí tu cuenta. Tus claves se guardan solo en ese navegador, así que añade la cuenta en cada dispositivo que uses. Consulta [Añadir y gestionar cuentas](/docs/accounts).

### ¿Qué aplicaciones usan Hivesigner? {#which-apps}

https://hivesigner.com/apps enumera las aplicaciones que transmiten a Hive a través de Hivesigner, de más a menos usadas. Cada aplicación publica su propio nombre y su descripción. Hivesigner no los verifica. Al abrir una aplicación ahí se muestra una página desde la que puedes darle acceso de publicación. Consulta [Autorizar una aplicación desde el directorio](/docs/signing-in#directory).

### ¿Qué relación tiene Hivesigner con Hive Keychain? {#hive-keychain}

Son herramientas distintas. Hive Keychain es una extensión del navegador y una aplicación móvil. Hivesigner es un sitio web, así que no hay nada que instalar. Cuando una aplicación te pide firmar un mensaje, la firma es del mismo tipo que la que hace Hive Keychain, así que la aplicación comprueba cualquiera de las dos con el mismo código. El token de verificación de la página **Firmar mensaje** de Hivesigner se comprueba en la página **Verificar mensaje** de Hivesigner. Consulta [Firma de mensajes](/docs/message-signing).

## Crear con Hivesigner {#building}

### ¿Puedo usar Hivesigner en una aplicación móvil? {#mobile-app}

Sí. Envía a la persona a Hivesigner en un navegador y usa una URL de retorno que tu aplicación pueda recibir: un enlace https que tú controles (Android App Links o iOS Universal Links) o una dirección de bucle local como `http://127.0.0.1/auth`. Los esquemas propios como `myapp://` se rechazan. Consulta [Aplicaciones móviles y de escritorio](/docs/register-app#native-apps).

### ¿Necesito una cuenta de aplicación? {#app-account}

La necesitas para iniciar sesión a personas con acceso de publicación y para transmitir a través de la API. Consulta [Registra tu aplicación](/docs/register-app). Los [enlaces de firma](/docs/sign-links) y la [firma de mensajes](/docs/message-signing) funcionan sin ella. El [inicio de sesión sin acceso de publicación](/docs/login-only) también.

### ¿La API puede enviar transferencias? {#transfers}

No. La API solo transmite operaciones de publicación, como votos, comentarios y seguimientos. Para transferencias y otras acciones que necesitan la clave activa, usa [enlaces de firma](/docs/sign-links): la persona aprueba cada uno con su propia clave.

### ¿Qué lenguajes tienen SDK? {#languages}

El SDK oficial es para JavaScript. Existen bibliotecas de la comunidad para Python. Cualquier lenguaje puede llamar a la API REST. Consulta [SDK](/docs/sdk) y [API REST](/docs/api).

## Ayuda {#help}

### ¿Dónde puedo conseguir ayuda? {#get-help}

Pregunta en el servidor de Discord de HiveDevs: https://discord.gg/pNJn7wh. Informa de un error abriendo una incidencia en el repositorio de GitHub correspondiente: https://github.com/ecency/hivesigner-ui para el sitio web, https://github.com/ecency/hivesigner-api para la API o https://github.com/ecency/hivesigner-sdk para el SDK de JavaScript. En una pantalla que rechaza una solicitud, **Informar de este problema** envía el problema al equipo de Hivesigner.

### ¿Cómo puedo contribuir? {#contribute}

Hivesigner es de código abierto en GitHub, en los tres repositorios anteriores. Abre una incidencia con un error o una idea. Envía una pull request con una corrección.
