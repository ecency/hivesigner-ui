Respostas curtas para perguntas comuns. Cada uma leva à página com os detalhes.

## Usando o Hivesigner {#using-hivesigner}

### O Hivesigner é gratuito? {#is-it-free}

Sim. O Hivesigner não cobra das pessoas nem dos aplicativos. Seu código-fonte é aberto, sob a licença MIT.

### O Hivesigner chega a ver minhas chaves? {#keys}

Não. Suas chaves ficam no seu navegador, no seu dispositivo. O Hivesigner assina ali. Elas nunca são enviadas aos servidores do Hivesigner nem aos aplicativos que você usa. Veja [Onde suas chaves ficam guardadas](/docs/accounts#where-keys-are-stored) e [Mantenha suas chaves seguras](/docs/safety).

### E se eu esquecer meu código de acesso? {#forgotten-passcode}

Ninguém consegue recuperar um código de acesso, nem o Hivesigner. Remova a conta do Hivesigner e adicione-a de novo com sua chave do Hive e um código de acesso novo. Sua conta do Hive e os aplicativos que você autorizou não mudam. Veja [Se você esquecer seu código de acesso](/docs/accounts#forgotten-passcode).

### Posso usar o Hivesigner no celular? {#phone}

Sim. Abra https://hivesigner.com no navegador do celular e adicione sua conta ali. Suas chaves ficam guardadas só naquele navegador, então adicione a conta em cada dispositivo que você usar. Veja [Adicionar e gerenciar contas](/docs/accounts).

### Quais aplicativos usam o Hivesigner? {#which-apps}

https://hivesigner.com/apps lista os aplicativos que transmitem para o Hive pelo Hivesigner, dos mais usados para os menos usados. Cada aplicativo publica o próprio nome e a própria descrição. O Hivesigner não os verifica. Abrir um aplicativo ali mostra uma página que pode dar acesso de postagem a ele. Veja [Autorizar um aplicativo pelo diretório](/docs/signing-in#directory).

### Qual é a relação entre o Hivesigner e o Hive Keychain? {#hive-keychain}

São ferramentas separadas. O Hive Keychain é uma extensão de navegador e um aplicativo de celular. O Hivesigner é um site, então não há nada para instalar. Quando um aplicativo pede que você assine uma mensagem, a assinatura é do mesmo tipo que o Hive Keychain produz, então o aplicativo confere qualquer uma das duas com o mesmo código. O token de verificação da página **Assinar mensagem** do Hivesigner é conferido na página **Verificar mensagem** do Hivesigner. Veja [Assinatura de mensagens](/docs/message-signing).

## Criando com o Hivesigner {#building}

### Posso usar o Hivesigner em um aplicativo de celular? {#mobile-app}

Sim. Envie a pessoa ao Hivesigner em um navegador e use uma URL de retorno que seu aplicativo consiga receber: um link https que você controla (Android App Links ou iOS Universal Links) ou um endereço de loopback como `http://127.0.0.1/auth`. Esquemas próprios como `myapp://` são recusados. Veja [Aplicativos de celular e de desktop](/docs/register-app#native-apps).

### Preciso de uma conta de aplicativo? {#app-account}

Você precisa de uma para fazer login das pessoas com acesso de postagem e para transmitir pela API. Veja [Registre seu aplicativo](/docs/register-app). Os [links de assinatura](/docs/sign-links) e a [assinatura de mensagens](/docs/message-signing) funcionam sem ela. O [login sem acesso de postagem](/docs/login-only) também.

### A API pode enviar transferências? {#transfers}

Não. A API transmite apenas operações de postagem, como votos, comentários e seguir. Para transferências e outras ações que precisam da chave ativa, use [links de assinatura](/docs/sign-links): a pessoa aprova cada um com a própria chave.

### Quais linguagens têm SDK? {#languages}

O SDK oficial é para JavaScript. Existem bibliotecas da comunidade para Python. Qualquer linguagem pode chamar a API REST. Veja [SDKs](/docs/sdk) e [API REST](/docs/api).

## Ajuda {#help}

### Onde posso conseguir ajuda? {#get-help}

Pergunte no servidor do Discord do HiveDevs: https://discord.gg/pNJn7wh. Relate um bug abrindo uma issue no repositório do GitHub correspondente: https://github.com/ecency/hivesigner-ui para o site, https://github.com/ecency/hivesigner-api para a API ou https://github.com/ecency/hivesigner-sdk para o SDK de JavaScript. Em uma tela que recusa uma solicitação, **Relatar este problema** envia o problema para a equipe do Hivesigner.

### Como posso contribuir? {#contribute}

O Hivesigner é de código aberto no GitHub, nos três repositórios acima. Abra uma issue com um bug ou uma ideia. Envie um pull request com uma correção.
