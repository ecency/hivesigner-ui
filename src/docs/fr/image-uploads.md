Les articles Hive pointent vers les images par leur URL, il faut donc à une application un endroit où les téléverser. Un imagehoster est un hébergeur d’images open source conçu pour Hive. Il peut accepter les téléversements des personnes connectées à votre application avec Hivesigner : leur jeton d’accès tient lieu de signature avec leur clé.

## Comment cela fonctionne {#how-it-works}

1. La personne se connecte à votre application avec Hivesigner, avec l’accès de publication. Votre application reçoit un jeton d’accès. Voir [Se connecter avec OAuth2](/docs/oauth2).
2. Votre application envoie l’image à votre imagehoster, avec ce jeton dans l’URL.
3. L’imagehoster vérifie le jeton et le compte, stocke l’image et répond avec son URL.
4. Votre application place l’URL dans l’article.

## Faire tourner votre propre imagehoster {#run-your-own}

Un imagehoster est configuré pour un seul compte d’application : `app_account` dans la section `[upload_limits]` de sa configuration. Envoyez-lui des jetons créés pour ce compte d’application. Les instances publiques appartiennent à d’autres applications : images.ecency.com est configuré pour le compte d’application d’Ecency et images.hive.blog pour celui de Hive.blog. Pour accepter les téléversements de vos utilisateurs, faites tourner votre propre instance avec votre compte d’application.

Le code source et les guides d’installation :

- L’imagehoster de la communauté Hive : https://gitlab.syncad.com/hive/imagehoster
- L’imagehoster d’Ecency : https://github.com/ecency/imagehoster

Dans la configuration, indiquez votre compte d’application :

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

La même section définit la réputation minimale requise pour téléverser (`reputation`) et le quota de téléversement de chaque compte (`max` téléversements par `duration` millisecondes). Configurez `redis_url` pour que le quota soit réellement appliqué. `max_image_size` fixe la taille de fichier maximale, en octets.

## Téléverser une image {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Le jeton.** Placez le jeton d’accès de la personne dans le chemin, tel que Hivesigner l’a donné à votre application. Utilisez un jeton issu d’une connexion avec accès de publication pour votre application. Un jeton de connexion seule, issu d’une demande sans `client_id`, ne nomme aucune application et est refusé.
- **Le corps.** Envoyez `multipart/form-data` avec un fichier image. L’imagehoster prend le premier fichier, quel que soit le nom de son champ.
- **La taille.** Envoyez un en-tête `Content-Length`. Le fichier ne doit pas dépasser le `max_image_size` de l’instance.

La réponse est du JSON. En cas de succès elle contient l’URL de l’image :

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

En cas d’échec, l’imagehoster répond avec un statut d’erreur HTTP. La plupart des échecs portent aussi un nom d’erreur :

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Remarque :** Le jeton voyage dans l’URL. Ne servez votre imagehoster qu’en https et gardez ses journaux d’accès privés.

## Exemple {#example}

Cette fonction de navigateur téléverse un fichier depuis un champ de fichier ou un glisser-déposer. Le navigateur pose les en-têtes multipart et la longueur à votre place : ne définissez pas `Content-Type` vous-même.

```js
// IMAGEHOSTER_URL is the address of your imagehoster, such as 'https://YOUR_IMAGEHOSTER'.
async function uploadImage(file, accessToken) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${IMAGEHOSTER_URL}/hs/${accessToken}`, {
    method: 'POST',
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.name ?? `Upload failed with status ${response.status}`);
  }
  return result.url;
}

const url = await uploadImage(input.files[0], ACCESS_TOKEN);
const markdown = `![](${url})`; // add this to the post body
```
