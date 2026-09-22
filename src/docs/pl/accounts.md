Hivesigner podpisuje kluczami tych kont Hive, które do niego dodasz. Konto dodaje się raz w każdej przeglądarce, z której korzystasz. Hivesigner trzyma potem jego klucze w tej przeglądarce, zaszyfrowane kodem dostępu, jeśli go ustawisz.

## Dodawanie konta {#add-account}

1. Sprawdź, czy pasek adresu przeglądarki pokazuje `https://hivesigner.com`. Zobacz [Najpierw sprawdź adres](/docs/safety#check-the-address).
2. Otwórz [hivesigner.com/import](https://hivesigner.com/import). Jeśli ta przeglądarka nie ma jeszcze żadnego konta, przycisk **Skonfiguruj Hivesigner** na stronie głównej otwiera ten sam formularz.
3. W polu **Nazwa użytkownika** wpisz swoją nazwę użytkownika Hive małymi literami, bez `@`.
4. W polu **Klucz prywatny** wklej jeden ze swoich kluczy prywatnych. Najpierw przeczytaj [Który klucz dodać](/docs/accounts#which-key).
5. Zostaw zaznaczone **Chroń kodem dostępu (zalecane)** i wybierz **Kod dostępu**. Potrzeba co najmniej 4 znaków. Zobacz [Chroń je kodem dostępu](/docs/accounts#passcode).
6. Wybierz **Dodaj konto**.

Zanim cokolwiek zapisze, Hivesigner sprawdza klucz względem Twojego konta w sieci Hive. Porównuje publiczną część klucza z kluczami wskazanymi przez konto. Sam klucz prywatny nie jest nigdzie wysyłany. Jeśli takiej nazwy użytkownika nie ma w Hive albo klucz do niej nie należy, formularz pisze „Nieprawidłowa nazwa użytkownika lub klucz. Użyj hasła głównego albo jednego z kluczy: właściciela, aktywnego, publikowania lub notatki.”

Dodane konto staje się kontem wybranym: tym, którego Hivesigner używa na swoich ekranach. Jeśli trafiłeś do formularza z jakiegoś żądania, Hivesigner wróci z Tobą do tego żądania. W przeciwnym razie otworzy stronę **Konta**.

### Dodawanie kolejnego klucza do konta {#add-a-key}

Żeby dodać drugi klucz do konta, które już tu jest (na przykład klucz aktywny obok klucza publikowania), dodaj konto jeszcze raz z nowym kluczem. Hivesigner zachowa dotychczasowe klucze i dołoży nowy. Nowy klucz tej samej roli zastępuje poprzedni.

Jeśli konto ma kod dostępu, zostaw zaznaczone **Chroń kodem dostępu (zalecane)** i wpisz ten sam kod. Niczego innego Hivesigner nie przyjmie:

- Bez kodu dostępu formularz pisze „To konto jest chronione na tym urządzeniu. Wpisz jego kod dostępu, aby dodać klucz.”
- Z innym kodem pisze „Nieprawidłowy kod dostępu. Klucz nie został zapisany.”

## Który klucz dodać {#which-key}

Konto Hive ma kilka kluczy prywatnych. Każdy pozwala na inne działania. Otrzymałeś je od portfela albo aplikacji, w której zakładałeś konto Hive, zwykle na stronie kluczy lub hasła. Hivesigner nie może Ci ich pokazać.

| Klucz | Do czego używa go Hivesigner |
| --- | --- |
| Publikowania | Logowanie do aplikacji, głosowanie, wpisy i komentarze, obserwowanie, edycja profilu i odbieranie nagród. |
| Aktywny | Operacje portfela: przelewy, zasilanie i wycofywanie Hive Power, delegacje, oszczędności i konwersje. Głosy na świadków i propozycje. Pierwsza autoryzacja aplikacji i cofanie jej uprawnień. |
| Właściciela | Zmiana klucza właściciela albo konta odzyskiwania. Na co dzień nie jest potrzebny. |
| Notatki | Do niczego. Formularz go przyjmuje, ale konto, które ma tylko klucz notatki, nie zaloguje się: ekran żądania pokaże wtedy „Dodaj klucz publikowania lub klucz aktywny dla @UŻYTKOWNIK, aby kontynuować”. |

Do codziennego użytku dodaj klucz publikowania. Klucz aktywny dodawaj tylko wtedy, gdy potrzebujesz go do operacji portfela albo do pierwszej autoryzacji aplikacji. Gdy ekran potrzebuje klucza, którego nie ma na tym urządzeniu, powie o tym i pozwoli go dodać.

W polu **Klucz prywatny** działa też hasło główne. Hivesigner wyprowadzi z niego Twoje klucze i zapisze każdy, który wciąż pasuje do konta, łącznie z kluczem właściciela. Dodawanie kluczy osobno trzyma klucz właściciela z dala od tego urządzenia.

> **Uwaga:** Hivesigner podpisuje każdą transakcję dokładnie tym kluczem, którego ona wymaga. Wynika to z zasady Hive obowiązującej od hard forka w 2025 roku. Klucz aktywny nie może już podpisać działania na poziomie publikowania, takiego jak głos. Klucz właściciela nie może już podpisać operacji portfela. Dodaj klucz publikowania, nawet jeśli klucz aktywny jest już tutaj.

Logowanie do aplikacji jest czymś innym: to nie transakcja. Hivesigner loguje Cię kluczem publikowania, a gdy tego klucza nie ma na urządzeniu, kluczem aktywnym.

## Chroń je kodem dostępu {#passcode}

Kod dostępu to hasło, które wybierasz tylko dla tej przeglądarki. Nie jest Twoim hasłem Hive ani żadnym z Twoich kluczy. Hivesigner szyfruje nim klucze konta przed zapisaniem i pyta o niego ponownie, żeby je odszyfrować.

- Hivesigner nie przechowuje Twojego kodu dostępu i nigdzie go nie wysyła. Nikt nie odzyska go za Ciebie.
- Każde konto na tym urządzeniu ma własny kod dostępu. Możesz używać tego samego dla wszystkich.
- Dłuższy kod jest trudniejszy do odgadnięcia. Nie używaj jako kodu dostępu hasła głównego Hive ani żadnego ze swoich kluczy.

Bez kodu dostępu Hivesigner przechowuje klucze konta w tej przeglądarce bez szyfrowania. Sam je otwiera przy każdym uruchomieniu, więc każdy, kto korzysta z tej przeglądarki, może nimi podpisywać. Strona **Konta** oznacza takie konto etykietą **Bez kodu dostępu**.

Żeby nadać kod dostępu kontu, które go nie ma, dodaj konto jeszcze raz z jednym z jego kluczy i kodem dostępu. Hivesigner zaszyfruje wtedy tym kodem wszystkie klucze konta.

Żeby zmienić kod dostępu, [usuń konto](/docs/accounts#remove-account) i dodaj je ponownie z nowym kodem. Usunięcie kasuje z tej przeglądarki wszystkie klucze konta, więc dodaj każdy klucz jeszcze raz (klucz publikowania, a potem aktywny, jeśli go używasz).

## Odblokowanie konta {#unlock}

Konto z kodem dostępu jest zablokowane przy każdym otwarciu Hivesigner: w nowej karcie, po przeładowaniu albo gdy przysyła Cię aplikacja. Nie musisz odblokowywać go wcześniej. Ekran, który potrzebuje kluczy, pokazuje pole **Kod dostępu** nad własnym przyciskiem (na przykład **Zaloguj się**, **Zatwierdź** albo **Odblokuj**). Jedno kliknięcie odblokowuje konto i kontynuuje działanie.

Błędny kod pokazuje „Nieprawidłowy kod dostępu.” i nic nie zostaje podpisane.

Odblokowane klucze Hivesigner trzyma wyłącznie w pamięci, nigdy w magazynie przeglądarki. Konto pozostaje odblokowane w tej karcie, dopóki jej nie zamkniesz lub nie przeładujesz.

## Przełączanie kont {#switch-accounts}

Strona **Konta** wymienia konta z tego urządzenia od A do Z. Wybrane konto ma znacznik. Od 6 kont pole **Szukaj kont** filtruje listę.

Wybierz konto, żeby stało się kontem wybranym. Hivesigner nie pyta tu o kod dostępu. Pyta o niego ekran, który potrzebuje kluczy.

Na ekranie żądania wiersz wskazujący konto („Logujesz się jako”, „Autoryzujesz jako” albo „Podpisujesz jako”) ma link **Przełącz konto**. Otwiera tę samą listę na miejscu, więc możesz wybrać inne konto bez opuszczania żądania. **Dodaj kolejne konto** pod listą otwiera formularz **Dodaj konto** i potem wraca z Tobą do żądania.

## Usuwanie konta {#remove-account}

1. Otwórz stronę **Konta**.
2. Wybierz **✕** obok konta. Jego etykieta dla czytników ekranu brzmi **Usuń z Hivesigner @UŻYTKOWNIK**.
3. Potwierdź, gdy przeglądarka zapyta „Usunąć @UŻYTKOWNIK z tego urządzenia? Zapisane tutaj klucze tego konta zostaną usunięte.”

Usunięcie konta kasuje jego klucze tylko z tej przeglądarki. Twoje konto Hive się nie zmienia. Autoryzowane aplikacje zachowują dostęp, bo ten dostęp jest zapisany w blockchainie Hive. Jak go cofnąć, opisuje [Podgląd i cofanie dostępu aplikacji](/docs/signing-in#remove-access).

Jeśli usuniesz wybrane konto, wybranym stanie się inne konto na tym urządzeniu.

Jeśli przeglądarka nie pozwoli Hivesigner zapisać zmiany, zobaczysz „Usunięto tylko na tę sesję: pamięć przeglądarki jest niedostępna, więc to konto pojawi się ponownie po przeładowaniu strony.”

## Jeśli zapomnisz kodu dostępu {#forgotten-passcode}

Nikt nie potrafi odzyskać kodu dostępu, nawet Hivesigner. Twoje konto Hive nie jest tym dotknięte: kod chroni tylko kopię kluczy w tej przeglądarce.

1. [Usuń konto](/docs/accounts#remove-account) z tego urządzenia.
2. [Dodaj je ponownie](/docs/accounts#add-account) z jego kluczem i nowym kodem dostępu.

W blockchainie Hive nic się nie zmienia. Autoryzowane aplikacje zachowują dostęp.

## Gdzie przechowywane są Twoje klucze {#where-keys-are-stored}

Hivesigner przechowuje Twoje klucze tylko w tej przeglądarce, na tym urządzeniu, w pamięci, którą przeglądarka przeznacza dla hivesigner.com.

- Nie są synchronizowane. Inna przeglądarka, inny profil przeglądarki ani inne urządzenie ich nie mają. Dodaj konto także tam.
- Wyczyszczenie danych witryny albo danych przeglądania dla hivesigner.com usuwa je. Tak samo zamknięcie okna prywatnego.
- Hivesigner nie jest kopią zapasową. Przechowuj klucze albo hasło główne bezpiecznie w innym miejscu.
