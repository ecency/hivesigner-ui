Seu aplicativo pode pedir que a pessoa assine uma mensagem de texto com a chave de postagem ou ativa dela. A assinatura prova que ela controla a conta. Nada é transmitido: a mensagem nunca chega à blockchain. O Hivesigner assina do mesmo jeito que o `requestSignBuffer` do Hive Keychain, então o código de servidor que confere uma assinatura do Keychain também confere uma do Hivesigner.

## Pedir uma assinatura {#request}

Mande a pessoa para `https://hivesigner.com/sign-buffer` com estes parâmetros de consulta:

| Parâmetro | Obrigatório | Significado |
| --- | --- | --- |
| `message` | Sim | O texto exato a assinar. Precisa ter mais do que espaços. |
| `redirect_uri` | Sim | Para onde o Hivesigner manda o resultado. Veja [Regras da URL de retorno](#callback-rules). |
| `authority` | Não | `posting` ou `active`, com qualquer combinação de maiúsculas (`Posting` também serve). `posting` quando falta ou está vazio. Qualquer outro valor é recusado. |
| `client_id` | Não | A conta do seu aplicativo. `clientId` também é lido. Com ele, `redirect_uri` precisa ser uma das URLs de retorno do seu aplicativo. |
| `state` | Não | Qualquer valor. O Hivesigner o devolve sem alteração. |
| `account` | Não | A conta de que você espera a assinatura. O Hivesigner a seleciona quando está no dispositivo e a ignora caso contrário. `select_account` também é lido. |

Monte a URL com `URLSearchParams`, para que cada valor seja codificado:

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

### Regras da URL de retorno {#callback-rules}

- A URL de retorno precisa ser `https://`. O `http://` simples só funciona em loopback: `localhost`, `127.0.0.1` ou `[::1]`.
- **Com `client_id`**, a URL de retorno precisa estar registrada naquela conta de aplicativo, conferida como no login. Veja [URLs de retorno](/docs/register-app#callback-rules). O Hivesigner lê as URLs de retorno do aplicativo no Hive quando a solicitação se abre e não assina nada antes de lê-las. Quando o Hive está fora de alcance, a pessoa recebe um botão **Tentar novamente**.
- **Sem `client_id`**, qualquer URL de retorno que siga a primeira regra serve. O Hivesigner então indica o host dessa URL como quem pede, por exemplo «HOST pede que você assine uma mensagem.».

Envie `client_id` quando você tiver uma conta de aplicativo. A pessoa passa a ver o nome e a conta do seu aplicativo. Só as suas URLs de retorno registradas podem receber a assinatura.

O Hivesigner recusa uma solicitação sem mensagem, com `authority` desconhecido, com URL de retorno ausente ou inutilizável, com `client_id` que não é conta do Hive ou com URL de retorno não registrada naquele aplicativo. A pessoa vê «Esta solicitação de assinatura não pode ser usada: ela precisa de uma mensagem, uma chave de postagem ou ativa e uma URL de redirecionamento segura registrada para o aplicativo. Volte ao site e tente novamente.» e um botão **Relatar este problema**.

### O que a pessoa vê {#what-the-user-sees}

- Um título que nomeia seu aplicativo (ou o host da URL de retorno) e «Leva você para HOST».
- A mensagem inteira, exatamente como será assinada. Caracteres que poderiam esconder texto ou mudar a direção dele aparecem como códigos, tipo `\u{200B}`.
- «Será assinada com sua chave de postagem» ou «Será assinada com sua chave ativa».
- Um aviso: «Sua assinatura prova a qualquer pessoa que a veja que @USERNAME assinou exatamente este texto. Assine apenas uma mensagem que você entenda.»
- **Assinar** e **Cancelar**. Uma conta bloqueada pede antes o código de acesso.

[Solicitações de assinatura de mensagem](/docs/signing#message-requests) descrevem essa tela para os usuários.

## O que a sua URL de retorno recebe {#callback}

Quando a pessoa escolhe **Assinar**, o Hivesigner a manda à sua URL de retorno com estes parâmetros de consulta:

| Parâmetro | Valor |
| --- | --- |
| `signature` | A assinatura, como texto hexadecimal de 130 caracteres |
| `public_key` | A chave pública da chave que assinou, tipo `STM...` |
| `username` | A conta que assinou |
| `authority` | `posting` ou `active` |
| `state` | Seu `state`, sempre que a solicitação tinha um (inclusive vazio) |

O Hivesigner os acrescenta à consulta da sua URL, depois de `?` ou `&` e antes de qualquer `#fragment`. Sua própria consulta continua como está.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Quando a pessoa escolhe **Cancelar**, o Hivesigner abre a lista de contas dela. Sua URL de retorno não recebe nada.

> **Aviso:** Qualquer um pode abrir a sua URL de retorno com valores inventados. Trate cada parâmetro como afirmação até o seu servidor conferir a assinatura.

## Verificar a assinatura {#verify}

Confira a assinatura no seu servidor:

1. Guarde no seu servidor a mensagem que você pediu, junto com o `state` dela. Não confie numa cópia que volta do navegador.
2. Calcule o hash da mensagem: sha256 sobre os bytes UTF-8 dela.
3. Recupere a chave pública a partir da assinatura e desse hash.
4. Carregue a conta do Hive. Confira que a chave recuperada pertence à autoridade que você pediu, com peso suficiente para assinar sozinha.
5. Confira que `state` é o que você emitiu. Aceite cada mensagem uma vez só.

Este exemplo usa o dhive (https://www.npmjs.com/package/@hiveio/dhive):

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

A mesma conferência serve para uma assinatura do `requestSignBuffer` do Hive Keychain. Compare com a chave que você recuperou: `public_key` na URL de retorno é só uma pista.

## Mensagens que o Hivesigner não assina {#refused-messages}

Uma mensagem que é um objeto JSON com uma chave `signed_message` tem o formato de um token do Hivesigner. Assiná-la daria a quem pede acesso à conta da pessoa. O Hivesigner nunca assina uma mensagem assim. Ele diz à pessoa «Esta mensagem é um token do Hivesigner. Assiná-la daria ao site acesso à sua conta, por isso ela não pode ser assinada.»

Use texto comum, ou JSON sem a chave `signed_message`. Diga para que serve a assinatura e acrescente um valor que você gera uma vez só, por exemplo:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## A ferramenta Assinar mensagem {#sign-message-tool}

As pessoas também podem assinar uma mensagem por conta própria em https://hivesigner.com/signmessage (**Assinar mensagem**) e conferir uma em https://hivesigner.com/verifymessage (**Verificar mensagem**). Veja [Assinar uma mensagem por conta própria](/docs/signing#sign-message).

Essa ferramenta assina de um jeito diferente de `/sign-buffer`. Ela assina um corpo de token do Hivesigner que contém a mensagem, a conta e a hora. Compartilha o resultado como **Token de verificação**. Confira um token assim na página **Verificar mensagem** ou como descrito em [Conferir você mesmo](/docs/tokens#check-it-yourself), não com o código acima.
