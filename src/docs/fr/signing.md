Les applications peuvent vous demander de signer une transaction Hive, comme un vote, un transfert ou un article. Elles vous envoient un lien qui ouvre Hivesigner. Hivesigner montre en mots simples ce que fait la demande, quelle clé elle nécessite et où elle vous envoie ensuite. Rien n’est signé tant que vous n’avez pas approuvé. Les applications peuvent aussi vous demander de signer un message, qui n’atteint jamais la blockchain.

## L’écran Confirmer la transaction {#confirm-screen}

Un lien de signature ouvre un écran intitulé « Confirmer la transaction ». Il affiche une carte par opération contenue dans la demande. Une opération est une action sur Hive, comme un vote ou un transfert.

Quand une demande contient plus d’une opération, les cartes sont numérotées et une ligne au-dessus indique « Cette demande contient 3 opérations. Vérifiez-les toutes avant d’approuver. »

### Le résumé {#summary}

Chaque carte commence par une phrase qui dit ce que fait l’opération, avec les valeurs de la demande. Par exemple :

| Opération | Ce que dit la carte |
| --- | --- |
| Un transfert | Envoyer 1.000 HIVE à @bob (et le mémo en dessous, sous la forme Mémo : ...) |
| Un vote | Vote positif pour @alice/mon-article (et le poids du vote en dessous, par exemple 100%) |
| Un article ou une réponse | Publier l’article « Mon titre », ou Répondre à @alice/mon-article |
| Une action définie par une application Hive | Action personnalisée (follow) |
| Un changement de qui contrôle un compte | Mettre à jour les autorités du compte |

Les autres opérations affichent leur nom, comme « Power up » ou « Déléguer du Hive Power ».

À côté de la phrase, un libellé en majuscules indique la clé dont l’opération a besoin : PUBLICATION, ACTIVE ou PROPRIÉTAIRE.

### Les détails {#details}

Sous la phrase, la carte liste les valeurs que porte l’opération :

- le compte au nom duquel l’opération agit
- pour un article ou un commentaire : le permalien (l’adresse de l’article), la communauté ou le tag, le contenu et les métadonnées
- pour une action personnalisée : chaque valeur de ses données, une par ligne, pour que rien ne soit tronqué
- pour un changement d’autorités : le seuil, les clés et les comptes qu’il définit

Un changement d’autorités signale aussi quand il retirerait vos clés, avec « clés : AUCUNE (votre clé est supprimée) ». Un seuil absent apparaît comme « seuil NON DÉFINI (traité comme 0) ».

Dans le résumé et dans les détails, les caractères qui pourraient masquer du texte ou en changer le sens de lecture sont affichés comme `�`. Ce que vous lisez ne peut pas se faire passer pour autre chose.

**Afficher l’opération brute** (ou **Afficher les opérations brutes**) ouvre les opérations exactes qui seront signées.

Quand un montant est donné en Hive Power, Hivesigner le convertit au taux actuel. Il affiche « Chargement du taux actuel du Hive Power… » et attend ce taux avant que vous puissiez approuver.

Certaines demandes portent une transaction préparée ailleurs, par exemple pour un compte que plusieurs personnes contrôlent. L’écran indique alors « Cette demande fournit son propre en-tête de transaction. Expiration : DATE. » Si d’autres l’ont déjà signée, il ajoute « Elle porte déjà 2 signatures. »

## Quelle clé elle nécessite {#which-key}

Sous les cartes, une ligne nomme la clé dont la demande entière a besoin : « Sera signée avec votre clé de publication », « Sera signée avec votre clé active » ou « Sera signée avec votre clé propriétaire ».

Hivesigner signe exactement avec cette clé. Une clé active ne peut pas signer un vote et une clé propriétaire ne peut pas signer un transfert. C’est une règle Hive depuis un hard fork en 2025. Voir [Quelle clé ajouter](/docs/accounts#which-key).

Toutes les opérations d’une même demande doivent nécessiter la même clé. Quand ce n’est pas le cas, la ligne indique « Cette transaction nécessite plusieurs autorités et ne peut pas être signée avec une seule clé. » Il n’y a pas de bouton pour approuver. Retournez sur l’application.

Les demandes avec la clé propriétaire sont rares. Elles changent qui peut contrôler ou récupérer votre compte. Relisez-les deux fois. Voir [Lisez avant d’approuver](/docs/safety#read-before-approving).

### Quand la clé est absente {#missing-key}

Si le compte sélectionné n’a pas la clé sur cet appareil, l’écran le dit. Par exemple : « Cette action nécessite votre clé active, que @UTILISATEUR n’a pas ici. »

1. Sélectionnez **Ajouter un autre compte** sous le message. Cela ouvre le formulaire **Ajouter un compte**.
2. Saisissez le même nom d’utilisateur et la clé manquante. Si le compte a un code d’accès, saisissez-le également.
3. Sélectionnez **Ajouter un compte**. Hivesigner ajoute la clé et vous ramène à la demande.

Si le compte est verrouillé, l’écran affiche un champ **Code d’accès** au-dessus du bouton. Un clic déverrouille le compte et approuve. S’il s’avère que la clé manque, l’écran vous le dit après le déverrouillage.

Si ce navigateur n’a encore aucun compte, le bouton indique **Continuer** et ouvre le formulaire **Ajouter un compte**.

## Approuver ou signer {#approve}

La ligne du compte au-dessus du bouton indique « Signature en tant que » avec le compte qui signe. **Changer de compte** permet d’en choisir un autre. Voir [Changer de compte](/docs/accounts#switch-accounts).

- **Approuver** signe la transaction dans votre navigateur et l’envoie au réseau Hive. Le résultat indique « Transaction diffusée avec succès » avec un **ID de transaction** qui ouvre la transaction dans un explorateur de blocs.
- **Signer** apparaît à la place quand la demande ne réclame qu’une signature. Hivesigner signe la transaction sans l’envoyer au réseau. Il remet la signature à l’application, ou l’affiche quand la demande ne nomme aucun site.

Si le réseau rejette la transaction, vous voyez « Votre transaction n’a pas été diffusée » avec le « Message d’erreur » donné par le réseau. Vous pouvez réessayer.

## Le site vers lequel vous revenez {#return-site}

Quand la demande nomme un site de retour, un avis en haut indique « Vous allez être redirigé vers HOST. » Après votre approbation, Hivesigner vous y envoie. Vérifiez que HOST est bien le site d’où vous venez.

Quand la demande ne nomme aucun site, Hivesigner reste sur le résultat.

## Une demande pour un autre compte {#another-account}

Une demande peut être faite pour un compte différent de celui qui est sélectionné. Hivesigner le montre de deux façons.

**La demande doit être signée par un autre compte.** L’écran indique « Cette demande doit être signée par @COMPTE. Passez à ce compte. » La ligne du compte indique « Compte sélectionné » et la liste des comptes s’ouvre en dessous. Choisissez ce compte, ou ajoutez-le avec **Ajouter un autre compte**. Hivesigner ne signe la demande avec aucun autre compte.

**Une opération agit au nom d’un autre compte.** Cela arrive avec les comptes que plusieurs personnes gèrent. Un avertissement en haut indique « Cette demande n’agit pas au nom de @UTILISATEUR, mais au nom de @COMPTE. Ne continuez que si vous gérez ce compte. » Les détails de chaque carte nomment le compte au nom duquel elle agit.

## Les demandes que Hivesigner ne peut pas lire {#invalid-requests}

Hivesigner ne signe jamais une demande qu’il ne peut pas lire et vous montrer entièrement. Cela inclut une opération qu’il ne connaît pas, une demande sans opération, une valeur qui ne convient pas à l’opération (un nombre qui n’en est pas un, un montant mal formé) et des données supplémentaires qu’il ne peut pas afficher.

L’écran indique alors « Oups, une erreur s’est produite. Les données fournies ne sont pas valides. » Retournez sur l’application. Pour en informer l’équipe Hivesigner, sélectionnez **Signaler ce problème**.

## Les demandes de signature de message {#message-requests}

Certaines applications vous demandent de signer un message plutôt qu’une transaction, par exemple pour prouver qu’un compte vous appartient. Un message est du texte. Le signer ne change rien sur la blockchain.

L’écran affiche :

- Un titre tel que « APPLICATION vous demande de signer un message. » Quand l’application a un compte Hive, la ligne en dessous le nomme : « Compte Hive @COMPTE_APP ».
- « Vous redirige vers HOST » : le site qui reçoit la signature. La même ligne réapparaît à côté du bouton.
- **Message** : le texte entier, exactement tel qu’il sera signé. Les caractères qui pourraient masquer du texte ou en changer le sens de lecture apparaissent sous forme de codes mis en évidence, tels que `\u{200B}`.
- La clé utilisée : « Sera signée avec votre clé de publication » ou « Sera signée avec votre clé active ». Hivesigner ne signe jamais un message avec la clé propriétaire.
- Un avertissement : « Votre signature prouve à quiconque la voit que @UTILISATEUR a signé exactement ce texte. Ne signez qu’un message que vous comprenez. »
- La ligne du compte, « Signature en tant que », avec **Changer de compte**.

Sélectionnez **Signer** pour signer. Hivesigner vous renvoie vers le site avec la signature, votre nom d’utilisateur, le type de clé et la clé publique qui a produit la signature. Une clé publique est la moitié partageable d’une paire de clés : elle ne peut rien signer.

Sélectionnez **Annuler** pour aller à votre page **Comptes**. Le site ne reçoit rien.

Si le compte n’a pas la clé sur cet appareil, l’écran le dit. Par exemple : « Cette action nécessite votre clé de publication, que @UTILISATEUR n’a pas ici. » Sélectionnez **Changer de compte**, puis **Ajouter un autre compte**. [Ajoutez la clé manquante](/docs/accounts#add-a-key) pour le même compte. Hivesigner vous ramène à la demande.

### Pourquoi certains messages sont refusés {#refused-messages}

**Un message qui fonctionne comme une connexion Hivesigner.** Certains textes ont exactement la forme d’une connexion Hivesigner. Les signer donnerait au site l’accès à votre compte. Hivesigner ne signe jamais un tel texte et indique « Ce message est un jeton Hivesigner. Le signer donnerait au site l’accès à votre compte, il ne peut donc pas être signé. »

**Une demande que Hivesigner ne peut pas utiliser.** Hivesigner refuse une demande sans message ou sans adresse de retour. Il refuse aussi une demande portant sur une clé autre que de publication ou active, une demande qui nomme comme application ce qui n’est pas un compte Hive, ou une demande dont l’adresse de retour n’est pas sécurisée ou n’est pas enregistrée pour l’application. Il indique « Cette demande de signature est inutilisable : il lui faut un message, une clé de publication ou active et une URL de redirection sécurisée enregistrée pour l’application. Retournez sur le site et réessayez. »

Si Hivesigner ne peut pas lire les informations de l’application sur le réseau Hive, il indique « Impossible de charger les informations du compte depuis le réseau Hive. » Il ne signe rien tant qu’il ne le peut pas. Sélectionnez **Réessayer**.

## Signer un message vous-même {#sign-message}

Vous pouvez signer un message de votre propre initiative pour prouver que vous contrôlez un compte.

1. Ouvrez [hivesigner.com/signmessage](https://hivesigner.com/signmessage). Le pied de page y renvoie sous le libellé **Signer un message**.
2. Si le compte sélectionné est verrouillé, saisissez son code d’accès et sélectionnez **Déverrouiller**. Si aucun compte n’est sélectionné, la page renvoie vers vos comptes.
3. Saisissez le texte dans **Message**. Hivesigner supprime les espaces et les retours à la ligne au début et à la fin.
4. Choisissez la clé dans **Clé de signature**. Ce champ liste les clés du compte sélectionné présentes sur cet appareil, la plus forte en premier. La plus forte est choisie au départ. Passez à **Publication** sauf si vous avez besoin d’une autre clé.
5. Sélectionnez **Signer le message**.

Le **Récapitulatif de la signature** affiche l’**Auteur**, l’**Autorité utilisée**, un **Jeton de vérification** et un **Lien de vérification**. Le jeton de vérification réunit le message, votre nom d’utilisateur et la signature en un seul texte. Partagez le lien ou le jeton avec la personne qui doit vérifier le message.

Une signature ne révèle pas votre clé. Elle montre en revanche quelle clé l’a produite.

## Vérifier un message {#verify-message}

1. Ouvrez [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage). Le pied de page y renvoie sous le libellé **Vérifier un message**.
2. Collez le jeton dans **Jeton de vérification** et sélectionnez **Vérifier la signature**.

Un lien de vérification ouvre cette page et contrôle le message tout seul.

Le résultat indique « La signature est valide pour UTILISATEUR » ou « Impossible de vérifier la signature avec les clés du compte. » En dessous s’affichent l’**Auteur**, la **Clé publique récupérée**, l’**Autorité correspondante** (le type de clé qui a signé) et le **Message**.

Hivesigner vérifie la signature avec les clés que le compte possède actuellement sur le réseau Hive. Un message signé avec une clé que le compte a remplacée depuis ne se vérifie plus.
