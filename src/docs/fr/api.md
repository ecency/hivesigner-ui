L’API Hivesigner se trouve sur `https://hivesigner.com/api/`. Elle renvoie le compte de la personne connectée, diffuse les opérations de publication pour elle, échange les codes contre des jetons et liste les applications qui utilisent Hivesigner. Cette page décrit chaque point d’accès avec ses requêtes, ses réponses et ses erreurs.

## Requêtes et authentification {#authentication}

- **URL de base :** `https://hivesigner.com/api/`. Chaque point d’accès ci-dessous est relatif à `https://hivesigner.com`.
- **Le jeton :** envoyez-le tel quel dans l’en-tête `Authorization` : `Authorization: ACCESS_TOKEN`. Un préfixe `Bearer ` est accepté aussi. Vous pouvez également l’envoyer comme `access_token` dans la chaîne de requête ou dans le corps, mais l’en-tête le garde hors des URL et des journaux.
- **Corps :** JSON avec `Content-Type: application/json`, ou un formulaire (`application/x-www-form-urlencoded`).
- **Réponses :** JSON.
- **Navigateurs :** l’API autorise les requêtes multi-origines, une application web peut donc l’appeler directement.

Pour obtenir un jeton, voir [Se connecter avec OAuth2](/docs/oauth2). Pour ce que contient un jeton, voir [Jetons](/docs/tokens).

## Erreurs {#errors}

Une réponse d’erreur a un statut HTTP d’erreur et ce corps :

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Statut | `error` | Quand |
| --- | --- | --- |
| 401 | `invalid_grant` | Le jeton est absent ou non valide, ou c’est la mauvaise sorte pour ce point d’accès (« The token has invalid role »). Sur `/api/oauth2/token`, aussi « The code or secret is not valid ». |
| 401 | `invalid_scope` | `/api/broadcast` : une opération que le jeton n’autorise pas. La description nomme les opérations. |
| 401 | `unauthorized_client` | `/api/broadcast` : une opération dont l’auteur n’est pas la personne du jeton, un `account_update2` qui touche aux clés, une autorisation d’autorité de publication manquante ou un compte impossible à charger. La description dit lequel. |
| 500 | `server_error` | `/api/broadcast` : le réseau Hive a refusé la transaction. `error_description` porte son message. |
| 503 | `unavailable` | `/api/apps` : l’annuaire est encore en cours de construction. |

## GET /api/me {#me}

Renvoie le compte auquel le jeton se rapporte. Utilisez-le pour savoir qui s’est connecté, ou pour [vérifier un jeton](/docs/tokens#check-with-the-api).

- **Méthodes :** `GET` ou `POST`.
- **Jeton :** un jeton d’accès, y compris un jeton `login` qui nomme une application.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

La réponse, abrégée :

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| Champ | Signification |
| --- | --- |
| `user` | Le nom d’utilisateur Hive auquel le jeton se rapporte. `_id` et `name` le répètent. |
| `account` | Le compte entier, tel que le renvoie `condenser_api.get_accounts` de Hive. |
| `scope` | Ce que le jeton autorise : `["login"]` pour un jeton de connexion, sinon les opérations que `/api/broadcast` accepte. |
| `user_metadata` | Les métadonnées de profil du compte, lues depuis du JSON. |

`/api/me` ne nomme pas l’application pour laquelle le jeton a été créé. Pour le vérifier, décodez le jeton : voir [Demander à l’API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Signe les opérations de publication de la personne du jeton avec la clé de publication de @hivesigner et les diffuse sur Hive.

- **Méthode :** `POST`.
- **Jeton :** un jeton d’accès `posting`, du flux par jeton ou du flux par code.
- **Avant que cela fonctionne :** la personne a accordé l’autorité de publication au compte de votre application (l’écran de consentement le fait) et le compte de votre application a [accordé l’autorité de publication à @hivesigner](/docs/register-app#grant-hivesigner).
- **Corps :** `{ "operations": [...] }`, où chaque opération est `[name, fields]` comme sur la blockchain Hive. Toutes les opérations d’une requête entrent dans une seule transaction.

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

La même requête avec curl :

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Un abonnement est une opération `custom_json` :

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

L’API répond dès qu’un nœud Hive a accepté la transaction. `result.id` est l’identifiant de la transaction :

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Quand le réseau refuse la transaction, la réponse est `500` avec `server_error`. Son `error_description` porte le message du réseau et `response` porte l’erreur brute.

### Ce que broadcast accepte {#broadcast-rules}

Un jeton de publication laisse l’API diffuser ces opérations et aucune autre. Dans chacune, la personne du jeton doit être le compte indiqué dans le champ montré :

| Opération | La personne du jeton doit être |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | Le premier compte de `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Toute autre opération** est refusée avec `invalid_scope`. Un jeton `login` n’autorise aucune opération.
- **Une opération pour un autre compte** est refusée avec `unauthorized_client`. Un jeton ne diffuse jamais que pour sa propre personne.
- **`account_update2`** ne peut changer que les métadonnées du compte. Une opération avec un champ `owner`, `active` ou `posting` est refusée avec `unauthorized_client`.
- **`custom_json`** : laissez `required_auths` vide. L’API signe avec l’autorité de publication, une opération qui nécessite l’autorité active échoue donc sur le réseau.

Les transferts et les autres opérations de portefeuille nécessitent la clé active de la personne. Envoyez-les plutôt sous forme de [liens de signature](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

Échange un code contre des jetons, ou un jeton de rafraîchissement contre de nouveaux jetons. Ne l’appelez que depuis votre serveur. Voir [Le flux par code](/docs/oauth2#code-flow).

- **Méthode :** `POST`, avec les valeurs dans le corps.
- **Corps :** `code` et `client_secret`, ou `refresh_token` et `client_secret`.
- **En-têtes :** n’envoyez aucun en-tête `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Chaque appel renvoie un nouveau jeton d’accès et un nouveau jeton de rafraîchissement. Les deux sont signés par @hivesigner. `expires_in` est la durée de vie du jeton d’accès en secondes (7 jours).

Erreurs : `401 invalid_grant`. La description est « The token has invalid role » quand la valeur envoyée n’est ni un code ni un jeton de rafraîchissement valide. Elle est « The code or secret is not valid » quand le code ou le secret ne correspond pas.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Indique à Hivesigner que la personne s’est déconnectée de votre application. Votre application jette le jeton elle-même.

- **Méthode :** `POST`.
- **Jeton :** le jeton d’accès, dans l’en-tête `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

Le `revokeToken()` du SDK JavaScript fait cet appel puis oublie le jeton. Pour retirer l’accès de votre application pour de bon, la personne le retire sur https://hivesigner.com/authorized-apps. Voir [Se déconnecter et retirer l’accès](/docs/tokens#sign-out).

## GET /api/apps {#apps}

L’annuaire public des applications : les applications qui diffusent via Hivesigner, classées selon le nombre de personnes qui les utilisent. Il ne nécessite aucun jeton. https://hivesigner.com/apps affiche la même liste.

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| Champ | Signification |
| --- | --- |
| `updated_at` | Quand l’annuaire a été construit pour la dernière fois. |
| `building` | `true` jusqu’à ce que la première construction ait des données. `apps` est alors vide. |
| `window_days` | Le nombre de jours que couvre le classement. |
| `featured` | Les noms d’utilisateur affichés en premier, dans cet ordre. |
| `apps[].username` | Le compte de l’application. |
| `apps[].name`, `about` | Depuis le profil du compte de l’application, ou `null`. |
| `apps[].website` | Le site web du profil, quand il répond sur son propre domaine. Sinon `null`. |
| `apps[].site` | Le résultat de la vérification du site web : `ok`, `no_website`, `invalid`, `redirected`, `blocked` ou `unreachable`. Une entrée `redirected` porte aussi `redirects_to`. |
| `apps[].users` | Utilisateurs distincts par jour, cumulés sur la période. |
| `apps[].requests` | Requêtes API réussies faites pour l’application sur la période. |
| `apps[].first_seen`, `last_seen` | Le premier jour où Hivesigner a enregistré l’application et le dernier jour où elle a été utilisée, ou `null`. |
| `apps[].new` | `true` quand l’application est apparue pour la première fois dans la période. |

La réponse peut être mise en cache jusqu’à 5 minutes. Avant la première construction de l’annuaire, l’API répond `503` avec `unavailable`. Réessayez plus tard.

Les noms et les descriptions sont publiés par chaque compte d’application lui-même. Hivesigner n’en vérifie aucun.
