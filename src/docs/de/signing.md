Apps können Sie bitten, eine Hive-Transaktion zu signieren, etwa eine Abstimmung, eine Überweisung oder einen Beitrag. Sie schicken Ihnen einen Link, der Hivesigner öffnet. Hivesigner zeigt in klaren Worten, was die Anfrage tut, welchen Schlüssel sie braucht und wohin sie Sie danach schickt. Nichts wird signiert, bevor Sie zustimmen. Apps können auch bitten, eine Nachricht zu signieren, die nie in die Blockchain gelangt.

## Der Bildschirm „Transaktion bestätigen“ {#confirm-screen}

Ein Signierlink öffnet einen Bildschirm mit dem Titel „Transaktion bestätigen“. Er zeigt eine Karte je Operation in der Anfrage. Eine Operation ist eine Aktion auf Hive, etwa eine Abstimmung oder eine Überweisung.

Enthält eine Anfrage mehr als eine Operation, sind die Karten nummeriert und eine Zeile darüber sagt: „Diese Anfrage enthält 3 Operationen. Prüfen Sie jede einzelne, bevor Sie genehmigen.“

### Die Zusammenfassung {#summary}

Jede Karte beginnt mit einem Satz, der sagt, was die Operation tut, mit den Werten aus der Anfrage. Zum Beispiel:

| Operation | Was die Karte sagt |
| --- | --- |
| Eine Überweisung | 1.000 HIVE an @bob senden (und darunter das Memo, als Memo: ...) |
| Eine Abstimmung | Upvote für @alice/mein-beitrag (und darunter das Stimmgewicht, etwa 100%) |
| Ein Beitrag oder eine Antwort | Beitrag „Mein Titel“ veröffentlichen, oder Antwort auf @alice/mein-beitrag |
| Eine Aktion, die eine Hive-App definiert | Benutzerdefinierte Aktion (follow) |
| Eine Änderung daran, wer ein Konto kontrolliert | Kontoberechtigungen aktualisieren |

Andere Operationen zeigen ihren Namen, etwa „Power-up“ oder „Hive Power delegieren“.

Neben dem Satz zeigt ein Label in Großbuchstaben den Schlüssel, den die Operation braucht: POSTING, ACTIVE oder OWNER.

### Die Einzelheiten {#details}

Unter dem Satz listet die Karte die Werte auf, die die Operation trägt:

- das Konto, in dessen Namen die Operation handelt
- bei einem Beitrag oder Kommentar: den Permlink (die Adresse des Beitrags), die Community oder den Tag, den Inhalt und die Metadaten
- bei einer benutzerdefinierten Aktion: jeden Wert ihrer Daten, einen pro Zeile, damit nichts abgeschnitten wird
- bei einer Berechtigungsänderung: den Schwellenwert, die Schlüssel und die Konten, die sie setzt

Eine Berechtigungsänderung sagt auch, wenn sie Ihre Schlüssel entfernen würde, mit „Schlüssel: KEINE (Ihr Schlüssel wird entfernt)“. Ein fehlender Schwellenwert erscheint als „Schwellenwert NICHT GESETZT (gilt als 0)“.

In der Zusammenfassung und in den Einzelheiten werden Zeichen, die Text verbergen oder seine Richtung ändern könnten, als `�` angezeigt. Was Sie lesen, kann nicht vorgeben, etwas anderes zu sein.

**Rohdaten der Operation anzeigen** (oder **Rohdaten der Operationen anzeigen**) öffnet genau die Operationen, die signiert werden.

Ist ein Betrag in Hive Power angegeben, rechnet Hivesigner ihn zum aktuellen Kurs um. Es zeigt „Aktueller Umrechnungskurs für HIVE Power wird geladen…“ und wartet auf diesen Kurs, bevor Sie genehmigen können.

Manche Anfragen bringen eine Transaktion mit, die anderswo vorbereitet wurde, etwa für ein Konto, das mehrere Personen kontrollieren. Der Bildschirm sagt dann: „Diese Anfrage bringt ihren eigenen Transaktions-Header mit. Läuft ab: DATUM.“ Haben andere bereits signiert, kommt hinzu: „Die Anfrage enthält bereits 2 Signaturen.“

## Welchen Schlüssel sie braucht {#which-key}

Unter den Karten nennt eine Zeile den Schlüssel, den die gesamte Anfrage braucht: „Wird mit Ihrem Posting-Schlüssel signiert“, „Wird mit Ihrem Active-Schlüssel signiert“ oder „Wird mit Ihrem Owner-Schlüssel signiert“.

Hivesigner signiert genau mit diesem Schlüssel. Ein Active-Schlüssel kann keine Abstimmung signieren und ein Owner-Schlüssel keine Überweisung. Das ist eine Hive-Regel seit einem Hard Fork im Jahr 2025. Siehe [Welchen Schlüssel hinzufügen](/docs/accounts#which-key).

Alle Operationen in einer Anfrage müssen denselben Schlüssel brauchen. Tun sie das nicht, lautet die Zeile: „Diese Transaktion benötigt mehr als eine Berechtigung und kann nicht mit einem einzelnen Schlüssel signiert werden.“ Es gibt keine Schaltfläche zum Genehmigen. Gehen Sie zur App zurück.

Anfragen mit dem Owner-Schlüssel sind selten. Sie ändern, wer Ihr Konto kontrollieren oder wiederherstellen kann. Lesen Sie sie zweimal. Siehe [Lesen Sie, bevor Sie zustimmen](/docs/safety#read-before-approving).

### Wenn der Schlüssel fehlt {#missing-key}

Hat das ausgewählte Konto den Schlüssel auf diesem Gerät nicht, sagt der Bildschirm das. Zum Beispiel: „Dafür wird Ihr Active-Schlüssel benötigt, der für @BENUTZER hier nicht vorhanden ist.“

1. Wählen Sie **Weiteres Konto hinzufügen** unter der Meldung. Das öffnet das Formular **Konto hinzufügen**.
2. Geben Sie denselben Benutzernamen und den fehlenden Schlüssel ein. Hat das Konto einen Passcode, geben Sie auch diesen ein.
3. Wählen Sie **Konto hinzufügen**. Hivesigner fügt den Schlüssel hinzu und bringt Sie zur Anfrage zurück.

Ist das Konto gesperrt, zeigt der Bildschirm über der Schaltfläche ein Feld **Passcode**. Ein Klick entsperrt das Konto und genehmigt. Stellt sich heraus, dass der Schlüssel fehlt, sagt der Bildschirm das nach dem Entsperren.

Hat dieser Browser noch kein Konto, heißt die Schaltfläche **Weiter** und öffnet das Formular **Konto hinzufügen**.

## Genehmigen oder signieren {#approve}

Die Kontozeile über der Schaltfläche sagt „Signieren als“ mit dem Konto, das signiert. **Konto wechseln** lässt Sie ein anderes wählen. Siehe [Konten wechseln](/docs/accounts#switch-accounts).

- **Genehmigen** signiert die Transaktion in Ihrem Browser und sendet sie an das Hive-Netzwerk. Das Ergebnis lautet „Transaktion erfolgreich übertragen“ mit einer **Transaktions-ID**, die die Transaktion in einem Block-Explorer öffnet.
- **Signieren** erscheint stattdessen, wenn die Anfrage nur eine Signatur will. Hivesigner signiert die Transaktion, ohne sie an das Netzwerk zu senden. Es übergibt die Signatur der App oder zeigt sie an, wenn die Anfrage keine Website nennt.

Lehnt das Netzwerk die Transaktion ab, sehen Sie „Ihre Transaktion wurde nicht übertragen“ mit der „Fehlermeldung“ des Netzwerks. Sie können es erneut versuchen.

## Die Website, zu der Sie zurückkehren {#return-site}

Nennt die Anfrage eine Website zur Rückkehr, sagt ein Hinweis oben: „Sie werden zu HOST weitergeleitet.“ Nach dem Genehmigen schickt Hivesigner Sie dorthin. Prüfen Sie, dass HOST die Website ist, von der Sie kamen.

Nennt die Anfrage keine Website, bleibt Hivesigner beim Ergebnis.

## Eine Anfrage für ein anderes Konto {#another-account}

Eine Anfrage kann für ein anderes als das ausgewählte Konto gestellt sein. Hivesigner zeigt das auf zwei Arten.

**Die Anfrage muss von einem anderen Konto signiert werden.** Der Bildschirm sagt: „Diese Anfrage muss von @KONTO signiert werden. Wechseln Sie zu diesem Konto.“ Die Kontozeile lautet „Ausgewähltes Konto“ und darunter öffnet sich die Kontoliste. Wählen Sie dieses Konto oder fügen Sie es mit **Weiteres Konto hinzufügen** hinzu. Mit keinem anderen Konto signiert Hivesigner die Anfrage.

**Eine Operation handelt im Namen eines anderen Kontos.** Das kommt bei Konten vor, die mehrere Personen verwalten. Eine Warnung oben sagt: „Diese Anfrage handelt nicht im Namen von @BENUTZER, sondern im Namen von @KONTO. Fahren Sie nur fort, wenn Sie dieses Konto verwalten.“ Die Einzelheiten jeder Karte nennen das Konto, in dessen Namen sie handelt.

## Anfragen, die Hivesigner nicht lesen kann {#invalid-requests}

Hivesigner signiert nie eine Anfrage, die es nicht vollständig lesen und Ihnen zeigen kann. Dazu gehören eine Operation, die es nicht kennt, eine Anfrage ohne Operationen, ein Wert, der nicht zur Operation passt (eine Zahl, die keine Zahl ist, ein fehlerhafter Betrag), und zusätzliche Daten, die es nicht anzeigen kann.

Der Bildschirm sagt dann: „Hoppla, da ist etwas schiefgelaufen. Die übermittelten Daten sind ungültig.“ Gehen Sie zur App zurück. Um es dem Hivesigner-Team mitzuteilen, wählen Sie **Dieses Problem melden**.

## Anfragen zum Signieren von Nachrichten {#message-requests}

Manche Apps bitten Sie, eine Nachricht statt einer Transaktion zu signieren, etwa um zu beweisen, dass Ihnen ein Konto gehört. Eine Nachricht ist Text. Sie zu signieren ändert nichts in der Blockchain.

Der Bildschirm zeigt:

- Eine Überschrift wie „APP bittet Sie, eine Nachricht zu signieren.“ Hat die App ein Hive-Konto, nennt die Zeile darunter es: „Hive-Konto @APP_KONTO“.
- „Leitet Sie weiter zu HOST“: die Website, die die Signatur erhält. Dieselbe Zeile erscheint noch einmal neben der Schaltfläche.
- **Nachricht**: der ganze Text, genau so, wie er signiert wird. Zeichen, die Text verbergen oder seine Richtung ändern könnten, erscheinen als hervorgehobene Codes, etwa `\u{200B}`.
- Der verwendete Schlüssel: „Wird mit Ihrem Posting-Schlüssel signiert“ oder „Wird mit Ihrem Active-Schlüssel signiert“. Hivesigner signiert eine Nachricht nie mit dem Owner-Schlüssel.
- Eine Warnung: „Ihre Signatur beweist jedem, der sie sieht, dass @BENUTZER genau diesen Text signiert hat. Signieren Sie nur eine Nachricht, die Sie verstehen.“
- Die Kontozeile „Signieren als“ mit **Konto wechseln**.

Wählen Sie **Signieren**, um zu signieren. Hivesigner schickt Sie mit der Signatur, Ihrem Benutzernamen, der Schlüsselart und dem öffentlichen Schlüssel, der die Signatur erzeugt hat, zur Website zurück. Ein öffentlicher Schlüssel ist die teilbare Hälfte eines Schlüsselpaares: Er kann nichts signieren.

Wählen Sie **Abbrechen**, um zu Ihrer Seite **Konten** zu gehen. Die Website bekommt nichts.

Hat das Konto den Schlüssel auf diesem Gerät nicht, sagt der Bildschirm das. Zum Beispiel: „Dafür wird Ihr Posting-Schlüssel benötigt, der für @BENUTZER hier nicht vorhanden ist.“ Wählen Sie **Konto wechseln**, dann **Weiteres Konto hinzufügen**. [Fügen Sie den fehlenden Schlüssel](/docs/accounts#add-a-key) für dasselbe Konto hinzu. Hivesigner bringt Sie zur Anfrage zurück.

### Warum manche Nachrichten abgelehnt werden {#refused-messages}

**Eine Nachricht, die als Hivesigner-Anmeldung funktioniert.** Mancher Text hat genau die Form einer Hivesigner-Anmeldung. Ihn zu signieren gäbe der Website Zugriff auf Ihr Konto. Hivesigner signiert solchen Text nie und sagt: „Diese Nachricht ist ein Hivesigner-Token. Wer sie signiert, gibt der Website Zugriff auf sein Konto, deshalb kann sie nicht signiert werden.“

**Eine Anfrage, die Hivesigner nicht verwenden kann.** Hivesigner lehnt eine Anfrage ohne Nachricht oder ohne Rückkehradresse ab. Es lehnt auch eine Anfrage nach einem anderen Schlüssel als Posting oder Active ab, eine, die als App etwas nennt, das kein Hive-Konto ist, oder eine, deren Rückkehradresse nicht sicher oder nicht für die App registriert ist. Es sagt: „Diese Signaturanfrage kann nicht verwendet werden: Sie braucht eine Nachricht, einen Posting- oder Active-Schlüssel und eine sichere, für die App registrierte Weiterleitungs-URL. Gehen Sie zurück zur Website und versuchen Sie es erneut.“

Kann Hivesigner die Angaben der App nicht aus dem Hive-Netzwerk lesen, sagt es: „Die Kontodaten konnten nicht aus dem Hive-Netzwerk geladen werden.“ Bis dahin signiert es nichts. Wählen Sie **Erneut versuchen**.

## Selbst eine Nachricht signieren {#sign-message}

Sie können selbst eine Nachricht signieren, um zu beweisen, dass Sie ein Konto kontrollieren.

1. Öffnen Sie [hivesigner.com/signmessage](https://hivesigner.com/signmessage). Die Fußzeile verlinkt darauf als **Nachricht signieren**.
2. Ist das ausgewählte Konto gesperrt, geben Sie seinen Passcode ein und wählen Sie **Entsperren**. Ist kein Konto ausgewählt, verlinkt die Seite auf Ihre Konten.
3. Tippen Sie den Text in **Nachricht**. Hivesigner entfernt Leerzeichen und Zeilenumbrüche am Anfang und am Ende.
4. Wählen Sie den Schlüssel unter **Schlüssel zum Signieren**. Dort stehen die Schlüssel des ausgewählten Kontos auf diesem Gerät, der stärkste zuerst. Der stärkste ist zu Beginn ausgewählt. Wechseln Sie zu **Posting**, sofern Sie keinen anderen brauchen.
5. Wählen Sie **Nachricht signieren**.

Die **Signaturübersicht** zeigt **Autor**, **Verwendete Berechtigung**, ein **Verifizierungstoken** und einen **Verifizierungslink**. Das Verifizierungstoken fasst die Nachricht, Ihren Benutzernamen und die Signatur in einem Text zusammen. Geben Sie den Link oder das Token an die Person weiter, die die Nachricht prüfen soll.

Eine Signatur verrät Ihren Schlüssel nicht. Sie zeigt aber, welcher Schlüssel sie erzeugt hat.

## Eine Nachricht verifizieren {#verify-message}

1. Öffnen Sie [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage). Die Fußzeile verlinkt darauf als **Nachricht verifizieren**.
2. Fügen Sie das Token in **Verifizierungstoken** ein und wählen Sie **Signatur verifizieren**.

Ein Verifizierungslink öffnet diese Seite und prüft die Nachricht von selbst.

Das Ergebnis lautet „Die Signatur ist gültig für BENUTZER“ oder „Die Signatur konnte mit den Schlüsseln des Kontos nicht verifiziert werden.“ Darunter sehen Sie **Autor**, **Wiederhergestellter öffentlicher Schlüssel**, **Zugeordnete Berechtigung** (die Schlüsselart, die signiert hat) und **Nachricht**.

Hivesigner prüft die Signatur gegen die Schlüssel, die das Konto jetzt im Hive-Netzwerk hat. Eine Nachricht, die mit einem seither ersetzten Schlüssel signiert wurde, wird nicht mehr verifiziert.
