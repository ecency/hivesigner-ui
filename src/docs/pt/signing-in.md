Quando um aplicativo deixa você entrar com o Hivesigner, ele envia você para hivesigner.com com uma solicitação. O Hivesigner mostra quem está pedindo, o que é pedido e qual das suas contas responde. Você decide ali. O aplicativo nunca recebe suas chaves: ele recebe uma prova do seu nome de usuário, assinada no seu navegador.

## A tela da solicitação {#request-screen}

De cima para baixo, a tela mostra:

- **O aplicativo.** A imagem dele e um título. Quando o aplicativo pede acesso de postagem pela primeira vez, o título diz “APLICATIVO está solicitando acesso à sua conta.” Nos outros casos, ele diz “Entrar em APLICATIVO”. O nome que aparece ali é escolhido pelo aplicativo.
- **Conta do Hive @CONTA_APP.** A conta real do aplicativo no Hive. Um aplicativo pode se chamar como quiser, mas não pode mudar este nome. Confira.
- **Leva você para HOST.** O site para onde o Hivesigner devolve você quando você aprova.
- **Escopo.** O que o aplicativo pede: [só login ou acesso de postagem](/docs/signing-in#scopes).
- **A linha da conta.** “Autorizando como” ou “Entrando como”, com a conta que o aplicativo vai receber e um link **Trocar de conta**. Veja [Escolha a conta](/docs/signing-in#choose-account).
- **O botão.** **Autorizar** ou **Entrar**. Se a conta estiver bloqueada, um campo **Código de acesso** fica acima dele, e um clique desbloqueia a conta e continua.
- **Cancelar.** Leva você à sua página **Contas**. O Hivesigner não envia nada ao aplicativo.

Se este navegador ainda não tem nenhuma conta, o botão diz **Continuar**. Ele abre o formulário **Adicionar conta** e depois devolve você à solicitação. Veja [Adicionar uma conta](/docs/accounts#add-account).

## Só login ou acesso de postagem {#scopes}

Um aplicativo pede uma destas duas coisas. Não há meio-termo.

### Só login {#sign-in-only}

**Escopo** mostra “Ver o nome de usuário da sua conta”. O aplicativo fica sabendo qual conta do Hive você é, confirmado pela sua assinatura. Ele não recebe nenhuma permissão para agir por você. O botão diz **Entrar**.

Um site sem conta própria no Hive também pode pedir que você entre. A tela dele diz “HOST quer confirmar seu nome de usuário do Hive.” Uma solicitação assim é sempre só de login. O Hivesigner nomeia o site pelo endereço dele, porque esse endereço é a única coisa que você pode conferir sobre ele.

### Acesso de postagem {#posting-access}

**Escopo** mostra “Com sua autoridade de postagem, APLICATIVO poderá:” seguido do que isso significa:

- **Postar e comentar:** publicar posts e comentários em seu nome.
- **Votar:** dar votos positivos e negativos com sua conta.
- **Seguir e atualizar seu feed:** seguir, silenciar e republicar em seu nome.

A autoridade de postagem é a parte da sua conta do Hive que controla as ações do dia a dia. Ao aprovar, você adiciona a conta do aplicativo no Hive à sua autoridade de postagem. É uma única concessão na blockchain Hive, não uma lista de permissões separadas.

## O que o acesso de postagem permite {#what-posting-access-allows}

Com acesso de postagem, o aplicativo pode fazer em seu nome tudo o que sua chave de postagem pode fazer:

- publicar, editar e apagar seus posts e comentários
- votar
- seguir, silenciar e republicar
- editar seu perfil
- resgatar suas recompensas para a sua própria carteira
- outras ações do dia a dia que os aplicativos e jogos do Hive usam

Ele nunca pode:

- mexer nos seus fundos: enviar HIVE ou HBD, fazer power up ou power down, delegar Hive Power ou usar sua poupança
- trocar suas chaves nem quem controla sua conta
- dar acesso a outros aplicativos

> **Aviso:** autorize apenas aplicativos em que você confia. O acesso de postagem dura até você revogá-lo. Ele fica guardado na blockchain Hive, não no Hivesigner: remover a conta do Hivesigner não encerra esse acesso.

## A primeira vez que você autoriza um aplicativo {#first-time}

Na primeira vez que você dá acesso de postagem a um aplicativo, a tela mostra este aviso: “Primeira autorização: isto adiciona @CONTA_APP à sua autoridade de postagem na blockchain e exige sua chave ativa uma única vez. Essa conta poderá postar em seu nome até que você revogue a autorização.”

Mudar quem pode postar pela sua conta é uma mudança na própria conta, então isso exige sua chave ativa. Se este dispositivo não a tem, a tela pede por ela ali mesmo:

1. Cole sua chave ativa em **Chave ativa ou senha mestra de @USUARIO**. O Hivesigner a confere com a sua conta na rede Hive e a salva neste dispositivo junto com as outras chaves. Se você colar sua senha mestra, o Hivesigner guarda dela só a chave ativa, mais a de postagem quando este dispositivo não a tem.
2. Se a conta não tem código de acesso, o formulário oferece **Proteger com um código de acesso (recomendado)**, marcado por padrão. Se a conta tem um e o Hivesigner precisa dele de novo, o formulário o pede em **Código de acesso de @USUARIO**.
3. Selecione **Adicionar chave ativa** e depois **Autorizar**.

O Hivesigner então envia a mudança para a rede Hive a partir do seu navegador. Ele espera a mudança aparecer na blockchain antes de devolver você ao aplicativo, já logado. Se isso demorar demais, você vê “A autorização foi enviada, mas ainda está sendo confirmada. Tente novamente em instantes.”

Depois disso, a chave ativa fica neste dispositivo. Para manter aqui só a chave de postagem, veja [Adicione só as chaves necessárias](/docs/safety#only-the-keys-you-need).

## Autorizar um aplicativo pelo diretório {#directory}

Cada aplicativo em [hivesigner.com/apps](https://hivesigner.com/apps) abre uma página com o título “Autorizar @CONTA_APP”. Ela mostra o que o aplicativo publica sobre si mesmo e a frase “@CONTA_APP poderá publicar, comentar, votar e seguir como @USUARIO.”

Selecionar **Autorizar** dá ao aplicativo acesso de postagem na hora, como faz a tela da primeira vez. Isso exige sua chave ativa. Nenhum aplicativo pediu isso a você, então use apenas quando for essa a sua intenção. **Cancelar** leva você à sua página **Contas**.

Quando sua conta já deu acesso de postagem ao aplicativo, a página diz “Autorização concedida a @CONTA_APP.” e oferece **Continuar**.

## Voltando a um aplicativo {#coming-back}

Quando sua conta já deu acesso de postagem a um aplicativo, nada de novo é concedido. A tela é mais curta:

- O título diz “Entrar em APLICATIVO”.
- Uma linha diz “Você já autorizou @CONTA_APP. Nenhuma permissão nova é concedida.”
- A linha da conta diz “Entrando como”.
- O botão diz **Entrar**.

Para isso você só precisa da sua chave de postagem (ou da sua chave ativa). Se você revogou o aplicativo nesse meio-tempo, a tela da primeira vez aparece de novo.

## Escolha a conta {#choose-account}

A linha da conta nomeia a conta que o aplicativo vai receber. Confira antes de aprovar, principalmente se você tem várias contas neste dispositivo.

- Selecione **Trocar de conta** para abrir ali mesmo a lista das suas contas. Escolha outra e a tela passa para aquela conta.
- Selecione **Adicionar outra conta**, abaixo da lista, para adicionar uma conta que ainda não está neste dispositivo. O Hivesigner devolve você à solicitação depois.

Um aplicativo pode sugerir qual conta usar. Se essa conta estiver neste dispositivo, o Hivesigner a seleciona. Mesmo assim você pode trocar.

## Quando o Hivesigner recusa uma solicitação {#refused-requests}

O Hivesigner não deixa você aprovar uma solicitação que ele não consegue conferir. A tela mostra uma destas mensagens no lugar:

| Mensagem | O que significa |
| --- | --- |
| “A URL de redirecionamento deste aplicativo não está registrada. Para sua segurança, o login foi bloqueado.” | O endereço de retorno não é um dos que o aplicativo declarou na conta dele no Hive. |
| “@CONTA_APP não é uma conta do Hive, então não há aplicativo para autorizar. Volte ao site e tente novamente.” | A solicitação informa um aplicativo que não existe. |
| “Este site pediu que seu login fosse enviado por um endereço http:// sem criptografia. O Hivesigner só envia por https. Peça ao site para usar um endereço seguro.” | O endereço de retorno não é seguro. |
| “Este site pediu que seu login fosse enviado para um endereço que não é uma URL da web. Volte ao site e tente novamente.” | O endereço de retorno não é um endereço da web. |
| “Esta solicitação de autorização está incompleta: ela não informa nenhum aplicativo ou nenhuma URL de redirecionamento. Volte ao aplicativo e tente novamente.” | Faltam partes na solicitação. |

Volte ao aplicativo e tente novamente. Se o problema continuar, selecione **Relatar este problema**. Isso envia o link e sua observação opcional para a equipe do Hivesigner, com os segredos ocultos.

Se o Hivesigner não conseguir alcançar a rede Hive, ele mostra “Não foi possível carregar os dados da conta a partir da rede Hive.” Selecione **Tentar novamente**.

## Ver e tirar o acesso de um aplicativo {#remove-access}

1. Abra [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps). O rodapé leva até lá como **Aplicativos autorizados**.
2. A página mostra “Aplicativos que podem postar como @USUARIO.” para a conta selecionada, com cada aplicativo abaixo. Para ver os aplicativos de outra conta, selecione-a antes na página **Contas**.
3. Se a conta estiver bloqueada, digite o código de acesso dela e selecione **Desbloquear**.
4. Selecione **Revogar** ao lado do aplicativo. Quando a chave ativa está neste dispositivo, isso tira o acesso do aplicativo na hora.

A lista mostra todas as contas que podem postar como a sua por conta própria, inclusive as que você tenha adicionado com outras ferramentas.

Revogar é uma mudança na sua conta na blockchain Hive, então exige sua chave ativa uma vez. Se este dispositivo não a tem, **Revogar** abre uma página daquele aplicativo (“Revogar @CONTA_APP”) que pede a chave ativa ali mesmo. Ela diz “@CONTA_APP não poderá mais agir como @USUARIO.” Adicione a chave e selecione **Revogar**.

Quando você revoga um aplicativo, o Hivesigner tira a conta dele da autoridade de postagem da sua conta (e da autoridade ativa, se estiver lá). A partir daí o aplicativo não pode mais postar, votar nem agir como você. Se o aplicativo pedir acesso de postagem de novo mais tarde, você vê a tela da primeira vez.

Revogar não encerra sua sessão no site do próprio aplicativo. Saia de lá também, se quiser.
