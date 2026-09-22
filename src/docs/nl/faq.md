Korte antwoorden op veelgestelde vragen. Elk antwoord linkt naar de pagina met de details.

## Hivesigner gebruiken {#using-hivesigner}

### Is Hivesigner gratis? {#is-it-free}

Ja. Hivesigner rekent niets aan mensen of aan apps. De broncode is open onder de MIT-licentie.

### Ziet Hivesigner ooit mijn sleutels? {#keys}

Nee. Je sleutels blijven in je browser, op je apparaat. Hivesigner ondertekent daar. Ze worden nooit naar de servers van Hivesigner of naar de apps die je gebruikt gestuurd. Zie [Waar je sleutels worden bewaard](/docs/accounts#where-keys-are-stored) en [Houd je sleutels veilig](/docs/safety).

### Wat als ik mijn toegangscode vergeet? {#forgotten-passcode}

Niemand kan een toegangscode herstellen, Hivesigner ook niet. Verwijder het account uit Hivesigner en voeg het opnieuw toe met je Hive-sleutel en een nieuwe toegangscode. Je Hive-account en de apps die je hebt geautoriseerd veranderen niet. Zie [Als je je toegangscode vergeet](/docs/accounts#forgotten-passcode).

### Kan ik Hivesigner op mijn telefoon gebruiken? {#phone}

Ja. Open https://hivesigner.com in de browser van je telefoon en voeg je account daar toe. Je sleutels worden alleen in die browser bewaard, dus voeg het account toe op elk apparaat dat je gebruikt. Zie [Accounts toevoegen en beheren](/docs/accounts).

### Welke apps gebruiken Hivesigner? {#which-apps}

https://hivesigner.com/apps toont de apps die via Hivesigner transacties naar Hive uitzenden, meest gebruikte eerst. Elke app publiceert zelf haar naam en beschrijving. Hivesigner controleert die niet. Als je daar een app opent, verschijnt een pagina waarop je haar posting-toegang kunt geven. Zie [Een app autoriseren vanuit de map](/docs/signing-in#directory).

### Hoe verhoudt Hivesigner zich tot Hive Keychain? {#hive-keychain}

Het zijn losse hulpmiddelen. Hive Keychain is een browserextensie en een mobiele app. Hivesigner is een website, dus er valt niets te installeren. Als een app je vraagt een bericht te ondertekenen, is de handtekening van dezelfde soort als die van Hive Keychain, zodat de app beide met dezelfde code controleert. Het verificatietoken van de pagina **Bericht ondertekenen** in Hivesigner wordt gecontroleerd op de pagina **Bericht verifiëren** in Hivesigner. Zie [Berichten ondertekenen](/docs/message-signing).

## Bouwen met Hivesigner {#building}

### Kan ik Hivesigner in een mobiele app gebruiken? {#mobile-app}

Ja. Stuur de gebruiker naar Hivesigner in een browser en gebruik een terugkeeradres dat je app kan ontvangen: een https-link die van jou is (Android App Links of iOS Universal Links) of een loopbackadres zoals `http://127.0.0.1/auth`. Eigen schema’s zoals `myapp://` worden geweigerd. Zie [Mobiele en desktop-apps](/docs/register-app#native-apps).

### Heb ik een app-account nodig? {#app-account}

Je hebt er een nodig om mensen met posting-toegang in te loggen en om via de API uit te zenden. Zie [Registreer je app](/docs/register-app). [Ondertekenlinks](/docs/sign-links) en [berichten ondertekenen](/docs/message-signing) werken zonder. [Inloggen zonder posting-toegang](/docs/login-only) ook.

### Kan de API overboekingen doen? {#transfers}

Nee. De API zendt alleen operaties op posting-niveau uit, zoals stemmen, reacties en volgacties. Gebruik voor overboekingen en andere acties die de active-sleutel nodig hebben [ondertekenlinks](/docs/sign-links): de gebruiker keurt elke actie met de eigen sleutel goed.

### Welke talen hebben een SDK? {#languages}

De officiële SDK is voor JavaScript. Voor Python bestaan bibliotheken van de community. Elke taal kan de REST-API aanroepen. Zie [SDK’s](/docs/sdk) en [REST-API](/docs/api).

## Hulp {#help}

### Waar kan ik hulp krijgen? {#get-help}

Vraag het op de HiveDevs-Discordserver: https://discord.gg/pNJn7wh. Meld een bug als issue in de bijbehorende GitHub-repository: https://github.com/ecency/hivesigner-ui voor de website, https://github.com/ecency/hivesigner-api voor de API of https://github.com/ecency/hivesigner-sdk voor de JavaScript-SDK. Op een scherm dat een verzoek weigert stuurt **Dit probleem melden** het probleem naar het Hivesigner-team.

### Hoe kan ik bijdragen? {#contribute}

Hivesigner is open source op GitHub, in de drie repository’s hierboven. Open een issue met een bug of een idee. Stuur een pull request met een oplossing.
