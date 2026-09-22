Vos clés Hive contrôlent votre compte. Quiconque les possède peut agir en votre nom. Hivesigner les garde dans votre navigateur et vous montre ce que vous signez. Ces habitudes les gardent en sécurité.

## Vérifiez d’abord l’adresse {#check-the-address}

Avant de saisir une clé ou un code d’accès, regardez la barre d’adresse de votre navigateur. Elle doit afficher `https://hivesigner.com`.

- Une page factice copie l’apparence de Hivesigner, pas son adresse. Lisez l’adresse en entier : `hivesigner.com.example.net` n’est pas hivesigner.com.
- Méfiez-vous d’un mot en trop, d’une lettre manquante ou inversée, ou d’une autre terminaison.
- Hivesigner affiche dans sa barre supérieure l’adresse sur laquelle il s’exécute. Une page factice peut y écrire n’importe quel texte, fiez-vous donc à la barre d’adresse du navigateur.
- Pour ajouter une clé, saisissez l’adresse vous-même ou utilisez un favori. Ne suivez pas un lien venant d’un message, d’une publicité ou d’un résultat de recherche.

## Ce que vous n’avez jamais à donner {#never-needed}

- Se connecter, publier, voter, effectuer des opérations de portefeuille et autoriser des applications ne nécessitent jamais votre mot de passe maître ni votre clé propriétaire. Voir [Quelle clé ajouter](/docs/accounts#which-key).
- Les applications qui utilisent Hivesigner n’ont jamais besoin de vos clés. Elles vous envoient sur hivesigner.com. Vos clés restent dans votre navigateur. Un site qui vous demande de saisir une clé sur sa propre page ne vous la demande pas via Hivesigner.
- Ne donnez jamais vos clés ni votre code d’accès à quelqu’un qui les réclame, que ce soit dans une discussion, un e-mail ou une demande d’assistance.

## N’ajoutez que les clés nécessaires {#only-the-keys-you-need}

- Ajoutez la clé de publication pour l’usage quotidien.
- N’ajoutez la clé active que pour les opérations de portefeuille, pour autoriser une application la première fois ou pour révoquer une application.
- Évitez d’ajouter votre mot de passe maître. Si vous l’ajoutez, Hivesigner enregistre toutes les clés qui en découlent, y compris la clé propriétaire.

Après avoir autorisé une application pour la première fois, la clé active reste sur cet appareil. Pour ne garder ici que la clé de publication, [retirez le compte](/docs/accounts#remove-account). Puis [ajoutez-le à nouveau](/docs/accounts#add-account) avec la seule clé de publication.

## Utilisez un code d’accès {#use-a-passcode}

Sans code d’accès, Hivesigner enregistre vos clés dans ce navigateur sans chiffrement. Il les ouvre de lui-même à chaque démarrage, si bien que toute personne utilisant ce navigateur peut signer en votre nom. La page **Comptes** signale un tel compte par **Sans code d’accès**.

- Choisissez un code d’accès que les autres ne peuvent pas deviner. Hivesigner accepte 4 caractères ou plus. Plus il est long, plus il est difficile à deviner.
- N’utilisez pas votre mot de passe maître Hive ni l’une de vos clés comme code d’accès.

Sur un ordinateur utilisé par d’autres personnes :

- Utilisez toujours un code d’accès.
- Fermez l’onglet Hivesigner quand vous avez fini. Un compte déverrouillé le reste dans cet onglet jusqu’à ce que vous le fermiez ou le rechargiez.
- Sur un ordinateur qui n’est pas le vôtre, [retirez le compte](/docs/accounts#remove-account) avant de partir. Mieux encore, n’y ajoutez pas vos clés du tout.

## Lisez avant d’approuver {#read-before-approving}

- **Vérifiez le compte.** La ligne qui indique « Connexion en tant que », « Autorisation en tant que » ou « Signature en tant que » nomme le compte qui répond. Changez-en si ce n’est pas le bon.
- **Vérifiez où vous irez ensuite.** « Vous redirige vers HOST » et « Vous allez être redirigé vers HOST. » nomment le site qui reçoit le résultat. Ce doit être le site d’où vous venez.
- **Vérifiez qui demande.** Une application choisit elle-même son nom affiché. La ligne « Compte Hive @COMPTE_APP » montre son véritable compte Hive. Sur la page d’autorisation ou de révocation d’une application, Hivesigner précise à propos du profil de l’application : « Toutes les informations ci-dessus sont publiées par le compte de l’application lui-même. Hivesigner n’en vérifie aucune. »
- **Vérifiez la clé.** Un vote, un article ou un abonnement nécessitent la clé de publication. Si vous vouliez voter et que l’écran réclame votre clé active ou propriétaire, la demande fait autre chose. Arrêtez-vous.
- **Lisez les changements d’autorité.** « clés : AUCUNE (votre clé est supprimée) » signifie que le changement retirerait votre clé de votre compte. N’approuvez un changement de vos clés que si vous l’avez lancé vous-même.
- **Lisez les avertissements.** « Cette demande n’agit pas au nom de @UTILISATEUR, mais au nom de @COMPTE. » signifie que la demande agit pour un autre compte.
- **Ne signez que des messages que vous comprenez.** Un message signé prouve à quiconque que vous avez signé exactement ce texte.

Voir [Vérifier et signer](/docs/signing) pour tout ce que montrent les écrans de signature.

## Repérer une page factice {#spot-a-fake-page}

Une page qui ressemble à Hivesigner est factice quand :

- **L’adresse n’est pas hivesigner.com.** C’est le seul signe qui compte toujours.
- **Elle refuse votre clé de publication.** Le vrai Hivesigner accepte la clé de publication et vous connecte avec elle. Une page qui insiste pour obtenir votre mot de passe maître ou votre clé propriétaire n’est pas Hivesigner.
- **Elle ne connaît pas les comptes que vous avez ajoutés.** Votre navigateur garde séparé le stockage de chaque site. Un site factice sur une autre adresse ne peut pas voir les comptes ajoutés sur hivesigner.com, il redemande donc une clé. Le vrai Hivesigner s’en souvient dans ce navigateur et ne demande que votre code d’accès, si vous en avez défini un. Il ne demande une clé que lorsqu’une requête en exige une dont cet appareil ne dispose pas, et il la nomme alors. Par exemple : « Cette action nécessite votre clé active, que @UTILISATEUR n’a pas ici. »

Un nouveau navigateur ou un nouvel appareil n’a pas non plus vos comptes. Là aussi, vérifiez l’adresse avant d’en ajouter un.

Si vous avez saisi une clé sur une page factice, considérez-la comme volée. Changez-la sur Hive dès que possible.

## Le code est open source {#open-source}

Le code de Hivesigner est public sur [github.com/ecency/hivesigner-ui](https://github.com/ecency/hivesigner-ui). Chacun peut le lire et vérifier la façon dont il traite vos clés. Pour signaler un problème, ouvrez une issue sur [github.com/ecency/hivesigner-ui/issues](https://github.com/ecency/hivesigner-ui/issues). La page **À propos** y renvoie sous le libellé **Signaler un bug**.
