Une application qui connecte les gens avec Hivesigner est un compte Hive. Son nom est le `client_id` que vous envoyez. Son profil contient les réglages que Hivesigner lit : les URL de rappel auxquelles il peut envoyer des jetons et, pour le flux par code, un secret client. Pour diffuser via l’API, le compte d’application accorde aussi l’autorité de publication à @hivesigner. Cette page parcourt chaque étape.

## Ce qu’il vous faut {#what-you-need}

| Vous voulez | Compte d’application et URL de rappel | Secret client | Autorisation pour @hivesigner |
| --- | --- | --- | --- |
| Connecter les gens et diffuser avec le flux par jeton | Oui | Non | Oui |
| Connecter les gens et diffuser avec le flux par code (jetons de rafraîchissement) | Oui | Oui | Oui |
| Seulement connecter les gens, avec un jeton qui nomme votre application | Oui | Non | Non |
| Seulement connecter les gens, depuis un site sans compte Hive | Non | Non | Non |
| Envoyer des liens de signature | Non | Non | Non |

Pour les deux dernières lignes, voir [Connexion sans accès de publication](/docs/login-only) et [Liens de signature](/docs/sign-links).

## Créer le compte d’application {#app-account}

1. Créez un compte Hive pour votre application, par exemple sur https://ecency.com/signup. Utilisez un compte distinct pour l’application, pas le vôtre. Son nom est votre `client_id`. Les utilisateurs le voient sur l’écran de consentement à côté de « Compte Hive ». Un compte Hive ne peut pas être renommé, choisissez donc le nom avec soin.
2. Ajoutez le compte à Hivesigner sur https://hivesigner.com/import (**Ajouter un compte**). Utilisez la clé active ou le mot de passe maître : l’autorisation plus bas nécessite la clé active.

## Remplir les réglages de l’application {#app-settings}

Ouvrez https://hivesigner.com/profile avec le compte d’application sélectionné et réglez :

- **Ce compte est une application.** Activez-le. Cela marque le compte comme application, ce que l’API vérifie avant d’accepter un code ou un jeton de rafraîchissement pour lui.
- **URI de redirection.** Vos URL de rappel, une par ligne. Voir [URL de rappel](#callbacks).
- **Créateur.** Qui maintient l’application. L’annuaire des applications sur https://hivesigner.com/apps l’affiche.
- **Statut.** Production ou bac à sable, pour vos propres archives. Hivesigner traite les deux de la même façon.
- **Secret client.** Nécessaire uniquement pour le [flux par code](/docs/oauth2#code-flow). Voir [Secret client](#client-secret).

Remplissez aussi **Nom** et **URL de la photo de profil**. L’écran de consentement affiche l’image et le nom de votre application. L’annuaire des applications sur https://hivesigner.com/apps affiche le nom, **À propos** et **Site web**.

L’enregistrement met à jour le profil du compte sur la blockchain et nécessite sa clé de publication. Hivesigner lit vos URL de rappel depuis le compte à l’ouverture d’une demande de connexion, un changement s’applique donc dès que la transaction est dans un bloc.

> **Remarque :** Le nom, l’image et la description sont publiés par le compte de votre application lui-même. C’est pourquoi l’écran de consentement affiche aussi le vrai nom du compte (`@myapp`) et l’hôte vers lequel il envoie la personne : ce sont eux que l’autorisation et la redirection utilisent réellement.

## URL de rappel {#callbacks}

Une URL de rappel (le `redirect_uri` d’une demande de connexion) est l’endroit où Hivesigner renvoie la personne avec un jeton ou un code. Hivesigner ne l’envoie qu’à une URL de rappel listée sur le compte de votre application.

### Les règles {#callback-rules}

- **Correspondance exacte.** Le `redirect_uri` de la demande doit être l’une de vos URI de redirection, caractère pour caractère : schéma, hôte, port, chemin et requête.
- **https uniquement.** Une URL de rappel doit utiliser `https://`. Le `http://` simple n’est accepté que sur le bouclage local : `localhost`, `127.0.0.1` ou `[::1]`.
- **Les ports de bouclage peuvent changer.** Une URL de rappel de bouclage enregistrée en http simple correspond à tout hôte et port de bouclage ayant les mêmes chemin, requête, fragment et informations d’utilisateur. Une URL de rappel de bouclage enregistrée en `https://` reste une correspondance exacte.
- **Pas de schémas propriétaires.** Une URL de rappel comme `myapp://callback` est refusée. Voir [Applications mobiles et de bureau](#native-apps).
- **Pas de fragments.** N’ajoutez pas de `#fragment` à une URL de rappel.

La page de profil refuse d’enregistrer une URL de rappel qui ne pourrait jamais fonctionner, avec « URL de rappel inutilisable (https, ou http sur localhost) ».

### Exemples {#callback-examples}

Avec ces URI de redirection enregistrées :

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| `redirect_uri` de la demande | Résultat |
| --- | --- |
| `https://myapp.example/auth/callback` | Acceptée : correspondance exacte |
| `https://myapp.example/auth/callback/` | Refusée : `/` en trop |
| `https://myapp.example/auth/callback?next=home` | Refusée : la requête diffère |
| `https://www.myapp.example/auth/callback` | Refusée : autre hôte |
| `http://myapp.example/auth/callback` | Refusée : http simple hors bouclage |
| `http://localhost:3000/auth` | Acceptée : correspondance exacte |
| `http://127.0.0.1:51234/auth` | Acceptée : bouclage, même chemin, autre port |
| `http://[::1]:3000/auth` | Acceptée : bouclage, même chemin |
| `http://127.0.0.1:3000/other` | Refusée : autre chemin |
| `https://localhost:3000/auth` | Refusée : https ne correspond pas à un enregistrement en http simple |
| `myapp://auth` | Refusée : schéma propriétaire |

Pour accepter une requête sur votre URL de rappel, enregistrez l’URL avec cette requête exacte. Hivesigner conserve la requête propre à votre URL de rappel et ajoute ses paramètres après elle.

### Applications mobiles et de bureau {#native-apps}

Hivesigner met le jeton dans l’URL de rappel. Un schéma propriétaire comme `myapp://` n’est lié à aucune application en particulier : une autre application du même appareil peut le revendiquer et recevoir le jeton. Hivesigner refuse donc les schémas propriétaires et n’envoie les jetons qu’à une adresse https ou au bouclage local de l’appareil de la personne.

Une application native utilise plutôt l’une de ces voies :

- **Un lien https qui lui appartient.** Enregistrez une URL de rappel sur votre domaine que le système d’exploitation ouvre dans votre application (App Links sur Android ou Universal Links sur iOS).
- **Une URL de rappel de bouclage.** L’application écoute la redirection sur `127.0.0.1`. Enregistrez `http://127.0.0.1/auth` (ou `localhost`) et utilisez n’importe quel port libre à l’exécution : le port n’a pas à correspondre.

## Secret client {#client-secret}

Le secret client prouve qu’un échange de code vient de votre serveur. Il est obligatoire pour le [flux par code](/docs/oauth2#code-flow) : votre serveur l’envoie avec chaque code ou jeton de rafraîchissement à `/api/oauth2/token`. Le flux par jeton ne l’utilise pas.

- **Générez une longue valeur aléatoire**, par exemple avec `openssl rand -hex 32`.
- **Définissez-la sur la page de profil.** Hivesigner ne stocke que son empreinte sha256, dans le profil du compte de votre application. Laisser le champ vide conserve le secret actuel.
- **Gardez-le sur votre serveur.** Ne le mettez jamais dans une page web, une application mobile ou une URL.
- **Pour le changer,** définissez-en un nouveau et mettez votre serveur à jour en même temps.

## Accorder l’autorité de publication à @hivesigner {#grant-hivesigner}

L’API diffuse avec la clé de publication du compte @hivesigner. Hive n’accepte cette signature pour vos utilisateurs que si le compte de votre application a ajouté @hivesigner à sa propre autorité de publication. Voir [La chaîne d’autorité de publication](/docs/how-it-works#authority-chain).

1. Sélectionnez le compte de votre application dans Hivesigner.
2. Ouvrez https://hivesigner.com/authorize/hivesigner.
3. La page indique « Autoriser @hivesigner » et « @hivesigner pourra publier, commenter, voter et suivre en tant que @myapp. ». Choisissez **Autoriser**. Cela nécessite la clé active du compte d’application.

Vous ne le faites qu’une fois. Sans cela, chaque diffusion échoue avec `unauthorized_client` et « Broadcaster account doesn't have permission to broadcast for @myapp ». Une application de connexion seule n’en a pas besoin.

Cette autorisation permet aussi à @hivesigner de publier en tant que le compte de votre application lui-même, une raison de plus de réserver ce compte à l’application.

Les applications qui diffusent via Hivesigner avec cette autorisation en place peuvent apparaître dans l’annuaire des applications sur https://hivesigner.com/apps, classées selon le nombre de personnes qui les utilisent.

## Ce que voient les utilisateurs quand quelque chose ne va pas {#refused-requests}

Hivesigner refuse une demande à laquelle il ne peut pas répondre sans risque. Il affiche un message et un bouton **Signaler ce problème**. La demande ne peut pas être approuvée. Rien n’est envoyé à votre URL de rappel.

| Problème | Ce que lit la personne |
| --- | --- |
| Le `redirect_uri` n’est pas l’une de vos URI de redirection | « L’URL de redirection de cette application n’est pas enregistrée. Pour votre sécurité, la connexion est bloquée. » |
| Le `client_id` n’est pas un compte Hive | « @myapp n’est pas un compte Hive : il n’y a donc aucune application à autoriser. Retournez sur le site et réessayez. » |
| Le compte n’est pas marqué comme application | « @myapp n'est pas configuré comme une application et ne peut donc pas vous connecter. Retournez sur le site et réessayez. » Activez **Ce compte est une application**, comme ci-dessus. |
| Aucun `redirect_uri` dans la demande | « Cette demande d’autorisation est incomplète : elle n’indique aucune application ou aucune URL de redirection. Retournez sur l’application et réessayez. » |

Si vos utilisateurs signalent l’un de ces cas, comparez le `redirect_uri` envoyé par votre application à vos URI de redirection, caractère par caractère.

## Liste de contrôle {#checklist}

1. Un compte Hive pour l’application, ajouté à Hivesigner avec sa clé active.
2. Sur https://hivesigner.com/profile : « Ce compte est une application » activé, les URI de redirection listées, un secret client défini si vous utilisez le flux par code.
3. @hivesigner autorisé sur https://hivesigner.com/authorize/hivesigner, si vous diffusez via l’API.
4. Un lien de connexion qui envoie exactement l’une de vos URI de redirection. Voir [Se connecter avec OAuth2](/docs/oauth2).
