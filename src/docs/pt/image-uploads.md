As publicações do Hive apontam para imagens por URL, então um aplicativo precisa de um lugar para enviá-las. Um imagehoster é uma hospedagem de imagens de código aberto feita para o Hive. Ele pode aceitar envios de pessoas que entraram no seu aplicativo com o Hivesigner: o token de acesso delas faz as vezes de uma assinatura com a chave delas.

## Como funciona {#how-it-works}

1. A pessoa entra no seu aplicativo com o Hivesigner, com acesso de postagem. Seu aplicativo recebe um token de acesso. Veja [Entrar com OAuth2](/docs/oauth2).
2. Seu aplicativo envia a imagem ao seu imagehoster, com esse token na URL.
3. O imagehoster confere o token e a conta, guarda a imagem e responde com a URL dela.
4. Seu aplicativo coloca essa URL na publicação.

## Rodar seu próprio imagehoster {#run-your-own}

Um imagehoster é configurado para uma única conta de aplicativo: `app_account`, na seção `[upload_limits]` da configuração dele. Envie a ele tokens criados para essa conta de aplicativo. As instâncias públicas pertencem a outros aplicativos: images.ecency.com está configurado para a conta de aplicativo da Ecency e images.hive.blog para a do Hive.blog. Para aceitar envios dos seus usuários, rode uma instância própria com a sua conta de aplicativo.

O código-fonte e os guias de instalação:

- O imagehoster da comunidade Hive: https://gitlab.syncad.com/hive/imagehoster
- O imagehoster da Ecency: https://github.com/ecency/imagehoster

Na configuração, informe a sua conta de aplicativo:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

A mesma seção define a reputação mínima que uma conta precisa ter para enviar (`reputation`) e a cota de envios de cada conta (`max` envios a cada `duration` milissegundos). Configure `redis_url` para que a cota realmente valha. `max_image_size` define o maior arquivo, em bytes.

## Enviar uma imagem {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **O token.** Coloque o token de acesso da pessoa no caminho, exatamente como o Hivesigner o entregou ao seu aplicativo. Use um token vindo de um login com acesso de postagem para o seu aplicativo. Um token apenas de login, vindo de uma solicitação sem `client_id`, não nomeia nenhum aplicativo e é recusado.
- **O corpo.** Envie `multipart/form-data` com um arquivo de imagem. O imagehoster pega o primeiro arquivo, seja qual for o nome do campo.
- **O tamanho.** Envie um cabeçalho `Content-Length`. O arquivo não pode passar do `max_image_size` da instância.

A resposta é JSON. Em caso de sucesso, traz a URL da imagem:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

Em caso de falha, o imagehoster responde com um status de erro HTTP. A maioria das falhas traz também um nome de erro:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Observação:** O token viaja na URL. Sirva seu imagehoster apenas por https e mantenha os registros de acesso dele em sigilo.

## Exemplo {#example}

Esta função de navegador envia um arquivo a partir de um campo de arquivo ou de um arrastar e soltar. O navegador define os cabeçalhos multipart e o comprimento por você: não defina `Content-Type` por conta própria.

```js
// IMAGEHOSTER_URL is the address of your imagehoster, such as 'https://YOUR_IMAGEHOSTER'.
async function uploadImage(file, accessToken) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${IMAGEHOSTER_URL}/hs/${accessToken}`, {
    method: 'POST',
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.name ?? `Upload failed with status ${response.status}`);
  }
  return result.url;
}

const url = await uploadImage(input.files[0], ACCESS_TOKEN);
const markdown = `![](${url})`; // add this to the post body
```
