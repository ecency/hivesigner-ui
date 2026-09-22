Link podpisu otwiera transakcję Hive w Hivesigner. Osoba ją przegląda, zatwierdza własnym kluczem, a Hivesigner rozgłasza ją z jej przeglądarki. Potem Hivesigner może odesłać osobę do Twojej aplikacji z identyfikatorem transakcji. Linki podpisu nie wymagają konta aplikacji ani tokenu. Obejmują wszystkie 41 operacji obsługiwanych przez Hivesigner, w tym przelewy i inne działania wymagające klucza aktywnego.

## Jak działa link podpisu {#how-it-works}

1. Twoja aplikacja buduje link niosący jedną albo więcej operacji.
2. Osoba otwiera link. Hivesigner pokazuje każdą operację zwykłymi słowami na ekranie «Potwierdź transakcję», razem z kluczem, który jest do niej potrzebny.
3. Osoba zatwierdza. Hivesigner podpisuje transakcję w przeglądarce kluczem konta wybranego w Hivesigner. Potem wysyła ją do sieci Hive.
4. Gdy link wskazuje adres zwrotny, Hivesigner wysyła tam osobę z identyfikatorem transakcji.

Twoja aplikacja nigdy nie widzi klucza. Link podpisu może utworzyć każda witryna: nie ma żadnego `client_id` do wysłania.

## Postacie linków {#link-forms}

Hivesigner czyta dwa rodzaje linków podpisu: linki zakodowane i linki dawne.

### Linki zakodowane {#encoded-links}

Link zakodowany niesie operacje jako JSON zakodowany w base64url. Używa postaci `hive://sign/...` z pakietu `hive-uri`, z `https://hivesigner.com/` w miejsce `hive://`.

| Postać | Co zawiera `B64U` |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Jedną operację: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Listę operacji: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Całą transakcję, z własnym nagłówkiem |

`B64U` to tekst JSON zakodowany jako UTF-8, a potem w base64, gdzie `+` zastąpiono przez `-`, `/` przez `_`, a wypełnienie `=` przez `.`.

Przy `op` i `ops` Hivesigner buduje transakcję wokół operacji. Uzupełnia blok odniesienia i czas wygaśnięcia.

Przy `tx` Hivesigner zachowuje własne `ref_block_num`, `ref_block_prefix` i `expiration` transakcji. Zachowuje też podpisy, które transakcja już niesie. Dzięki temu kilka kont może po kolei podpisać jedną transakcję, dla konta, którym zarządza kilka osób. Hivesigner odrzuca transakcję, której lista `extensions` nie jest pusta.

> **Uwaga:** Hivesigner ujednolica przed podpisaniem niektóre wartości, na przykład kwoty i pola pozostawione na wartościach domyślnych. Podpisana transakcja może mieć wtedy inny identyfikator niż ten, który zbudowałeś. Odczytaj identyfikator z adresu zwrotnego.

### Linki dawne {#legacy-links}

Link dawny wskazuje jedną operację w ścieżce, a jej pola umieszcza w zapytaniu:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Nazwę operacji zapisz w stylu snake case (`transfer_to_vesting`), camel case (`transferToVesting`) albo kebab case (`transfer-to-vesting`).
- Każde pole podaj jako parametr zapytania o nazwie tego pola. Każdą wartość zakoduj na potrzeby adresu.
- Listy i obiekty zapisuj jako JSON, na przykład `required_posting_auths=["alice"]`. Listę identyfikatorów albo nazw można też rozdzielić przecinkami: `proposal_ids=379,380`.
- Wartości logiczne zapisuj jako `true` albo `false`.

Link dawny niesie jedną operację. Do większej liczby użyj linku zakodowanego.

### Wartości pól {#field-values}

Te zasady dotyczą każdej postaci:

- **Wartości domyślne.** Pole, które pominiesz, przyjmuje swoją wartość domyślną. Konto, które działa (`voter`, `from`, `owner` i podobne pola), to domyślnie konto podpisujące. `weight` głosu ma domyślnie `10000` (100%).
- **Kwoty** to liczba i symbol: `1.000 HIVE`, `0.500 HBD` albo `100.000000 VESTS`. Hivesigner zapisuje HIVE i HBD z 3 miejscami po przecinku, a VESTS z 6.
- **Hive Power.** Pole przyjmujące VESTS przyjmuje też kwotę w HP, na przykład `100 HP`. Hivesigner przelicza ją na VESTS po bieżącym kursie, zanim osoba będzie mogła zatwierdzić.
- **`__signer`** w dowolnej wartości staje się nazwą konta, które podpisuje. Na przykład `custom_json` do obserwowania może wskazać `__signer` jako obserwującego wewnątrz swojego `json`.
- **Liczby całkowite** muszą być całkowite i mieścić się w zakresie przyjmowanym przez blockchain, na przykład od `-10000` do `10000` dla `weight` głosu.

Hivesigner odrzuca cały link, gdy wartość nie pasuje do swojego pola, gdy operacja jest nieznana albo gdy link nie niesie żadnej operacji. Osoba widzi «Ups, coś poszło nie tak. Przekazane dane są nieprawidłowe.» i nic nie zostaje podpisane.

## Parametry {#parameters}

Dodaj je do ciągu zapytania dowolnego linku podpisu:

| Parametr | Znaczenie |
| --- | --- |
| `cb` | Adres zwrotny zakodowany w base64url. To właśnie zapisuje `hive-uri` dla swojej opcji `callback`. |
| `redirect_uri` | Adres zwrotny jako zwykły tekst zakodowany na potrzeby adresu. Używają go linki dawne. Link zakodowany używa go wtedy, gdy nie ma `cb`. |
| `nb` | Tylko podpis. Hivesigner podpisuje transakcję bez rozgłaszania jej. Umieść `{{sig}}` w adresie zwrotnym, aby otrzymać podpis (zobacz [Znaczniki w adresie zwrotnym](#callback-placeholders)). Wystarczy dowolna wartość, nawet pusta (`nb=`). |
| `s` | Konto, które ma podpisać. Gdy wybrane jest inne konto, Hivesigner prosi osobę o przełączenie się na to. Żadnym innym kontem nie podpisze. |

Używaj adresu zwrotnego `https://`. Adres, który nie jest adresem `http` ani `https`, Hivesigner pomija i zostaje wtedy na własnym ekranie wyniku.

Hivesigner dobiera klucz na podstawie operacji. Nie ma parametru do jego wyboru: w linkach podpisu Hivesigner pomija `authority` (oraz parametr `a` z `hive-uri`). Zobacz [Jakiego klucza wymaga link](#which-key).

### Znaczniki w adresie zwrotnym {#callback-placeholders}

Po zatwierdzeniu przez osobę Hivesigner wypełnia w adresie zwrotnym te znaczniki:

| Znacznik | Wartość |
| --- | --- |
| `{{id}}` | Identyfikator transakcji |
| `{{sig}}` | Podpis, dla linku z samym podpisem (`nb`) |
| `{{block}}` | Pozostaje pusty |
| `{{txn}}` | Pozostaje pusty |
| `{{data}}` | Pozostaje pusty |

Adres zwrotny bez żadnego z tych znaczników dostaje identyfikator transakcji dopisany jako `id`, po `?` albo `&`:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner przekierowuje, gdy tylko węzeł Hive przyjmie transakcję. Może ona jeszcze nie być w bloku. Wyszukaj ją po identyfikatorze, gdy musisz wiedzieć, że została dołączona.

Twój adres zwrotny nie jest wywoływany, gdy sieć odrzuci transakcję (osoba widzi błąd) ani gdy osoba odejdzie bez zatwierdzenia.

## Zbuduj link {#build-a-link}

### Przy użyciu hive-uri {#with-hive-uri}

Pakiet `hive-uri` (https://www.npmjs.com/package/hive-uri) koduje operacje do linków. Użyj wersji 0.2.8 albo nowszej, która poprawnie koduje dowolny tekst Unicode.

```bash
npm install hive-uri
```

```js
import { encodeOp, encodeOps } from 'hive-uri';

// One vote. __signer becomes the account that signs.
const vote = encodeOp(
  ['vote', { voter: '__signer', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
  { callback: 'https://YOUR_APP/voted?tx={{id}}' },
);

// Two transfers in one transaction.
const payout = encodeOps(
  [
    ['transfer', { from: '__signer', to: 'RECIPIENT_1', amount: '1.000 HIVE', memo: 'MEMO' }],
    ['transfer', { from: '__signer', to: 'RECIPIENT_2', amount: '2.000 HIVE', memo: 'MEMO' }],
  ],
  { callback: 'https://YOUR_APP/paid' },
);

const voteLink = vote.replace('hive://', 'https://hivesigner.com/');
const payoutLink = payout.replace('hive://', 'https://hivesigner.com/');
```

Obiekt opcji przyjmuje `callback` (zapisywane jako `cb`), `no_broadcast: true` (zapisywane jako `nb`) i `signer` (zapisywane jako `s`). `encodeTx` robi to samo dla całej transakcji.

### Przy użyciu SDK JavaScript {#with-the-sdk}

Pakiet `hivesigner` ma `sendOperation`, `sendOperations` i `sendTransaction`. Przyjmują te same argumenty co kodery z `hive-uri` i zwracają link `https://hivesigner.com/sign/...`:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

W TypeScript typy wymagają trzeciego argumentu: podaj `undefined`, aby otrzymać link. W przeglądarce funkcja podana jako trzeci argument sprawia, że otwierają link w nowej karcie zamiast go zwracać. Zobacz [SDK](/docs/sdk#sign-links).

### Bez kodu {#signs-page}

https://hivesigner.com/signs («Podpisz transakcję») wypisuje każdą obsługiwaną operację z formularzem na jej pola. Buduje link `/sign/op/` i otwiera go.

## Jakiego klucza wymaga link {#which-key}

Każda operacja wymaga jednego klucza: publikowania, aktywnego albo właściciela. [Tabela poniżej](#supported-operations) je wypisuje. Trzy operacje zależą od swoich wartości:

- `custom_json` wymaga klucza aktywnego, gdy `required_auths` wskazuje konto. W innym razie wymaga klucza publikowania.
- `account_update` wymaga klucza właściciela, gdy ustawia `owner`. W innym razie wymaga klucza aktywnego.
- `account_update2` wymaga klucza właściciela, gdy ustawia `owner`. Wymaga klucza aktywnego, gdy ustawia `active`, `posting`, `memo_key` albo `json_metadata`. Przy samym `posting_json_metadata` wymaga klucza publikowania.

Hivesigner podpisuje link jednym kluczem, więc wszystkie operacje w jednym linku muszą wymagać tego samego. Linku, który je miesza, Hivesigner nie podpisze i wyjaśni osobie dlaczego. Takie operacje wyślij w osobnych linkach.

Gdy wybrane konto nie ma tego klucza na urządzeniu, Hivesigner mówi, którego klucza brakuje, i proponuje jego dodanie. Zobacz [Gdy brakuje klucza](/docs/signing#missing-key).

## Co widzi osoba {#what-the-user-sees}

- Ekran zatytułowany «Potwierdź transakcję», z jedną kartą na każdą operację: podsumowaniem zwykłymi słowami, kluczem, który jest potrzebny, i wartościami, które niesie.
- «Nastąpi przekierowanie na adres HOST.», gdy link ma adres zwrotny. Używaj adresu we własnej witrynie, aby ludzie rozpoznawali host.
- Ostrzeżenie, gdy operacja działa jako konto inne niż podpisujące.
- **Zatwierdź** albo **Podpisz** przy linku z samym podpisem. Zablokowane konto prosi najpierw o kod dostępu.
- Po rozgłoszeniu «Transakcja została rozgłoszona w sieci» wraz z identyfikatorem transakcji. Potem przekierowanie na Twój adres zwrotny.

[Przejrzyj i podpisz](/docs/signing#confirm-screen) opisuje ten ekran dla użytkowników.

## Obsługiwane operacje {#supported-operations}

Hivesigner podpisuje te 41 operacji, pod ich nazwami w blockchainie. Wszystko inne zostaje odrzucone. Nazwa to ta, którą Hivesigner pokazuje na ekranie potwierdzenia.

| Operacja | Klucz | Nazwa |
| --- | --- | --- |
| `transfer` | Aktywny | Przelew |
| `recurrent_transfer` | Aktywny | Przelew cykliczny |
| `delegate_vesting_shares` | Aktywny | Delegowanie Hive Power |
| `transfer_to_vesting` | Aktywny | Zasilenie Hive Power (power up) |
| `set_withdraw_vesting_route` | Aktywny | Ustawienie trasy wypłaty (power down) |
| `withdraw_vesting` | Aktywny | Wypłata z Hive Power (power down) |
| `transfer_to_savings` | Aktywny | Przelew do oszczędności |
| `transfer_from_savings` | Aktywny | Przelew z oszczędności |
| `cancel_transfer_from_savings` | Aktywny | Anulowanie przelewu z oszczędności |
| `convert` | Aktywny | Konwersja HBD na HIVE |
| `collateralized_convert` | Aktywny | Konwersja HIVE na HBD |
| `account_witness_vote` | Aktywny | Głos na świadka |
| `witness_update` | Aktywny | Aktualizacja świadka |
| `witness_set_properties` | Aktywny | Ustawienie parametrów świadka |
| `account_witness_proxy` | Aktywny | Proxy zarządzania |
| `claim_account` | Aktywny | Odebranie kredytu na konto |
| `account_create` | Aktywny | Utworzenie konta |
| `create_claimed_account` | Aktywny | Utworzenie konta z kredytu na konto |
| `vote` | Publikowanie | Głos |
| `limit_order_create` | Aktywny | Utworzenie zlecenia z limitem |
| `limit_order_create2` | Aktywny | Utworzenie zlecenia z limitem |
| `limit_order_cancel` | Aktywny | Anulowanie zlecenia z limitem |
| `claim_reward_balance` | Publikowanie | Odebranie nagród |
| `comment` | Publikowanie | Wpis lub komentarz |
| `comment_options` | Publikowanie | Opcje wpisu lub komentarza |
| `custom_json` | Publikowanie, albo Aktywny, gdy ustawiono `required_auths` | Niestandardowa operacja |
| `delete_comment` | Publikowanie | Usunięcie komentarza |
| `account_update` | Aktywny, albo Właściciel, gdy ustawiono `owner` | Aktualizacja konta (klucz aktywny) |
| `account_update2` | Publikowanie, Aktywny albo Właściciel, zależnie od pola | Aktualizacja konta (klucz publikowania) |
| `change_recovery_account` | Właściciel | Zmiana konta odzyskiwania |
| `create_proposal` | Aktywny | Utworzenie propozycji |
| `remove_proposal` | Aktywny | Usunięcie propozycji |
| `update_proposal_votes` | Aktywny | Aktualizacja głosów na propozycje |
| `update_proposal` | Aktywny | Aktualizacja propozycji |
| `escrow_transfer` | Aktywny | Przelew escrow |
| `escrow_approve` | Aktywny | Zatwierdzenie escrow |
| `escrow_dispute` | Aktywny | Spór escrow |
| `escrow_release` | Aktywny | Zwolnienie escrow |
| `account_create_with_delegation` | Aktywny | Utworzenie konta z delegacją |
| `request_account_recovery` | Aktywny | Wniosek o odzyskanie konta |
| `recover_account` | Właściciel | Odzyskanie konta |
