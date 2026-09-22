Suas chaves do Hive controlam sua conta. Quem as tiver pode agir como você. O Hivesigner as guarda no seu navegador e mostra o que você assina. Estes hábitos as mantêm seguras.

## Confira primeiro o endereço {#check-the-address}

Antes de digitar uma chave ou um código de acesso, olhe a barra de endereços do navegador. Ela precisa mostrar `https://hivesigner.com`.

- Uma página falsa copia a aparência do Hivesigner, não o endereço dele. Leia o endereço inteiro: `hivesigner.com.example.net` não é hivesigner.com.
- Fique atento a uma palavra a mais, uma letra que falta ou está trocada, ou uma terminação diferente.
- O Hivesigner mostra na barra superior o endereço em que está rodando. Uma página falsa pode escrever qualquer coisa ali, então confie na barra de endereços do navegador.
- Para adicionar uma chave, digite você mesmo o endereço ou use um favorito. Não siga um link de uma mensagem, de um anúncio ou de um resultado de busca.

## O que nunca é preciso informar {#never-needed}

- Entrar, postar, votar, fazer operações de carteira e autorizar aplicativos nunca exigem sua senha mestra nem sua chave de proprietário. Veja [Qual chave adicionar](/docs/accounts#which-key).
- Os aplicativos que usam o Hivesigner nunca precisam das suas chaves. Eles enviam você para hivesigner.com. Suas chaves ficam no seu navegador. Um site que pede para você digitar uma chave na página dele não está pedindo pelo Hivesigner.
- Nunca dê suas chaves nem seu código de acesso a quem os pedir, seja num chat, num e-mail ou num pedido de suporte.

## Adicione só as chaves necessárias {#only-the-keys-you-need}

- Adicione a chave de postagem para o uso do dia a dia.
- Adicione a chave ativa só para operações de carteira, para autorizar um aplicativo pela primeira vez ou para revogar um aplicativo.
- Evite adicionar sua senha mestra. Se adicionar, o Hivesigner guarda todas as chaves que ela abre, inclusive a de proprietário.

Depois de autorizar um aplicativo pela primeira vez, a chave ativa fica neste dispositivo. Para manter aqui só a chave de postagem, [remova a conta](/docs/accounts#remove-account). Depois [adicione-a de novo](/docs/accounts#add-account) só com a chave de postagem.

## Use um código de acesso {#use-a-passcode}

Sem um código de acesso, o Hivesigner guarda suas chaves neste navegador sem criptografia. Ele as abre sozinho toda vez que inicia, então qualquer pessoa que use este navegador pode assinar como você. A página **Contas** marca essas contas com **Sem código de acesso**.

- Escolha um código de acesso que os outros não consigam adivinhar. O Hivesigner aceita 4 caracteres ou mais. Quanto mais longo, mais difícil de adivinhar.
- Não use sua senha mestra do Hive nem uma das suas chaves como código de acesso.

Em um computador usado por outras pessoas:

- Use sempre um código de acesso.
- Feche a aba do Hivesigner quando terminar. Uma conta desbloqueada continua desbloqueada naquela aba até você fechá-la ou recarregá-la.
- Em um computador que não é seu, [remova a conta](/docs/accounts#remove-account) antes de sair. Melhor ainda: não adicione suas chaves ali.

## Leia antes de aprovar {#read-before-approving}

- **Confira a conta.** A linha que diz “Entrando como”, “Autorizando como” ou “Assinando como” nomeia a conta que responde. Troque se não for a certa.
- **Confira para onde você vai depois.** “Leva você para HOST” e “Você será redirecionado para HOST.” nomeiam o site que recebe o resultado. Deve ser o site de onde você veio.
- **Confira quem está pedindo.** O aplicativo escolhe o nome com que se apresenta. A linha “Conta do Hive @CONTA_APP” mostra a conta real dele no Hive. Na página de autorizar ou revogar um aplicativo, o Hivesigner diz sobre o perfil do aplicativo: “Tudo acima é publicado pela própria conta do aplicativo. O Hivesigner não verifica nada disso.”
- **Confira a chave.** Um voto, um post ou um seguir precisam da chave de postagem. Se você queria votar e a tela pede sua chave ativa ou de proprietário, a solicitação faz outra coisa. Pare.
- **Leia as mudanças de autoridade.** “chaves: NENHUMA (sua chave é removida)” significa que a mudança tiraria sua chave da sua conta. Só aprove uma mudança nas suas chaves se você mesmo a iniciou.
- **Leia os avisos.** “Esta solicitação não age em nome de @USUARIO, mas em nome de @CONTA.” significa que a solicitação age por outra conta.
- **Assine apenas mensagens que você entende.** Uma mensagem assinada prova a qualquer pessoa que você assinou exatamente aquele texto.

Veja [Revisar e assinar](/docs/signing) para tudo o que as telas de assinatura mostram.

## Reconheça uma página falsa {#spot-a-fake-page}

Uma página que parece o Hivesigner é falsa quando:

- **O endereço não é hivesigner.com.** Este é o único sinal que vale sempre.
- **Ela recusa sua chave de postagem.** O Hivesigner de verdade aceita a chave de postagem e faz seu login com ela. Uma página que insiste na sua senha mestra ou na chave de proprietário não é o Hivesigner.
- **Ela não conhece as contas que você adicionou.** Seu navegador mantém separado o armazenamento de cada site. Um site falso em outro endereço não consegue ver as contas que você adicionou em hivesigner.com, então ele pede uma chave de novo. O Hivesigner de verdade lembra delas neste navegador e pede só o código de acesso, se você definiu um. Ele pede uma chave apenas quando uma solicitação precisa de uma que este dispositivo não tem, e então diz qual. Por exemplo: “Isto precisa da sua chave ativa, que @USUARIO não tem aqui.”

Um navegador novo ou um dispositivo novo também não têm suas contas. Ali, confira o endereço antes de adicionar uma.

Se você digitou uma chave numa página falsa, considere essa chave roubada. Troque-a no Hive o quanto antes.

## O código é aberto {#open-source}

O código do Hivesigner é público em [github.com/ecency/hivesigner-ui](https://github.com/ecency/hivesigner-ui). Qualquer pessoa pode lê-lo e conferir como ele lida com suas chaves. Para relatar um problema, abra uma issue em [github.com/ecency/hivesigner-ui/issues](https://github.com/ecency/hivesigner-ui/issues). A página **Sobre** leva até lá como **Relatar um bug**.
