Las publicaciones de Hive apuntan a las imágenes por su URL, así que una aplicación necesita algún sitio donde subirlas. Un imagehoster es alojamiento de imágenes de código abierto hecho para Hive. Puede aceptar subidas de personas que iniciaron sesión en tu aplicación con Hivesigner: su token de acceso hace las veces de una firma con su clave.

## Cómo funciona {#how-it-works}

1. La persona inicia sesión en tu aplicación con Hivesigner, con acceso de publicación. Tu aplicación recibe un token de acceso. Consulta [Iniciar sesión con OAuth2](/docs/oauth2).
2. Tu aplicación envía la imagen a tu imagehoster, con ese token en la URL.
3. El imagehoster comprueba el token y la cuenta, guarda la imagen y responde con su URL.
4. Tu aplicación pone la URL en la publicación.

## Monta tu propio imagehoster {#run-your-own}

Un imagehoster se configura para una sola cuenta de aplicación: `app_account` en la sección `[upload_limits]` de su configuración. Envíale tokens creados para esa cuenta de aplicación. Las instancias públicas pertenecen a otras aplicaciones: images.ecency.com está configurada para la cuenta de aplicación de Ecency e images.hive.blog para la de Hive.blog. Para aceptar subidas de tus usuarios, monta tu propia instancia con tu cuenta de aplicación.

El código fuente y las guías de instalación:

- El imagehoster de la comunidad Hive: https://gitlab.syncad.com/hive/imagehoster
- El imagehoster de Ecency: https://github.com/ecency/imagehoster

En la configuración, define tu cuenta de aplicación:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

La misma sección define la reputación mínima que necesita una cuenta para subir (`reputation`) y la cuota de subida de cada cuenta (`max` subidas por `duration` milisegundos). Configura `redis_url` para que la cuota se aplique de verdad. `max_image_size` fija el archivo más grande, en bytes.

## Sube una imagen {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **El token.** Pon el token de acceso de la persona en la ruta, tal como Hivesigner se lo dio a tu aplicación. Usa un token de un inicio de sesión con acceso de publicación para tu aplicación. Un token de solo inicio de sesión, de una solicitud sin `client_id`, no nombra ninguna aplicación y se rechaza.
- **El cuerpo.** Envía `multipart/form-data` con un archivo de imagen. El imagehoster toma el primer archivo, sea cual sea el nombre de su campo.
- **El tamaño.** Envía una cabecera `Content-Length`. El archivo no debe ser mayor que el `max_image_size` de la instancia.

La respuesta es JSON. Si todo va bien, contiene la URL de la imagen:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

Si algo falla, el imagehoster responde con un estado HTTP de error. La mayoría de los fallos llevan además un nombre de error:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Nota:** El token viaja en la URL. Sirve tu imagehoster solo sobre https y mantén sus registros de acceso en privado.

## Ejemplo {#example}

Esta función de navegador sube un archivo desde un campo de archivo o desde un arrastre. El navegador pone por ti las cabeceras multiparte y la longitud: no definas `Content-Type` tú mismo.

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
