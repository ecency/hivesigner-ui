Ein Hivesigner-Token ist eine kurze signierte Aussage. Sie nennt ein Hive-Konto, die App, für die sie erstellt wurde, und den Zeitpunkt der Signatur. Ihr Server kann ein Token über die API oder selbst prüfen. Diese Seite zeigt, was ein Token enthält, wie lange es gilt und beide Wege der Prüfung.

## Wie ein Token aussieht {#format}

Ein Token ist ein JSON-Objekt, kodiert in base64url, mit einem Unterschied zum üblichen base64url: Als Füllzeichen dient `.` statt `=`. Verglichen mit einfachem base64 wird also aus `+` ein `-`, aus `/` ein `_` und aus `=` ein `.`. Jedes Token beginnt mit `eyJzaWduZWRfbWVzc2FnZSI6`.

Dekodiert sieht ein Zugriffstoken aus dem Token-Flow so aus:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Feld | Bedeutung |
| --- | --- |
| `signed_message.type` | Was das Token ist: `login`, `posting`, `code` oder `refresh`. Siehe [Arten von Tokens](#kinds). |
| `signed_message.app` | Das App-Konto, für das das Token erstellt wurde. Ein Anmeldetoken einer Website ohne App-Konto hat keines. |
| `authors[0]` | Das Hive-Konto, für das das Token gilt. |
| `timestamp` | Wann es signiert wurde, in Sekunden seit dem 1970-01-01 UTC. |
| `signatures[0]` | Die Signatur, als Hex-Zeichenkette. |
| `authority` | Nur in Tokens, die im Browser signiert wurden: welcher Schlüssel der Person signiert hat, `posting` oder `active`. Dieses Feld liegt außerhalb der signierten Daten. Um den signierenden Schlüssel zu kennen, gewinnen Sie ihn aus der Signatur zurück. |

Die Signatur ist eine secp256k1-Signatur über den sha256-Hash von `JSON.stringify({ signed_message, authors, timestamp })`, mit den Schlüsseln in dieser Reihenfolge.

### Ein Token dekodieren {#decode}

In Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

In einem Browser:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Dekodieren ist kein Prüfen. Jeder kann eine Zeichenkette bauen, die zu dieser Form dekodiert. [Prüfen Sie ein Token](#check-a-token), bevor Sie ihm vertrauen.

## Arten von Tokens {#kinds}

| Token | `type` | `app` | Signiert von | Woher Sie es bekommen |
| --- | --- | --- | --- | --- |
| Zugriffstoken, Token-Flow | `posting` | Ihre App | Dem Posting-Schlüssel der Person oder ihrem Active-Schlüssel, wenn Hivesigner keinen Posting-Schlüssel für das Konto hat | `access_token` an Ihrem Callback |
| Anmeldetoken, `scope=login` | `login` | Ihre App | Dem Posting- oder Active-Schlüssel der Person | `access_token` an Ihrem Callback |
| Anmeldetoken, Website ohne App-Konto | `login` | Keines | Dem Posting- oder Active-Schlüssel der Person | `access_token` an Ihrem Callback |
| Code | `code` | Ihre App | Dem Posting- oder Active-Schlüssel der Person | `code` an Ihrem Callback |
| Zugriffstoken, Code-Flow | `posting` | Ihre App | Dem Posting-Schlüssel von @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Refresh-Token | `refresh` | Ihre App | Dem Posting-Schlüssel von @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Ein Code und ein Refresh-Token sind keine Zugriffstokens. Akzeptieren Sie keines von beiden je als Anmeldung.

## Wie lange ein Token gilt {#lifetime}

Ein Zugriffstoken gilt 7 Tage: `expires_in` ist 604800 Sekunden, gezählt ab seinem `timestamp`. Wenn es abgelaufen ist:

- **Token-Flow:** Schicken Sie die Person erneut zur Anmeldung. Wer Ihre App bereits autorisiert hat, sieht "Anmelden bei APP" und braucht einen Klick.
- **Code-Flow:** Ihr Server holt sich mit dem Refresh-Token und Ihrem Client-Secret ein neues Zugriffstoken. Siehe [Erneuern](/docs/oauth2#refresh).

Behandeln Sie ein Token als abgelaufen, sobald sein `timestamp` älter als 7 Tage ist. Akzeptieren Sie ein viel geringeres Alter für alles, was Sie direkt nach der Weiterleitung prüfen. Tauschen Sie einen Code sofort. Akzeptieren Sie ein Anmeldetoken nur innerhalb weniger Minuten nach seinem `timestamp`.

## Ein Token auf Ihrem Server prüfen {#check-a-token}

Bevor Ihr Server einem Token vertraut, das ein Browser oder eine App ihm sendet, prüfen Sie, dass:

- das Konto oder @hivesigner es wirklich signiert hat;
- es für Ihre App erstellt wurde;
- es die Art Token ist, die Sie erwarten;
- es jung genug ist.

### Die API fragen {#check-with-the-api}

Rufen Sie `/api/me` mit dem Token auf. Ein gültiges Token liefert das Konto in `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Ein ungültiges Token liefert `401` mit `invalid_grant`. Siehe [GET /api/me](/docs/api#me).

`/api/me` bestätigt die Signatur. Die Antwort nennt nicht die App, für die das Token erstellt wurde. Dekodieren Sie das Token also zusätzlich und prüfen Sie `app`, `type` und Alter selbst. Ein Token, das für eine andere App erstellt wurde, darf niemanden bei Ihnen anmelden.

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

Die API akzeptiert nur Tokens, die eine App nennen. Prüfen Sie ein Anmeldetoken einer Website ohne App-Konto [selbst](#check-it-yourself).

### Selbst prüfen {#check-it-yourself}

1. Dekodieren Sie das Token.
2. Prüfen Sie, dass `signed_message.type` die erwartete Art ist: `posting` für ein Zugriffstoken, `login` für ein Anmeldetoken.
3. Prüfen Sie, dass `signed_message.app` das Konto Ihrer App ist. Für eine Website ohne App-Konto prüfen Sie, dass keines vorhanden ist.
4. Prüfen Sie das Alter anhand von `timestamp`.
5. Berechnen Sie den sha256-Hash von `JSON.stringify({ signed_message, authors, timestamp })`.
6. Gewinnen Sie den öffentlichen Schlüssel aus `signatures[0]` und diesem Hash zurück.
7. Lesen Sie das Konto `authors[0]` jetzt aus der Hive-Blockchain, denn Menschen können ihre Schlüssel wechseln. Der zurückgewonnene Schlüssel muss einer seiner aktuellen Posting- oder Active-Schlüssel sein. Ein Token aus `/api/oauth2/token` ist stattdessen von @hivesigner signiert: Akzeptieren Sie dafür einen aktuellen Posting-Schlüssel des Kontos @hivesigner.

In Node.js mit [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), das `PrivateKey`, `PublicKey`, `Signature` und `callRPC` unter `@ecency/sdk/hive` bereitstellt:

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

So nutzen Sie es:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

Die Bibliothek dhive (`@hiveio/dhive`) geht auch: Berechnen Sie den Hash mit `cryptoUtils.sha256(message)` und gewinnen Sie den Schlüssel mit `Signature.fromString(signatures[0]).recover(digest).toString()` zurück.

## Tokens sicher aufbewahren {#keep-tokens-safe}

Wer ein Posting-Token besitzt, kann bis zu dessen Ablauf über Ihre App als die Person übertragen. Behandeln Sie es wie ein Passwort.

- **Bewahren Sie Tokens auf Ihrem Server auf** oder in einem httpOnly-, Secure-Cookie. Refresh-Tokens und Ihr Client-Secret gehören ausschließlich auf den Server.
- **Legen Sie ein Token nie in eine URL, die Sie protokollieren.** Der Token-Flow liefert das Token im Query-String Ihres Callbacks. Lesen Sie es auf Ihrem Server und leiten Sie dann auf eine URL ohne Token weiter. Lassen Sie den Query-String des Callbacks aus Ihren Protokollen heraus.
- **Laden Sie auf Ihrer Callback-Seite nichts von anderen Websites,** damit die Adresse mit dem Token nicht an sie geht. Ein Header `Referrer-Policy: no-referrer` auf dieser Seite hilft.
- **Senden Sie ein Token nur an Ihren eigenen Server und an `https://hivesigner.com/api/`.**

## Abmelden und Zugriff entziehen {#sign-out}

- **Eine Person abmelden** heißt, das Token zu verwerfen: Löschen Sie es aus Ihrer Sitzung oder Ihrem Cookie. Sie können zusätzlich [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) aufrufen, um Hivesigner mitzuteilen, dass die Person sich abgemeldet hat. Ihre App verwirft das Token ohnehin selbst.
- **Den Zugriff Ihrer App dauerhaft zu beenden,** ist die Entscheidung der Person. Unter https://hivesigner.com/authorized-apps oder unter `https://hivesigner.com/revoke/APP` entfernt sie das Konto Ihrer App on-chain aus ihrer Posting-Berechtigung. Danach überträgt die API nicht mehr über Ihre App für sie.
