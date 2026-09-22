A API do Hivesigner fica em `https://hivesigner.com/api/`. Ela devolve a conta de quem entrou, transmite operações de postagem por essa pessoa, troca códigos por tokens e lista os aplicativos que usam o Hivesigner. Esta página descreve cada endpoint com suas requisições, respostas e erros.

## Requisições e autenticação {#authentication}

- **URL base:** `https://hivesigner.com/api/`. Cada endpoint abaixo é relativo a `https://hivesigner.com`.
- **O token:** envie-o como está no cabeçalho `Authorization`: `Authorization: ACCESS_TOKEN`. Um prefixo `Bearer ` também é aceito. Você pode enviá-lo ainda como `access_token` na string de consulta ou no corpo, mas o cabeçalho o mantém fora de URLs e registros.
- **Corpos:** JSON com `Content-Type: application/json`, ou um formulário (`application/x-www-form-urlencoded`).
- **Respostas:** JSON.
- **Navegadores:** a API permite requisições de outra origem, então um aplicativo web pode chamá-la direto.

Para obter um token, veja [Entrar com OAuth2](/docs/oauth2). Para o que um token contém, veja [Tokens](/docs/tokens).

## Erros {#errors}

Uma resposta de erro tem um status HTTP de erro e este corpo:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Status | `error` | Quando |
| --- | --- | --- |
| 401 | `invalid_grant` | O token falta ou não é válido, ou é do tipo errado para este endpoint («The token has invalid role»). Em `/api/oauth2/token`, também «The code or secret is not valid». |
| 401 | `invalid_scope` | `/api/broadcast`: uma operação que o token não permite. A descrição nomeia as operações. |
| 401 | `unauthorized_client` | `/api/broadcast`: uma operação cujo autor não é a pessoa do token, um `account_update2` que mexe em chaves, uma concessão de autoridade de postagem faltando ou uma conta que não pôde ser carregada. A descrição diz qual é o caso. |
| 500 | `server_error` | `/api/broadcast`: a rede Hive recusou a transação. `error_description` traz a mensagem dela. |
| 503 | `unavailable` | `/api/apps`: o diretório ainda está sendo montado. |

## GET /api/me {#me}

Devolve a conta a que o token se refere. Use isto para saber quem entrou, ou para [conferir um token](/docs/tokens#check-with-the-api).

- **Métodos:** `GET` ou `POST`.
- **Token:** um token de acesso, inclusive um token `login` que nomeia um aplicativo.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

A resposta, resumida:

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| Campo | Significado |
| --- | --- |
| `user` | O nome de usuário do Hive a que o token se refere. `_id` e `name` repetem isso. |
| `account` | A conta inteira, como o `condenser_api.get_accounts` do Hive a devolve. |
| `scope` | O que o token permite: `["login"]` para um token de login, caso contrário as operações que `/api/broadcast` aceita. |
| `user_metadata` | Os metadados de perfil da conta, lidos do JSON. |

`/api/me` não nomeia o aplicativo para o qual o token foi criado. Para conferir isso, decodifique o token: veja [Perguntar à API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Assina operações de postagem da pessoa do token com a chave de postagem de @hivesigner e as transmite ao Hive.

- **Método:** `POST`.
- **Token:** um token de acesso `posting`, do fluxo por token ou do fluxo por código.
- **Antes de funcionar:** a pessoa concedeu autoridade de postagem à conta do seu aplicativo (a tela de consentimento faz isso) e a conta do seu aplicativo [concedeu autoridade de postagem a @hivesigner](/docs/register-app#grant-hivesigner).
- **Corpo:** `{ "operations": [...] }`, onde cada operação é `[name, fields]`, como na blockchain do Hive. Todas as operações de uma requisição entram numa única transação.

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

A mesma requisição com curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Seguir alguém é uma operação `custom_json`:

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

A API responde assim que um nó do Hive aceita a transação. `result.id` é o identificador da transação:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Quando a rede recusa a transação, a resposta é `500` com `server_error`. O `error_description` dela traz a mensagem da rede e `response` traz o erro bruto.

### O que o broadcast aceita {#broadcast-rules}

Um token de postagem deixa a API transmitir estas operações e nenhuma outra. Em cada uma, a pessoa do token precisa ser a conta indicada no campo mostrado:

| Operação | A pessoa do token precisa ser |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | A primeira conta em `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Qualquer outra operação** é recusada com `invalid_scope`. Um token `login` não permite operação alguma.
- **Uma operação para outra conta** é recusada com `unauthorized_client`. Um token só transmite pela própria pessoa.
- **`account_update2`** só pode mudar os metadados da conta. Uma operação com campo `owner`, `active` ou `posting` é recusada com `unauthorized_client`.
- **`custom_json`**: deixe `required_auths` vazio. A API assina com autoridade de postagem, então uma operação que exige autoridade ativa falha na rede.

Transferências e outras operações de carteira exigem a chave ativa da pessoa. Envie-as como [links de assinatura](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

Troca um código por tokens, ou um token de atualização por tokens novos. Chame apenas do seu servidor. Veja [O fluxo por código](/docs/oauth2#code-flow).

- **Método:** `POST`, com os valores no corpo.
- **Corpo:** `code` e `client_secret`, ou `refresh_token` e `client_secret`.
- **Cabeçalhos:** não envie nenhum cabeçalho `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Cada chamada devolve um novo token de acesso e um novo token de atualização. Os dois são assinados por @hivesigner. `expires_in` é a validade do token de acesso em segundos (7 dias).

Erros: `401 invalid_grant`. A descrição é «The token has invalid role» quando o valor enviado não é um código nem um token de atualização válido. É «The code or secret is not valid» quando o código ou o segredo não conferem.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Avisa o Hivesigner de que a pessoa saiu do seu aplicativo. Seu aplicativo descarta o token por conta própria.

- **Método:** `POST`.
- **Token:** o token de acesso, no cabeçalho `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

O `revokeToken()` do SDK de JavaScript faz esta chamada e depois esquece o token. Para retirar o acesso do seu aplicativo de vez, a pessoa o retira em https://hivesigner.com/authorized-apps. Veja [Sair e retirar o acesso](/docs/tokens#sign-out).

## GET /api/apps {#apps}

O diretório público de aplicativos: aplicativos que transmitem pelo Hivesigner, ordenados por quantas pessoas os usam. Não precisa de token. https://hivesigner.com/apps mostra a mesma lista.

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| Campo | Significado |
| --- | --- |
| `updated_at` | Quando o diretório foi montado pela última vez. |
| `building` | `true` até a primeira montagem ter dados. `apps` fica vazio nesse período. |
| `window_days` | O número de dias que a classificação cobre. |
| `featured` | Os nomes de usuário mostrados primeiro, nessa ordem. |
| `apps[].username` | A conta do aplicativo. |
| `apps[].name`, `about` | Do perfil da conta do aplicativo, ou `null`. |
| `apps[].website` | O site do perfil, quando ele responde no próprio domínio. Caso contrário, `null`. |
| `apps[].site` | O resultado da verificação do site: `ok`, `no_website`, `invalid`, `redirected`, `blocked` ou `unreachable`. Uma entrada `redirected` também traz `redirects_to`. |
| `apps[].users` | Usuários distintos por dia, somados no período. |
| `apps[].requests` | Requisições bem-sucedidas à API feitas para o aplicativo no período. |
| `apps[].first_seen`, `last_seen` | O primeiro dia em que o Hivesigner registrou o aplicativo e o último dia em que ele foi usado, ou `null`. |
| `apps[].new` | `true` quando o aplicativo apareceu pela primeira vez dentro do período. |

A resposta pode ficar em cache por até 5 minutos. Antes de o diretório ser montado pela primeira vez, a API responde `503` com `unavailable`. Tente de novo mais tarde.

Os nomes e as descrições são publicados por cada conta de aplicativo. O Hivesigner não verifica nenhum deles.
