Wanneer een app je laat inloggen met Hivesigner, stuurt ze je met een verzoek naar hivesigner.com. Hivesigner toont wie het vraagt, waar ze om vragen en welk van je accounts antwoordt. Daar beslis jij. De app krijgt je sleutels nooit: ze krijgt een bewijs van je gebruikersnaam, ondertekend in je browser.

## Het verzoekscherm {#request-screen}

Van boven naar beneden toont het scherm:

- **De app.** Haar afbeelding en een kop. Vraagt de app voor het eerst om posting-toegang, dan luidt de kop “APP vraagt toegang tot je account.” Anders luidt die “Inloggen bij APP”. De naam daarin kiest de app zelf.
- **Hive-account @APP_ACCOUNT.** Het echte Hive-account van de app. Een app mag zich noemen wat ze wil, maar deze naam kan ze niet veranderen. Controleer hem.
- **Stuurt je door naar HOST.** De site waar Hivesigner je naartoe terugstuurt als je goedkeurt.
- **Reikwijdte.** Waar de app om vraagt: [alleen inloggen of posting-toegang](/docs/signing-in#scopes).
- **De accountregel.** “Autoriseren als” of “Inloggen als”, met het account dat de app krijgt en een link **Van account wisselen**. Zie [Kies het account](/docs/signing-in#choose-account).
- **De knop.** **Autoriseren** of **Inloggen**. Is het account vergrendeld, dan staat er een veld **Toegangscode** boven, en één klik ontgrendelt het account en gaat verder.
- **Annuleren.** Brengt je naar je pagina **Accounts**. Hivesigner stuurt niets naar de app.

Heeft deze browser nog geen account, dan luidt de knop **Doorgaan**. Die opent het formulier **Account toevoegen** en brengt je daarna terug naar het verzoek. Zie [Een account toevoegen](/docs/accounts#add-account).

## Alleen inloggen of posting-toegang {#scopes}

Een app vraagt om een van beide. Daartussenin bestaat niets.

### Alleen inloggen {#sign-in-only}

**Reikwijdte** toont “De gebruikersnaam van je account bekijken”. De app komt te weten welk Hive-account je bent, bevestigd door je handtekening. Ze krijgt geen enkel recht om namens jou te handelen. De knop luidt **Inloggen**.

Ook een site zonder eigen Hive-account kan je vragen in te loggen. Haar scherm luidt “HOST wil je Hive-gebruikersnaam bevestigen.” Zo’n verzoek is altijd alleen inloggen. Hivesigner noemt de site bij haar adres, want dat adres is het enige wat je aan haar kunt controleren.

### Posting-toegang {#posting-access}

**Reikwijdte** toont “Met je posting-bevoegdheid kan APP:” gevolgd door wat dat betekent:

- **Posten en reageren:** berichten en reacties namens jou publiceren.
- **Stemmen:** met jouw account upvotes en downvotes geven.
- **Volgen en je feed bijwerken:** namens jou volgen, dempen en herdelen.

De posting-bevoegdheid is het deel van je Hive-account dat de dagelijkse acties regelt. Goedkeuren voegt het Hive-account van de app toe aan je posting-bevoegdheid. Dat is één toekenning op de Hive-blockchain, geen lijst met losse rechten.

## Wat posting-toegang toestaat {#what-posting-access-allows}

Met posting-toegang kan de app namens jou alles doen wat je posting-sleutel kan:

- je berichten en reacties publiceren, bewerken en verwijderen
- stemmen
- volgen, dempen en herdelen
- je profiel bewerken
- je beloningen naar je eigen portemonnee opeisen
- andere dagelijkse acties die Hive-apps en -spellen gebruiken

Ze kan nooit:

- je geld verplaatsen: HIVE of HBD versturen, power-up of power-down doen, Hive Power delegeren of je spaartegoed gebruiken
- je sleutels wijzigen of wie je account beheert
- andere apps toegang geven

> **Waarschuwing:** Autoriseer alleen apps die je vertrouwt. Posting-toegang duurt totdat je die intrekt. Ze staat op de Hive-blockchain, niet in Hivesigner: het account uit Hivesigner verwijderen beëindigt haar niet.

## De eerste keer dat je een app autoriseert {#first-time}

De eerste keer dat je een app posting-toegang geeft, toont het scherm deze melding: “Eerste autorisatie: hiermee wordt @APP_ACCOUNT op de blockchain toegevoegd aan je posting-bevoegdheid, waarvoor eenmalig je active-sleutel nodig is. Dat account kan dan namens jou posten totdat je de toegang intrekt.”

Wijzigen wie er voor je account mag posten is een wijziging van het account zelf, dus is je active-sleutel nodig. Heeft dit apparaat die niet, dan vraagt het scherm er ter plekke om:

1. Plak je active-sleutel in **Active-sleutel of hoofdwachtwoord voor @GEBRUIKER**. Hivesigner controleert hem bij je account op het Hive-netwerk en slaat hem op dit apparaat op bij je andere sleutels. Plak je je hoofdwachtwoord, dan houdt Hivesigner daar alleen de active-sleutel uit, plus de posting-sleutel als dit apparaat die niet heeft.
2. Heeft het account geen toegangscode, dan biedt het formulier **Beveiligen met een toegangscode (aanbevolen)** aan, standaard aangevinkt. Heeft het er wel een en heeft Hivesigner die opnieuw nodig, dan vraagt het formulier erom bij **Toegangscode voor @GEBRUIKER**.
3. Kies **Active-sleutel toevoegen** en daarna **Autoriseren**.

Hivesigner stuurt de wijziging dan vanuit je browser naar het Hive-netwerk. Hij wacht tot de wijziging op de blockchain verschijnt en stuurt je pas daarna ingelogd terug naar de app. Duurt dat te lang, dan zie je “De autorisatie is verzonden, maar wordt nog bevestigd. Probeer het zo meteen opnieuw.”

De active-sleutel blijft daarna op dit apparaat staan. Wil je hier alleen de posting-sleutel houden, zie [Voeg alleen de sleutels toe die je nodig hebt](/docs/safety#only-the-keys-you-need).

## Een app autoriseren vanuit de map {#directory}

Elke app op [hivesigner.com/apps](https://hivesigner.com/apps) opent een pagina met de titel “@APP_ACCOUNT autoriseren”. Die toont wat de app over zichzelf publiceert en de zin “@APP_ACCOUNT kan dan posten, reageren, stemmen en volgen als @GEBRUIKER.”

**Autoriseren** kiezen geeft de app meteen posting-toegang, net als het scherm voor de eerste keer. Daar is je active-sleutel voor nodig. Geen enkele app heeft je hierom gevraagd, gebruik het dus alleen als je het echt van plan bent. **Annuleren** brengt je naar je pagina **Accounts**.

Heeft je account de app al posting-toegang gegeven, dan zegt de pagina “@APP_ACCOUNT is geautoriseerd.” en biedt **Doorgaan** aan.

## Terugkomen bij een app {#coming-back}

Heeft je account een app al posting-toegang gegeven, dan wordt er niets nieuws verleend. Het scherm is korter:

- De kop luidt “Inloggen bij APP”.
- Een regel zegt “Je hebt @APP_ACCOUNT al eerder geautoriseerd. Er worden geen nieuwe rechten verleend.”
- De accountregel luidt “Inloggen als”.
- De knop luidt **Inloggen**.

Je hebt hiervoor alleen je posting-sleutel (of je active-sleutel) nodig. Heb je de app tussendoor ingetrokken, dan verschijnt het scherm voor de eerste keer opnieuw.

## Kies het account {#choose-account}

De accountregel noemt het account dat de app krijgt. Controleer die voordat je goedkeurt, zeker als je meerdere accounts op dit apparaat hebt.

- Kies **Van account wisselen** om de lijst met je accounts ter plekke te openen. Kies een ander en het scherm schakelt over naar dat account.
- Kies **Nog een account toevoegen** onder de lijst om een account toe te voegen dat nog niet op dit apparaat staat. Hivesigner brengt je daarna terug naar het verzoek.

Een app kan voorstellen welk account je gebruikt. Staat dat account op dit apparaat, dan kiest Hivesigner het. Je kunt alsnog wisselen.

## Wanneer Hivesigner een verzoek weigert {#refused-requests}

Hivesigner laat je geen verzoek goedkeuren dat hij niet kan controleren. Het scherm toont in plaats daarvan een van deze meldingen:

| Melding | Wat het betekent |
| --- | --- |
| “De doorstuur-URL van deze app is niet geregistreerd. Voor je veiligheid is inloggen geblokkeerd.” | Het terugkeeradres staat niet tussen de adressen die de app op haar Hive-account vermeldt. |
| “@APP_ACCOUNT is geen Hive-account, dus er is geen app om te autoriseren. Ga terug naar de site en probeer het opnieuw.” | Het verzoek noemt een app die niet bestaat. |
| “Deze site vroeg om je login via een onbeveiligd http://-adres te sturen. Hivesigner verstuurt die alleen via https. Vraag de site om een beveiligd adres te gebruiken.” | Het terugkeeradres is niet veilig. |
| “Deze site vroeg om je login naar een adres te sturen dat geen web-URL is. Ga terug naar de site en probeer het opnieuw.” | Het terugkeeradres is geen webadres. |
| “Dit autorisatieverzoek is onvolledig: er ontbreekt een app of een doorstuur-URL. Ga terug naar de app en probeer het opnieuw.” | Er ontbreken onderdelen aan het verzoek. |

Ga terug naar de app en probeer het opnieuw. Blijft het probleem, kies dan **Dit probleem melden**. Dat stuurt de link en je optionele notitie naar het Hivesigner-team, met geheimen onleesbaar gemaakt.

Kan Hivesigner het Hive-netwerk niet bereiken, dan toont hij “Kan de accountgegevens niet laden van het Hive-netwerk.” Kies **Opnieuw proberen**.

## De toegang van een app bekijken en intrekken {#remove-access}

1. Open [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps). De voettekst linkt daarheen als **Geautoriseerde apps**.
2. De pagina toont “Apps die kunnen posten als @GEBRUIKER.” voor het geselecteerde account, met daaronder elke app. Wil je de apps van een ander account zien, kies dat account dan eerst op de pagina **Accounts**.
3. Is het account vergrendeld, voer dan de toegangscode in en kies **Ontgrendelen**.
4. Kies **Intrekken** naast de app. Staat de active-sleutel op dit apparaat, dan verdwijnt de toegang van de app meteen.

De lijst toont elk account dat zelfstandig als het jouwe kan posten, ook accounts die je met andere hulpmiddelen hebt toegevoegd.

Intrekken is een wijziging van je account op de Hive-blockchain, dus is je active-sleutel eenmalig nodig. Heeft dit apparaat die niet, dan opent **Intrekken** een pagina voor die app (“Toegang van @APP_ACCOUNT intrekken”) die daar om de active-sleutel vraagt. Er staat “@APP_ACCOUNT kan dan niet langer handelen als @GEBRUIKER.” Voeg de sleutel toe en kies **Intrekken**.

Als je een app intrekt, haalt Hivesigner het account van de app uit de posting-bevoegdheid van je account (en uit de active-bevoegdheid, als het daar ook staat). Vanaf dat moment kan de app niet meer namens jou posten, stemmen of handelen. Vraagt de app later opnieuw om posting-toegang, dan zie je het scherm voor de eerste keer.

Intrekken logt je niet uit op de eigen website van de app. Log daar zo nodig apart uit.
