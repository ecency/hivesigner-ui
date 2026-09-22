Niektóre aplikacje muszą tylko wiedzieć, kim jest dana osoba w Hive. Nigdy nie publikują, nie głosują ani niczego w jej imieniu nie rozgłaszają. Hivesigner potrafi zalogować ludzi do takiej aplikacji bez żadnego uprawnienia do publikowania. Osoba dowodzi, że zarządza kontem Hive. Twoja aplikacja poznaje jego nazwę. Ta strona pokazuje dwa sposoby i to, jak bezpiecznie sprawdzić wynik.

## Dwa sposoby {#two-ways}

- **Z kontem aplikacji:** Twoja aplikacja ma własne konto Hive i prosi o `scope=login`. Token wskazuje Twoją aplikację.
- **Bez konta aplikacji:** witryna bez własnego konta Hive wysyła tylko `redirect_uri`. Token nie wskazuje żadnej aplikacji. Twoja witryna sprawdza go sama.

Żaden z tych sposobów nie wymaga zgody osoby ani konta Twojej aplikacji, więc na koncie osoby nic się nie zmienia. Hivesigner podpisuje logowanie kluczem publikowania albo kluczem aktywnym, gdy urządzenie nie ma klucza publikowania do tego konta.

## Z kontem aplikacji {#app-account}

1. [Zarejestruj aplikację](/docs/register-app): utwórz jej konto Hive i wypisz swoje adresy zwrotne. Nie potrzebujesz sekretu klienta ani zgody dla @hivesigner.
2. Wyślij osobę pod adres:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. Osoba widzi «Zaloguj się do aplikacji APP» z **Zakres** «Odczyt nazwy użytkownika Twojego konta». Wybiera **Zaloguj się**.
4. Hivesigner przekierowuje na Twój adres zwrotny:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [Porównaj `state`](/docs/oauth2#state), a potem sprawdź token. To token `login` wskazujący Twoją aplikację, więc zadziała każda z tych dróg:
   - wywołaj nim [`GET /api/me`](/docs/api#me), które odpowiada kontem w `user` i `scope` równym `["login"]`, a potem zdekoduj token i sprawdź `type` oraz `app` ([Zapytaj API](/docs/tokens#check-with-the-api));
   - albo [sprawdź go samodzielnie](/docs/tokens#check-it-yourself) z `type: 'login'` i nazwą swojej aplikacji.

Token `login` niczego nie rozgłosi: `/api/broadcast` odrzuca każdą operację wysłaną z nim.

## Bez konta aplikacji {#no-app-account}

1. Wyślij osobę na adres autoryzacji z `redirect_uri` i bez `client_id`:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   Adres zwrotny musi być `https://` albo `http://` na pętli zwrotnej (`localhost`, `127.0.0.1`, `[::1]`). Nie ma listy, w której się go rejestruje. Hivesigner pomija tu `scope` i `response_type`: odpowiedzią zawsze jest token logowania.

2. Osoba widzi «Witryna HOST chce potwierdzić Twoją nazwę użytkownika Hive.», gdzie HOST to host Twojego adresu zwrotnego. Wybiera **Zaloguj się**.
3. Hivesigner przekierowuje na Twój adres zwrotny:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [Porównaj `state`](/docs/oauth2#state), a potem sprawdź token samodzielnie. API nie przyjmuje tokenu, który nie wskazuje aplikacji, więc Twój serwer weryfikuje podpis wobec kluczy konta. Zobacz [Sprawdź samodzielnie](/docs/tokens#check-it-yourself), z `type: 'login'` i bez `app`.

Gdy adres zwrotny nie jest adresem sieciowym albo jest zwykłym `http://` poza pętlą zwrotną, Hivesigner odrzuca żądanie i wyjaśnia osobie dlaczego.

## Którego sposobu użyć {#which-one}

| | Z kontem aplikacji | Bez konta aplikacji |
| --- | --- | --- |
| Co widzi osoba | Nazwę, obraz i konto Hive Twojej aplikacji | Tylko host Twojej witryny |
| Przygotowanie | Konto Hive z wypisanymi adresami zwrotnymi | Żadne |
| Token wskazuje | Twoją aplikację | Żadnej aplikacji |
| Sprawdź token przez | `/api/me` albo własny kod | Własny kod |
| Dostęp do publikowania później | Tym samym kontem: poproś o `posting` i [udziel zgody @hivesigner](/docs/register-app#grant-hivesigner) | Najpierw potrzeba konta aplikacji |

Używaj konta aplikacji, gdy tylko możesz. Użytkownicy widzą nazwę i obraz Twojej aplikacji. Twój serwer może odrzucać tokeny utworzone dla innej aplikacji. Później możesz tym samym kontem przejść do dostępu do publikowania.

Drugiej drogi użyj, gdy Twoja witryna nie ma konta Hive i nie chce go mieć.

## Bezpiecznie sprawdź logowanie {#check-safely}

- **Zwiąż żądanie przez `state`.** Utwórz losową wartość dla każdego logowania, zapisz ją w sesji osoby, porównaj na swoim adresie zwrotnym i użyj jej raz. Zobacz [Chroń żądanie przez state](/docs/oauth2#state).
- **Sprawdź rodzaj.** Przyjmuj tylko `signed_message.type` równe `login`. Kod ani token odświeżania nie są logowaniem.
- **Sprawdź aplikację.** Z kontem aplikacji `signed_message.app` musi być Twoją aplikacją. Bez niego nie powinno być żadnego `app`.
- **Sprawdź wiek.** Token sprawdzasz zaraz po przekierowaniu, więc przyjmuj go tylko w ciągu kilku minut od jego `timestamp` (na przykład 5 minut, z minutą różnicy zegarów).
- **Każdego tokenu użyj raz.** Po udanym sprawdzeniu rozpocznij własną sesję (na przykład ciasteczko httpOnly) i wyrzuć token Hivesigner. Prowadź spis przyjętych tokenów, dopóki nie staną się zbyt stare, by przejść kontrolę wieku. Odrzucaj każdy, który zobaczysz ponownie.
- **Trzymaj token poza dziennikami.** Przychodzi w ciągu zapytania Twojego adresu zwrotnego. Zobacz [Trzymaj tokeny bezpiecznie](/docs/tokens#keep-tokens-safe).

## Przykłady {#examples}

Witryny takie jak https://hivesearcher.com i https://openhive.chat pozwalają ludziom logować się kontem Hive do funkcji, które zostają poza blockchainem, jak wyszukiwanie i czat. Muszą wiedzieć tylko, kim jest dana osoba, i nic więcej.
