Mande as pessoas ao Hivesigner para entrarem no seu aplicativo. Lá elas conferem a sua solicitação e a aprovam. Depois o Hivesigner as manda de volta à sua URL de retorno com um token (o fluxo por token) ou com um código que seu servidor troca por tokens (o fluxo por código). Esta página cobre os dois fluxos, cada parâmetro e os escopos.

## Antes de começar {#before-you-start}

- Registre seu aplicativo: uma conta do Hive para ele, com suas URLs de retorno listadas. Veja [Registre seu aplicativo](/docs/register-app).
- Para transmitir pela API, a conta do seu aplicativo também precisa [conceder autoridade de postagem a @hivesigner](/docs/register-app#grant-hivesigner).
- Para o fluxo por código, defina um [segredo do cliente](/docs/register-app#client-secret).

## A URL de autorização {#authorize-url}

Mande a pessoa para este endereço:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Codifique cada valor para a URL. `URLSearchParams` faz isso por você:

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### Parâmetros {#parameters}

| Parâmetro | Obrigatório | O que faz |
| --- | --- | --- |
| `client_id` | Sim, para um aplicativo | O nome da conta do seu aplicativo. `clientId` também é lido. Sem ele, a solicitação é de login apenas, vinda de um site sem conta de aplicativo: veja [Login sem acesso de postagem](/docs/login-only). |
| `redirect_uri` | Sim | Para onde o Hivesigner manda a pessoa de volta. Precisa ser exatamente uma das URIs de redirecionamento do seu aplicativo. Veja [URLs de retorno](/docs/register-app#callbacks). |
| `scope` | Não | `login`, `posting` ou `offline`. Veja [Escopos](#scopes). Sem ele, a solicitação pede acesso de postagem. |
| `response_type` | Não | `code` inicia o [fluxo por código](#code-flow). Qualquer outro valor, ou nenhum, significa o [fluxo por token](#token-flow). |
| `state` | Recomendado | Um valor aleatório que o Hivesigner devolve sem alteração. Veja [Proteger a solicitação com state](#state). |
| `account` | Não | Um nome de usuário do Hive. Quando essa conta está no dispositivo da pessoa, o Hivesigner a seleciona. Caso contrário, ignora. `select_account` também é lido. |

A pessoa ainda pode trocar de conta na tela de consentimento. Pegue a conta sempre do token ou da troca do código, nunca do que você pediu.

## Escopos {#scopes}

O Hive tem uma única autoridade de postagem. Por isso o Hivesigner tem dois níveis de acesso, apenas login e postagem, e nada mais fino entre eles.

| `scope` | O que a pessoa aprova | Fluxo | `type` do token de acesso |
| --- | --- | --- | --- |
| `login` | «Ver o nome de usuário da sua conta». Nada é concedido. | Fluxo por token (não acrescente `response_type=code`) | `login` |
| `posting` | Acesso de postagem. Na primeira vez, isso adiciona a conta do seu aplicativo à autoridade de postagem da pessoa. | Fluxo por token, ou fluxo por código com `response_type=code` | `posting` |
| `offline` | Acesso de postagem, como acima | Fluxo por código | `posting`, com um token `refresh` |

No fluxo por código, a URL de retorno recebe primeiro um código (um token de `type` igual a `code`) que seu servidor troca pelo token de acesso.

- **Nenhum escopo** significa `posting`.
- **Um valor que contenha `offline`** em qualquer lugar significa `offline`, por exemplo o antigo `offline,vote,comment`.
- **Qualquer outro valor** significa `posting`. Isso inclui os nomes antigos de operações, como `vote`, `comment`, `vote,comment`, `comment_options` ou `custom_json`. Eles não limitam o token: todo token de postagem permite as mesmas operações. Veja [O que o broadcast aceita](/docs/api#broadcast-rules).

Peça `login` quando seu aplicativo só precisa saber quem é a pessoa. Veja [Login sem acesso de postagem](/docs/login-only).

## O fluxo por token {#token-flow}

O navegador da pessoa recebe o token de acesso direto. Seu aplicativo não precisa de nenhum segredo.

1. Mande a pessoa à URL de autorização:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. A pessoa aprova. O Hivesigner redireciona para a sua URL de retorno:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   O Hivesigner acrescenta os parâmetros dele com `?` quando a sua URL não tem consulta e com `&` quando tem. `state` só aparece se você enviou um valor não vazio.

3. Na sua URL de retorno, primeiro [compare `state`](#state). Depois [confira o token](/docs/tokens#check-a-token) no seu servidor. A conta a que ele se refere está dentro do token: não confie apenas no parâmetro `username`, porque qualquer um pode editar uma URL.
4. Guarde o token no seu servidor ou num cookie httpOnly. Redirecione para uma URL limpa, para o token sair da barra de endereços.
5. Use o token com a [API](/docs/api) até ele expirar depois de `expires_in` segundos (7 dias). Depois mande a pessoa de novo à URL de autorização. Quem já concedeu acesso de postagem vê «Entrar em APP» e «Você já autorizou @myapp. Nenhuma permissão nova é concedida.».

## O fluxo por código {#code-flow}

Seu servidor recebe um código e o troca por um token de acesso e um token de atualização. Depois pode renová-los sem a pessoa. Use isso quando seu servidor age em nome dos usuários por muito tempo.

1. Mande a pessoa à URL de autorização com `scope=offline`:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` faz a mesma coisa.

2. A pessoa aprova o acesso de postagem. O Hivesigner redireciona para a sua URL de retorno:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [Compare `state`](#state). Depois troque o código na hora, a partir do seu servidor.

### Trocar o código {#exchange-code}

Envie o código e o seu segredo do cliente para `/api/oauth2/token` no corpo de uma requisição POST:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

A resposta:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

A mesma chamada no Node.js 18 ou mais recente:

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- Ponha o código e o segredo no corpo da requisição, nunca na URL.
- Não envie nenhum cabeçalho `Authorization` com esta requisição.
- Use o `username` desta resposta. Ele vem do código, que a pessoa assinou.
- Guarde o token de acesso e o token de atualização no seu servidor.

### Atualizar {#refresh}

Quando o token de acesso expira, envie o token de atualização com o seu segredo do cliente ao mesmo endpoint:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

A resposta tem o mesmo formato, com um novo token de acesso e um novo token de atualização. Guarde os dois no lugar dos antigos.

## Proteger a solicitação com state {#state}

Sem `state`, outro site poderia mandar seu usuário à sua URL de retorno com um token ou código escolhido por ele. Seu aplicativo então faria a pessoa entrar na conta de outra pessoa. O `state` amarra cada retorno ao navegador que começou o login.

1. Gere um valor aleatório para cada login, com pelo menos 16 bytes aleatórios. O hexadecimal o mantém livre de caracteres que precisam de codificação.
2. Guarde-o onde só este navegador possa apresentá-lo de novo: a sessão do seu servidor, ou um cookie httpOnly e Secure de vida curta com `SameSite=Lax`.
3. Envie-o como `state` na URL de autorização.
4. Na sua URL de retorno, compare o parâmetro `state` com o valor guardado. Se faltar ou for diferente, pare: não use o token nem o código.
5. Apague o valor guardado, para que cada um sirva uma vez só.

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

O Hivesigner devolve o mesmo valor de `state` que recebeu. Um valor vazio ele deixa de fora.

## O que a pessoa vê {#what-the-user-sees}

A tela de consentimento mostra a imagem e o nome do seu aplicativo, «Conta do Hive @myapp» e «Leva você para HOST», em que HOST vem da sua URL de retorno. Depois:

- **Primeira solicitação de postagem.** O título diz «APP está solicitando acesso à sua conta.». O cartão **Escopo** lista o que seu aplicativo poderá fazer. Um aviso diz «Primeira autorização: isto adiciona @myapp à sua autoridade de postagem na blockchain e exige sua chave ativa uma única vez. Essa conta poderá postar em seu nome até que você revogue a autorização.». O botão diz **Autorizar**. Quando o dispositivo da pessoa não tem a chave ativa daquela conta, a tela a pede ali mesmo.
- **Login.** Para `scope=login`, ou para acesso de postagem já concedido antes, o título diz «Entrar em APP» e o botão diz **Entrar**.
- **A conta.** «Autorizando como» ou «Entrando como», seguido da conta escolhida. A pessoa pode trocar de conta aqui.
- **Uma conta bloqueada.** Um campo de código de acesso aparece acima do botão. Um clique desbloqueia a conta e segue em frente.
- **Nenhuma conta no dispositivo.** O botão diz **Continuar**. Ele abre o formulário de adicionar conta e volta depois à solicitação.

Depois de uma primeira solicitação de postagem, o Hivesigner espera até a nova concessão ficar visível na blockchain antes de redirecionar. Isso pode levar alguns segundos. Para a tela inteira do lado da pessoa, veja [Entrar em aplicativos](/docs/signing-in).

## Cancelamento e solicitações recusadas {#cancel}

- **Cancelamento.** A pessoa vai à lista de contas dela no Hivesigner. Nada é enviado à sua URL de retorno: não há parâmetro de erro. Mantenha seu botão de login disponível para a pessoa poder começar de novo. Não espere por um retorno.
- **Solicitações recusadas.** Uma URL de retorno não registrada, um `client_id` desconhecido ou um `redirect_uri` ausente mostram um erro no Hivesigner com um botão **Relatar este problema**. Nada é enviado à sua URL de retorno. Veja [O que os usuários veem quando algo está errado](/docs/register-app#refused-requests).

## A antiga URL de solicitação de login {#legacy-login-request}

O Hivesigner ainda aceita a URL de login mais antiga, mantida para integrações de antes. Use `/oauth2/authorize` para as novas.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

Ela abre a mesma tela de consentimento, com as mesmas conferências de URL de retorno e o mesmo redirecionamento. Mas lê os parâmetros de outro jeito:

- `scope` é `login` ou `posting`. Qualquer outro valor, ou nenhum, significa `login`.
- `offline` não é lido. Para o fluxo por código, acrescente `response_type=code`.
- `account` não é lido.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` segue as mesmas regras.
