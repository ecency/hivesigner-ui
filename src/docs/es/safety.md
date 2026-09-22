Tus claves de Hive controlan tu cuenta. Cualquiera que las tenga puede actuar en tu nombre. Hivesigner las guarda en tu navegador y te muestra lo que firmas. Estas costumbres las mantienen a salvo.

## Comprueba primero la dirección {#check-the-address}

Antes de escribir una clave o un código de acceso, mira la barra de direcciones de tu navegador. Debe mostrar `https://hivesigner.com`.

- Una página falsa copia el aspecto de Hivesigner, no su dirección. Lee la dirección entera: `hivesigner.com.example.net` no es hivesigner.com.
- Fíjate en si hay una palabra de más, una letra que falta o está cambiada, o una terminación distinta.
- Hivesigner muestra en su barra superior la dirección en la que se ejecuta. Una página falsa puede escribir ahí lo que quiera, así que fíate de la barra de direcciones del navegador.
- Para añadir una clave, escribe tú mismo la dirección o usa un marcador. No sigas un enlace de un mensaje, de un anuncio ni de un resultado de búsqueda.

## Lo que nunca hace falta dar {#never-needed}

- Iniciar sesión, publicar, votar, hacer operaciones de monedero y autorizar aplicaciones nunca requieren tu contraseña maestra ni tu clave de propietario. Consulta [Qué clave añadir](/docs/accounts#which-key).
- Las aplicaciones que usan Hivesigner nunca necesitan tus claves. Te envían a hivesigner.com. Tus claves se quedan en tu navegador. Un sitio que te pide escribir una clave en su propia página no te la está pidiendo a través de Hivesigner.
- Nunca des tus claves ni tu código de acceso a quien te los pida, ni en un chat, ni en un correo, ni en una petición de soporte.

## Añade solo las claves que necesites {#only-the-keys-you-need}

- Añade la clave de publicación para el uso diario.
- Añade la clave activa solo para operaciones de monedero, para autorizar una aplicación por primera vez o para revocar una aplicación.
- Evita añadir tu contraseña maestra. Si la añades, Hivesigner guarda todas las claves que se derivan de ella, incluida la de propietario.

Después de autorizar una aplicación por primera vez, la clave activa se queda en este dispositivo. Para conservar aquí solo la clave de publicación, [quita la cuenta](/docs/accounts#remove-account). Luego [añádela de nuevo](/docs/accounts#add-account) solo con la clave de publicación.

## Usa un código de acceso {#use-a-passcode}

Sin un código de acceso, Hivesigner guarda tus claves en este navegador sin cifrar. Las abre por sí mismo cada vez que arranca, así que cualquiera que use este navegador puede firmar en tu nombre. La página **Cuentas** marca esas cuentas con **Sin código de acceso**.

- Elige un código de acceso que los demás no puedan adivinar. Hivesigner acepta 4 caracteres o más. Cuanto más largo, más difícil de adivinar.
- No uses tu contraseña maestra de Hive ni una de tus claves como código de acceso.

En un ordenador que usan otras personas:

- Usa siempre un código de acceso.
- Cierra la pestaña de Hivesigner cuando termines. Una cuenta desbloqueada sigue desbloqueada en esa pestaña hasta que la cierras o la recargas.
- En un ordenador que no es tuyo, [quita la cuenta](/docs/accounts#remove-account) antes de irte. Mejor aún: no añadas ahí tus claves.

## Lee antes de aprobar {#read-before-approving}

- **Comprueba la cuenta.** La línea que dice «Iniciando sesión como», «Autorizando como» o «Firmando como» nombra la cuenta que responde. Cámbiala si no es la correcta.
- **Comprueba a dónde vas después.** «Te envía a HOST» y «Se te redirigirá a HOST.» nombran el sitio que recibe el resultado. Debe ser el sitio del que vienes.
- **Comprueba quién lo pide.** Una aplicación elige el nombre con el que se presenta. La línea «Cuenta de Hive @CUENTA_APP» muestra su cuenta real de Hive. En la página para autorizar o revocar una aplicación, Hivesigner dice sobre el perfil de la aplicación: «Todo lo anterior lo publica la propia cuenta de la aplicación. Hivesigner no verifica nada de ello.»
- **Comprueba la clave.** Un voto, una entrada o un seguimiento necesitan la clave de publicación. Si querías votar y la pantalla te pide la clave activa o la de propietario, la solicitud hace otra cosa. Detente.
- **Lee los cambios de autoridad.** «claves: NINGUNA (se elimina tu clave)» significa que el cambio quitaría tu clave de tu cuenta. Aprueba un cambio en tus claves solo si lo has iniciado tú.
- **Lee los avisos.** «Esta solicitud no actúa en nombre de @USUARIO, sino en nombre de @CUENTA.» significa que la solicitud actúa para otra cuenta.
- **Firma solo mensajes que entiendas.** Un mensaje firmado demuestra ante cualquiera que firmaste ese texto exacto.

Consulta [Revisar y firmar](/docs/signing) para ver todo lo que muestran las pantallas de firma.

## Reconoce una página falsa {#spot-a-fake-page}

Una página que parece Hivesigner es falsa cuando:

- **La dirección no es hivesigner.com.** Esta es la única señal que vale siempre.
- **Rechaza tu clave de publicación.** El Hivesigner real acepta la clave de publicación y te inicia sesión con ella. Una página que insiste en tu contraseña maestra o en tu clave de propietario no es Hivesigner.
- **No conoce las cuentas que añadiste.** Tu navegador mantiene separado el almacenamiento de cada sitio. Un sitio falso en otra dirección no puede ver las cuentas que añadiste en hivesigner.com, así que te pide una clave otra vez. El Hivesigner real las recuerda en este navegador y solo pide tu código de acceso, si pusiste uno. Pide una clave únicamente cuando una solicitud necesita una que este dispositivo no tiene, y entonces dice cuál. Por ejemplo: «Esto requiere tu clave activa, que @USUARIO no tiene aquí.»

Un navegador nuevo o un dispositivo nuevo tampoco tienen tus cuentas. Ahí, comprueba la dirección antes de añadir una.

Si escribiste una clave en una página falsa, dala por robada. Cámbiala en Hive cuanto antes.

## El código es abierto {#open-source}

El código de Hivesigner es público en [github.com/ecency/hivesigner-ui](https://github.com/ecency/hivesigner-ui). Cualquiera puede leerlo y comprobar cómo trata tus claves. Para informar de un problema, abre una incidencia en [github.com/ecency/hivesigner-ui/issues](https://github.com/ecency/hivesigner-ui/issues). La página **Acerca de** enlaza ahí como **Informar de un error**.
