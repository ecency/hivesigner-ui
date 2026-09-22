Alguns aplicativos só precisam saber quem é a pessoa no Hive. Eles nunca publicam, votam nem transmitem nada por ela. O Hivesigner consegue fazer as pessoas entrarem num aplicativo assim sem nenhuma autoridade de postagem. A pessoa prova que controla uma conta do Hive. Seu aplicativo fica sabendo o nome dela. Esta página mostra os dois jeitos de fazer isso e como conferir o resultado com segurança.

## Dois jeitos {#two-ways}

- **Com conta de aplicativo:** seu aplicativo tem conta própria no Hive e pede `scope=login`. O token nomeia o seu aplicativo.
- **Sem conta de aplicativo:** um site sem conta própria no Hive envia apenas um `redirect_uri`. O token não nomeia aplicativo algum. Seu site o confere por conta própria.

Nenhum dos dois exige concessão da pessoa nem da conta do seu aplicativo, então nada muda na conta da pessoa. O Hivesigner assina o login com a chave de postagem, ou com a chave ativa quando o dispositivo não tem chave de postagem para aquela conta.

## Com conta de aplicativo {#app-account}

1. [Registre seu aplicativo](/docs/register-app): crie a conta do Hive dele e liste suas URLs de retorno. Você não precisa de segredo do cliente nem da concessão para @hivesigner.
2. Envie a pessoa para:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. A pessoa vê «Entrar em APP» com o **Escopo** «Ver o nome de usuário da sua conta». Ela escolhe **Entrar**.
4. O Hivesigner redireciona para a sua URL de retorno:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [Compare `state`](/docs/oauth2#state) e depois confira o token. Ele é um token `login` que nomeia o seu aplicativo, então qualquer um destes caminhos serve:
   - chame [`GET /api/me`](/docs/api#me) com ele, que responde com a conta em `user` e `scope` igual a `["login"]`, depois decodifique o token e confira `type` e `app` ([Perguntar à API](/docs/tokens#check-with-the-api));
   - ou [confira você mesmo](/docs/tokens#check-it-yourself) com `type: 'login'` e o nome do seu aplicativo.

Um token `login` não transmite nada: `/api/broadcast` recusa qualquer operação enviada com ele.

## Sem conta de aplicativo {#no-app-account}

1. Envie a pessoa à URL de autorização com um `redirect_uri` e sem `client_id`:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   A URL de retorno precisa ser `https://`, ou `http://` em loopback (`localhost`, `127.0.0.1`, `[::1]`). Não existe lista onde registrá-la. Aqui o Hivesigner ignora `scope` e `response_type`: a resposta é sempre um token de login.

2. A pessoa vê «HOST quer confirmar seu nome de usuário do Hive.», em que HOST é o host da sua URL de retorno. Ela escolhe **Entrar**.
3. O Hivesigner redireciona para a sua URL de retorno:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [Compare `state`](/docs/oauth2#state) e depois confira o token você mesmo. A API não aceita um token que não nomeia aplicativo, então seu servidor verifica a assinatura contra as chaves da conta. Veja [Conferir você mesmo](/docs/tokens#check-it-yourself), com `type: 'login'` e sem `app`.

Quando a URL de retorno não é um endereço da web, ou é `http://` simples fora do loopback, o Hivesigner recusa a solicitação e explica à pessoa o porquê.

## Qual usar {#which-one}

| | Com conta de aplicativo | Sem conta de aplicativo |
| --- | --- | --- |
| O que a pessoa vê | O nome, a imagem e a conta do Hive do seu aplicativo | Apenas o host do seu site |
| Preparo | Uma conta do Hive com suas URLs de retorno listadas | Nenhum |
| O token nomeia | Seu aplicativo | Nenhum aplicativo |
| Confira o token com | `/api/me` ou código próprio | Código próprio |
| Acesso de postagem depois | Com a mesma conta: peça `posting` e [conceda a @hivesigner](/docs/register-app#grant-hivesigner) | Exige antes uma conta de aplicativo |

Use uma conta de aplicativo quando puder. Os usuários veem o nome e a imagem do seu aplicativo. Seu servidor pode recusar tokens criados para outro aplicativo. Depois você pode passar ao acesso de postagem com a mesma conta.

Use o segundo caminho quando seu site não tem conta do Hive e não quer ter.

## Conferir o login com segurança {#check-safely}

- **Amarre a solicitação com `state`.** Gere um valor aleatório a cada login, guarde-o na sessão da pessoa, compare-o na sua URL de retorno e use-o uma única vez. Veja [Proteger a solicitação com state](/docs/oauth2#state).
- **Confira o tipo.** Aceite apenas `signed_message.type` igual a `login`. Um código ou um token de atualização não é um login.
- **Confira o aplicativo.** Com conta de aplicativo, `signed_message.app` deve ser o seu aplicativo. Sem ela, não deve haver nenhum `app`.
- **Confira a idade.** Você confere o token logo após o redirecionamento, então aceite-o apenas dentro de poucos minutos a partir do `timestamp` dele (por exemplo, 5 minutos, com um minuto de diferença de relógio).
- **Use cada token uma vez.** Depois de uma conferência bem-sucedida, inicie a sua própria sessão (por exemplo, um cookie httpOnly) e descarte o token do Hivesigner. Mantenha registro dos tokens aceitos até que fiquem velhos demais para passar na conferência de idade. Recuse qualquer um que aparecer de novo.
- **Mantenha o token fora dos registros.** Ele chega na string de consulta da sua URL de retorno. Veja [Guardar os tokens com segurança](/docs/tokens#keep-tokens-safe).

## Exemplos {#examples}

Sites como https://hivesearcher.com e https://openhive.chat deixam as pessoas entrarem com a conta do Hive para recursos que ficam fora da blockchain, como busca e bate-papo. Eles precisam saber quem é a pessoa e nada mais.
