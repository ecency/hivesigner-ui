Met Hivesigner kunnen mensen hun Hive-account in jouw app gebruiken zonder jouw app hun sleutels te geven. Hivesigner bestaat uit twee delen: een ondertekenaar in de browser op https://hivesigner.com en een API op `https://hivesigner.com/api/`. Deze pagina legt uit wat elk deel doet en op welke twee manieren een app ze gebruikt.

## De ondertekenaar in de browser {#browser-signer}

De ondertekenaar in de browser is de website van Hivesigner. Mensen voegen daar hun Hive-accounts toe. Hun sleutels blijven in hun eigen browser: Hivesigner stuurt geen sleutel naar welke server dan ook. Jouw app ziet er nooit een.

De ondertekenaar ondertekent drie soorten dingen, telkens nadat de persoon heeft gezien wat hij ondertekent:

- **Inlogtokens.** Jouw app stuurt iemand naar Hivesigner om in te loggen. Hivesigner toont de naam van jouw app en wat die vraagt. Als de persoon goedkeurt, ondertekent Hivesigner met zijn sleutel een korte verklaring waarin zijn account en jouw app staan. Die ondertekende verklaring is het token dat jouw app ontvangt. Zie [Inloggen met OAuth2](/docs/oauth2) en [Tokens](/docs/tokens).
- **Transacties.** Een ondertekeningslink opent een transactie ter controle. Als de persoon goedkeurt, ondertekent Hivesigner die met de sleutel die nodig is. Daarna stuurt Hivesigner haar vanuit de browser naar het Hive-netwerk, tenzij de link alleen om de handtekening vraagt. Zie [Ondertekeningslinks](/docs/sign-links).
- **Berichten.** Jouw app kan iemand vragen een tekst met zijn sleutel te ondertekenen, om te bewijzen dat hij het account beheert. Zie [Berichten ondertekenen](/docs/message-signing).

## De API {#api}

De API zendt posting-operaties uit voor iemand die bij jouw app is ingelogd: berichten en reacties, stemmen, volgacties en andere `custom_json`-operaties, beloningen opnemen en profielwijzigingen. Jouw app stuurt de operaties samen met het token van die persoon. De API controleert het token, ondertekent de transactie met de posting-sleutel van het account @hivesigner en zendt haar uit naar Hive.

De API geeft ook het account van de ingelogde persoon terug, wisselt codes om voor tokens en somt de apps op die Hivesigner gebruiken. Zie [REST-API](/docs/api).

## De keten van posting-bevoegdheid {#authority-chain}

Op Hive kan een account een ander account laten handelen met zijn posting-bevoegdheid. De API steunt op twee van zulke toestemmingen:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **De persoon voegt het account van jouw app toe aan zijn posting-bevoegdheid.** Het toestemmingsscherm doet dit de eerste keer dat iemand posting-toegang voor jouw app goedkeurt. Daarvoor is eenmalig zijn active-sleutel nodig.
2. **Het account van jouw app voegt @hivesigner toe aan zijn posting-bevoegdheid.** Dit doe je één keer, wanneer je [je app registreert](/docs/register-app#grant-hivesigner).

Voor het uitzenden controleert de API of beide toestemmingen er zijn. Ze zendt alleen operaties uit waarvan de auteur de persoon is die het token noemt.

De persoon kan de toegang van jouw app op elk moment weghalen op https://hivesigner.com/authorized-apps. Daarna kan de API niet meer via jouw app voor hem posten.

## Twee manieren om te integreren {#two-ways-to-integrate}

### Inloggen, dan uitzenden via de API {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

De persoon keurt één keer goed. Daarna kan jouw app voor hem stemmen, reageren en posten zonder het opnieuw te vragen, totdat het token verloopt of de persoon de toegang weghaalt. Gebruik dit voor de sociale handelingen van alledag.

Je hebt een app-account met geregistreerde callbacks nodig en de toestemming voor @hivesigner. Zie [Je app registreren](/docs/register-app). Wil je alleen weten wie de persoon is, zie dan [Inloggen zonder posting-toegang](/docs/login-only).

### Ondertekeningslinks {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

De persoon ziet elke transactie voordat die wordt ondertekend. Ondertekeningslinks dekken 41 Hive-operaties, waaronder overboekingen en andere portemonnee-handelingen waarvoor de active-sleutel nodig is. De API behandelt die nooit. Voor ondertekeningslinks heb je geen app-account nodig. Zie [Ondertekeningslinks](/docs/sign-links).

### Wat je moet kiezen {#which-to-choose}

- **Vaak voorkomende posting-handelingen** (stemmen, reacties, volgen): laat de persoon inloggen met OAuth2 en gebruik daarna de API.
- **Portemonnee-handelingen**, of alles waarvoor de active-sleutel nodig is: gebruik ondertekeningslinks.
- **Allebei**: veel apps laten mensen met OAuth2 inloggen voor de sociale functies en gebruiken ondertekeningslinks voor overboekingen.
- **Alleen de identiteit van de persoon**: zie [Inloggen zonder posting-toegang](/docs/login-only).

## Broncode {#source-code}

Hivesigner is opensource:

- De ondertekenaar in de browser: https://github.com/ecency/hivesigner-ui
- De API: https://github.com/ecency/hivesigner-api
- De JavaScript-SDK (npm-pakket `hivesigner`): https://github.com/ecency/hivesigner-sdk. Zie [SDK's](/docs/sdk).
