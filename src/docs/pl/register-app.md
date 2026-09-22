Aplikacja, która loguje ludzi przez Hivesigner, jest kontem Hive. Jej nazwa to `client_id`, które wysyłasz. Jej profil zawiera ustawienia odczytywane przez Hivesigner: adresy zwrotne, na które mogą trafiać tokeny, oraz, dla przepływu z kodem, sekret klienta. Aby rozgłaszać przez API, konto aplikacji nadaje też uprawnienie do publikowania kontu @hivesigner. Ta strona przechodzi przez każdy krok.

## Czego potrzebujesz {#what-you-need}

| Chcesz | Konto aplikacji i adresy zwrotne | Sekret klienta | Zgoda dla @hivesigner |
| --- | --- | --- | --- |
| Logować ludzi i rozgłaszać przepływem z tokenem | Tak | Nie | Tak |
| Logować ludzi i rozgłaszać przepływem z kodem (tokeny odświeżania) | Tak | Tak | Tak |
| Tylko logować ludzi, tokenem wskazującym Twoją aplikację | Tak | Nie | Nie |
| Tylko logować ludzi, z witryny bez konta Hive | Nie | Nie | Nie |
| Wysyłać linki podpisu | Nie | Nie | Nie |

Do dwóch ostatnich wierszy zobacz [Logowanie bez dostępu do publikowania](/docs/login-only) i [Linki podpisu](/docs/sign-links).

## Utwórz konto aplikacji {#app-account}

1. Utwórz konto Hive dla swojej aplikacji, na przykład na https://ecency.com/signup. Użyj osobnego konta dla aplikacji, nie swojego prywatnego. Jego nazwa to Twoje `client_id`. Użytkownicy widzą ją na ekranie zgody obok «Konto Hive». Konta Hive nie da się przemianować, więc wybierz nazwę uważnie.
2. Dodaj konto do Hivesigner na https://hivesigner.com/import (**Dodaj konto**). Użyj klucza aktywnego albo hasła głównego: zgoda opisana niżej wymaga klucza aktywnego.

## Wypełnij ustawienia aplikacji {#app-settings}

Otwórz https://hivesigner.com/profile z wybranym kontem aplikacji i ustaw:

- **To konto jest aplikacją.** Włącz to. Oznacza konto jako aplikację, a właśnie to sprawdza API, zanim przyjmie dla niego kod albo token odświeżania.
- **Adresy URI przekierowania.** Twoje adresy zwrotne, po jednym w wierszu. Zobacz [Adresy zwrotne](#callbacks).
- **Twórca.** Kto utrzymuje aplikację. Katalog aplikacji na https://hivesigner.com/apps to pokazuje.
- **Status.** Produkcja albo piaskownica, na Twój własny użytek. Hivesigner traktuje oba tak samo.
- **Sekret klienta.** Potrzebny tylko do [przepływu z kodem](/docs/oauth2#code-flow). Zobacz [Sekret klienta](#client-secret).

Wypełnij też **Nazwa** i **URL zdjęcia profilowego**. Ekran zgody pokazuje obraz i nazwę Twojej aplikacji. Katalog aplikacji na https://hivesigner.com/apps pokazuje nazwę, **Opis** i **Strona internetowa**.

Zapis aktualizuje profil konta w blockchainie i wymaga jego klucza publikowania. Hivesigner odczytuje Twoje adresy zwrotne z konta, gdy otwiera się żądanie logowania, więc zmiana działa, gdy tylko transakcja trafi do bloku.

> **Uwaga:** Nazwę, obraz i opis publikuje samo konto Twojej aplikacji. Dlatego ekran zgody pokazuje też prawdziwą nazwę konta (`@myapp`) i host, na który wysyła osobę: to ich naprawdę używają zgoda i przekierowanie.

## Adresy zwrotne {#callbacks}

Adres zwrotny (czyli `redirect_uri` w żądaniu logowania) to miejsce, do którego Hivesigner odsyła osobę z tokenem albo kodem. Hivesigner wysyła go tylko na adres wypisany na koncie Twojej aplikacji.

### Zasady {#callback-rules}

- **Dokładna zgodność.** `redirect_uri` w żądaniu musi być jednym z Twoich adresów URI przekierowania, znak po znaku: schemat, host, port, ścieżka i zapytanie.
- **Tylko https.** Adres zwrotny musi używać `https://`. Zwykły `http://` jest przyjmowany tylko na pętli zwrotnej: `localhost`, `127.0.0.1` albo `[::1]`.
- **Porty pętli zwrotnej mogą się zmieniać.** Adres zwrotny pętli zwrotnej zarejestrowany ze zwykłym http pasuje do każdego hosta i portu pętli zwrotnej o tej samej ścieżce, zapytaniu, fragmencie i informacji o użytkowniku. Adres pętli zwrotnej zarejestrowany z `https://` pozostaje dokładną zgodnością.
- **Żadnych własnych schematów.** Adres taki jak `myapp://callback` zostaje odrzucony. Zobacz [Aplikacje mobilne i na komputer](#native-apps).
- **Żadnych fragmentów.** Nie dodawaj `#fragment` do adresu zwrotnego.

Strona profilu odmawia zapisania adresu zwrotnego, który nigdy nie mógłby zadziałać, i pokazuje «Nieprawidłowy adres zwrotny (wymagany https lub http na localhost)».

### Przykłady {#callback-examples}

Przy takich zarejestrowanych adresach URI przekierowania:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| `redirect_uri` w żądaniu | Wynik |
| --- | --- |
| `https://myapp.example/auth/callback` | Przyjęty: dokładna zgodność |
| `https://myapp.example/auth/callback/` | Odrzucony: nadmiarowy `/` |
| `https://myapp.example/auth/callback?next=home` | Odrzucony: inne zapytanie |
| `https://www.myapp.example/auth/callback` | Odrzucony: inny host |
| `http://myapp.example/auth/callback` | Odrzucony: zwykły http poza pętlą zwrotną |
| `http://localhost:3000/auth` | Przyjęty: dokładna zgodność |
| `http://127.0.0.1:51234/auth` | Przyjęty: pętla zwrotna, ta sama ścieżka, inny port |
| `http://[::1]:3000/auth` | Przyjęty: pętla zwrotna, ta sama ścieżka |
| `http://127.0.0.1:3000/other` | Odrzucony: inna ścieżka |
| `https://localhost:3000/auth` | Odrzucony: https nie pasuje do rejestracji ze zwykłym http |
| `myapp://auth` | Odrzucony: własny schemat |

Aby przyjmować zapytanie na swoim adresie zwrotnym, zarejestruj ten adres z dokładnie takim zapytaniem. Hivesigner zachowuje własne zapytanie Twojego adresu i dopisuje swoje parametry po nim.

### Aplikacje mobilne i na komputer {#native-apps}

Hivesigner umieszcza token w adresie zwrotnym. Własny schemat, taki jak `myapp://`, nie jest przypisany do jednej aplikacji: inna aplikacja na tym samym urządzeniu może go przejąć i odebrać token. Dlatego Hivesigner odrzuca własne schematy i wysyła tokeny tylko na adres https albo na pętlę zwrotną urządzenia danej osoby.

Aplikacja natywna korzysta zamiast tego z jednej z tych dróg:

- **Link https, który należy do niej.** Zarejestruj adres zwrotny w swojej domenie, który system operacyjny otwiera w Twojej aplikacji (App Links w Androidzie albo Universal Links w iOS).
- **Adres zwrotny na pętli zwrotnej.** Aplikacja nasłuchuje przekierowania na `127.0.0.1`. Zarejestruj `http://127.0.0.1/auth` (albo `localhost`) i użyj w czasie działania dowolnego wolnego portu: port nie musi się zgadzać.

## Sekret klienta {#client-secret}

Sekret klienta dowodzi, że wymiana kodu pochodzi z Twojego serwera. Jest obowiązkowy w [przepływie z kodem](/docs/oauth2#code-flow): Twój serwer wysyła go z każdym kodem albo tokenem odświeżania do `/api/oauth2/token`. Przepływ z tokenem go nie używa.

- **Utwórz długą losową wartość**, na przykład poleceniem `openssl rand -hex 32`.
- **Ustaw ją na stronie profilu.** Hivesigner przechowuje tylko jej skrót sha256, w profilu konta Twojej aplikacji. Pozostawienie pola pustego zachowuje obecny sekret.
- **Trzymaj go na swoim serwerze.** Nigdy nie umieszczaj go na stronie, w aplikacji mobilnej ani w adresie URL.
- **Aby go zmienić,** ustaw nowy i w tym samym momencie zaktualizuj swój serwer.

## Nadaj @hivesigner uprawnienie do publikowania {#grant-hivesigner}

API rozgłasza kluczem publikowania konta @hivesigner. Hive przyjmuje ten podpis dla Twoich użytkowników tylko wtedy, gdy konto Twojej aplikacji dodało @hivesigner do swojego uprawnienia do publikowania. Zobacz [Łańcuch uprawnienia do publikowania](/docs/how-it-works#authority-chain).

1. Wybierz konto swojej aplikacji w Hivesigner.
2. Otwórz https://hivesigner.com/authorize/hivesigner.
3. Strona pokazuje «Autoryzuj @hivesigner» oraz «Konto @hivesigner będzie mogło publikować, komentować, głosować i obserwować jako @myapp.». Wybierz **Autoryzuj**. Wymaga to klucza aktywnego konta aplikacji.

Robisz to raz. Bez tego każde rozgłoszenie kończy się błędem `unauthorized_client` i komunikatem «Broadcaster account doesn't have permission to broadcast for @myapp». Aplikacja, która tylko loguje, tego nie potrzebuje.

Ta zgoda pozwala też kontu @hivesigner publikować jako samo konto Twojej aplikacji, co jest kolejnym powodem, by konto aplikacji służyło wyłącznie aplikacji.

Aplikacje, które z tą zgodą rozgłaszają przez Hivesigner, mogą pojawić się w katalogu aplikacji na https://hivesigner.com/apps, uszeregowane według liczby użytkowników.

## Co widzą użytkownicy, gdy coś jest nie tak {#refused-requests}

Hivesigner odrzuca żądanie, na które nie może bezpiecznie odpowiedzieć. Pokazuje komunikat i przycisk **Zgłoś ten problem**. Żądania nie da się zatwierdzić. Na Twój adres zwrotny nic nie trafia.

| Problem | Co czyta osoba |
| --- | --- |
| `redirect_uri` nie jest jednym z Twoich adresów URI przekierowania | «Adres przekierowania tej aplikacji nie jest zarejestrowany. Dla Twojego bezpieczeństwa logowanie zostało zablokowane.» |
| `client_id` nie jest kontem Hive | «@myapp nie jest kontem Hive, więc nie ma aplikacji do autoryzacji. Wróć do witryny i spróbuj ponownie.» |
| Konto nie jest oznaczone jako aplikacja | «@myapp nie jest skonfigurowana jako aplikacja, więc nie może Cię zalogować. Wróć na stronę i spróbuj ponownie.» Włącz **To konto jest aplikacją**, tak jak wyżej. |
| W żądaniu brakuje `redirect_uri` | «To żądanie autoryzacji jest niekompletne: nie wskazuje aplikacji lub adresu przekierowania. Wróć do aplikacji i spróbuj ponownie.» |

Jeśli użytkownicy zgłoszą jeden z tych przypadków, porównaj `redirect_uri` wysyłany przez Twoją aplikację ze swoimi adresami URI przekierowania, znak po znaku.

## Lista kontrolna {#checklist}

1. Konto Hive dla aplikacji, dodane do Hivesigner z jego kluczem aktywnym.
2. Na https://hivesigner.com/profile: «To konto jest aplikacją» włączone, adresy URI przekierowania wypisane, sekret klienta ustawiony, jeśli używasz przepływu z kodem.
3. @hivesigner autoryzowany na https://hivesigner.com/authorize/hivesigner, jeśli rozgłaszasz przez API.
4. Link logowania, który wysyła dokładnie jeden z Twoich adresów URI przekierowania. Zobacz [Logowanie przez OAuth2](/docs/oauth2).
