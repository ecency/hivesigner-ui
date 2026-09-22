Twoja aplikacja może poprosić osobę o podpisanie wiadomości tekstowej jej kluczem publikowania albo aktywnym. Podpis dowodzi, że osoba zarządza kontem. Nic nie zostaje rozgłoszone: wiadomość nigdy nie trafia do blockchaina. Hivesigner podpisuje tak samo jak `requestSignBuffer` z Hive Keychain, więc kod serwera sprawdzający podpis z Keychain sprawdzi też podpis z Hivesigner.

## Poproś o podpis {#request}

Wyślij osobę pod adres `https://hivesigner.com/sign-buffer` z tymi parametrami zapytania:

| Parametr | Wymagany | Znaczenie |
| --- | --- | --- |
| `message` | Tak | Dokładny tekst do podpisania. Musi zawierać coś więcej niż same spacje. |
| `redirect_uri` | Tak | Dokąd Hivesigner wysyła wynik. Zobacz [Zasady adresu zwrotnego](#callback-rules). |
| `authority` | Nie | `posting` albo `active`, w dowolnej wielkości liter (`Posting` też działa). Przy braku albo pustej wartości `posting`. Każda inna wartość zostaje odrzucona. |
| `client_id` | Nie | Konto Twojej aplikacji. Odczytywane jest też `clientId`. Z nim `redirect_uri` musi być jednym z adresów zwrotnych Twojej aplikacji. |
| `state` | Nie | Dowolna wartość. Hivesigner zwraca ją bez zmian. |
| `account` | Nie | Konto, od którego oczekujesz podpisu. Hivesigner wybiera je, gdy jest na urządzeniu, a w innym razie pomija. Odczytywane jest też `select_account`. |

Zbuduj adres przy użyciu `URLSearchParams`, aby każda wartość została zakodowana:

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### Zasady adresu zwrotnego {#callback-rules}

- Adres zwrotny musi być `https://`. Zwykły `http://` działa tylko na pętli zwrotnej: `localhost`, `127.0.0.1` albo `[::1]`.
- **Z `client_id`** adres zwrotny musi być zarejestrowany na tym koncie aplikacji, sprawdzany tak samo jak przy logowaniu. Zobacz [Adresy zwrotne](/docs/register-app#callback-rules). Hivesigner odczytuje adresy zwrotne aplikacji z Hive, gdy otwiera się żądanie, i niczego nie podpisze, zanim ich nie odczyta. Gdy Hive jest nieosiągalne, osoba dostaje przycisk **Ponów**.
- **Bez `client_id`** wystarczy dowolny adres zwrotny spełniający pierwszą zasadę. Hivesigner wskazuje wtedy host tego adresu jako proszącego, na przykład «HOST prosi Cię o podpisanie wiadomości.».

Wysyłaj `client_id`, gdy masz konto aplikacji. Osoba widzi wtedy nazwę i konto Twojej aplikacji. Podpis mogą otrzymać tylko Twoje zarejestrowane adresy zwrotne.

Hivesigner odrzuca żądanie bez wiadomości, z nieznanym `authority`, z brakującym albo nieużywalnym adresem zwrotnym, z `client_id`, które nie jest kontem Hive, albo z adresem zwrotnym niezarejestrowanym na tej aplikacji. Osoba widzi «Tego żądania podpisu nie można użyć: potrzebuje wiadomości, klucza publikowania lub aktywnego oraz bezpiecznego adresu przekierowania zarejestrowanego dla aplikacji. Wróć do witryny i spróbuj ponownie.» i przycisk **Zgłoś ten problem**.

### Co widzi osoba {#what-the-user-sees}

- Nagłówek wskazujący Twoją aplikację (albo host adresu zwrotnego) oraz «Przekieruje Cię na adres HOST».
- Całą wiadomość, dokładnie tak, jak zostanie podpisana. Znaki, które mogłyby ukryć tekst albo zmienić jego kierunek, pokazywane są jako kody, na przykład `\u{200B}`.
- «Podpis Twoim kluczem publikowania» albo «Podpis Twoim kluczem aktywnym».
- Ostrzeżenie: «Twój podpis dowodzi każdemu, kto go zobaczy, że @USERNAME podpisał dokładnie ten tekst. Podpisuj tylko wiadomość, którą rozumiesz.»
- **Podpisz** i **Anuluj**. Zablokowane konto prosi najpierw o kod dostępu.

[Żądania podpisania wiadomości](/docs/signing#message-requests) opisują ten ekran dla użytkowników.

## Co dostaje Twój adres zwrotny {#callback}

Gdy osoba wybierze **Podpisz**, Hivesigner wysyła ją na Twój adres zwrotny z tymi parametrami zapytania:

| Parametr | Wartość |
| --- | --- |
| `signature` | Podpis, jako ciąg szesnastkowy o 130 znakach |
| `public_key` | Klucz publiczny klucza, który podpisał, na przykład `STM...` |
| `username` | Konto, które podpisało |
| `authority` | `posting` albo `active` |
| `state` | Twoje `state`, ilekroć żądanie je miało (również puste) |

Hivesigner dopisuje je do zapytania Twojego adresu, po `?` albo `&` i przed jakimkolwiek `#fragment`. Twoje własne zapytanie zostaje bez zmian.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Gdy osoba wybierze **Anuluj**, Hivesigner otwiera jej listę kont. Twój adres zwrotny nie dostaje nic.

> **Ostrzeżenie:** Każdy może otworzyć Twój adres zwrotny ze zmyślonymi wartościami. Traktuj każdy parametr jako twierdzenie, dopóki Twój serwer nie sprawdzi podpisu.

## Zweryfikuj podpis {#verify}

Sprawdź podpis na swoim serwerze:

1. Wiadomość, o którą prosiłeś, trzymaj na swoim serwerze razem z jej `state`. Nie ufaj kopii wracającej z przeglądarki.
2. Policz skrót wiadomości: sha256 z jej bajtów UTF-8.
3. Odzyskaj klucz publiczny z podpisu i tego skrótu.
4. Wczytaj konto z Hive. Sprawdź, czy odzyskany klucz należy do uprawnienia, o które prosiłeś, i ma wagę wystarczającą do samodzielnego podpisu.
5. Sprawdź, czy `state` jest tym, które wydałeś. Każdą wiadomość przyjmij raz.

Ten przykład używa dhive (https://www.npmjs.com/package/@hiveio/dhive):

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

To samo sprawdzenie działa dla podpisu z `requestSignBuffer` w Hive Keychain. Porównuj z kluczem, który odzyskałeś: `public_key` w adresie zwrotnym to tylko wskazówka.

## Wiadomości, których Hivesigner nie podpisuje {#refused-messages}

Wiadomość będąca obiektem JSON z kluczem `signed_message` ma postać tokenu Hivesigner. Jej podpisanie dałoby proszącemu dostęp do konta osoby. Hivesigner nigdy nie podpisuje takiej wiadomości. Mówi osobie «Ta wiadomość jest tokenem Hivesigner. Jej podpisanie dałoby witrynie dostęp do Twojego konta, dlatego nie można jej podpisać.»

Używaj zwykłego tekstu albo JSON bez klucza `signed_message`. Napisz, do czego służy podpis, i dodaj wartość, którą tworzysz raz, na przykład:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## Narzędzie Podpisz wiadomość {#sign-message-tool}

Ludzie mogą też sami podpisać wiadomość na https://hivesigner.com/signmessage (**Podpisz wiadomość**) i sprawdzić ją na https://hivesigner.com/verifymessage (**Zweryfikuj wiadomość**). Zobacz [Podpisz wiadomość samodzielnie](/docs/signing#sign-message).

To narzędzie podpisuje inaczej niż `/sign-buffer`. Podpisuje treść tokenu Hivesigner zawierającą wiadomość, konto i czas. Wynik udostępnia jako **Token weryfikacyjny**. Taki token sprawdzaj na stronie **Zweryfikuj wiadomość** albo tak, jak opisuje [Sprawdź samodzielnie](/docs/tokens#check-it-yourself), a nie kodem powyżej.
