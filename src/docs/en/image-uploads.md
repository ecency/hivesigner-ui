Hive posts point to images by URL, so an app needs somewhere to upload them. An imagehoster is open source image hosting built for Hive. It can take uploads from people who signed in to your app with Hivesigner: their access token stands in for a signature with their key.

## How it works {#how-it-works}

1. The user signs in to your app with Hivesigner, with posting access. Your app receives an access token. See [Sign in with OAuth2](/docs/oauth2).
2. Your app posts the image to your imagehoster, with that token in the URL.
3. The imagehoster checks the token and the account, stores the image and answers with its URL.
4. Your app puts the URL in the post.

## Run your own imagehoster {#run-your-own}

An imagehoster is set up for one app account: `app_account` in the `[upload_limits]` section of its configuration. Send it tokens made for that app account. The public instances belong to other apps: images.ecency.com is set up for Ecency's app account and images.hive.blog for Hive.blog's. To take uploads from your users, run your own instance with your app account.

The source code and setup guides:

- The Hive community imagehoster: https://gitlab.syncad.com/hive/imagehoster
- Ecency's imagehoster: https://github.com/ecency/imagehoster

In the configuration, set your app account:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

The same section sets the minimum reputation an account needs to upload (`reputation`) and the upload quota for each account (`max` uploads per `duration` milliseconds). Configure `redis_url` so that the quota is enforced. `max_image_size` sets the largest file, in bytes.

## Upload an image {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **The token.** Put the user's access token in the path, as Hivesigner gave it to your app. Use a token from a sign-in with posting access for your app. A sign-in only token, from a request without `client_id`, names no app and is refused.
- **The body.** Send `multipart/form-data` with one image file. The imagehoster takes the first file, whatever its field name.
- **The size.** Send a `Content-Length` header. The file must not be larger than the instance's `max_image_size`.

The answer is JSON. On success it holds the image's URL:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

On failure, the imagehoster answers with an HTTP error status. Most failures also carry an error name:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Note:** The token travels in the URL. Serve your imagehoster over https only and keep its access logs private.

## Example {#example}

This browser function uploads a file from a file input or a drop. The browser sets the multipart headers and the length for you: do not set `Content-Type` yourself.

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
