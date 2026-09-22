Hivesigner permet aux gens d’utiliser leur compte Hive dans votre application sans lui donner leurs clés. Il comporte deux parties : un signataire dans le navigateur sur https://hivesigner.com et une API sur `https://hivesigner.com/api/`. Cette page explique ce que fait chaque partie et les deux façons dont une application les utilise.

## Le signataire dans le navigateur {#browser-signer}

Le signataire dans le navigateur, c’est le site Hivesigner. Les gens y ajoutent leurs comptes Hive. Leurs clés restent dans leur propre navigateur : Hivesigner n’envoie aucune clé à aucun serveur. Votre application n’en voit jamais aucune.

Le signataire signe trois sortes de choses, chaque fois après que la personne a vu ce qu’elle signe :

- **Les jetons de connexion.** Votre application envoie quelqu’un se connecter sur Hivesigner. Hivesigner affiche le nom de votre application et ce qu’elle demande. Quand la personne approuve, Hivesigner signe avec sa clé une courte déclaration qui nomme son compte et votre application. Cette déclaration signée est le jeton que votre application reçoit. Voir [Se connecter avec OAuth2](/docs/oauth2) et [Jetons](/docs/tokens).
- **Les transactions.** Un lien de signature ouvre une transaction pour examen. Quand la personne approuve, Hivesigner la signe avec la clé qu’il lui faut. Il l’envoie ensuite au réseau Hive depuis le navigateur, sauf si le lien ne demande que la signature. Voir [Liens de signature](/docs/sign-links).
- **Les messages.** Votre application peut demander à une personne de signer un texte avec sa clé, pour prouver qu’elle contrôle le compte. Voir [Signature de messages](/docs/message-signing).

## L’API {#api}

L’API diffuse les opérations de publication pour une personne connectée à votre application : articles et commentaires, votes, abonnements et autres opérations `custom_json`, réclamation des récompenses et mises à jour du profil. Votre application envoie les opérations avec le jeton de la personne. L’API vérifie le jeton, signe la transaction avec la clé de publication du compte @hivesigner et la diffuse sur Hive.

L’API renvoie aussi le compte de la personne connectée, échange les codes contre des jetons et liste les applications qui utilisent Hivesigner. Voir [API REST](/docs/api).

## La chaîne d’autorité de publication {#authority-chain}

Sur Hive, un compte peut laisser un autre compte agir avec son autorité de publication. L’API s’appuie sur deux de ces autorisations :

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **La personne ajoute le compte de votre application à son autorité de publication.** L’écran de consentement le fait la première fois qu’une personne approuve l’accès de publication pour votre application. Cela nécessite une fois sa clé active.
2. **Le compte de votre application ajoute @hivesigner à son autorité de publication.** Vous le faites une fois, quand vous [enregistrez votre application](/docs/register-app#grant-hivesigner).

Avant de diffuser, l’API vérifie que les deux autorisations sont en place. Elle ne diffuse que les opérations dont l’auteur est la personne nommée par le jeton.

La personne peut retirer l’accès de votre application à tout moment sur https://hivesigner.com/authorized-apps. Après cela, l’API ne peut plus publier pour elle via votre application.

## Deux façons d’intégrer {#two-ways-to-integrate}

### Se connecter, puis diffuser via l’API {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

La personne approuve une fois. Ensuite votre application peut voter, commenter et publier pour elle sans redemander, jusqu’à l’expiration du jeton ou jusqu’à ce que la personne retire l’accès de votre application. Utilisez cette voie pour les actions sociales du quotidien.

Il vous faut un compte d’application avec des URL de rappel enregistrées et l’autorisation pour @hivesigner. Voir [Enregistrer votre application](/docs/register-app). Si vous voulez seulement savoir qui est la personne, voir [Connexion sans accès de publication](/docs/login-only).

### Liens de signature {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

La personne voit chaque transaction avant sa signature. Les liens de signature couvrent 41 opérations Hive, y compris les transferts et les autres actions de portefeuille qui nécessitent la clé active. L’API ne les traite jamais. Vous n’avez pas besoin d’un compte d’application pour les liens de signature. Voir [Liens de signature](/docs/sign-links).

### Lequel choisir {#which-to-choose}

- **Actions de publication fréquentes** (votes, commentaires, abonnements) : connectez la personne avec OAuth2, puis utilisez l’API.
- **Actions de portefeuille**, ou tout ce qui nécessite la clé active : utilisez des liens de signature.
- **Les deux** : beaucoup d’applications connectent les gens avec OAuth2 pour les fonctions sociales et utilisent des liens de signature pour les transferts.
- **Seulement l’identité de la personne** : voir [Connexion sans accès de publication](/docs/login-only).

## Code source {#source-code}

Hivesigner est open source :

- Le signataire dans le navigateur : https://github.com/ecency/hivesigner-ui
- L’API : https://github.com/ecency/hivesigner-api
- Le SDK JavaScript (paquet npm `hivesigner`) : https://github.com/ecency/hivesigner-sdk. Voir [SDK](/docs/sdk).
