Hivesigner signe avec les clés des comptes Hive que vous lui ajoutez. Vous ajoutez un compte une fois dans chaque navigateur que vous utilisez. Hivesigner garde alors ses clés dans ce navigateur, chiffrées avec un code d’accès si vous en définissez un.

## Ajouter un compte {#add-account}

1. Vérifiez que la barre d’adresse de votre navigateur affiche `https://hivesigner.com`. Voir [Vérifiez d’abord l’adresse](/docs/safety#check-the-address).
2. Ouvrez [hivesigner.com/import](https://hivesigner.com/import). Si ce navigateur n’a encore aucun compte, **Configurer Hivesigner** sur la page d’accueil ouvre le même formulaire.
3. Dans **Nom d’utilisateur**, saisissez votre nom d’utilisateur Hive en minuscules, sans le `@`.
4. Dans **Clé privée**, collez l’une de vos clés privées. Voir d’abord [Quelle clé ajouter](/docs/accounts#which-key).
5. Laissez **Protéger avec un code d’accès (recommandé)** coché et choisissez un **Code d’accès**. Il faut au moins 4 caractères. Voir [Protégez-le avec un code d’accès](/docs/accounts#passcode).
6. Sélectionnez **Ajouter un compte**.

Hivesigner vérifie la clé auprès de votre compte sur le réseau Hive avant d’enregistrer quoi que ce soit. Il compare la partie publique de la clé avec les clés déclarées par votre compte. La clé privée elle-même n’est envoyée nulle part. Si le nom d’utilisateur ne correspond à aucun compte Hive, ou si la clé ne lui appartient pas, le formulaire indique « Nom d’utilisateur ou clé non valide. Utilisez votre mot de passe maître ou votre clé propriétaire, active, de publication ou mémo. »

Le compte que vous ajoutez devient le compte sélectionné : celui que Hivesigner utilise sur ses écrans. Si une demande vous a conduit au formulaire, Hivesigner vous y ramène. Sinon, il ouvre la page **Comptes**.

### Ajouter une autre clé à un compte {#add-a-key}

Pour ajouter une seconde clé à un compte déjà présent ici (la clé active à côté de la clé de publication, par exemple), ajoutez le compte de nouveau avec la nouvelle clé. Hivesigner conserve les clés qu’il possède déjà et ajoute la nouvelle. Une nouvelle clé pour un rôle déjà présent remplace l’ancienne.

Si le compte a un code d’accès, laissez **Protéger avec un code d’accès (recommandé)** coché et saisissez le même code. Hivesigner refuse toute autre situation :

- Sans code d’accès, le formulaire indique « Ce compte est protégé sur cet appareil. Saisissez son code d’accès pour ajouter la clé. »
- Avec un code différent, il indique « Code d’accès incorrect. La clé n’a pas été enregistrée. »

## Quelle clé ajouter {#which-key}

Un compte Hive possède plusieurs clés privées. Chacune autorise des actions différentes. Vous les avez obtenues du portefeuille ou de l’application qui a créé votre compte Hive, en général sur sa page de clés ou de mot de passe. Hivesigner ne peut pas vous les montrer.

| Clé | Ce que Hivesigner en fait |
| --- | --- |
| Publication | Se connecter aux applications, voter, publier et commenter, suivre, modifier votre profil et réclamer vos récompenses. |
| Active | Opérations de portefeuille comme les transferts, le power up ou le power down, les délégations, l’épargne et les conversions. Votes pour les witnesses et les propositions. Autoriser une application la première fois et révoquer une application. |
| Propriétaire | Changer votre clé propriétaire ou votre compte de récupération. Vous n’en avez jamais besoin au quotidien. |
| Mémo | Rien. Le formulaire l’accepte, mais un compte qui n’a que la clé mémo ne peut pas se connecter : l’écran de la demande affiche alors « Ajoutez une clé de publication ou une clé active de @UTILISATEUR pour continuer ». |

Ajoutez la clé de publication pour l’usage quotidien. N’ajoutez la clé active que lorsque vous en avez besoin pour une opération de portefeuille ou pour autoriser une application la première fois. Quand un écran a besoin d’une clé absente de cet appareil, il le dit et vous laisse l’ajouter.

Votre mot de passe maître fonctionne également dans le champ **Clé privée**. Hivesigner en dérive vos clés et enregistre toutes celles qui correspondent encore à votre compte, y compris la clé propriétaire. Ajouter les clés séparément garde la clé propriétaire hors de cet appareil.

> **Remarque :** Hivesigner signe chaque transaction avec exactement la clé qu’elle réclame. Cela suit une règle Hive en vigueur depuis un hard fork en 2025. Une clé active ne peut plus signer une action de publication telle qu’un vote. Une clé propriétaire ne peut plus signer une opération de portefeuille. Ajoutez la clé de publication même si la clé active est déjà là.

Se connecter à une application est différent : ce n’est pas une transaction. Hivesigner vous connecte avec la clé de publication, ou avec la clé active quand cet appareil n’a pas de clé de publication pour le compte.

## Protégez-le avec un code d’accès {#passcode}

Le code d’accès est un mot de passe que vous choisissez pour ce navigateur seulement. Ce n’est pas votre mot de passe Hive et ce n’est aucune de vos clés. Hivesigner s’en sert pour chiffrer les clés du compte avant de les enregistrer. Il le redemande pour les déchiffrer.

- Hivesigner n’enregistre pas votre code d’accès et ne l’envoie nulle part. Personne ne peut le récupérer à votre place.
- Chaque compte sur cet appareil a son propre code d’accès. Vous pouvez utiliser le même pour tous.
- Un code plus long est plus difficile à deviner. N’utilisez pas votre mot de passe maître Hive ni l’une de vos clés comme code d’accès.

Sans code d’accès, Hivesigner enregistre les clés du compte dans ce navigateur sans chiffrement. Il les ouvre de lui-même à chaque démarrage, si bien que toute personne utilisant ce navigateur peut signer avec elles. La page **Comptes** signale un tel compte par **Sans code d’accès**.

Pour ajouter un code d’accès à un compte qui n’en a pas, ajoutez le compte de nouveau avec l’une de ses clés et un code d’accès. Hivesigner chiffre alors toutes les clés du compte avec ce code.

Pour changer un code d’accès, [retirez le compte](/docs/accounts#remove-account) et ajoutez-le de nouveau avec le nouveau code. Le retrait supprime de ce navigateur toutes les clés du compte, ajoutez donc chaque clé à nouveau (la clé de publication, puis la clé active si vous vous en servez).

## Déverrouiller un compte {#unlock}

Un compte protégé par un code d’accès démarre verrouillé chaque fois que Hivesigner s’ouvre : dans un nouvel onglet, après un rechargement ou quand une application vous y envoie. Vous n’avez pas besoin de le déverrouiller à l’avance. Un écran qui a besoin des clés affiche un champ **Code d’accès** au-dessus de son propre bouton (par exemple **Se connecter**, **Approuver** ou **Déverrouiller**). Un clic déverrouille le compte et poursuit.

Un code erroné affiche « Code d’accès incorrect. » et rien n’est signé.

Hivesigner garde les clés déverrouillées en mémoire seulement, jamais dans le stockage. Le compte reste déverrouillé dans cet onglet jusqu’à ce que vous le fermiez ou le rechargiez.

## Changer de compte {#switch-accounts}

La page **Comptes** liste les comptes de cet appareil de A à Z. Le compte sélectionné porte une coche. À partir de 6 comptes, un champ **Rechercher des comptes** filtre la liste.

Sélectionnez un compte pour en faire le compte sélectionné. Hivesigner ne demande pas le code d’accès ici. C’est l’écran qui a besoin des clés qui le demande.

Sur un écran de demande, la ligne qui nomme le compte (« Connexion en tant que », « Autorisation en tant que » ou « Signature en tant que ») comporte un lien **Changer de compte**. Il ouvre la même liste sur place, ce qui permet de choisir un autre compte sans quitter la demande. **Ajouter un autre compte**, sous la liste, ouvre le formulaire **Ajouter un compte** et vous ramène ensuite à la demande.

## Retirer un compte {#remove-account}

1. Ouvrez la page **Comptes**.
2. Sélectionnez le **✕** à côté du compte. Son libellé pour les lecteurs d’écran est **Retirer de Hivesigner @UTILISATEUR**.
3. Confirmez quand le navigateur demande « Retirer @UTILISATEUR de cet appareil ? Les clés de ce compte enregistrées ici seront supprimées. »

Retirer un compte supprime ses clés de ce navigateur uniquement. Votre compte Hive ne change pas. Les applications que vous avez autorisées gardent leur accès, car cet accès est enregistré sur la blockchain Hive. Pour le retirer, voir [Voir et retirer l’accès d’une application](/docs/signing-in#remove-access).

Si vous retirez le compte sélectionné, un autre compte de cet appareil devient le compte sélectionné.

Si le navigateur ne laisse pas Hivesigner enregistrer le changement, vous voyez « Retiré pour cette session uniquement : le stockage n’est pas disponible, ce compte réapparaîtra donc quand vous rechargerez la page. »

## Si vous oubliez votre code d’accès {#forgotten-passcode}

Personne ne peut récupérer un code d’accès, pas même Hivesigner. Votre compte Hive n’est pas affecté : le code d’accès ne protège que la copie de vos clés présente dans ce navigateur.

1. [Retirez le compte](/docs/accounts#remove-account) de cet appareil.
2. [Ajoutez-le à nouveau](/docs/accounts#add-account) avec sa clé et un nouveau code d’accès.

Rien ne change sur la blockchain Hive. Les applications que vous avez autorisées gardent leur accès.

## Où vos clés sont enregistrées {#where-keys-are-stored}

Hivesigner enregistre vos clés dans ce navigateur seulement, sur cet appareil, dans le stockage que le navigateur réserve à hivesigner.com.

- Elles ne sont pas synchronisées. Un autre navigateur, un autre profil de navigateur ou un autre appareil ne les a pas. Ajoutez-y le compte également.
- Effacer les données du site ou les données de navigation pour hivesigner.com les supprime. Fermer une fenêtre privée aussi.
- Hivesigner n’est pas une sauvegarde. Conservez vos clés ou votre mot de passe maître en lieu sûr ailleurs.
