O Hivesigner assina com as chaves das contas do Hive que você adiciona a ele. Você adiciona uma conta uma vez em cada navegador que usar. O Hivesigner então guarda as chaves dela naquele navegador, criptografadas com um código de acesso se você definir um.

## Adicionar uma conta {#add-account}

1. Confira se a barra de endereços do navegador mostra `https://hivesigner.com`. Veja [Confira primeiro o endereço](/docs/safety#check-the-address).
2. Abra [hivesigner.com/import](https://hivesigner.com/import). Se este navegador ainda não tem nenhuma conta, **Configurar o Hivesigner** na página inicial abre o mesmo formulário.
3. Em **Nome de usuário**, digite seu nome de usuário do Hive em minúsculas, sem o `@`.
4. Em **Chave privada**, cole uma das suas chaves privadas. Veja antes [Qual chave adicionar](/docs/accounts#which-key).
5. Deixe **Proteger com um código de acesso (recomendado)** marcado e escolha um **Código de acesso**. Ele precisa de pelo menos 4 caracteres. Veja [Proteja-a com um código de acesso](/docs/accounts#passcode).
6. Selecione **Adicionar conta**.

O Hivesigner confere a chave com a sua conta na rede Hive antes de guardar qualquer coisa. Ele compara a parte pública da chave com as chaves que sua conta declara. A chave privada em si não é enviada a lugar nenhum. Se o nome de usuário não for uma conta do Hive, ou se a chave não pertencer a ela, o formulário diz “Nome de usuário ou chave inválidos. Use sua senha mestra ou sua chave de proprietário, ativa, de postagem ou de memo.”

A conta que você adiciona passa a ser a conta selecionada: a que o Hivesigner usa nas telas dele. Se uma solicitação levou você ao formulário, o Hivesigner devolve você àquela solicitação. Caso contrário, ele abre a página **Contas**.

### Adicionar outra chave a uma conta {#add-a-key}

Para adicionar uma segunda chave a uma conta que já está aqui (a chave ativa ao lado da de postagem, por exemplo), adicione a conta de novo com a chave nova. O Hivesigner mantém as chaves que já tem e acrescenta a nova. Uma chave nova para um tipo que já está aqui substitui a anterior.

Se a conta tem um código de acesso, deixe **Proteger com um código de acesso (recomendado)** marcado e digite o mesmo código. O Hivesigner recusa qualquer outra coisa:

- Sem código de acesso, o formulário diz “Esta conta está protegida neste dispositivo. Digite o código de acesso dela para adicionar a chave.”
- Com um código diferente, ele diz “Código de acesso incorreto. A chave não foi salva.”

## Qual chave adicionar {#which-key}

Uma conta do Hive tem várias chaves privadas. Cada uma permite ações diferentes. Você as recebeu da carteira ou do aplicativo que criou sua conta do Hive, normalmente na página de chaves ou de senha dele. O Hivesigner não pode mostrá-las a você.

| Chave | Para que o Hivesigner a usa |
| --- | --- |
| Postagem | Entrar em aplicativos, votar, postar e comentar, seguir, editar seu perfil e resgatar suas recompensas. |
| Ativa | Operações de carteira como transferências, power up ou power down, delegações, poupança e conversões. Votos em testemunhas e em propostas. Autorizar um aplicativo pela primeira vez e revogar um aplicativo. |
| Proprietário | Trocar sua chave de proprietário ou sua conta de recuperação. No dia a dia você não precisa dela. |
| Memo | Nada. O formulário a aceita, mas uma conta que só tem a chave de memo não consegue entrar: a tela da solicitação mostra então “Adicione uma chave de postagem ou uma chave ativa de @USUARIO para continuar”. |

Adicione a chave de postagem para o uso do dia a dia. Adicione a chave ativa só quando precisar dela para uma operação de carteira ou para autorizar um aplicativo pela primeira vez. Quando uma tela precisa de uma chave que este dispositivo não tem, ela avisa e deixa você adicioná-la.

Sua senha mestra também funciona no campo **Chave privada**. O Hivesigner deriva dela as suas chaves e guarda todas as que ainda correspondem à sua conta, inclusive a de proprietário. Adicionar as chaves separadamente mantém a chave de proprietário fora deste dispositivo.

> **Nota:** o Hivesigner assina cada transação exatamente com a chave de que ela precisa. Isso segue uma regra do Hive em vigor desde um hard fork de 2025. Uma chave ativa não pode mais assinar uma ação de postagem, como um voto. Uma chave de proprietário não pode mais assinar uma operação de carteira. Adicione a chave de postagem mesmo que a chave ativa já esteja aqui.

Entrar em um aplicativo é diferente: não é uma transação. O Hivesigner faz seu login com a chave de postagem, ou com a chave ativa quando este dispositivo não tem a de postagem da conta.

## Proteja-a com um código de acesso {#passcode}

O código de acesso é uma senha que você escolhe só para este navegador. Ele não é sua senha do Hive e não é nenhuma das suas chaves. O Hivesigner o usa para criptografar as chaves da conta antes de guardá-las. Ele o pede de novo para abri-las.

- O Hivesigner não guarda seu código de acesso nem o envia a lugar nenhum. Ninguém pode recuperá-lo para você.
- Cada conta neste dispositivo tem o próprio código de acesso. Você pode usar o mesmo para todas.
- Um código mais longo é mais difícil de adivinhar. Não use sua senha mestra do Hive nem uma das suas chaves como código de acesso.

Sem um código de acesso, o Hivesigner guarda as chaves da conta neste navegador sem criptografia. Ele as abre sozinho toda vez que inicia, então qualquer pessoa que use este navegador pode assinar com elas. A página **Contas** marca essas contas com **Sem código de acesso**.

Para colocar um código de acesso em uma conta que não tem nenhum, adicione a conta de novo com uma das chaves dela e um código de acesso. O Hivesigner então criptografa todas as chaves da conta com esse código.

Para trocar um código de acesso, [remova a conta](/docs/accounts#remove-account) e adicione-a de novo com o código novo. Remover apaga deste navegador todas as chaves da conta, então adicione cada chave outra vez (a de postagem e depois a ativa, se você a usa).

## Desbloquear uma conta {#unlock}

Uma conta com código de acesso começa bloqueada toda vez que o Hivesigner abre: em uma aba nova, depois de recarregar ou quando um aplicativo envia você para ele. Não é preciso desbloqueá-la com antecedência. A tela que precisa das chaves mostra um campo **Código de acesso** acima do próprio botão (por exemplo **Entrar**, **Aprovar** ou **Desbloquear**). Um clique desbloqueia a conta e continua.

Um código errado mostra “Código de acesso incorreto.” e nada é assinado.

O Hivesigner mantém as chaves desbloqueadas só na memória, nunca no armazenamento. A conta continua desbloqueada naquela aba até você fechá-la ou recarregá-la.

## Trocar de conta {#switch-accounts}

A página **Contas** lista de A a Z as contas deste dispositivo. A conta selecionada tem uma marca de seleção. A partir de 6 contas, um campo **Buscar contas** filtra a lista.

Selecione uma conta para torná-la a conta selecionada. Aqui o Hivesigner não pede o código de acesso. Quem pede é a tela que precisa das chaves.

Na tela de uma solicitação, a linha que nomeia a conta (“Entrando como”, “Autorizando como” ou “Assinando como”) tem um link **Trocar de conta**. Ele abre a mesma lista ali mesmo, então você pode escolher outra conta sem sair da solicitação. **Adicionar outra conta**, abaixo da lista, abre o formulário **Adicionar conta** e depois devolve você à solicitação.

## Remover uma conta {#remove-account}

1. Abra a página **Contas**.
2. Selecione o **✕** ao lado da conta. O rótulo dele para leitores de tela é **Remover do Hivesigner @USUARIO**.
3. Confirme quando o navegador perguntar “Remover @USUARIO deste dispositivo? As chaves dessa conta salvas aqui serão excluídas.”

Remover uma conta apaga as chaves dela só deste navegador. Sua conta do Hive não muda. Os aplicativos que você autorizou continuam com o acesso, porque esse acesso fica guardado na blockchain Hive. Para tirá-lo, veja [Ver e tirar o acesso de um aplicativo](/docs/signing-in#remove-access).

Se você remover a conta selecionada, outra conta deste dispositivo passa a ser a selecionada.

Se o navegador não deixar o Hivesigner salvar a mudança, você vê “Removida só nesta sessão: o armazenamento não está disponível, então esta conta vai voltar quando você recarregar a página.”

## Se você esquecer seu código de acesso {#forgotten-passcode}

Ninguém consegue recuperar um código de acesso, nem o Hivesigner. Sua conta do Hive não é afetada: o código só protege a cópia das suas chaves que está neste navegador.

1. [Remova a conta](/docs/accounts#remove-account) deste dispositivo.
2. [Adicione-a de novo](/docs/accounts#add-account) com a chave dela e um código de acesso novo.

Nada muda na blockchain Hive. Os aplicativos que você autorizou continuam com o acesso.

## Onde suas chaves ficam guardadas {#where-keys-are-stored}

O Hivesigner guarda suas chaves só neste navegador, neste dispositivo, no armazenamento que o navegador reserva para hivesigner.com.

- Elas não são sincronizadas. Outro navegador, outro perfil do navegador ou outro dispositivo não as têm. Adicione a conta lá também.
- Limpar os dados do site ou os dados de navegação de hivesigner.com apaga as chaves. Fechar uma janela anônima também.
- O Hivesigner não é um backup. Guarde suas chaves ou sua senha mestra em segurança em outro lugar.
