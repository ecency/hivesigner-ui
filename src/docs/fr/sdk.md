Le SDK JavaScript officiel construit les URL de connexion et les liens de signature et appelle l’API Hivesigner pour vous. Pour Python, il existe des bibliothèques communautaires. Tout autre langage peut appeler l’[API REST](/docs/api) directement.

## SDK JavaScript {#javascript}

Le SDK est le paquet npm `hivesigner`. Sa source est sur https://github.com/ecency/hivesigner-sdk. Il est écrit en TypeScript et fournit ses types.

La version 4 nécessite Node.js 18 ou plus récent, car elle utilise le `fetch` intégré. Dans les navigateurs, elle nécessite ES2017 ou plus récent. Là où il n’y a pas de `fetch` global, ajoutez un polyfill avant d’utiliser le SDK. Sur un Node.js plus ancien, restez sur la version 3.

### Installation {#install}

```bash
npm install hivesigner
```

Pour une page sans étape de build, chargez le bundle navigateur. Il définit un `hivesigner` global :

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Créer un client {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Option | Signification |
| --- | --- |
| `app` | Le compte de votre application, envoyé comme `client_id`. |
| `callbackURL` | Où Hivesigner renvoie la personne. Ce doit être l’une des URL de rappel de votre application, caractère pour caractère (une URL de rappel de bouclage en http simple peut différer par l’hôte et le port, voir [URL de rappel](/docs/register-app#callback-rules)). |
| `scope` | Une liste, jointe par des virgules dans le paramètre `scope`. Voir [Portées](/docs/oauth2#scopes). |
| `responseType` | `'code'` pour le flux par code. Omettez-le pour le flux par jeton. |
| `accessToken` | Le jeton d’accès de la personne, quand vous en avez déjà un. |
| `apiURL` | L’origine de l’API. Le SDK y ajoute `/api/`. La valeur par défaut est `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` et `setApiURL` modifient le client plus tard. Chacune renvoie le client.

### Connecter la personne {#sign-in}

`getLoginURL(state, account)` renvoie l’URL de connexion :

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` revient inchangé à votre URL de rappel. Utilisez-le pour lier la réponse à la demande.
- `account` est facultatif : un nom d’utilisateur. Hivesigner sélectionne ce compte quand il est sur l’appareil et l’ignore sinon.

Dans un navigateur, `client.login({ state: 'STATE' })` envoie la personne à la même URL, sans compte.

Dans le flux par jeton, votre URL de rappel reçoit `access_token`, `expires_in` et `username`. Donnez le jeton au client :

```js
client.setAccessToken('ACCESS_TOKEN');
```

Le SDK n’a pas de méthode pour l’échange du flux par code. Votre serveur envoie lui-même le code et le secret client à l’API, comme le montre [Échanger le code](/docs/oauth2#exchange-code).

### Obtenir la personne {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` est le compte Hive de la personne tel que la blockchain le renvoie. `scope` liste ce que le jeton autorise.

### Diffuser {#broadcast}

`broadcast(operations)` envoie des opérations à l’API, qui les diffuse pour la personne. L’API n’accepte que les opérations de publication dont l’auteur est la personne du jeton : `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` avec autorité de publication, `claim_reward_balance` et `account_update2` pour les métadonnées de profil. Voir [Ce que broadcast accepte](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Nommez la personne dans chaque opération. L’API ne remplace pas `__signer`.

Ces méthodes utilitaires construisent chacune une opération et appellent `broadcast` :

| Méthode | Diffuse |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` va de `-10000` à `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Pour un nouvel article, `parentAuthor` vaut `''`. `jsonMetadata` peut être un objet : le SDK le convertit en chaîne. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Passez `[]` comme `requiredAuths` et `['USERNAME']` comme `requiredPostingAuths`. `json` est une chaîne. |
| `reblog(account, author, permlink)` | `custom_json` avec l’id `follow`, qui repartage l’article |
| `follow(follower, following)` | `custom_json` avec l’id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` avec l’id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` avec l’id `follow`, `what: ['ignore']` (masquer) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Les montants sont des chaînes comme `'0.000 HIVE'`, `'0.000 HBD'` et `'1.000000 VESTS'`. |

`updateUserMetadata()` est obsolète. Pour changer le profil d’une personne, diffusez `account_update2` avec un nouveau `posting_json_metadata`.

### Se déconnecter {#log-out}

`revokeToken()` est l’appel de déconnexion du SDK. Il envoie le jeton au point d’accès de révocation de l’API puis le retire du client. Quand l’appel échoue, appelez `removeAccessToken()` vous-même. Supprimez aussi le jeton là où votre application l’a stocké.

Pour mettre fin à l’accès de votre application pour de bon, la personne le retire sur https://hivesigner.com/authorized-apps. Voir [Voir et retirer l’accès d’une application](/docs/signing-in#remove-access).

### Liens de signature {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` et `sendTransaction(tx, params)` renvoient un lien `https://hivesigner.com/sign/...`. `params` accepte `callback`, `no_broadcast` et `signer`. Voir [Liens de signature](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

En TypeScript, les types exigent le troisième argument : passez `undefined` pour récupérer le lien.

Dans un navigateur, passez une fonction en troisième argument pour ouvrir le lien dans un nouvel onglet. La fonction n’est pas appelée et rien n’est renvoyé. Appelez-la depuis un gestionnaire de clic, sinon le navigateur peut bloquer le nouvel onglet et l’appel lève une erreur.

### Promesses et fonctions de rappel {#promises-and-callbacks}

`me`, `broadcast`, les méthodes utilitaires et `revokeToken` renvoient une promesse. Passez une fonction en dernier argument pour utiliser une fonction de rappel à la place. Elle reçoit `(error, result)`.

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

Quand l’API répond par une erreur, la promesse est rejetée avec le corps d’erreur de l’API, `{ error, error_description }`. Avec une fonction de rappel, ce corps est l’argument `error`. Quand la réponse n’est pas du JSON, le rejet porte l’erreur d’analyse.

## Python {#python}

Ces bibliothèques viennent de la communauté. Leurs auteurs les maintiennent, pas l’équipe Hivesigner. Comparez-les à l’[API REST](/docs/api) avant de vous appuyer dessus.

| Bibliothèque | Auteur |
| --- | --- |
| hivesigner-python-client : https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, module `beem.hivesigner` : https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
