Nekim aplikacijama treba samo da znaju ko je osoba na Hive-u. One nikada ne objavljuju, ne glasaju i ništa ne emituju u njeno ime. Hivesigner može da prijavi ljude u takvu aplikaciju bez ikakvog ovlašćenja za objavljivanje. Osoba dokazuje da upravlja Hive nalogom. Vaša aplikacija saznaje njegovo ime. Ova stranica pokazuje dva načina i kako bezbedno proveriti rezultat.

## Dva načina {#two-ways}

- **Sa nalogom aplikacije:** vaša aplikacija ima sopstveni Hive nalog i traži `scope=login`. Token navodi vašu aplikaciju.
- **Bez naloga aplikacije:** sajt bez sopstvenog Hive naloga šalje samo `redirect_uri`. Token ne navodi nijednu aplikaciju. Vaš sajt ga proverava sam.

Nijedan način ne traži odobrenje od osobe ni od naloga vaše aplikacije, pa se na nalogu osobe ništa ne menja. Hivesigner potpisuje prijavu ključem za objavljivanje, ili aktivnim ključem kada uređaj nema ključ za objavljivanje za taj nalog.

## Sa nalogom aplikacije {#app-account}

1. [Registrujte aplikaciju](/docs/register-app): napravite njen Hive nalog i navedite svoje povratne adrese. Ne trebaju vam tajna klijenta ni odobrenje za @hivesigner.
2. Pošaljite osobu na:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. Osoba vidi «Prijava na APP» uz **Opseg pristupa** «Pregled korisničkog imena vašeg naloga». Bira **Prijavi se**.
4. Hivesigner preusmerava na vašu povratnu adresu:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [Uporedite `state`](/docs/oauth2#state), pa proverite token. To je `login` token koji navodi vašu aplikaciju, pa radi bilo koji od ova dva puta:
   - pozovite njime [`GET /api/me`](/docs/api#me), koji odgovara nalogom u `user` i `scope` vrednošću `["login"]`, pa dekodirajte token i proverite `type` i `app` ([Pitajte API](/docs/tokens#check-with-the-api));
   - ili ga [proverite sami](/docs/tokens#check-it-yourself) sa `type: 'login'` i imenom vaše aplikacije.

Token `login` ne može ništa da emituje: `/api/broadcast` odbija svaku operaciju poslatu njime.

## Bez naloga aplikacije {#no-app-account}

1. Pošaljite osobu na adresu za ovlašćenje sa `redirect_uri` i bez `client_id`:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   Povratna adresa mora da bude `https://` ili `http://` na povratnoj petlji (`localhost`, `127.0.0.1`, `[::1]`). Ne postoji spisak u koji se registruje. Hivesigner ovde zanemaruje `scope` i `response_type`: odgovor je uvek token za prijavu.

2. Osoba vidi «HOST želi da potvrdi vaše Hive korisničko ime.», gde je HOST domaćin vaše povratne adrese. Bira **Prijavi se**.
3. Hivesigner preusmerava na vašu povratnu adresu:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [Uporedite `state`](/docs/oauth2#state), pa sami proverite token. API ne prihvata token koji ne navodi aplikaciju, pa vaš server proverava potpis prema ključevima naloga. Pogledajte [Proverite sami](/docs/tokens#check-it-yourself), sa `type: 'login'` i bez `app`.

Kada povratna adresa nije veb adresa ili je običan `http://` van povratne petlje, Hivesigner odbija zahtev i objašnjava osobi zašto.

## Šta koristiti {#which-one}

| | Sa nalogom aplikacije | Bez naloga aplikacije |
| --- | --- | --- |
| Šta osoba vidi | Ime, sliku i Hive nalog vaše aplikacije | Samo domaćina vašeg sajta |
| Priprema | Hive nalog sa navedenim povratnim adresama | Nikakva |
| Token navodi | Vašu aplikaciju | Nijednu aplikaciju |
| Token proverite preko | `/api/me` ili sopstvenog koda | Sopstvenog koda |
| Pristup objavljivanju kasnije | Istim nalogom: tražite `posting` i [dajte odobrenje nalogu @hivesigner](/docs/register-app#grant-hivesigner) | Prvo je potreban nalog aplikacije |

Koristite nalog aplikacije kad god možete. Ljudi vide ime i sliku vaše aplikacije. Vaš server može da odbije tokene napravljene za drugu aplikaciju. Kasnije možete istim nalogom preći na pristup objavljivanju.

Drugi put koristite kada vaš sajt nema Hive nalog i ne želi ga.

## Bezbedno proverite prijavu {#check-safely}

- **Povežite zahtev preko `state`.** Napravite nasumičnu vrednost za svaku prijavu, čuvajte je u sesiji osobe, uporedite je na svojoj povratnoj adresi i upotrebite je jednom. Pogledajte [Zaštitite zahtev preko state](/docs/oauth2#state).
- **Proverite vrstu.** Prihvatajte samo `signed_message.type` sa vrednošću `login`. Kod ili token za osvežavanje nije prijava.
- **Proverite aplikaciju.** Sa nalogom aplikacije `signed_message.app` mora da bude vaša aplikacija. Bez njega ne sme da postoji nikakav `app`.
- **Proverite starost.** Token proveravate odmah posle preusmeravanja, pa ga prihvatajte samo u roku od nekoliko minuta od njegovog `timestamp` (na primer 5 minuta, uz minut razlike u časovniku).
- **Svaki token upotrebite jednom.** Posle uspešne provere pokrenite sopstvenu sesiju (na primer httpOnly kolačić) i odbacite Hivesigner token. Vodite evidenciju prihvaćenih tokena dok ne postanu prestari da prođu proveru starosti. Odbijte svaki koji ponovo vidite.
- **Držite token van dnevnika.** Stiže u upitnom delu vaše povratne adrese. Pogledajte [Čuvajte tokene bezbedno](/docs/tokens#keep-tokens-safe).

## Primeri {#examples}

Sajtovi kao što su https://hivesearcher.com i https://openhive.chat dozvoljavaju ljudima da se prijave svojim Hive nalogom za mogućnosti koje ostaju van blokčejna, poput pretrage i ćaskanja. Njima treba samo da znaju ko je osoba i ništa više.
