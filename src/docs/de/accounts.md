Hivesigner signiert mit den Schlüsseln der Hive-Konten, die Sie hinzufügen. Ein Konto fügen Sie in jedem Browser, den Sie nutzen, einmal hinzu. Hivesigner bewahrt seine Schlüssel dann in diesem Browser auf, verschlüsselt mit einem Passcode, falls Sie einen setzen.

## Ein Konto hinzufügen {#add-account}

1. Prüfen Sie, dass in der Adressleiste Ihres Browsers `https://hivesigner.com` steht. Siehe [Prüfen Sie zuerst die Adresse](/docs/safety#check-the-address).
2. Öffnen Sie [hivesigner.com/import](https://hivesigner.com/import). Wenn dieser Browser noch kein Konto hat, öffnet **Hivesigner einrichten** auf der Startseite dasselbe Formular.
3. Geben Sie unter **Benutzername** Ihren Hive-Benutzernamen klein geschrieben ein, ohne das `@`.
4. Fügen Sie unter **Privater Schlüssel** einen Ihrer privaten Schlüssel ein. Lesen Sie zuerst [Welchen Schlüssel hinzufügen](/docs/accounts#which-key).
5. Lassen Sie **Mit einem Passcode schützen (empfohlen)** aktiviert und wählen Sie einen **Passcode**. Er braucht mindestens 4 Zeichen. Siehe [Schützen Sie es mit einem Passcode](/docs/accounts#passcode).
6. Wählen Sie **Konto hinzufügen**.

Hivesigner prüft den Schlüssel gegen Ihr Konto im Hive-Netzwerk, bevor es irgendetwas speichert. Es vergleicht den öffentlichen Teil des Schlüssels mit den Schlüsseln, die Ihr Konto führt. Der private Schlüssel selbst wird nirgendwohin gesendet. Wenn der Benutzername kein Hive-Konto ist oder der Schlüssel nicht dazu gehört, meldet das Formular: „Ungültiger Benutzername oder Schlüssel. Verwenden Sie Ihr Master-Passwort oder Ihren Owner-, Active-, Posting- oder Memo-Schlüssel.“

Das Konto, das Sie hinzufügen, wird zum ausgewählten Konto: dem, das Hivesigner auf seinen Bildschirmen verwendet. Wenn Sie über eine Anfrage zum Formular kamen, bringt Hivesigner Sie zu dieser Anfrage zurück. Sonst öffnet es die Seite **Konten**.

### Einem Konto einen weiteren Schlüssel hinzufügen {#add-a-key}

Um einem Konto, das schon hier ist, einen zweiten Schlüssel hinzuzufügen (etwa den Active-Schlüssel neben dem Posting-Schlüssel), fügen Sie das Konto mit dem neuen Schlüssel erneut hinzu. Hivesigner behält die vorhandenen Schlüssel und ergänzt den neuen. Ein neuer Schlüssel für eine Rolle, die schon da ist, ersetzt den alten.

Hat das Konto einen Passcode, lassen Sie **Mit einem Passcode schützen (empfohlen)** aktiviert und geben Sie denselben Passcode ein. Alles andere lehnt Hivesigner ab:

- Ohne Passcode meldet das Formular: „Dieses Konto ist auf diesem Gerät geschützt. Geben Sie seinen Passcode ein, um den Schlüssel hinzuzufügen.“
- Mit einem anderen Passcode meldet es: „Falscher Passcode. Der Schlüssel wurde nicht gespeichert.“

## Welchen Schlüssel hinzufügen {#which-key}

Ein Hive-Konto hat mehrere private Schlüssel. Jeder erlaubt andere Aktionen. Sie haben sie von der Wallet oder App bekommen, die Ihr Hive-Konto erstellt hat, meist auf deren Schlüssel- oder Passwortseite. Hivesigner kann sie Ihnen nicht zeigen.

| Schlüssel | Wofür Hivesigner ihn verwendet |
| --- | --- |
| Posting | Anmelden bei Apps, Abstimmen, Posten und Kommentieren, Folgen, Ihr Profil bearbeiten und Ihre Belohnungen abholen. |
| Active | Wallet-Aktionen wie Überweisungen, Power-up oder Power-down, Delegationen, Sparguthaben und Umwandlungen. Witness- und Proposal-Stimmen. Eine App erstmals autorisieren und eine App widerrufen. |
| Owner | Ihren Owner-Schlüssel oder Ihr Wiederherstellungskonto ändern. Im Alltag brauchen Sie ihn nie. |
| Memo | Nichts. Das Formular nimmt ihn an, aber ein Konto mit nur dem Memo-Schlüssel kann sich nicht anmelden: Der Anfragebildschirm zeigt dann „Fügen Sie einen Posting- oder Active-Schlüssel für @BENUTZER hinzu, um fortzufahren“. |

Fügen Sie für den Alltag den Posting-Schlüssel hinzu. Fügen Sie den Active-Schlüssel nur hinzu, wenn Sie ihn für eine Wallet-Aktion oder für die erstmalige Autorisierung einer App brauchen. Wenn ein Bildschirm einen Schlüssel braucht, den dieses Gerät nicht hat, sagt er das und lässt Sie ihn hinzufügen.

Auch Ihr Master-Passwort funktioniert im Feld **Privater Schlüssel**. Hivesigner leitet Ihre Schlüssel daraus ab und speichert jeden, der noch zu Ihrem Konto passt, auch den Owner-Schlüssel. Wenn Sie die Schlüssel einzeln hinzufügen, bleibt der Owner-Schlüssel von diesem Gerät fern.

> **Hinweis:** Hivesigner signiert jede Transaktion genau mit dem Schlüssel, den sie braucht. Das folgt einer Hive-Regel, die seit einem Hard Fork im Jahr 2025 gilt. Ein Active-Schlüssel kann keine Posting-Aktion wie eine Abstimmung mehr signieren. Ein Owner-Schlüssel kann keine Wallet-Aktion mehr signieren. Fügen Sie den Posting-Schlüssel hinzu, auch wenn der Active-Schlüssel schon hier ist.

Das Anmelden bei einer App ist etwas anderes: Es ist keine Transaktion. Hivesigner meldet Sie mit dem Posting-Schlüssel an, oder mit dem Active-Schlüssel, wenn dieses Gerät keinen Posting-Schlüssel für das Konto hat.

## Schützen Sie es mit einem Passcode {#passcode}

Der Passcode ist ein Passwort, das Sie nur für diesen Browser wählen. Er ist nicht Ihr Hive-Passwort und keiner Ihrer Schlüssel. Hivesigner verschlüsselt damit die Schlüssel des Kontos, bevor es sie speichert, und fragt danach, um sie wieder zu öffnen.

- Hivesigner speichert Ihren Passcode nicht und sendet ihn nirgendwohin. Niemand kann ihn für Sie wiederherstellen.
- Jedes Konto auf diesem Gerät hat seinen eigenen Passcode. Sie dürfen für alle denselben verwenden.
- Ein längerer Passcode ist schwerer zu erraten. Verwenden Sie nicht Ihr Hive-Master-Passwort und keinen Ihrer Schlüssel als Passcode.

Ohne Passcode speichert Hivesigner die Schlüssel des Kontos unverschlüsselt in diesem Browser. Es öffnet sie bei jedem Start von selbst, sodass jeder, der diesen Browser nutzt, damit signieren kann. Die Seite **Konten** kennzeichnet ein solches Konto mit **Kein Passcode**.

Um einem Konto ohne Passcode einen zu geben, fügen Sie das Konto mit einem seiner Schlüssel und einem Passcode erneut hinzu. Hivesigner verschlüsselt dann alle Schlüssel des Kontos mit diesem Passcode.

Um einen Passcode zu ändern, [entfernen Sie das Konto](/docs/accounts#remove-account) und fügen Sie es mit dem neuen Passcode wieder hinzu. Das Entfernen löscht jeden Schlüssel des Kontos aus diesem Browser, fügen Sie also jeden Schlüssel erneut hinzu (den Posting-Schlüssel und danach den Active-Schlüssel, falls Sie ihn nutzen).

## Ein Konto entsperren {#unlock}

Ein Konto mit Passcode startet jedes Mal gesperrt, wenn Hivesigner geöffnet wird: in einem neuen Tab, nach einem Neuladen oder wenn eine App Sie hierher schickt. Sie müssen es nicht im Voraus entsperren. Ein Bildschirm, der die Schlüssel braucht, zeigt über seiner eigenen Schaltfläche ein Feld **Passcode** (zum Beispiel **Anmelden**, **Genehmigen** oder **Entsperren**). Ein Klick entsperrt das Konto und fährt fort.

Ein falscher Passcode zeigt „Falscher Passcode.“ und nichts wird signiert.

Hivesigner hält entsperrte Schlüssel nur im Arbeitsspeicher, nie im Speicher der Website. Das Konto bleibt in diesem Tab entsperrt, bis Sie ihn schließen oder neu laden.

## Konten wechseln {#switch-accounts}

Die Seite **Konten** listet die Konten auf diesem Gerät von A bis Z auf. Das ausgewählte Konto trägt ein Häkchen. Ab 6 Konten filtert ein Feld **Konten suchen** die Liste.

Wählen Sie ein Konto, um es zum ausgewählten Konto zu machen. Hivesigner fragt hier nicht nach dem Passcode. Danach fragt der Bildschirm, der die Schlüssel braucht.

Auf einem Anfragebildschirm hat die Zeile, die das Konto nennt („Anmelden als“, „Autorisieren als“ oder „Signieren als“), einen Link **Konto wechseln**. Er öffnet dieselbe Liste an Ort und Stelle, sodass Sie ein anderes Konto wählen können, ohne die Anfrage zu verlassen. **Weiteres Konto hinzufügen** unter der Liste öffnet das Formular **Konto hinzufügen** und bringt Sie danach zur Anfrage zurück.

## Ein Konto entfernen {#remove-account}

1. Öffnen Sie die Seite **Konten**.
2. Wählen Sie das **✕** neben dem Konto. Sein Name für Screenreader lautet **Aus Hivesigner entfernen @BENUTZER**.
3. Bestätigen Sie, wenn der Browser fragt: „@BENUTZER von diesem Gerät entfernen? Die hier gespeicherten Schlüssel dieses Kontos werden gelöscht.“

Ein Konto zu entfernen löscht seine Schlüssel nur aus diesem Browser. Ihr Hive-Konto ändert sich nicht. Apps, die Sie autorisiert haben, behalten ihren Zugriff, denn dieser Zugriff liegt in der Hive-Blockchain. Wie Sie ihn entziehen, steht unter [Den Zugriff einer App sehen und entziehen](/docs/signing-in#remove-access).

Wenn Sie das ausgewählte Konto entfernen, wird ein anderes Konto auf diesem Gerät zum ausgewählten.

Lässt der Browser Hivesigner die Änderung nicht speichern, sehen Sie: „Nur für diese Sitzung entfernt: Der Speicher ist nicht verfügbar, daher erscheint dieses Konto nach dem Neuladen wieder.“

## Wenn Sie Ihren Passcode vergessen {#forgotten-passcode}

Niemand kann einen Passcode wiederherstellen, auch Hivesigner nicht. Ihr Hive-Konto ist davon nicht betroffen: Der Passcode schützt nur die Kopie Ihrer Schlüssel in diesem Browser.

1. [Entfernen Sie das Konto](/docs/accounts#remove-account) von diesem Gerät.
2. [Fügen Sie es erneut hinzu](/docs/accounts#add-account), mit seinem Schlüssel und einem neuen Passcode.

In der Hive-Blockchain ändert sich nichts. Apps, die Sie autorisiert haben, behalten ihren Zugriff.

## Wo Ihre Schlüssel gespeichert werden {#where-keys-are-stored}

Hivesigner speichert Ihre Schlüssel nur in diesem Browser, auf diesem Gerät, in dem Speicher, den der Browser für hivesigner.com führt.

- Sie werden nicht synchronisiert. Ein anderer Browser, ein anderes Browserprofil oder ein anderes Gerät hat sie nicht. Fügen Sie das Konto dort ebenfalls hinzu.
- Wenn Sie die Website- oder Browserdaten für hivesigner.com löschen, sind sie weg. Ebenso, wenn Sie ein privates Fenster schließen.
- Hivesigner ist kein Backup. Bewahren Sie Ihre Schlüssel oder Ihr Master-Passwort anderswo sicher auf.
