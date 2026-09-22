Aplikacje mogą poprosić Cię o podpisanie transakcji Hive: głosu, przelewu albo wpisu. Wysyłają link, który otwiera Hivesigner. Hivesigner pokazuje prostymi słowami, co robi żądanie, jakiego klucza wymaga i dokąd wyśle Cię potem. Nic nie zostaje podpisane, dopóki nie zatwierdzisz. Aplikacje mogą też poprosić o podpisanie wiadomości, która nigdy nie trafia do blockchainu.

## Ekran „Potwierdź transakcję” {#confirm-screen}

Link podpisu otwiera ekran zatytułowany „Potwierdź transakcję”. Pokazuje jedną kartę na każdą operację w żądaniu. Operacja to jedno działanie w Hive, na przykład jeden głos albo jeden przelew.

Gdy żądanie zawiera więcej niż jedną operację, karty są numerowane, a wiersz nad nimi mówi „To żądanie zawiera 3 operacji. Sprawdź każdą z nich przed zatwierdzeniem.”

### Podsumowanie {#summary}

Każda karta zaczyna się zdaniem opisującym, co robi operacja, z wartościami z żądania. Na przykład:

| Operacja | Co mówi karta |
| --- | --- |
| Przelew | Przelew 1.000 HIVE do @bob (a pod spodem notatka, w postaci Notatka: ...) |
| Głos | Głos za: @alice/moj-wpis (a pod spodem waga głosu, na przykład 100%) |
| Wpis albo odpowiedź | Publikacja wpisu „Mój tytuł” albo Odpowiedź na @alice/moj-wpis |
| Działanie zdefiniowane przez aplikację Hive | Niestandardowa akcja (follow) |
| Zmiana tego, kto kontroluje konto | Aktualizacja uprawnień konta |

Pozostałe operacje pokazują swoją nazwę, na przykład „Zasilenie Hive Power (power up)” albo „Delegowanie Hive Power”.

Obok zdania etykieta wielkimi literami pokazuje klucz, którego wymaga operacja: PUBLIKOWANIE, AKTYWNY albo WŁAŚCICIEL.

### Szczegóły {#details}

Pod zdaniem karta wymienia wartości, które niesie operacja:

- konto, w którego imieniu działa operacja
- dla wpisu albo komentarza: permlink (adres wpisu), społeczność lub tag, treść i metadane
- dla niestandardowej akcji: każdą wartość jej danych, po jednej w wierszu, żeby nic nie zostało ucięte
- dla zmiany uprawnień: próg, klucze i konta, które ustawia

Zmiana uprawnień mówi też, kiedy usunęłaby Twoje klucze, wierszem „klucze: BRAK (Twój klucz zostanie usunięty)”. Brakujący próg pokazuje się jako „próg NIEUSTAWIONY (liczony jako 0)”.

W podsumowaniu i w szczegółach znaki, które mogłyby ukryć tekst albo zmienić jego kierunek, pokazywane są jako `�`. To, co czytasz, nie może udawać czegoś innego.

**Pokaż surową operację** (albo **Pokaż surowe operacje**) otwiera dokładnie te operacje, które zostaną podpisane.

Gdy kwota podana jest w Hive Power, Hivesigner przelicza ją po aktualnym kursie. Pokazuje „Wczytywanie aktualnego kursu HIVE Power…” i czeka na ten kurs, zanim pozwoli zatwierdzić.

Niektóre żądania niosą transakcję przygotowaną gdzie indziej, na przykład dla konta kontrolowanego przez kilka osób. Ekran mówi wtedy „To żądanie zawiera własny nagłówek transakcji. Wygasa: DATA.” Jeśli inni już ją podpisali, dodaje „Ma już 2 podpisu.”

## Jakiego klucza wymaga {#which-key}

Pod kartami jeden wiersz wskazuje klucz potrzebny całemu żądaniu: „Podpis Twoim kluczem publikowania”, „Podpis Twoim kluczem aktywnym” albo „Podpis Twoim kluczem właściciela”.

Hivesigner podpisuje dokładnie tym kluczem. Klucz aktywny nie podpisze głosu, a klucz właściciela nie podpisze przelewu. To zasada Hive obowiązująca od hard forka w 2025 roku. Zobacz [Który klucz dodać](/docs/accounts#which-key).

Wszystkie operacje w jednym żądaniu muszą wymagać tego samego klucza. Gdy tak nie jest, wiersz mówi „Ta transakcja wymaga więcej niż jednego uprawnienia i nie może zostać podpisana jednym kluczem.” Nie ma przycisku zatwierdzenia. Wróć do aplikacji.

Żądania z kluczem właściciela zdarzają się rzadko. Zmieniają to, kto może kontrolować albo odzyskiwać Twoje konto. Przeczytaj je dwa razy. Zobacz [Czytaj przed zatwierdzeniem](/docs/safety#read-before-approving).

### Gdy brakuje klucza {#missing-key}

Jeśli wybrane konto nie ma tego klucza na tym urządzeniu, ekran to powie. Na przykład: „To wymaga Twojego klucza aktywnego, którego konto @UŻYTKOWNIK nie ma tutaj zapisanego.”

1. Wybierz **Dodaj kolejne konto** pod komunikatem. Otworzy się formularz **Dodaj konto**.
2. Wpisz tę samą nazwę użytkownika i brakujący klucz. Jeśli konto ma kod dostępu, wpisz również jego.
3. Wybierz **Dodaj konto**. Hivesigner doda klucz i wróci z Tobą do żądania.

Jeśli konto jest zablokowane, ekran pokazuje pole **Kod dostępu** nad przyciskiem. Jedno kliknięcie odblokowuje konto i zatwierdza. Jeśli okaże się, że klucza brakuje, ekran powie o tym po odblokowaniu.

Jeśli ta przeglądarka nie ma jeszcze żadnego konta, przycisk brzmi **Dalej** i otwiera formularz **Dodaj konto**.

## Zatwierdzanie albo podpisywanie {#approve}

Wiersz konta nad przyciskiem mówi „Podpisujesz jako” i wskazuje konto, które podpisuje. **Przełącz konto** pozwala wybrać inne. Zobacz [Przełączanie kont](/docs/accounts#switch-accounts).

- **Zatwierdź** podpisuje transakcję w Twojej przeglądarce i wysyła ją do sieci Hive. Wynik brzmi „Transakcja została rozgłoszona w sieci” wraz z **Identyfikatorem transakcji**, który otwiera ją w eksploratorze bloków.
- **Podpisz** pojawia się zamiast tego, gdy żądanie prosi tylko o podpis. Hivesigner podpisuje transakcję, nie wysyłając jej do sieci. Przekazuje podpis aplikacji albo pokazuje go, gdy żądanie nie wskazuje żadnej witryny.

Jeśli sieć odrzuci transakcję, zobaczysz „Twoja transakcja nie została rozgłoszona w sieci” wraz z „Komunikatem błędu” od sieci. Możesz spróbować ponownie.

## Witryna, do której wracasz {#return-site}

Gdy żądanie wskazuje witrynę powrotną, komunikat u góry mówi „Nastąpi przekierowanie na adres HOST.” Po zatwierdzeniu Hivesigner wyśle Cię tam. Sprawdź, czy HOST to witryna, z której przyszedłeś.

Gdy żądanie nie wskazuje żadnej witryny, Hivesigner zostaje na ekranie wyniku.

## Żądanie dla innego konta {#another-account}

Żądanie może dotyczyć konta innego niż wybrane. Hivesigner pokazuje to na dwa sposoby.

**Żądanie musi podpisać inne konto.** Ekran mówi „To żądanie musi zostać podpisane przez @KONTO. Przełącz się na to konto.” Wiersz konta brzmi „Wybrane konto”, a pod nim otwiera się lista kont. Wybierz tamto konto albo dodaj je przez **Dodaj kolejne konto**. Żadnym innym kontem Hivesigner tego żądania nie podpisze.

**Operacja działa w imieniu innego konta.** Zdarza się to przy kontach, którymi zarządza kilka osób. Ostrzeżenie u góry mówi „To żądanie nie działa w imieniu @UŻYTKOWNIK, lecz w imieniu @KONTO. Kontynuuj tylko wtedy, gdy zarządzasz także tym kontem.” Szczegóły każdej karty wskazują konto, w którego imieniu działa.

## Żądania, których Hivesigner nie potrafi odczytać {#invalid-requests}

Hivesigner nigdy nie podpisuje żądania, którego nie potrafi w całości odczytać i pokazać. Dotyczy to operacji, której nie zna, żądania bez operacji, wartości niepasującej do operacji (liczby, która nie jest liczbą, źle zapisanej kwoty) i dodatkowych danych, których nie umie wyświetlić.

Ekran mówi wtedy „Ups, coś poszło nie tak. Przekazane dane są nieprawidłowe.” Wróć do aplikacji. Żeby powiadomić zespół Hivesigner, wybierz **Zgłoś ten problem**.

## Żądania podpisania wiadomości {#message-requests}

Niektóre aplikacje proszą o podpisanie wiadomości zamiast transakcji, na przykład żeby potwierdzić, że konto należy do Ciebie. Wiadomość to tekst. Jej podpisanie niczego nie zmienia w blockchainie.

Ekran pokazuje:

- Nagłówek w rodzaju „APLIKACJA prosi Cię o podpisanie wiadomości.” Gdy aplikacja ma konto Hive, wiersz poniżej je wskazuje: „Konto Hive @KONTO_APLIKACJI”.
- „Przekieruje Cię na adres HOST”: witryna, która dostanie podpis. Ten sam wiersz pojawia się jeszcze raz obok przycisku.
- **Wiadomość**: cały tekst, dokładnie taki, jaki zostanie podpisany. Znaki, które mogłyby ukryć tekst albo zmienić jego kierunek, pokazywane są jako wyróżnione kody, na przykład `\u{200B}`.
- Używany klucz: „Podpis Twoim kluczem publikowania” albo „Podpis Twoim kluczem aktywnym”. Hivesigner nigdy nie podpisuje wiadomości kluczem właściciela.
- Ostrzeżenie: „Twój podpis dowodzi każdemu, kto go zobaczy, że @UŻYTKOWNIK podpisał dokładnie ten tekst. Podpisuj tylko wiadomość, którą rozumiesz.”
- Wiersz konta, „Podpisujesz jako”, z linkiem **Przełącz konto**.

Wybierz **Podpisz**, żeby podpisać. Hivesigner odeśle Cię do witryny wraz z podpisem, Twoją nazwą użytkownika, rodzajem klucza i kluczem publicznym, którym podpis powstał. Klucz publiczny to ta połowa pary kluczy, którą można się dzielić: niczego nią nie podpiszesz.

Wybierz **Anuluj**, żeby przejść na swoją stronę **Konta**. Witryna nie dostanie niczego.

Jeśli konto nie ma tego klucza na tym urządzeniu, ekran to powie. Na przykład: „To wymaga Twojego klucza publikowania, którego konto @UŻYTKOWNIK nie ma tutaj zapisanego.” Wybierz **Przełącz konto**, a potem **Dodaj kolejne konto**. [Dodaj brakujący klucz](/docs/accounts#add-a-key) do tego samego konta. Hivesigner wróci z Tobą do żądania.

### Dlaczego niektóre wiadomości są odrzucane {#refused-messages}

**Wiadomość, która działa jak logowanie do Hivesigner.** Pewien tekst ma dokładnie postać logowania Hivesigner. Podpisanie go dałoby witrynie dostęp do Twojego konta. Hivesigner nigdy nie podpisuje takiego tekstu i mówi „Ta wiadomość jest tokenem Hivesigner. Jej podpisanie dałoby witrynie dostęp do Twojego konta, dlatego nie można jej podpisać.”

**Żądanie, z którego Hivesigner nie może skorzystać.** Hivesigner odrzuca żądanie bez wiadomości albo bez adresu powrotnego. Odrzuca też żądanie o klucz inny niż publikowania lub aktywny, takie, które jako aplikację wskazuje coś, co nie jest kontem Hive, oraz takie, którego adres powrotny nie jest bezpieczny albo nie jest zarejestrowany dla aplikacji. Mówi wtedy „Tego żądania podpisu nie można użyć: potrzebuje wiadomości, klucza publikowania lub aktywnego oraz bezpiecznego adresu przekierowania zarejestrowanego dla aplikacji. Wróć do witryny i spróbuj ponownie.”

Jeśli Hivesigner nie potrafi odczytać danych aplikacji z sieci Hive, mówi „Nie udało się wczytać danych konta z sieci Hive.” Dopóki nie może, niczego nie podpisuje. Wybierz **Ponów**.

## Podpisanie wiadomości samodzielnie {#sign-message}

Możesz podpisać wiadomość samodzielnie, żeby udowodnić, że kontrolujesz konto.

1. Otwórz [hivesigner.com/signmessage](https://hivesigner.com/signmessage). Stopka prowadzi tam pod pozycją **Podpisz wiadomość**.
2. Jeśli wybrane konto jest zablokowane, wpisz jego kod dostępu i wybierz **Odblokuj**. Jeśli nie wybrano żadnego konta, strona odsyła do Twoich kont.
3. Wpisz tekst w polu **Wiadomość**. Hivesigner usuwa spacje i znaki nowego wiersza z początku i końca.
4. Wybierz klucz w polu **Klucz do podpisu**. Wymienia ono klucze wybranego konta obecne na tym urządzeniu, od najsilniejszego. Najsilniejszy jest wybrany na początku. Zmień go na **Publikowanie**, chyba że potrzebujesz innego.
5. Wybierz **Podpisz wiadomość**.

**Podsumowanie podpisu** pokazuje **Autor**, **Użyte uprawnienie**, **Token weryfikacyjny** i **Link weryfikacyjny**. Token weryfikacyjny łączy w jednym tekście wiadomość, Twoją nazwę użytkownika i podpis. Przekaż link albo token osobie, która ma sprawdzić wiadomość.

Podpis nie ujawnia Twojego klucza. Pokazuje jednak, którym kluczem powstał.

## Weryfikacja wiadomości {#verify-message}

1. Otwórz [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage). Stopka prowadzi tam pod pozycją **Zweryfikuj wiadomość**.
2. Wklej token w pole **Token weryfikacyjny** i wybierz **Zweryfikuj podpis**.

Link weryfikacyjny otwiera tę stronę i sprawdza wiadomość samodzielnie.

Wynik mówi „Podpis jest prawidłowy dla UŻYTKOWNIK” albo „Nie udało się zweryfikować podpisu kluczami konta.” Poniżej widzisz **Autor**, **Odtworzony klucz publiczny**, **Dopasowane uprawnienie** (rodzaj klucza, który podpisał) i **Wiadomość**.

Hivesigner sprawdza podpis względem kluczy, które konto ma teraz w sieci Hive. Wiadomość podpisana kluczem, który konto od tego czasu wymieniło, nie przechodzi już weryfikacji.
