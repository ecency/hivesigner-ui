Un jeton Hivesigner est une courte déclaration signée. Il nomme un compte Hive, l’application pour laquelle il a été créé et l’heure de sa signature. Votre serveur peut vérifier un jeton avec l’API ou par lui-même. Cette page montre ce que contient un jeton, combien de temps il dure et les deux façons de le vérifier.

## À quoi ressemble un jeton {#format}

Un jeton est un objet JSON encodé en base64url, avec une différence par rapport au base64url standard : le remplissage utilise `.` au lieu de `=`. Comparé au base64 simple, `+` devient `-`, `/` devient `_` et `=` devient `.`. Chaque jeton commence par `eyJzaWduZWRfbWVzc2FnZSI6`.

Décodé, un jeton d’accès du flux par jeton ressemble à ceci :

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Champ | Signification |
| --- | --- |
| `signed_message.type` | Ce qu’est le jeton : `login`, `posting`, `code` ou `refresh`. Voir [Sortes de jetons](#kinds). |
| `signed_message.app` | Le compte d’application pour lequel le jeton a été créé. Un jeton de connexion pour un site sans compte d’application n’en a aucun. |
| `authors[0]` | Le compte Hive auquel le jeton se rapporte. |
| `timestamp` | Quand il a été signé, en secondes depuis le 1970-01-01 UTC. |
| `signatures[0]` | La signature, sous forme de chaîne hexadécimale. |
| `authority` | Seulement dans les jetons signés dans le navigateur : quelle clé de la personne a signé, `posting` ou `active`. Ce champ est hors des données signées. Pour savoir quelle clé a signé, récupérez-la depuis la signature. |

La signature est une signature secp256k1 sur l’empreinte sha256 de `JSON.stringify({ signed_message, authors, timestamp })`, avec les clés dans cet ordre.

### Décoder un jeton {#decode}

En Node.js :

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

Dans un navigateur :

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Décoder n’est pas vérifier. N’importe qui peut fabriquer une chaîne qui se décode sous cette forme. [Vérifiez un jeton](#check-a-token) avant de lui faire confiance.

## Sortes de jetons {#kinds}

| Jeton | `type` | `app` | Signé par | Où vous l’obtenez |
| --- | --- | --- | --- | --- |
| Jeton d’accès, flux par jeton | `posting` | Votre application | La clé de publication de la personne, ou sa clé active quand Hivesigner n’a aucune clé de publication pour le compte | `access_token` sur votre URL de rappel |
| Jeton de connexion, `scope=login` | `login` | Votre application | La clé de publication ou active de la personne | `access_token` sur votre URL de rappel |
| Jeton de connexion, site sans compte d’application | `login` | Aucune | La clé de publication ou active de la personne | `access_token` sur votre URL de rappel |
| Code | `code` | Votre application | La clé de publication ou active de la personne | `code` sur votre URL de rappel |
| Jeton d’accès, flux par code | `posting` | Votre application | La clé de publication de @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Jeton de rafraîchissement | `refresh` | Votre application | La clé de publication de @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Un code et un jeton de rafraîchissement ne sont pas des jetons d’accès. N’acceptez jamais l’un ou l’autre comme connexion.

## Combien de temps dure un jeton {#lifetime}

Un jeton d’accès dure 7 jours : `expires_in` vaut 604800 secondes, comptées depuis son `timestamp`. Une fois expiré :

- **Flux par jeton :** renvoyez la personne se connecter. Celle qui a déjà autorisé votre application voit « Se connecter à APP » et n’a qu’un clic à faire.
- **Flux par code :** votre serveur obtient un nouveau jeton d’accès avec le jeton de rafraîchissement et votre secret client. Voir [Rafraîchir](/docs/oauth2#refresh).

Considérez un jeton comme expiré dès que son `timestamp` a plus de 7 jours. Acceptez un âge bien plus court pour tout ce que vous vérifiez juste après la redirection. Échangez un code tout de suite. N’acceptez un jeton de connexion que dans les quelques minutes suivant son `timestamp`.

## Vérifier un jeton sur votre serveur {#check-a-token}

Avant que votre serveur fasse confiance à un jeton qu’un navigateur ou une application lui envoie, vérifiez que :

- le compte ou @hivesigner l’a bien signé ;
- il a été créé pour votre application ;
- c’est la sorte de jeton que vous attendez ;
- il est assez récent.

### Demander à l’API {#check-with-the-api}

Appelez `/api/me` avec le jeton. Un jeton valide renvoie le compte dans `user` :

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Un jeton non valide renvoie `401` avec `invalid_grant`. Voir [GET /api/me](/docs/api#me).

`/api/me` confirme la signature. Sa réponse ne nomme pas l’application pour laquelle le jeton a été créé. Décodez donc aussi le jeton et vérifiez vous-même ses `app`, `type` et âge. Un jeton créé pour une autre application ne doit connecter personne à la vôtre.

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

L’API n’accepte que les jetons qui nomment une application. Vérifiez [vous-même](#check-it-yourself) un jeton de connexion venant d’un site sans compte d’application.

### Vérifier vous-même {#check-it-yourself}

1. Décodez le jeton.
2. Vérifiez que `signed_message.type` est la sorte attendue : `posting` pour un jeton d’accès, `login` pour un jeton de connexion.
3. Vérifiez que `signed_message.app` est le compte de votre application. Pour un site sans compte d’application, vérifiez qu’il n’y en a aucun.
4. Vérifiez l’âge d’après `timestamp`.
5. Calculez l’empreinte sha256 de `JSON.stringify({ signed_message, authors, timestamp })`.
6. Récupérez la clé publique depuis `signatures[0]` et cette empreinte.
7. Lisez le compte `authors[0]` sur la blockchain Hive maintenant, car les gens peuvent changer leurs clés. La clé récupérée doit être l’une de ses clés de publication ou actives du moment. Un jeton venant de `/api/oauth2/token` est signé par @hivesigner : pour ceux-là, acceptez une clé de publication actuelle du compte @hivesigner.

En Node.js avec [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), qui expose `PrivateKey`, `PublicKey`, `Signature` et `callRPC` sous `@ecency/sdk/hive` :

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

Utilisez-le ainsi :

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

La bibliothèque dhive (`@hiveio/dhive`) convient aussi : calculez l’empreinte avec `cryptoUtils.sha256(message)` et récupérez la clé avec `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Garder les jetons en sûreté {#keep-tokens-safe}

Quiconque détient un jeton de publication peut diffuser en tant que la personne via votre application jusqu’à son expiration. Traitez-le comme un mot de passe.

- **Gardez les jetons sur votre serveur,** ou dans un cookie httpOnly et Secure. Gardez les jetons de rafraîchissement et votre secret client sur le serveur uniquement.
- **Ne mettez jamais un jeton dans une URL que vous journalisez.** Le flux par jeton livre le jeton dans la chaîne de requête de votre URL de rappel. Lisez-le sur votre serveur, puis redirigez vers une URL sans lui. Laissez la chaîne de requête de l’URL de rappel hors de vos journaux.
- **Ne chargez rien d’autres sites sur votre page de rappel,** pour que l’adresse contenant le jeton ne leur soit pas envoyée. Un en-tête `Referrer-Policy: no-referrer` sur cette page y aide.
- **N’envoyez un jeton qu’à votre propre serveur et à `https://hivesigner.com/api/`.**

## Se déconnecter et retirer l’accès {#sign-out}

- **Déconnecter une personne** veut dire jeter le jeton : supprimez-le de votre session ou de votre cookie. Vous pouvez aussi appeler [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) pour dire à Hivesigner que la personne s’est déconnectée. Votre application jette de toute façon le jeton elle-même.
- **Couper l’accès de votre application pour de bon** est le choix de la personne. Sur https://hivesigner.com/authorized-apps, ou sur `https://hivesigner.com/revoke/APP`, elle retire le compte de votre application de son autorité de publication sur la blockchain. Après cela, l’API ne diffuse plus pour elle via votre application.
