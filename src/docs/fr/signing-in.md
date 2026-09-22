Quand une application vous permet de vous connecter avec Hivesigner, elle vous envoie sur hivesigner.com avec une demande. Hivesigner montre qui demande, ce qui est demandé et lequel de vos comptes répond. C’est là que vous décidez. L’application ne reçoit jamais vos clés : elle obtient une preuve de votre nom d’utilisateur, signée dans votre navigateur.

## L’écran de la demande {#request-screen}

De haut en bas, l’écran affiche :

- **L’application.** Son image et un titre. Quand l’application demande l’accès de publication pour la première fois, le titre indique « APPLICATION demande l’accès à votre compte. » Sinon, il indique « Se connecter à APPLICATION ». Le nom qui y figure est choisi par l’application.
- **Compte Hive @COMPTE_APP.** Le véritable compte Hive de l’application. Une application peut s’appeler comme elle veut, mais elle ne peut pas changer ce nom. Vérifiez-le.
- **Vous redirige vers HOST.** Le site vers lequel Hivesigner vous renvoie quand vous approuvez.
- **Portée.** Ce que l’application demande : [connexion seule ou accès de publication](/docs/signing-in#scopes).
- **La ligne du compte.** « Autorisation en tant que » ou « Connexion en tant que », avec le compte que l’application obtiendra et un lien **Changer de compte**. Voir [Choisir le compte](/docs/signing-in#choose-account).
- **Le bouton.** **Autoriser** ou **Se connecter**. Si le compte est verrouillé, un champ **Code d’accès** se place au-dessus, et un clic déverrouille le compte et poursuit.
- **Annuler.** Vous emmène vers votre page **Comptes**. Hivesigner n’envoie rien à l’application.

Si ce navigateur n’a encore aucun compte, le bouton indique **Continuer**. Il ouvre le formulaire **Ajouter un compte** et vous ramène ensuite à la demande. Voir [Ajouter un compte](/docs/accounts#add-account).

## Connexion seule ou accès de publication {#scopes}

Une application demande l’une de ces deux choses. Il n’y a rien entre les deux.

### Connexion seule {#sign-in-only}

**Portée** affiche « Voir le nom d’utilisateur de votre compte ». L’application apprend quel compte Hive vous êtes, confirmé par votre signature. Elle n’obtient aucune permission d’agir en votre nom. Le bouton indique **Se connecter**.

Un site sans compte Hive à lui peut aussi vous demander de vous connecter. Son écran indique « HOST souhaite confirmer votre nom d’utilisateur Hive. » Une telle demande est toujours une connexion seule. Hivesigner nomme le site par son adresse, car cette adresse est la seule chose que vous puissiez vérifier à son sujet.

### Accès de publication {#posting-access}

**Portée** affiche « Avec votre autorité de publication, APPLICATION pourra : » suivi de ce que cela signifie :

- **Publier et commenter :** publier des articles et des commentaires en votre nom.
- **Voter :** donner des votes positifs et négatifs avec votre compte.
- **Suivre et mettre à jour votre fil :** suivre, masquer et republier en votre nom.

L’autorité de publication est la partie de votre compte Hive qui contrôle les actions du quotidien. Approuver ajoute le compte Hive de l’application à votre autorité de publication. C’est une seule attribution sur la blockchain Hive, pas une liste de permissions séparées.

## Ce que permet l’accès de publication {#what-posting-access-allows}

Avec l’accès de publication, l’application peut faire en votre nom tout ce que peut faire votre clé de publication :

- publier, modifier et supprimer vos articles et vos commentaires
- voter
- suivre, masquer et republier
- modifier votre profil
- réclamer vos récompenses vers votre propre portefeuille
- d’autres actions quotidiennes qu’utilisent les applications et les jeux Hive

Elle ne peut jamais :

- déplacer vos fonds : envoyer des HIVE ou des HBD, faire un power up ou un power down, déléguer du Hive Power ou utiliser votre épargne
- changer vos clés ni qui contrôle votre compte
- donner accès à d’autres applications

> **Avertissement :** n’autorisez que les applications en qui vous avez confiance. L’accès de publication dure jusqu’à ce que vous le révoquiez. Il est enregistré sur la blockchain Hive, pas dans Hivesigner : retirer le compte de Hivesigner n’y met pas fin.

## La première fois que vous autorisez une application {#first-time}

La première fois que vous donnez l’accès de publication à une application, l’écran affiche cet avis : « Première autorisation : cette opération ajoute @COMPTE_APP à votre autorité de publication sur la blockchain et nécessite une fois votre clé active. Ce compte pourra publier en votre nom jusqu’à ce que vous le révoquiez. »

Changer qui peut publier pour votre compte est un changement du compte lui-même, il faut donc votre clé active. Si cet appareil ne l’a pas, l’écran la demande sur place :

1. Collez votre clé active dans **Clé active ou mot de passe maître de @UTILISATEUR**. Hivesigner la vérifie auprès de votre compte sur le réseau Hive et l’enregistre sur cet appareil avec vos autres clés. Si vous collez votre mot de passe maître, Hivesigner n’en garde que la clé active, plus la clé de publication quand cet appareil n’en a pas.
2. Si le compte n’a pas de code d’accès, le formulaire propose **Protéger avec un code d’accès (recommandé)**, coché par défaut. S’il en a un et que Hivesigner en a de nouveau besoin, le formulaire le demande dans **Code d’accès de @UTILISATEUR**.
3. Sélectionnez **Ajouter la clé active**, puis **Autoriser**.

Hivesigner envoie ensuite le changement au réseau Hive depuis votre navigateur. Il attend que le changement apparaisse sur la blockchain avant de vous renvoyer vers l’application, connecté. Si cela prend trop de temps, vous voyez « L’autorisation a été envoyée, mais sa confirmation est toujours en cours. Veuillez réessayer dans un instant. »

La clé active reste ensuite sur cet appareil. Pour ne garder ici que la clé de publication, voir [N’ajoutez que les clés nécessaires](/docs/safety#only-the-keys-you-need).

## Autoriser une application depuis l’annuaire {#directory}

Chaque application de [hivesigner.com/apps](https://hivesigner.com/apps) ouvre une page intitulée « Autoriser @COMPTE_APP ». Elle montre ce que l’application publie à son sujet ainsi que la phrase « @COMPTE_APP pourra publier, commenter, voter et suivre en tant que @UTILISATEUR. »

Sélectionner **Autoriser** donne aussitôt à l’application l’accès de publication, comme le fait l’écran de première autorisation. Cela nécessite votre clé active. Aucune application ne vous l’a demandé, ne l’utilisez donc que lorsque c’est votre intention. **Annuler** vous emmène vers votre page **Comptes**.

Quand votre compte a déjà donné l’accès de publication à l’application, la page indique « Autorisation accordée à @COMPTE_APP. » et propose **Continuer**.

## Revenir vers une application {#coming-back}

Quand votre compte a déjà donné l’accès de publication à une application, rien de nouveau n’est accordé. L’écran est plus court :

- Le titre indique « Se connecter à APPLICATION ».
- Une ligne indique « Vous avez déjà autorisé @COMPTE_APP. Aucun nouvel accès n’est accordé. »
- La ligne du compte indique « Connexion en tant que ».
- Le bouton indique **Se connecter**.

Seule votre clé de publication (ou votre clé active) est nécessaire. Si vous avez révoqué l’application entre-temps, l’écran de première autorisation réapparaît.

## Choisir le compte {#choose-account}

La ligne du compte nomme le compte que l’application obtiendra. Vérifiez-la avant d’approuver, surtout si vous avez plusieurs comptes sur cet appareil.

- Sélectionnez **Changer de compte** pour ouvrir la liste de vos comptes sur place. Choisissez-en un autre et l’écran passe à ce compte.
- Sélectionnez **Ajouter un autre compte** sous la liste pour ajouter un compte qui n’est pas encore sur cet appareil. Hivesigner vous ramène ensuite à la demande.

Une application peut suggérer le compte à utiliser. Si ce compte est sur cet appareil, Hivesigner le sélectionne. Vous pouvez tout de même en changer.

## Quand Hivesigner refuse une demande {#refused-requests}

Hivesigner ne vous laisse pas approuver une demande qu’il ne peut pas vérifier. L’écran affiche à la place l’un de ces messages :

| Message | Ce que cela signifie |
| --- | --- |
| « L’URL de redirection de cette application n’est pas enregistrée. Pour votre sécurité, la connexion est bloquée. » | L’adresse de retour ne fait pas partie de celles que l’application a déclarées sur son compte Hive. |
| « @COMPTE_APP n’est pas un compte Hive : il n’y a donc aucune application à autoriser. Retournez sur le site et réessayez. » | La demande nomme une application qui n’existe pas. |
| « Ce site a demandé que votre connexion lui soit envoyée via une adresse http:// non chiffrée. Hivesigner ne l’envoie que via https. Demandez au site d’utiliser une adresse sécurisée. » | L’adresse de retour n’est pas sécurisée. |
| « Ce site a demandé que votre connexion lui soit envoyée à une adresse qui n’est pas une URL web. Retournez sur le site et réessayez. » | L’adresse de retour n’est pas une adresse web. |
| « Cette demande d’autorisation est incomplète : elle n’indique aucune application ou aucune URL de redirection. Retournez sur l’application et réessayez. » | Il manque des éléments à la demande. |

Retournez sur l’application et réessayez. Si le problème persiste, sélectionnez **Signaler ce problème**. Cela envoie le lien et votre note facultative à l’équipe Hivesigner, avec les secrets masqués.

Si Hivesigner ne parvient pas à joindre le réseau Hive, il affiche « Impossible de charger les informations du compte depuis le réseau Hive. » Sélectionnez **Réessayer**.

## Voir et retirer l’accès d’une application {#remove-access}

1. Ouvrez [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps). Le pied de page y renvoie sous le libellé **Applications autorisées**.
2. La page affiche « Applications pouvant publier en tant que @UTILISATEUR. » pour le compte sélectionné, avec chaque application en dessous. Pour voir les applications d’un autre compte, sélectionnez-le d’abord sur la page **Comptes**.
3. Si le compte est verrouillé, saisissez son code d’accès et sélectionnez **Déverrouiller**.
4. Sélectionnez **Révoquer** à côté de l’application. Quand la clé active est sur cet appareil, cela retire aussitôt l’accès de l’application.

La liste montre tous les comptes qui peuvent publier en tant que le vôtre de leur propre chef, y compris ceux que vous avez ajoutés avec d’autres outils.

Révoquer est un changement de votre compte sur la blockchain Hive, cela nécessite donc une fois votre clé active. Si cet appareil ne l’a pas, **Révoquer** ouvre une page pour cette application (« Révoquer @COMPTE_APP ») qui demande la clé active sur place. Elle indique « @COMPTE_APP ne pourra plus agir en tant que @UTILISATEUR. » Ajoutez la clé, puis sélectionnez **Révoquer**.

Quand vous révoquez une application, Hivesigner retire le compte de l’application de l’autorité de publication de votre compte (et de son autorité active, s’il s’y trouve). Dès lors, l’application ne peut plus publier, voter ni agir en votre nom. Si l’application redemande plus tard l’accès de publication, vous voyez l’écran de première autorisation.

Révoquer ne vous déconnecte pas du site web de l’application. Déconnectez-vous aussi là-bas si vous le souhaitez.
