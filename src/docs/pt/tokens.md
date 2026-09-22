Um token do Hivesigner é uma declaração assinada curta. Ele nomeia uma conta do Hive, o aplicativo para o qual foi criado e o momento em que foi assinado. Seu servidor pode conferir um token pela API ou por conta própria. Esta página mostra o que um token contém, quanto tempo ele dura e as duas formas de conferi-lo.

## Como é um token {#format}

Um token é um objeto JSON codificado em base64url, com uma diferença em relação ao base64url padrão: o preenchimento usa `.` em vez de `=`. Assim, comparado ao base64 comum, `+` vira `-`, `/` vira `_` e `=` vira `.`. Todo token começa com `eyJzaWduZWRfbWVzc2FnZSI6`.

Decodificado, um token de acesso do fluxo por token fica assim:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Campo | Significado |
| --- | --- |
| `signed_message.type` | O que o token é: `login`, `posting`, `code` ou `refresh`. Veja [Tipos de token](#kinds). |
| `signed_message.app` | A conta de aplicativo para a qual o token foi criado. Um token de login de um site sem conta de aplicativo não tem nenhuma. |
| `authors[0]` | A conta do Hive à qual o token se refere. |
| `timestamp` | Quando foi assinado, em segundos desde 1970-01-01 UTC. |
| `signatures[0]` | A assinatura, como texto hexadecimal. |
| `authority` | Só em tokens assinados no navegador: qual chave da pessoa assinou, `posting` ou `active`. Este campo fica fora dos dados assinados. Para saber qual chave assinou, recupere-a a partir da assinatura. |

A assinatura é uma assinatura secp256k1 sobre o hash sha256 de `JSON.stringify({ signed_message, authors, timestamp })`, com as chaves nessa ordem.

### Decodificar um token {#decode}

No Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

No navegador:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Decodificar não é conferir. Qualquer um pode montar um texto que decodifica nesse formato. [Confira um token](#check-a-token) antes de confiar nele.

## Tipos de token {#kinds}

| Token | `type` | `app` | Assinado por | Onde você o obtém |
| --- | --- | --- | --- | --- |
| Token de acesso, fluxo por token | `posting` | Seu aplicativo | A chave de postagem da pessoa, ou a chave ativa dela quando o Hivesigner não tem chave de postagem para a conta | `access_token` na sua URL de retorno |
| Token de login, `scope=login` | `login` | Seu aplicativo | A chave de postagem ou ativa da pessoa | `access_token` na sua URL de retorno |
| Token de login, site sem conta de aplicativo | `login` | Nenhuma | A chave de postagem ou ativa da pessoa | `access_token` na sua URL de retorno |
| Código | `code` | Seu aplicativo | A chave de postagem ou ativa da pessoa | `code` na sua URL de retorno |
| Token de acesso, fluxo por código | `posting` | Seu aplicativo | A chave de postagem de @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Token de atualização | `refresh` | Seu aplicativo | A chave de postagem de @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Um código e um token de atualização não são tokens de acesso. Nunca aceite nenhum dos dois como login.

## Quanto tempo um token dura {#lifetime}

Um token de acesso dura 7 dias: `expires_in` é 604800 segundos, contados a partir do `timestamp` dele. Depois de expirado:

- **Fluxo por token:** mande a pessoa entrar de novo. Quem já autorizou seu aplicativo vê «Entrar em APP» e precisa de um clique.
- **Fluxo por código:** seu servidor obtém um novo token de acesso com o token de atualização e o seu segredo do cliente. Veja [Atualizar](/docs/oauth2#refresh).

Trate um token como expirado assim que o `timestamp` dele tiver mais de 7 dias. Aceite uma idade bem menor para tudo o que você confere logo após o redirecionamento. Troque um código na hora. Aceite um token de login apenas dentro de poucos minutos a partir do `timestamp` dele.

## Conferir um token no seu servidor {#check-a-token}

Antes que seu servidor confie num token que um navegador ou aplicativo lhe envia, confira que:

- a conta ou @hivesigner realmente o assinou;
- ele foi criado para o seu aplicativo;
- ele é do tipo que você espera;
- ele é recente o bastante.

### Perguntar à API {#check-with-the-api}

Chame `/api/me` com o token. Um token válido devolve a conta em `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Um token inválido devolve `401` com `invalid_grant`. Veja [GET /api/me](/docs/api#me).

`/api/me` confirma a assinatura. A resposta dele não nomeia o aplicativo para o qual o token foi criado. Então decodifique também o token e confira você mesmo `app`, `type` e idade. Um token criado para outro aplicativo não pode fazer ninguém entrar no seu.

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

A API só aceita tokens que nomeiam um aplicativo. Confira [você mesmo](#check-it-yourself) um token de login vindo de um site sem conta de aplicativo.

### Conferir você mesmo {#check-it-yourself}

1. Decodifique o token.
2. Confira que `signed_message.type` é o tipo esperado: `posting` para um token de acesso, `login` para um token de login.
3. Confira que `signed_message.app` é a conta do seu aplicativo. Para um site sem conta de aplicativo, confira que não há nenhuma.
4. Confira a idade a partir de `timestamp`.
5. Calcule o hash sha256 de `JSON.stringify({ signed_message, authors, timestamp })`.
6. Recupere a chave pública a partir de `signatures[0]` e desse hash.
7. Leia a conta `authors[0]` na blockchain do Hive agora, porque as pessoas podem trocar as chaves. A chave recuperada precisa ser uma das chaves de postagem ou ativas atuais dela. Já um token vindo de `/api/oauth2/token` é assinado por @hivesigner: para esses, aceite uma chave de postagem atual da conta @hivesigner.

No Node.js com [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), que expõe `PrivateKey`, `PublicKey`, `Signature` e `callRPC` em `@ecency/sdk/hive`:

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

Use assim:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

A biblioteca dhive (`@hiveio/dhive`) também serve: calcule o hash com `cryptoUtils.sha256(message)` e recupere a chave com `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Guardar os tokens com segurança {#keep-tokens-safe}

Quem tem um token de postagem pode transmitir como a pessoa pelo seu aplicativo até ele expirar. Trate-o como uma senha.

- **Guarde os tokens no seu servidor,** ou num cookie httpOnly e Secure. Guarde os tokens de atualização e o seu segredo do cliente só no servidor.
- **Nunca coloque um token numa URL que você registra.** O fluxo por token entrega o token na string de consulta da sua URL de retorno. Leia-o no seu servidor e depois redirecione para uma URL sem ele. Deixe a string de consulta da URL de retorno fora dos seus registros.
- **Não carregue nada de outros sites na página da sua URL de retorno,** para que o endereço com o token não vá até eles. Um cabeçalho `Referrer-Policy: no-referrer` nessa página ajuda.
- **Envie um token apenas ao seu próprio servidor e a `https://hivesigner.com/api/`.**

## Sair e retirar o acesso {#sign-out}

- **Encerrar a sessão de alguém** quer dizer descartar o token: apague-o da sua sessão ou do seu cookie. Você também pode chamar [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) para avisar o Hivesigner de que a pessoa saiu. Seu aplicativo descarta o token por conta própria de qualquer forma.
- **Cortar o acesso do seu aplicativo de vez** é escolha da pessoa. Em https://hivesigner.com/authorized-apps, ou em `https://hivesigner.com/revoke/APP`, ela remove a conta do seu aplicativo da própria autoridade de postagem na blockchain. Depois disso, a API não transmite mais por ela através do seu aplicativo.
