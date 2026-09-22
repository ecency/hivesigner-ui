Записи в Hive ссылаются на изображения по адресу, поэтому приложению нужно место, куда их загружать. imagehoster — это хостинг изображений с открытым кодом, созданный для Hive. Он может принимать загрузки от людей, вошедших в ваше приложение через Hivesigner: их токен доступа заменяет подпись их ключом.

## Как это работает {#how-it-works}

1. Человек входит в ваше приложение через Hivesigner, с доступом к публикации. Ваше приложение получает токен доступа. Смотрите [Вход через OAuth2](/docs/oauth2).
2. Ваше приложение отправляет изображение вашему imagehoster, с этим токеном в адресе.
3. imagehoster проверяет токен и аккаунт, сохраняет изображение и отвечает его адресом.
4. Ваше приложение вставляет этот адрес в запись.

## Запустите свой imagehoster {#run-your-own}

imagehoster настраивается на один аккаунт приложения: `app_account` в разделе `[upload_limits]` его конфигурации. Отправляйте ему токены, созданные для этого аккаунта приложения. Публичные экземпляры принадлежат другим приложениям: images.ecency.com настроен на аккаунт приложения Ecency, а images.hive.blog — на аккаунт Hive.blog. Чтобы принимать загрузки своих пользователей, запустите собственный экземпляр со своим аккаунтом приложения.

Исходный код и руководства по установке:

- imagehoster сообщества Hive: https://gitlab.syncad.com/hive/imagehoster
- imagehoster от Ecency: https://github.com/ecency/imagehoster

В конфигурации укажите свой аккаунт приложения:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

Этот же раздел задаёт минимальную репутацию, нужную аккаунту для загрузки (`reputation`), и квоту загрузок для каждого аккаунта (`max` загрузок за `duration` миллисекунд). Настройте `redis_url`, чтобы квота действительно работала. `max_image_size` задаёт наибольший размер файла в байтах.

## Загрузите изображение {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Токен.** Поместите токен доступа человека в путь ровно в том виде, в каком Hivesigner передал его вашему приложению. Используйте токен из входа с доступом к публикации для вашего приложения. Токен только для входа, полученный по запросу без `client_id`, не называет никакого приложения и будет отклонён.
- **Тело.** Отправьте `multipart/form-data` с одним файлом изображения. imagehoster берёт первый файл, каким бы ни было имя поля.
- **Размер.** Отправьте заголовок `Content-Length`. Файл не должен превышать `max_image_size` этого экземпляра.

Ответ приходит в формате JSON. При успехе в нём есть адрес изображения:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

При неудаче imagehoster отвечает статусом ошибки HTTP. У большинства неудач есть и название ошибки:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Примечание:** Токен передаётся прямо в адресе. Отдавайте свой imagehoster только по https и держите его журналы доступа закрытыми.

## Пример {#example}

Эта браузерная функция загружает файл из поля выбора файла или из перетаскивания. Браузер сам выставляет многочастные заголовки и длину: не задавайте `Content-Type` вручную.

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
