Hivesigner ondertekent met de sleutels van de Hive-accounts die je eraan toevoegt. Je voegt een account één keer toe in elke browser die je gebruikt. Hivesigner bewaart de sleutels daarna in die browser, versleuteld met een toegangscode als je er een instelt.

## Een account toevoegen {#add-account}

1. Controleer dat de adresbalk van je browser `https://hivesigner.com` toont. Zie [Controleer eerst het adres](/docs/safety#check-the-address).
2. Open [hivesigner.com/import](https://hivesigner.com/import). Heeft deze browser nog geen account, dan opent **Hivesigner instellen** op de startpagina hetzelfde formulier.
3. Vul bij **Gebruikersnaam** je Hive-gebruikersnaam in kleine letters in, zonder de `@`.
4. Plak bij **Privésleutel** een van je privésleutels. Lees eerst [Welke sleutel toevoegen](/docs/accounts#which-key).
5. Laat **Beveiligen met een toegangscode (aanbevolen)** aangevinkt en kies een **Toegangscode**. Die heeft minstens 4 tekens nodig. Zie [Beveilig het met een toegangscode](/docs/accounts#passcode).
6. Kies **Account toevoegen**.

Hivesigner controleert de sleutel bij je account op het Hive-netwerk voordat er iets wordt opgeslagen. Hij vergelijkt het publieke deel van de sleutel met de sleutels die je account vermeldt. De privésleutel zelf gaat nergens heen. Is de gebruikersnaam geen Hive-account, of hoort de sleutel er niet bij, dan zegt het formulier “Ongeldige gebruikersnaam of sleutel. Gebruik je hoofdwachtwoord of je owner-, active-, posting- of memo-sleutel.”

Het account dat je toevoegt wordt het geselecteerde account: het account dat Hivesigner op zijn schermen gebruikt. Kwam je via een verzoek bij het formulier, dan brengt Hivesigner je terug naar dat verzoek. Anders opent hij de pagina **Accounts**.

### Nog een sleutel aan een account toevoegen {#add-a-key}

Wil je een tweede sleutel toevoegen aan een account dat hier al staat (bijvoorbeeld de active-sleutel naast de posting-sleutel), voeg het account dan opnieuw toe met de nieuwe sleutel. Hivesigner houdt de sleutels die hij al heeft en voegt de nieuwe toe. Een nieuwe sleutel voor een rol die er al is vervangt de oude.

Heeft het account een toegangscode, laat **Beveiligen met een toegangscode (aanbevolen)** dan aangevinkt en voer dezelfde code in. Alles daarbuiten weigert Hivesigner:

- Zonder toegangscode zegt het formulier “Dit account is beveiligd op dit apparaat. Voer de toegangscode ervan in om de sleutel toe te voegen.”
- Met een andere code zegt het “Onjuiste toegangscode. De sleutel is niet opgeslagen.”

## Welke sleutel toevoegen {#which-key}

Een Hive-account heeft meerdere privésleutels. Elke sleutel staat andere acties toe. Je kreeg ze van de portemonnee of app waarmee je je Hive-account aanmaakte, meestal op de sleutel- of wachtwoordpagina daarvan. Hivesigner kan ze je niet tonen.

| Sleutel | Waar Hivesigner hem voor gebruikt |
| --- | --- |
| Posting | Inloggen bij apps, stemmen, posten en reageren, volgen, je profiel bewerken en je beloningen opeisen. |
| Active | Portemonnee-acties zoals overboekingen, power-up of power-down, delegaties, spaartegoed en conversies. Stemmen op witnesses en voorstellen. Een app voor het eerst autoriseren en een app intrekken. |
| Owner | Je owner-sleutel of je herstelaccount wijzigen. In het dagelijks gebruik heb je hem nooit nodig. |
| Memo | Niets. Het formulier accepteert hem, maar een account met alleen de memo-sleutel kan niet inloggen: het verzoekscherm toont dan “Voeg een posting- of active-sleutel toe voor @GEBRUIKER om door te gaan”. |

Voeg de posting-sleutel toe voor dagelijks gebruik. Voeg de active-sleutel alleen toe wanneer je hem nodig hebt voor een portemonnee-actie of om een app voor het eerst te autoriseren. Heeft een scherm een sleutel nodig die dit apparaat niet heeft, dan zegt het dat en laat het je die toevoegen.

Je hoofdwachtwoord werkt ook in het veld **Privésleutel**. Hivesigner leidt je sleutels eruit af en bewaart elke sleutel die nog bij je account past, ook de owner-sleutel. Door de sleutels los toe te voegen blijft de owner-sleutel van dit apparaat af.

> **Let op:** Hivesigner ondertekent elke transactie precies met de sleutel die ervoor nodig is. Dat volgt een Hive-regel die geldt sinds een hard fork in 2025. Een active-sleutel kan geen posting-actie zoals een stem meer ondertekenen. Een owner-sleutel kan geen portemonnee-actie meer ondertekenen. Voeg de posting-sleutel toe, ook als de active-sleutel er al staat.

Inloggen bij een app is iets anders: dat is geen transactie. Hivesigner logt je in met de posting-sleutel, of met de active-sleutel als dit apparaat geen posting-sleutel voor het account heeft.

## Beveilig het met een toegangscode {#passcode}

De toegangscode is een wachtwoord dat je alleen voor deze browser kiest. Het is niet je Hive-wachtwoord en het is geen van je sleutels. Hivesigner versleutelt er de sleutels van het account mee voordat hij ze opslaat, en vraagt hem opnieuw om ze te openen.

- Hivesigner bewaart je toegangscode niet en stuurt hem nergens heen. Niemand kan hem voor je herstellen.
- Elk account op dit apparaat heeft zijn eigen toegangscode. Je mag voor alle accounts dezelfde gebruiken.
- Een langere code is moeilijker te raden. Gebruik je Hive-hoofdwachtwoord of een van je sleutels niet als toegangscode.

Zonder toegangscode bewaart Hivesigner de sleutels van het account onversleuteld in deze browser. Hij opent ze bij elke start vanzelf, dus iedereen die deze browser gebruikt kan ermee ondertekenen. De pagina **Accounts** markeert zo’n account met **Geen toegangscode**.

Wil je een toegangscode instellen voor een account dat er geen heeft, voeg het account dan opnieuw toe met een van zijn sleutels en een toegangscode. Hivesigner versleutelt dan alle sleutels van het account met die code.

Wil je een toegangscode wijzigen, [verwijder dan het account](/docs/accounts#remove-account) en voeg het opnieuw toe met de nieuwe code. Verwijderen wist elke sleutel van het account uit deze browser, dus voeg elke sleutel opnieuw toe (de posting-sleutel en daarna de active-sleutel, als je die gebruikt).

## Een account ontgrendelen {#unlock}

Een account met een toegangscode start vergrendeld telkens als Hivesigner opent: in een nieuw tabblad, na een herlaadactie of wanneer een app je hierheen stuurt. Je hoeft het niet vooraf te ontgrendelen. Een scherm dat de sleutels nodig heeft toont boven zijn eigen knop een veld **Toegangscode** (bijvoorbeeld **Inloggen**, **Goedkeuren** of **Ontgrendelen**). Eén klik ontgrendelt het account en gaat verder.

Een verkeerde code toont “Onjuiste toegangscode.” en er wordt niets ondertekend.

Hivesigner houdt ontgrendelde sleutels alleen in het geheugen, nooit in de opslag. Het account blijft in dat tabblad ontgrendeld totdat je het sluit of herlaadt.

## Van account wisselen {#switch-accounts}

De pagina **Accounts** toont de accounts op dit apparaat van A tot Z. Het geselecteerde account heeft een vinkje. Vanaf 6 accounts filtert een veld **Accounts zoeken** de lijst.

Kies een account om het het geselecteerde account te maken. Hivesigner vraagt hier niet om de toegangscode. Dat doet het scherm dat de sleutels nodig heeft.

Op een verzoekscherm heeft de regel die het account noemt (“Inloggen als”, “Autoriseren als” of “Ondertekenen als”) een link **Van account wisselen**. Die opent dezelfde lijst ter plekke, zodat je een ander account kunt kiezen zonder het verzoek te verlaten. **Nog een account toevoegen** onder de lijst opent het formulier **Account toevoegen** en brengt je daarna terug naar het verzoek.

## Een account verwijderen {#remove-account}

1. Open de pagina **Accounts**.
2. Kies de **✕** naast het account. Het label ervan voor schermlezers is **Verwijderen uit Hivesigner @GEBRUIKER**.
3. Bevestig wanneer de browser vraagt “@GEBRUIKER van dit apparaat verwijderen? De sleutels van dit account op dit apparaat worden gewist.”

Een account verwijderen wist de sleutels alleen uit deze browser. Je Hive-account verandert niet. Apps die je hebt geautoriseerd houden hun toegang, want die toegang staat op de Hive-blockchain. Zie [De toegang van een app bekijken en intrekken](/docs/signing-in#remove-access) om die in te trekken.

Verwijder je het geselecteerde account, dan wordt een ander account op dit apparaat het geselecteerde.

Laat de browser Hivesigner de wijziging niet opslaan, dan zie je “Alleen voor deze sessie verwijderd: de opslag is niet beschikbaar, dus dit account komt terug als je de pagina herlaadt.”

## Als je je toegangscode vergeet {#forgotten-passcode}

Niemand kan een toegangscode herstellen, Hivesigner ook niet. Je Hive-account blijft ongemoeid: de code beschermt alleen de kopie van je sleutels in deze browser.

1. [Verwijder het account](/docs/accounts#remove-account) van dit apparaat.
2. [Voeg het opnieuw toe](/docs/accounts#add-account) met zijn sleutel en een nieuwe toegangscode.

Op de Hive-blockchain verandert er niets. Apps die je hebt geautoriseerd houden hun toegang.

## Waar je sleutels worden bewaard {#where-keys-are-stored}

Hivesigner bewaart je sleutels alleen in deze browser, op dit apparaat, in de opslag die de browser voor hivesigner.com aanhoudt.

- Ze worden niet gesynchroniseerd. Een andere browser, een ander browserprofiel of een ander apparaat heeft ze niet. Voeg het account daar ook toe.
- De sitegegevens of browsegegevens voor hivesigner.com wissen verwijdert ze. Een privévenster sluiten ook.
- Hivesigner is geen back-up. Bewaar je sleutels of je hoofdwachtwoord ergens anders veilig.
