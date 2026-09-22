Kada vam aplikacija omogući prijavu preko servisa Hivesigner, ona vas sa zahtevom šalje na hivesigner.com. Hivesigner prikazuje ko traži, šta traži i koji vaš nalog odgovara. Odluku tamo donosite vi. Aplikacija nikada ne dobija vaše ključeve: dobija dokaz o vašem korisničkom imenu, potpisan u vašem pregledaču.

## Ekran zahteva {#request-screen}

Odozgo nadole, ekran prikazuje:

- **Aplikaciju.** Njenu sliku i naslov. Kada aplikacija prvi put traži pristup za objavljivanje, naslov glasi „APLIKACIJA traži pristup vašem nalogu.“ U ostalim slučajevima glasi „Prijava na APLIKACIJA“. Ime u naslovu bira sama aplikacija.
- **Hive nalog @NALOG_APLIKACIJE.** Pravi Hive nalog aplikacije. Aplikacija sebe može nazvati kako hoće, ali ovo ime ne može da promeni. Proverite ga.
- **Preusmerava vas na HOST.** Sajt na koji vas Hivesigner vraća kada odobrite.
- **Opseg pristupa.** Ono što aplikacija traži: [samo prijava ili pristup za objavljivanje](/docs/signing-in#scopes).
- **Red sa nalogom.** „Ovlašćujete kao“ ili „Prijavljujete se kao“, sa nalogom koji aplikacija dobija i linkom **Promeni nalog**. Vidite [Izaberite nalog](/docs/signing-in#choose-account).
- **Dugme.** **Ovlasti** ili **Prijavi se**. Ako je nalog zaključan, iznad njega stoji polje **Pristupni kod**, a jedan klik otključava nalog i nastavlja radnju.
- **Otkaži.** Vodi vas na vašu stranicu **Nalozi**. Hivesigner aplikaciji ne šalje ništa.

Ako ovaj pregledač još nema nijedan nalog, na dugmetu piše **Nastavi**. Ono otvara obrazac **Dodaj nalog** i potom vas vraća na zahtev. Vidite [Dodavanje naloga](/docs/accounts#add-account).

## Samo prijava ili pristup za objavljivanje {#scopes}

Aplikacija traži jedno od to dvoje. Između toga nema ničega.

### Samo prijava {#sign-in-only}

**Opseg pristupa** prikazuje „Pregled korisničkog imena vašeg naloga“. Aplikacija saznaje koji ste Hive nalog, što potvrđuje vaš potpis, ali ne dobija nikakvo pravo da deluje umesto vas. Na dugmetu piše **Prijavi se**.

I sajt koji nema sopstveni Hive nalog može tražiti da se prijavite. Njegov ekran glasi „HOST želi da potvrdi vaše Hive korisničko ime.“ Takav zahtev je uvek samo prijava. Hivesigner sajt imenuje njegovom adresom, jer je ta adresa jedino što o njemu možete proveriti.

### Pristup za objavljivanje {#posting-access}

**Opseg pristupa** prikazuje „Uz vaše ovlašćenje za objavljivanje, APLIKACIJA će moći da:“ a zatim sledi šta to znači:

- **Objavljuje i komentariše:** objavljuje objave i komentare u vaše ime.
- **Glasa:** daje pozitivne i negativne glasove vašim nalogom.
- **Prati i ažurira vaš prikaz:** prati, isključuje zvuk i deli dalje u vaše ime.

Ovlašćenje za objavljivanje deo je vašeg Hive naloga koji upravlja svakodnevnim radnjama. Kada odobrite, Hive nalog aplikacije dodaje se u vaše ovlašćenje za objavljivanje. To je jedno dodeljivanje na Hive blokčejnu, a ne spisak odvojenih dozvola.

## Šta pristup za objavljivanje dozvoljava {#what-posting-access-allows}

Sa pristupom za objavljivanje aplikacija u vaše ime može sve ono što može i vaš ključ za objavljivanje:

- da objavljuje, menja i briše vaše objave i komentare
- da glasa
- da prati, isključuje zvuk i deli dalje
- da menja vaš profil
- da preuzima vaše nagrade u vaš sopstveni novčanik
- da obavlja druge svakodnevne radnje koje koriste Hive aplikacije i igre

Nikada ne može:

- da pomera vaša sredstva: da šalje HIVE ili HBD, radi power up ili power down, delegira Hive Power ili koristi vašu štednju
- da menja vaše ključeve ni to ko upravlja vašim nalogom
- da daje pristup drugim aplikacijama

> **Upozorenje:** Ovlastite samo aplikacije kojima verujete. Pristup za objavljivanje traje dok ga ne opozovete. Zapisan je na Hive blokčejnu, a ne u servisu Hivesigner: uklanjanje naloga iz servisa Hivesigner ga ne prekida.

## Kada prvi put ovlastite aplikaciju {#first-time}

Kada aplikaciji prvi put date pristup za objavljivanje, ekran prikazuje ovo obaveštenje: „Prvo ovlašćivanje: ovim se @NALOG_APLIKACIJE dodaje u vaše ovlašćenje za objavljivanje u blokčejnu, za šta je jednom potreban vaš aktivni ključ. Taj nalog će moći da objavljuje u vaše ime dok mu ne opozovete pristup.“

Izmena toga ko može da objavljuje za vaš nalog jeste izmena samog naloga, pa je potreban vaš aktivni ključ. Ako ga ovaj uređaj nema, ekran ga traži na licu mesta:

1. Nalepite svoj aktivni ključ u polje **Aktivni ključ ili glavna lozinka za @KORISNIK**. Hivesigner ga proverava u odnosu na vaš nalog na Hive mreži i čuva na ovom uređaju uz ostale ključeve. Ako nalepite glavnu lozinku, Hivesigner iz nje zadržava samo aktivni ključ, a uz njega i ključ za objavljivanje ako ga ovaj uređaj nema.
2. Ako nalog nema pristupni kod, obrazac nudi **Zaštiti pristupnim kodom (preporučeno)**, unapred označeno. Ako ga ima, a servisu Hivesigner ponovo zatreba, obrazac ga traži u polju **Pristupni kod za @KORISNIK**.
3. Izaberite **Dodaj aktivni ključ**, pa zatim **Ovlasti**.

Hivesigner zatim iz vašeg pregledača šalje izmenu na Hive mrežu. Čeka da se izmena pojavi na blokčejnu i tek onda vas vraća u aplikaciju, prijavljene. Ako to potraje predugo, videćete „Ovlašćenje je poslato, ali se još potvrđuje. Pokušajte ponovo za trenutak.“

Aktivni ključ posle toga ostaje na ovom uređaju. Da biste ovde zadržali samo ključ za objavljivanje, vidite [Dodajte samo ključeve koji su vam potrebni](/docs/safety#only-the-keys-you-need).

## Ovlašćivanje aplikacije iz direktorijuma {#directory}

Svaka aplikacija na [hivesigner.com/apps](https://hivesigner.com/apps) otvara stranicu pod naslovom „Ovlasti @NALOG_APLIKACIJE“. Ona prikazuje ono što aplikacija objavljuje o sebi i rečenicu „@NALOG_APLIKACIJE će moći da objavljuje, komentariše, glasa i prati u ime naloga @KORISNIK.“

Izbor **Ovlasti** aplikaciji odmah daje pristup za objavljivanje, kao i ekran prvog ovlašćivanja, i za to je potreban vaš aktivni ključ. Nijedna aplikacija to nije tražila od vas, pa ovo koristite samo kada to zaista nameravate. **Otkaži** vas vodi na vašu stranicu **Nalozi**.

Ako je vaš nalog aplikaciji već dao pristup za objavljivanje, stranica ispisuje „Aplikacija @NALOG_APLIKACIJE je ovlašćena.“ i nudi **Nastavi**.

## Povratak u aplikaciju {#coming-back}

Ako je vaš nalog aplikaciji već dao pristup za objavljivanje, ništa novo se ne dodeljuje i ekran je kraći:

- Naslov glasi „Prijava na APLIKACIJA“.
- Jedan red kaže „Već ste ranije ovlastili aplikaciju @NALOG_APLIKACIJE. Ne dodeljuju se nova ovlašćenja.“
- U redu sa nalogom piše „Prijavljujete se kao“.
- Na dugmetu piše **Prijavi se**.

Za ovo vam treba samo ključ za objavljivanje (ili aktivni ključ). Ako ste u međuvremenu opozvali pristup aplikaciji, ponovo se pojavljuje ekran prvog ovlašćivanja.

## Izaberite nalog {#choose-account}

Red sa nalogom imenuje nalog koji aplikacija dobija. Proverite ga pre nego što odobrite, naročito kada na ovom uređaju imate više naloga.

- Izaberite **Promeni nalog** da biste listu svojih naloga otvorili na licu mesta. Izaberite drugi i ekran prelazi na taj nalog.
- Izaberite **Dodaj još jedan nalog** ispod liste da biste dodali nalog koji još nije na ovom uređaju. Hivesigner vas posle toga vraća na zahtev.

Aplikacija može predložiti koji nalog da se koristi. Ako je taj nalog na ovom uređaju, Hivesigner ga bira, a vi ga i dalje možete promeniti.

## Kada Hivesigner odbije zahtev {#refused-requests}

Hivesigner vam ne dozvoljava da odobrite zahtev koji ne može da proveri. Umesto toga, ekran prikazuje jednu od ovih poruka:

| Poruka | Šta znači |
| --- | --- |
| „URL za preusmeravanje ove aplikacije nije registrovan. Radi vaše bezbednosti, prijava je blokirana.“ | Povratna adresa nije među onima koje je aplikacija navela na svom Hive nalogu. |
| „@NALOG_APLIKACIJE nije Hive nalog, pa nema aplikacije koju treba ovlastiti. Vratite se na sajt i pokušajte ponovo.“ | Zahtev imenuje aplikaciju koja ne postoji. |
| „Ovaj sajt je zatražio da se vaši podaci za prijavu pošalju na nezaštićenu http:// adresu. Hivesigner ih šalje samo preko https veze. Zamolite sajt da koristi bezbednu adresu.“ | Povratna adresa nije bezbedna. |
| „Ovaj sajt je zatražio da se vaši podaci za prijavu pošalju na adresu koja nije veb URL. Vratite se na sajt i pokušajte ponovo.“ | Povratna adresa nije veb adresa. |
| „Ovaj zahtev za ovlašćenje je nepotpun: u njemu nije navedena aplikacija ili URL za preusmeravanje. Vratite se u aplikaciju i pokušajte ponovo.“ | Zahtevu nedostaju delovi. |

Vratite se u aplikaciju i pokušajte ponovo. Ako problem ostane, izaberite **Prijavi ovaj problem**. Time se link i vaša neobavezna beleška šalju timu servisa Hivesigner, sa sakrivenim poverljivim podacima.

Ako Hivesigner ne može da dopre do Hive mreže, prikazuje „Nije moguće učitati podatke o nalogu sa Hive mreže.“ Izaberite **Pokušaj ponovo**.

## Pregled i opozivanje pristupa aplikaciji {#remove-access}

1. Otvorite [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps). Podnožje sajta vodi tamo pod stavkom **Ovlašćene aplikacije**.
2. Stranica za izabrani nalog prikazuje „Aplikacije koje mogu da objavljuju u ime naloga @KORISNIK.“ a ispod toga svaku aplikaciju. Da biste videli aplikacije drugog naloga, prvo ga izaberite na stranici **Nalozi**.
3. Ako je nalog zaključan, unesite njegov pristupni kod i izaberite **Otključaj**.
4. Izaberite **Opozovi** pored aplikacije. Kada je aktivni ključ na ovom uređaju, pristup aplikaciji nestaje odmah.

Lista prikazuje svaki nalog koji samostalno može da objavljuje u vaše ime, uključujući i one koje ste dodali drugim alatima.

Opozivanje je izmena vašeg naloga na Hive blokčejnu, pa je jednom potreban aktivni ključ. Ako ga ovaj uređaj nema, **Opozovi** otvara stranicu te aplikacije („Opozovi pristup za @NALOG_APLIKACIJE“) koja tu traži aktivni ključ. Na njoj piše „@NALOG_APLIKACIJE više neće moći da deluje u ime naloga @KORISNIK.“ Dodajte ključ pa izaberite **Opozovi**.

Kada opozovete pristup aplikaciji, Hivesigner nalog te aplikacije izbacuje iz ovlašćenja za objavljivanje vašeg naloga (i iz aktivnog ovlašćenja, ako je i tamo). Od tog trenutka aplikacija više ne može da objavljuje, glasa ni da deluje u vaše ime. Ako kasnije ponovo zatraži pristup za objavljivanje, videćete ekran prvog ovlašćivanja.

Opozivanje vas ne odjavljuje sa sopstvenog veb sajta aplikacije. Ako želite, odjavite se i tamo.
