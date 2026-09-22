Kratki odgovori na česta pitanja. Svaki vodi na stranicu sa detaljima.

## Korišćenje servisa Hivesigner {#using-hivesigner}

### Da li je Hivesigner besplatan? {#is-it-free}

Jeste. Hivesigner ne naplaćuje ni korisnicima ni aplikacijama. Njegov izvorni kod otvoren je pod MIT licencom.

### Da li Hivesigner ikada vidi moje ključeve? {#keys}

Ne. Vaši ključevi ostaju u pregledaču na vašem uređaju i Hivesigner tamo i potpisuje. Nikada se ne šalju na servere servisa Hivesigner niti aplikacijama koje koristite. Vidite [Gde se čuvaju vaši ključevi](/docs/accounts#where-keys-are-stored) i [Čuvajte svoje ključeve bezbedno](/docs/safety).

### Šta ako zaboravim pristupni kod? {#forgotten-passcode}

Niko ne može da povrati pristupni kod, pa ni Hivesigner. Uklonite nalog iz servisa Hivesigner i dodajte ga ponovo sa svojim Hive ključem i novim pristupnim kodom. Vaš Hive nalog i aplikacije koje ste ovlastili ostaju nepromenjeni. Vidite [Ako zaboravite pristupni kod](/docs/accounts#forgotten-passcode).

### Mogu li da koristim Hivesigner na telefonu? {#phone}

Možete. Otvorite https://hivesigner.com u pregledaču na telefonu i tamo dodajte svoj nalog. Ključevi se čuvaju samo u tom pregledaču, pa nalog dodajte na svakom uređaju koji koristite. Vidite [Dodavanje naloga i upravljanje njima](/docs/accounts).

### Koje aplikacije koriste Hivesigner? {#which-apps}

Na https://hivesigner.com/apps nalaze se aplikacije koje preko servisa Hivesigner emituju transakcije na Hive, prvo one najkorišćenije. Svaka aplikacija sama objavljuje svoje ime i opis, a Hivesigner ih ne proverava. Kada tamo otvorite aplikaciju, prikazuje se stranica sa koje joj možete dati pristup za objavljivanje. Vidite [Ovlašćivanje aplikacije iz direktorijuma](/docs/signing-in#directory).

### Kakav je odnos servisa Hivesigner i aplikacije Hive Keychain? {#hive-keychain}

To su odvojeni alati. Hive Keychain je dodatak za pregledač i mobilna aplikacija, a Hivesigner je veb sajt, pa se ništa ne instalira. Kada aplikacija zatraži da potpišete poruku, dobijeni potpis iste je vrste kao onaj koji pravi Hive Keychain, pa ih aplikacija proverava istim kodom. Token za proveru sa stranice **Potpiši poruku** u servisu Hivesigner proverava se na njegovoj stranici **Proveri poruku**. Vidite [Potpisivanje poruka](/docs/message-signing).

## Razvoj uz Hivesigner {#building}

### Mogu li da koristim Hivesigner u mobilnoj aplikaciji? {#mobile-app}

Možete. Pošaljite korisnika na Hivesigner u pregledaču i koristite povratnu adresu koju vaša aplikacija može da primi: https link čiji ste vlasnik (Android App Links ili iOS Universal Links) ili loopback adresu poput `http://127.0.0.1/auth`. Sopstvene šeme kao što je `myapp://` se odbijaju. Vidite [Mobilne i desktop aplikacije](/docs/register-app#native-apps).

### Da li mi treba nalog za aplikaciju? {#app-account}

Treba vam da biste korisnike prijavljivali sa pristupom za objavljivanje i da biste emitovali transakcije preko API-ja. Vidite [Registrujte svoju aplikaciju](/docs/register-app). [Linkovi za potpisivanje](/docs/sign-links) i [potpisivanje poruka](/docs/message-signing) rade i bez njega, kao i [prijava bez pristupa za objavljivanje](/docs/login-only).

### Može li API da šalje prenose sredstava? {#transfers}

Ne može. API emituje samo operacije na nivou objavljivanja, kao što su glasovi, komentari i praćenje. Za prenose i druge radnje kojima treba aktivni ključ koristite [linkove za potpisivanje](/docs/sign-links): korisnik svaku od njih odobrava sopstvenim ključem.

### Koji jezici imaju SDK? {#languages}

Zvanični SDK napravljen je za JavaScript. Za Python postoje biblioteke zajednice. REST API može da poziva bilo koji jezik. Vidite [SDK-ovi](/docs/sdk) i [REST API](/docs/api).

## Pomoć {#help}

### Gde mogu da dobijem pomoć? {#get-help}

Pitajte na HiveDevs Discord serveru: https://discord.gg/pNJn7wh. Greške prijavite kao issue u odgovarajućem GitHub repozitorijumu: https://github.com/ecency/hivesigner-ui za veb sajt, https://github.com/ecency/hivesigner-api za API ili https://github.com/ecency/hivesigner-sdk za JavaScript SDK. Na ekranu koji odbija zahtev, dugme **Prijavi ovaj problem** šalje problem timu servisa Hivesigner.

### Kako mogu da doprinesem? {#contribute}

Hivesigner je otvorenog koda na GitHub-u, u tri repozitorijuma navedena iznad. Otvorite issue sa greškom ili idejom. Pošaljite pull request sa ispravkom.
