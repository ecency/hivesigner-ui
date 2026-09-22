Apps kunnen je vragen een Hive-transactie te ondertekenen, zoals een stem, een overboeking of een bericht. Ze sturen je een link die Hivesigner opent. Hivesigner laat in gewone woorden zien wat het verzoek doet, welke sleutel ervoor nodig is en waar je daarna heen gaat. Er wordt niets ondertekend voordat je goedkeurt. Apps kunnen je ook vragen een bericht te ondertekenen, dat nooit op de blockchain komt.

## Het scherm Transactie bevestigen {#confirm-screen}

Een ondertekenlink opent een scherm met de titel “Transactie bevestigen”. Het toont één kaart per operatie in het verzoek. Een operatie is één actie op Hive, zoals één stem of één overboeking.

Bevat een verzoek meer dan één operatie, dan zijn de kaarten genummerd en zegt een regel erboven “Dit verzoek bevat 3 operaties. Bekijk ze allemaal voordat je goedkeurt.”

### De samenvatting {#summary}

Elke kaart begint met een zin die zegt wat de operatie doet, met de waarden uit het verzoek. Bijvoorbeeld:

| Operatie | Wat de kaart zegt |
| --- | --- |
| Een overboeking | 1.000 HIVE sturen naar @bob (en eronder de memo, als Memo: ...) |
| Een stem | Upvote voor @alice/mijn-bericht (en eronder het stemgewicht, bijvoorbeeld 100%) |
| Een bericht of een reactie | Bericht “Mijn titel” publiceren, of Reageren op @alice/mijn-bericht |
| Een actie die een Hive-app definieert | Aangepaste actie (follow) |
| Een wijziging van wie een account beheert | Accountbevoegdheden bijwerken |

Andere operaties tonen hun naam, zoals “Power-up” of “Hive Power delegeren”.

Naast de zin toont een label in hoofdletters de sleutel die de operatie nodig heeft: POSTING, ACTIVE of OWNER.

### De details {#details}

Onder de zin somt de kaart de waarden op die de operatie meedraagt:

- het account namens wie de operatie handelt
- voor een bericht of reactie: de permlink (het adres van het bericht), de community of tag, de inhoud en de metagegevens
- voor een aangepaste actie: elke waarde van de gegevens, één per regel, zodat er niets wegvalt
- voor een wijziging van bevoegdheden: de drempel, de sleutels en de accounts die ze instelt

Een wijziging van bevoegdheden zegt ook wanneer die je sleutels zou verwijderen, met “sleutels: GEEN (je sleutel wordt verwijderd)”. Een ontbrekende drempel verschijnt als “drempel NIET INGESTELD (telt als 0)”.

In de samenvatting en de details worden tekens die tekst kunnen verbergen of de leesrichting kunnen omkeren getoond als `�`. Wat je leest kan zich niet voordoen als iets anders.

**Ruwe operatie tonen** (of **Ruwe operaties tonen**) opent precies de operaties die ondertekend worden.

Wordt een bedrag in Hive Power gegeven, dan rekent Hivesigner het om tegen de huidige koers. Hij toont “Huidige koers van HIVE Power laden…” en wacht op die koers voordat je kunt goedkeuren.

Sommige verzoeken dragen een transactie mee die elders is voorbereid, bijvoorbeeld voor een account dat meerdere mensen beheren. Het scherm zegt dan “Dit verzoek levert een eigen transactieheader mee. Verloopt: DATUM.” Hebben anderen die al ondertekend, dan komt erbij “Het bevat al 2 handtekeningen.”

## Welke sleutel nodig is {#which-key}

Onder de kaarten noemt één regel de sleutel die het hele verzoek nodig heeft: “Wordt ondertekend met je posting-sleutel”, “Wordt ondertekend met je active-sleutel” of “Wordt ondertekend met je owner-sleutel”.

Hivesigner ondertekent precies met die sleutel. Een active-sleutel kan geen stem ondertekenen en een owner-sleutel geen overboeking. Dat is een Hive-regel sinds een hard fork in 2025. Zie [Welke sleutel toevoegen](/docs/accounts#which-key).

Alle operaties in één verzoek moeten dezelfde sleutel nodig hebben. Is dat niet zo, dan luidt de regel “Deze transactie vereist meer dan één bevoegdheid en kan niet met één sleutel worden ondertekend.” Er is geen knop om goed te keuren. Ga terug naar de app.

Verzoeken met de owner-sleutel zijn zeldzaam. Ze veranderen wie je account kan beheren of herstellen. Lees ze twee keer. Zie [Lees voordat je goedkeurt](/docs/safety#read-before-approving).

### Wanneer de sleutel ontbreekt {#missing-key}

Heeft het geselecteerde account de sleutel niet op dit apparaat, dan zegt het scherm dat. Bijvoorbeeld: “Hiervoor is je active-sleutel nodig, maar die is hier niet aanwezig voor @GEBRUIKER.”

1. Kies **Nog een account toevoegen** onder de melding. Dat opent het formulier **Account toevoegen**.
2. Voer dezelfde gebruikersnaam en de ontbrekende sleutel in. Heeft het account een toegangscode, voer die dan ook in.
3. Kies **Account toevoegen**. Hivesigner voegt de sleutel toe en brengt je terug naar het verzoek.

Is het account vergrendeld, dan toont het scherm een veld **Toegangscode** boven de knop. Eén klik ontgrendelt het account en keurt goed. Blijkt de sleutel toch te ontbreken, dan zegt het scherm dat na het ontgrendelen.

Heeft deze browser nog geen account, dan luidt de knop **Doorgaan** en opent hij het formulier **Account toevoegen**.

## Goedkeuren of ondertekenen {#approve}

De accountregel boven de knop zegt “Ondertekenen als” met het account dat ondertekent. Met **Van account wisselen** kies je een ander. Zie [Van account wisselen](/docs/accounts#switch-accounts).

- **Goedkeuren** ondertekent de transactie in je browser en stuurt die naar het Hive-netwerk. Het resultaat luidt “Transactie succesvol uitgezonden” met een **Transactie-ID** dat de transactie in een blockverkenner opent.
- **Ondertekenen** verschijnt in plaats daarvan wanneer het verzoek alleen om een handtekening vraagt. Hivesigner ondertekent de transactie zonder die naar het netwerk te sturen. Hij geeft de handtekening aan de app, of toont haar wanneer het verzoek geen site noemt.

Wijst het netwerk de transactie af, dan zie je “Je transactie is niet uitgezonden” met de “Foutmelding” van het netwerk. Je kunt het opnieuw proberen.

## De site waar je naar terugkeert {#return-site}

Noemt het verzoek een site om naar terug te keren, dan zegt een melding bovenaan “Je wordt doorgestuurd naar HOST.” Na je goedkeuring stuurt Hivesigner je daarheen. Controleer dat HOST de site is waar je vandaan kwam.

Noemt het verzoek geen site, dan blijft Hivesigner op het resultaat staan.

## Een verzoek voor een ander account {#another-account}

Een verzoek kan voor een ander account zijn dan het geselecteerde. Hivesigner toont dat op twee manieren.

**Het verzoek moet door een ander account worden ondertekend.** Het scherm zegt “Dit verzoek moet worden ondertekend door @ACCOUNT. Schakel over naar dat account.” De accountregel luidt “Geselecteerd account” en daaronder gaat de accountlijst open. Kies dat account, of voeg het toe met **Nog een account toevoegen**. Met geen enkel ander account ondertekent Hivesigner het verzoek.

**Een operatie handelt namens een ander account.** Dat gebeurt bij accounts die meerdere mensen beheren. Een waarschuwing bovenaan zegt “Dit verzoek handelt niet namens @GEBRUIKER, maar namens @ACCOUNT. Ga alleen door als je dat account beheert.” De details van elke kaart noemen het account namens wie zij handelt.

## Verzoeken die Hivesigner niet kan lezen {#invalid-requests}

Hivesigner ondertekent nooit een verzoek dat hij niet volledig kan lezen en tonen. Daaronder vallen een operatie die hij niet kent, een verzoek zonder operaties, een waarde die niet bij de operatie past (een getal dat geen getal is, een verkeerd opgemaakt bedrag) en extra gegevens die hij niet kan tonen.

Het scherm zegt dan “Oeps, er ging iets mis. De opgegeven gegevens zijn ongeldig.” Ga terug naar de app. Kies **Dit probleem melden** om het Hivesigner-team op de hoogte te stellen.

## Verzoeken om een bericht te ondertekenen {#message-requests}

Sommige apps vragen je een bericht te ondertekenen in plaats van een transactie, bijvoorbeeld om te bewijzen dat een account van jou is. Een bericht is tekst. Het ondertekenen verandert niets op de blockchain.

Het scherm toont:

- Een kop zoals “APP vraagt je een bericht te ondertekenen.” Heeft de app een Hive-account, dan noemt de regel eronder dat: “Hive-account @APP_ACCOUNT”.
- “Stuurt je door naar HOST”: de site die de handtekening krijgt. Diezelfde regel verschijnt nog eens naast de knop.
- **Bericht**: de hele tekst, precies zoals die ondertekend wordt. Tekens die tekst kunnen verbergen of de leesrichting kunnen omkeren verschijnen als gemarkeerde codes, zoals `\u{200B}`.
- De gebruikte sleutel: “Wordt ondertekend met je posting-sleutel” of “Wordt ondertekend met je active-sleutel”. Hivesigner ondertekent een bericht nooit met de owner-sleutel.
- Een waarschuwing: “Je handtekening bewijst aan iedereen die haar ziet dat @GEBRUIKER precies deze tekst heeft ondertekend. Onderteken alleen een bericht dat je begrijpt.”
- De accountregel, “Ondertekenen als”, met **Van account wisselen**.

Kies **Ondertekenen** om te ondertekenen. Hivesigner stuurt je terug naar de site met de handtekening, je gebruikersnaam, het sleuteltype en de publieke sleutel die de handtekening maakte. Een publieke sleutel is de deelbare helft van een sleutelpaar: daarmee kun je niets ondertekenen.

Kies **Annuleren** om naar je pagina **Accounts** te gaan. De site krijgt niets.

Heeft het account de sleutel niet op dit apparaat, dan zegt het scherm dat. Bijvoorbeeld: “Hiervoor is je posting-sleutel nodig, maar die is hier niet aanwezig voor @GEBRUIKER.” Kies **Van account wisselen** en daarna **Nog een account toevoegen**. [Voeg de ontbrekende sleutel toe](/docs/accounts#add-a-key) voor hetzelfde account. Hivesigner brengt je terug naar het verzoek.

### Waarom sommige berichten worden geweigerd {#refused-messages}

**Een bericht dat werkt als een Hivesigner-login.** Sommige tekst heeft precies de vorm van een Hivesigner-login. Die ondertekenen zou de site toegang tot je account geven. Hivesigner ondertekent zulke tekst nooit en zegt “Dit bericht is een Hivesigner-token. Het ondertekenen zou de site toegang tot je account geven, daarom kan het niet worden ondertekend.”

**Een verzoek dat Hivesigner niet kan gebruiken.** Hivesigner weigert een verzoek zonder bericht of zonder terugkeeradres. Hij weigert ook een verzoek om een andere sleutel dan posting of active, een verzoek dat iets als app noemt wat geen Hive-account is, en een verzoek waarvan het terugkeeradres niet veilig is of niet voor de app is geregistreerd. Hij zegt “Dit ondertekeningsverzoek is niet bruikbaar: het heeft een bericht, een posting- of active-sleutel en een veilige doorstuur-URL nodig die voor de app is geregistreerd. Ga terug naar de site en probeer het opnieuw.”

Kan Hivesigner de gegevens van de app niet van het Hive-netwerk lezen, dan zegt hij “Kan de accountgegevens niet laden van het Hive-netwerk.” Tot dat lukt ondertekent hij niets. Kies **Opnieuw proberen**.

## Zelf een bericht ondertekenen {#sign-message}

Je kunt zelf een bericht ondertekenen om te bewijzen dat je een account beheert.

1. Open [hivesigner.com/signmessage](https://hivesigner.com/signmessage). De voettekst linkt daarheen als **Bericht ondertekenen**.
2. Is het geselecteerde account vergrendeld, voer dan de toegangscode in en kies **Ontgrendelen**. Is er geen account geselecteerd, dan linkt de pagina naar je accounts.
3. Typ de tekst in **Bericht**. Hivesigner haalt spaties en regeleindes aan het begin en het einde weg.
4. Kies de sleutel bij **Sleutel om mee te ondertekenen**. Daar staan de sleutels van het geselecteerde account op dit apparaat, de sterkste eerst. De sterkste is om te beginnen gekozen. Zet hem op **Posting**, tenzij je een andere nodig hebt.
5. Kies **Bericht ondertekenen**.

Het **Overzicht van de handtekening** toont **Auteur**, **Gebruikte bevoegdheid**, een **Verificatietoken** en een **Verificatielink**. Het verificatietoken bundelt het bericht, je gebruikersnaam en de handtekening in één stuk tekst. Deel de link of het token met degene die het bericht moet controleren.

Een handtekening onthult je sleutel niet. Ze toont wel welke sleutel haar heeft gemaakt.

## Een bericht verifiëren {#verify-message}

1. Open [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage). De voettekst linkt daarheen als **Bericht verifiëren**.
2. Plak het token in **Verificatietoken** en kies **Handtekening verifiëren**.

Een verificatielink opent deze pagina en controleert het bericht vanzelf.

Het resultaat luidt “De handtekening is geldig voor GEBRUIKER” of “De handtekening kon niet worden geverifieerd met de sleutels van het account.” Daaronder zie je **Auteur**, **Herleide publieke sleutel**, **Overeenkomende bevoegdheid** (het sleuteltype dat ondertekende) en **Bericht**.

Hivesigner controleert de handtekening tegen de sleutels die het account nu op het Hive-netwerk heeft. Een bericht dat is ondertekend met een sleutel die het account sindsdien heeft vervangen, wordt niet meer geverifieerd.
