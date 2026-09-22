Las aplicaciones pueden pedirte que firmes una transacción de Hive, como un voto, una transferencia o una entrada. Te envían un enlace que abre Hivesigner. Hivesigner muestra en palabras claras lo que hace la solicitud, qué clave necesita y a dónde te envía después. No se firma nada hasta que lo apruebas. Las aplicaciones también pueden pedirte que firmes un mensaje, que nunca llega a la cadena de bloques.

## La pantalla Confirmar transacción {#confirm-screen}

Un enlace de firma abre una pantalla titulada «Confirmar transacción». Muestra una tarjeta por cada operación de la solicitud. Una operación es una acción en Hive, como un voto o una transferencia.

Cuando una solicitud lleva más de una operación, las tarjetas van numeradas y una línea encima dice «Esta solicitud contiene 3 operaciones. Revísalas todas antes de aprobar.»

### El resumen {#summary}

Cada tarjeta empieza con una frase que dice lo que hace la operación, con los valores de la solicitud. Por ejemplo:

| Operación | Lo que dice la tarjeta |
| --- | --- |
| Una transferencia | Enviar 1.000 HIVE a @bob (y debajo el memo, como Memo: ...) |
| Un voto | Voto positivo a @alice/mi-entrada (y debajo el peso del voto, como 100%) |
| Una entrada o una respuesta | Publicar la entrada «Mi título», o Responder a @alice/mi-entrada |
| Una acción que define una aplicación de Hive | Acción personalizada (follow) |
| Un cambio en quién controla una cuenta | Actualizar las autoridades de la cuenta |

Otras operaciones muestran su nombre, como «Power up» o «Delegar Hive Power».

Junto a la frase, una etiqueta en mayúsculas indica la clave que necesita la operación: PUBLICACIÓN, ACTIVA o PROPIETARIO.

### Los detalles {#details}

Debajo de la frase, la tarjeta enumera los valores que lleva la operación:

- la cuenta en cuyo nombre actúa la operación
- para una entrada o un comentario: el enlace permanente (la dirección de la entrada), la comunidad o etiqueta, el cuerpo y los metadatos
- para una acción personalizada: todos los valores de sus datos, uno por línea, para que no se corte nada
- para un cambio de autoridades: el umbral, las claves y las cuentas que establece

Un cambio de autoridades también avisa cuando quitaría tus claves, con «claves: NINGUNA (se elimina tu clave)». Un umbral que falta se muestra como «umbral NO DEFINIDO (se trata como 0)».

En el resumen y en los detalles, los caracteres que podrían ocultar texto o cambiar su dirección se muestran como `�`. Lo que lees no puede fingir ser otra cosa.

**Mostrar operación en bruto** (o **Mostrar operaciones en bruto**) abre las operaciones exactas que se van a firmar.

Cuando una cantidad se da en Hive Power, Hivesigner la convierte al tipo actual. Muestra «Cargando la tasa actual de Hive Power…» y espera a tener ese dato antes de dejarte aprobar.

Algunas solicitudes llevan una transacción preparada en otro sitio, por ejemplo para una cuenta que controlan varias personas. La pantalla dice entonces «Esta solicitud incluye su propio encabezado de transacción. Caduca: FECHA.» Si ya la firmaron otras personas, añade «Ya lleva 2 firmas.»

## Qué clave necesita {#which-key}

Debajo de las tarjetas, una línea nombra la clave que necesita toda la solicitud: «Se firma con tu clave de publicación», «Se firma con tu clave activa» o «Se firma con tu clave de propietario».

Hivesigner firma exactamente con esa clave. Una clave activa no puede firmar un voto y una clave de propietario no puede firmar una transferencia. Es una regla de Hive desde un hard fork de 2025. Consulta [Qué clave añadir](/docs/accounts#which-key).

Todas las operaciones de una misma solicitud deben necesitar la misma clave. Cuando no es así, la línea dice «Esta transacción necesita más de una autoridad y no se puede firmar con una sola clave.» No hay ningún botón para aprobarla. Vuelve a la aplicación.

Las solicitudes con clave de propietario son poco frecuentes. Cambian quién puede controlar o recuperar tu cuenta. Léelas dos veces. Consulta [Lee antes de aprobar](/docs/safety#read-before-approving).

### Cuando falta la clave {#missing-key}

Si la cuenta seleccionada no tiene la clave en este dispositivo, la pantalla lo dice. Por ejemplo: «Esto requiere tu clave activa, que @USUARIO no tiene aquí.»

1. Selecciona **Añadir otra cuenta** debajo del mensaje. Abre el formulario **Añadir cuenta**.
2. Escribe el mismo nombre de usuario y la clave que falta. Si la cuenta tiene un código de acceso, escríbelo también.
3. Selecciona **Añadir cuenta**. Hivesigner añade la clave y te devuelve a la solicitud.

Si la cuenta está bloqueada, la pantalla muestra un campo **Código de acceso** encima del botón. Con un clic se desbloquea la cuenta y se aprueba. Si resulta que falta la clave, la pantalla te lo dice después del desbloqueo.

Si este navegador aún no tiene ninguna cuenta, el botón dice **Continuar** y abre el formulario **Añadir cuenta**.

## Aprobar o firmar {#approve}

La línea de la cuenta, encima del botón, dice «Firmando como» con la cuenta que firma. **Cambiar de cuenta** te deja elegir otra. Consulta [Cambiar de cuenta](/docs/accounts#switch-accounts).

- **Aprobar** firma la transacción en tu navegador y la envía a la red de Hive. El resultado dice «Transacción transmitida correctamente» con un **ID de transacción** que abre la transacción en un explorador de bloques.
- **Firmar** aparece en su lugar cuando la solicitud solo pide una firma. Hivesigner firma la transacción sin enviarla a la red. Entrega la firma a la aplicación, o la muestra cuando la solicitud no nombra ningún sitio.

Si la red rechaza la transacción, verás «Tu transacción no se ha transmitido» con el «Mensaje de error» que dio la red. Puedes volver a intentarlo.

## El sitio al que vuelves {#return-site}

Cuando la solicitud nombra un sitio al que volver, un aviso en la parte superior dice «Se te redirigirá a HOST.» Después de aprobar, Hivesigner te envía ahí. Comprueba que HOST es el sitio del que viniste.

Cuando la solicitud no nombra ningún sitio, Hivesigner se queda en el resultado.

## Una solicitud para otra cuenta {#another-account}

Una solicitud puede estar hecha para una cuenta distinta de la seleccionada. Hivesigner lo muestra de dos maneras.

**La solicitud debe firmarla otra cuenta.** La pantalla dice «Esta solicitud debe firmarla @CUENTA. Cambia a esa cuenta.» La línea de la cuenta dice «Cuenta seleccionada» y debajo se abre la lista de cuentas. Elige esa cuenta, o añádela con **Añadir otra cuenta**. Hivesigner no firma la solicitud con ninguna otra cuenta.

**Una operación actúa en nombre de otra cuenta.** Esto pasa con cuentas que gestionan varias personas. Un aviso en la parte superior dice «Esta solicitud no actúa en nombre de @USUARIO, sino en nombre de @CUENTA. Continúa solo si administras esa cuenta.» Los detalles de cada tarjeta nombran la cuenta en cuyo nombre actúa.

## Solicitudes que Hivesigner no puede leer {#invalid-requests}

Hivesigner nunca firma una solicitud que no puede leer y mostrarte por completo. Eso incluye una operación que no conoce, una solicitud sin operaciones, un valor que no encaja con la operación (un número que no es un número, una cantidad mal formada) y datos de más que no puede mostrar.

La pantalla dice entonces «Vaya, algo ha salido mal. Los datos proporcionados no son válidos.» Vuelve a la aplicación. Para avisar al equipo de Hivesigner, selecciona **Informar de este problema**.

## Solicitudes de firma de mensajes {#message-requests}

Algunas aplicaciones te piden firmar un mensaje en lugar de una transacción, por ejemplo para demostrar que eres el titular de una cuenta. Un mensaje es texto. Firmarlo no cambia nada en la cadena de bloques.

La pantalla muestra:

- Un encabezado como «APLICACIÓN te pide que firmes un mensaje.» Cuando la aplicación tiene cuenta de Hive, la línea de debajo la nombra: «Cuenta de Hive @CUENTA_APP».
- «Te envía a HOST»: el sitio que recibe la firma. La misma línea aparece otra vez junto al botón.
- **Mensaje**: el texto completo, exactamente como se firmará. Los caracteres que podrían ocultar texto o cambiar su dirección se muestran como códigos resaltados, como `\u{200B}`.
- La clave que usa: «Se firma con tu clave de publicación» o «Se firma con tu clave activa». Hivesigner nunca firma un mensaje con la clave de propietario.
- Un aviso: «Tu firma demuestra a cualquiera que la vea que @USUARIO firmó exactamente este texto. Firma solo un mensaje que entiendas.»
- La línea de la cuenta, «Firmando como», con **Cambiar de cuenta**.

Selecciona **Firmar** para firmar. Hivesigner te devuelve al sitio con la firma, tu nombre de usuario, el tipo de clave y la clave pública que hizo la firma. Una clave pública es la mitad compartible de un par de claves: no puede firmar nada.

Selecciona **Cancelar** para ir a tu página **Cuentas**. El sitio no recibe nada.

Si la cuenta no tiene la clave en este dispositivo, la pantalla lo dice. Por ejemplo: «Esto requiere tu clave de publicación, que @USUARIO no tiene aquí.» Selecciona **Cambiar de cuenta** y después **Añadir otra cuenta**. [Añade la clave que falta](/docs/accounts#add-a-key) a esa misma cuenta. Hivesigner te devuelve a la solicitud.

### Por qué se rechazan algunos mensajes {#refused-messages}

**Un mensaje que sirve como inicio de sesión de Hivesigner.** Cierto texto tiene la forma exacta de un inicio de sesión de Hivesigner. Firmarlo daría al sitio acceso a tu cuenta. Hivesigner nunca firma ese texto y dice «Este mensaje es un token de Hivesigner. Firmarlo daría al sitio acceso a tu cuenta, así que no se puede firmar.»

**Una solicitud que Hivesigner no puede usar.** Hivesigner rechaza una solicitud sin mensaje o sin dirección de retorno. También rechaza una solicitud que pide una clave que no sea la de publicación o la activa, una que nombra una aplicación que no es una cuenta de Hive, o una cuya dirección de retorno no es segura o no está registrada para la aplicación. Dice «Esta solicitud de firma no se puede usar: necesita un mensaje, una clave de publicación o activa y una URL de redirección segura registrada para la aplicación. Vuelve al sitio e inténtalo de nuevo.»

Si Hivesigner no puede leer los datos de la aplicación en la red de Hive, dice «No se han podido cargar los datos de la cuenta desde la red de Hive.» No firma nada hasta que puede. Selecciona **Reintentar**.

## Firmar un mensaje por tu cuenta {#sign-message}

Puedes firmar un mensaje por tu cuenta para demostrar que controlas una cuenta.

1. Abre [hivesigner.com/signmessage](https://hivesigner.com/signmessage). El pie de página enlaza ahí como **Firmar mensaje**.
2. Si la cuenta seleccionada está bloqueada, escribe su código de acceso y selecciona **Desbloquear**. Si no hay ninguna cuenta seleccionada, la página enlaza con tus cuentas.
3. Escribe el texto en **Mensaje**. Hivesigner quita los espacios y los saltos de línea del principio y del final.
4. Elige la clave en **Clave para firmar**. Ahí se enumeran las claves que la cuenta seleccionada tiene en este dispositivo, de la más fuerte a la más débil. La más fuerte viene elegida de entrada. Cámbiala a **Publicación** salvo que necesites otra.
5. Selecciona **Firmar mensaje**.

El **Resumen de la firma** muestra el **Autor**, la **Autoridad usada**, un **Token de verificación** y un **Enlace de verificación**. El token de verificación reúne en un solo texto el mensaje, tu nombre de usuario y la firma. Comparte el enlace o el token con quien deba comprobar el mensaje.

Una firma no revela tu clave. Sí muestra qué clave la hizo.

## Verificar un mensaje {#verify-message}

1. Abre [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage). El pie de página enlaza ahí como **Verificar mensaje**.
2. Pega el token en **Token de verificación** y selecciona **Verificar firma**.

Un enlace de verificación abre esta página y comprueba el mensaje por sí solo.

El resultado dice «La firma es válida para USUARIO» o «No se ha podido verificar la firma con las claves de la cuenta.» Debajo verás el **Autor**, la **Clave pública recuperada**, la **Autoridad coincidente** (el tipo de clave que firmó) y el **Mensaje**.

Hivesigner comprueba la firma contra las claves que la cuenta tiene ahora en la red de Hive. Un mensaje firmado con una clave que la cuenta ha sustituido desde entonces ya no se verifica.
