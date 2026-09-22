Hivesigner firma con las claves de las cuentas de Hive que le añades. Añades una cuenta una vez en cada navegador que uses. Hivesigner guarda entonces sus claves en ese navegador, cifradas con un código de acceso si pones uno.

## Añadir una cuenta {#add-account}

1. Comprueba que la barra de direcciones de tu navegador muestra `https://hivesigner.com`. Consulta [Comprueba primero la dirección](/docs/safety#check-the-address).
2. Abre [hivesigner.com/import](https://hivesigner.com/import). Si este navegador aún no tiene ninguna cuenta, **Configurar Hivesigner** en la página de inicio abre el mismo formulario.
3. En **Nombre de usuario**, escribe tu nombre de usuario de Hive en minúsculas, sin la `@`.
4. En **Clave privada**, pega una de tus claves privadas. Consulta antes [Qué clave añadir](/docs/accounts#which-key).
5. Deja marcado **Proteger con un código de acceso (recomendado)** y elige un **Código de acceso**. Necesita al menos 4 caracteres. Consulta [Protégela con un código de acceso](/docs/accounts#passcode).
6. Selecciona **Añadir cuenta**.

Hivesigner comprueba la clave contra tu cuenta en la red de Hive antes de guardar nada. Compara la parte pública de la clave con las claves que tu cuenta declara. La clave privada en sí no se envía a ningún sitio. Si el nombre de usuario no es una cuenta de Hive, o la clave no le pertenece, el formulario dice «Nombre de usuario o clave no válidos. Usa tu contraseña maestra o tu clave de propietario, activa, de publicación o memo.»

La cuenta que añades pasa a ser la cuenta seleccionada: la que Hivesigner usa en sus pantallas. Si llegaste al formulario desde una solicitud, Hivesigner te devuelve a esa solicitud. Si no, abre la página **Cuentas**.

### Añadir otra clave a una cuenta {#add-a-key}

Para añadir una segunda clave a una cuenta que ya está aquí (por ejemplo, la clave activa junto a la de publicación), añade la cuenta otra vez con la clave nueva. Hivesigner conserva las claves que ya tiene y añade la nueva. Una clave nueva para un tipo que ya está aquí sustituye a la anterior.

Si la cuenta tiene un código de acceso, deja marcado **Proteger con un código de acceso (recomendado)** y escribe el mismo código. Hivesigner rechaza cualquier otra cosa:

- Sin código de acceso, el formulario dice «Esta cuenta está protegida en este dispositivo. Introduce su código de acceso para añadir la clave.»
- Con un código distinto, dice «Código de acceso incorrecto. La clave no se ha guardado.»

## Qué clave añadir {#which-key}

Una cuenta de Hive tiene varias claves privadas. Cada una permite acciones distintas. Las obtuviste del monedero o de la aplicación con la que creaste tu cuenta de Hive, normalmente en su página de claves o de contraseña. Hivesigner no puede mostrártelas.

| Clave | Para qué la usa Hivesigner |
| --- | --- |
| Publicación | Iniciar sesión en aplicaciones, votar, publicar y comentar, seguir, editar tu perfil y reclamar tus recompensas. |
| Activa | Operaciones de monedero como transferencias, power up o power down, delegaciones, ahorros y conversiones. Votos a testigos y a propuestas. Autorizar una aplicación por primera vez y revocar una aplicación. |
| Propietario | Cambiar tu clave de propietario o tu cuenta de recuperación. En el día a día no la necesitas. |
| Memo | Nada. El formulario la acepta, pero una cuenta que solo tiene la clave memo no puede iniciar sesión: la pantalla de la solicitud muestra entonces «Añade una clave de publicación o una clave activa de @USUARIO para continuar». |

Añade la clave de publicación para el uso diario. Añade la clave activa solo cuando la necesites para una operación de monedero o para autorizar una aplicación por primera vez. Cuando una pantalla necesita una clave que este dispositivo no tiene, lo dice y te deja añadirla.

Tu contraseña maestra también sirve en el campo **Clave privada**. Hivesigner deriva de ella tus claves y guarda todas las que aún coinciden con tu cuenta, incluida la de propietario. Añadir las claves por separado mantiene la clave de propietario fuera de este dispositivo.

> **Nota:** Hivesigner firma cada transacción exactamente con la clave que necesita. Esto sigue una regla de Hive vigente desde un hard fork de 2025. Una clave activa ya no puede firmar una acción de publicación como un voto. Una clave de propietario ya no puede firmar una operación de monedero. Añade la clave de publicación aunque la clave activa ya esté aquí.

Iniciar sesión en una aplicación es distinto: no es una transacción. Hivesigner te inicia sesión con la clave de publicación, o con la activa cuando este dispositivo no tiene la de publicación de esa cuenta.

## Protégela con un código de acceso {#passcode}

El código de acceso es una contraseña que eliges solo para este navegador. No es tu contraseña de Hive y no es ninguna de tus claves. Hivesigner lo usa para cifrar las claves de la cuenta antes de guardarlas. Te lo vuelve a pedir para descifrarlas.

- Hivesigner no guarda tu código de acceso ni lo envía a ningún sitio. Nadie puede recuperarlo por ti.
- Cada cuenta de este dispositivo tiene su propio código de acceso. Puedes usar el mismo para todas.
- Un código más largo es más difícil de adivinar. No uses tu contraseña maestra de Hive ni una de tus claves como código de acceso.

Sin código de acceso, Hivesigner guarda las claves de la cuenta en este navegador sin cifrar. Las abre por sí mismo cada vez que arranca, así que cualquiera que use este navegador puede firmar con ellas. La página **Cuentas** marca esas cuentas con **Sin código de acceso**.

Para poner un código de acceso a una cuenta que no lo tiene, añade la cuenta otra vez con una de sus claves y un código de acceso. Hivesigner cifra entonces todas las claves de la cuenta con ese código.

Para cambiar un código de acceso, [quita la cuenta](/docs/accounts#remove-account) y añádela de nuevo con el código nuevo. Quitarla borra de este navegador todas las claves de la cuenta, así que vuelve a añadir cada clave (la de publicación y luego la activa, si la usas).

## Desbloquear una cuenta {#unlock}

Una cuenta con código de acceso arranca bloqueada cada vez que se abre Hivesigner: en una pestaña nueva, después de recargar o cuando una aplicación te envía a él. No hace falta desbloquearla por adelantado. La pantalla que necesita las claves muestra un campo **Código de acceso** encima de su propio botón (por ejemplo **Iniciar sesión**, **Aprobar** o **Desbloquear**). Con un clic se desbloquea la cuenta y se continúa.

Un código incorrecto muestra «Código de acceso incorrecto.» y no se firma nada.

Hivesigner mantiene las claves desbloqueadas solo en memoria, nunca en el almacenamiento. La cuenta sigue desbloqueada en esa pestaña hasta que la cierras o la recargas.

## Cambiar de cuenta {#switch-accounts}

La página **Cuentas** enumera de la A a la Z las cuentas de este dispositivo. La cuenta seleccionada lleva una marca de verificación. A partir de 6 cuentas, un campo **Buscar cuentas** filtra la lista.

Selecciona una cuenta para convertirla en la cuenta seleccionada. Aquí Hivesigner no pide el código de acceso. Lo pide la pantalla que necesita las claves.

En la pantalla de una solicitud, la línea que nombra la cuenta («Iniciando sesión como», «Autorizando como» o «Firmando como») tiene un enlace **Cambiar de cuenta**. Abre la misma lista ahí mismo, así que puedes elegir otra cuenta sin salir de la solicitud. **Añadir otra cuenta**, debajo de la lista, abre el formulario **Añadir cuenta** y después te devuelve a la solicitud.

## Quitar una cuenta {#remove-account}

1. Abre la página **Cuentas**.
2. Selecciona la **✕** que hay junto a la cuenta. Su etiqueta para lectores de pantalla es **Quitar de Hivesigner @USUARIO**.
3. Confirma cuando el navegador pregunte «¿Quitar @USUARIO de este dispositivo? Se eliminarán las claves de esta cuenta guardadas aquí.»

Quitar una cuenta borra sus claves solo de este navegador. Tu cuenta de Hive no cambia. Las aplicaciones que autorizaste conservan su acceso, porque ese acceso está guardado en la cadena de bloques de Hive. Para retirarlo, consulta [Ver y retirar el acceso de una aplicación](/docs/signing-in#remove-access).

Si quitas la cuenta seleccionada, otra cuenta de este dispositivo pasa a ser la seleccionada.

Si el navegador no deja que Hivesigner guarde el cambio, verás «Se ha quitado solo durante esta sesión: el almacenamiento no está disponible, así que esta cuenta volverá a aparecer cuando recargues la página.»

## Si olvidas tu código de acceso {#forgotten-passcode}

Nadie puede recuperar un código de acceso, tampoco Hivesigner. Tu cuenta de Hive no se ve afectada: el código solo protege la copia de tus claves que hay en este navegador.

1. [Quita la cuenta](/docs/accounts#remove-account) de este dispositivo.
2. [Añádela de nuevo](/docs/accounts#add-account) con su clave y un código de acceso nuevo.

En la cadena de bloques de Hive no cambia nada. Las aplicaciones que autorizaste conservan su acceso.

## Dónde se guardan tus claves {#where-keys-are-stored}

Hivesigner guarda tus claves solo en este navegador, en este dispositivo, en el almacenamiento que el navegador reserva para hivesigner.com.

- No se sincronizan. Otro navegador, otro perfil del navegador u otro dispositivo no las tienen. Añade también ahí la cuenta.
- Borrar los datos del sitio o los datos de navegación de hivesigner.com las elimina. Cerrar una ventana privada, también.
- Hivesigner no es una copia de seguridad. Guarda tus claves o tu contraseña maestra a buen recaudo en otro sitio.
