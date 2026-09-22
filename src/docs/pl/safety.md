Twoje klucze Hive kontrolują Twoje konto. Każdy, kto je ma, może działać w Twoim imieniu. Hivesigner trzyma je w Twojej przeglądarce i pokazuje Ci, co podpisujesz. Te nawyki utrzymają je w bezpieczeństwie.

## Najpierw sprawdź adres {#check-the-address}

Zanim wpiszesz klucz albo kod dostępu, spójrz na pasek adresu przeglądarki. Musi być w nim `https://hivesigner.com`.

- Fałszywa strona kopiuje wygląd Hivesigner, a nie jego adres. Przeczytaj cały adres: `hivesigner.com.example.net` to nie hivesigner.com.
- Zwracaj uwagę na dodatkowe słowo, brakującą lub zamienioną literę albo inną końcówkę.
- Hivesigner pokazuje adres, pod którym działa, na swoim górnym pasku. Fałszywa strona może wpisać tam dowolny tekst, dlatego ufaj paskowi adresu przeglądarki.
- Żeby dodać klucz, wpisz adres samodzielnie albo skorzystaj z zakładki. Nie klikaj linku z wiadomości, reklamy ani wyniku wyszukiwania.

## Czego nigdy nie trzeba podawać {#never-needed}

- Logowanie, publikowanie, głosowanie, operacje portfela i autoryzowanie aplikacji nigdy nie wymagają hasła głównego ani klucza właściciela. Zobacz [Który klucz dodać](/docs/accounts#which-key).
- Aplikacje korzystające z Hivesigner nigdy nie potrzebują Twoich kluczy. Wysyłają Cię na hivesigner.com. Twoje klucze zostają w Twojej przeglądarce. Witryna, która prosi o wpisanie klucza na własnej stronie, nie pyta o niego przez Hivesigner.
- Nigdy nie przekazuj kluczy ani kodu dostępu nikomu, kto o nie prosi: ani na czacie, ani mailem, ani w zgłoszeniu do pomocy technicznej.

## Dodawaj tylko potrzebne klucze {#only-the-keys-you-need}

- Do codziennego użytku dodaj klucz publikowania.
- Klucz aktywny dodawaj tylko do operacji portfela, do pierwszej autoryzacji aplikacji albo żeby cofnąć uprawnienia aplikacji.
- Unikaj dodawania hasła głównego. Jeśli je dodasz, Hivesigner zapisze każdy klucz, który z niego wynika, łącznie z kluczem właściciela.

Po pierwszej autoryzacji aplikacji klucz aktywny zostaje na tym urządzeniu. Żeby zostawić tu tylko klucz publikowania, [usuń konto](/docs/accounts#remove-account). Potem [dodaj je ponownie](/docs/accounts#add-account), wyłącznie z kluczem publikowania.

## Używaj kodu dostępu {#use-a-passcode}

Bez kodu dostępu Hivesigner przechowuje Twoje klucze w tej przeglądarce bez szyfrowania. Sam je otwiera przy każdym uruchomieniu, więc każdy, kto korzysta z tej przeglądarki, może podpisywać w Twoim imieniu. Strona **Konta** oznacza takie konto etykietą **Bez kodu dostępu**.

- Wybierz kod dostępu, którego inni nie odgadną. Hivesigner przyjmuje 4 znaki lub więcej. Dłuższy jest trudniejszy do odgadnięcia.
- Nie używaj jako kodu dostępu hasła głównego Hive ani żadnego ze swoich kluczy.

Na komputerze, z którego korzystają też inne osoby:

- Zawsze ustawiaj kod dostępu.
- Zamykaj kartę Hivesigner, gdy skończysz. Odblokowane konto pozostaje odblokowane w tej karcie, dopóki jej nie zamkniesz lub nie przeładujesz.
- Na cudzym komputerze [usuń konto](/docs/accounts#remove-account), zanim odejdziesz. Jeszcze lepiej: w ogóle nie dodawaj tam swoich kluczy.

## Czytaj przed zatwierdzeniem {#read-before-approving}

- **Sprawdź konto.** Wiersz „Logujesz się jako”, „Autoryzujesz jako” albo „Podpisujesz jako” wskazuje konto, które odpowiada. Zmień je, jeśli jest niewłaściwe.
- **Sprawdź, dokąd trafisz dalej.** „Przekieruje Cię na adres HOST” i „Nastąpi przekierowanie na adres HOST.” wskazują witrynę, która otrzyma wynik. Powinna to być witryna, z której przyszedłeś.
- **Sprawdź, kto prosi.** Aplikacja sama wybiera swoją wyświetlaną nazwę. Wiersz „Konto Hive @KONTO_APLIKACJI” pokazuje jej prawdziwe konto Hive. Na stronie autoryzacji lub cofania uprawnień Hivesigner pisze o profilu aplikacji: „Wszystkie powyższe informacje publikuje samo konto aplikacji. Hivesigner niczego z tego nie weryfikuje.”
- **Sprawdź klucz.** Głos, wpis albo obserwowanie wymagają klucza publikowania. Jeśli chciałeś zagłosować, a ekran prosi o klucz aktywny lub właściciela, żądanie robi coś innego. Zatrzymaj się.
- **Czytaj zmiany uprawnień.** „klucze: BRAK (Twój klucz zostanie usunięty)” oznacza, że zmiana usunęłaby Twój klucz z Twojego konta. Zatwierdzaj zmianę swoich kluczy tylko wtedy, gdy sam ją rozpocząłeś.
- **Czytaj ostrzeżenia.** „To żądanie nie działa w imieniu @UŻYTKOWNIK, lecz w imieniu @KONTO.” oznacza, że żądanie działa za inne konto.
- **Podpisuj tylko wiadomości, które rozumiesz.** Podpisana wiadomość dowodzi każdemu, że podpisałeś dokładnie ten tekst.

Wszystko, co pokazują ekrany podpisu, opisuje strona [Sprawdzanie i podpisywanie](/docs/signing).

## Jak rozpoznać fałszywą stronę {#spot-a-fake-page}

Strona, która wygląda jak Hivesigner, jest fałszywa, gdy:

- **Adres nie jest hivesigner.com.** To jedyny znak, który liczy się zawsze.
- **Odrzuca Twój klucz publikowania.** Prawdziwy Hivesigner przyjmuje klucz publikowania i loguje Cię nim. Strona, która upiera się przy haśle głównym albo kluczu właściciela, nie jest Hivesigner.
- **Nie zna kont, które dodałeś.** Przeglądarka trzyma dane każdej witryny osobno. Fałszywa witryna pod innym adresem nie widzi kont dodanych na hivesigner.com, więc znów prosi o klucz. Prawdziwy Hivesigner pamięta je w tej przeglądarce i pyta tylko o kod dostępu, jeśli go ustawiłeś. O klucz prosi wyłącznie wtedy, gdy żądanie potrzebuje klucza, którego nie ma na tym urządzeniu, i wtedy go nazywa. Na przykład: „To wymaga Twojego klucza aktywnego, którego konto @UŻYTKOWNIK nie ma tutaj zapisanego.”

Nowa przeglądarka albo nowe urządzenie też nie mają Twoich kont. Tam sprawdź adres, zanim dodasz konto.

Jeśli wpisałeś klucz na fałszywej stronie, uznaj go za skradziony. Zmień go w Hive tak szybko, jak się da.

## Kod jest otwarty {#open-source}

Kod Hivesigner jest publiczny pod adresem [github.com/ecency/hivesigner-ui](https://github.com/ecency/hivesigner-ui). Każdy może go przeczytać i sprawdzić, jak obchodzi się z Twoimi kluczami. Żeby zgłosić problem, otwórz issue na [github.com/ecency/hivesigner-ui/issues](https://github.com/ecency/hivesigner-ui/issues). Strona **Informacje** prowadzi tam pod pozycją **Zgłoś błąd**.
