Hivesigner omogućava ljudima da svoj Hive nalog koriste u vašoj aplikaciji, a da joj ne daju svoje ključeve. Ima dva dela: potpisnika u pregledaču na adresi https://hivesigner.com i API na adresi `https://hivesigner.com/api/`. Ova stranica objašnjava šta radi svaki deo i na koja dva načina ih aplikacija koristi.

## Potpisnik u pregledaču {#browser-signer}

Potpisnik u pregledaču je sam sajt Hivesigner. Ljudi tamo dodaju svoje Hive naloge. Njihovi ključevi ostaju u njihovom pregledaču: Hivesigner ne šalje nijedan ključ nijednom serveru. Vaša aplikacija ga nikada ne vidi.

Potpisnik potpisuje tri vrste stvari, svaki put tek pošto je osoba videla šta potpisuje:

- **Tokene za prijavu.** Vaša aplikacija šalje nekoga na Hivesigner da se prijavi. Hivesigner prikazuje ime vaše aplikacije i ono što ona traži. Kada osoba odobri, Hivesigner njenim ključem potpisuje kratku izjavu u kojoj su navedeni njen nalog i vaša aplikacija. Ta potpisana izjava je token koji vaša aplikacija dobija. Pogledajte [Prijava preko OAuth2](/docs/oauth2) i [Tokeni](/docs/tokens).
- **Transakcije.** Veza za potpis otvara transakciju na pregled. Kada osoba odobri, Hivesigner je potpisuje ključem koji joj je potreban. Zatim je iz pregledača šalje u Hive mrežu, osim ako veza traži samo potpis. Pogledajte [Veze za potpis](/docs/sign-links).
- **Poruke.** Vaša aplikacija može da zatraži od osobe da svojim ključem potpiše tekst, kako bi dokazala da upravlja nalogom. Pogledajte [Potpisivanje poruka](/docs/message-signing).

## API {#api}

API emituje operacije objavljivanja u ime osobe koja se prijavila u vašu aplikaciju: objave i komentare, glasove, praćenja i druge `custom_json` operacije, preuzimanje nagrada i izmene profila. Vaša aplikacija šalje operacije zajedno sa tokenom te osobe. API proverava token, potpisuje transakciju ključem za objavljivanje naloga @hivesigner i emituje je u Hive mrežu.

API takođe vraća nalog prijavljene osobe, menja kodove za tokene i nabraja aplikacije koje koriste Hivesigner. Pogledajte [REST API](/docs/api).

## Lanac ovlašćenja za objavljivanje {#authority-chain}

Na Hive-u jedan nalog može drugom nalogu dozvoliti da radi sa njegovim ovlašćenjem za objavljivanje. API se oslanja na dva takva odobrenja:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **Osoba dodaje nalog vaše aplikacije u svoje ovlašćenje za objavljivanje.** Ekran saglasnosti to radi prvi put kada neko odobri pristup objavljivanju za vašu aplikaciju. Za to je jednom potreban aktivni ključ te osobe.
2. **Nalog vaše aplikacije dodaje @hivesigner u svoje ovlašćenje za objavljivanje.** To radite jednom, kada [registrujete aplikaciju](/docs/register-app#grant-hivesigner).

Pre emitovanja API proverava da li su oba odobrenja na mestu. Emituje samo operacije čiji je autor osoba navedena u tokenu.

Osoba u svakom trenutku može da ukloni pristup vaše aplikacije na adresi https://hivesigner.com/authorized-apps. Posle toga API više ne može da objavljuje u njeno ime preko vaše aplikacije.

## Dva načina povezivanja {#two-ways-to-integrate}

### Prijava, pa emitovanje preko API-ja {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

Osoba odobrava jednom. Posle toga vaša aplikacija može da glasa, komentariše i objavljuje u njeno ime bez novog pitanja, dok token ne istekne ili dok osoba ne ukloni pristup. Koristite ovaj put za svakodnevne društvene radnje.

Potrebni su vam nalog aplikacije sa registrovanim povratnim adresama i odobrenje za @hivesigner. Pogledajte [Registrujte aplikaciju](/docs/register-app). Ako samo želite da znate ko je osoba, pogledajte [Prijava bez pristupa objavljivanju](/docs/login-only).

### Veze za potpis {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

Osoba vidi svaku transakciju pre nego što bude potpisana. Veze za potpis pokrivaju 41 operaciju na Hive-u, uključujući prenose i druge radnje sa novčanikom za koje treba aktivni ključ. API ih nikada ne obrađuje. Za veze za potpis vam ne treba nalog aplikacije. Pogledajte [Veze za potpis](/docs/sign-links).

### Šta izabrati {#which-to-choose}

- **Česte radnje objavljivanja** (glasovi, komentari, praćenja): prijavite osobu preko OAuth2, pa koristite API.
- **Radnje sa novčanikom** ili bilo šta za šta treba aktivni ključ: koristite veze za potpis.
- **Oba**: mnoge aplikacije prijavljuju ljude preko OAuth2 za društvene mogućnosti, a veze za potpis koriste za prenose.
- **Samo identitet osobe**: pogledajte [Prijava bez pristupa objavljivanju](/docs/login-only).

## Izvorni kod {#source-code}

Hivesigner je otvorenog koda:

- Potpisnik u pregledaču: https://github.com/ecency/hivesigner-ui
- API: https://github.com/ecency/hivesigner-api
- JavaScript SDK (npm paket `hivesigner`): https://github.com/ecency/hivesigner-sdk. Pogledajte [SDK](/docs/sdk).
