Cuando una aplicación te deja iniciar sesión con Hivesigner, te envía a hivesigner.com con una solicitud. Hivesigner muestra quién la hace, qué pide y cuál de tus cuentas responde. Tú decides ahí. La aplicación nunca recibe tus claves: obtiene una prueba de tu nombre de usuario, firmada en tu navegador.

## La pantalla de la solicitud {#request-screen}

De arriba abajo, la pantalla muestra:

- **La aplicación.** Su imagen y un encabezado. Cuando la aplicación pide acceso de publicación por primera vez, el encabezado dice «APLICACIÓN solicita acceso a tu cuenta.» En los demás casos dice «Iniciar sesión en APLICACIÓN». El nombre que aparece ahí lo elige la aplicación.
- **Cuenta de Hive @CUENTA_APP.** La cuenta real de Hive de la aplicación. Una aplicación puede llamarse como quiera, pero no puede cambiar este nombre. Compruébalo.
- **Te envía a HOST.** El sitio al que Hivesigner te devuelve cuando apruebas.
- **Alcance.** Lo que pide la aplicación: [solo inicio de sesión o acceso de publicación](/docs/signing-in#scopes).
- **La línea de la cuenta.** «Autorizando como» o «Iniciando sesión como», con la cuenta que recibirá la aplicación y un enlace **Cambiar de cuenta**. Consulta [Elige la cuenta](/docs/signing-in#choose-account).
- **El botón.** **Autorizar** o **Iniciar sesión**. Si la cuenta está bloqueada, encima aparece un campo **Código de acceso**, y con un clic se desbloquea la cuenta y se continúa.
- **Cancelar.** Te lleva a tu página **Cuentas**. Hivesigner no envía nada a la aplicación.

Si este navegador aún no tiene ninguna cuenta, el botón dice **Continuar**. Abre el formulario **Añadir cuenta** y después te devuelve a la solicitud. Consulta [Añadir una cuenta](/docs/accounts#add-account).

## Solo inicio de sesión o acceso de publicación {#scopes}

Una aplicación pide una de estas dos cosas. No hay nada intermedio.

### Solo inicio de sesión {#sign-in-only}

**Alcance** muestra «Ver el nombre de usuario de tu cuenta». La aplicación sabe qué cuenta de Hive eres, confirmado por tu firma. No obtiene ningún permiso para actuar en tu nombre. El botón dice **Iniciar sesión**.

Un sitio que no tiene cuenta de Hive propia también puede pedirte iniciar sesión. Su pantalla dice «HOST quiere confirmar tu nombre de usuario de Hive.» Una solicitud así es siempre de solo inicio de sesión. Hivesigner nombra el sitio por su dirección, porque esa dirección es lo único que puedes comprobar sobre él.

### Acceso de publicación {#posting-access}

**Alcance** muestra «Con tu autoridad de publicación, APLICACIÓN podrá:» seguido de lo que eso significa:

- **Publicar y comentar:** publicar entradas y comentarios en tu nombre.
- **Votar:** votar a favor y en contra con tu cuenta.
- **Seguir y actualizar tu feed:** seguir, silenciar y republicar en tu nombre.

La autoridad de publicación es la parte de tu cuenta de Hive que controla las acciones del día a día. Al aprobar, añades la cuenta de Hive de la aplicación a tu autoridad de publicación. Es una sola concesión en la cadena de bloques de Hive, no una lista de permisos separados.

## Qué permite el acceso de publicación {#what-posting-access-allows}

Con acceso de publicación, la aplicación puede hacer en tu nombre todo lo que puede hacer tu clave de publicación:

- publicar, editar y borrar tus entradas y comentarios
- votar
- seguir, silenciar y republicar
- editar tu perfil
- reclamar tus recompensas en tu propio monedero
- otras acciones cotidianas que usan las aplicaciones y los juegos de Hive

Nunca puede:

- mover tus fondos: enviar HIVE o HBD, hacer power up o power down, delegar Hive Power o usar tus ahorros
- cambiar tus claves ni quién controla tu cuenta
- dar acceso a otras aplicaciones

> **Aviso:** Autoriza solo aplicaciones en las que confíes. El acceso de publicación dura hasta que lo revocas. Está guardado en la cadena de bloques de Hive, no en Hivesigner: quitar la cuenta de Hivesigner no lo termina.

## La primera vez que autorizas una aplicación {#first-time}

La primera vez que das acceso de publicación a una aplicación, la pantalla muestra este aviso: «Primera autorización: esto añade @CUENTA_APP a tu autoridad de publicación en la cadena de bloques y requiere tu clave activa una sola vez. Esa cuenta podrá publicar en tu nombre hasta que la revoques.»

Cambiar quién puede publicar por tu cuenta es un cambio en la cuenta misma, así que necesita tu clave activa. Si este dispositivo no la tiene, la pantalla te la pide ahí mismo:

1. Pega tu clave activa en **Clave activa o contraseña maestra de @USUARIO**. Hivesigner la comprueba contra tu cuenta en la red de Hive y la guarda en este dispositivo junto a tus otras claves. Si pegas tu contraseña maestra, Hivesigner conserva de ella solo la clave activa, más la de publicación cuando este dispositivo no la tiene.
2. Si la cuenta no tiene código de acceso, el formulario ofrece **Proteger con un código de acceso (recomendado)**, marcado por defecto. Si la cuenta tiene uno y Hivesigner lo necesita otra vez, el formulario lo pide en **Código de acceso de @USUARIO**.
3. Selecciona **Añadir clave activa** y después **Autorizar**.

Hivesigner envía entonces el cambio a la red de Hive desde tu navegador. Espera a que el cambio aparezca en la cadena de bloques antes de devolverte a la aplicación, con la sesión iniciada. Si eso tarda demasiado, verás «La autorización se ha enviado, pero aún se está confirmando. Vuelve a intentarlo en un momento.»

Después, la clave activa se queda en este dispositivo. Para conservar aquí solo la clave de publicación, consulta [Añade solo las claves que necesites](/docs/safety#only-the-keys-you-need).

## Autorizar una aplicación desde el directorio {#directory}

Cada aplicación de [hivesigner.com/apps](https://hivesigner.com/apps) abre una página titulada «Autorizar @CUENTA_APP». Muestra lo que la aplicación publica sobre sí misma y la frase «@CUENTA_APP podrá publicar, comentar, votar y seguir como @USUARIO.»

Seleccionar **Autorizar** da a la aplicación acceso de publicación al momento, igual que la pantalla de la primera vez. Necesita tu clave activa. Ninguna aplicación te ha pedido esto, así que úsalo solo cuando sea tu intención. **Cancelar** te lleva a tu página **Cuentas**.

Cuando tu cuenta ya dio acceso de publicación a la aplicación, la página dice «Se ha concedido la autorización a @CUENTA_APP.» y ofrece **Continuar**.

## Volver a una aplicación {#coming-back}

Cuando tu cuenta ya dio acceso de publicación a una aplicación, no se concede nada nuevo. La pantalla es más corta:

- El encabezado dice «Iniciar sesión en APLICACIÓN».
- Una línea dice «Ya autorizaste a @CUENTA_APP. No se concede ningún permiso nuevo.»
- La línea de la cuenta dice «Iniciando sesión como».
- El botón dice **Iniciar sesión**.

Para esto solo necesitas tu clave de publicación (o tu clave activa). Si revocaste la aplicación entretanto, vuelve a aparecer la pantalla de la primera vez.

## Elige la cuenta {#choose-account}

La línea de la cuenta nombra la cuenta que recibirá la aplicación. Compruébala antes de aprobar, sobre todo si tienes varias cuentas en este dispositivo.

- Selecciona **Cambiar de cuenta** para abrir ahí mismo la lista de tus cuentas. Elige otra y la pantalla pasa a esa cuenta.
- Selecciona **Añadir otra cuenta**, debajo de la lista, para añadir una cuenta que aún no está en este dispositivo. Hivesigner te devuelve después a la solicitud.

Una aplicación puede sugerir qué cuenta usar. Si esa cuenta está en este dispositivo, Hivesigner la selecciona. Aun así puedes cambiarla.

## Cuando Hivesigner rechaza una solicitud {#refused-requests}

Hivesigner no te deja aprobar una solicitud que no puede comprobar. La pantalla muestra en su lugar uno de estos mensajes:

| Mensaje | Qué significa |
| --- | --- |
| «La URL de redirección de esta aplicación no está registrada. Por tu seguridad, se ha bloqueado el inicio de sesión.» | La dirección de retorno no es una de las que la aplicación declaró en su cuenta de Hive. |
| «@CUENTA_APP no es una cuenta de Hive, así que no hay ninguna aplicación que autorizar. Vuelve al sitio e inténtalo de nuevo.» | La solicitud nombra una aplicación que no existe. |
| «Este sitio ha pedido que tu inicio de sesión se envíe a una dirección http:// sin cifrar. Hivesigner solo lo envía por https. Pide al sitio que use una dirección segura.» | La dirección de retorno no es segura. |
| «Este sitio ha pedido que tu inicio de sesión se envíe a una dirección que no es una URL web. Vuelve al sitio e inténtalo de nuevo.» | La dirección de retorno no es una dirección web. |
| «Esta solicitud de autorización está incompleta: no indica ninguna aplicación o ninguna URL de redirección. Vuelve a la aplicación e inténtalo de nuevo.» | A la solicitud le faltan partes. |

Vuelve a la aplicación e inténtalo de nuevo. Si el problema sigue, selecciona **Informar de este problema**. Envía el enlace y tu nota opcional al equipo de Hivesigner, con los secretos ocultos.

Si Hivesigner no puede llegar a la red de Hive, muestra «No se han podido cargar los datos de la cuenta desde la red de Hive.» Selecciona **Reintentar**.

## Ver y retirar el acceso de una aplicación {#remove-access}

1. Abre [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps). El pie de página enlaza ahí como **Aplicaciones autorizadas**.
2. La página muestra «Aplicaciones que pueden publicar como @USUARIO.» para la cuenta seleccionada, con cada aplicación debajo. Para ver las aplicaciones de otra cuenta, selecciónala antes en la página **Cuentas**.
3. Si la cuenta está bloqueada, escribe su código de acceso y selecciona **Desbloquear**.
4. Selecciona **Revocar** junto a la aplicación. Cuando la clave activa está en este dispositivo, esto retira el acceso de la aplicación de inmediato.

La lista muestra todas las cuentas que pueden publicar como la tuya por sí solas, incluidas las que hayas añadido con otras herramientas.

Revocar es un cambio en tu cuenta en la cadena de bloques de Hive, así que necesita tu clave activa una vez. Si este dispositivo no la tiene, **Revocar** abre una página para esa aplicación («Revocar @CUENTA_APP») que pide ahí mismo la clave activa. Dice «@CUENTA_APP ya no podrá actuar como @USUARIO.» Añade la clave y selecciona **Revocar**.

Cuando revocas una aplicación, Hivesigner quita la cuenta de la aplicación de la autoridad de publicación de tu cuenta (y de su autoridad activa, si está ahí). A partir de ese momento la aplicación ya no puede publicar, votar ni actuar en tu nombre. Si la aplicación vuelve a pedir acceso de publicación más adelante, verás la pantalla de la primera vez.

Revocar no cierra tu sesión en el sitio web de la aplicación. Cierra sesión ahí también si quieres.
