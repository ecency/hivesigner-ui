Réponses brèves aux questions fréquentes. Chacune renvoie à la page qui donne les détails.

## Utiliser Hivesigner {#using-hivesigner}

### Hivesigner est-il gratuit ? {#is-it-free}

Oui. Hivesigner ne facture rien, ni aux personnes ni aux applications. Son code source est ouvert sous licence MIT.

### Hivesigner voit-il un jour mes clés ? {#keys}

Non. Vos clés restent dans votre navigateur, sur votre appareil. Hivesigner y signe. Elles ne sont jamais envoyées aux serveurs de Hivesigner ni aux applications que vous utilisez. Voir [Où vos clés sont enregistrées](/docs/accounts#where-keys-are-stored) et [Gardez vos clés en sécurité](/docs/safety).

### Et si j’oublie mon code d’accès ? {#forgotten-passcode}

Personne ne peut récupérer un code d’accès, pas même Hivesigner. Retirez le compte de Hivesigner et ajoutez-le à nouveau avec votre clé Hive et un nouveau code d’accès. Votre compte Hive et les applications que vous avez autorisées ne changent pas. Voir [Si vous oubliez votre code d’accès](/docs/accounts#forgotten-passcode).

### Puis-je utiliser Hivesigner sur mon téléphone ? {#phone}

Oui. Ouvrez https://hivesigner.com dans le navigateur de votre téléphone et ajoutez-y votre compte. Vos clés ne sont enregistrées que dans ce navigateur, ajoutez donc le compte sur chaque appareil que vous utilisez. Voir [Ajouter et gérer des comptes](/docs/accounts).

### Quelles applications utilisent Hivesigner ? {#which-apps}

https://hivesigner.com/apps liste les applications qui diffusent sur Hive via Hivesigner, les plus utilisées en premier. Chaque application publie elle-même son nom et sa description. Hivesigner ne les vérifie pas. Ouvrir une application à cet endroit affiche une page qui permet de lui donner l’accès de publication. Voir [Autoriser une application depuis l’annuaire](/docs/signing-in#directory).

### Quel est le lien entre Hivesigner et Hive Keychain ? {#hive-keychain}

Ce sont des outils distincts. Hive Keychain est une extension de navigateur et une application mobile. Hivesigner est un site web, il n’y a donc rien à installer. Quand une application vous demande de signer un message, la signature est du même type que celle produite par Hive Keychain, si bien que l’application vérifie l’une comme l’autre avec le même code. Le jeton de vérification issu de la page **Signer un message** de Hivesigner se contrôle sur la page **Vérifier un message** de Hivesigner. Voir [Signature de messages](/docs/message-signing).

## Développer avec Hivesigner {#building}

### Puis-je utiliser Hivesigner dans une application mobile ? {#mobile-app}

Oui. Envoyez la personne vers Hivesigner dans un navigateur et utilisez une URL de retour que votre application peut recevoir : un lien https dont vous êtes propriétaire (Android App Links ou iOS Universal Links) ou une adresse de bouclage comme `http://127.0.0.1/auth`. Les schémas personnalisés tels que `myapp://` sont refusés. Voir [Applications mobiles et de bureau](/docs/register-app#native-apps).

### Ai-je besoin d’un compte d’application ? {#app-account}

Il en faut un pour connecter des personnes avec l’accès de publication et pour diffuser via l’API. Voir [Enregistrer votre application](/docs/register-app). Les [liens de signature](/docs/sign-links) et la [signature de messages](/docs/message-signing) fonctionnent sans. La [connexion sans accès de publication](/docs/login-only) aussi.

### L’API peut-elle envoyer des transferts ? {#transfers}

Non. L’API ne diffuse que des opérations de niveau publication, comme les votes, les commentaires et les abonnements. Pour les transferts et les autres actions qui nécessitent la clé active, utilisez les [liens de signature](/docs/sign-links) : la personne approuve chacun avec sa propre clé.

### Quels langages disposent d’un SDK ? {#languages}

Le SDK officiel est pour JavaScript. Des bibliothèques communautaires existent pour Python. N’importe quel langage peut appeler l’API REST. Voir [SDK](/docs/sdk) et [API REST](/docs/api).

## Aide {#help}

### Où puis-je obtenir de l’aide ? {#get-help}

Posez votre question sur le serveur Discord HiveDevs : https://discord.gg/pNJn7wh. Signalez un bug sous forme d’issue dans le dépôt GitHub concerné : https://github.com/ecency/hivesigner-ui pour le site web, https://github.com/ecency/hivesigner-api pour l’API ou https://github.com/ecency/hivesigner-sdk pour le SDK JavaScript. Sur un écran qui refuse une demande, **Signaler ce problème** transmet le problème à l’équipe Hivesigner.

### Comment puis-je contribuer ? {#contribute}

Hivesigner est open source sur GitHub, dans les trois dépôts ci-dessus. Ouvrez une issue avec un bug ou une idée. Envoyez une pull request avec un correctif.
