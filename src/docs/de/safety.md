Ihre Hive-Schlüssel steuern Ihr Konto. Wer sie hat, kann in Ihrem Namen handeln. Hivesigner bewahrt sie in Ihrem Browser auf und zeigt Ihnen, was Sie signieren. Diese Gewohnheiten halten sie sicher.

## Prüfen Sie zuerst die Adresse {#check-the-address}

Bevor Sie einen Schlüssel oder einen Passcode eingeben, schauen Sie in die Adressleiste Ihres Browsers. Dort muss `https://hivesigner.com` stehen.

- Eine gefälschte Seite kopiert das Aussehen von Hivesigner, nicht die Adresse. Lesen Sie die ganze Adresse: `hivesigner.com.example.net` ist nicht hivesigner.com.
- Achten Sie auf ein zusätzliches Wort, einen fehlenden oder vertauschten Buchstaben oder eine andere Endung.
- Hivesigner zeigt in seiner oberen Leiste die Adresse an, unter der es läuft. Eine gefälschte Seite kann dort beliebigen Text anzeigen, verlassen Sie sich deshalb auf die Adressleiste des Browsers.
- Um einen Schlüssel hinzuzufügen, tippen Sie die Adresse selbst ein oder verwenden Sie ein Lesezeichen. Folgen Sie keinem Link aus einer Nachricht, einer Anzeige oder einem Suchergebnis.

## Was Sie nie herausgeben müssen {#never-needed}

- Anmelden, Posten, Abstimmen, Wallet-Aktionen und das Autorisieren von Apps brauchen nie Ihr Master-Passwort oder Ihren Owner-Schlüssel. Siehe [Welchen Schlüssel hinzufügen](/docs/accounts#which-key).
- Apps, die Hivesigner verwenden, brauchen Ihre Schlüssel nie. Sie schicken Sie zu hivesigner.com. Ihre Schlüssel bleiben in Ihrem Browser. Eine Website, die Sie auffordert, einen Schlüssel auf ihrer eigenen Seite einzugeben, fragt nicht über Hivesigner.
- Geben Sie Ihre Schlüssel oder Ihren Passcode nie an jemanden weiter, der danach fragt, weder im Chat noch per E-Mail noch in einer Supportanfrage.

## Fügen Sie nur die Schlüssel hinzu, die Sie brauchen {#only-the-keys-you-need}

- Fügen Sie für den Alltag den Posting-Schlüssel hinzu.
- Fügen Sie den Active-Schlüssel nur für Wallet-Aktionen hinzu, für die erstmalige Autorisierung einer App oder um eine App zu widerrufen.
- Fügen Sie Ihr Master-Passwort besser nicht hinzu. Wenn Sie es tun, speichert Hivesigner jeden Schlüssel, der sich daraus ergibt, auch den Owner-Schlüssel.

Nachdem Sie eine App zum ersten Mal autorisiert haben, bleibt der Active-Schlüssel auf diesem Gerät. Um hier nur den Posting-Schlüssel zu behalten, [entfernen Sie das Konto](/docs/accounts#remove-account). [Fügen Sie es danach erneut hinzu](/docs/accounts#add-account), nur mit dem Posting-Schlüssel.

## Verwenden Sie einen Passcode {#use-a-passcode}

Ohne Passcode speichert Hivesigner Ihre Schlüssel unverschlüsselt in diesem Browser. Es öffnet sie bei jedem Start von selbst, sodass jeder, der diesen Browser nutzt, in Ihrem Namen signieren kann. Die Seite **Konten** kennzeichnet ein solches Konto mit **Kein Passcode**.

- Wählen Sie einen Passcode, den andere nicht erraten können. Hivesigner akzeptiert 4 Zeichen oder mehr. Ein längerer ist schwerer zu erraten.
- Verwenden Sie nicht Ihr Hive-Master-Passwort und keinen Ihrer Schlüssel als Passcode.

An einem Computer, den auch andere benutzen:

- Verwenden Sie immer einen Passcode.
- Schließen Sie den Hivesigner-Tab, wenn Sie fertig sind. Ein entsperrtes Konto bleibt in diesem Tab entsperrt, bis Sie ihn schließen oder neu laden.
- An einem fremden Computer [entfernen Sie das Konto](/docs/accounts#remove-account), bevor Sie gehen. Noch besser: Fügen Sie Ihre Schlüssel dort gar nicht erst hinzu.

## Lesen Sie, bevor Sie zustimmen {#read-before-approving}

- **Prüfen Sie das Konto.** Die Zeile mit „Anmelden als“, „Autorisieren als“ oder „Signieren als“ nennt das Konto, das antwortet. Wechseln Sie, wenn es das falsche ist.
- **Prüfen Sie, wohin es danach geht.** „Leitet Sie weiter zu HOST“ und „Sie werden zu HOST weitergeleitet.“ nennen die Website, die das Ergebnis erhält. Das sollte die Website sein, von der Sie kamen.
- **Prüfen Sie, wer fragt.** Eine App wählt ihren Anzeigenamen selbst. Die Zeile „Hive-Konto @APP_KONTO“ zeigt ihr echtes Hive-Konto. Auf der Seite zum Autorisieren oder Widerrufen einer App sagt Hivesigner über das Profil der App: „Alle Angaben oben stammen vom App-Konto selbst. Hivesigner überprüft keine davon.“
- **Prüfen Sie den Schlüssel.** Eine Abstimmung, ein Beitrag oder ein Folgen braucht den Posting-Schlüssel. Wenn Sie abstimmen wollten und der Bildschirm nach Ihrem Active- oder Owner-Schlüssel fragt, tut die Anfrage etwas anderes. Brechen Sie ab.
- **Lesen Sie Berechtigungsänderungen.** „Schlüssel: KEINE (Ihr Schlüssel wird entfernt)“ bedeutet, dass die Änderung Ihren Schlüssel aus Ihrem Konto entfernen würde. Stimmen Sie einer Änderung an Ihren Schlüsseln nur zu, wenn Sie sie selbst angestoßen haben.
- **Lesen Sie die Warnungen.** „Diese Anfrage handelt nicht im Namen von @BENUTZER, sondern im Namen von @KONTO.“ bedeutet, dass die Anfrage für ein anderes Konto handelt.
- **Signieren Sie nur Nachrichten, die Sie verstehen.** Eine signierte Nachricht beweist jedem, dass Sie genau diesen Text signiert haben.

Alles, was die Signierbildschirme zeigen, steht unter [Prüfen und signieren](/docs/signing).

## Eine gefälschte Seite erkennen {#spot-a-fake-page}

Eine Seite, die wie Hivesigner aussieht, ist gefälscht, wenn:

- **Die Adresse nicht hivesigner.com ist.** Das ist das eine Zeichen, das immer zählt.
- **Sie Ihren Posting-Schlüssel ablehnt.** Das echte Hivesigner akzeptiert den Posting-Schlüssel und meldet Sie damit an. Eine Seite, die auf Ihrem Master-Passwort oder Owner-Schlüssel besteht, ist nicht Hivesigner.
- **Sie die Konten nicht kennt, die Sie hinzugefügt haben.** Ihr Browser hält den Speicher jeder Website getrennt. Eine gefälschte Website unter einer anderen Adresse kann die Konten nicht sehen, die Sie auf hivesigner.com hinzugefügt haben, also fragt sie erneut nach einem Schlüssel. Das echte Hivesigner merkt sie sich in diesem Browser und fragt nur nach Ihrem Passcode, falls Sie einen gesetzt haben. Nach einem Schlüssel fragt es nur, wenn eine Anfrage einen braucht, den dieses Gerät nicht hat, und es nennt ihn dann. Zum Beispiel: „Dafür wird Ihr Active-Schlüssel benötigt, der für @BENUTZER hier nicht vorhanden ist.“

Ein neuer Browser oder ein neues Gerät hat Ihre Konten ebenfalls nicht. Prüfen Sie dort die Adresse, bevor Sie eines hinzufügen.

Wenn Sie einen Schlüssel auf einer gefälschten Seite eingegeben haben, betrachten Sie ihn als gestohlen. Wechseln Sie ihn auf Hive so schnell wie möglich.

## Der Code ist quelloffen {#open-source}

Der Code von Hivesigner ist öffentlich unter [github.com/ecency/hivesigner-ui](https://github.com/ecency/hivesigner-ui). Jeder kann ihn lesen und nachprüfen, wie er mit Ihren Schlüsseln umgeht. Um ein Problem zu melden, eröffnen Sie ein Issue unter [github.com/ecency/hivesigner-ui/issues](https://github.com/ecency/hivesigner-ui/issues). Die Seite **Über** verlinkt dorthin als **Fehler melden**.
