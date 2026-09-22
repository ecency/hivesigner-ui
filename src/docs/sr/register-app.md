Aplikacija koja prijavljuje ljude preko Hivesigner-a jeste Hive nalog. Njegovo ime je `client_id` koji šaljete. Njegov profil čuva podešavanja koja Hivesigner čita: povratne adrese na koje sme da šalje tokene i, za tok sa kodom, tajnu klijenta. Da bi emitovao preko API-ja, nalog aplikacije daje i ovlašćenje za objavljivanje nalogu @hivesigner. Ova stranica prolazi kroz svaki korak.

## Šta vam treba {#what-you-need}

| Želite da | Nalog aplikacije i povratne adrese | Tajna klijenta | Odobrenje za @hivesigner |
| --- | --- | --- | --- |
| Prijavljujete ljude i emitujete tokom sa tokenom | Da | Ne | Da |
| Prijavljujete ljude i emitujete tokom sa kodom (tokeni za osvežavanje) | Da | Da | Da |
| Samo prijavljujete ljude, tokenom koji navodi vašu aplikaciju | Da | Ne | Ne |
| Samo prijavljujete ljude, sa sajta bez Hive naloga | Ne | Ne | Ne |
| Šaljete veze za potpis | Ne | Ne | Ne |

Za poslednja dva reda pogledajte [Prijava bez pristupa objavljivanju](/docs/login-only) i [Veze za potpis](/docs/sign-links).

## Napravite nalog aplikacije {#app-account}

1. Napravite Hive nalog za svoju aplikaciju, na primer na https://ecency.com/signup. Koristite poseban nalog za aplikaciju, ne svoj lični. Njegovo ime je vaš `client_id`. Ljudi ga vide na ekranu saglasnosti pored «Hive nalog». Hive nalog ne može da se preimenuje, pa ime birajte pažljivo.
2. Dodajte nalog u Hivesigner na https://hivesigner.com/import (**Dodaj nalog**). Koristite aktivni ključ ili glavnu lozinku: odobrenje niže traži aktivni ključ.

## Popunite podešavanja aplikacije {#app-settings}

Otvorite https://hivesigner.com/profile sa izabranim nalogom aplikacije i podesite:

- **Ovaj nalog je aplikacija.** Uključite to. Time se nalog označava kao aplikacija, a upravo to API proverava pre nego što za njega prihvati kod ili token za osvežavanje.
- **URI adrese za preusmeravanje.** Vaše povratne adrese, jedna po redu. Pogledajte [Povratne adrese](#callbacks).
- **Autor.** Ko održava aplikaciju. Spisak aplikacija na https://hivesigner.com/apps to prikazuje.
- **Status.** Produkcija ili proba, za vašu sopstvenu evidenciju. Hivesigner se prema oba ponaša isto.
- **Tajna klijenta.** Potrebna je samo za [tok sa kodom](/docs/oauth2#code-flow). Pogledajte [Tajna klijenta](#client-secret).

Popunite i **Ime** i **URL profilne slike**. Ekran saglasnosti prikazuje sliku i ime vaše aplikacije. Spisak aplikacija na https://hivesigner.com/apps prikazuje ime, **Opis** i **Veb-sajt**.

Čuvanje osvežava profil naloga u blokčejnu i traži njegov ključ za objavljivanje. Hivesigner čita vaše povratne adrese sa naloga kada se otvori zahtev za prijavu, pa izmena važi čim transakcija uđe u blok.

> **Napomena:** Ime, sliku i opis objavljuje sam nalog vaše aplikacije. Zato ekran saglasnosti prikazuje i pravo ime naloga (`@myapp`) i domaćina na koji šalje osobu: upravo njih odobrenje i preusmeravanje zaista koriste.

## Povratne adrese {#callbacks}

Povratna adresa (`redirect_uri` u zahtevu za prijavu) jeste mesto na koje Hivesigner vraća osobu sa tokenom ili kodom. Hivesigner je šalje samo na povratnu adresu navedenu na nalogu vaše aplikacije.

### Pravila {#callback-rules}

- **Tačno poklapanje.** `redirect_uri` u zahtevu mora da bude jedna od vaših URI adresa za preusmeravanje, znak po znak: šema, domaćin, port, putanja i upitni deo.
- **Samo https.** Povratna adresa mora da koristi `https://`. Običan `http://` prihvata se samo na povratnoj petlji: `localhost`, `127.0.0.1` ili `[::1]`.
- **Portovi povratne petlje smeju da se menjaju.** Povratna adresa na povratnoj petlji registrovana sa običnim http poklapa se sa svakim domaćinom i portom povratne petlje koji imaju istu putanju, upitni deo, fragment i podatke o korisniku. Adresa na povratnoj petlji registrovana sa `https://` ostaje tačno poklapanje.
- **Bez sopstvenih šema.** Povratna adresa poput `myapp://callback` biva odbijena. Pogledajte [Mobilne i računarske aplikacije](#native-apps).
- **Bez fragmenata.** Nemojte dodavati `#fragment` na povratnu adresu.

Stranica profila odbija da sačuva povratnu adresu koja nikada ne bi mogla da radi i kaže «Neupotrebljive povratne adrese (dozvoljeni su https ili http na localhost)».

### Primeri {#callback-examples}

Uz ove registrovane URI adrese za preusmeravanje:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| `redirect_uri` u zahtevu | Ishod |
| --- | --- |
| `https://myapp.example/auth/callback` | Prihvaćena: tačno poklapanje |
| `https://myapp.example/auth/callback/` | Odbijena: višak `/` |
| `https://myapp.example/auth/callback?next=home` | Odbijena: upitni deo je drugačiji |
| `https://www.myapp.example/auth/callback` | Odbijena: drugi domaćin |
| `http://myapp.example/auth/callback` | Odbijena: običan http van povratne petlje |
| `http://localhost:3000/auth` | Prihvaćena: tačno poklapanje |
| `http://127.0.0.1:51234/auth` | Prihvaćena: povratna petlja, ista putanja, drugi port |
| `http://[::1]:3000/auth` | Prihvaćena: povratna petlja, ista putanja |
| `http://127.0.0.1:3000/other` | Odbijena: druga putanja |
| `https://localhost:3000/auth` | Odbijena: https se ne poklapa sa registracijom preko običnog http |
| `myapp://auth` | Odbijena: sopstvena šema |

Da biste na svojoj povratnoj adresi primali upitni deo, registrujte adresu baš sa tim upitnim delom. Hivesigner zadržava sopstveni upitni deo vaše adrese i svoje parametre dodaje posle njega.

### Mobilne i računarske aplikacije {#native-apps}

Hivesigner stavlja token u povratnu adresu. Sopstvena šema poput `myapp://` nije vezana za jednu aplikaciju: druga aplikacija na istom uređaju može da je prisvoji i primi token. Zato Hivesigner odbija sopstvene šeme i tokene šalje samo na https adresu ili na povratnu petlju na uređaju same osobe.

Izvorna aplikacija umesto toga koristi jedan od ovih puteva:

- **https vezu koja joj pripada.** Registrujte povratnu adresu na svom domenu koju operativni sistem otvara u vašoj aplikaciji (App Links na Androidu ili Universal Links na iOS-u).
- **Povratnu adresu na povratnoj petlji.** Aplikacija osluškuje preusmeravanje na `127.0.0.1`. Registrujte `http://127.0.0.1/auth` (ili `localhost`) i pri radu koristite bilo koji slobodan port: port ne mora da se poklapa.

## Tajna klijenta {#client-secret}

Tajna klijenta dokazuje da razmena koda dolazi sa vašeg servera. Za [tok sa kodom](/docs/oauth2#code-flow) je obavezna: vaš server je šalje sa svakim kodom ili tokenom za osvežavanje na `/api/oauth2/token`. Tok sa tokenom je ne koristi.

- **Napravite dugačku nasumičnu vrednost**, na primer pomoću `openssl rand -hex 32`.
- **Postavite je na stranici profila.** Hivesigner čuva samo njen sha256 otisak, u profilu naloga vaše aplikacije. Ako polje ostavite prazno, ostaje dosadašnja tajna.
- **Držite je na svom serveru.** Nikada je ne stavljajte na veb stranicu, u mobilnu aplikaciju ni u adresu.
- **Da biste je promenili,** postavite novu i istovremeno osvežite svoj server.

## Dajte @hivesigner ovlašćenje za objavljivanje {#grant-hivesigner}

API emituje ključem za objavljivanje naloga @hivesigner. Hive prihvata taj potpis za vaše korisnike samo kada je nalog vaše aplikacije dodao @hivesigner u svoje ovlašćenje za objavljivanje. Pogledajte [Lanac ovlašćenja za objavljivanje](/docs/how-it-works#authority-chain).

1. Izaberite nalog svoje aplikacije u Hivesigner-u.
2. Otvorite https://hivesigner.com/authorize/hivesigner.
3. Na stranici piše «Ovlasti @hivesigner» i «@hivesigner će moći da objavljuje, komentariše, glasa i prati u ime naloga @myapp.». Izaberite **Ovlasti**. Za to je potreban aktivni ključ naloga aplikacije.

To radite jednom. Bez toga svako emitovanje ne uspeva uz `unauthorized_client` i poruku «Broadcaster account doesn't have permission to broadcast for @myapp». Aplikaciji koja samo prijavljuje to ne treba.

Ovo odobrenje omogućava i nalogu @hivesigner da objavljuje kao sam nalog vaše aplikacije, što je još jedan razlog da nalog aplikacije držite samo za aplikaciju.

Aplikacije koje sa ovim odobrenjem emituju preko Hivesigner-a mogu da se pojave na spisku aplikacija na https://hivesigner.com/apps, poređane po tome koliko ih ljudi koristi.

## Šta ljudi vide kada nešto nije u redu {#refused-requests}

Hivesigner odbija zahtev na koji ne može bezbedno da odgovori. Prikazuje poruku i dugme **Prijavi ovaj problem**. Takav zahtev ne može da se odobri. Na vašu povratnu adresu ne stiže ništa.

| Problem | Šta osoba čita |
| --- | --- |
| `redirect_uri` nije nijedna od vaših URI adresa za preusmeravanje | «URL za preusmeravanje ove aplikacije nije registrovan. Radi vaše bezbednosti, prijava je blokirana.» |
| `client_id` nije Hive nalog | «@myapp nije Hive nalog, pa nema aplikacije koju treba ovlastiti. Vratite se na sajt i pokušajte ponovo.» |
| Nalog nije označen kao aplikacija | «@myapp nije podešen kao aplikacija, pa ne može da vas prijavi. Vratite se na sajt i pokušajte ponovo.» Uključite **Ovaj nalog je aplikacija**, kao gore. |
| U zahtevu nema `redirect_uri` | «Ovaj zahtev za ovlašćenje je nepotpun: u njemu nije navedena aplikacija ili URL za preusmeravanje. Vratite se u aplikaciju i pokušajte ponovo.» |

Ako vaši korisnici prijave neki od ovih slučajeva, uporedite `redirect_uri` koji vaša aplikacija šalje sa svojim URI adresama za preusmeravanje, znak po znak.

## Spisak provera {#checklist}

1. Hive nalog za aplikaciju, dodat u Hivesigner sa njegovim aktivnim ključem.
2. Na https://hivesigner.com/profile: «Ovaj nalog je aplikacija» uključeno, URI adrese za preusmeravanje navedene, tajna klijenta postavljena ako koristite tok sa kodom.
3. @hivesigner ovlašćen na https://hivesigner.com/authorize/hivesigner, ako emitujete preko API-ja.
4. Veza za prijavu koja šalje tačno jednu od vaših URI adresa za preusmeravanje. Pogledajte [Prijava preko OAuth2](/docs/oauth2).
