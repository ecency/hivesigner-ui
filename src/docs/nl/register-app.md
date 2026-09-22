Een app die mensen met Hivesigner laat inloggen is een Hive-account. De naam ervan is de `client_id` die je verstuurt. In het profiel staan de instellingen die Hivesigner leest: de callbacks waarheen tokens mogen gaan en, voor de codestroom, een clientgeheim. Om via de API uit te zenden geeft het app-account ook posting-bevoegdheid aan @hivesigner. Deze pagina loopt elke stap langs.

## Wat je nodig hebt {#what-you-need}

| Je wilt | App-account en callbacks | Clientgeheim | Toestemming voor @hivesigner |
| --- | --- | --- | --- |
| Mensen laten inloggen en uitzenden met de tokenstroom | Ja | Nee | Ja |
| Mensen laten inloggen en uitzenden met de codestroom (verversingstokens) | Ja | Ja | Ja |
| Alleen laten inloggen, met een token dat jouw app noemt | Ja | Nee | Nee |
| Alleen laten inloggen, vanaf een site zonder Hive-account | Nee | Nee | Nee |
| Ondertekeningslinks versturen | Nee | Nee | Nee |

Voor de laatste twee regels, zie [Inloggen zonder posting-toegang](/docs/login-only) en [Ondertekeningslinks](/docs/sign-links).

## Het app-account maken {#app-account}

1. Maak een Hive-account voor jouw app, bijvoorbeeld op https://ecency.com/signup. Gebruik een apart account voor de app, niet je persoonlijke. De naam ervan is jouw `client_id`. Gebruikers zien die op het toestemmingsscherm naast «Hive-account». Een Hive-account kan niet worden hernoemd, dus kies de naam met zorg.
2. Voeg het account toe aan Hivesigner op https://hivesigner.com/import (**Account toevoegen**). Gebruik de active-sleutel of het hoofdwachtwoord: de toestemming verderop vraagt de active-sleutel.

## De app-instellingen invullen {#app-settings}

Open https://hivesigner.com/profile met het app-account geselecteerd en stel in:

- **Dit account is een app.** Zet dit aan. Het merkt het account als app, en dat controleert de API voordat ze een code of verversingstoken ervoor aanneemt.
- **Doorstuur-URI's.** Jouw callbacks, één per regel. Zie [Callbacks](#callbacks).
- **Maker.** Wie de app onderhoudt. De appgids op https://hivesigner.com/apps toont dit.
- **Status.** Productie of zandbak, voor je eigen administratie. Hivesigner behandelt beide hetzelfde.
- **Clientgeheim.** Alleen nodig voor de [codestroom](/docs/oauth2#code-flow). Zie [Clientgeheim](#client-secret).

Vul ook **Naam** en **URL van profielfoto** in. Het toestemmingsscherm toont de afbeelding en naam van jouw app. De appgids op https://hivesigner.com/apps toont de naam, **Over** en **Website**.

Opslaan werkt het profiel van het account op de blockchain bij en vraagt de posting-sleutel ervan. Hivesigner leest jouw callbacks uit het account zodra een inlogverzoek opengaat, dus een wijziging geldt zodra de transactie in een blok staat.

> **Let op:** De naam, afbeelding en omschrijving publiceert het account van jouw app zelf. Daarom toont het toestemmingsscherm ook de echte accountnaam (`@myapp`) en de host waar de persoon naartoe gaat: die worden door de toestemming en de doorverwijzing echt gebruikt.

## Callbacks {#callbacks}

Een callback (de `redirect_uri` in een inlogverzoek) is de plek waar Hivesigner de persoon met een token of een code naartoe terugstuurt. Hivesigner stuurt alleen naar een callback die in het account van jouw app staat.

### De regels {#callback-rules}

- **Precies gelijk.** De `redirect_uri` in het verzoek moet een van jouw doorstuur-URI's zijn, teken voor teken: schema, host, poort, pad en query.
- **Alleen https.** Een callback moet `https://` gebruiken. Gewoon `http://` wordt alleen op loopback aangenomen: `localhost`, `127.0.0.1` of `[::1]`.
- **Loopback-poorten mogen wisselen.** Een met gewoon http geregistreerde loopback-callback past bij elke loopback-host en -poort met hetzelfde pad, dezelfde query, hetzelfde fragment en dezelfde gebruikersinformatie. Een met `https://` geregistreerde loopback-callback blijft precies gelijk.
- **Geen eigen schema's.** Een callback als `myapp://callback` wordt geweigerd. Zie [Mobiele en desktop-apps](#native-apps).
- **Geen fragmenten.** Zet geen `#fragment` achter een callback.

De profielpagina weigert een callback op te slaan die nooit kan werken, met «Geen bruikbaar callback-adres (https, of http op localhost)».

### Voorbeelden {#callback-examples}

Met deze doorstuur-URI's geregistreerd:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| `redirect_uri` in het verzoek | Resultaat |
| --- | --- |
| `https://myapp.example/auth/callback` | Aangenomen: precies gelijk |
| `https://myapp.example/auth/callback/` | Geweigerd: extra `/` |
| `https://myapp.example/auth/callback?next=home` | Geweigerd: de query verschilt |
| `https://www.myapp.example/auth/callback` | Geweigerd: een andere host |
| `http://myapp.example/auth/callback` | Geweigerd: gewoon http buiten loopback |
| `http://localhost:3000/auth` | Aangenomen: precies gelijk |
| `http://127.0.0.1:51234/auth` | Aangenomen: loopback, zelfde pad, andere poort |
| `http://[::1]:3000/auth` | Aangenomen: loopback, zelfde pad |
| `http://127.0.0.1:3000/other` | Geweigerd: een ander pad |
| `https://localhost:3000/auth` | Geweigerd: https past niet bij een registratie met gewoon http |
| `myapp://auth` | Geweigerd: eigen schema |

Wil je een query op jouw callback aannemen, registreer de callback dan met precies die query. Hivesigner houdt de eigen query van jouw callback en zet zijn parameters erachter.

### Mobiele en desktop-apps {#native-apps}

Hivesigner zet het token in de callback-URL. Een eigen schema als `myapp://` hoort niet bij één app: een andere app op hetzelfde apparaat kan het opeisen en het token ontvangen. Daarom weigert Hivesigner eigen schema's en stuurt het tokens alleen naar een https-adres of naar loopback op het apparaat van de persoon zelf.

Een native app gebruikt in plaats daarvan een van deze wegen:

- **Een https-link die van hem is.** Registreer een callback op jouw domein die het besturingssysteem in jouw app opent (App Links op Android of Universal Links op iOS).
- **Een loopback-callback.** De app luistert op `127.0.0.1` naar de doorverwijzing. Registreer `http://127.0.0.1/auth` (of `localhost`) en gebruik tijdens het draaien een vrije poort: de poort hoeft niet gelijk te zijn.

## Clientgeheim {#client-secret}

Het clientgeheim bewijst dat een code-uitwisseling van jouw server komt. Voor de [codestroom](/docs/oauth2#code-flow) is het verplicht: jouw server stuurt het met elke code of elk verversingstoken naar `/api/oauth2/token`. De tokenstroom gebruikt het niet.

- **Maak een lange willekeurige waarde**, bijvoorbeeld met `openssl rand -hex 32`.
- **Stel hem in op de profielpagina.** Hivesigner bewaart alleen de sha256-hash ervan, in het profiel van het account van jouw app. Laat je het veld leeg, dan blijft het huidige geheim staan.
- **Houd hem op jouw server.** Zet hem nooit in een webpagina, een mobiele app of een URL.
- **Om hem te wijzigen,** stel je een nieuwe in en werk je jouw server op hetzelfde moment bij.

## @hivesigner posting-bevoegdheid geven {#grant-hivesigner}

De API zendt uit met de posting-sleutel van het account @hivesigner. Hive neemt die handtekening voor jouw gebruikers alleen aan wanneer het account van jouw app @hivesigner aan zijn eigen posting-bevoegdheid heeft toegevoegd. Zie [De keten van posting-bevoegdheid](/docs/how-it-works#authority-chain).

1. Kies het account van jouw app in Hivesigner.
2. Open https://hivesigner.com/authorize/hivesigner.
3. Op de pagina staat «@hivesigner autoriseren» en «@hivesigner kan dan posten, reageren, stemmen en volgen als @myapp.». Kies **Autoriseren**. Hiervoor is de active-sleutel van het app-account nodig.

Dit doe je één keer. Zonder dit mislukt elke uitzending met `unauthorized_client` en «Broadcaster account doesn't have permission to broadcast for @myapp». Een app die alleen laat inloggen heeft het niet nodig.

Deze toestemming laat @hivesigner ook als het account van jouw app zelf posten, nog een reden om het app-account alleen voor de app te houden.

Apps die met deze toestemming via Hivesigner uitzenden kunnen in de appgids op https://hivesigner.com/apps verschijnen, gerangschikt naar hoeveel mensen ze gebruiken.

## Wat gebruikers zien als er iets niet klopt {#refused-requests}

Hivesigner weigert een verzoek dat het niet veilig kan beantwoorden. Het toont een bericht en een knop **Dit probleem melden**. Het verzoek kan niet worden goedgekeurd. Er gaat niets naar jouw callback.

| Probleem | Wat de persoon leest |
| --- | --- |
| De `redirect_uri` is geen van jouw doorstuur-URI's | «De doorstuur-URL van deze app is niet geregistreerd. Voor je veiligheid is inloggen geblokkeerd.» |
| De `client_id` is geen Hive-account | «@myapp is geen Hive-account, dus er is geen app om te autoriseren. Ga terug naar de site en probeer het opnieuw.» |
| Het account is niet als app gemerkt | «@myapp is niet als app ingesteld en kan je dus niet aanmelden. Ga terug naar de site en probeer het opnieuw.» Zet **Dit account is een app** aan, zoals hierboven. |
| Geen `redirect_uri` in het verzoek | «Dit autorisatieverzoek is onvolledig: er ontbreekt een app of een doorstuur-URL. Ga terug naar de app en probeer het opnieuw.» |

Melden jouw gebruikers een van deze gevallen, vergelijk dan de `redirect_uri` die jouw app stuurt teken voor teken met jouw doorstuur-URI's.

## Controlelijst {#checklist}

1. Een Hive-account voor de app, met zijn active-sleutel toegevoegd aan Hivesigner.
2. Op https://hivesigner.com/profile: «Dit account is een app» aan, de doorstuur-URI's erin, een clientgeheim ingesteld als je de codestroom gebruikt.
3. @hivesigner geautoriseerd op https://hivesigner.com/authorize/hivesigner, als je via de API uitzendt.
4. Een inloglink die precies een van jouw doorstuur-URI's verstuurt. Zie [Inloggen met OAuth2](/docs/oauth2).
