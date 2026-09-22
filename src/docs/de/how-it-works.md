Mit Hivesigner können Menschen ihr Hive-Konto in Ihrer App nutzen, ohne Ihrer App ihre Schlüssel zu geben. Hivesigner hat zwei Teile: einen Signierer im Browser unter https://hivesigner.com und eine API unter `https://hivesigner.com/api/`. Diese Seite erklärt, was jeder Teil tut und auf welchen zwei Wegen eine App sie nutzt.

## Der Signierer im Browser {#browser-signer}

Der Signierer im Browser ist die Hivesigner-Website. Dort fügen Menschen ihre Hive-Konten hinzu. Ihre Schlüssel bleiben im eigenen Browser: Hivesigner sendet keinen Schlüssel an einen Server. Ihre App sieht nie einen.

Der Signierer signiert drei Arten von Dingen, jedes Mal erst, nachdem die Person gesehen hat, was sie signiert:

- **Anmeldetokens.** Ihre App schickt jemanden zum Anmelden zu Hivesigner. Hivesigner zeigt den Namen Ihrer App und das, was sie verlangt. Stimmt die Person zu, signiert Hivesigner mit ihrem Schlüssel eine kurze Aussage, die ihr Konto und Ihre App nennt. Diese signierte Aussage ist das Token, das Ihre App erhält. Siehe [Anmelden mit OAuth2](/docs/oauth2) und [Tokens](/docs/tokens).
- **Transaktionen.** Ein Signaturlink öffnet eine Transaktion zur Prüfung. Stimmt die Person zu, signiert Hivesigner sie mit dem nötigen Schlüssel. Danach sendet Hivesigner sie aus dem Browser an das Hive-Netzwerk, sofern der Link nicht nur die Signatur verlangt. Siehe [Signaturlinks](/docs/sign-links).
- **Nachrichten.** Ihre App kann eine Person bitten, einen Text mit ihrem Schlüssel zu signieren, um zu beweisen, dass sie das Konto kontrolliert. Siehe [Nachrichten signieren](/docs/message-signing).

## Die API {#api}

Die API überträgt Posting-Operationen für eine Person, die sich in Ihrer App angemeldet hat: Beiträge und Kommentare, Stimmen, Follows und andere `custom_json`-Operationen, das Einlösen von Belohnungen und Profiländerungen. Ihre App sendet die Operationen zusammen mit dem Token der Person. Die API prüft das Token, signiert die Transaktion mit dem Posting-Schlüssel des Kontos @hivesigner und überträgt sie an Hive.

Die API liefert außerdem das Konto der angemeldeten Person, tauscht Codes gegen Tokens und listet die Apps auf, die Hivesigner nutzen. Siehe [REST-API](/docs/api).

## Die Kette der Posting-Berechtigung {#authority-chain}

Auf Hive kann ein Konto einem anderen Konto erlauben, mit seiner Posting-Berechtigung zu handeln. Die API stützt sich auf zwei solche Erteilungen:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **Die Person fügt Ihr App-Konto zu ihrer Posting-Berechtigung hinzu.** Der Zustimmungsbildschirm erledigt das beim ersten Mal, wenn jemand den Posting-Zugriff für Ihre App genehmigt. Dafür ist einmalig der Active-Schlüssel der Person nötig.
2. **Ihr App-Konto fügt @hivesigner zu seiner Posting-Berechtigung hinzu.** Das machen Sie einmal, wenn Sie [Ihre App registrieren](/docs/register-app#grant-hivesigner).

Vor jeder Übertragung prüft die API, ob beide Erteilungen vorliegen. Sie überträgt nur Operationen, deren Autor die im Token genannte Person ist.

Die Person kann den Zugriff Ihrer App jederzeit unter https://hivesigner.com/authorized-apps entfernen. Danach kann die API nicht mehr über Ihre App für sie posten.

## Zwei Wege der Integration {#two-ways-to-integrate}

### Anmelden, dann über die API übertragen {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

Die Person stimmt einmal zu. Danach kann Ihre App für sie abstimmen, kommentieren und posten, ohne erneut zu fragen, bis das Token abläuft oder die Person den Zugriff Ihrer App entfernt. Nutzen Sie das für die alltäglichen sozialen Aktionen.

Sie brauchen ein App-Konto mit registrierten Callbacks und die Erteilung an @hivesigner. Siehe [Ihre App registrieren](/docs/register-app). Wenn Sie nur wissen wollen, wer die Person ist, siehe [Anmelden ohne Posting-Zugriff](/docs/login-only).

### Signaturlinks {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

Die Person sieht jede Transaktion, bevor sie signiert wird. Signaturlinks decken 41 Hive-Operationen ab, darunter Überweisungen und andere Wallet-Aktionen, die den Active-Schlüssel brauchen. Die API verarbeitet diese nie. Für Signaturlinks brauchen Sie kein App-Konto. Siehe [Signaturlinks](/docs/sign-links).

### Was Sie wählen sollten {#which-to-choose}

- **Häufige Posting-Aktionen** (Stimmen, Kommentare, Follows): mit OAuth2 anmelden und dann die API nutzen.
- **Wallet-Aktionen** oder alles, was den Active-Schlüssel braucht: Signaturlinks nutzen.
- **Beides**: Viele Apps melden Menschen für soziale Funktionen mit OAuth2 an und nutzen Signaturlinks für Überweisungen.
- **Nur die Identität der Person**: siehe [Anmelden ohne Posting-Zugriff](/docs/login-only).

## Quellcode {#source-code}

Hivesigner ist Open Source:

- Der Signierer im Browser: https://github.com/ecency/hivesigner-ui
- Die API: https://github.com/ecency/hivesigner-api
- Das JavaScript-SDK (npm-Paket `hivesigner`): https://github.com/ecency/hivesigner-sdk. Siehe [SDKs](/docs/sdk).
