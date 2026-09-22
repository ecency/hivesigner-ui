Um aplicativo que faz as pessoas entrarem com o Hivesigner é uma conta do Hive. O nome dela é o `client_id` que você envia. O perfil dela guarda as configurações que o Hivesigner lê: as URLs de retorno para onde ele pode mandar tokens e, para o fluxo por código, um segredo do cliente. Para transmitir pela API, a conta do aplicativo também concede autoridade de postagem a @hivesigner. Esta página percorre cada passo.

## O que você precisa {#what-you-need}

| Você quer | Conta de aplicativo e URLs de retorno | Segredo do cliente | Concessão a @hivesigner |
| --- | --- | --- | --- |
| Fazer as pessoas entrarem e transmitir com o fluxo por token | Sim | Não | Sim |
| Fazer as pessoas entrarem e transmitir com o fluxo por código (tokens de atualização) | Sim | Sim | Sim |
| Apenas fazer as pessoas entrarem, com um token que nomeia seu aplicativo | Sim | Não | Não |
| Apenas fazer as pessoas entrarem, a partir de um site sem conta do Hive | Não | Não | Não |
| Enviar links de assinatura | Não | Não | Não |

Para as duas últimas linhas, veja [Login sem acesso de postagem](/docs/login-only) e [Links de assinatura](/docs/sign-links).

## Criar a conta do aplicativo {#app-account}

1. Crie uma conta do Hive para o seu aplicativo, por exemplo em https://ecency.com/signup. Use uma conta separada para o aplicativo, não a sua pessoal. O nome dela é o seu `client_id`. As pessoas o veem na tela de consentimento, ao lado de «Conta do Hive». Uma conta do Hive não pode ser renomeada, então escolha o nome com cuidado.
2. Adicione a conta ao Hivesigner em https://hivesigner.com/import (**Adicionar conta**). Use a chave ativa ou a senha mestra: a concessão mais adiante exige a chave ativa.

## Preencher as configurações do aplicativo {#app-settings}

Abra https://hivesigner.com/profile com a conta do aplicativo selecionada e defina:

- **Esta conta é um aplicativo.** Ative isso. Marca a conta como aplicativo, e é isso que a API confere antes de aceitar um código ou um token de atualização para ela.
- **URIs de redirecionamento.** Suas URLs de retorno, uma por linha. Veja [URLs de retorno](#callbacks).
- **Criador.** Quem mantém o aplicativo. O diretório de aplicativos em https://hivesigner.com/apps mostra isso.
- **Status.** Produção ou testes, para seus próprios registros. O Hivesigner trata os dois do mesmo jeito.
- **Segredo do cliente.** Necessário apenas para o [fluxo por código](/docs/oauth2#code-flow). Veja [Segredo do cliente](#client-secret).

Preencha também **Nome** e **URL da foto de perfil**. A tela de consentimento mostra a imagem e o nome do seu aplicativo. O diretório de aplicativos em https://hivesigner.com/apps mostra o nome, **Sobre** e **Site**.

Salvar atualiza o perfil da conta na blockchain e exige a chave de postagem dela. O Hivesigner lê suas URLs de retorno a partir da conta quando uma solicitação de login se abre, então uma mudança vale assim que a transação entra num bloco.

> **Observação:** O nome, a imagem e a descrição são publicados pela própria conta do seu aplicativo. Por isso a tela de consentimento mostra também o nome real da conta (`@myapp`) e o host para onde ela envia a pessoa: são esses que a concessão e o redirecionamento usam de fato.

## URLs de retorno {#callbacks}

Uma URL de retorno (o `redirect_uri` de uma solicitação de login) é o lugar para onde o Hivesigner manda a pessoa de volta com um token ou um código. O Hivesigner só envia para uma URL de retorno listada na conta do seu aplicativo.

### As regras {#callback-rules}

- **Correspondência exata.** O `redirect_uri` da solicitação precisa ser uma das suas URIs de redirecionamento, caractere por caractere: esquema, host, porta, caminho e consulta.
- **Somente https.** Uma URL de retorno precisa usar `https://`. O `http://` simples só é aceito em loopback: `localhost`, `127.0.0.1` ou `[::1]`.
- **As portas de loopback podem mudar.** Uma URL de retorno de loopback registrada com http simples combina com qualquer host e porta de loopback que tenham o mesmo caminho, consulta, fragmento e informação de usuário. Uma URL de loopback registrada com `https://` continua exigindo correspondência exata.
- **Nada de esquemas próprios.** Uma URL de retorno como `myapp://callback` é recusada. Veja [Aplicativos móveis e de desktop](#native-apps).
- **Nada de fragmentos.** Não acrescente `#fragment` a uma URL de retorno.

A página de perfil se recusa a salvar uma URL de retorno que nunca funcionaria, dizendo «URL de retorno inutilizável (https, ou http em localhost)».

### Exemplos {#callback-examples}

Com estas URIs de redirecionamento registradas:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| `redirect_uri` da solicitação | Resultado |
| --- | --- |
| `https://myapp.example/auth/callback` | Aceita: correspondência exata |
| `https://myapp.example/auth/callback/` | Recusada: `/` a mais |
| `https://myapp.example/auth/callback?next=home` | Recusada: a consulta é diferente |
| `https://www.myapp.example/auth/callback` | Recusada: outro host |
| `http://myapp.example/auth/callback` | Recusada: http simples fora do loopback |
| `http://localhost:3000/auth` | Aceita: correspondência exata |
| `http://127.0.0.1:51234/auth` | Aceita: loopback, mesmo caminho, outra porta |
| `http://[::1]:3000/auth` | Aceita: loopback, mesmo caminho |
| `http://127.0.0.1:3000/other` | Recusada: outro caminho |
| `https://localhost:3000/auth` | Recusada: https não combina com um registro em http simples |
| `myapp://auth` | Recusada: esquema próprio |

Para aceitar uma consulta na sua URL de retorno, registre a URL com exatamente essa consulta. O Hivesigner mantém a consulta própria da sua URL e acrescenta os parâmetros dele depois dela.

### Aplicativos móveis e de desktop {#native-apps}

O Hivesigner coloca o token na URL de retorno. Um esquema próprio como `myapp://` não está preso a um único aplicativo: outro aplicativo no mesmo dispositivo pode reivindicá-lo e receber o token. Por isso o Hivesigner recusa esquemas próprios e envia tokens apenas para um endereço https ou para o loopback do próprio dispositivo da pessoa.

Um aplicativo nativo usa, em vez disso, um destes caminhos:

- **Um link https que pertence a ele.** Registre uma URL de retorno no seu domínio que o sistema operacional abra dentro do seu aplicativo (App Links no Android ou Universal Links no iOS).
- **Uma URL de retorno em loopback.** O aplicativo escuta em `127.0.0.1` pelo redirecionamento. Registre `http://127.0.0.1/auth` (ou `localhost`) e use qualquer porta livre em tempo de execução: a porta não precisa coincidir.

## Segredo do cliente {#client-secret}

O segredo do cliente prova que uma troca de código vem do seu servidor. Ele é obrigatório no [fluxo por código](/docs/oauth2#code-flow): seu servidor o envia com cada código ou token de atualização para `/api/oauth2/token`. O fluxo por token não o usa.

- **Gere um valor aleatório longo**, por exemplo com `openssl rand -hex 32`.
- **Defina-o na página de perfil.** O Hivesigner guarda apenas o hash sha256 dele, no perfil da conta do seu aplicativo. Deixar o campo em branco mantém o segredo atual.
- **Guarde-o no seu servidor.** Nunca o coloque numa página da web, num aplicativo móvel ou numa URL.
- **Para trocá-lo,** defina um novo e atualize seu servidor ao mesmo tempo.

## Conceder autoridade de postagem a @hivesigner {#grant-hivesigner}

A API transmite com a chave de postagem da conta @hivesigner. O Hive só aceita essa assinatura para os seus usuários quando a conta do seu aplicativo adicionou @hivesigner à própria autoridade de postagem. Veja [A cadeia de autoridade de postagem](/docs/how-it-works#authority-chain).

1. Selecione a conta do seu aplicativo no Hivesigner.
2. Abra https://hivesigner.com/authorize/hivesigner.
3. A página diz «Autorizar @hivesigner» e «@hivesigner poderá publicar, comentar, votar e seguir como @myapp.». Escolha **Autorizar**. Isso exige a chave ativa da conta do aplicativo.

Você faz isso uma vez só. Sem isso, toda transmissão falha com `unauthorized_client` e «Broadcaster account doesn't have permission to broadcast for @myapp». Um aplicativo que só faz login não precisa disso.

Essa concessão também deixa @hivesigner publicar como a própria conta do seu aplicativo, mais um motivo para reservar a conta do aplicativo apenas para o aplicativo.

Os aplicativos que transmitem pelo Hivesigner com essa concessão podem aparecer no diretório de aplicativos em https://hivesigner.com/apps, ordenados por quantas pessoas os usam.

## O que os usuários veem quando algo está errado {#refused-requests}

O Hivesigner recusa uma solicitação que não consegue atender com segurança. Ele mostra uma mensagem e um botão **Relatar este problema**. A solicitação não pode ser aprovada. Nada é enviado à sua URL de retorno.

| Problema | O que a pessoa lê |
| --- | --- |
| O `redirect_uri` não é uma das suas URIs de redirecionamento | «A URL de redirecionamento deste aplicativo não está registrada. Para sua segurança, o login foi bloqueado.» |
| O `client_id` não é uma conta do Hive | «@myapp não é uma conta do Hive, então não há aplicativo para autorizar. Volte ao site e tente novamente.» |
| A conta não está marcada como aplicativo | «@myapp não está configurado como aplicativo, então não pode fazer seu login. Volte ao site e tente novamente.» Ative **Esta conta é um aplicativo**, como acima. |
| Falta o `redirect_uri` na solicitação | «Esta solicitação de autorização está incompleta: ela não informa nenhum aplicativo ou nenhuma URL de redirecionamento. Volte ao aplicativo e tente novamente.» |

Se seus usuários relatarem um destes casos, compare o `redirect_uri` que seu aplicativo envia com as suas URIs de redirecionamento, caractere por caractere.

## Lista de conferência {#checklist}

1. Uma conta do Hive para o aplicativo, adicionada ao Hivesigner com a chave ativa dela.
2. Em https://hivesigner.com/profile: «Esta conta é um aplicativo» ativado, as URIs de redirecionamento listadas, um segredo do cliente definido se você usa o fluxo por código.
3. @hivesigner autorizado em https://hivesigner.com/authorize/hivesigner, se você transmite pela API.
4. Um link de login que envia exatamente uma das suas URIs de redirecionamento. Veja [Entrar com OAuth2](/docs/oauth2).
