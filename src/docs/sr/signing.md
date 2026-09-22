Aplikacije mogu tražiti da potpišete Hive transakciju, na primer glas, prenos sredstava ili objavu. Pošalju vam link koji otvara Hivesigner. Hivesigner jasnim rečima pokazuje šta zahtev radi, koji mu ključ treba i kuda vas šalje posle toga. Ništa se ne potpisuje dok ne odobrite. Aplikacije mogu tražiti i da potpišete poruku, koja nikada ne stiže na blokčejn.

## Ekran „Potvrda transakcije“ {#confirm-screen}

Link za potpisivanje otvara ekran pod naslovom „Potvrda transakcije“. On prikazuje po jednu karticu za svaku operaciju u zahtevu. Operacija je jedna radnja na Hive mreži, na primer jedan glas ili jedan prenos.

Kada zahtev nosi više od jedne operacije, kartice se numerišu, a red iznad njih kaže „Ovaj zahtev sadrži 3 operacija. Pregledajte svaku od njih pre odobravanja.“

### Sažetak {#summary}

Svaka kartica počinje rečenicom koja kaže šta operacija radi, sa vrednostima iz zahteva. Na primer:

| Operacija | Šta kartica kaže |
| --- | --- |
| Prenos sredstava | Slanje 1.000 HIVE primaocu @bob (a ispod beleška, u obliku „Beleška: ...“) |
| Glas | Glas za objavu @alice/moja-objava (a ispod težina glasa, na primer 100%) |
| Objava ili odgovor | Nova objava „Moj naslov“, ili Odgovor na @alice/moja-objava |
| Radnja koju definiše neka Hive aplikacija | Prilagođena radnja (follow) |
| Izmena toga ko upravlja nalogom | Izmena ovlašćenja naloga |

Ostale operacije prikazuju svoje ime, na primer „Power Up“ ili „Delegiranje Hive Power“.

Pored rečenice, oznaka velikim slovima pokazuje ključ koji operacija traži: OBJAVLJIVANJE, AKTIVNO ili VLASNIČKO.

### Detalji {#details}

Ispod rečenice kartica navodi vrednosti koje operacija nosi:

- nalog u čije ime se operacija izvršava
- za objavu ili komentar: trajni link (adresu objave), zajednicu ili oznaku, sadržaj i metapodatke
- za prilagođenu radnju: svaku vrednost njenih podataka, po jednu u redu, da ništa ne bude odsečeno
- za izmenu ovlašćenja: prag, ključeve i naloge koje postavlja

Izmena ovlašćenja kaže i kada bi uklonila vaše ključeve, tekstom „ključevi: NEMA (vaš ključ se uklanja)“. Prag koji nedostaje prikazuje se kao „prag NIJE POSTAVLJEN (računa se kao 0)“.

U sažetku i u detaljima, znakovi koji bi mogli da sakriju tekst ili promene njegov smer prikazuju se kao `�`. Ono što čitate ne može da se pretvara da je nešto drugo.

**Prikaži sirove podatke** (ili **Prikaži sirove podatke operacija**) otvara tačno one operacije koje će biti potpisane.

Kada je iznos dat u Hive Power, Hivesigner ga preračunava po trenutnom kursu. Prikazuje „Učitavanje trenutnog kursa za Hive Power…“ i čeka taj kurs pre nego što vam dozvoli da odobrite.

Neki zahtevi nose transakciju pripremljenu na drugom mestu, na primer za nalog kojim upravlja više ljudi. Ekran tada kaže „Ovaj zahtev je dostavio sopstveno zaglavlje transakcije. Ističe: DATUM.“ Ako su je drugi već potpisali, dodaje „Već sadrži 2 potpisa.“

## Koji ključ je potreban {#which-key}

Ispod kartica jedan red imenuje ključ koji je potreban celom zahtevu: „Potpisuje se vašim ključem za objavljivanje“, „Potpisuje se vašim aktivnim ključem“ ili „Potpisuje se vašim vlasničkim ključem“.

Hivesigner potpisuje tačno tim ključem. Aktivni ključ ne može da potpiše glas, a vlasnički ne može da potpiše prenos sredstava. To je pravilo Hive mreže od hard forka 2025. godine. Vidite [Koji ključ da dodate](/docs/accounts#which-key).

Svim operacijama u jednom zahtevu mora biti potreban isti ključ. Kada nije tako, taj red glasi „Ova transakcija zahteva više od jednog ovlašćenja i ne može se potpisati jednim ključem.“ Nema dugmeta za odobravanje. Vratite se u aplikaciju.

Zahtevi sa vlasničkim ključem retki su. Oni menjaju ko može da upravlja vašim nalogom ili da ga oporavi. Pročitajte ih dvaput. Vidite [Pročitajte pre nego što odobrite](/docs/safety#read-before-approving).

### Kada ključ nedostaje {#missing-key}

Ako izabrani nalog nema taj ključ na ovom uređaju, ekran to kaže. Na primer: „Za ovo je potreban vaš aktivni ključ, koji nalog @KORISNIK ovde nema.“

1. Izaberite **Dodaj još jedan nalog** ispod poruke. Otvara se obrazac **Dodaj nalog**.
2. Unesite isto korisničko ime i ključ koji nedostaje. Ako nalog ima pristupni kod, unesite i njega.
3. Izaberite **Dodaj nalog**. Hivesigner dodaje ključ i vraća vas na zahtev.

Ako je nalog zaključan, ekran iznad dugmeta prikazuje polje **Pristupni kod**. Jedan klik otključava nalog i odobrava. Ako se ispostavi da ključ zaista nedostaje, ekran to kaže posle otključavanja.

Ako ovaj pregledač još nema nijedan nalog, na dugmetu piše **Nastavi** i ono otvara obrazac **Dodaj nalog**.

## Odobravanje ili potpisivanje {#approve}

Red sa nalogom iznad dugmeta kaže „Potpisujete kao“ i imenuje nalog koji potpisuje. **Promeni nalog** vam omogućava da izaberete drugi. Vidite [Promena naloga](/docs/accounts#switch-accounts).

- **Odobri** potpisuje transakciju u vašem pregledaču i šalje je na Hive mrežu. Rezultat glasi „Transakcija je uspešno emitovana“ i uz njega stoji **ID transakcije** koji otvara transakciju u pretraživaču blokova.
- **Potpiši** se pojavljuje umesto toga kada zahtev traži samo potpis. Hivesigner tada potpisuje transakciju bez slanja na mrežu i potpis predaje aplikaciji, ili ga prikaže kada zahtev ne imenuje nijedan sajt.

Ako mreža odbije transakciju, videćete „Vaša transakcija nije emitovana“ i uz njega polje „Poruka o grešci“ sa onim što je mreža vratila. Možete pokušati ponovo.

## Sajt na koji se vraćate {#return-site}

Kada zahtev imenuje sajt za povratak, obaveštenje pri vrhu kaže „Bićete preusmereni na HOST.“ Pošto odobrite, Hivesigner vas šalje tamo. Proverite da je HOST sajt sa koga ste došli.

Kada zahtev ne imenuje nijedan sajt, Hivesigner ostaje na ekranu sa rezultatom.

## Zahtev za drugi nalog {#another-account}

Zahtev može biti napravljen za nalog koji nije izabrani. Hivesigner to pokazuje na dva načina.

**Zahtev mora potpisati drugi nalog.** Ekran kaže „Ovaj zahtev mora biti potpisan u ime naloga @NALOG. Prebacite se na taj nalog.“ U redu sa nalogom piše „Izabrani nalog“, a ispod njega otvara se lista naloga. Izaberite taj nalog ili ga dodajte preko **Dodaj još jedan nalog**. Nijednim drugim nalogom Hivesigner taj zahtev neće potpisati.

**Operacija se izvršava u ime drugog naloga.** To se dešava sa nalozima kojima upravlja više ljudi. Upozorenje pri vrhu kaže „Ova operacija se ne izvršava u ime naloga @KORISNIK, već u ime naloga @NALOG. Nastavite samo ako upravljate i tim nalogom.“ Detalji svake kartice imenuju nalog u čije ime se ona izvršava.

## Zahtevi koje Hivesigner ne može da pročita {#invalid-requests}

Hivesigner nikada ne potpisuje zahtev koji ne može da pročita u celosti i da vam ga prikaže. Tu spadaju operacija koju ne poznaje, zahtev bez ijedne operacije, vrednost koja ne odgovara operaciji (broj koji nije broj, iznos u pogrešnom obliku) i dodatni podaci koje ne može da prikaže.

Ekran tada kaže „Ups, nešto nije u redu. Dostavljeni podaci nisu ispravni.“ Vratite se u aplikaciju. Da biste obavestili tim servisa Hivesigner, izaberite **Prijavi ovaj problem**.

## Zahtevi za potpisivanje poruke {#message-requests}

Neke aplikacije traže da potpišete poruku umesto transakcije, na primer da biste dokazali da je nalog vaš. Poruka je tekst i njeno potpisivanje ne menja ništa na blokčejnu.

Ekran prikazuje:

- Naslov poput „APLIKACIJA traži da potpišete poruku.“ Kada aplikacija ima Hive nalog, red ispod ga imenuje: „Hive nalog @NALOG_APLIKACIJE“.
- „Preusmerava vas na HOST“: sajt koji dobija potpis. Isti red se ponovo pojavljuje pored dugmeta.
- **Poruka**: ceo tekst, tačno onakav kakav će biti potpisan. Znakovi koji bi mogli da sakriju tekst ili promene njegov smer prikazuju se kao istaknuti kodovi, na primer `\u{200B}`.
- Ključ koji se koristi: „Potpisuje se vašim ključem za objavljivanje“ ili „Potpisuje se vašim aktivnim ključem“. Hivesigner poruku nikada ne potpisuje vlasničkim ključem.
- Upozorenje: „Vaš potpis svakome ko ga vidi dokazuje da je @KORISNIK potpisao baš ovaj tekst. Potpisujte samo poruku koju razumete.“
- Red sa nalogom, „Potpisujete kao“, uz **Promeni nalog**.

Izaberite **Potpiši** da biste potpisali. Hivesigner vas vraća na sajt zajedno sa potpisom, vašim korisničkim imenom, vrstom ključa i javnim ključem koji je napravio potpis. Javni ključ je onaj deo para ključeva koji se može deliti i njime se ne može ništa potpisati.

Izaberite **Otkaži** da biste otišli na svoju stranicu **Nalozi**. Sajt ne dobija ništa.

Ako nalog nema taj ključ na ovom uređaju, ekran to kaže. Na primer: „Za ovo je potreban vaš ključ za objavljivanje, koji nalog @KORISNIK ovde nema.“ Izaberite **Promeni nalog**, pa **Dodaj još jedan nalog**. Za isti nalog [dodajte ključ koji nedostaje](/docs/accounts#add-a-key). Hivesigner vas vraća na zahtev.

### Zašto se neke poruke odbijaju {#refused-messages}

**Poruka koja može da posluži kao prijava na Hivesigner.** Neki tekst ima tačno oblik Hivesigner prijave. Njegovo potpisivanje dalo bi sajtu pristup vašem nalogu. Hivesigner takav tekst nikada ne potpisuje i kaže „Ova poruka je Hivesigner token. Njeno potpisivanje bi sajtu dalo pristup vašem nalogu, zato ne može da se potpiše.“

**Zahtev koji Hivesigner ne može da upotrebi.** Hivesigner odbija zahtev bez poruke ili bez povratne adrese. Odbija i zahtev za ključ koji nije ni za objavljivanje ni aktivni, zahtev koji kao aplikaciju imenuje nešto što nije Hive nalog, kao i zahtev čija povratna adresa nije bezbedna ili nije registrovana za tu aplikaciju. Tada kaže „Ovaj zahtev za potpis ne može da se koristi: potrebni su poruka, ključ za objavljivanje ili aktivni ključ i bezbedan URL za preusmeravanje registrovan za aplikaciju. Vratite se na sajt i pokušajte ponovo.“

Ako Hivesigner ne može da pročita podatke aplikacije sa Hive mreže, kaže „Nije moguće učitati podatke o nalogu sa Hive mreže.“ i dok ne uspe, ne potpisuje ništa. Izaberite **Pokušaj ponovo**.

## Sami potpišite poruku {#sign-message}

Poruku možete potpisati i sami, da biste dokazali da upravljate nalogom.

1. Otvorite [hivesigner.com/signmessage](https://hivesigner.com/signmessage). Podnožje sajta vodi tamo pod stavkom **Potpiši poruku**.
2. Ako je izabrani nalog zaključan, unesite njegov pristupni kod i izaberite **Otključaj**. Ako nijedan nalog nije izabran, stranica vodi na listu vaših naloga.
3. Tekst unesite u polje **Poruka**. Hivesigner uklanja razmake i prelome reda na početku i na kraju.
4. Ključ izaberite u polju **Ključ za potpisivanje**. Tu su navedeni ključevi izabranog naloga koji postoje na ovom uređaju, od najjačeg naniže, a najjači je unapred izabran. Promenite ga na **Objavljivanje** osim ako vam treba drugi.
5. Izaberite **Potpiši poruku**.

**Pregled potpisa** prikazuje **Autora**, **Korišćeno ovlašćenje**, **Token za proveru** i **Link za proveru**. Token za proveru objedinjuje poruku, vaše korisničko ime i potpis u jedan tekst. Podelite link ili token sa onim ko treba da proveri poruku.

Potpis ne otkriva vaš ključ, ali pokazuje kojim je ključem napravljen.

## Provera poruke {#verify-message}

1. Otvorite [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage). Podnožje sajta vodi tamo pod stavkom **Proveri poruku**.
2. Nalepite token u polje **Token za proveru** i izaberite **Proveri potpis**.

Link za proveru otvara ovu stranicu i sam proverava poruku.

Rezultat glasi „Potpis je važeći za KORISNIK“ ili „Potpis nije moguće potvrditi ključevima naloga.“ Ispod toga vidite **Autora**, **Javni ključ izveden iz potpisa**, **Podudarno ovlašćenje** (vrstu ključa koji je potpisao) i **Poruku**.

Hivesigner potpis proverava ključevima koje nalog sada ima na Hive mreži. Poruka potpisana ključem koji je nalog u međuvremenu zamenio više se ne može proveriti.
