Kurze Antworten auf häufige Fragen. Jede verlinkt auf die Seite mit den Einzelheiten.

## Hivesigner verwenden {#using-hivesigner}

### Ist Hivesigner kostenlos? {#is-it-free}

Ja. Hivesigner verlangt weder von Nutzern noch von Apps Gebühren. Der Quellcode ist offen unter der MIT-Lizenz.

### Sieht Hivesigner jemals meine Schlüssel? {#keys}

Nein. Ihre Schlüssel bleiben in Ihrem Browser auf Ihrem Gerät. Hivesigner signiert dort. Sie werden nie an die Server von Hivesigner oder an die Apps gesendet, die Sie nutzen. Siehe [Wo Ihre Schlüssel gespeichert werden](/docs/accounts#where-keys-are-stored) und [Ihre Schlüssel sicher aufbewahren](/docs/safety).

### Was, wenn ich meinen Passcode vergesse? {#forgotten-passcode}

Niemand kann einen Passcode wiederherstellen, auch Hivesigner nicht. Entfernen Sie das Konto aus Hivesigner und fügen Sie es mit Ihrem Hive-Schlüssel und einem neuen Passcode erneut hinzu. Ihr Hive-Konto und die Apps, die Sie autorisiert haben, ändern sich nicht. Siehe [Wenn Sie Ihren Passcode vergessen](/docs/accounts#forgotten-passcode).

### Kann ich Hivesigner auf dem Handy nutzen? {#phone}

Ja. Öffnen Sie https://hivesigner.com im Browser Ihres Handys und fügen Sie Ihr Konto dort hinzu. Ihre Schlüssel liegen nur in diesem Browser, fügen Sie das Konto also auf jedem Gerät hinzu, das Sie nutzen. Siehe [Konten hinzufügen und verwalten](/docs/accounts).

### Welche Apps nutzen Hivesigner? {#which-apps}

https://hivesigner.com/apps listet die Apps auf, die über Hivesigner Transaktionen an Hive übertragen, die meistgenutzten zuerst. Jede App veröffentlicht ihren eigenen Namen und ihre eigene Beschreibung. Hivesigner überprüft diese nicht. Wenn Sie dort eine App öffnen, erscheint eine Seite, auf der Sie ihr Posting-Zugriff geben können. Siehe [Eine App aus dem Verzeichnis autorisieren](/docs/signing-in#directory).

### Wie hängt Hivesigner mit Hive Keychain zusammen? {#hive-keychain}

Es sind getrennte Werkzeuge. Hive Keychain ist eine Browser-Erweiterung und eine Handy-App. Hivesigner ist eine Website, es gibt also nichts zu installieren. Wenn eine App Sie bittet, eine Nachricht zu signieren, ist die Signatur von derselben Art wie die von Hive Keychain, sodass die App beide mit demselben Code prüft. Das Verifizierungstoken von der Seite **Nachricht signieren** in Hivesigner wird auf der Seite **Nachricht verifizieren** in Hivesigner geprüft. Siehe [Nachrichten signieren](/docs/message-signing).

## Mit Hivesigner entwickeln {#building}

### Kann ich Hivesigner in einer Handy-App verwenden? {#mobile-app}

Ja. Schicken Sie die Nutzerin oder den Nutzer im Browser zu Hivesigner und verwenden Sie einen Callback, den Ihre App empfangen kann: einen https-Link, der Ihnen gehört (Android App Links oder iOS Universal Links), oder eine Loopback-Adresse wie `http://127.0.0.1/auth`. Eigene Schemata wie `myapp://` werden abgelehnt. Siehe [Handy- und Desktop-Apps](/docs/register-app#native-apps).

### Brauche ich ein App-Konto? {#app-account}

Sie brauchen eines, um Menschen mit Posting-Zugriff anzumelden und über die API zu senden. Siehe [Ihre App registrieren](/docs/register-app). [Signierlinks](/docs/sign-links) und das [Signieren von Nachrichten](/docs/message-signing) funktionieren auch ohne. Das [Anmelden ohne Posting-Zugriff](/docs/login-only) ebenfalls.

### Kann die API Überweisungen senden? {#transfers}

Nein. Die API überträgt nur Operationen auf Posting-Ebene, etwa Abstimmungen, Kommentare und Folgen. Für Überweisungen und andere Aktionen, die den Active-Schlüssel brauchen, verwenden Sie [Signierlinks](/docs/sign-links): Die Nutzerin oder der Nutzer genehmigt jede einzeln mit dem eigenen Schlüssel.

### Für welche Sprachen gibt es ein SDK? {#languages}

Das offizielle SDK ist für JavaScript. Für Python gibt es Community-Bibliotheken. Jede Sprache kann die REST-API aufrufen. Siehe [SDKs](/docs/sdk) und [REST-API](/docs/api).

## Hilfe {#help}

### Wo bekomme ich Hilfe? {#get-help}

Fragen Sie im HiveDevs-Discord-Server: https://discord.gg/pNJn7wh. Melden Sie einen Fehler als Issue im passenden GitHub-Repository: https://github.com/ecency/hivesigner-ui für die Website, https://github.com/ecency/hivesigner-api für die API oder https://github.com/ecency/hivesigner-sdk für das JavaScript-SDK. Auf einem Bildschirm, der eine Anfrage ablehnt, schickt **Dieses Problem melden** das Problem an das Hivesigner-Team.

### Wie kann ich mitwirken? {#contribute}

Hivesigner ist quelloffen auf GitHub, in den drei Repositories oben. Eröffnen Sie ein Issue mit einem Fehler oder einer Idee. Schicken Sie einen Pull Request mit einer Korrektur.
