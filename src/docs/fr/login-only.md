Certaines applications ont seulement besoin de savoir qui est une personne sur Hive. Elles ne publient, ne votent et ne diffusent jamais rien pour elle. Hivesigner peut connecter les gens à une telle application sans aucune autorité de publication. La personne prouve qu’elle contrôle un compte Hive. Votre application en apprend le nom. Cette page montre les deux façons de faire et comment vérifier le résultat en toute sûreté.

## Deux façons {#two-ways}

- **Avec un compte d’application :** votre application a son propre compte Hive et demande `scope=login`. Le jeton nomme votre application.
- **Sans compte d’application :** un site sans compte Hive n’envoie qu’un `redirect_uri`. Le jeton ne nomme aucune application. Votre site le vérifie lui-même.

Aucune des deux ne nécessite d’autorisation de la personne ni du compte de votre application, rien ne change donc sur le compte de la personne. Hivesigner signe la connexion avec la clé de publication, ou avec la clé active quand l’appareil n’a aucune clé de publication pour le compte.

## Avec un compte d’application {#app-account}

1. [Enregistrez votre application](/docs/register-app) : créez son compte Hive et listez vos URL de rappel. Vous n’avez besoin ni d’un secret client ni de l’autorisation pour @hivesigner.
2. Envoyez la personne vers :

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. La personne voit « Se connecter à APP » avec la **Portée** « Voir le nom d’utilisateur de votre compte ». Elle choisit **Se connecter**.
4. Hivesigner redirige vers votre URL de rappel :

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [Comparez `state`](/docs/oauth2#state), puis vérifiez le jeton. C’est un jeton `login` qui nomme votre application, l’une ou l’autre voie fonctionne donc :
   - appelez [`GET /api/me`](/docs/api#me) avec lui, ce qui répond avec le compte dans `user` et `scope` `["login"]`, puis décodez le jeton et vérifiez `type` et `app` ([Demander à l’API](/docs/tokens#check-with-the-api)) ;
   - ou [vérifiez-le vous-même](/docs/tokens#check-it-yourself) avec `type: 'login'` et le nom de votre application.

Un jeton `login` ne peut rien diffuser : `/api/broadcast` refuse toute opération envoyée avec lui.

## Sans compte d’application {#no-app-account}

1. Envoyez la personne vers l’URL d’autorisation avec un `redirect_uri` et sans `client_id` :

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   L’URL de rappel doit être en `https://`, ou en `http://` sur le bouclage local (`localhost`, `127.0.0.1`, `[::1]`). Il n’y a aucune liste où l’enregistrer. Hivesigner ignore ici `scope` et `response_type` : la réponse est toujours un jeton de connexion.

2. La personne voit « HOST souhaite confirmer votre nom d’utilisateur Hive. », où HOST est l’hôte de votre URL de rappel. Elle choisit **Se connecter**.
3. Hivesigner redirige vers votre URL de rappel :

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [Comparez `state`](/docs/oauth2#state), puis vérifiez le jeton vous-même. L’API n’accepte pas un jeton qui ne nomme aucune application, votre serveur vérifie donc la signature contre les clés du compte. Voir [Vérifier vous-même](/docs/tokens#check-it-yourself), avec `type: 'login'` et sans `app`.

Quand l’URL de rappel n’est pas une adresse web, ou qu’elle est en `http://` simple hors bouclage local, Hivesigner refuse la demande et en explique la raison à la personne.

## Laquelle utiliser {#which-one}

| | Avec un compte d’application | Sans compte d’application |
| --- | --- | --- |
| Ce que voit la personne | Le nom, l’image et le compte Hive de votre application | Seulement l’hôte de votre site |
| Mise en place | Un compte Hive avec vos URL de rappel listées | Aucune |
| Le jeton nomme | Votre application | Aucune application |
| Vérifiez le jeton avec | `/api/me` ou votre propre code | Votre propre code |
| Accès de publication plus tard | Avec le même compte : demandez `posting` et [autorisez @hivesigner](/docs/register-app#grant-hivesigner) | Nécessite d’abord un compte d’application |

Utilisez un compte d’application quand vous le pouvez. Les utilisateurs voient le nom et l’image de votre application. Votre serveur peut rejeter les jetons créés pour une autre application. Vous pourrez passer plus tard à l’accès de publication avec le même compte.

Utilisez la seconde voie quand votre site n’a pas de compte Hive et n’en veut pas.

## Vérifier la connexion en toute sûreté {#check-safely}

- **Liez la demande avec `state`.** Générez une valeur aléatoire par connexion, stockez-la dans la session de la personne, comparez-la sur votre URL de rappel et utilisez-la une seule fois. Voir [Protéger la demande avec state](/docs/oauth2#state).
- **Vérifiez le type.** N’acceptez que `signed_message.type` égal à `login`. Un code ou un jeton de rafraîchissement n’est pas une connexion.
- **Vérifiez l’application.** Avec un compte d’application, `signed_message.app` doit être votre application. Sans compte d’application, il ne doit y avoir aucun `app`.
- **Vérifiez l’âge.** Vous vérifiez le jeton juste après la redirection, ne l’acceptez donc que dans les quelques minutes suivant son `timestamp` (par exemple 5 minutes, avec une minute d’écart d’horloge).
- **Utilisez chaque jeton une seule fois.** Après une vérification réussie, démarrez votre propre session (par exemple un cookie httpOnly) et jetez le jeton Hivesigner. Gardez trace des jetons acceptés jusqu’à ce qu’ils soient trop vieux pour passer la vérification d’âge. Refusez tout jeton que vous revoyez.
- **Gardez le jeton hors des journaux.** Il arrive dans la chaîne de requête de votre URL de rappel. Voir [Garder les jetons en sûreté](/docs/tokens#keep-tokens-safe).

## Exemples {#examples}

Des sites comme https://hivesearcher.com et https://openhive.chat laissent les gens se connecter avec leur compte Hive pour des fonctions qui restent hors chaîne, comme la recherche et la discussion. Ils doivent savoir qui est la personne et rien de plus.
