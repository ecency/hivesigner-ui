Envoyez les gens sur Hivesigner pour se connecter à votre application. Ils y examinent votre demande et l’approuvent. Hivesigner les renvoie ensuite vers votre URL de rappel avec un jeton (le flux par jeton) ou avec un code que votre serveur échange contre des jetons (le flux par code). Cette page couvre les deux flux, chaque paramètre et les portées.

## Avant de commencer {#before-you-start}

- Enregistrez votre application : un compte Hive pour elle, avec vos URL de rappel listées. Voir [Enregistrer votre application](/docs/register-app).
- Pour diffuser via l’API, le compte de votre application doit aussi [accorder l’autorité de publication à @hivesigner](/docs/register-app#grant-hivesigner).
- Pour le flux par code, définissez un [secret client](/docs/register-app#client-secret).

## L’URL d’autorisation {#authorize-url}

Envoyez la personne à cette adresse :

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Encodez chaque valeur pour une URL. `URLSearchParams` le fait pour vous :

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### Paramètres {#parameters}

| Paramètre | Obligatoire | Ce qu’il fait |
| --- | --- | --- |
| `client_id` | Oui, pour une application | Le nom du compte de votre application. `clientId` est lu aussi. Sans lui, la demande est une demande de connexion seule depuis un site sans compte d’application : voir [Connexion sans accès de publication](/docs/login-only). |
| `redirect_uri` | Oui | Où Hivesigner renvoie la personne. Ce doit être exactement l’une des URI de redirection de votre application. Voir [URL de rappel](/docs/register-app#callbacks). |
| `scope` | Non | `login`, `posting` ou `offline`. Voir [Portées](#scopes). Sans lui, la demande porte sur l’accès de publication. |
| `response_type` | Non | `code` démarre le [flux par code](#code-flow). Toute autre valeur, ou aucune, signifie le [flux par jeton](#token-flow). |
| `state` | Recommandé | Une valeur aléatoire que Hivesigner renvoie inchangée. Voir [Protéger la demande avec state](#state). |
| `account` | Non | Un nom d’utilisateur Hive. Quand ce compte est sur l’appareil de la personne, Hivesigner le sélectionne. Sinon il est ignoré. `select_account` est lu aussi. |

La personne peut toujours changer de compte sur l’écran de consentement. Prenez toujours le compte dans le jeton ou dans l’échange de code, jamais dans ce que vous avez demandé.

## Portées {#scopes}

Hive a une seule autorité de publication. Hivesigner a donc deux niveaux d’accès, connexion seule et publication, et rien de plus fin entre les deux.

| `scope` | Ce que la personne approuve | Flux | `type` du jeton d’accès |
| --- | --- | --- | --- |
| `login` | « Voir le nom d’utilisateur de votre compte ». Rien n’est accordé. | Flux par jeton (n’ajoutez pas `response_type=code`) | `login` |
| `posting` | L’accès de publication. La première fois, cela ajoute le compte de votre application à l’autorité de publication de la personne. | Flux par jeton, ou flux par code avec `response_type=code` | `posting` |
| `offline` | L’accès de publication, comme ci-dessus | Flux par code | `posting`, avec un jeton `refresh` |

Dans le flux par code, l’URL de rappel reçoit d’abord un code (un jeton de `type` `code`) que votre serveur échange contre le jeton d’accès.

- **Aucune portée** signifie `posting`.
- **Une valeur contenant `offline`** n’importe où signifie `offline`, par exemple l’ancien `offline,vote,comment`.
- **Toute autre valeur** signifie `posting`. Cela inclut les anciens noms d’opérations comme `vote`, `comment`, `vote,comment`, `comment_options` ou `custom_json`. Ils ne limitent pas le jeton : tout jeton de publication permet les mêmes opérations. Voir [Ce que broadcast accepte](/docs/api#broadcast-rules).

Demandez `login` quand votre application a seulement besoin de savoir qui est la personne. Voir [Connexion sans accès de publication](/docs/login-only).

## Le flux par jeton {#token-flow}

Le navigateur de la personne reçoit le jeton d’accès directement. Votre application n’a besoin d’aucun secret.

1. Envoyez la personne à l’URL d’autorisation :

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. La personne approuve. Hivesigner redirige vers votre URL de rappel :

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner ajoute ses paramètres avec `?` quand votre URL de rappel n’a pas de requête et avec `&` quand elle en a une. `state` n’est présent que si vous en avez envoyé un non vide.

3. Sur votre URL de rappel, [comparez d’abord `state`](#state). Puis [vérifiez le jeton](/docs/tokens#check-a-token) sur votre serveur. Le compte auquel il se rapporte est dans le jeton : ne vous fiez pas au seul paramètre `username`, car n’importe qui peut modifier une URL.
4. Gardez le jeton sur votre serveur ou dans un cookie httpOnly. Redirigez vers une URL propre pour que le jeton quitte la barre d’adresse.
5. Utilisez le jeton avec l’[API](/docs/api) jusqu’à son expiration après `expires_in` secondes (7 jours). Envoyez ensuite la personne de nouveau à l’URL d’autorisation. Celle qui a déjà accordé l’accès de publication voit « Se connecter à APP » et « Vous avez déjà autorisé @myapp. Aucun nouvel accès n’est accordé. ».

## Le flux par code {#code-flow}

Votre serveur reçoit un code et l’échange contre un jeton d’accès et un jeton de rafraîchissement. Il pourra les renouveler plus tard sans la personne. Utilisez-le quand votre serveur agit pour des utilisateurs sur la durée.

1. Envoyez la personne à l’URL d’autorisation avec `scope=offline` :

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` fait la même chose.

2. La personne approuve l’accès de publication. Hivesigner redirige vers votre URL de rappel :

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [Comparez `state`](#state). Puis échangez le code tout de suite, depuis votre serveur.

### Échanger le code {#exchange-code}

Envoyez le code et votre secret client à `/api/oauth2/token` dans le corps d’une requête POST :

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

La réponse :

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Le même appel en Node.js 18 ou plus récent :

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- Mettez le code et le secret dans le corps de la requête, jamais dans l’URL.
- N’envoyez aucun en-tête `Authorization` avec cette requête.
- Utilisez le `username` de cette réponse. Il vient du code, que la personne a signé.
- Gardez le jeton d’accès et le jeton de rafraîchissement sur votre serveur.

### Rafraîchir {#refresh}

Quand le jeton d’accès expire, envoyez le jeton de rafraîchissement avec votre secret client au même point d’accès :

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

La réponse a la même forme, avec un nouveau jeton d’accès et un nouveau jeton de rafraîchissement. Stockez les deux à la place des anciens.

## Protéger la demande avec state {#state}

Sans `state`, un autre site pourrait envoyer votre utilisateur vers votre URL de rappel avec un jeton ou un code de son choix. Votre application connecterait alors la personne au compte de quelqu’un d’autre. `state` lie chaque retour au navigateur qui a commencé la connexion.

1. Générez une valeur aléatoire pour chaque connexion, au moins 16 octets aléatoires. L’hexadécimal la garde exempte de caractères à encoder.
2. Stockez-la là où seul ce navigateur peut la représenter : la session de votre serveur, ou un cookie httpOnly et Secure de courte durée avec `SameSite=Lax`.
3. Envoyez-la comme `state` dans l’URL d’autorisation.
4. Sur votre URL de rappel, comparez le paramètre `state` à la valeur stockée. S’il manque ou diffère, arrêtez-vous : n’utilisez ni le jeton ni le code.
5. Supprimez la valeur stockée, pour que chacune ne serve qu’une fois.

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner renvoie la même valeur de `state` que celle reçue. Il omet une valeur vide.

## Ce que voit la personne {#what-the-user-sees}

L’écran de consentement affiche l’image et le nom de votre application, « Compte Hive @myapp » et « Vous redirige vers HOST », HOST étant repris de votre URL de rappel. Puis :

- **Première demande de publication.** Le titre indique « APP demande l’accès à votre compte. ». La carte **Portée** liste ce que votre application pourra faire. Un avis indique « Première autorisation : cette opération ajoute @myapp à votre autorité de publication sur la blockchain et nécessite une fois votre clé active. Ce compte pourra publier en votre nom jusqu’à ce que vous le révoquiez. ». Le bouton indique **Autoriser**. Quand l’appareil de la personne ne contient aucune clé active pour le compte, l’écran la demande sur place.
- **Connexion.** Pour `scope=login`, ou pour un accès de publication déjà accordé, le titre indique « Se connecter à APP » et le bouton indique **Se connecter**.
- **Le compte.** « Autorisation en tant que » ou « Connexion en tant que », suivi du compte sélectionné. La personne peut changer de compte ici.
- **Un compte verrouillé.** Un champ de code d’accès se trouve au-dessus du bouton. Un clic déverrouille le compte et poursuit.
- **Aucun compte sur l’appareil.** Le bouton indique **Continuer**. Il ouvre le formulaire d’ajout de compte et revient ensuite à la demande.

Après une première demande de publication, Hivesigner attend que la nouvelle autorisation soit visible sur la blockchain avant de rediriger. Cela peut prendre quelques secondes. Pour l’écran complet du point de vue de la personne, voir [Se connecter aux applications](/docs/signing-in).

## Annulation et demandes refusées {#cancel}

- **Annulation.** La personne va dans sa liste de comptes dans Hivesigner. Rien n’est envoyé à votre URL de rappel : il n’y a aucun paramètre d’erreur. Gardez votre bouton de connexion disponible pour que la personne puisse recommencer. N’attendez aucun retour.
- **Demandes refusées.** Une URL de rappel non enregistrée, un `client_id` inconnu ou un `redirect_uri` absent affichent une erreur dans Hivesigner avec un bouton **Signaler ce problème**. Rien n’est envoyé à votre URL de rappel. Voir [Ce que voient les utilisateurs quand quelque chose ne va pas](/docs/register-app#refused-requests).

## L’ancienne URL de demande de connexion {#legacy-login-request}

Hivesigner accepte encore l’ancienne URL de connexion, conservée pour les intégrations d’autrefois. Utilisez `/oauth2/authorize` pour les nouvelles.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

Elle ouvre le même écran de consentement, avec les mêmes vérifications d’URL de rappel et la même redirection. Elle lit ses paramètres autrement :

- `scope` vaut `login` ou `posting`. Toute autre valeur, ou aucune, signifie `login`.
- `offline` n’est pas lu. Pour le flux par code, ajoutez `response_type=code`.
- `account` n’est pas lu.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` suit les mêmes règles.
