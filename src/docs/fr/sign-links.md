Un lien de signature ouvre une transaction Hive dans Hivesigner. La personne l’examine, l’approuve avec sa propre clé et Hivesigner la diffuse depuis son navigateur. Hivesigner peut ensuite renvoyer la personne vers votre application avec l’identifiant de la transaction. Les liens de signature ne nécessitent ni compte d’application ni jeton. Ils couvrent les 41 opérations que Hivesigner prend en charge, y compris les transferts et les autres actions qui nécessitent la clé active.

## Comment fonctionne un lien de signature {#how-it-works}

1. Votre application construit un lien qui porte une ou plusieurs opérations.
2. La personne ouvre le lien. Hivesigner affiche chaque opération en mots clairs sur l’écran « Confirmer la transaction », avec la clé qu’elle nécessite.
3. La personne approuve. Hivesigner signe la transaction dans le navigateur avec la clé du compte sélectionné dans Hivesigner. Puis il envoie la transaction au réseau Hive.
4. Quand le lien nomme une URL de rappel, Hivesigner y envoie la personne avec l’identifiant de la transaction.

Votre application ne voit jamais de clé. N’importe quel site peut créer un lien de signature : il n’y a aucun `client_id` à envoyer.

## Formes de liens {#link-forms}

Hivesigner lit deux sortes de liens de signature : les liens encodés et les liens historiques.

### Liens encodés {#encoded-links}

Un lien encodé porte les opérations en JSON, encodé en base64url. Il utilise le format `hive://sign/...` du paquet `hive-uri`, avec `https://hivesigner.com/` à la place de `hive://`.

| Forme | Ce que contient `B64U` |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Une opération : `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Une liste d’opérations : `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Une transaction entière, avec son propre en-tête |

`B64U` est le texte JSON, encodé en UTF-8, puis en base64 avec `-` à la place de `+`, `_` à la place de `/` et `.` à la place du remplissage `=`.

Pour `op` et `ops`, Hivesigner construit la transaction autour des opérations. Il remplit le bloc de référence et l’expiration.

Pour `tx`, Hivesigner conserve les `ref_block_num`, `ref_block_prefix` et `expiration` propres à la transaction. Il conserve aussi les signatures que la transaction porte déjà. Cela permet à plusieurs comptes de signer une même transaction à tour de rôle, pour un compte que plusieurs personnes contrôlent. Hivesigner refuse une transaction dont la liste `extensions` n’est pas vide.

> **Remarque :** Hivesigner normalise certaines valeurs avant de signer, comme les montants et les champs laissés à leur valeur par défaut. La transaction signée peut alors avoir un identifiant différent de celui que vous avez construit. Lisez l’identifiant depuis l’URL de rappel.

### Liens historiques {#legacy-links}

Un lien historique nomme une opération dans le chemin et met ses champs dans la requête :

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Écrivez le nom de l’opération en snake case (`transfer_to_vesting`), camel case (`transferToVesting`) ou kebab case (`transfer-to-vesting`).
- Donnez chaque champ comme paramètre de requête portant le nom du champ. Encodez chaque valeur pour une URL.
- Écrivez les listes et les objets en JSON, par exemple `required_posting_auths=["alice"]`. Une liste d’identifiants ou de noms peut aussi être séparée par des virgules : `proposal_ids=379,380`.
- Écrivez les booléens `true` ou `false`.

Un lien historique porte une seule opération. Pour plus d’une, utilisez un lien encodé.

### Valeurs des champs {#field-values}

Ces règles valent pour toutes les formes :

- **Valeurs par défaut.** Un champ que vous omettez prend sa valeur par défaut. Le compte qui agit (`voter`, `from`, `owner` et les champs semblables) vaut par défaut le compte qui signe. Le `weight` d’un vote vaut par défaut `10000` (100%).
- **Les montants** sont un nombre et un symbole : `1.000 HIVE`, `0.500 HBD` ou `100.000000 VESTS`. Hivesigner écrit HIVE et HBD avec 3 décimales et VESTS avec 6.
- **Hive Power.** Un champ qui accepte des VESTS accepte aussi un montant en HP, comme `100 HP`. Hivesigner le convertit en VESTS au taux du moment avant que la personne puisse approuver.
- **`__signer`** dans n’importe quelle valeur devient le nom du compte qui signe. Par exemple un `custom_json` d’abonnement peut nommer `__signer` comme abonné dans son `json`.
- **Les entiers** doivent être des nombres entiers dans la plage que la blockchain accepte, comme `-10000` à `10000` pour le `weight` d’un vote.

Hivesigner refuse le lien entier quand une valeur ne convient pas à son champ, quand une opération est inconnue ou quand le lien ne porte aucune opération. La personne voit « Oups, une erreur s’est produite. Les données fournies ne sont pas valides. » et rien n’est signé.

## Paramètres {#parameters}

Ajoutez-les à la chaîne de requête de n’importe quel lien de signature :

| Paramètre | Signification |
| --- | --- |
| `cb` | L’URL de rappel, encodée en base64url. C’est ce que `hive-uri` écrit pour son option `callback`. |
| `redirect_uri` | L’URL de rappel en texte simple encodé pour une URL. Les liens historiques utilisent celui-ci. Un lien encodé l’utilise quand il n’a pas de `cb`. |
| `nb` | Signer seulement. Hivesigner signe la transaction sans la diffuser. Mettez `{{sig}}` dans l’URL de rappel pour recevoir la signature (voir [Jetons de remplacement de l’URL de rappel](#callback-placeholders)). N’importe quelle valeur convient, même vide (`nb=`). |
| `s` | Le compte qui doit signer. Quand un autre compte est sélectionné, Hivesigner demande à la personne de passer à celui-ci. Il ne signe avec aucun autre compte. |

Utilisez une URL de rappel en `https://`. Hivesigner ignore une URL de rappel qui n’est pas une URL `http` ou `https` et reste alors sur son propre écran de résultat.

Hivesigner choisit la clé d’après les opérations. Il n’y a aucun paramètre pour la choisir : Hivesigner ignore `authority` (et le paramètre `a` de `hive-uri`) sur les liens de signature. Voir [Quelle clé nécessite un lien](#which-key).

### Jetons de remplacement de l’URL de rappel {#callback-placeholders}

Après l’approbation de la personne, Hivesigner remplit ces jetons de remplacement dans l’URL de rappel :

| Jeton de remplacement | Valeur |
| --- | --- |
| `{{id}}` | L’identifiant de la transaction |
| `{{sig}}` | La signature, pour un lien de signature seule (`nb`) |
| `{{block}}` | Laissé vide |
| `{{txn}}` | Laissé vide |
| `{{data}}` | Laissé vide |

Une URL de rappel sans aucun de ces jetons reçoit l’identifiant de la transaction ajouté comme `id`, après `?` ou `&` :

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner redirige dès qu’un nœud Hive accepte la transaction. Celle-ci n’est peut-être pas encore dans un bloc. Recherchez-la par son identifiant quand vous devez savoir qu’elle a bien été incluse.

Votre URL de rappel n’est pas appelée quand le réseau rejette la transaction (la personne voit l’erreur) ni quand la personne part sans approuver.

## Construire un lien {#build-a-link}

### Avec hive-uri {#with-hive-uri}

Le paquet `hive-uri` (https://www.npmjs.com/package/hive-uri) encode des opérations en liens. Utilisez la version 0.2.8 ou plus récente, qui encode correctement tout texte Unicode.

```bash
npm install hive-uri
```

```js
import { encodeOp, encodeOps } from 'hive-uri';

// One vote. __signer becomes the account that signs.
const vote = encodeOp(
  ['vote', { voter: '__signer', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
  { callback: 'https://YOUR_APP/voted?tx={{id}}' },
);

// Two transfers in one transaction.
const payout = encodeOps(
  [
    ['transfer', { from: '__signer', to: 'RECIPIENT_1', amount: '1.000 HIVE', memo: 'MEMO' }],
    ['transfer', { from: '__signer', to: 'RECIPIENT_2', amount: '2.000 HIVE', memo: 'MEMO' }],
  ],
  { callback: 'https://YOUR_APP/paid' },
);

const voteLink = vote.replace('hive://', 'https://hivesigner.com/');
const payoutLink = payout.replace('hive://', 'https://hivesigner.com/');
```

L’objet d’options accepte `callback` (écrit `cb`), `no_broadcast: true` (écrit `nb`) et `signer` (écrit `s`). `encodeTx` fait la même chose pour une transaction entière.

### Avec le SDK JavaScript {#with-the-sdk}

Le paquet `hivesigner` propose `sendOperation`, `sendOperations` et `sendTransaction`. Ils prennent les mêmes arguments que les encodeurs de `hive-uri` et renvoient le lien `https://hivesigner.com/sign/...` :

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

En TypeScript, les types exigent le troisième argument : passez `undefined` pour récupérer le lien. Dans un navigateur, une fonction passée en troisième argument leur fait ouvrir le lien dans un nouvel onglet au lieu de le renvoyer. Voir [SDK](/docs/sdk#sign-links).

### Sans code {#signs-page}

https://hivesigner.com/signs (« Signer une transaction ») liste chaque opération prise en charge avec un formulaire pour ses champs. Il construit un lien `/sign/op/` et l’ouvre.

## Quelle clé nécessite un lien {#which-key}

Chaque opération nécessite une clé : publication, active ou propriétaire. Le [tableau ci-dessous](#supported-operations) les liste. Trois opérations dépendent de leurs valeurs :

- `custom_json` nécessite la clé active quand `required_auths` nomme un compte. Sinon elle nécessite la clé de publication.
- `account_update` nécessite la clé propriétaire quand elle définit `owner`. Sinon elle nécessite la clé active.
- `account_update2` nécessite la clé propriétaire quand elle définit `owner`. Elle nécessite la clé active quand elle définit `active`, `posting`, `memo_key` ou `json_metadata`. Avec seulement `posting_json_metadata`, elle nécessite la clé de publication.

Hivesigner signe un lien avec une seule clé, toutes les opérations d’un même lien doivent donc nécessiter la même. Hivesigner refuse de signer un lien qui les mélange et en explique la raison à la personne. Envoyez de telles opérations dans des liens distincts.

Quand le compte sélectionné n’a pas la clé sur l’appareil, Hivesigner dit quelle clé manque et propose de l’ajouter. Voir [Quand la clé manque](/docs/signing#missing-key).

## Ce que voit la personne {#what-the-user-sees}

- Un écran intitulé « Confirmer la transaction », avec une carte par opération : un résumé en mots clairs, la clé qu’elle nécessite et les valeurs qu’elle porte.
- « Vous allez être redirigé vers HOST. » quand le lien a une URL de rappel. Utilisez une URL de rappel sur votre propre site, pour que les gens reconnaissent l’hôte.
- Un avertissement quand une opération agit en tant qu’un compte autre que celui qui signe.
- **Approuver**, ou **Signer** pour un lien de signature seule. Un compte verrouillé demande d’abord son code d’accès.
- Après une diffusion, « Transaction diffusée avec succès » avec l’identifiant de la transaction. Puis la redirection vers votre URL de rappel.

[Examiner et signer](/docs/signing#confirm-screen) décrit l’écran pour les utilisateurs.

## Opérations prises en charge {#supported-operations}

Hivesigner signe ces 41 opérations, sous leurs noms sur la blockchain. Tout le reste est refusé. Le nom est celui que Hivesigner affiche sur l’écran de confirmation.

| Opération | Clé | Nom |
| --- | --- | --- |
| `transfer` | Active | Transfert |
| `recurrent_transfer` | Active | Transfert récurrent |
| `delegate_vesting_shares` | Active | Déléguer du Hive Power |
| `transfer_to_vesting` | Active | Power up |
| `set_withdraw_vesting_route` | Active | Définir la destination du power down |
| `withdraw_vesting` | Active | Power down |
| `transfer_to_savings` | Active | Transfert vers l’épargne |
| `transfer_from_savings` | Active | Transfert depuis l’épargne |
| `cancel_transfer_from_savings` | Active | Annuler un transfert depuis l’épargne |
| `convert` | Active | Convertir des HBD en HIVE |
| `collateralized_convert` | Active | Convertir des HIVE en HBD |
| `account_witness_vote` | Active | Vote pour un témoin |
| `witness_update` | Active | Mise à jour de témoin |
| `witness_set_properties` | Active | Définition des propriétés de témoin |
| `account_witness_proxy` | Active | Proxy de gouvernance |
| `claim_account` | Active | Réclamer un crédit de compte |
| `account_create` | Active | Créer un compte |
| `create_claimed_account` | Active | Créer un compte avec des crédits de compte |
| `vote` | Publication | Vote |
| `limit_order_create` | Active | Créer un ordre à cours limité |
| `limit_order_create2` | Active | Créer un ordre à cours limité |
| `limit_order_cancel` | Active | Annuler un ordre à cours limité |
| `claim_reward_balance` | Publication | Réclamer les récompenses |
| `comment` | Publication | Article ou commentaire |
| `comment_options` | Publication | Options d’article ou de commentaire |
| `custom_json` | Publication, ou Active quand `required_auths` est défini | Opération personnalisée |
| `delete_comment` | Publication | Supprimer un commentaire |
| `account_update` | Active, ou Propriétaire quand `owner` est défini | Mise à jour du compte (active) |
| `account_update2` | Publication, Active ou Propriétaire, selon le champ | Mise à jour du compte (publication) |
| `change_recovery_account` | Propriétaire | Changer le compte de récupération |
| `create_proposal` | Active | Créer une proposition |
| `remove_proposal` | Active | Supprimer une proposition |
| `update_proposal_votes` | Active | Mettre à jour les votes de propositions |
| `update_proposal` | Active | Mettre à jour une proposition |
| `escrow_transfer` | Active | Transfert sous séquestre |
| `escrow_approve` | Active | Approbation du séquestre |
| `escrow_dispute` | Active | Litige sur un séquestre |
| `escrow_release` | Active | Libération du séquestre |
| `account_create_with_delegation` | Active | Créer un compte avec délégation |
| `request_account_recovery` | Active | Demander la récupération d’un compte |
| `recover_account` | Propriétaire | Récupérer un compte |
