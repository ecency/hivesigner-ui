Um link de assinatura abre uma transação do Hive no Hivesigner. A pessoa a confere, aprova com a própria chave e o Hivesigner a transmite a partir do navegador dela. Depois o Hivesigner pode mandar a pessoa de volta ao seu aplicativo com o identificador da transação. Links de assinatura não exigem conta de aplicativo nem token. Eles cobrem todas as 41 operações que o Hivesigner suporta, incluindo transferências e outras ações que exigem a chave ativa.

## Como funciona um link de assinatura {#how-it-works}

1. Seu aplicativo monta um link que carrega uma ou mais operações.
2. A pessoa abre o link. O Hivesigner mostra cada operação em palavras claras na tela «Confirmar transação», junto com a chave de que ela precisa.
3. A pessoa aprova. O Hivesigner assina a transação no navegador com a chave da conta escolhida no Hivesigner. Depois envia a transação à rede Hive.
4. Quando o link indica uma URL de retorno, o Hivesigner manda a pessoa para lá com o identificador da transação.

Seu aplicativo nunca vê uma chave. Qualquer site pode criar um link de assinatura: não há `client_id` para enviar.

## Formas de link {#link-forms}

O Hivesigner lê dois tipos de link de assinatura: links codificados e links antigos.

### Links codificados {#encoded-links}

Um link codificado carrega as operações como JSON, codificado em base64url. Ele usa o formato `hive://sign/...` do pacote `hive-uri`, com `https://hivesigner.com/` no lugar de `hive://`.

| Forma | O que `B64U` contém |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Uma operação: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Uma lista de operações: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Uma transação inteira, com cabeçalho próprio |

`B64U` é o texto JSON, codificado como UTF-8 e depois em base64, com `-` no lugar de `+`, `_` no lugar de `/` e `.` no lugar do preenchimento `=`.

Para `op` e `ops`, o Hivesigner monta a transação em volta das operações. Ele preenche o bloco de referência e a expiração.

Para `tx`, o Hivesigner mantém os próprios `ref_block_num`, `ref_block_prefix` e `expiration` da transação. Ele mantém também as assinaturas que a transação já traz. Isso permite que várias contas assinem uma mesma transação por vez, para uma conta que várias pessoas controlam. O Hivesigner recusa uma transação cuja lista `extensions` não esteja vazia.

> **Observação:** O Hivesigner uniformiza alguns valores antes de assinar, como quantias e campos deixados no padrão. A transação assinada pode então ter um identificador diferente do que você montou. Leia o identificador na URL de retorno.

### Links antigos {#legacy-links}

Um link antigo indica uma operação no caminho e coloca os campos dela na consulta:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Escreva o nome da operação em snake case (`transfer_to_vesting`), camel case (`transferToVesting`) ou kebab case (`transfer-to-vesting`).
- Passe cada campo como parâmetro de consulta com o nome do campo. Codifique cada valor para a URL.
- Escreva listas e objetos em JSON, por exemplo `required_posting_auths=["alice"]`. Uma lista de identificadores ou nomes também pode ser separada por vírgulas: `proposal_ids=379,380`.
- Escreva os booleanos como `true` ou `false`.

Um link antigo carrega uma única operação. Para mais de uma, use um link codificado.

### Valores dos campos {#field-values}

Estas regras valem para todas as formas:

- **Valores padrão.** Um campo que você deixa de fora assume o valor padrão. A conta que age (`voter`, `from`, `owner` e campos parecidos) é, por padrão, a conta que assina. O `weight` de um voto é, por padrão, `10000` (100%).
- **As quantias** são um número e um símbolo: `1.000 HIVE`, `0.500 HBD` ou `100.000000 VESTS`. O Hivesigner escreve HIVE e HBD com 3 casas decimais e VESTS com 6.
- **Hive Power.** Um campo que aceita VESTS também aceita uma quantia em HP, como `100 HP`. O Hivesigner a converte em VESTS pela taxa do momento antes de a pessoa poder aprovar.
- **`__signer`** em qualquer valor vira o nome da conta que assina. Por exemplo, um `custom_json` de seguir pode indicar `__signer` como seguidor dentro do `json` dele.
- **Os inteiros** precisam ser números inteiros dentro da faixa que a blockchain aceita, como de `-10000` a `10000` para o `weight` de um voto.

O Hivesigner recusa o link inteiro quando um valor não cabe no campo dele, quando uma operação é desconhecida ou quando o link não carrega operação alguma. A pessoa vê «Ops, algo deu errado. Os dados fornecidos são inválidos.» e nada é assinado.

## Parâmetros {#parameters}

Acrescente estes à string de consulta de qualquer link de assinatura:

| Parâmetro | Significado |
| --- | --- |
| `cb` | A URL de retorno, codificada em base64url. É o que o `hive-uri` escreve para a opção `callback` dele. |
| `redirect_uri` | A URL de retorno como texto comum codificado para URL. Os links antigos usam este. Um link codificado o usa quando não tem `cb`. |
| `nb` | Apenas assinar. O Hivesigner assina a transação sem transmiti-la. Coloque `{{sig}}` na URL de retorno para receber a assinatura (veja [Marcadores na URL de retorno](#callback-placeholders)). Qualquer valor serve, inclusive vazio (`nb=`). |
| `s` | A conta que precisa assinar. Quando outra conta está escolhida, o Hivesigner pede à pessoa que troque para esta. Ele não assina com nenhuma outra. |

Use uma URL de retorno `https://`. Uma URL que não seja `http` nem `https` o Hivesigner ignora, e ele fica então na própria tela de resultado.

O Hivesigner escolhe a chave a partir das operações. Não há parâmetro para escolhê-la: nos links de assinatura o Hivesigner ignora `authority` (e o parâmetro `a` do `hive-uri`). Veja [De que chave um link precisa](#which-key).

### Marcadores na URL de retorno {#callback-placeholders}

Depois que a pessoa aprova, o Hivesigner preenche estes marcadores na URL de retorno:

| Marcador | Valor |
| --- | --- |
| `{{id}}` | O identificador da transação |
| `{{sig}}` | A assinatura, para um link apenas de assinatura (`nb`) |
| `{{block}}` | Fica vazio |
| `{{txn}}` | Fica vazio |
| `{{data}}` | Fica vazio |

Uma URL de retorno sem nenhum desses marcadores recebe o identificador da transação acrescentado como `id`, depois de `?` ou `&`:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

O Hivesigner redireciona assim que um nó do Hive aceita a transação. Ela pode ainda não estar num bloco. Procure-a pelo identificador quando precisar saber que ela foi incluída.

Sua URL de retorno não é chamada quando a rede rejeita a transação (a pessoa vê o erro) nem quando a pessoa sai sem aprovar.

## Montar um link {#build-a-link}

### Com hive-uri {#with-hive-uri}

O pacote `hive-uri` (https://www.npmjs.com/package/hive-uri) codifica operações em links. Use a versão 0.2.8 ou mais recente, que codifica qualquer texto Unicode corretamente.

```bash
npm install hive-uri
```

```js
import { encodeOp, encodeOps } from 'hive-uri';

// One vote. __signer becomes the account that signs.
const vote = encodeOp(
  ['vote', { voter: '__signer', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
  { callback: 'https://YOUR_APP/voted?tx={{id}}' },
);

// Two transfers in one transaction.
const payout = encodeOps(
  [
    ['transfer', { from: '__signer', to: 'RECIPIENT_1', amount: '1.000 HIVE', memo: 'MEMO' }],
    ['transfer', { from: '__signer', to: 'RECIPIENT_2', amount: '2.000 HIVE', memo: 'MEMO' }],
  ],
  { callback: 'https://YOUR_APP/paid' },
);

const voteLink = vote.replace('hive://', 'https://hivesigner.com/');
const payoutLink = payout.replace('hive://', 'https://hivesigner.com/');
```

O objeto de opções aceita `callback` (escrito como `cb`), `no_broadcast: true` (escrito como `nb`) e `signer` (escrito como `s`). `encodeTx` faz o mesmo para uma transação inteira.

### Com o SDK de JavaScript {#with-the-sdk}

O pacote `hivesigner` tem `sendOperation`, `sendOperations` e `sendTransaction`. Eles recebem os mesmos argumentos dos codificadores do `hive-uri` e devolvem o link `https://hivesigner.com/sign/...`:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

No TypeScript, os tipos exigem o terceiro argumento: passe `undefined` para receber o link. No navegador, uma função passada como terceiro argumento faz com que eles abram o link numa nova aba em vez de devolvê-lo. Veja [SDKs](/docs/sdk#sign-links).

### Sem código {#signs-page}

https://hivesigner.com/signs («Assinar transação») lista cada operação suportada com um formulário para os campos dela. Ele monta um link `/sign/op/` e o abre.

## De que chave um link precisa {#which-key}

Cada operação precisa de uma chave: de postagem, ativa ou de proprietário. A [tabela abaixo](#supported-operations) as lista. Três operações dependem dos valores delas:

- `custom_json` precisa da chave ativa quando `required_auths` indica uma conta. Caso contrário, precisa da chave de postagem.
- `account_update` precisa da chave de proprietário quando define `owner`. Caso contrário, precisa da chave ativa.
- `account_update2` precisa da chave de proprietário quando define `owner`. Precisa da chave ativa quando define `active`, `posting`, `memo_key` ou `json_metadata`. Só com `posting_json_metadata`, precisa da chave de postagem.

O Hivesigner assina um link com uma única chave, então todas as operações de um link precisam exigir a mesma. Um link que as mistura o Hivesigner se recusa a assinar e explica à pessoa o porquê. Envie essas operações em links separados.

Quando a conta escolhida não tem a chave no dispositivo, o Hivesigner diz qual chave falta e oferece adicioná-la. Veja [Quando falta a chave](/docs/signing#missing-key).

## O que a pessoa vê {#what-the-user-sees}

- Uma tela com o título «Confirmar transação», com um cartão por operação: um resumo em palavras claras, a chave de que ela precisa e os valores que carrega.
- «Você será redirecionado para HOST.» quando o link tem uma URL de retorno. Use uma URL no seu próprio site, para as pessoas reconhecerem o host.
- Um aviso quando uma operação age como uma conta diferente da que assina.
- **Aprovar**, ou **Assinar** para um link apenas de assinatura. Uma conta bloqueada pede antes o código de acesso.
- Depois da transmissão, «Transação transmitida com sucesso» com o identificador da transação. Em seguida, o redirecionamento para a sua URL de retorno.

[Conferir e assinar](/docs/signing#confirm-screen) descreve essa tela para os usuários.

## Operações suportadas {#supported-operations}

O Hivesigner assina estas 41 operações, pelos nomes delas na blockchain. Todo o resto é recusado. O nome é aquele que o Hivesigner mostra na tela de confirmação.

| Operação | Chave | Nome |
| --- | --- | --- |
| `transfer` | Ativa | Transferência |
| `recurrent_transfer` | Ativa | Transferência recorrente |
| `delegate_vesting_shares` | Ativa | Delegar Hive Power |
| `transfer_to_vesting` | Ativa | Power up |
| `set_withdraw_vesting_route` | Ativa | Definir rota do power down |
| `withdraw_vesting` | Ativa | Power down |
| `transfer_to_savings` | Ativa | Transferir para a poupança |
| `transfer_from_savings` | Ativa | Transferir da poupança |
| `cancel_transfer_from_savings` | Ativa | Cancelar transferência da poupança |
| `convert` | Ativa | Converter HBD em HIVE |
| `collateralized_convert` | Ativa | Converter HIVE em HBD |
| `account_witness_vote` | Ativa | Voto em testemunha |
| `witness_update` | Ativa | Atualização de testemunha |
| `witness_set_properties` | Ativa | Definir propriedades de testemunha |
| `account_witness_proxy` | Ativa | Proxy de governança |
| `claim_account` | Ativa | Reivindicar crédito de conta |
| `account_create` | Ativa | Criar conta |
| `create_claimed_account` | Ativa | Criar conta com créditos de conta |
| `vote` | Postagem | Voto |
| `limit_order_create` | Ativa | Criar ordem limitada |
| `limit_order_create2` | Ativa | Criar ordem limitada |
| `limit_order_cancel` | Ativa | Cancelar ordem limitada |
| `claim_reward_balance` | Postagem | Resgatar recompensas |
| `comment` | Postagem | Post ou comentário |
| `comment_options` | Postagem | Opções de post ou comentário |
| `custom_json` | Postagem, ou Ativa quando `required_auths` está definido | Operação personalizada |
| `delete_comment` | Postagem | Excluir comentário |
| `account_update` | Ativa, ou Proprietário quando `owner` está definido | Atualizar conta (ativa) |
| `account_update2` | Postagem, Ativa ou Proprietário, conforme o campo | Atualizar conta (postagem) |
| `change_recovery_account` | Proprietário | Alterar conta de recuperação |
| `create_proposal` | Ativa | Criar proposta |
| `remove_proposal` | Ativa | Remover proposta |
| `update_proposal_votes` | Ativa | Atualizar votos em propostas |
| `update_proposal` | Ativa | Atualizar proposta |
| `escrow_transfer` | Ativa | Transferência com escrow |
| `escrow_approve` | Ativa | Aprovação de escrow |
| `escrow_dispute` | Ativa | Disputa de escrow |
| `escrow_release` | Ativa | Liberação de escrow |
| `account_create_with_delegation` | Ativa | Criar conta com delegação |
| `request_account_recovery` | Ativa | Solicitar recuperação de conta |
| `recover_account` | Proprietário | Recuperar conta |
