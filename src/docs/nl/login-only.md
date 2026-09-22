Sommige apps hoeven alleen te weten wie iemand op Hive is. Ze posten, stemmen of zenden nooit iets voor hem uit. Hivesigner kan mensen bij zo'n app laten inloggen zonder enige posting-bevoegdheid. De persoon bewijst dat hij een Hive-account beheert. Jouw app leert de naam ervan. Deze pagina laat de twee manieren zien en hoe je het resultaat veilig controleert.

## Twee manieren {#two-ways}

- **Met een app-account:** jouw app heeft een eigen Hive-account en vraagt `scope=login`. Het token noemt jouw app.
- **Zonder app-account:** een site zonder eigen Hive-account stuurt alleen een `redirect_uri`. Het token noemt geen app. Jouw site controleert het zelf.

Geen van beide vraagt om toestemming van de persoon of van het account van jouw app, dus er verandert niets aan het account van de persoon. Hivesigner ondertekent de inlog met de posting-sleutel, of met de active-sleutel als het apparaat geen posting-sleutel voor dat account heeft.

## Met een app-account {#app-account}

1. [Registreer je app](/docs/register-app): maak het Hive-account ervan aan en zet je callbacks erin. Je hebt geen clientgeheim en geen toestemming voor @hivesigner nodig.
2. Stuur de persoon naar:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. De persoon ziet «Inloggen bij APP» met de **Reikwijdte** «De gebruikersnaam van je account bekijken». Hij kiest **Inloggen**.
4. Hivesigner stuurt door naar jouw callback:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [Vergelijk `state`](/docs/oauth2#state) en controleer daarna het token. Het is een `login`-token dat jouw app noemt, dus beide wegen werken:
   - roep er [`GET /api/me`](/docs/api#me) mee aan, wat antwoordt met het account in `user` en `scope` `["login"]`, decodeer daarna het token en controleer `type` en `app` ([De API vragen](/docs/tokens#check-with-the-api));
   - of [controleer het zelf](/docs/tokens#check-it-yourself) met `type: 'login'` en de naam van jouw app.

Met een `login`-token kun je niets uitzenden: `/api/broadcast` weigert elke operatie die ermee wordt verstuurd.

## Zonder app-account {#no-app-account}

1. Stuur de persoon naar de autorisatie-URL met een `redirect_uri` en zonder `client_id`:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   De callback moet `https://` zijn, of `http://` op loopback (`localhost`, `127.0.0.1`, `[::1]`). Er is geen lijst om hem in te registreren. Hivesigner negeert hier `scope` en `response_type`: het antwoord is altijd een inlogtoken.

2. De persoon ziet «HOST wil je Hive-gebruikersnaam bevestigen.», waarbij HOST de host van jouw callback is. Hij kiest **Inloggen**.
3. Hivesigner stuurt door naar jouw callback:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [Vergelijk `state`](/docs/oauth2#state) en controleer het token daarna zelf. De API neemt geen token aan dat geen app noemt, dus jouw server toetst de handtekening aan de sleutels van het account. Zie [Zelf controleren](/docs/tokens#check-it-yourself), met `type: 'login'` en zonder `app`.

Als de callback geen webadres is, of gewoon `http://` buiten loopback, weigert Hivesigner het verzoek en legt de persoon uit waarom.

## Welke je gebruikt {#which-one}

| | Met een app-account | Zonder app-account |
| --- | --- | --- |
| Wat de persoon ziet | De naam, afbeelding en het Hive-account van jouw app | Alleen de host van jouw site |
| Voorbereiding | Een Hive-account met jouw callbacks erin | Geen |
| Het token noemt | Jouw app | Geen app |
| Controleer het token met | `/api/me` of eigen code | Eigen code |
| Later posting-toegang | Met hetzelfde account: vraag `posting` en [geef @hivesigner toestemming](/docs/register-app#grant-hivesigner) | Vraagt eerst een app-account |

Gebruik een app-account als het kan. Gebruikers zien de naam en afbeelding van jouw app. Jouw server kan tokens weigeren die voor een andere app zijn gemaakt. Later kun je met hetzelfde account naar posting-toegang overstappen.

Gebruik de tweede weg als jouw site geen Hive-account heeft en er ook geen wil.

## De inlog veilig controleren {#check-safely}

- **Bind het verzoek met `state`.** Maak per inlog een willekeurige waarde, bewaar die in de sessie van de persoon, vergelijk haar bij jouw callback en gebruik haar één keer. Zie [Het verzoek beschermen met state](/docs/oauth2#state).
- **Controleer het soort.** Neem alleen `signed_message.type` gelijk aan `login` aan. Een code of een verversingstoken is geen inlog.
- **Controleer de app.** Met een app-account moet `signed_message.app` jouw app zijn. Zonder app-account mag er helemaal geen `app` zijn.
- **Controleer de leeftijd.** Je controleert het token meteen na de doorverwijzing, neem het dus alleen aan binnen een paar minuten na zijn `timestamp` (bijvoorbeeld 5 minuten, met een minuut klokverschil).
- **Gebruik elk token één keer.** Start na een geslaagde controle je eigen sessie (bijvoorbeeld een httpOnly-cookie) en gooi het Hivesigner-token weg. Houd bij welke tokens je hebt aangenomen totdat ze te oud zijn om de leeftijdscontrole te halen. Weiger elk token dat je opnieuw ziet.
- **Houd het token uit je logboeken.** Het komt binnen in de querystring van jouw callback. Zie [Tokens veilig bewaren](/docs/tokens#keep-tokens-safe).

## Voorbeelden {#examples}

Sites als https://hivesearcher.com en https://openhive.chat laten mensen met hun Hive-account inloggen voor functies die buiten de blockchain blijven, zoals zoeken en chatten. Zij hoeven alleen te weten wie de persoon is, meer niet.
