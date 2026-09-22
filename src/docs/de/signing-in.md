Wenn eine App Sie sich mit Hivesigner anmelden lässt, schickt sie Sie mit einer Anfrage zu hivesigner.com. Hivesigner zeigt, wer fragt, worum gebeten wird und welches Ihrer Konten antwortet. Entscheiden tun Sie dort. Die App erhält Ihre Schlüssel nie: Sie bekommt einen Nachweis Ihres Benutzernamens, signiert in Ihrem Browser.

## Der Anfragebildschirm {#request-screen}

Von oben nach unten zeigt der Bildschirm:

- **Die App.** Ihr Bild und eine Überschrift. Wenn die App zum ersten Mal Posting-Zugriff verlangt, lautet die Überschrift „APP fordert Zugriff auf Ihr Konto an.“ Sonst lautet sie „Anmelden bei APP“. Den Namen darin wählt die App selbst.
- **Hive-Konto @APP_KONTO.** Das echte Hive-Konto der App. Eine App darf sich nennen, wie sie will, aber diesen Namen kann sie nicht ändern. Prüfen Sie ihn.
- **Leitet Sie weiter zu HOST.** Die Website, zu der Hivesigner Sie nach dem Genehmigen zurückschickt.
- **Berechtigungsumfang.** Was die App verlangt: [nur Anmeldung oder Posting-Zugriff](/docs/signing-in#scopes).
- **Die Kontozeile.** „Autorisieren als“ oder „Anmelden als“, mit dem Konto, das die App erhält, und einem Link **Konto wechseln**. Siehe [Das Konto wählen](/docs/signing-in#choose-account).
- **Die Schaltfläche.** **Autorisieren** oder **Anmelden**. Ist das Konto gesperrt, sitzt darüber ein Feld **Passcode**, und ein Klick entsperrt das Konto und fährt fort.
- **Abbrechen.** Bringt Sie zu Ihrer Seite **Konten**. Hivesigner sendet nichts an die App.

Wenn dieser Browser noch kein Konto hat, heißt die Schaltfläche **Weiter**. Sie öffnet das Formular **Konto hinzufügen** und bringt Sie danach zur Anfrage zurück. Siehe [Ein Konto hinzufügen](/docs/accounts#add-account).

## Nur Anmeldung oder Posting-Zugriff {#scopes}

Eine App verlangt eines von beidem. Dazwischen gibt es nichts.

### Nur Anmeldung {#sign-in-only}

**Berechtigungsumfang** zeigt „Den Benutzernamen Ihres Kontos einsehen“. Die App erfährt, welches Hive-Konto Sie sind, bestätigt durch Ihre Signatur. Sie erhält keine Erlaubnis, für Sie zu handeln. Die Schaltfläche heißt **Anmelden**.

Auch eine Website ohne eigenes Hive-Konto kann Sie um eine Anmeldung bitten. Ihr Bildschirm zeigt „HOST möchte Ihren Hive-Benutzernamen bestätigen.“ Eine solche Anfrage ist immer nur eine Anmeldung. Hivesigner nennt die Website bei ihrer Adresse, denn diese Adresse ist das Einzige, was Sie an ihr prüfen können.

### Posting-Zugriff {#posting-access}

**Berechtigungsumfang** zeigt „Mit Ihrer Posting-Berechtigung wird APP Folgendes können:“ und danach, was das bedeutet:

- **Posten und kommentieren:** Beiträge und Kommentare in Ihrem Namen veröffentlichen.
- **Abstimmen:** mit Ihrem Konto Upvotes und Downvotes geben.
- **Folgen und Ihren Feed aktualisieren:** in Ihrem Namen folgen, stummschalten und rebloggen.

Die Posting-Berechtigung ist der Teil Ihres Hive-Kontos, der die alltäglichen Aktionen steuert. Beim Genehmigen wird das Hive-Konto der App zu Ihrer Posting-Berechtigung hinzugefügt. Das ist eine einzige Erteilung in der Hive-Blockchain, keine Liste einzelner Rechte.

## Was Posting-Zugriff erlaubt {#what-posting-access-allows}

Mit Posting-Zugriff kann die App in Ihrem Namen alles tun, was Ihr Posting-Schlüssel kann:

- Ihre Beiträge und Kommentare veröffentlichen, bearbeiten und löschen
- abstimmen
- folgen, stummschalten und rebloggen
- Ihr Profil bearbeiten
- Ihre Belohnungen in Ihre eigene Wallet holen
- andere alltägliche Aktionen, die Hive-Apps und -Spiele nutzen

Sie kann nie:

- Ihr Guthaben bewegen: HIVE oder HBD senden, Power-up oder Power-down machen, Hive Power delegieren oder Ihr Sparguthaben nutzen
- Ihre Schlüssel ändern oder wer Ihr Konto kontrolliert
- anderen Apps Zugriff geben

> **Warnung:** Autorisieren Sie nur Apps, denen Sie vertrauen. Posting-Zugriff gilt, bis Sie ihn widerrufen. Er liegt in der Hive-Blockchain, nicht in Hivesigner: Das Konto aus Hivesigner zu entfernen beendet ihn nicht.

## Wenn Sie eine App zum ersten Mal autorisieren {#first-time}

Wenn Sie einer App zum ersten Mal Posting-Zugriff geben, zeigt der Bildschirm diesen Hinweis: „Erstmalige Autorisierung: Dadurch wird @APP_KONTO on-chain zu Ihrer Posting-Berechtigung hinzugefügt, wofür einmalig Ihr Active-Schlüssel nötig ist. Dieses Konto kann dann in Ihrem Namen posten, bis Sie die Berechtigung widerrufen.“

Zu ändern, wer für Ihr Konto posten darf, ist eine Änderung am Konto selbst, deshalb braucht es Ihren Active-Schlüssel. Hat dieses Gerät ihn nicht, fragt der Bildschirm an Ort und Stelle danach:

1. Fügen Sie Ihren Active-Schlüssel in **Active-Schlüssel oder Master-Passwort für @BENUTZER** ein. Hivesigner prüft ihn gegen Ihr Konto im Hive-Netzwerk und speichert ihn auf diesem Gerät bei Ihren anderen Schlüsseln. Wenn Sie Ihr Master-Passwort einfügen, behält Hivesigner davon nur den Active-Schlüssel, dazu den Posting-Schlüssel, falls dieses Gerät keinen hat.
2. Hat das Konto keinen Passcode, bietet das Formular **Mit einem Passcode schützen (empfohlen)** an, standardmäßig aktiviert. Hat es einen und Hivesigner braucht ihn erneut, fragt das Formular unter **Passcode für @BENUTZER** danach.
3. Wählen Sie **Active-Schlüssel hinzufügen**, dann **Autorisieren**.

Hivesigner sendet die Änderung dann aus Ihrem Browser an das Hive-Netzwerk. Es wartet, bis die Änderung in der Blockchain erscheint, und schickt Sie erst dann angemeldet zur App zurück. Dauert das zu lange, sehen Sie: „Die Autorisierung wurde übermittelt, wird aber noch bestätigt. Bitte versuchen Sie es gleich noch einmal.“

Der Active-Schlüssel bleibt danach auf diesem Gerät. Um hier nur den Posting-Schlüssel zu behalten, siehe [Fügen Sie nur die Schlüssel hinzu, die Sie brauchen](/docs/safety#only-the-keys-you-need).

## Eine App aus dem Verzeichnis autorisieren {#directory}

Jede App auf [hivesigner.com/apps](https://hivesigner.com/apps) öffnet eine Seite mit dem Titel „@APP_KONTO autorisieren“. Sie zeigt, was die App über sich selbst veröffentlicht, und den Satz „@APP_KONTO wird als @BENUTZER posten, kommentieren, abstimmen und folgen können.“

**Autorisieren** zu wählen gibt der App sofort Posting-Zugriff, so wie der Bildschirm der erstmaligen Autorisierung. Dafür ist Ihr Active-Schlüssel nötig. Keine App hat Sie darum gebeten, nutzen Sie es also nur, wenn Sie es wirklich wollen. **Abbrechen** bringt Sie zu Ihrer Seite **Konten**.

Wenn Ihr Konto der App bereits Posting-Zugriff gegeben hat, meldet die Seite „@APP_KONTO ist autorisiert.“ und bietet **Weiter** an.

## Zu einer App zurückkehren {#coming-back}

Wenn Ihr Konto einer App bereits Posting-Zugriff gegeben hat, wird nichts Neues erteilt. Der Bildschirm ist kürzer:

- Die Überschrift lautet „Anmelden bei APP“.
- Eine Zeile sagt: „Sie haben @APP_KONTO bereits autorisiert. Es werden keine neuen Rechte erteilt.“
- Die Kontozeile lautet „Anmelden als“.
- Die Schaltfläche heißt **Anmelden**.

Dafür brauchen Sie nur Ihren Posting-Schlüssel (oder Ihren Active-Schlüssel). Haben Sie die App zwischenzeitlich widerrufen, erscheint wieder der Bildschirm der erstmaligen Autorisierung.

## Das Konto wählen {#choose-account}

Die Kontozeile nennt das Konto, das die App erhält. Prüfen Sie sie vor dem Genehmigen, besonders wenn Sie mehrere Konten auf diesem Gerät haben.

- Wählen Sie **Konto wechseln**, um die Liste Ihrer Konten an Ort und Stelle zu öffnen. Nehmen Sie ein anderes, und der Bildschirm wechselt zu diesem Konto.
- Wählen Sie **Weiteres Konto hinzufügen** unter der Liste, um ein Konto hinzuzufügen, das noch nicht auf diesem Gerät ist. Hivesigner bringt Sie danach zur Anfrage zurück.

Eine App kann vorschlagen, welches Konto verwendet wird. Ist dieses Konto auf diesem Gerät, wählt Hivesigner es aus. Sie können trotzdem wechseln.

## Wenn Hivesigner eine Anfrage ablehnt {#refused-requests}

Hivesigner lässt Sie keine Anfrage genehmigen, die es nicht prüfen kann. Der Bildschirm zeigt stattdessen eine dieser Meldungen:

| Meldung | Was sie bedeutet |
| --- | --- |
| „Die Weiterleitungs-URL dieser App ist nicht registriert. Zu Ihrer Sicherheit wird die Anmeldung blockiert.“ | Die Rückkehradresse gehört nicht zu denen, die die App in ihrem Hive-Konto aufgeführt hat. |
| „@APP_KONTO ist kein Hive-Konto, daher gibt es keine App zu autorisieren. Kehren Sie zur Website zurück und versuchen Sie es erneut.“ | Die Anfrage nennt eine App, die es nicht gibt. |
| „Diese Website hat verlangt, dass Ihre Anmeldung über eine unverschlüsselte http://-Adresse gesendet wird. Hivesigner sendet sie nur über https. Bitten Sie die Website, eine sichere Adresse zu verwenden.“ | Die Rückkehradresse ist nicht sicher. |
| „Diese Website hat verlangt, dass Ihre Anmeldung an eine Adresse gesendet wird, die keine Web-URL ist. Kehren Sie zur Website zurück und versuchen Sie es erneut.“ | Die Rückkehradresse ist keine Webadresse. |
| „Diese Autorisierungsanfrage ist unvollständig: Es fehlt die App oder die Weiterleitungs-URL. Kehren Sie zur App zurück und versuchen Sie es erneut.“ | Der Anfrage fehlen Teile. |

Gehen Sie zur App zurück und versuchen Sie es erneut. Bleibt das Problem, wählen Sie **Dieses Problem melden**. Das schickt den Link und Ihre freiwillige Notiz an das Hivesigner-Team, mit geschwärzten Geheimnissen.

Erreicht Hivesigner das Hive-Netzwerk nicht, zeigt es „Die Kontodaten konnten nicht aus dem Hive-Netzwerk geladen werden.“ Wählen Sie **Erneut versuchen**.

## Den Zugriff einer App sehen und entziehen {#remove-access}

1. Öffnen Sie [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps). Die Fußzeile verlinkt darauf als **Autorisierte Apps**.
2. Die Seite zeigt „Apps, die als @BENUTZER posten dürfen.“ für das ausgewählte Konto, darunter jede App. Um die Apps eines anderen Kontos zu sehen, wählen Sie es zuerst auf der Seite **Konten** aus.
3. Ist das Konto gesperrt, geben Sie seinen Passcode ein und wählen Sie **Entsperren**.
4. Wählen Sie **Widerrufen** neben der App. Liegt der Active-Schlüssel auf diesem Gerät, wird der Zugriff der App sofort entfernt.

Die Liste zeigt jedes Konto, das eigenständig als Ihres posten kann, auch solche, die Sie mit anderen Werkzeugen hinzugefügt haben.

Ein Widerruf ist eine Änderung an Ihrem Konto in der Hive-Blockchain, dafür ist einmal Ihr Active-Schlüssel nötig. Hat dieses Gerät ihn nicht, öffnet **Widerrufen** eine Seite für diese App („Zugriff von @APP_KONTO widerrufen“), die dort nach dem Active-Schlüssel fragt. Sie sagt: „@APP_KONTO kann dann nicht mehr als @BENUTZER handeln.“ Fügen Sie den Schlüssel hinzu und wählen Sie **Widerrufen**.

Wenn Sie eine App widerrufen, entfernt Hivesigner das Konto der App aus der Posting-Berechtigung Ihres Kontos (und aus seiner Active-Berechtigung, falls es dort steht). Von da an kann die App nicht mehr in Ihrem Namen posten, abstimmen oder handeln. Fragt die App später erneut nach Posting-Zugriff, sehen Sie den Bildschirm der erstmaligen Autorisierung.

Ein Widerruf meldet Sie nicht von der eigenen Website der App ab. Melden Sie sich dort bei Bedarf ebenfalls ab.
