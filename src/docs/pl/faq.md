Krótkie odpowiedzi na częste pytania. Każda prowadzi do strony ze szczegółami.

## Korzystanie z Hivesigner {#using-hivesigner}

### Czy Hivesigner jest darmowy? {#is-it-free}

Tak. Hivesigner nie pobiera opłat ani od użytkowników, ani od aplikacji. Jego kod źródłowy jest otwarty na licencji MIT.

### Czy Hivesigner kiedykolwiek widzi moje klucze? {#keys}

Nie. Twoje klucze zostają w Twojej przeglądarce, na Twoim urządzeniu. Hivesigner podpisuje właśnie tam. Nigdy nie trafiają na serwery Hivesigner ani do aplikacji, z których korzystasz. Zobacz [Gdzie przechowywane są Twoje klucze](/docs/accounts#where-keys-are-stored) i [Chroń swoje klucze](/docs/safety).

### Co, jeśli zapomnę kodu dostępu? {#forgotten-passcode}

Nikt nie potrafi odzyskać kodu dostępu, nawet Hivesigner. Usuń konto z Hivesigner i dodaj je ponownie, podając klucz Hive i nowy kod dostępu. Twoje konto Hive i autoryzowane aplikacje nie zmieniają się. Zobacz [Jeśli zapomnisz kodu dostępu](/docs/accounts#forgotten-passcode).

### Czy mogę używać Hivesigner na telefonie? {#phone}

Tak. Otwórz https://hivesigner.com w przeglądarce telefonu i dodaj tam swoje konto. Klucze są zapisywane tylko w tej przeglądarce, więc dodaj konto na każdym urządzeniu, z którego korzystasz. Zobacz [Dodawanie kont i zarządzanie nimi](/docs/accounts).

### Które aplikacje używają Hivesigner? {#which-apps}

Strona https://hivesigner.com/apps wymienia aplikacje, które rozgłaszają transakcje w Hive przez Hivesigner, od najczęściej używanych. Każda aplikacja sama publikuje swoją nazwę i opis. Hivesigner ich nie weryfikuje. Otwarcie tam aplikacji pokazuje stronę, na której można nadać jej dostęp do publikowania. Zobacz [Autoryzacja aplikacji z katalogu](/docs/signing-in#directory).

### Jak Hivesigner ma się do Hive Keychain? {#hive-keychain}

To osobne narzędzia. Hive Keychain to rozszerzenie przeglądarki i aplikacja mobilna. Hivesigner to witryna internetowa, więc nie ma nic do zainstalowania. Kiedy aplikacja prosi o podpisanie wiadomości, podpis jest tego samego rodzaju co ten z Hive Keychain, więc aplikacja sprawdza oba tym samym kodem. Token weryfikacyjny ze strony **Podpisz wiadomość** w Hivesigner sprawdza się na stronie **Zweryfikuj wiadomość** w Hivesigner. Zobacz [Podpisywanie wiadomości](/docs/message-signing).

## Tworzenie z Hivesigner {#building}

### Czy mogę użyć Hivesigner w aplikacji mobilnej? {#mobile-app}

Tak. Wyślij użytkownika do Hivesigner w przeglądarce i użyj adresu powrotnego, który Twoja aplikacja potrafi odebrać: linku https do domeny, którą kontrolujesz (Android App Links lub iOS Universal Links), albo adresu pętli zwrotnej, jak `http://127.0.0.1/auth`. Własne schematy w rodzaju `myapp://` są odrzucane. Zobacz [Aplikacje mobilne i desktopowe](/docs/register-app#native-apps).

### Czy potrzebuję konta aplikacji? {#app-account}

Potrzebujesz go, żeby logować ludzi z dostępem do publikowania i rozgłaszać transakcje przez API. Zobacz [Zarejestruj swoją aplikację](/docs/register-app). [Linki podpisu](/docs/sign-links) i [podpisywanie wiadomości](/docs/message-signing) działają bez niego. Tak samo [logowanie bez dostępu do publikowania](/docs/login-only).

### Czy API może wysyłać przelewy? {#transfers}

Nie. API rozgłasza tylko operacje na poziomie publikowania, takie jak głosy, komentarze i obserwowanie. Do przelewów i innych działań wymagających klucza aktywnego używaj [linków podpisu](/docs/sign-links): użytkownik zatwierdza każdy z nich własnym kluczem.

### Które języki mają SDK? {#languages}

Oficjalne SDK jest dla JavaScriptu. Dla Pythona istnieją biblioteki społeczności. Z REST API może korzystać dowolny język. Zobacz [SDK](/docs/sdk) i [REST API](/docs/api).

## Pomoc {#help}

### Gdzie mogę uzyskać pomoc? {#get-help}

Zapytaj na serwerze Discord HiveDevs: https://discord.gg/pNJn7wh. Zgłoś błąd jako issue w odpowiednim repozytorium GitHub: https://github.com/ecency/hivesigner-ui dla witryny, https://github.com/ecency/hivesigner-api dla API albo https://github.com/ecency/hivesigner-sdk dla SDK JavaScript. Na ekranie, który odrzuca żądanie, przycisk **Zgłoś ten problem** wysyła opis do zespołu Hivesigner.

### Jak mogę pomóc w rozwoju? {#contribute}

Hivesigner ma otwarty kod na GitHubie, w trzech repozytoriach powyżej. Otwórz issue z błędem albo pomysłem. Wyślij pull request z poprawką.
