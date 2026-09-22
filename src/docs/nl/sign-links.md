Een ondertekeningslink opent een Hive-transactie in Hivesigner. De persoon bekijkt haar, keurt haar met zijn eigen sleutel goed en Hivesigner zendt haar vanuit zijn browser uit. Daarna kan Hivesigner de persoon met het transactie-ID naar jouw app terugsturen. Ondertekeningslinks vragen geen app-account en geen token. Ze dekken alle 41 operaties die Hivesigner ondersteunt, waaronder overboekingen en andere handelingen waarvoor de active-sleutel nodig is.

## Hoe een ondertekeningslink werkt {#how-it-works}

1. Jouw app bouwt een link met een of meer operaties erin.
2. De persoon opent de link. Hivesigner toont elke operatie in gewone woorden op het scherm «Transactie bevestigen», met de sleutel die ervoor nodig is.
3. De persoon keurt goed. Hivesigner ondertekent de transactie in de browser met de sleutel van het account dat in Hivesigner is gekozen. Daarna stuurt het de transactie naar het Hive-netwerk.
4. Noemt de link een callback, dan stuurt Hivesigner de persoon daarheen met het transactie-ID.

Jouw app ziet nooit een sleutel. Elke site kan een ondertekeningslink maken: er is geen `client_id` om mee te sturen.

## Vormen van links {#link-forms}

Hivesigner leest twee soorten ondertekeningslinks: gecodeerde links en oude links.

### Gecodeerde links {#encoded-links}

Een gecodeerde link draagt de operaties als JSON, gecodeerd in base64url. Hij gebruikt de vorm `hive://sign/...` van het pakket `hive-uri`, met `https://hivesigner.com/` in plaats van `hive://`.

| Vorm | Wat `B64U` bevat |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Eén operatie: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Een lijst operaties: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Een hele transactie, met eigen kop |

`B64U` is de JSON-tekst, gecodeerd als UTF-8 en daarna als base64, met `-` in plaats van `+`, `_` in plaats van `/` en `.` in plaats van de opvulling `=`.

Bij `op` en `ops` bouwt Hivesigner de transactie om de operaties heen. Het vult het referentieblok en de vervaltijd in.

Bij `tx` houdt Hivesigner de eigen `ref_block_num`, `ref_block_prefix` en `expiration` van de transactie. Het houdt ook de handtekeningen die de transactie al draagt. Zo kunnen meerdere accounts om de beurt één transactie ondertekenen, voor een account dat meerdere mensen beheren. Hivesigner weigert een transactie waarvan de lijst `extensions` niet leeg is.

> **Let op:** Hivesigner maakt sommige waarden voor het ondertekenen gelijkvormig, zoals bedragen en velden die op hun standaardwaarde staan. De ondertekende transactie kan dan een ander ID hebben dan die jij bouwde. Lees het ID uit de callback.

### Oude links {#legacy-links}

Een oude link noemt één operatie in het pad en zet de velden ervan in de query:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Schrijf de naam van de operatie in snake case (`transfer_to_vesting`), camel case (`transferToVesting`) of kebab case (`transfer-to-vesting`).
- Geef elk veld als queryparameter met de naam van het veld. Codeer elke waarde voor de URL.
- Schrijf lijsten en objecten als JSON, bijvoorbeeld `required_posting_auths=["alice"]`. Een lijst ID's of namen mag ook met komma's worden gescheiden: `proposal_ids=379,380`.
- Schrijf booleans als `true` of `false`.

Een oude link draagt één operatie. Voor meer dan één gebruik je een gecodeerde link.

### Waarden van velden {#field-values}

Deze regels gelden voor elke vorm:

- **Standaardwaarden.** Een veld dat je weglaat krijgt zijn standaardwaarde. Het account dat handelt (`voter`, `from`, `owner` en dergelijke velden) is standaard het account dat ondertekent. De `weight` van een stem is standaard `10000` (100%).
- **Bedragen** zijn een getal en een symbool: `1.000 HIVE`, `0.500 HBD` of `100.000000 VESTS`. Hivesigner schrijft HIVE en HBD met 3 decimalen en VESTS met 6.
- **Hive Power.** Een veld dat VESTS aanneemt neemt ook een bedrag in HP aan, zoals `100 HP`. Hivesigner rekent dat tegen de huidige koers om naar VESTS voordat de persoon kan goedkeuren.
- **`__signer`** wordt in elke waarde de naam van het account dat ondertekent. Zo kan een `custom_json` om te volgen binnen zijn `json` `__signer` als volger noemen.
- **Gehele getallen** moeten hele getallen zijn binnen het bereik dat de blockchain aanneemt, zoals `-10000` tot `10000` voor de `weight` van een stem.

Hivesigner weigert de hele link wanneer een waarde niet in zijn veld past, wanneer een operatie onbekend is of wanneer de link geen enkele operatie draagt. De persoon ziet «Oeps, er ging iets mis. De opgegeven gegevens zijn ongeldig.» en er wordt niets ondertekend.

## Parameters {#parameters}

Voeg deze toe aan de querystring van elke ondertekeningslink:

| Parameter | Betekenis |
| --- | --- |
| `cb` | De callback-URL, gecodeerd in base64url. Dit schrijft `hive-uri` voor zijn optie `callback`. |
| `redirect_uri` | De callback-URL als gewone, voor de URL gecodeerde tekst. Oude links gebruiken deze. Een gecodeerde link gebruikt hem wanneer hij geen `cb` heeft. |
| `nb` | Alleen ondertekenen. Hivesigner ondertekent de transactie zonder haar uit te zenden. Zet `{{sig}}` in de callback om de handtekening te ontvangen (zie [Plaatshouders in de callback](#callback-placeholders)). Elke waarde voldoet, ook een lege (`nb=`). |
| `s` | Het account dat moet ondertekenen. Is een ander account gekozen, dan vraagt Hivesigner de persoon naar dit account te wisselen. Met een ander account ondertekent het niet. |

Gebruik een `https://`-callback. Een callback die geen `http`- of `https`-URL is negeert Hivesigner, en het blijft dan op zijn eigen resultaatscherm.

Hivesigner kiest de sleutel op grond van de operaties. Er is geen parameter om die te kiezen: bij ondertekeningslinks negeert Hivesigner `authority` (en de parameter `a` van `hive-uri`). Zie [Welke sleutel een link nodig heeft](#which-key).

### Plaatshouders in de callback {#callback-placeholders}

Nadat de persoon heeft goedgekeurd, vult Hivesigner deze plaatshouders in de callback:

| Plaatshouder | Waarde |
| --- | --- |
| `{{id}}` | Het transactie-ID |
| `{{sig}}` | De handtekening, bij een link met alleen ondertekenen (`nb`) |
| `{{block}}` | Blijft leeg |
| `{{txn}}` | Blijft leeg |
| `{{data}}` | Blijft leeg |

Een callback zonder een van deze plaatshouders krijgt het transactie-ID als `id` erachter, na `?` of `&`:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner stuurt door zodra een Hive-knooppunt de transactie aanneemt. Die staat dan misschien nog niet in een blok. Zoek haar op ID op wanneer je moet weten dat ze is opgenomen.

Jouw callback wordt niet aangeroepen wanneer het netwerk de transactie afwijst (de persoon ziet de fout) of wanneer de persoon weggaat zonder goed te keuren.

## Een link bouwen {#build-a-link}

### Met hive-uri {#with-hive-uri}

Het pakket `hive-uri` (https://www.npmjs.com/package/hive-uri) codeert operaties in links. Gebruik versie 0.2.8 of nieuwer, die elke Unicode-tekst correct codeert.

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

Het optie-object neemt `callback` (geschreven als `cb`), `no_broadcast: true` (geschreven als `nb`) en `signer` (geschreven als `s`). `encodeTx` doet hetzelfde voor een hele transactie.

### Met de JavaScript-SDK {#with-the-sdk}

Het pakket `hivesigner` heeft `sendOperation`, `sendOperations` en `sendTransaction`. Ze nemen dezelfde argumenten als de codeerfuncties van `hive-uri` en geven de link `https://hivesigner.com/sign/...` terug:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

In TypeScript eisen de typen het derde argument: geef `undefined` door om de link terug te krijgen. In een browser zorgt een functie als derde argument ervoor dat ze de link in een nieuw tabblad openen in plaats van hem terug te geven. Zie [SDK's](/docs/sdk#sign-links).

### Zonder code {#signs-page}

https://hivesigner.com/signs («Transactie ondertekenen») somt elke ondersteunde operatie op met een formulier voor haar velden. Het bouwt een `/sign/op/`-link en opent die.

## Welke sleutel een link nodig heeft {#which-key}

Elke operatie heeft één sleutel nodig: posting, active of owner. De [tabel hieronder](#supported-operations) somt ze op. Drie operaties hangen van hun waarden af:

- `custom_json` heeft de active-sleutel nodig wanneer `required_auths` een account noemt. Anders de posting-sleutel.
- `account_update` heeft de owner-sleutel nodig wanneer hij `owner` zet. Anders de active-sleutel.
- `account_update2` heeft de owner-sleutel nodig wanneer hij `owner` zet. Hij heeft de active-sleutel nodig wanneer hij `active`, `posting`, `memo_key` of `json_metadata` zet. Met alleen `posting_json_metadata` heeft hij de posting-sleutel nodig.

Hivesigner ondertekent een link met één sleutel, dus alle operaties in één link moeten dezelfde sleutel nodig hebben. Een link die ze mengt weigert Hivesigner te ondertekenen en het legt de persoon uit waarom. Stuur zulke operaties in aparte links.

Heeft het gekozen account de sleutel niet op het apparaat, dan zegt Hivesigner welke sleutel ontbreekt en biedt aan die toe te voegen. Zie [Als de sleutel ontbreekt](/docs/signing#missing-key).

## Wat de persoon ziet {#what-the-user-sees}

- Een scherm met de titel «Transactie bevestigen», met één kaart per operatie: een samenvatting in gewone woorden, de sleutel die nodig is en de waarden die ze draagt.
- «Je wordt doorgestuurd naar HOST.» wanneer de link een callback heeft. Gebruik een callback op je eigen site, zodat mensen de host herkennen.
- Een waarschuwing wanneer een operatie handelt als een ander account dan het ondertekenende.
- **Goedkeuren**, of **Ondertekenen** bij een link met alleen ondertekenen. Een vergrendeld account vraagt eerst zijn toegangscode.
- Na het uitzenden «Transactie succesvol uitgezonden» met het transactie-ID. Daarna de doorverwijzing naar jouw callback.

[Bekijken en ondertekenen](/docs/signing#confirm-screen) beschrijft het scherm voor gebruikers.

## Ondersteunde operaties {#supported-operations}

Hivesigner ondertekent deze 41 operaties, met hun namen op de blockchain. Al het andere wordt geweigerd. De naam is die welke Hivesigner op het bevestigingsscherm toont.

| Operatie | Sleutel | Naam |
| --- | --- | --- |
| `transfer` | Active | Overschrijving |
| `recurrent_transfer` | Active | Terugkerende overschrijving |
| `delegate_vesting_shares` | Active | Hive Power delegeren |
| `transfer_to_vesting` | Active | Power-up |
| `set_withdraw_vesting_route` | Active | Power-down-route instellen |
| `withdraw_vesting` | Active | Power-down |
| `transfer_to_savings` | Active | Overschrijving naar spaarrekening |
| `transfer_from_savings` | Active | Overschrijving van spaarrekening |
| `cancel_transfer_from_savings` | Active | Overschrijving van spaarrekening annuleren |
| `convert` | Active | HBD omzetten naar HIVE |
| `collateralized_convert` | Active | HIVE omzetten naar HBD |
| `account_witness_vote` | Active | Witness-stem |
| `witness_update` | Active | Witness bijwerken |
| `witness_set_properties` | Active | Witness-eigenschappen instellen |
| `account_witness_proxy` | Active | Governance-proxy |
| `claim_account` | Active | Accountcredit claimen |
| `account_create` | Active | Account aanmaken |
| `create_claimed_account` | Active | Account aanmaken met accountcredits |
| `vote` | Posting | Stem |
| `limit_order_create` | Active | Limietorder plaatsen |
| `limit_order_create2` | Active | Limietorder plaatsen |
| `limit_order_cancel` | Active | Limietorder annuleren |
| `claim_reward_balance` | Posting | Beloningen claimen |
| `comment` | Posting | Bericht of reactie |
| `comment_options` | Posting | Opties voor bericht of reactie |
| `custom_json` | Posting, of Active wanneer `required_auths` is gezet | Aangepaste operatie |
| `delete_comment` | Posting | Reactie verwijderen |
| `account_update` | Active, of Owner wanneer `owner` is gezet | Account bijwerken (active) |
| `account_update2` | Posting, Active of Owner, per veld | Account bijwerken (posting) |
| `change_recovery_account` | Owner | Herstelaccount wijzigen |
| `create_proposal` | Active | Voorstel aanmaken |
| `remove_proposal` | Active | Voorstel verwijderen |
| `update_proposal_votes` | Active | Stemmen op voorstellen bijwerken |
| `update_proposal` | Active | Voorstel bijwerken |
| `escrow_transfer` | Active | Escrow-overschrijving |
| `escrow_approve` | Active | Escrow goedkeuren |
| `escrow_dispute` | Active | Escrow-geschil |
| `escrow_release` | Active | Escrow vrijgeven |
| `account_create_with_delegation` | Active | Account aanmaken met delegatie |
| `request_account_recovery` | Active | Accountherstel aanvragen |
| `recover_account` | Owner | Account herstellen |
