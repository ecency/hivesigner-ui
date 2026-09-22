Je Hive-sleutels bepalen wat er met je account gebeurt. Iedereen die ze heeft kan namens jou handelen. Hivesigner bewaart ze in je browser en laat je zien wat je ondertekent. Deze gewoonten houden ze veilig.

## Controleer eerst het adres {#check-the-address}

Kijk naar de adresbalk van je browser voordat je een sleutel of toegangscode intypt. Daar moet `https://hivesigner.com` staan.

- Een nepsite kopieert het uiterlijk van Hivesigner, niet het adres. Lees het hele adres: `hivesigner.com.example.net` is niet hivesigner.com.
- Let op een extra woord, een ontbrekende of verwisselde letter of een andere uitgang.
- Hivesigner toont in zijn bovenste balk het adres waarop hij draait. Een nepsite kan daar elke tekst neerzetten, dus vertrouw op de adresbalk van de browser.
- Typ het adres zelf in of gebruik een bladwijzer om een sleutel toe te voegen. Volg geen link uit een bericht, een advertentie of een zoekresultaat.

## Wat je nooit hoeft te geven {#never-needed}

- Inloggen, posten, stemmen, portemonnee-acties en apps autoriseren hebben nooit je hoofdwachtwoord of je owner-sleutel nodig. Zie [Welke sleutel toevoegen](/docs/accounts#which-key).
- Apps die Hivesigner gebruiken hebben je sleutels nooit nodig. Ze sturen je naar hivesigner.com. Je sleutels blijven in je browser. Een site die je vraagt een sleutel op haar eigen pagina in te typen, vraagt het niet via Hivesigner.
- Geef je sleutels of je toegangscode nooit aan iemand die erom vraagt, niet in een chat, niet in een e-mail en niet in een supportverzoek.

## Voeg alleen de sleutels toe die je nodig hebt {#only-the-keys-you-need}

- Voeg de posting-sleutel toe voor dagelijks gebruik.
- Voeg de active-sleutel alleen toe voor portemonnee-acties, om een app voor het eerst te autoriseren of om een app in te trekken.
- Voeg liever niet je hoofdwachtwoord toe. Doe je dat wel, dan bewaart Hivesigner elke sleutel die eruit volgt, ook de owner-sleutel.

Nadat je een app voor het eerst hebt geautoriseerd, blijft de active-sleutel op dit apparaat staan. Wil je hier alleen de posting-sleutel houden, [verwijder dan het account](/docs/accounts#remove-account). [Voeg het daarna opnieuw toe](/docs/accounts#add-account) met alleen de posting-sleutel.

## Gebruik een toegangscode {#use-a-passcode}

Zonder toegangscode bewaart Hivesigner je sleutels onversleuteld in deze browser. Hij opent ze bij elke start vanzelf, dus iedereen die deze browser gebruikt kan namens jou ondertekenen. De pagina **Accounts** markeert zo’n account met **Geen toegangscode**.

- Kies een toegangscode die anderen niet kunnen raden. Hivesigner accepteert 4 tekens of meer. Een langere is moeilijker te raden.
- Gebruik je Hive-hoofdwachtwoord of een van je sleutels niet als toegangscode.

Op een computer die anderen ook gebruiken:

- Gebruik altijd een toegangscode.
- Sluit het Hivesigner-tabblad als je klaar bent. Een ontgrendeld account blijft in dat tabblad ontgrendeld totdat je het sluit of herlaadt.
- Op een computer die niet van jou is, [verwijder je het account](/docs/accounts#remove-account) voordat je weggaat. Nog beter: voeg je sleutels daar helemaal niet toe.

## Lees voordat je goedkeurt {#read-before-approving}

- **Controleer het account.** De regel met “Inloggen als”, “Autoriseren als” of “Ondertekenen als” noemt het account dat antwoordt. Wissel als het het verkeerde is.
- **Controleer waar je daarna heen gaat.** “Stuurt je door naar HOST” en “Je wordt doorgestuurd naar HOST.” noemen de site die het resultaat krijgt. Dat hoort de site te zijn waar je vandaan kwam.
- **Controleer wie het vraagt.** Een app kiest haar eigen weergavenaam. De regel “Hive-account @APP_ACCOUNT” toont haar echte Hive-account. Op de pagina om een app te autoriseren of in te trekken zegt Hivesigner over het profiel van de app: “Alles hierboven is gepubliceerd door het app-account zelf. Hivesigner controleert hier niets van.”
- **Controleer de sleutel.** Een stem, een bericht of een volgactie heeft de posting-sleutel nodig. Wilde je stemmen en vraagt het scherm om je active- of owner-sleutel, dan doet het verzoek iets anders. Stop.
- **Lees wijzigingen van bevoegdheden.** “sleutels: GEEN (je sleutel wordt verwijderd)” betekent dat de wijziging jouw sleutel uit je account zou halen. Keur een wijziging aan je sleutels alleen goed als je die zelf bent begonnen.
- **Lees de waarschuwingen.** “Dit verzoek handelt niet namens @GEBRUIKER, maar namens @ACCOUNT.” betekent dat het verzoek voor een ander account handelt.
- **Onderteken alleen berichten die je begrijpt.** Een ondertekend bericht bewijst aan iedereen dat jij precies die tekst hebt ondertekend.

Zie [Controleren en ondertekenen](/docs/signing) voor alles wat de ondertekenschermen tonen.

## Een nepsite herkennen {#spot-a-fake-page}

Een pagina die op Hivesigner lijkt is nep wanneer:

- **Het adres niet hivesigner.com is.** Dit is het ene teken dat altijd geldt.
- **Ze je posting-sleutel weigert.** De echte Hivesigner accepteert de posting-sleutel en logt je daarmee in. Een pagina die aandringt op je hoofdwachtwoord of owner-sleutel is niet Hivesigner.
- **Ze de accounts die je hebt toegevoegd niet kent.** Je browser houdt de opslag van elke site apart. Een nepsite op een ander adres kan de accounts die je op hivesigner.com toevoegde niet zien, dus vraagt ze opnieuw om een sleutel. De echte Hivesigner onthoudt ze in deze browser en vraagt alleen om je toegangscode, als je die hebt ingesteld. Om een sleutel vraagt hij alleen wanneer een verzoek er een nodig heeft die dit apparaat niet heeft, en dan noemt hij die sleutel. Bijvoorbeeld: “Hiervoor is je active-sleutel nodig, maar die is hier niet aanwezig voor @GEBRUIKER.”

Een nieuwe browser of een nieuw apparaat heeft je accounts ook niet. Controleer daar het adres voordat je er een toevoegt.

Heb je een sleutel op een nepsite ingetypt, beschouw die sleutel dan als gestolen. Vervang hem zo snel mogelijk op Hive.

## De code is open source {#open-source}

De code van Hivesigner staat openbaar op [github.com/ecency/hivesigner-ui](https://github.com/ecency/hivesigner-ui). Iedereen kan hem lezen en nagaan hoe hij met je sleutels omgaat. Open een issue op [github.com/ecency/hivesigner-ui/issues](https://github.com/ecency/hivesigner-ui/issues) om een probleem te melden. De pagina **Over** linkt daarheen als **Een bug melden**.
