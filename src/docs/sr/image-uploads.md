Objave na Hive-u na slike upućuju preko URL adrese, pa aplikaciji treba mesto gde će ih otpremiti. imagehoster je hosting slika otvorenog koda napravljen za Hive. Može da prima otpremanja od ljudi koji su se u vašu aplikaciju prijavili preko Hivesigner-a: njihov token pristupa zamenjuje potpis njihovim ključem.

## Kako radi {#how-it-works}

1. Osoba se prijavljuje u vašu aplikaciju preko Hivesigner-a, sa pristupom objavljivanju. Vaša aplikacija dobija token pristupa. Pogledajte [Prijava preko OAuth2](/docs/oauth2).
2. Vaša aplikacija šalje sliku vašem imagehoster-u, sa tim tokenom u adresi.
3. imagehoster proverava token i nalog, čuva sliku i odgovara njenom adresom.
4. Vaša aplikacija tu adresu stavlja u objavu.

## Pokrenite svoj imagehoster {#run-your-own}

imagehoster se podešava za jedan nalog aplikacije: `app_account` u odeljku `[upload_limits]` njegove konfiguracije. Šaljite mu tokene napravljene za taj nalog aplikacije. Javne instance pripadaju drugim aplikacijama: images.ecency.com je podešen za nalog aplikacije Ecency, a images.hive.blog za nalog Hive.blog-a. Da biste primali otpremanja svojih korisnika, pokrenite sopstvenu instancu sa svojim nalogom aplikacije.

Izvorni kod i uputstva za postavljanje:

- imagehoster zajednice Hive: https://gitlab.syncad.com/hive/imagehoster
- imagehoster koji održava Ecency: https://github.com/ecency/imagehoster

U konfiguraciji upišite svoj nalog aplikacije:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

Isti odeljak određuje najmanju reputaciju koja je nalogu potrebna za otpremanje (`reputation`) i kvotu otpremanja za svaki nalog (`max` otpremanja na `duration` milisekundi). Podesite `redis_url` da bi kvota zaista važila. `max_image_size` određuje najveću datoteku, u bajtovima.

## Otpremite sliku {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Token.** Stavite token pristupa osobe u putanju, tačno onako kako ga je Hivesigner dao vašoj aplikaciji. Koristite token iz prijave sa pristupom objavljivanju za vašu aplikaciju. Token samo za prijavu, iz zahteva bez `client_id`, ne navodi nijednu aplikaciju i biva odbijen.
- **Telo.** Pošaljite `multipart/form-data` sa jednom datotekom slike. imagehoster uzima prvu datoteku, kakvo god bilo ime polja.
- **Veličina.** Pošaljite zaglavlje `Content-Length`. Datoteka ne sme da bude veća od `max_image_size` te instance.

Odgovor je u formatu JSON. Kada uspe, sadrži adresu slike:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

Kada ne uspe, imagehoster odgovara statusom greške HTTP. Većina neuspeha nosi i ime greške:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Napomena:** Token putuje u adresi. Nudite svoj imagehoster samo preko https i držite njegove dnevnike pristupa u tajnosti.

## Primer {#example}

Ova funkcija za pregledač otprema datoteku iz polja za datoteku ili iz prevlačenja. Pregledač umesto vas postavlja višedelna zaglavlja i dužinu: nemojte sami postavljati `Content-Type`.

```js
// IMAGEHOSTER_URL is the address of your imagehoster, such as 'https://YOUR_IMAGEHOSTER'.
async function uploadImage(file, accessToken) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${IMAGEHOSTER_URL}/hs/${accessToken}`, {
    method: 'POST',
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.name ?? `Upload failed with status ${response.status}`);
  }
  return result.url;
}

const url = await uploadImage(input.files[0], ACCESS_TOKEN);
const markdown = `![](${url})`; // add this to the post body
```
