O SDK oficial de JavaScript monta URLs de login e links de assinatura e chama a API do Hivesigner por você. Para Python existem bibliotecas da comunidade. Qualquer outra linguagem pode chamar a [API REST](/docs/api) direto.

## SDK de JavaScript {#javascript}

O SDK é o pacote npm `hivesigner`. O código-fonte dele está em https://github.com/ecency/hivesigner-sdk. É escrito em TypeScript e traz os próprios tipos.

A versão 4 exige Node.js 18 ou mais recente, porque usa o `fetch` embutido. Nos navegadores exige ES2017 ou mais recente. Onde não houver `fetch` global, acrescente um polyfill antes de usar o SDK. Num Node.js mais antigo, fique na versão 3.

### Instalação {#install}

```bash
npm install hivesigner
```

Para uma página sem etapa de build, carregue o pacote de navegador. Ele define um `hivesigner` global:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Criar um cliente {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Opção | Significado |
| --- | --- |
| `app` | A conta do seu aplicativo, enviada como `client_id`. |
| `callbackURL` | Para onde o Hivesigner manda a pessoa de volta. Precisa ser uma das URLs de retorno do seu aplicativo, caractere por caractere (uma URL de loopback em http simples pode variar em host e porta, veja [URLs de retorno](/docs/register-app#callback-rules)). |
| `scope` | Uma lista, unida por vírgulas no parâmetro `scope`. Veja [Escopos](/docs/oauth2#scopes). |
| `responseType` | `'code'` para o fluxo por código. Deixe de fora no fluxo por token. |
| `accessToken` | O token de acesso da pessoa, quando você já tem um. |
| `apiURL` | A origem da API. O SDK acrescenta `/api/` a ela. O padrão é `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` e `setApiURL` mudam o cliente depois. Cada um devolve o cliente.

### Fazer a pessoa entrar {#sign-in}

`getLoginURL(state, account)` devolve a URL de login:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` volta sem alteração à sua URL de retorno. Use-o para amarrar a resposta à solicitação.
- `account` é opcional: um nome de usuário. O Hivesigner seleciona essa conta quando ela está no dispositivo e a ignora caso contrário.

No navegador, `client.login({ state: 'STATE' })` manda a pessoa à mesma URL, sem conta.

No fluxo por token, sua URL de retorno recebe `access_token`, `expires_in` e `username`. Entregue o token ao cliente:

```js
client.setAccessToken('ACCESS_TOKEN');
```

O SDK não tem método para a troca do fluxo por código. Seu servidor envia por conta própria o código e o segredo do cliente à API, como mostra [Trocar o código](/docs/oauth2#exchange-code).

### Obter a pessoa {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` é a conta do Hive da pessoa como a blockchain a devolve. `scope` lista o que o token permite.

### Transmitir {#broadcast}

`broadcast(operations)` manda operações à API, que as transmite pela pessoa. A API só aceita operações de postagem cujo autor é a pessoa do token: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` com autoridade de postagem, `claim_reward_balance` e `account_update2` para metadados de perfil. Veja [O que o broadcast aceita](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Indique a pessoa em cada operação. A API não substitui `__signer`.

Estes métodos de apoio montam uma operação cada um e chamam `broadcast`:

| Método | Transmite |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` vai de `-10000` a `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Para uma publicação nova, `parentAuthor` é `''`. `jsonMetadata` pode ser um objeto: o SDK o transforma em texto. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Passe `[]` como `requiredAuths` e `['USERNAME']` como `requiredPostingAuths`. `json` é um texto. |
| `reblog(account, author, permlink)` | `custom_json` com id `follow`, que recompartilha a publicação |
| `follow(follower, following)` | `custom_json` com id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` com id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` com id `follow`, `what: ['ignore']` (silenciar) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. As quantias são textos como `'0.000 HIVE'`, `'0.000 HBD'` e `'1.000000 VESTS'`. |

`updateUserMetadata()` está descontinuado. Para mudar o perfil de alguém, transmita `account_update2` com um novo `posting_json_metadata`.

### Sair {#log-out}

`revokeToken()` é a chamada de saída do SDK. Ela manda o token ao endpoint de revogação da API e depois o remove do cliente. Quando a chamada falha, chame `removeAccessToken()` você mesmo. Apague o token também de onde seu aplicativo o guardou.

Para encerrar o acesso do seu aplicativo de vez, a pessoa o retira em https://hivesigner.com/authorized-apps. Veja [Ver e retirar o acesso de um aplicativo](/docs/signing-in#remove-access).

### Links de assinatura {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` e `sendTransaction(tx, params)` devolvem um link `https://hivesigner.com/sign/...`. `params` aceita `callback`, `no_broadcast` e `signer`. Veja [Links de assinatura](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

No TypeScript, os tipos exigem o terceiro argumento: passe `undefined` para receber o link.

No navegador, passe uma função como terceiro argumento para abrir o link numa nova aba. A função não é chamada e nada é devolvido. Chame-a a partir de um tratador de clique, senão o navegador pode bloquear a nova aba e a chamada lança um erro.

### Promessas e callbacks {#promises-and-callbacks}

`me`, `broadcast`, os métodos de apoio e `revokeToken` devolvem uma promessa. Passe uma função como último argumento para usar um callback em vez disso. Ele recebe `(error, result)`.

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

Quando a API responde com erro, a promessa é rejeitada com o corpo de erro da API, `{ error, error_description }`. Com um callback, esse corpo é o argumento `error`. Quando a resposta não é JSON, a rejeição traz o erro de leitura.

## Python {#python}

Estas bibliotecas vêm da comunidade. Quem as mantém são os autores delas, não a equipe do Hivesigner. Confira-as contra a [API REST](/docs/api) antes de depender delas.

| Biblioteca | Autor |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, módulo `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
