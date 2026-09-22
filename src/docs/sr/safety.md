Vaši Hive ključevi upravljaju vašim nalogom. Svako ko ih ima može da deluje u vaše ime. Hivesigner ih čuva u vašem pregledaču i pokazuje vam šta potpisujete. Ove navike ih drže bezbednim.

## Prvo proverite adresu {#check-the-address}

Pre nego što ukucate ključ ili pristupni kod, pogledajte adresnu traku pregledača. U njoj mora da piše `https://hivesigner.com`.

- Lažna stranica kopira izgled servisa Hivesigner, ali ne i njegovu adresu. Pročitajte celu adresu: `hivesigner.com.example.net` nije hivesigner.com.
- Pazite na suvišnu reč, na slovo koje nedostaje ili je zamenjeno, kao i na drugačiji završetak.
- Hivesigner u svojoj gornjoj traci prikazuje adresu na kojoj radi. Lažna stranica tamo može da ispiše bilo kakav tekst, pa verujte adresnoj traci pregledača.
- Da biste dodali ključ, sami ukucajte adresu ili koristite obeleživač. Nemojte pratiti link iz poruke, oglasa ili rezultata pretrage.

## Šta nikada ne morate da date {#never-needed}

- Za prijavu, objavljivanje, glasanje, radnje sa novčanikom i ovlašćivanje aplikacija nikada nisu potrebni vaša glavna lozinka ni vlasnički ključ. Vidite [Koji ključ da dodate](/docs/accounts#which-key).
- Aplikacijama koje koriste Hivesigner nikada nisu potrebni vaši ključevi. One vas šalju na hivesigner.com, a vaši ključevi ostaju u vašem pregledaču. Sajt koji traži da ključ ukucate na njegovoj sopstvenoj stranici ne pita preko servisa Hivesigner.
- Nikada nikome ne dajte svoje ključeve ni pristupni kod, ni u ćaskanju, ni u imejlu, ni u zahtevu podršci.

## Dodajte samo ključeve koji su vam potrebni {#only-the-keys-you-need}

- Za svakodnevnu upotrebu dodajte ključ za objavljivanje.
- Aktivni ključ dodajte samo za radnje sa novčanikom, za prvo ovlašćivanje aplikacije ili za opozivanje pristupa aplikaciji.
- Izbegavajte da dodajete glavnu lozinku. Ako je dodate, Hivesigner čuva svaki ključ koji iz nje proizlazi, uključujući i vlasnički.

Kada prvi put ovlastite aplikaciju, aktivni ključ ostaje na ovom uređaju. Da biste ovde zadržali samo ključ za objavljivanje, [uklonite nalog](/docs/accounts#remove-account) pa ga [dodajte ponovo](/docs/accounts#add-account) samo sa ključem za objavljivanje.

## Koristite pristupni kod {#use-a-passcode}

Bez pristupnog koda Hivesigner čuva vaše ključeve u ovom pregledaču nešifrovane. Otvara ih sam pri svakom pokretanju, pa svako ko koristi ovaj pregledač može da potpisuje u vaše ime. Stranica **Nalozi** takav nalog označava sa **Bez pristupnog koda**.

- Izaberite pristupni kod koji drugi ne mogu da pogode. Hivesigner prihvata 4 znaka i više, a duži kod je teže pogoditi.
- Nemojte koristiti svoju Hive glavnu lozinku ni neki od svojih ključeva kao pristupni kod.

Na računaru koji koriste i drugi ljudi:

- Uvek postavite pristupni kod.
- Zatvorite karticu servisa Hivesigner kada završite. Otključan nalog ostaje otključan u toj kartici dok je ne zatvorite ili ponovo ne učitate.
- Na računaru koji nije vaš, [uklonite nalog](/docs/accounts#remove-account) pre nego što odete. Još bolje, uopšte nemojte tamo dodavati svoje ključeve.

## Pročitajte pre nego što odobrite {#read-before-approving}

- **Proverite nalog.** Red u kome piše „Prijavljujete se kao“, „Ovlašćujete kao“ ili „Potpisujete kao“ imenuje nalog koji odgovara. Promenite ga ako nije pravi.
- **Proverite kuda idete dalje.** „Preusmerava vas na HOST“ i „Bićete preusmereni na HOST.“ imenuju sajt koji dobija rezultat. To treba da bude sajt sa koga ste došli.
- **Proverite ko traži.** Aplikacija sama bira ime koje prikazuje. Red „Hive nalog @NALOG_APLIKACIJE“ pokazuje njen pravi Hive nalog. Na stranici za ovlašćivanje ili opozivanje aplikacije Hivesigner o profilu aplikacije kaže: „Sve navedeno iznad objavio je sam nalog aplikacije. Hivesigner ništa od toga ne proverava.“
- **Proverite ključ.** Za glas, objavu ili praćenje potreban je ključ za objavljivanje. Ako ste hteli da glasate, a ekran traži aktivni ili vlasnički ključ, taj zahtev radi nešto drugo. Stanite.
- **Pročitajte izmene ovlašćenja.** Tekst „ključevi: NEMA (vaš ključ se uklanja)“ znači da bi ta izmena izbacila vaš ključ iz vašeg naloga. Izmenu svojih ključeva odobrite samo ako ste je sami pokrenuli.
- **Pročitajte upozorenja.** Tekst „Ova operacija se ne izvršava u ime naloga @KORISNIK, već u ime naloga @NALOG.“ znači da zahtev radi za drugi nalog.
- **Potpisujte samo poruke koje razumete.** Potpisana poruka svakome dokazuje da ste potpisali baš taj tekst.

Sve što ekrani za potpisivanje prikazuju opisano je na stranici [Pregled i potpisivanje](/docs/signing).

## Kako prepoznati lažnu stranicu {#spot-a-fake-page}

Stranica koja liči na Hivesigner lažna je kada:

- **Adresa nije hivesigner.com.** To je jedini znak koji uvek važi.
- **Odbija vaš ključ za objavljivanje.** Pravi Hivesigner prihvata ključ za objavljivanje i njime vas prijavljuje. Stranica koja insistira na glavnoj lozinki ili vlasničkom ključu nije Hivesigner.
- **Ne poznaje naloge koje ste dodali.** Pregledač drži skladište svakog sajta odvojeno. Lažni sajt na drugoj adresi ne vidi naloge koje ste dodali na hivesigner.com, pa ponovo traži ključ. Pravi Hivesigner ih pamti u ovom pregledaču i traži samo pristupni kod, ako ste ga postavili. Ključ traži jedino kada zahtevu treba ključ koji ovaj uređaj nema, i tada ga i imenuje. Na primer: „Za ovo je potreban vaš aktivni ključ, koji nalog @KORISNIK ovde nema.“

Ni nov pregledač ni nov uređaj nemaju vaše naloge. I tamo proverite adresu pre nego što dodate nalog.

Ako ste ključ ukucali na lažnoj stranici, smatrajte ga ukradenim. Promenite ga na Hive mreži što pre.

## Kod je otvorenog koda {#open-source}

Kod servisa Hivesigner javno je dostupan na [github.com/ecency/hivesigner-ui](https://github.com/ecency/hivesigner-ui). Svako može da ga pročita i proveri kako postupa sa vašim ključevima. Da biste prijavili problem, otvorite issue na [github.com/ecency/hivesigner-ui/issues](https://github.com/ecency/hivesigner-ui/issues). Stranica **O servisu** vodi tamo pod stavkom **Prijavi grešku**.
