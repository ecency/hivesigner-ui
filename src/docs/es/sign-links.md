Un enlace de firma abre una transacción de Hive en Hivesigner. La persona la revisa, la aprueba con su propia clave y Hivesigner la transmite desde su navegador. Después Hivesigner puede devolver a la persona a tu aplicación con el identificador de la transacción. Los enlaces de firma no necesitan cuenta de aplicación ni token. Cubren las 41 operaciones que Hivesigner admite, incluidas las transferencias y otras acciones que requieren la clave activa.

## Cómo funciona un enlace de firma {#how-it-works}

1. Tu aplicación construye un enlace que lleva una o varias operaciones.
2. La persona abre el enlace. Hivesigner muestra cada operación en palabras claras en la pantalla "Confirmar transacción", con la clave que necesita.
3. La persona aprueba. Hivesigner firma la transacción en el navegador con la clave de la cuenta seleccionada en Hivesigner. Después envía la transacción a la red Hive.
4. Cuando el enlace nombra una URL de retorno, Hivesigner envía allí a la persona con el identificador de la transacción.

Tu aplicación nunca ve ninguna clave. Cualquier sitio puede crear un enlace de firma: no hay ningún `client_id` que enviar.

## Formas de enlace {#link-forms}

Hivesigner lee dos tipos de enlaces de firma: enlaces codificados y enlaces antiguos.

### Enlaces codificados {#encoded-links}

Un enlace codificado lleva las operaciones como JSON, codificadas en base64url. Usa el formato `hive://sign/...` del paquete `hive-uri`, con `hive://` sustituido por `https://hivesigner.com/`.

| Forma | Lo que contiene `B64U` |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Una operación: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Una lista de operaciones: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Una transacción entera, con su propia cabecera |

`B64U` es el texto JSON, codificado como UTF-8 y después como base64 con `+` sustituido por `-`, `/` por `_` y el relleno `=` por `.`.

Para `op` y `ops`, Hivesigner construye la transacción alrededor de las operaciones. Rellena el bloque de referencia y la expiración.

Para `tx`, Hivesigner conserva el `ref_block_num`, el `ref_block_prefix` y la `expiration` propios de la transacción. También conserva las firmas que la transacción ya lleva. Esto permite que varias cuentas firmen una misma transacción por turnos, para una cuenta que controlan varias personas. Hivesigner rechaza una transacción cuya lista `extensions` no está vacía.

> **Nota:** Hivesigner normaliza algunos valores antes de firmar, como los importes y los campos dejados en sus valores por defecto. La transacción firmada puede tener entonces un identificador distinto del que construiste. Lee el identificador desde la URL de retorno.

### Enlaces antiguos {#legacy-links}

Un enlace antiguo nombra una operación en la ruta y pone sus campos en la consulta:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Escribe el nombre de la operación en snake case (`transfer_to_vesting`), camel case (`transferToVesting`) o kebab case (`transfer-to-vesting`).
- Da cada campo como parámetro de consulta con el nombre del campo. Codifica en URL cada valor.
- Escribe las listas y los objetos como JSON, por ejemplo `required_posting_auths=["alice"]`. Una lista de identificadores o nombres también puede separarse por comas: `proposal_ids=379,380`.
- Escribe los booleanos como `true` o `false`.

Un enlace antiguo lleva una sola operación. Usa un enlace codificado para más de una.

### Valores de los campos {#field-values}

Estas reglas valen para todas las formas:

- **Valores por defecto.** Un campo que omites toma su valor por defecto. La cuenta que actúa (`voter`, `from`, `owner` y campos parecidos) toma por defecto la cuenta que firma. El `weight` de un voto toma por defecto `10000` (100%).
- **Los importes** son un número y un símbolo: `1.000 HIVE`, `0.500 HBD` o `100.000000 VESTS`. Hivesigner escribe HIVE y HBD con 3 decimales y VESTS con 6.
- **Hive Power.** Un campo que acepta VESTS también acepta un importe en HP, como `100 HP`. Hivesigner lo convierte a VESTS al cambio actual antes de que la persona pueda aprobar.
- **`__signer`** en cualquier valor pasa a ser el nombre de la cuenta que firma. Por ejemplo, un `custom_json` de seguimiento puede nombrar `__signer` como seguidor dentro de su `json`.
- **Los enteros** deben ser números enteros dentro del rango que la cadena acepta, como `-10000` a `10000` para el `weight` de un voto.

Hivesigner rechaza el enlace entero cuando un valor no encaja en su campo, cuando una operación es desconocida o cuando el enlace no lleva ninguna operación. La persona ve "Vaya, algo ha salido mal. Los datos proporcionados no son válidos." y no se firma nada.

## Parámetros {#parameters}

Añade estos a la cadena de consulta de cualquier enlace de firma:

| Parámetro | Significado |
| --- | --- |
| `cb` | La URL de retorno, codificada en base64url. Esto es lo que `hive-uri` escribe para su opción `callback`. |
| `redirect_uri` | La URL de retorno como texto normal codificado en URL. Los enlaces antiguos usan este. Un enlace codificado lo usa cuando no tiene `cb`. |
| `nb` | Solo firmar. Hivesigner firma la transacción sin transmitirla. Pon `{{sig}}` en la URL de retorno para recibir la firma (consulta [Marcadores de la URL de retorno](#callback-placeholders)). Cualquier valor sirve, incluso uno vacío (`nb=`). |
| `s` | La cuenta que debe firmar. Cuando hay otra cuenta seleccionada, Hivesigner pide a la persona que cambie a esta. No firma con ninguna otra cuenta. |

Usa una URL de retorno `https://`. Hivesigner ignora una URL de retorno que no sea una URL `http` o `https` y se queda entonces en su propia pantalla de resultado.

Hivesigner elige la clave a partir de las operaciones. No hay ningún parámetro para elegirla: Hivesigner ignora `authority` (y el parámetro `a` de `hive-uri`) en los enlaces de firma. Consulta [Qué clave necesita un enlace](#which-key).

### Marcadores de la URL de retorno {#callback-placeholders}

Después de que la persona apruebe, Hivesigner rellena estos marcadores en la URL de retorno:

| Marcador | Valor |
| --- | --- |
| `{{id}}` | El identificador de la transacción |
| `{{sig}}` | La firma, para un enlace de solo firma (`nb`) |
| `{{block}}` | Se deja vacío |
| `{{txn}}` | Se deja vacío |
| `{{data}}` | Se deja vacío |

Una URL de retorno sin ninguno de estos marcadores recibe el identificador de la transacción añadido como `id`, después de `?` o `&`:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner redirige en cuanto un nodo de Hive acepta la transacción. Puede que la transacción todavía no esté en un bloque. Búscala por su identificador cuando necesites saber que se incluyó.

Tu URL de retorno no se llama cuando la red rechaza la transacción (la persona ve el error) ni cuando la persona se va sin aprobar.

## Construye un enlace {#build-a-link}

### Con hive-uri {#with-hive-uri}

El paquete `hive-uri` (https://www.npmjs.com/package/hive-uri) codifica operaciones en enlaces. Usa la versión 0.2.8 o posterior, que codifica correctamente cualquier texto Unicode.

```bash
npm install hive-uri
```

```js
import { encodeOp, encodeOps } from 'hive-uri';

// One vote. __signer becomes the account that signs.
const vote = encodeOp(
  ['vote', { voter: '__signer', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
  { callback: 'https://YOUR_APP/voted?tx={{id}}' },
);

// Two transfers in one transaction.
const payout = encodeOps(
  [
    ['transfer', { from: '__signer', to: 'RECIPIENT_1', amount: '1.000 HIVE', memo: 'MEMO' }],
    ['transfer', { from: '__signer', to: 'RECIPIENT_2', amount: '2.000 HIVE', memo: 'MEMO' }],
  ],
  { callback: 'https://YOUR_APP/paid' },
);

const voteLink = vote.replace('hive://', 'https://hivesigner.com/');
const payoutLink = payout.replace('hive://', 'https://hivesigner.com/');
```

El objeto de opciones acepta `callback` (se escribe como `cb`), `no_broadcast: true` (se escribe como `nb`) y `signer` (se escribe como `s`). `encodeTx` hace lo mismo para una transacción entera.

### Con el SDK de JavaScript {#with-the-sdk}

El paquete `hivesigner` tiene `sendOperation`, `sendOperations` y `sendTransaction`. Toman los mismos argumentos que los codificadores de `hive-uri` y devuelven el enlace `https://hivesigner.com/sign/...`:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

En TypeScript los tipos exigen el tercer argumento: pasa `undefined` para recibir el enlace. En un navegador, una función pasada como tercer argumento hace que abran el enlace en una pestaña nueva en lugar de devolverlo. Consulta [SDK](/docs/sdk#sign-links).

### Sin código {#signs-page}

https://hivesigner.com/signs ("Firmar transacción") lista todas las operaciones admitidas con un formulario para sus campos. Construye un enlace `/sign/op/` y lo abre.

## Qué clave necesita un enlace {#which-key}

Cada operación necesita una clave: de publicación, activa o de propietario. La [tabla de abajo](#supported-operations) las lista. Tres operaciones dependen de sus valores:

- `custom_json` necesita la clave activa cuando `required_auths` nombra una cuenta. Si no, necesita la clave de publicación.
- `account_update` necesita la clave de propietario cuando define `owner`. Si no, necesita la clave activa.
- `account_update2` necesita la clave de propietario cuando define `owner`. Necesita la clave activa cuando define `active`, `posting`, `memo_key` o `json_metadata`. Solo con `posting_json_metadata`, necesita la clave de publicación.

Hivesigner firma un enlace con una sola clave, así que todas las operaciones de un enlace deben necesitar la misma. Hivesigner se niega a firmar un enlace que las mezcle y le dice a la persona por qué. Envía esas operaciones en enlaces separados.

Cuando la cuenta seleccionada no tiene la clave en el dispositivo, Hivesigner dice qué clave falta y ofrece añadirla. Consulta [Cuando falta la clave](/docs/signing#missing-key).

## Lo que ve la persona {#what-the-user-sees}

- Una pantalla titulada "Confirmar transacción", con una tarjeta por cada operación: un resumen en palabras claras, la clave que necesita y los valores que lleva.
- "Se te redirigirá a HOST." cuando el enlace tiene una URL de retorno. Usa una URL de retorno en tu propio sitio, para que las personas reconozcan el host.
- Un aviso cuando una operación actúa como una cuenta distinta de la que firma.
- **Aprobar**, o **Firmar** para un enlace de solo firma. Una cuenta bloqueada pide antes su código de acceso.
- Después de transmitir, "Transacción transmitida correctamente" con el identificador de la transacción. Después, la redirección a tu URL de retorno.

[Revisar y firmar](/docs/signing#confirm-screen) describe la pantalla para las personas.

## Operaciones admitidas {#supported-operations}

Hivesigner firma estas 41 operaciones, por sus nombres en la cadena. Cualquier otra se rechaza. El nombre es el que Hivesigner muestra en la pantalla de confirmación.

| Operación | Clave | Nombre |
| --- | --- | --- |
| `transfer` | Activa | Transferencia |
| `recurrent_transfer` | Activa | Transferencia recurrente |
| `delegate_vesting_shares` | Activa | Delegar Hive Power |
| `transfer_to_vesting` | Activa | Power up |
| `set_withdraw_vesting_route` | Activa | Definir ruta de power down |
| `withdraw_vesting` | Activa | Power down |
| `transfer_to_savings` | Activa | Transferir a ahorros |
| `transfer_from_savings` | Activa | Transferir desde ahorros |
| `cancel_transfer_from_savings` | Activa | Cancelar transferencia desde ahorros |
| `convert` | Activa | Convertir HBD a HIVE |
| `collateralized_convert` | Activa | Convertir HIVE a HBD |
| `account_witness_vote` | Activa | Voto a testigo |
| `witness_update` | Activa | Actualización de testigo |
| `witness_set_properties` | Activa | Definir propiedades de testigo |
| `account_witness_proxy` | Activa | Proxy de gobernanza |
| `claim_account` | Activa | Reclamar crédito de cuenta |
| `account_create` | Activa | Crear cuenta |
| `create_claimed_account` | Activa | Crear cuenta con créditos de cuenta |
| `vote` | Publicación | Voto |
| `limit_order_create` | Activa | Crear orden límite |
| `limit_order_create2` | Activa | Crear orden límite |
| `limit_order_cancel` | Activa | Cancelar orden límite |
| `claim_reward_balance` | Publicación | Reclamar recompensas |
| `comment` | Publicación | Publicación o comentario |
| `comment_options` | Publicación | Opciones de publicación o comentario |
| `custom_json` | Publicación, o Activa cuando `required_auths` está definido | Operación personalizada |
| `delete_comment` | Publicación | Eliminar comentario |
| `account_update` | Activa, o Propietario cuando `owner` está definido | Actualizar cuenta (activa) |
| `account_update2` | Publicación, Activa o Propietario, según el campo | Actualizar cuenta (publicación) |
| `change_recovery_account` | Propietario | Cambiar cuenta de recuperación |
| `create_proposal` | Activa | Crear propuesta |
| `remove_proposal` | Activa | Eliminar propuesta |
| `update_proposal_votes` | Activa | Actualizar votos de propuestas |
| `update_proposal` | Activa | Actualizar propuesta |
| `escrow_transfer` | Activa | Transferencia en fideicomiso |
| `escrow_approve` | Activa | Aprobar fideicomiso |
| `escrow_dispute` | Activa | Disputa de fideicomiso |
| `escrow_release` | Activa | Liberar fideicomiso |
| `account_create_with_delegation` | Activa | Crear cuenta con delegación |
| `request_account_recovery` | Activa | Solicitar recuperación de cuenta |
| `recover_account` | Propietario | Recuperar cuenta |
