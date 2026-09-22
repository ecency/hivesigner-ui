Os aplicativos podem pedir que você assine uma transação do Hive, como um voto, uma transferência ou um post. Eles enviam um link que abre o Hivesigner. O Hivesigner mostra em palavras claras o que a solicitação faz, de que chave ela precisa e para onde ela leva você depois. Nada é assinado até você aprovar. Os aplicativos também podem pedir que você assine uma mensagem, que nunca chega à blockchain.

## A tela Confirmar transação {#confirm-screen}

Um link de assinatura abre uma tela com o título “Confirmar transação”. Ela mostra um cartão para cada operação da solicitação. Uma operação é uma ação no Hive, como um voto ou uma transferência.

Quando uma solicitação traz mais de uma operação, os cartões são numerados e uma linha acima deles diz “Esta solicitação contém 3 operações. Revise todas antes de aprovar.”

### O resumo {#summary}

Cada cartão começa com uma frase que diz o que a operação faz, com os valores da solicitação. Por exemplo:

| Operação | O que o cartão diz |
| --- | --- |
| Uma transferência | Enviar 1.000 HIVE para @bob (e o memo abaixo, como Memo: ...) |
| Um voto | Voto positivo em @alice/meu-post (e o peso do voto abaixo, como 100%) |
| Um post ou uma resposta | Publicar o post “Meu título”, ou Responder a @alice/meu-post |
| Uma ação definida por um aplicativo do Hive | Ação personalizada (follow) |
| Uma mudança em quem controla uma conta | Atualizar autoridades da conta |

Outras operações mostram o nome delas, como “Power up” ou “Delegar Hive Power”.

Ao lado da frase, um rótulo em maiúsculas mostra a chave de que a operação precisa: POSTAGEM, ATIVA ou PROPRIETÁRIO.

### Os detalhes {#details}

Abaixo da frase, o cartão lista os valores que a operação carrega:

- a conta em nome da qual a operação age
- para um post ou comentário: o link permanente (o endereço do post), a comunidade ou tag, o corpo e os metadados
- para uma ação personalizada: todos os valores dos dados dela, um por linha, para que nada seja cortado
- para uma mudança de autoridades: o limiar, as chaves e as contas que ela define

Uma mudança de autoridades também avisa quando ela removeria suas chaves, com “chaves: NENHUMA (sua chave é removida)”. Um limiar ausente aparece como “limiar NÃO DEFINIDO (tratado como 0)”.

No resumo e nos detalhes, os caracteres que poderiam esconder texto ou mudar a direção dele aparecem como `�`. O que você lê não pode fingir ser outra coisa.

**Mostrar operação bruta** (ou **Mostrar operações brutas**) abre as operações exatas que serão assinadas.

Quando um valor é dado em Hive Power, o Hivesigner o converte pela taxa atual. Ele mostra “Carregando a taxa atual de Hive Power…” e espera essa taxa antes de deixar você aprovar.

Algumas solicitações trazem uma transação preparada em outro lugar, por exemplo para uma conta controlada por várias pessoas. A tela diz então “Esta solicitação forneceu o próprio cabeçalho de transação. Expiração: DATA.” Se outras pessoas já a assinaram, ela acrescenta “Ela já contém 2 assinaturas.”

## De qual chave ela precisa {#which-key}

Abaixo dos cartões, uma linha nomeia a chave de que a solicitação inteira precisa: “Será assinada com sua chave de postagem”, “Será assinada com sua chave ativa” ou “Será assinada com sua chave de proprietário”.

O Hivesigner assina exatamente com essa chave. Uma chave ativa não pode assinar um voto e uma chave de proprietário não pode assinar uma transferência. É uma regra do Hive desde um hard fork de 2025. Veja [Qual chave adicionar](/docs/accounts#which-key).

Todas as operações de uma mesma solicitação precisam da mesma chave. Quando não é o caso, a linha diz “Esta transação precisa de mais de uma autoridade e não pode ser assinada com uma única chave.” Não há botão para aprová-la. Volte ao aplicativo.

Solicitações com a chave de proprietário são raras. Elas mudam quem pode controlar ou recuperar sua conta. Leia duas vezes. Veja [Leia antes de aprovar](/docs/safety#read-before-approving).

### Quando a chave está faltando {#missing-key}

Se a conta selecionada não tem a chave neste dispositivo, a tela avisa. Por exemplo: “Isto precisa da sua chave ativa, que @USUARIO não tem aqui.”

1. Selecione **Adicionar outra conta** abaixo da mensagem. Isso abre o formulário **Adicionar conta**.
2. Digite o mesmo nome de usuário e a chave que falta. Se a conta tem um código de acesso, digite-o também.
3. Selecione **Adicionar conta**. O Hivesigner adiciona a chave e devolve você à solicitação.

Se a conta estiver bloqueada, a tela mostra um campo **Código de acesso** acima do botão. Um clique desbloqueia a conta e aprova. Se a chave estiver mesmo faltando, a tela avisa depois do desbloqueio.

Se este navegador ainda não tem nenhuma conta, o botão diz **Continuar** e abre o formulário **Adicionar conta**.

## Aprovar ou assinar {#approve}

A linha da conta acima do botão diz “Assinando como” com a conta que assina. **Trocar de conta** deixa você escolher outra. Veja [Trocar de conta](/docs/accounts#switch-accounts).

- **Aprovar** assina a transação no seu navegador e a envia para a rede Hive. O resultado diz “Transação transmitida com sucesso” com um **ID da transação** que abre a transação em um explorador de blocos.
- **Assinar** aparece no lugar quando a solicitação pede apenas uma assinatura. O Hivesigner assina a transação sem enviá-la à rede. Ele entrega a assinatura ao aplicativo, ou a mostra quando a solicitação não informa nenhum site.

Se a rede recusar a transação, você vê “Sua transação não foi transmitida” com a “Mensagem de erro” que a rede deu. Você pode tentar de novo.

## O site para onde você volta {#return-site}

Quando a solicitação informa um site de retorno, um aviso no topo diz “Você será redirecionado para HOST.” Depois que você aprova, o Hivesigner leva você para lá. Confira se HOST é o site de onde você veio.

Quando a solicitação não informa nenhum site, o Hivesigner fica na tela do resultado.

## Uma solicitação para outra conta {#another-account}

Uma solicitação pode ser feita para uma conta diferente da selecionada. O Hivesigner mostra isso de duas maneiras.

**A solicitação precisa ser assinada por outra conta.** A tela diz “Esta solicitação precisa ser assinada por @CONTA. Troque para essa conta.” A linha da conta diz “Conta selecionada” e a lista de contas se abre abaixo dela. Escolha aquela conta, ou adicione-a com **Adicionar outra conta**. O Hivesigner não assina a solicitação com nenhuma outra conta.

**Uma operação age em nome de outra conta.** Isso acontece com contas administradas por várias pessoas. Um aviso no topo diz “Esta solicitação não age em nome de @USUARIO, mas em nome de @CONTA. Só continue se você administrar essa conta.” Os detalhes de cada cartão nomeiam a conta em nome da qual ele age.

## Solicitações que o Hivesigner não consegue ler {#invalid-requests}

O Hivesigner nunca assina uma solicitação que ele não consegue ler e mostrar por completo. Isso inclui uma operação que ele não conhece, uma solicitação sem operações, um valor que não cabe na operação (um número que não é um número, um valor malformado) e dados a mais que ele não consegue mostrar.

A tela diz então “Ops, algo deu errado. Os dados fornecidos são inválidos.” Volte ao aplicativo. Para avisar a equipe do Hivesigner, selecione **Relatar este problema**.

## Solicitações de assinatura de mensagem {#message-requests}

Alguns aplicativos pedem que você assine uma mensagem em vez de uma transação, por exemplo para provar que a conta é sua. Uma mensagem é texto. Assiná-la não muda nada na blockchain.

A tela mostra:

- Um título como “APLICATIVO pede que você assine uma mensagem.” Quando o aplicativo tem conta no Hive, a linha abaixo a nomeia: “Conta do Hive @CONTA_APP”.
- “Leva você para HOST”: o site que recebe a assinatura. A mesma linha aparece de novo ao lado do botão.
- **Mensagem**: o texto inteiro, exatamente como será assinado. Os caracteres que poderiam esconder texto ou mudar a direção dele aparecem como códigos destacados, como `\u{200B}`.
- A chave que ela usa: “Será assinada com sua chave de postagem” ou “Será assinada com sua chave ativa”. O Hivesigner nunca assina uma mensagem com a chave de proprietário.
- Um aviso: “Sua assinatura prova a qualquer pessoa que a veja que @USUARIO assinou exatamente este texto. Assine apenas uma mensagem que você entenda.”
- A linha da conta, “Assinando como”, com **Trocar de conta**.

Selecione **Assinar** para assinar. O Hivesigner devolve você ao site com a assinatura, seu nome de usuário, o tipo de chave e a chave pública que produziu a assinatura. Uma chave pública é a metade compartilhável de um par de chaves: ela não pode assinar nada.

Selecione **Cancelar** para ir à sua página **Contas**. O site não recebe nada.

Se a conta não tem a chave neste dispositivo, a tela avisa. Por exemplo: “Isto precisa da sua chave de postagem, que @USUARIO não tem aqui.” Selecione **Trocar de conta** e depois **Adicionar outra conta**. [Adicione a chave que falta](/docs/accounts#add-a-key) para a mesma conta. O Hivesigner devolve você à solicitação.

### Por que algumas mensagens são recusadas {#refused-messages}

**Uma mensagem que funciona como um login do Hivesigner.** Certos textos têm exatamente o formato de um login do Hivesigner. Assinar um deles daria ao site acesso à sua conta. O Hivesigner nunca assina esse texto e diz “Esta mensagem é um token do Hivesigner. Assiná-la daria ao site acesso à sua conta, por isso ela não pode ser assinada.”

**Uma solicitação que o Hivesigner não pode usar.** O Hivesigner recusa uma solicitação sem mensagem ou sem endereço de retorno. Ele também recusa uma solicitação que pede uma chave que não seja a de postagem ou a ativa, uma que informa um aplicativo que não é uma conta do Hive, ou uma cujo endereço de retorno não é seguro ou não está registrado para o aplicativo. Ele diz “Esta solicitação de assinatura não pode ser usada: ela precisa de uma mensagem, uma chave de postagem ou ativa e uma URL de redirecionamento segura registrada para o aplicativo. Volte ao site e tente novamente.”

Se o Hivesigner não conseguir ler os dados do aplicativo na rede Hive, ele diz “Não foi possível carregar os dados da conta a partir da rede Hive.” Ele não assina nada até conseguir. Selecione **Tentar novamente**.

## Assinar uma mensagem por conta própria {#sign-message}

Você pode assinar uma mensagem por conta própria para provar que controla uma conta.

1. Abra [hivesigner.com/signmessage](https://hivesigner.com/signmessage). O rodapé leva até lá como **Assinar mensagem**.
2. Se a conta selecionada estiver bloqueada, digite o código de acesso dela e selecione **Desbloquear**. Se nenhuma conta estiver selecionada, a página leva às suas contas.
3. Digite o texto em **Mensagem**. O Hivesigner remove espaços e quebras de linha do início e do fim.
4. Escolha a chave em **Chave para assinar**. Ali são listadas as chaves que a conta selecionada tem neste dispositivo, da mais forte para a mais fraca. A mais forte vem escolhida de início. Troque para **Postagem**, a menos que você precise de outra.
5. Selecione **Assinar mensagem**.

O **Resumo da assinatura** mostra o **Autor**, a **Autoridade usada**, um **Token de verificação** e um **Link de verificação**. O token de verificação reúne num único texto a mensagem, seu nome de usuário e a assinatura. Compartilhe o link ou o token com quem deve conferir a mensagem.

Uma assinatura não revela sua chave. Ela mostra, sim, qual chave a produziu.

## Verificar uma mensagem {#verify-message}

1. Abra [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage). O rodapé leva até lá como **Verificar mensagem**.
2. Cole o token em **Token de verificação** e selecione **Verificar assinatura**.

Um link de verificação abre esta página e confere a mensagem sozinho.

O resultado diz “A assinatura é válida para USUARIO” ou “Não foi possível verificar a assinatura com as chaves da conta.” Abaixo, você vê o **Autor**, a **Chave pública recuperada**, a **Autoridade correspondente** (o tipo de chave que assinou) e a **Mensagem**.

O Hivesigner confere a assinatura com as chaves que a conta tem agora na rede Hive. Uma mensagem assinada com uma chave que a conta já substituiu não é mais verificada.
