Hivesigner pozwala ludziom korzystać z konta Hive w Twojej aplikacji bez przekazywania jej swoich kluczy. Składa się z dwóch części: podpisującego w przeglądarce pod adresem https://hivesigner.com oraz API pod adresem `https://hivesigner.com/api/`. Ta strona wyjaśnia, co robi każda część i na jakie dwa sposoby aplikacja z nich korzysta.

## Podpisujący w przeglądarce {#browser-signer}

Podpisujący w przeglądarce to sama witryna Hivesigner. Ludzie dodają tam swoje konta Hive. Ich klucze zostają w ich własnej przeglądarce: Hivesigner nie wysyła żadnego klucza na żaden serwer. Twoja aplikacja nigdy go nie widzi.

Podpisujący podpisuje trzy rodzaje rzeczy, za każdym razem dopiero wtedy, gdy osoba zobaczy, co podpisuje:

- **Tokeny logowania.** Twoja aplikacja wysyła kogoś do Hivesigner, aby się zalogował. Hivesigner pokazuje nazwę Twojej aplikacji i to, o co prosi. Gdy osoba zatwierdzi, Hivesigner podpisuje jej kluczem krótkie oświadczenie wskazujące jej konto i Twoją aplikację. To podpisane oświadczenie jest tokenem, który otrzymuje Twoja aplikacja. Zobacz [Logowanie przez OAuth2](/docs/oauth2) i [Tokeny](/docs/tokens).
- **Transakcje.** Link podpisu otwiera transakcję do przejrzenia. Gdy osoba zatwierdzi, Hivesigner podpisuje ją kluczem, który jest do tego potrzebny. Następnie wysyła ją do sieci Hive z przeglądarki, chyba że link prosi tylko o sam podpis. Zobacz [Linki podpisu](/docs/sign-links).
- **Wiadomości.** Twoja aplikacja może poprosić osobę o podpisanie tekstu jej kluczem, aby udowodniła, że zarządza kontem. Zobacz [Podpisywanie wiadomości](/docs/message-signing).

## API {#api}

API rozgłasza operacje publikowania w imieniu osoby zalogowanej w Twojej aplikacji: wpisy i komentarze, głosy, obserwacje oraz inne operacje `custom_json`, odbiór nagród i zmiany profilu. Twoja aplikacja wysyła operacje razem z tokenem tej osoby. API sprawdza token, podpisuje transakcję kluczem publikowania konta @hivesigner i rozgłasza ją w sieci Hive.

API zwraca też konto zalogowanej osoby, wymienia kody na tokeny i podaje listę aplikacji korzystających z Hivesigner. Zobacz [API REST](/docs/api).

## Łańcuch uprawnienia do publikowania {#authority-chain}

W Hive jedno konto może pozwolić innemu działać ze swoim uprawnieniem do publikowania. API opiera się na dwóch takich zgodach:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **Osoba dodaje konto Twojej aplikacji do swojego uprawnienia do publikowania.** Ekran zgody robi to za pierwszym razem, gdy ktoś zatwierdza dostęp do publikowania dla Twojej aplikacji. Wymaga to jednorazowo jej klucza aktywnego.
2. **Konto Twojej aplikacji dodaje @hivesigner do swojego uprawnienia do publikowania.** Robisz to raz, gdy [rejestrujesz aplikację](/docs/register-app#grant-hivesigner).

Przed rozgłoszeniem API sprawdza, czy obie zgody są na miejscu. Rozgłasza tylko operacje, których autorem jest osoba wskazana w tokenie.

Osoba może w każdej chwili odebrać dostęp Twojej aplikacji na stronie https://hivesigner.com/authorized-apps. Po tym API nie może już publikować w jej imieniu przez Twoją aplikację.

## Dwa sposoby integracji {#two-ways-to-integrate}

### Zaloguj, a potem rozgłaszaj przez API {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

Osoba zatwierdza raz. Potem Twoja aplikacja może w jej imieniu głosować, komentować i publikować bez ponownego pytania, dopóki token nie wygaśnie albo osoba nie odbierze dostępu. Użyj tej drogi do codziennych działań społecznościowych.

Potrzebujesz konta aplikacji z zarejestrowanymi adresami zwrotnymi i zgody dla @hivesigner. Zobacz [Zarejestruj aplikację](/docs/register-app). Jeśli chcesz tylko wiedzieć, kim jest osoba, zobacz [Logowanie bez dostępu do publikowania](/docs/login-only).

### Linki podpisu {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

Osoba widzi każdą transakcję, zanim zostanie podpisana. Linki podpisu obejmują 41 operacji Hive, w tym przelewy i inne działania portfela wymagające klucza aktywnego. API nigdy ich nie obsługuje. Do linków podpisu nie potrzebujesz konta aplikacji. Zobacz [Linki podpisu](/docs/sign-links).

### Co wybrać {#which-to-choose}

- **Częste działania publikowania** (głosy, komentarze, obserwacje): zaloguj osobę przez OAuth2, a potem korzystaj z API.
- **Działania portfela** albo cokolwiek, co wymaga klucza aktywnego: użyj linków podpisu.
- **Oba naraz**: wiele aplikacji loguje ludzi przez OAuth2 do funkcji społecznościowych i używa linków podpisu do przelewów.
- **Tylko tożsamość osoby**: zobacz [Logowanie bez dostępu do publikowania](/docs/login-only).

## Kod źródłowy {#source-code}

Hivesigner jest oprogramowaniem o otwartym kodzie:

- Podpisujący w przeglądarce: https://github.com/ecency/hivesigner-ui
- API: https://github.com/ecency/hivesigner-api
- SDK JavaScript (pakiet npm `hivesigner`): https://github.com/ecency/hivesigner-sdk. Zobacz [SDK](/docs/sdk).
