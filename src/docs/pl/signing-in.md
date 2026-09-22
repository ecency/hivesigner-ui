Gdy aplikacja pozwala zalogować się przez Hivesigner, wysyła Cię na hivesigner.com wraz z żądaniem. Hivesigner pokazuje, kto pyta, o co prosi i które z Twoich kont odpowiada. Decydujesz właśnie tam. Aplikacja nigdy nie dostaje Twoich kluczy: dostaje dowód Twojej nazwy użytkownika, podpisany w Twojej przeglądarce.

## Ekran żądania {#request-screen}

Od góry do dołu ekran pokazuje:

- **Aplikację.** Jej obrazek i nagłówek. Gdy aplikacja po raz pierwszy prosi o dostęp do publikowania, nagłówek brzmi „APLIKACJA prosi o dostęp do Twojego konta.” W pozostałych przypadkach brzmi „Zaloguj się do aplikacji APLIKACJA”. Nazwę w nim wybiera sama aplikacja.
- **Konto Hive @KONTO_APLIKACJI.** Prawdziwe konto Hive tej aplikacji. Aplikacja może nazywać się dowolnie, ale tej nazwy nie zmieni. Sprawdź ją.
- **Przekieruje Cię na adres HOST.** Witryna, na którą Hivesigner odsyła Cię po zatwierdzeniu.
- **Zakres.** O co prosi aplikacja: [samo logowanie albo dostęp do publikowania](/docs/signing-in#scopes).
- **Wiersz konta.** „Autoryzujesz jako” albo „Logujesz się jako”, wraz z kontem, które otrzyma aplikacja, i linkiem **Przełącz konto**. Zobacz [Wybierz konto](/docs/signing-in#choose-account).
- **Przycisk.** **Autoryzuj** albo **Zaloguj się**. Jeśli konto jest zablokowane, nad przyciskiem pojawia się pole **Kod dostępu**, a jedno kliknięcie odblokowuje konto i kontynuuje działanie.
- **Anuluj.** Przenosi Cię na Twoją stronę **Konta**. Hivesigner nie wysyła aplikacji niczego.

Jeśli ta przeglądarka nie ma jeszcze żadnego konta, przycisk brzmi **Dalej**. Otwiera formularz **Dodaj konto** i potem wraca z Tobą do żądania. Zobacz [Dodawanie konta](/docs/accounts#add-account).

## Samo logowanie albo dostęp do publikowania {#scopes}

Aplikacja prosi o jedno z dwojga. Nie ma nic pośrodku.

### Samo logowanie {#sign-in-only}

**Zakres** pokazuje „Odczyt nazwy użytkownika Twojego konta”. Aplikacja dowiaduje się, którym kontem Hive jesteś, potwierdzonym Twoim podpisem. Nie dostaje żadnego prawa do działania w Twoim imieniu. Przycisk brzmi **Zaloguj się**.

O zalogowanie może też poprosić witryna, która nie ma własnego konta Hive. Jej ekran brzmi „Witryna HOST chce potwierdzić Twoją nazwę użytkownika Hive.” Takie żądanie to zawsze samo logowanie. Hivesigner nazywa witrynę jej adresem, bo ten adres jest jedyną rzeczą, którą możesz o niej sprawdzić.

### Dostęp do publikowania {#posting-access}

**Zakres** pokazuje „Z Twoim uprawnieniem do publikowania APLIKACJA będzie mogła:”, a dalej wyjaśnia, co to znaczy:

- **Publikować i komentować:** zamieszczać wpisy i komentarze w Twoim imieniu.
- **Głosować:** oddawać głosy za i przeciw Twoim kontem.
- **Obserwować i aktualizować Twój strumień:** obserwować, wyciszać i udostępniać w Twoim imieniu.

Uprawnienie do publikowania to ta część Twojego konta Hive, która odpowiada za codzienne działania. Zatwierdzenie dodaje konto Hive aplikacji do Twojego uprawnienia do publikowania. To jedno nadanie zapisane w blockchainie Hive, a nie lista osobnych uprawnień.

## Na co pozwala dostęp do publikowania {#what-posting-access-allows}

Z dostępem do publikowania aplikacja może robić w Twoim imieniu wszystko, co potrafi Twój klucz publikowania:

- zamieszczać, edytować i usuwać Twoje wpisy i komentarze
- głosować
- obserwować, wyciszać i udostępniać
- edytować Twój profil
- odbierać Twoje nagrody do Twojego portfela
- inne codzienne działania, z których korzystają aplikacje i gry w Hive

Nigdy nie może:

- ruszać Twoich środków: wysyłać HIVE ani HBD, zasilać ani wycofywać Hive Power, delegować Hive Power ani korzystać z Twoich oszczędności
- zmieniać Twoich kluczy ani tego, kto kontroluje Twoje konto
- dawać dostępu innym aplikacjom

> **Ostrzeżenie:** Autoryzuj tylko aplikacje, którym ufasz. Dostęp do publikowania trwa, dopóki go nie cofniesz. Jest zapisany w blockchainie Hive, a nie w Hivesigner: usunięcie konta z Hivesigner go nie kończy.

## Pierwsza autoryzacja aplikacji {#first-time}

Gdy po raz pierwszy dajesz aplikacji dostęp do publikowania, ekran pokazuje taki komunikat: „Pierwsza autoryzacja: konto @KONTO_APLIKACJI zostanie dodane w blockchainie do Twojego uprawnienia do publikowania, co jednorazowo wymaga Twojego klucza aktywnego. To konto będzie mogło publikować w Twoim imieniu, dopóki nie cofniesz uprawnienia.”

Zmiana tego, kto może publikować za Twoje konto, jest zmianą samego konta, więc wymaga klucza aktywnego. Jeśli nie ma go na tym urządzeniu, ekran poprosi o niego na miejscu:

1. Wklej klucz aktywny w pole **Klucz aktywny lub hasło główne dla @UŻYTKOWNIK**. Hivesigner sprawdzi go względem Twojego konta w sieci Hive i zapisze na tym urządzeniu obok pozostałych kluczy. Jeśli wkleisz hasło główne, Hivesigner zachowa z niego tylko klucz aktywny, a także klucz publikowania, jeśli tego urządzenia go nie ma.
2. Jeśli konto nie ma kodu dostępu, formularz zaproponuje **Chroń kodem dostępu (zalecane)**, domyślnie zaznaczone. Jeśli konto ma kod, a Hivesigner znów go potrzebuje, formularz poprosi o niego w polu **Kod dostępu dla @UŻYTKOWNIK**.
3. Wybierz **Dodaj klucz aktywny**, a potem **Autoryzuj**.

Hivesigner wyśle wtedy zmianę do sieci Hive prosto z Twojej przeglądarki. Poczeka, aż zmiana pojawi się w blockchainie, i dopiero potem odeśle Cię do aplikacji, już zalogowanego. Jeśli potrwa to zbyt długo, zobaczysz „Autoryzacja została wysłana, ale wciąż czeka na potwierdzenie. Spróbuj ponownie za chwilę.”

Klucz aktywny zostaje potem na tym urządzeniu. Żeby zostawić tu tylko klucz publikowania, zobacz [Dodawaj tylko potrzebne klucze](/docs/safety#only-the-keys-you-need).

## Autoryzacja aplikacji z katalogu {#directory}

Każda aplikacja na [hivesigner.com/apps](https://hivesigner.com/apps) otwiera stronę zatytułowaną „Autoryzuj @KONTO_APLIKACJI”. Pokazuje ona, co aplikacja publikuje o sobie, oraz zdanie „Konto @KONTO_APLIKACJI będzie mogło publikować, komentować, głosować i obserwować jako @UŻYTKOWNIK.”

Wybranie **Autoryzuj** daje aplikacji dostęp do publikowania od razu, tak jak ekran pierwszej autoryzacji. Wymaga to klucza aktywnego. Żadna aplikacja o to nie prosiła, więc korzystaj z tego tylko wtedy, gdy robisz to świadomie. **Anuluj** przenosi Cię na Twoją stronę **Konta**.

Jeśli Twoje konto już dało aplikacji dostęp do publikowania, strona pisze „Autoryzowano @KONTO_APLIKACJI.” i proponuje **Dalej**.

## Powrót do aplikacji {#coming-back}

Jeśli Twoje konto już dało aplikacji dostęp do publikowania, nic nowego nie zostaje nadane. Ekran jest krótszy:

- Nagłówek brzmi „Zaloguj się do aplikacji APLIKACJA”.
- Wiersz mówi „Aplikacja @KONTO_APLIKACJI została już wcześniej autoryzowana. Nie przyznajesz żadnych nowych uprawnień.”
- Wiersz konta brzmi „Logujesz się jako”.
- Przycisk brzmi **Zaloguj się**.

Potrzebujesz do tego tylko klucza publikowania (albo aktywnego). Jeśli w międzyczasie cofnąłeś uprawnienia aplikacji, znów pojawi się ekran pierwszej autoryzacji.

## Wybierz konto {#choose-account}

Wiersz konta wskazuje konto, które otrzyma aplikacja. Sprawdź go przed zatwierdzeniem, zwłaszcza gdy masz na tym urządzeniu kilka kont.

- Wybierz **Przełącz konto**, żeby otworzyć listę swoich kont na miejscu. Wskaż inne, a ekran przełączy się na nie.
- Wybierz **Dodaj kolejne konto** pod listą, żeby dodać konto, którego nie ma jeszcze na tym urządzeniu. Hivesigner wróci potem z Tobą do żądania.

Aplikacja może podpowiedzieć, którego konta użyć. Jeśli to konto jest na tym urządzeniu, Hivesigner je wybierze. Nadal możesz je zmienić.

## Kiedy Hivesigner odrzuca żądanie {#refused-requests}

Hivesigner nie pozwala zatwierdzić żądania, którego nie potrafi sprawdzić. Zamiast tego ekran pokazuje jeden z tych komunikatów:

| Komunikat | Co oznacza |
| --- | --- |
| „Adres przekierowania tej aplikacji nie jest zarejestrowany. Dla Twojego bezpieczeństwa logowanie zostało zablokowane.” | Adres powrotny nie jest jednym z tych, które aplikacja wpisała na swoim koncie Hive. |
| „@KONTO_APLIKACJI nie jest kontem Hive, więc nie ma aplikacji do autoryzacji. Wróć do witryny i spróbuj ponownie.” | Żądanie wskazuje aplikację, która nie istnieje. |
| „Ta witryna poprosiła o wysłanie danych logowania przez niezabezpieczony adres http://. Hivesigner wysyła je tylko przez https. Poproś witrynę o użycie bezpiecznego adresu.” | Adres powrotny nie jest bezpieczny. |
| „Ta witryna poprosiła o wysłanie danych logowania na adres, który nie jest adresem internetowym (URL). Wróć do witryny i spróbuj ponownie.” | Adres powrotny nie jest adresem internetowym. |
| „To żądanie autoryzacji jest niekompletne: nie wskazuje aplikacji lub adresu przekierowania. Wróć do aplikacji i spróbuj ponownie.” | W żądaniu brakuje części informacji. |

Wróć do aplikacji i spróbuj ponownie. Jeśli problem się utrzymuje, wybierz **Zgłoś ten problem**. Wyśle to link i Twoją opcjonalną notatkę do zespołu Hivesigner, z zamaskowanymi sekretami.

Jeśli Hivesigner nie może połączyć się z siecią Hive, pokazuje „Nie udało się wczytać danych konta z sieci Hive.” Wybierz **Ponów**.

## Podgląd i cofanie dostępu aplikacji {#remove-access}

1. Otwórz [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps). Stopka prowadzi tam pod pozycją **Autoryzowane aplikacje**.
2. Strona pokazuje „Aplikacje, które mogą publikować jako @UŻYTKOWNIK.” dla wybranego konta, a pod spodem kolejne aplikacje. Żeby zobaczyć aplikacje innego konta, wybierz je najpierw na stronie **Konta**.
3. Jeśli konto jest zablokowane, wpisz jego kod dostępu i wybierz **Odblokuj**.
4. Wybierz **Cofnij uprawnienia** obok aplikacji. Gdy klucz aktywny jest na tym urządzeniu, dostęp aplikacji znika od razu.

Lista pokazuje każde konto, które może samodzielnie publikować jako Twoje, łącznie z kontami dodanymi innymi narzędziami.

Cofnięcie uprawnień to zmiana Twojego konta w blockchainie Hive, więc jednorazowo wymaga klucza aktywnego. Jeśli nie ma go na urządzeniu, **Cofnij uprawnienia** otwiera stronę tej aplikacji („Cofnij uprawnienia aplikacji @KONTO_APLIKACJI”), która prosi o klucz aktywny na miejscu. Pisze na niej „Konto @KONTO_APLIKACJI nie będzie już mogło działać jako @UŻYTKOWNIK.” Dodaj klucz i wybierz **Cofnij uprawnienia**.

Gdy cofniesz uprawnienia aplikacji, Hivesigner usuwa jej konto z uprawnienia do publikowania Twojego konta (a także z uprawnienia aktywnego, jeśli tam jest). Od tej chwili aplikacja nie może już publikować, głosować ani działać w Twoim imieniu. Jeśli później znów poprosi o dostęp do publikowania, zobaczysz ekran pierwszej autoryzacji.

Cofnięcie uprawnień nie wylogowuje Cię z własnej witryny aplikacji. Wyloguj się tam osobno, jeśli chcesz.
