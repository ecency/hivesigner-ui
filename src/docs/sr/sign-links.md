Veza za potpis otvara Hive transakciju u Hivesigner-u. Osoba je pregleda, odobri sopstvenim ključem, a Hivesigner je emituje iz njenog pregledača. Zatim Hivesigner može da vrati osobu u vašu aplikaciju sa identifikatorom transakcije. Vezama za potpis ne trebaju ni nalog aplikacije ni token. One pokrivaju svih 41 operaciju koje Hivesigner podržava, uključujući prenose i druge radnje za koje treba aktivni ključ.

## Kako veza za potpis radi {#how-it-works}

1. Vaša aplikacija sastavlja vezu koja nosi jednu ili više operacija.
2. Osoba otvara vezu. Hivesigner prikazuje svaku operaciju jasnim rečima na ekranu «Potvrda transakcije», zajedno sa ključem koji joj treba.
3. Osoba odobrava. Hivesigner potpisuje transakciju u pregledaču ključem naloga izabranog u Hivesigner-u. Zatim šalje transakciju u Hive mrežu.
4. Kada veza navodi povratnu adresu, Hivesigner šalje osobu tamo sa identifikatorom transakcije.

Vaša aplikacija nikada ne vidi ključ. Vezu za potpis može da napravi svaki sajt: nema nikakvog `client_id` koji bi se slao.

## Oblici veza {#link-forms}

Hivesigner čita dve vrste veza za potpis: kodirane veze i stare veze.

### Kodirane veze {#encoded-links}

Kodirana veza nosi operacije kao JSON, kodiran u base64url. Koristi oblik `hive://sign/...` iz paketa `hive-uri`, gde umesto `hive://` stoji `https://hivesigner.com/`.

| Oblik | Šta `B64U` sadrži |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Jednu operaciju: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Spisak operacija: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Celu transakciju, sa sopstvenim zaglavljem |

`B64U` je JSON tekst, kodiran kao UTF-8, pa zatim u base64, gde je `+` zamenjeno sa `-`, `/` sa `_`, a popuna `=` sa `.`.

Za `op` i `ops` Hivesigner sastavlja transakciju oko operacija. Popunjava referentni blok i vreme isteka.

Za `tx` Hivesigner zadržava sopstvene `ref_block_num`, `ref_block_prefix` i `expiration` te transakcije. Zadržava i potpise koje transakcija već nosi. Tako više naloga može redom da potpiše jednu transakciju, za nalog kojim upravlja više ljudi. Transakciju čiji spisak `extensions` nije prazan Hivesigner odbija.

> **Napomena:** Hivesigner pre potpisivanja ujednačava neke vrednosti, poput iznosa i polja ostavljenih na podrazumevanim vrednostima. Potpisana transakcija tada može da ima drugačiji identifikator od onog koji ste sastavili. Identifikator čitajte sa povratne adrese.

### Stare veze {#legacy-links}

Stara veza navodi jednu operaciju u putanji, a njena polja stavlja u upitni deo:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Ime operacije pišite u obliku snake case (`transfer_to_vesting`), camel case (`transferToVesting`) ili kebab case (`transfer-to-vesting`).
- Svako polje dajte kao parametar upita sa imenom tog polja. Svaku vrednost kodirajte za adresu.
- Spiskove i objekte pišite kao JSON, na primer `required_posting_auths=["alice"]`. Spisak identifikatora ili imena može da se razdvoji i zarezima: `proposal_ids=379,380`.
- Logičke vrednosti pišite kao `true` ili `false`.

Stara veza nosi jednu operaciju. Za više njih koristite kodiranu vezu.

### Vrednosti polja {#field-values}

Ova pravila važe za svaki oblik:

- **Podrazumevane vrednosti.** Polje koje izostavite uzima svoju podrazumevanu vrednost. Nalog koji radi (`voter`, `from`, `owner` i slična polja) podrazumevano je nalog koji potpisuje. `weight` glasa podrazumevano je `10000` (100%).
- **Iznosi** su broj i oznaka: `1.000 HIVE`, `0.500 HBD` ili `100.000000 VESTS`. Hivesigner piše HIVE i HBD sa 3 decimale, a VESTS sa 6.
- **Hive Power.** Polje koje prima VESTS prima i iznos u HP, poput `100 HP`. Hivesigner ga po tekućem kursu pretvara u VESTS pre nego što osoba može da odobri.
- **`__signer`** u bilo kojoj vrednosti postaje ime naloga koji potpisuje. Na primer, `custom_json` za praćenje može unutar svog `json` da navede `__signer` kao pratioca.
- **Celi brojevi** moraju da budu celi i u opsegu koji blokčejn prihvata, na primer od `-10000` do `10000` za `weight` glasa.

Hivesigner odbija celu vezu kada vrednost ne odgovara svom polju, kada je operacija nepoznata ili kada veza ne nosi nijednu operaciju. Osoba vidi «Ups, nešto nije u redu. Dostavljeni podaci nisu ispravni.» i ništa se ne potpisuje.

## Parametri {#parameters}

Dodajte ih u upitni deo bilo koje veze za potpis:

| Parametar | Značenje |
| --- | --- |
| `cb` | Povratna adresa, kodirana u base64url. To `hive-uri` piše za svoju opciju `callback`. |
| `redirect_uri` | Povratna adresa kao običan tekst kodiran za adresu. Stare veze koriste ovaj. Kodirana veza ga koristi kada nema `cb`. |
| `nb` | Samo potpis. Hivesigner potpisuje transakciju bez emitovanja. Stavite `{{sig}}` u povratnu adresu da biste dobili potpis (pogledajte [Zamene u povratnoj adresi](#callback-placeholders)). Svaka vrednost odgovara, čak i prazna (`nb=`). |
| `s` | Nalog koji mora da potpiše. Kada je izabran drugi nalog, Hivesigner traži od osobe da pređe na ovaj. Nijednim drugim nalogom ne potpisuje. |

Koristite povratnu adresu sa `https://`. Adresu koja nije `http` ni `https` Hivesigner zanemaruje i tada ostaje na sopstvenom ekranu ishoda.

Hivesigner bira ključ na osnovu operacija. Parametra za njegov izbor nema: u vezama za potpis Hivesigner zanemaruje `authority` (i parametar `a` iz `hive-uri`). Pogledajte [Koji ključ vezi treba](#which-key).

### Zamene u povratnoj adresi {#callback-placeholders}

Pošto osoba odobri, Hivesigner u povratnoj adresi popunjava ove zamene:

| Zamena | Vrednost |
| --- | --- |
| `{{id}}` | Identifikator transakcije |
| `{{sig}}` | Potpis, za vezu samo sa potpisom (`nb`) |
| `{{block}}` | Ostaje prazno |
| `{{txn}}` | Ostaje prazno |
| `{{data}}` | Ostaje prazno |

Povratna adresa bez ijedne od ovih zamena dobija identifikator transakcije dodat kao `id`, posle `?` ili `&`:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner preusmerava čim Hive čvor prihvati transakciju. Ona tada možda još nije u bloku. Potražite je po identifikatoru kada morate da znate da je uključena.

Vaša povratna adresa se ne poziva kada mreža odbije transakciju (osoba vidi grešku) ni kada osoba ode bez odobrenja.

## Sastavite vezu {#build-a-link}

### Pomoću hive-uri {#with-hive-uri}

Paket `hive-uri` (https://www.npmjs.com/package/hive-uri) kodira operacije u veze. Koristite verziju 0.2.8 ili noviju, koja ispravno kodira svaki Unicode tekst.

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

Objekat sa opcijama prima `callback` (piše se kao `cb`), `no_broadcast: true` (piše se kao `nb`) i `signer` (piše se kao `s`). Za celu transakciju isto radi `encodeTx`.

### Pomoću JavaScript SDK-a {#with-the-sdk}

Paket `hivesigner` ima `sendOperation`, `sendOperations` i `sendTransaction`. Primaju iste argumente kao koderi iz `hive-uri` i vraćaju vezu `https://hivesigner.com/sign/...`:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

U TypeScript-u tipovi traže treći argument: prosledite `undefined` da biste dobili vezu. U pregledaču funkcija prosleđena kao treći argument čini da vezu otvore u novoj kartici umesto da je vrate. Pogledajte [SDK](/docs/sdk#sign-links).

### Bez koda {#signs-page}

https://hivesigner.com/signs («Potpiši transakciju») nabraja svaku podržanu operaciju sa obrascem za njena polja. Sastavlja vezu `/sign/op/` i otvara je.

## Koji ključ vezi treba {#which-key}

Svakoj operaciji treba jedan ključ: za objavljivanje, aktivni ili vlasnički. [Tabela ispod](#supported-operations) ih nabraja. Tri operacije zavise od svojih vrednosti:

- `custom_json` traži aktivni ključ kada `required_auths` navodi nalog. Inače traži ključ za objavljivanje.
- `account_update` traži vlasnički ključ kada postavlja `owner`. Inače traži aktivni ključ.
- `account_update2` traži vlasnički ključ kada postavlja `owner`. Traži aktivni ključ kada postavlja `active`, `posting`, `memo_key` ili `json_metadata`. Samo sa `posting_json_metadata` traži ključ za objavljivanje.

Hivesigner potpisuje vezu jednim ključem, pa svim operacijama u jednoj vezi mora da treba isti. Vezu koja ih meša Hivesigner odbija da potpiše i objašnjava osobi zašto. Takve operacije šaljite u odvojenim vezama.

Kada izabrani nalog nema taj ključ na uređaju, Hivesigner kaže koji ključ nedostaje i nudi da ga doda. Pogledajte [Kada ključa nema](/docs/signing#missing-key).

## Šta osoba vidi {#what-the-user-sees}

- Ekran sa naslovom «Potvrda transakcije», sa po jednom karticom za svaku operaciju: sažetak jasnim rečima, ključ koji joj treba i vrednosti koje nosi.
- «Bićete preusmereni na HOST.» kada veza ima povratnu adresu. Koristite povratnu adresu na sopstvenom sajtu, da bi ljudi prepoznali domaćina.
- Upozorenje kada operacija radi u ime naloga koji nije onaj koji potpisuje.
- **Odobri** ili **Potpiši** za vezu samo sa potpisom. Zaključan nalog prvo traži svoju pristupnu šifru.
- Posle emitovanja «Transakcija je uspešno emitovana» uz identifikator transakcije. Zatim preusmeravanje na vašu povratnu adresu.

[Pregled i potpis](/docs/signing#confirm-screen) opisuje taj ekran za ljude.

## Podržane operacije {#supported-operations}

Hivesigner potpisuje ovih 41 operaciju, pod njihovim imenima u blokčejnu. Sve ostalo biva odbijeno. Ime je ono koje Hivesigner prikazuje na ekranu potvrde.

| Operacija | Ključ | Ime |
| --- | --- | --- |
| `transfer` | Aktivno | Prenos |
| `recurrent_transfer` | Aktivno | Ponavljajući prenos |
| `delegate_vesting_shares` | Aktivno | Delegiranje Hive Power |
| `transfer_to_vesting` | Aktivno | Power Up |
| `set_withdraw_vesting_route` | Aktivno | Podešavanje putanje za Power Down |
| `withdraw_vesting` | Aktivno | Power Down |
| `transfer_to_savings` | Aktivno | Prenos na štednju |
| `transfer_from_savings` | Aktivno | Prenos iz štednje |
| `cancel_transfer_from_savings` | Aktivno | Otkazivanje prenosa iz štednje |
| `convert` | Aktivno | Konverzija HBD u HIVE |
| `collateralized_convert` | Aktivno | Konverzija HIVE u HBD |
| `account_witness_vote` | Aktivno | Glas za svedoka |
| `witness_update` | Aktivno | Ažuriranje svedoka |
| `witness_set_properties` | Aktivno | Podešavanje svojstava svedoka |
| `account_witness_proxy` | Aktivno | Proksi za upravljanje |
| `claim_account` | Aktivno | Preuzimanje kredita za nalog |
| `account_create` | Aktivno | Kreiranje naloga |
| `create_claimed_account` | Aktivno | Kreiranje naloga pomoću kredita za nalog |
| `vote` | Objavljivanje | Glasanje |
| `limit_order_create` | Aktivno | Kreiranje limitiranog trgovinskog naloga |
| `limit_order_create2` | Aktivno | Kreiranje limitiranog trgovinskog naloga |
| `limit_order_cancel` | Aktivno | Otkazivanje limitiranog trgovinskog naloga |
| `claim_reward_balance` | Objavljivanje | Preuzimanje nagrada |
| `comment` | Objavljivanje | Objava ili komentar |
| `comment_options` | Objavljivanje | Opcije objave ili komentara |
| `custom_json` | Objavljivanje, ili Aktivno kada je postavljen `required_auths` | Prilagođena operacija |
| `delete_comment` | Objavljivanje | Brisanje komentara |
| `account_update` | Aktivno, ili Vlasničko kada je postavljen `owner` | Ažuriranje naloga (aktivno) |
| `account_update2` | Objavljivanje, Aktivno ili Vlasničko, zavisno od polja | Ažuriranje naloga (objavljivanje) |
| `change_recovery_account` | Vlasničko | Promena agenta za oporavak |
| `create_proposal` | Aktivno | Kreiranje predloga |
| `remove_proposal` | Aktivno | Uklanjanje predloga |
| `update_proposal_votes` | Aktivno | Ažuriranje glasova za predloge |
| `update_proposal` | Aktivno | Ažuriranje predloga |
| `escrow_transfer` | Aktivno | Eskrou prenos |
| `escrow_approve` | Aktivno | Odobrenje eskroua |
| `escrow_dispute` | Aktivno | Spor oko eskroua |
| `escrow_release` | Aktivno | Oslobađanje eskroua |
| `account_create_with_delegation` | Aktivno | Kreiranje naloga uz delegiranje |
| `request_account_recovery` | Aktivno | Zahtev za oporavak naloga |
| `recover_account` | Vlasničko | Oporavak naloga |
