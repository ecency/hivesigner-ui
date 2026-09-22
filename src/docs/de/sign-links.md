Ein Signaturlink öffnet eine Hive-Transaktion in Hivesigner. Die Person prüft sie, stimmt ihr mit dem eigenen Schlüssel zu und Hivesigner überträgt sie aus ihrem Browser. Danach kann Hivesigner die Person mit der Transaktions-ID zurück zu Ihrer App schicken. Signaturlinks brauchen kein App-Konto und kein Token. Sie decken alle 41 Operationen ab, die Hivesigner unterstützt, darunter Überweisungen und andere Aktionen, die den Active-Schlüssel brauchen.

## So funktioniert ein Signaturlink {#how-it-works}

1. Ihre App baut einen Link, der eine oder mehrere Operationen trägt.
2. Die Person öffnet den Link. Hivesigner zeigt jede Operation in klaren Worten auf dem Bildschirm "Transaktion bestätigen", zusammen mit dem nötigen Schlüssel.
3. Die Person stimmt zu. Hivesigner signiert die Transaktion im Browser mit dem Schlüssel des in Hivesigner ausgewählten Kontos. Danach sendet es die Transaktion an das Hive-Netzwerk.
4. Nennt der Link einen Callback, schickt Hivesigner die Person mit der Transaktions-ID dorthin.

Ihre App sieht nie einen Schlüssel. Jede Website kann einen Signaturlink erzeugen: Es gibt keine `client_id` zu senden.

## Linkformen {#link-forms}

Hivesigner liest zwei Arten von Signaturlinks: kodierte Links und alte Links.

### Kodierte Links {#encoded-links}

Ein kodierter Link trägt die Operationen als JSON, kodiert in base64url. Er nutzt das Format `hive://sign/...` des Pakets `hive-uri`, wobei `hive://` durch `https://hivesigner.com/` ersetzt ist.

| Form | Was `B64U` enthält |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Eine Operation: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Eine Liste von Operationen: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Eine ganze Transaktion, mit eigenem Kopf |

`B64U` ist der JSON-Text, kodiert als UTF-8 und dann als base64, mit `-` statt `+`, `_` statt `/` und `.` statt der `=`-Füllzeichen.

Bei `op` und `ops` baut Hivesigner die Transaktion um die Operationen herum. Es füllt Referenzblock und Ablaufzeit aus.

Bei `tx` behält Hivesigner die eigenen `ref_block_num`, `ref_block_prefix` und `expiration` der Transaktion. Es behält auch die Signaturen, die die Transaktion bereits trägt. So können mehrere Konten nacheinander eine Transaktion signieren, für ein Konto, das mehrere Menschen kontrollieren. Eine Transaktion, deren `extensions`-Liste nicht leer ist, lehnt Hivesigner ab.

> **Hinweis:** Hivesigner vereinheitlicht einige Werte vor dem Signieren, etwa Beträge und auf ihrem Standard belassene Felder. Die signierte Transaktion kann dann eine andere ID haben als die, die Sie gebaut haben. Lesen Sie die ID aus dem Callback.

### Alte Links {#legacy-links}

Ein alter Link nennt eine Operation im Pfad und legt ihre Felder in die Query:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Schreiben Sie den Operationsnamen in snake case (`transfer_to_vesting`), camel case (`transferToVesting`) oder kebab case (`transfer-to-vesting`).
- Geben Sie jedes Feld als Query-Parameter mit dem Feldnamen an. Kodieren Sie jeden Wert URL-gerecht.
- Schreiben Sie Listen und Objekte als JSON, zum Beispiel `required_posting_auths=["alice"]`. Eine Liste von IDs oder Namen darf auch durch Kommas getrennt sein: `proposal_ids=379,380`.
- Schreiben Sie Wahrheitswerte als `true` oder `false`.

Ein alter Link trägt eine Operation. Für mehr als eine nutzen Sie einen kodierten Link.

### Feldwerte {#field-values}

Diese Regeln gelten für jede Form:

- **Standardwerte.** Ein Feld, das Sie weglassen, nimmt seinen Standardwert. Das handelnde Konto (`voter`, `from`, `owner` und ähnliche Felder) ist standardmäßig das Konto, das signiert. Das `weight` einer Stimme ist standardmäßig `10000` (100%).
- **Beträge** bestehen aus einer Zahl und einem Symbol: `1.000 HIVE`, `0.500 HBD` oder `100.000000 VESTS`. Hivesigner schreibt HIVE und HBD mit 3 Nachkommastellen und VESTS mit 6.
- **Hive Power.** Ein Feld, das VESTS annimmt, nimmt auch einen Betrag in HP an, etwa `100 HP`. Hivesigner rechnet ihn zum aktuellen Kurs in VESTS um, bevor die Person zustimmen kann.
- **`__signer`** wird in jedem Wert zum Namen des Kontos, das signiert. So kann ein `custom_json` für einen Follow `__signer` innerhalb seines `json` als Follower nennen.
- **Ganze Zahlen** müssen ganze Zahlen innerhalb des von der Blockchain akzeptierten Bereichs sein, etwa `-10000` bis `10000` für das `weight` einer Stimme.

Hivesigner lehnt den ganzen Link ab, wenn ein Wert nicht zu seinem Feld passt, eine Operation unbekannt ist oder der Link keine Operation trägt. Die Person sieht "Hoppla, da ist etwas schiefgelaufen. Die übermittelten Daten sind ungültig." und nichts wird signiert.

## Parameter {#parameters}

Hängen Sie diese an den Query-String jedes Signaturlinks:

| Parameter | Bedeutung |
| --- | --- |
| `cb` | Die Callback-URL, kodiert in base64url. Das schreibt `hive-uri` für seine Option `callback`. |
| `redirect_uri` | Die Callback-URL als einfacher, URL-kodierter Text. Alte Links nutzen diesen. Ein kodierter Link nutzt ihn, wenn er kein `cb` hat. |
| `nb` | Nur signieren. Hivesigner signiert die Transaktion, ohne sie zu übertragen. Setzen Sie `{{sig}}` in den Callback, um die Signatur zu erhalten (siehe [Platzhalter im Callback](#callback-placeholders)). Jeder Wert genügt, auch ein leerer (`nb=`). |
| `s` | Das Konto, das signieren muss. Ist ein anderes Konto ausgewählt, bittet Hivesigner die Person, zu diesem zu wechseln. Mit einem anderen Konto signiert es nicht. |

Nutzen Sie einen `https://`-Callback. Einen Callback, der keine `http`- oder `https`-URL ist, ignoriert Hivesigner und bleibt dann auf seinem eigenen Ergebnisbildschirm.

Hivesigner wählt den Schlüssel anhand der Operationen. Es gibt keinen Parameter, um ihn zu wählen: Hivesigner ignoriert `authority` (und den Parameter `a` von `hive-uri`) bei Signaturlinks. Siehe [Welchen Schlüssel ein Link braucht](#which-key).

### Platzhalter im Callback {#callback-placeholders}

Nachdem die Person zugestimmt hat, füllt Hivesigner diese Platzhalter im Callback:

| Platzhalter | Wert |
| --- | --- |
| `{{id}}` | Die Transaktions-ID |
| `{{sig}}` | Die Signatur, bei einem Nur-Signieren-Link (`nb`) |
| `{{block}}` | Bleibt leer |
| `{{txn}}` | Bleibt leer |
| `{{data}}` | Bleibt leer |

Ein Callback ohne einen dieser Platzhalter bekommt die Transaktions-ID als `id` angehängt, nach `?` oder `&`:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner leitet weiter, sobald ein Hive-Knoten die Transaktion angenommen hat. Sie steht dann vielleicht noch in keinem Block. Schlagen Sie sie über ihre ID nach, wenn Sie wissen müssen, dass sie aufgenommen wurde.

Ihr Callback wird nicht aufgerufen, wenn das Netzwerk die Transaktion ablehnt (die Person sieht den Fehler) oder wenn die Person ohne Zustimmung weggeht.

## Einen Link bauen {#build-a-link}

### Mit hive-uri {#with-hive-uri}

Das Paket `hive-uri` (https://www.npmjs.com/package/hive-uri) kodiert Operationen in Links. Nutzen Sie Version 0.2.8 oder neuer, die jeden Unicode-Text korrekt kodiert.

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

Das Optionsobjekt nimmt `callback` (geschrieben als `cb`), `no_broadcast: true` (geschrieben als `nb`) und `signer` (geschrieben als `s`). `encodeTx` tut dasselbe für eine ganze Transaktion.

### Mit dem JavaScript-SDK {#with-the-sdk}

Das Paket `hivesigner` hat `sendOperation`, `sendOperations` und `sendTransaction`. Sie nehmen dieselben Argumente wie die Kodierer von `hive-uri` und liefern den Link `https://hivesigner.com/sign/...`:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

In TypeScript verlangen die Typen das dritte Argument: Übergeben Sie `undefined`, um den Link zu erhalten. In einem Browser sorgt eine als drittes Argument übergebene Funktion dafür, dass der Link in einem neuen Tab geöffnet statt zurückgegeben wird. Siehe [SDKs](/docs/sdk#sign-links).

### Ohne Code {#signs-page}

https://hivesigner.com/signs ("Transaktion signieren") listet jede unterstützte Operation mit einem Formular für ihre Felder auf. Es baut einen `/sign/op/`-Link und öffnet ihn.

## Welchen Schlüssel ein Link braucht {#which-key}

Jede Operation braucht einen Schlüssel: Posting, Active oder Owner. Die [Tabelle unten](#supported-operations) listet sie auf. Drei Operationen hängen von ihren Werten ab:

- `custom_json` braucht den Active-Schlüssel, wenn `required_auths` ein Konto nennt. Sonst braucht es den Posting-Schlüssel.
- `account_update` braucht den Owner-Schlüssel, wenn es `owner` setzt. Sonst braucht es den Active-Schlüssel.
- `account_update2` braucht den Owner-Schlüssel, wenn es `owner` setzt. Es braucht den Active-Schlüssel, wenn es `active`, `posting`, `memo_key` oder `json_metadata` setzt. Nur mit `posting_json_metadata` braucht es den Posting-Schlüssel.

Hivesigner signiert einen Link mit einem einzigen Schlüssel, alle Operationen in einem Link müssen also denselben brauchen. Einen Link, der sie mischt, signiert Hivesigner nicht und sagt der Person, warum. Senden Sie solche Operationen in getrennten Links.

Hat das ausgewählte Konto den Schlüssel nicht auf dem Gerät, sagt Hivesigner, welcher Schlüssel fehlt, und bietet an, ihn hinzuzufügen. Siehe [Wenn der Schlüssel fehlt](/docs/signing#missing-key).

## Was die Person sieht {#what-the-user-sees}

- Ein Bildschirm mit dem Titel "Transaktion bestätigen", mit einer Karte je Operation: eine Zusammenfassung in klaren Worten, der nötige Schlüssel und die mitgeführten Werte.
- "Sie werden zu HOST weitergeleitet." wenn der Link einen Callback hat. Nutzen Sie einen Callback auf Ihrer eigenen Website, damit die Nutzer den Host wiedererkennen.
- Eine Warnung, wenn eine Operation als ein anderes Konto handelt als das signierende.
- **Genehmigen** oder **Signieren** bei einem Nur-Signieren-Link. Ein gesperrtes Konto fragt zuerst seinen Zugangscode ab.
- Nach einer Übertragung "Transaktion erfolgreich übertragen" mit der Transaktions-ID. Danach die Weiterleitung zu Ihrem Callback.

[Prüfen und signieren](/docs/signing#confirm-screen) beschreibt den Bildschirm für Nutzer.

## Unterstützte Operationen {#supported-operations}

Hivesigner signiert diese 41 Operationen, unter ihren Namen auf der Blockchain. Alles andere wird abgelehnt. Der Name ist der, den Hivesigner auf dem Bestätigungsbildschirm zeigt.

| Operation | Schlüssel | Name |
| --- | --- | --- |
| `transfer` | Active | Überweisung |
| `recurrent_transfer` | Active | Wiederkehrende Überweisung |
| `delegate_vesting_shares` | Active | Hive Power delegieren |
| `transfer_to_vesting` | Active | Power-up |
| `set_withdraw_vesting_route` | Active | Power-down-Route festlegen |
| `withdraw_vesting` | Active | Power-down |
| `transfer_to_savings` | Active | Überweisung ins Sparguthaben |
| `transfer_from_savings` | Active | Überweisung aus dem Sparguthaben |
| `cancel_transfer_from_savings` | Active | Überweisung aus dem Sparguthaben abbrechen |
| `convert` | Active | HBD in HIVE umwandeln |
| `collateralized_convert` | Active | HIVE in HBD umwandeln |
| `account_witness_vote` | Active | Witness-Stimme |
| `witness_update` | Active | Witness aktualisieren |
| `witness_set_properties` | Active | Witness-Eigenschaften festlegen |
| `account_witness_proxy` | Active | Governance-Proxy |
| `claim_account` | Active | Konto-Credit beanspruchen |
| `account_create` | Active | Konto erstellen |
| `create_claimed_account` | Active | Konto mit Konto-Credits erstellen |
| `vote` | Posting | Stimme |
| `limit_order_create` | Active | Limit-Order erstellen |
| `limit_order_create2` | Active | Limit-Order erstellen |
| `limit_order_cancel` | Active | Limit-Order stornieren |
| `claim_reward_balance` | Posting | Belohnungen einlösen |
| `comment` | Posting | Beitrag oder Kommentar |
| `comment_options` | Posting | Optionen für Beitrag oder Kommentar |
| `custom_json` | Posting, oder Active, wenn `required_auths` gesetzt ist | Benutzerdefinierte Operation |
| `delete_comment` | Posting | Kommentar löschen |
| `account_update` | Active, oder Owner, wenn `owner` gesetzt ist | Konto aktualisieren (Active) |
| `account_update2` | Posting, Active oder Owner, je nach Feld | Konto aktualisieren (Posting) |
| `change_recovery_account` | Owner | Wiederherstellungskonto ändern |
| `create_proposal` | Active | Vorschlag erstellen |
| `remove_proposal` | Active | Vorschlag entfernen |
| `update_proposal_votes` | Active | Stimmen für Vorschläge aktualisieren |
| `update_proposal` | Active | Vorschlag aktualisieren |
| `escrow_transfer` | Active | Treuhand-Überweisung |
| `escrow_approve` | Active | Treuhand genehmigen |
| `escrow_dispute` | Active | Treuhand-Streitfall |
| `escrow_release` | Active | Treuhand freigeben |
| `account_create_with_delegation` | Active | Konto mit Delegation erstellen |
| `request_account_recovery` | Active | Kontowiederherstellung anfordern |
| `recover_account` | Owner | Konto wiederherstellen |
