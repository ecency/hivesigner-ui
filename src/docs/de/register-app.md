Eine App, die Menschen mit Hivesigner anmeldet, ist ein Hive-Konto. Sein Name ist die `client_id`, die Sie senden. Sein Profil enthält die Einstellungen, die Hivesigner liest: die Callbacks, an die Tokens gehen dürfen, und für den Code-Flow ein Client-Secret. Um über die API zu übertragen, erteilt das App-Konto außerdem @hivesigner die Posting-Berechtigung. Diese Seite geht jeden Schritt durch.

## Was Sie brauchen {#what-you-need}

| Sie möchten | App-Konto und Callbacks | Client-Secret | Erteilung an @hivesigner |
| --- | --- | --- | --- |
| Menschen anmelden und mit dem Token-Flow übertragen | Ja | Nein | Ja |
| Menschen anmelden und mit dem Code-Flow übertragen (Refresh-Tokens) | Ja | Ja | Ja |
| Menschen nur anmelden, mit einem Token, das Ihre App nennt | Ja | Nein | Nein |
| Menschen nur anmelden, von einer Website ohne Hive-Konto | Nein | Nein | Nein |
| Signaturlinks senden | Nein | Nein | Nein |

Zu den letzten beiden Zeilen siehe [Anmelden ohne Posting-Zugriff](/docs/login-only) und [Signaturlinks](/docs/sign-links).

## Das App-Konto erstellen {#app-account}

1. Erstellen Sie ein Hive-Konto für Ihre App, zum Beispiel unter https://ecency.com/signup. Nutzen Sie ein eigenes Konto für die App, nicht Ihr persönliches. Sein Name ist Ihre `client_id`. Die Nutzer sehen ihn auf dem Zustimmungsbildschirm neben "Hive-Konto". Ein Hive-Konto lässt sich nicht umbenennen, wählen Sie den Namen also sorgfältig.
2. Fügen Sie das Konto unter https://hivesigner.com/import zu Hivesigner hinzu (**Konto hinzufügen**). Nutzen Sie den Active-Schlüssel oder das Master-Passwort: Die Erteilung weiter unten braucht den Active-Schlüssel.

## Die App-Einstellungen ausfüllen {#app-settings}

Öffnen Sie https://hivesigner.com/profile mit ausgewähltem App-Konto und setzen Sie:

- **Dieses Konto ist eine App.** Schalten Sie das ein. Es markiert das Konto als App, was die API prüft, bevor sie einen Code oder ein Refresh-Token dafür annimmt.
- **Weiterleitungs-URIs.** Ihre Callbacks, einer pro Zeile. Siehe [Callbacks](#callbacks).
- **Ersteller.** Wer die App betreut. Das App-Verzeichnis unter https://hivesigner.com/apps zeigt das an.
- **Status.** Produktiv oder Sandbox, für Ihre eigenen Unterlagen. Hivesigner behandelt beides gleich.
- **Client-Secret.** Nur für den [Code-Flow](/docs/oauth2#code-flow) nötig. Siehe [Client-Secret](#client-secret).

Füllen Sie auch **Name** und **URL des Profilbilds** aus. Der Zustimmungsbildschirm zeigt Bild und Namen Ihrer App. Das App-Verzeichnis unter https://hivesigner.com/apps zeigt den Namen, **Über** und **Website**.

Das Speichern aktualisiert das Profil des Kontos on-chain und braucht dessen Posting-Schlüssel. Hivesigner liest Ihre Callbacks aus dem Konto, sobald eine Anmeldeanfrage geöffnet wird, eine Änderung gilt also, sobald die Transaktion in einem Block steht.

> **Hinweis:** Name, Bild und Beschreibung veröffentlicht Ihr App-Konto selbst. Deshalb zeigt der Zustimmungsbildschirm zusätzlich den echten Kontonamen (`@myapp`) und den Host, zu dem die Person geschickt wird: Genau die nutzen die Erteilung und die Weiterleitung wirklich.

## Callbacks {#callbacks}

Ein Callback (die `redirect_uri` in einer Anmeldeanfrage) ist der Ort, an den Hivesigner die Person mit einem Token oder einem Code zurückschickt. Hivesigner sendet nur an einen Callback, der im Konto Ihrer App aufgeführt ist.

### Die Regeln {#callback-rules}

- **Exakte Übereinstimmung.** Die `redirect_uri` der Anfrage muss eine Ihrer Weiterleitungs-URIs sein, Zeichen für Zeichen: Schema, Host, Port, Pfad und Query.
- **Nur https.** Ein Callback muss `https://` verwenden. Einfaches `http://` wird nur auf Loopback akzeptiert: `localhost`, `127.0.0.1` oder `[::1]`.
- **Loopback-Ports dürfen wechseln.** Ein registrierter Loopback-Callback mit einfachem http passt zu jedem Loopback-Host und -Port mit demselben Pfad, derselben Query, demselben Fragment und derselben Benutzerinformation. Ein registrierter `https://`-Loopback-Callback bleibt eine exakte Übereinstimmung.
- **Keine eigenen Schemata.** Ein Callback wie `myapp://callback` wird abgelehnt. Siehe [Mobile und Desktop-Apps](#native-apps).
- **Keine Fragmente.** Hängen Sie kein `#fragment` an einen Callback.

Die Profilseite weigert sich, einen Callback zu speichern, der nie funktionieren könnte, mit "Keine verwendbare Callback-Adresse (https oder http auf localhost)".

### Beispiele {#callback-examples}

Mit diesen registrierten Weiterleitungs-URIs:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| `redirect_uri` in der Anfrage | Ergebnis |
| --- | --- |
| `https://myapp.example/auth/callback` | Angenommen: exakte Übereinstimmung |
| `https://myapp.example/auth/callback/` | Abgelehnt: zusätzliches `/` |
| `https://myapp.example/auth/callback?next=home` | Abgelehnt: die Query weicht ab |
| `https://www.myapp.example/auth/callback` | Abgelehnt: anderer Host |
| `http://myapp.example/auth/callback` | Abgelehnt: einfaches http außerhalb von Loopback |
| `http://localhost:3000/auth` | Angenommen: exakte Übereinstimmung |
| `http://127.0.0.1:51234/auth` | Angenommen: Loopback, gleicher Pfad, anderer Port |
| `http://[::1]:3000/auth` | Angenommen: Loopback, gleicher Pfad |
| `http://127.0.0.1:3000/other` | Abgelehnt: anderer Pfad |
| `https://localhost:3000/auth` | Abgelehnt: https passt nicht zu einer Registrierung mit einfachem http |
| `myapp://auth` | Abgelehnt: eigenes Schema |

Um eine Query auf Ihrem Callback anzunehmen, registrieren Sie den Callback mit genau dieser Query. Hivesigner behält die eigene Query Ihres Callbacks und hängt seine Parameter dahinter an.

### Mobile und Desktop-Apps {#native-apps}

Hivesigner legt das Token in die Callback-URL. Ein eigenes Schema wie `myapp://` gehört nicht zu genau einer App: Eine andere App auf demselben Gerät kann es beanspruchen und das Token erhalten. Deshalb lehnt Hivesigner eigene Schemata ab und sendet Tokens nur an eine https-Adresse oder an Loopback auf dem Gerät der Person.

Eine native App nutzt stattdessen einen dieser Wege:

- **Ein https-Link, der ihr gehört.** Registrieren Sie einen Callback auf Ihrer Domain, den das Betriebssystem in Ihrer App öffnet (App Links unter Android oder Universal Links unter iOS).
- **Ein Loopback-Callback.** Die App lauscht für die Weiterleitung auf `127.0.0.1`. Registrieren Sie `http://127.0.0.1/auth` (oder `localhost`) und nutzen Sie zur Laufzeit einen beliebigen freien Port: Der Port muss nicht übereinstimmen.

## Client-Secret {#client-secret}

Das Client-Secret belegt, dass ein Code-Tausch von Ihrem Server kommt. Für den [Code-Flow](/docs/oauth2#code-flow) ist es Pflicht: Ihr Server sendet es mit jedem Code oder Refresh-Token an `/api/oauth2/token`. Der Token-Flow nutzt es nicht.

- **Erzeugen Sie einen langen Zufallswert**, zum Beispiel mit `openssl rand -hex 32`.
- **Setzen Sie ihn auf der Profilseite.** Hivesigner speichert nur dessen sha256-Hash, im Profil Ihres App-Kontos. Bleibt das Feld leer, bleibt das bisherige Secret bestehen.
- **Bewahren Sie es auf Ihrem Server auf.** Legen Sie es nie in eine Webseite, eine mobile App oder eine URL.
- **Zum Wechseln** setzen Sie ein neues und aktualisieren gleichzeitig Ihren Server.

## @hivesigner die Posting-Berechtigung erteilen {#grant-hivesigner}

Die API überträgt mit dem Posting-Schlüssel des Kontos @hivesigner. Hive akzeptiert diese Signatur für Ihre Nutzer nur, wenn Ihr App-Konto @hivesigner zu seiner eigenen Posting-Berechtigung hinzugefügt hat. Siehe [Die Kette der Posting-Berechtigung](/docs/how-it-works#authority-chain).

1. Wählen Sie Ihr App-Konto in Hivesigner aus.
2. Öffnen Sie https://hivesigner.com/authorize/hivesigner.
3. Die Seite zeigt "@hivesigner autorisieren" und "@hivesigner wird als @myapp posten, kommentieren, abstimmen und folgen können.". Wählen Sie **Autorisieren**. Dafür ist der Active-Schlüssel des App-Kontos nötig.

Das machen Sie einmal. Ohne das scheitert jede Übertragung mit `unauthorized_client` und "Broadcaster account doesn't have permission to broadcast for @myapp". Eine App, die nur anmeldet, braucht das nicht.

Diese Erteilung erlaubt @hivesigner auch, als Ihr App-Konto selbst zu posten, ein weiterer Grund, das App-Konto nur für die App zu nutzen.

Apps, die mit dieser Erteilung über Hivesigner übertragen, können im App-Verzeichnis unter https://hivesigner.com/apps erscheinen, sortiert danach, wie viele Menschen sie nutzen.

## Was Nutzer sehen, wenn etwas nicht stimmt {#refused-requests}

Hivesigner lehnt eine Anfrage ab, die es nicht sicher beantworten kann. Es zeigt eine Meldung und eine Schaltfläche **Dieses Problem melden**. Die Anfrage kann nicht genehmigt werden. An Ihren Callback geht nichts.

| Problem | Was die Person liest |
| --- | --- |
| Die `redirect_uri` ist keine Ihrer Weiterleitungs-URIs | "Die Weiterleitungs-URL dieser App ist nicht registriert. Zu Ihrer Sicherheit wird die Anmeldung blockiert." |
| Die `client_id` ist kein Hive-Konto | "@myapp ist kein Hive-Konto, daher gibt es keine App zu autorisieren. Kehren Sie zur Website zurück und versuchen Sie es erneut." |
| Das Konto ist nicht als App markiert | "@myapp ist nicht als App eingerichtet und kann Sie daher nicht anmelden. Gehen Sie zurück zur Website und versuchen Sie es erneut." Schalten Sie **Dieses Konto ist eine App** ein, wie oben beschrieben. |
| Keine `redirect_uri` in der Anfrage | "Diese Autorisierungsanfrage ist unvollständig: Es fehlt die App oder die Weiterleitungs-URL. Kehren Sie zur App zurück und versuchen Sie es erneut." |

Melden Ihre Nutzer einen dieser Fälle, vergleichen Sie die von Ihrer App gesendete `redirect_uri` Zeichen für Zeichen mit Ihren Weiterleitungs-URIs.

## Checkliste {#checklist}

1. Ein Hive-Konto für die App, mit seinem Active-Schlüssel zu Hivesigner hinzugefügt.
2. Unter https://hivesigner.com/profile: "Dieses Konto ist eine App" eingeschaltet, Weiterleitungs-URIs aufgelistet, ein Client-Secret gesetzt, falls Sie den Code-Flow nutzen.
3. @hivesigner unter https://hivesigner.com/authorize/hivesigner autorisiert, falls Sie über die API übertragen.
4. Ein Anmeldelink, der genau eine Ihrer Weiterleitungs-URIs sendet. Siehe [Anmelden mit OAuth2](/docs/oauth2).
