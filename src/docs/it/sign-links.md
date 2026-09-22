Un link di firma apre una transazione Hive in Hivesigner. La persona la esamina, la approva con la propria chiave e Hivesigner la trasmette dal suo browser. Poi Hivesigner può riportare la persona alla tua app con l’identificativo della transazione. I link di firma non richiedono né un account app né un token. Coprono tutte le 41 operazioni che Hivesigner gestisce, comprese le trasferte e le altre azioni che richiedono la chiave attiva.

## Come funziona un link di firma {#how-it-works}

1. La tua app costruisce un link che porta una o più operazioni.
2. La persona apre il link. Hivesigner mostra ogni operazione con parole chiare nella schermata «Conferma transazione», insieme alla chiave che le serve.
3. La persona approva. Hivesigner firma la transazione nel browser con la chiave dell’account selezionato in Hivesigner. Poi manda la transazione alla rete Hive.
4. Quando il link indica un callback, Hivesigner vi manda la persona con l’identificativo della transazione.

La tua app non vede mai una chiave. Qualunque sito può creare un link di firma: non c’è nessun `client_id` da inviare.

## Forme dei link {#link-forms}

Hivesigner legge due tipi di link di firma: i link codificati e i link storici.

### Link codificati {#encoded-links}

Un link codificato porta le operazioni come JSON, codificato in base64url. Usa il formato `hive://sign/...` del pacchetto `hive-uri`, con `https://hivesigner.com/` al posto di `hive://`.

| Forma | Che cosa contiene `B64U` |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Un’operazione: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Un elenco di operazioni: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Una transazione intera, con la sua intestazione |

`B64U` è il testo JSON, codificato in UTF-8 e poi in base64 con `-` al posto di `+`, `_` al posto di `/` e `.` al posto del riempimento `=`.

Per `op` e `ops` Hivesigner costruisce la transazione attorno alle operazioni. Riempie il blocco di riferimento e la scadenza.

Per `tx` Hivesigner conserva i `ref_block_num`, `ref_block_prefix` ed `expiration` propri della transazione. Conserva anche le firme che la transazione porta già. Così più account possono firmare una stessa transazione a turno, per un account controllato da più persone. Hivesigner rifiuta una transazione il cui elenco `extensions` non è vuoto.

> **Nota:** Hivesigner uniforma alcuni valori prima di firmare, come gli importi e i campi lasciati al loro valore predefinito. La transazione firmata può quindi avere un identificativo diverso da quello che hai costruito. Leggi l’identificativo dal callback.

### Link storici {#legacy-links}

Un link storico indica un’operazione nel percorso e mette i suoi campi nella query:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Scrivi il nome dell’operazione in snake case (`transfer_to_vesting`), camel case (`transferToVesting`) o kebab case (`transfer-to-vesting`).
- Passa ogni campo come parametro di query con il nome del campo. Codifica ogni valore per l’URL.
- Scrivi elenchi e oggetti in JSON, per esempio `required_posting_auths=["alice"]`. Un elenco di identificativi o nomi può anche essere separato da virgole: `proposal_ids=379,380`.
- Scrivi i booleani come `true` o `false`.

Un link storico porta una sola operazione. Per più di una usa un link codificato.

### Valori dei campi {#field-values}

Queste regole valgono per ogni forma:

- **Valori predefiniti.** Un campo che ometti prende il suo valore predefinito. L’account che agisce (`voter`, `from`, `owner` e campi simili) è per impostazione predefinita l’account che firma. Il `weight` di un voto è per impostazione predefinita `10000` (100%).
- **Gli importi** sono un numero e un simbolo: `1.000 HIVE`, `0.500 HBD` o `100.000000 VESTS`. Hivesigner scrive HIVE e HBD con 3 decimali e VESTS con 6.
- **Hive Power.** Un campo che accetta VESTS accetta anche un importo in HP, come `100 HP`. Hivesigner lo converte in VESTS al tasso corrente prima che la persona possa approvare.
- **`__signer`** in qualunque valore diventa il nome dell’account che firma. Per esempio un `custom_json` di follow può indicare `__signer` come follower dentro il suo `json`.
- **Gli interi** devono essere numeri interi nell’intervallo che la blockchain accetta, come da `-10000` a `10000` per il `weight` di un voto.

Hivesigner rifiuta l’intero link quando un valore non sta nel suo campo, quando un’operazione è sconosciuta o quando il link non porta nessuna operazione. La persona vede «Ops, qualcosa è andato storto. I dati forniti non sono validi.» e non viene firmato nulla.

## Parametri {#parameters}

Aggiungi questi alla stringa di query di qualunque link di firma:

| Parametro | Significato |
| --- | --- |
| `cb` | L’URL di callback, codificato in base64url. È ciò che `hive-uri` scrive per la sua opzione `callback`. |
| `redirect_uri` | L’URL di callback come testo semplice codificato per l’URL. I link storici usano questo. Un link codificato lo usa quando non ha `cb`. |
| `nb` | Solo firma. Hivesigner firma la transazione senza trasmetterla. Metti `{{sig}}` nel callback per ricevere la firma (vedi [Segnaposto nel callback](#callback-placeholders)). Va bene qualunque valore, anche vuoto (`nb=`). |
| `s` | L’account che deve firmare. Quando è selezionato un altro account, Hivesigner chiede alla persona di passare a questo. Non firma con nessun altro account. |

Usa un callback `https://`. Hivesigner ignora un callback che non è un URL `http` o `https` e resta allora sulla propria schermata di esito.

Hivesigner sceglie la chiave dalle operazioni. Non c’è nessun parametro per sceglierla: sui link di firma Hivesigner ignora `authority` (e il parametro `a` di `hive-uri`). Vedi [Quale chiave serve a un link](#which-key).

### Segnaposto nel callback {#callback-placeholders}

Dopo l’approvazione della persona, Hivesigner riempie questi segnaposto nel callback:

| Segnaposto | Valore |
| --- | --- |
| `{{id}}` | L’identificativo della transazione |
| `{{sig}}` | La firma, per un link di sola firma (`nb`) |
| `{{block}}` | Lasciato vuoto |
| `{{txn}}` | Lasciato vuoto |
| `{{data}}` | Lasciato vuoto |

Un callback senza nessuno di questi segnaposto riceve l’identificativo della transazione aggiunto come `id`, dopo `?` o `&`:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner reindirizza appena un nodo Hive accetta la transazione. La transazione può non essere ancora in un blocco. Cercala per identificativo quando ti serve sapere che è stata inclusa.

Il tuo callback non viene chiamato quando la rete rifiuta la transazione (la persona vede l’errore) né quando la persona se ne va senza approvare.

## Costruire un link {#build-a-link}

### Con hive-uri {#with-hive-uri}

Il pacchetto `hive-uri` (https://www.npmjs.com/package/hive-uri) codifica le operazioni in link. Usa la versione 0.2.8 o più recente, che codifica correttamente qualunque testo Unicode.

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

L’oggetto delle opzioni accetta `callback` (scritto `cb`), `no_broadcast: true` (scritto `nb`) e `signer` (scritto `s`). `encodeTx` fa lo stesso per una transazione intera.

### Con l’SDK JavaScript {#with-the-sdk}

Il pacchetto `hivesigner` ha `sendOperation`, `sendOperations` e `sendTransaction`. Prendono gli stessi argomenti dei codificatori di `hive-uri` e restituiscono il link `https://hivesigner.com/sign/...`:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

In TypeScript i tipi richiedono il terzo argomento: passa `undefined` per riavere il link. In un browser una funzione passata come terzo argomento fa loro aprire il link in una nuova scheda invece di restituirlo. Vedi [SDK](/docs/sdk#sign-links).

### Senza codice {#signs-page}

https://hivesigner.com/signs («Firma transazione») elenca ogni operazione gestita con un modulo per i suoi campi. Costruisce un link `/sign/op/` e lo apre.

## Quale chiave serve a un link {#which-key}

Ogni operazione richiede una chiave: di pubblicazione, attiva o di proprietario. La [tabella qui sotto](#supported-operations) le elenca. Tre operazioni dipendono dai loro valori:

- `custom_json` richiede la chiave attiva quando `required_auths` indica un account. Altrimenti richiede la chiave di pubblicazione.
- `account_update` richiede la chiave di proprietario quando imposta `owner`. Altrimenti richiede la chiave attiva.
- `account_update2` richiede la chiave di proprietario quando imposta `owner`. Richiede la chiave attiva quando imposta `active`, `posting`, `memo_key` o `json_metadata`. Con il solo `posting_json_metadata` richiede la chiave di pubblicazione.

Hivesigner firma un link con una sola chiave, quindi tutte le operazioni di un link devono richiedere la stessa. Hivesigner si rifiuta di firmare un link che le mescola e spiega alla persona il motivo. Manda quelle operazioni in link separati.

Quando l’account selezionato non ha la chiave sul dispositivo, Hivesigner dice quale chiave manca e propone di aggiungerla. Vedi [Quando manca la chiave](/docs/signing#missing-key).

## Che cosa vede la persona {#what-the-user-sees}

- Una schermata intitolata «Conferma transazione», con una scheda per ogni operazione: un riepilogo in parole chiare, la chiave che serve e i valori che porta.
- «Verrai reindirizzato a HOST.» quando il link ha un callback. Usa un callback sul tuo sito, perché le persone riconoscano l’host.
- Un avviso quando un’operazione agisce come un account diverso da quello che firma.
- **Approva**, oppure **Firma** per un link di sola firma. Un account bloccato chiede prima il suo codice di accesso.
- Dopo una trasmissione, «Transazione trasmessa con successo» con l’identificativo della transazione. Poi il reindirizzamento al tuo callback.

[Esaminare e firmare](/docs/signing#confirm-screen) descrive la schermata per gli utenti.

## Operazioni gestite {#supported-operations}

Hivesigner firma queste 41 operazioni, con i loro nomi sulla blockchain. Tutto il resto viene rifiutato. Il nome è quello che Hivesigner mostra nella schermata di conferma.

| Operazione | Chiave | Nome |
| --- | --- | --- |
| `transfer` | Attiva | Trasferimento |
| `recurrent_transfer` | Attiva | Trasferimento ricorrente |
| `delegate_vesting_shares` | Attiva | Delega Hive Power |
| `transfer_to_vesting` | Attiva | Power up |
| `set_withdraw_vesting_route` | Attiva | Imposta destinazione del power down |
| `withdraw_vesting` | Attiva | Power down |
| `transfer_to_savings` | Attiva | Trasferimento ai risparmi |
| `transfer_from_savings` | Attiva | Trasferimento dai risparmi |
| `cancel_transfer_from_savings` | Attiva | Annulla trasferimento dai risparmi |
| `convert` | Attiva | Converti HBD in HIVE |
| `collateralized_convert` | Attiva | Converti HIVE in HBD |
| `account_witness_vote` | Attiva | Voto per un testimone |
| `witness_update` | Attiva | Aggiornamento testimone |
| `witness_set_properties` | Attiva | Impostazione proprietà testimone |
| `account_witness_proxy` | Attiva | Proxy di governance |
| `claim_account` | Attiva | Richiedi credito account |
| `account_create` | Attiva | Crea account |
| `create_claimed_account` | Attiva | Crea account con crediti account |
| `vote` | Pubblicazione | Voto |
| `limit_order_create` | Attiva | Crea ordine limite |
| `limit_order_create2` | Attiva | Crea ordine limite |
| `limit_order_cancel` | Attiva | Annulla ordine limite |
| `claim_reward_balance` | Pubblicazione | Riscatta ricompense |
| `comment` | Pubblicazione | Post o commento |
| `comment_options` | Pubblicazione | Opzioni di post o commento |
| `custom_json` | Pubblicazione, o Attiva quando `required_auths` è impostato | Operazione personalizzata |
| `delete_comment` | Pubblicazione | Elimina commento |
| `account_update` | Attiva, o Proprietario quando `owner` è impostato | Aggiornamento account (attiva) |
| `account_update2` | Pubblicazione, Attiva o Proprietario, secondo il campo | Aggiornamento account (pubblicazione) |
| `change_recovery_account` | Proprietario | Cambia account di recupero |
| `create_proposal` | Attiva | Crea proposta |
| `remove_proposal` | Attiva | Rimuovi proposta |
| `update_proposal_votes` | Attiva | Aggiorna voti delle proposte |
| `update_proposal` | Attiva | Aggiorna proposta |
| `escrow_transfer` | Attiva | Trasferimento in deposito a garanzia |
| `escrow_approve` | Attiva | Approvazione deposito a garanzia |
| `escrow_dispute` | Attiva | Contestazione deposito a garanzia |
| `escrow_release` | Attiva | Rilascio deposito a garanzia |
| `account_create_with_delegation` | Attiva | Crea account con delega |
| `request_account_recovery` | Attiva | Richiedi recupero account |
| `recover_account` | Proprietario | Recupera account |
