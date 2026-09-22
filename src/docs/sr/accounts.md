Hivesigner potpisuje ključevima onih Hive naloga koje mu dodate. Nalog dodajete jednom u svakom pregledaču koji koristite, a Hivesigner zatim njegove ključeve čuva u tom pregledaču, šifrovane pristupnim kodom ako ste ga postavili.

## Dodavanje naloga {#add-account}

1. Proverite da adresna traka pregledača prikazuje `https://hivesigner.com`. Vidite [Prvo proverite adresu](/docs/safety#check-the-address).
2. Otvorite [hivesigner.com/import](https://hivesigner.com/import). Ako ovaj pregledač još nema nijedan nalog, dugme **Podesite Hivesigner** na početnoj stranici otvara isti obrazac.
3. U polje **Korisničko ime** unesite svoje Hive korisničko ime malim slovima, bez znaka `@`.
4. U polje **Privatni ključ** nalepite jedan od svojih privatnih ključeva. Prvo pogledajte [Koji ključ da dodate](/docs/accounts#which-key).
5. Ostavite označeno **Zaštiti pristupnim kodom (preporučeno)** i izaberite **Pristupni kod**. Potrebna su najmanje 4 znaka. Vidite [Zaštitite ga pristupnim kodom](/docs/accounts#passcode).
6. Izaberite **Dodaj nalog**.

Pre nego što bilo šta sačuva, Hivesigner proverava ključ u odnosu na vaš nalog na Hive mreži. Javni deo ključa upoređuje sa ključevima koje vaš nalog navodi, dok se sam privatni ključ nikuda ne šalje. Ako korisničko ime nije Hive nalog ili ključ ne pripada njemu, obrazac ispisuje „Neispravno korisničko ime ili ključ. Koristite glavnu lozinku ili jedan od ključeva: vlasnički, aktivni, za objavljivanje ili memo.“

Nalog koji dodate postaje izabrani nalog, onaj koji Hivesigner koristi na svojim ekranima. Ako ste do obrasca došli iz nekog zahteva, Hivesigner vas vraća na taj zahtev. U suprotnom otvara stranicu **Nalozi**.

### Dodavanje još jednog ključa nalogu {#add-a-key}

Da biste nalogu koji je već ovde dodali drugi ključ (na primer aktivni ključ uz ključ za objavljivanje), dodajte taj nalog ponovo sa novim ključem. Hivesigner zadržava ključeve koje već ima i dodaje novi. Novi ključ iste vrste zamenjuje stari.

Ako nalog ima pristupni kod, ostavite označeno **Zaštiti pristupnim kodom (preporučeno)** i unesite isti kod. Sve drugo Hivesigner odbija:

- Bez pristupnog koda obrazac ispisuje „Ovaj nalog je zaštićen na ovom uređaju. Unesite njegov pristupni kod da biste dodali ključ.“
- Sa drugim kodom ispisuje „Pogrešan pristupni kod. Ključ nije sačuvan.“

## Koji ključ da dodate {#which-key}

Hive nalog ima nekoliko privatnih ključeva i svaki dozvoljava drugačije radnje. Dobili ste ih od novčanika ili aplikacije u kojoj ste napravili svoj Hive nalog, obično na njenoj stranici sa ključevima ili lozinkom. Hivesigner ne može da vam ih prikaže.

| Ključ | Za šta ga Hivesigner koristi |
| --- | --- |
| Za objavljivanje | Prijava na aplikacije, glasanje, objavljivanje i komentarisanje, praćenje, izmena profila i preuzimanje nagrada. |
| Aktivni | Radnje sa novčanikom kao što su prenosi, power up i power down, delegiranje, štednja i konverzije. Glasovi za svedoke i predloge. Prvo ovlašćivanje aplikacije i opozivanje pristupa aplikaciji. |
| Vlasnički | Izmena vlasničkog ključa ili naloga za oporavak. U svakodnevnom radu nije potreban. |
| Memo | Ništa. Obrazac ga prihvata, ali nalog koji ima samo memo ključ ne može da se prijavi: ekran zahteva tada prikazuje „Dodajte ključ za objavljivanje ili aktivni ključ za @KORISNIK da biste nastavili“. |

Za svakodnevnu upotrebu dodajte ključ za objavljivanje. Aktivni ključ dodajte samo kada vam treba za neku radnju sa novčanikom ili za prvo ovlašćivanje aplikacije. Kada nekom ekranu zatreba ključ koji ovaj uređaj nema, on to kaže i omogući vam da ga dodate.

I vaša glavna lozinka radi u polju **Privatni ključ**. Hivesigner iz nje izvodi vaše ključeve i čuva svaki koji i dalje odgovara vašem nalogu, uključujući i vlasnički. Kada ključeve dodajete pojedinačno, vlasnički ključ ostaje van ovog uređaja.

> **Napomena:** Hivesigner svaku transakciju potpisuje tačno onim ključem koji joj je potreban. To prati pravilo Hive mreže koje važi od hard forka 2025. godine. Aktivni ključ više ne može da potpiše radnju na nivou objavljivanja, kao što je glas, a vlasnički ključ više ne može da potpiše radnju sa novčanikom. Dodajte ključ za objavljivanje i kada je aktivni ključ već ovde.

Prijava na aplikaciju je nešto drugo: to nije transakcija. Hivesigner vas prijavljuje ključem za objavljivanje, ili aktivnim ključem kada ovaj uređaj nema ključ za objavljivanje tog naloga.

## Zaštitite ga pristupnim kodom {#passcode}

Pristupni kod je lozinka koju birate samo za ovaj pregledač. Nije vaša Hive lozinka niti neki od vaših ključeva. Hivesigner njime šifruje ključeve naloga pre nego što ih sačuva i traži ga ponovo da bi ih otvorio.

- Hivesigner ne čuva vaš pristupni kod i nikuda ga ne šalje. Niko ne može da ga povrati umesto vas.
- Svaki nalog na ovom uređaju ima sopstveni pristupni kod. Možete koristiti isti za sve.
- Duži kod je teže pogoditi. Nemojte koristiti svoju Hive glavnu lozinku ni neki od svojih ključeva kao pristupni kod.

Bez pristupnog koda Hivesigner čuva ključeve naloga u ovom pregledaču nešifrovane. Otvara ih sam pri svakom pokretanju, pa svako ko koristi ovaj pregledač može njima da potpisuje. Stranica **Nalozi** takav nalog označava sa **Bez pristupnog koda**.

Da biste postavili pristupni kod nalogu koji ga nema, dodajte taj nalog ponovo sa jednim od njegovih ključeva i pristupnim kodom. Hivesigner tada sve ključeve tog naloga šifruje tim kodom.

Da biste promenili pristupni kod, [uklonite nalog](/docs/accounts#remove-account) pa ga dodajte ponovo sa novim kodom. Uklanjanje briše sve ključeve naloga iz ovog pregledača, pa svaki ključ dodajte ponovo (ključ za objavljivanje, a zatim aktivni ako ga koristite).

## Otključavanje naloga {#unlock}

Nalog sa pristupnim kodom zaključan je svaki put kada se Hivesigner otvori: u novoj kartici, posle ponovnog učitavanja ili kada vas neka aplikacija pošalje ovamo. Ne morate ga otključavati unapred. Ekran kome trebaju ključevi prikazuje polje **Pristupni kod** iznad sopstvenog dugmeta (na primer **Prijavi se**, **Odobri** ili **Otključaj**). Jedan klik otključava nalog i nastavlja radnju.

Pogrešan kod prikazuje „Pogrešan pristupni kod.“ i ništa se ne potpisuje.

Hivesigner otključane ključeve drži samo u memoriji, nikada u skladištu. Nalog ostaje otključan u toj kartici dok je ne zatvorite ili ponovo ne učitate.

## Promena naloga {#switch-accounts}

Stranica **Nalozi** prikazuje naloge sa ovog uređaja od A do Ž. Izabrani nalog ima kvačicu. Od 6 naloga naviše, polje **Pretraga naloga** filtrira listu.

Izaberite nalog da biste ga učinili izabranim nalogom. Hivesigner ovde ne traži pristupni kod. Traži ga ekran kome trebaju ključevi.

Na ekranu zahteva, red koji imenuje nalog („Prijavljujete se kao“, „Ovlašćujete kao“ ili „Potpisujete kao“) ima link **Promeni nalog**. On otvara istu listu na licu mesta, pa možete izabrati drugi nalog ne napuštajući zahtev. **Dodaj još jedan nalog** ispod liste otvara obrazac **Dodaj nalog** i potom vas vraća na zahtev.

## Uklanjanje naloga {#remove-account}

1. Otvorite stranicu **Nalozi**.
2. Izaberite **✕** pored naloga. Njegova oznaka za čitače ekrana glasi **Ukloni iz servisa Hivesigner @KORISNIK**.
3. Potvrdite kada pregledač upita „Ukloniti @KORISNIK sa ovog uređaja? Ključevi ovog naloga na ovom uređaju biće obrisani.“

Uklanjanje naloga briše njegove ključeve samo iz ovog pregledača. Vaš Hive nalog se ne menja. Aplikacije koje ste ovlastili zadržavaju pristup, jer je taj pristup zapisan na Hive blokčejnu. Kako da ga opozovete, vidite [Pregled i opozivanje pristupa aplikaciji](/docs/signing-in#remove-access).

Ako uklonite izabrani nalog, izabrani postaje neki drugi nalog sa ovog uređaja.

Ako pregledač ne dozvoli servisu Hivesigner da sačuva izmenu, videćete „Uklonjeno samo za ovu sesiju: skladište nije dostupno, pa će se nalog ponovo pojaviti kada ponovo učitate stranicu.“

## Ako zaboravite pristupni kod {#forgotten-passcode}

Niko ne može da povrati pristupni kod, pa ni Hivesigner. Vaš Hive nalog time nije pogođen: pristupni kod štiti samo kopiju vaših ključeva u ovom pregledaču.

1. [Uklonite nalog](/docs/accounts#remove-account) sa ovog uređaja.
2. [Dodajte ga ponovo](/docs/accounts#add-account) sa njegovim ključem i novim pristupnim kodom.

Na Hive blokčejnu se ništa ne menja. Aplikacije koje ste ovlastili zadržavaju pristup.

## Gde se čuvaju vaši ključevi {#where-keys-are-stored}

Hivesigner čuva vaše ključeve samo u ovom pregledaču, na ovom uređaju, u skladištu koje pregledač drži za hivesigner.com.

- Ne sinhronizuju se. Drugi pregledač, drugi profil pregledača ili drugi uređaj ih nemaju. Dodajte nalog i tamo.
- Brisanje podataka sajta ili podataka pregledanja za hivesigner.com briše i njih. Isto važi i za zatvaranje privatnog prozora.
- Hivesigner nije rezervna kopija. Svoje ključeve ili glavnu lozinku čuvajte bezbedno na drugom mestu.
