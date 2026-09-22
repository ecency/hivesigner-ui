O Hivesigner permite que as pessoas usem a conta do Hive no seu aplicativo sem lhe entregar as chaves delas. Ele tem duas partes: um assinador no navegador em https://hivesigner.com e uma API em `https://hivesigner.com/api/`. Esta página explica o que cada parte faz e as duas maneiras pelas quais um aplicativo as usa.

## O assinador no navegador {#browser-signer}

O assinador no navegador é o próprio site do Hivesigner. As pessoas adicionam ali as contas do Hive. As chaves ficam no navegador delas: o Hivesigner não envia nenhuma chave a servidor algum. Seu aplicativo nunca vê nenhuma.

O assinador assina três tipos de coisas, sempre depois que a pessoa viu o que está assinando:

- **Tokens de login.** Seu aplicativo envia alguém ao Hivesigner para entrar. O Hivesigner mostra o nome do seu aplicativo e o que ele pede. Quando a pessoa aprova, o Hivesigner assina com a chave dela uma declaração curta que nomeia a conta dela e o seu aplicativo. Essa declaração assinada é o token que seu aplicativo recebe. Veja [Entrar com OAuth2](/docs/oauth2) e [Tokens](/docs/tokens).
- **Transações.** Um link de assinatura abre uma transação para conferência. Quando a pessoa aprova, o Hivesigner a assina com a chave necessária. Depois a envia à rede Hive a partir do navegador, a não ser que o link peça apenas a assinatura. Veja [Links de assinatura](/docs/sign-links).
- **Mensagens.** Seu aplicativo pode pedir que a pessoa assine um texto com a chave dela, para provar que controla a conta. Veja [Assinatura de mensagens](/docs/message-signing).

## A API {#api}

A API transmite operações de postagem em nome de quem entrou no seu aplicativo: publicações e comentários, votos, seguidas e outras operações `custom_json`, resgate de recompensas e alterações de perfil. Seu aplicativo envia as operações junto com o token da pessoa. A API confere o token, assina a transação com a chave de postagem da conta @hivesigner e a transmite ao Hive.

A API também devolve a conta de quem entrou, troca códigos por tokens e lista os aplicativos que usam o Hivesigner. Veja [API REST](/docs/api).

## A cadeia de autoridade de postagem {#authority-chain}

No Hive, uma conta pode deixar outra agir com a sua autoridade de postagem. A API se apoia em duas dessas concessões:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **A pessoa adiciona a conta do seu aplicativo à autoridade de postagem dela.** A tela de consentimento faz isso na primeira vez em que alguém aprova o acesso de postagem para o seu aplicativo. Isso exige a chave ativa da pessoa uma única vez.
2. **A conta do seu aplicativo adiciona @hivesigner à sua própria autoridade de postagem.** Você faz isso uma vez, ao [registrar seu aplicativo](/docs/register-app#grant-hivesigner).

Antes de transmitir, a API confere se as duas concessões estão no lugar. Ela só transmite operações cujo autor é a pessoa indicada pelo token.

A pessoa pode retirar o acesso do seu aplicativo quando quiser em https://hivesigner.com/authorized-apps. Depois disso, a API não pode mais publicar por ela através do seu aplicativo.

## Duas formas de integrar {#two-ways-to-integrate}

### Entrar e depois transmitir pela API {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

A pessoa aprova uma vez. Depois disso, seu aplicativo pode votar, comentar e publicar por ela sem perguntar de novo, até o token expirar ou a pessoa retirar o acesso. Use este caminho para as ações sociais do dia a dia.

Você precisa de uma conta de aplicativo com URLs de retorno registradas e da concessão para @hivesigner. Veja [Registre seu aplicativo](/docs/register-app). Se você só quer saber quem é a pessoa, veja [Login sem acesso de postagem](/docs/login-only).

### Links de assinatura {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

A pessoa vê cada transação antes de ela ser assinada. Os links de assinatura cobrem 41 operações do Hive, incluindo transferências e outras ações de carteira que exigem a chave ativa. A API nunca lida com elas. Para links de assinatura você não precisa de conta de aplicativo. Veja [Links de assinatura](/docs/sign-links).

### Qual escolher {#which-to-choose}

- **Ações de postagem frequentes** (votos, comentários, seguidas): faça a pessoa entrar com OAuth2 e depois use a API.
- **Ações de carteira**, ou qualquer coisa que exija a chave ativa: use links de assinatura.
- **As duas**: muitos aplicativos fazem as pessoas entrarem com OAuth2 para os recursos sociais e usam links de assinatura para transferências.
- **Apenas a identidade da pessoa**: veja [Login sem acesso de postagem](/docs/login-only).

## Código-fonte {#source-code}

O Hivesigner é de código aberto:

- O assinador no navegador: https://github.com/ecency/hivesigner-ui
- A API: https://github.com/ecency/hivesigner-api
- O SDK de JavaScript (pacote npm `hivesigner`): https://github.com/ecency/hivesigner-sdk. Veja [SDKs](/docs/sdk).
