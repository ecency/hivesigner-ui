Votre application peut demander à une personne de signer un message texte avec sa clé de publication ou active. La signature prouve que la personne contrôle le compte. Rien n’est diffusé : le message n’atteint jamais la blockchain. Hivesigner signe de la même façon que le `requestSignBuffer` de Hive Keychain, le code serveur qui vérifie une signature Keychain vérifie donc aussi une signature Hivesigner.

## Demander une signature {#request}

Envoyez la personne vers `https://hivesigner.com/sign-buffer` avec ces paramètres de requête :

| Paramètre | Obligatoire | Signification |
| --- | --- | --- |
| `message` | Oui | Le texte exact à signer. Il doit contenir plus que des espaces. |
| `redirect_uri` | Oui | Où Hivesigner envoie le résultat. Voir [Règles de l’URL de rappel](#callback-rules). |
| `authority` | Non | `posting` ou `active`, dans n’importe quelle casse (`Posting` convient aussi). `posting` quand il est absent ou vide. Toute autre valeur est refusée. |
| `client_id` | Non | Le compte de votre application. `clientId` est lu aussi. Avec lui, `redirect_uri` doit être l’une des URL de rappel de votre application. |
| `state` | Non | N’importe quelle valeur. Hivesigner la renvoie inchangée. |
| `account` | Non | Le compte dont vous attendez la signature. Hivesigner le sélectionne quand il est sur l’appareil et l’ignore sinon. `select_account` est lu aussi. |

Construisez l’URL avec `URLSearchParams`, pour que chaque valeur soit encodée :

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### Règles de l’URL de rappel {#callback-rules}

- L’URL de rappel doit être en `https://`. Le `http://` simple ne fonctionne que sur le bouclage local : `localhost`, `127.0.0.1` ou `[::1]`.
- **Avec `client_id`**, l’URL de rappel doit être enregistrée sur ce compte d’application, vérifiée comme pour la connexion. Voir [URL de rappel](/docs/register-app#callback-rules). Hivesigner lit les URL de rappel de l’application depuis Hive à l’ouverture de la demande et ne signe rien avant de les avoir lues. Quand Hive est injoignable, la personne obtient un bouton **Réessayer**.
- **Sans `client_id`**, toute URL de rappel qui suit la première règle convient. Hivesigner nomme alors l’hôte de l’URL de rappel comme demandeur, par exemple « HOST vous demande de signer un message. ».

Envoyez `client_id` quand vous avez un compte d’application. La personne voit alors le nom et le compte de votre application. Seules vos URL de rappel enregistrées peuvent recevoir la signature.

Hivesigner refuse une demande sans message, avec un `authority` inconnu, avec une URL de rappel absente ou inutilisable, avec un `client_id` qui n’est pas un compte Hive ou avec une URL de rappel non enregistrée sur cette application. La personne voit « Cette demande de signature est inutilisable : il lui faut un message, une clé de publication ou active et une URL de redirection sécurisée enregistrée pour l’application. Retournez sur le site et réessayez. » et un bouton **Signaler ce problème**.

### Ce que voit la personne {#what-the-user-sees}

- Un titre qui nomme votre application (ou l’hôte de l’URL de rappel) et « Vous redirige vers HOST ».
- Le message entier, exactement tel qu’il sera signé. Les caractères qui pourraient masquer du texte ou en changer le sens de lecture sont affichés sous forme de codes comme `\u{200B}`.
- « Sera signée avec votre clé de publication » ou « Sera signée avec votre clé active ».
- Un avertissement : « Votre signature prouve à quiconque la voit que @USERNAME a signé exactement ce texte. Ne signez qu’un message que vous comprenez. »
- **Signer** et **Annuler**. Un compte verrouillé demande d’abord son code d’accès.

[Demandes de signature de message](/docs/signing#message-requests) décrit l’écran pour les utilisateurs.

## Ce que reçoit votre URL de rappel {#callback}

Quand la personne choisit **Signer**, Hivesigner l’envoie vers votre URL de rappel avec ces paramètres de requête :

| Paramètre | Valeur |
| --- | --- |
| `signature` | La signature, chaîne hexadécimale de 130 caractères |
| `public_key` | La clé publique de la clé qui a signé, comme `STM...` |
| `username` | Le compte qui a signé |
| `authority` | `posting` ou `active` |
| `state` | Votre `state`, dès que la demande en avait un (même vide) |

Hivesigner les ajoute à la requête de votre URL de rappel, après `?` ou `&` et avant tout `#fragment`. Votre propre requête reste telle quelle.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Quand la personne choisit **Annuler**, Hivesigner ouvre sa liste de comptes. Votre URL de rappel ne reçoit rien.

> **Avertissement :** N’importe qui peut ouvrir votre URL de rappel avec des valeurs inventées. Traitez chaque paramètre comme une affirmation tant que votre serveur n’a pas vérifié la signature.

## Vérifier la signature {#verify}

Vérifiez la signature sur votre serveur :

1. Gardez sur votre serveur le message que vous avez demandé, avec son `state`. Ne faites pas confiance à une copie qui revient du navigateur.
2. Calculez l’empreinte du message : sha256 sur ses octets UTF-8.
3. Récupérez la clé publique depuis la signature et cette empreinte.
4. Chargez le compte depuis Hive. Vérifiez que la clé récupérée appartient à l’autorité que vous avez demandée, avec un poids suffisant pour signer seule.
5. Vérifiez que `state` est celui que vous avez émis. N’acceptez chaque message qu’une fois.

Cet exemple utilise dhive (https://www.npmjs.com/package/@hiveio/dhive) :

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

La même vérification fonctionne pour une signature du `requestSignBuffer` de Hive Keychain. Comparez avec la clé que vous avez récupérée : `public_key` dans l’URL de rappel n’est qu’une indication.

## Messages que Hivesigner ne signe pas {#refused-messages}

Un message qui est un objet JSON avec une clé `signed_message` a la forme d’un jeton Hivesigner. Le signer donnerait au demandeur l’accès au compte de la personne. Hivesigner ne signe jamais un tel message. Il dit à la personne « Ce message est un jeton Hivesigner. Le signer donnerait au site l’accès à votre compte, il ne peut donc pas être signé. »

Utilisez du texte simple, ou du JSON sans clé `signed_message`. Dites à quoi sert la signature et ajoutez une valeur que vous générez une fois, par exemple :

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## L’outil Signer un message {#sign-message-tool}

Les gens peuvent aussi signer un message par eux-mêmes sur https://hivesigner.com/signmessage (**Signer un message**) et en vérifier un sur https://hivesigner.com/verifymessage (**Vérifier un message**). Voir [Signer un message soi-même](/docs/signing#sign-message).

Cet outil signe autrement que `/sign-buffer`. Il signe un corps de jeton Hivesigner qui contient le message, le compte et l’heure. Il partage le résultat sous forme de **Jeton de vérification**. Vérifiez un tel jeton sur la page **Vérifier un message** ou comme décrit dans [Vérifier vous-même](/docs/tokens#check-it-yourself), pas avec le code ci-dessus.
