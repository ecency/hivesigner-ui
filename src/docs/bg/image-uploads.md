Публикациите в Hive сочат към изображения чрез URL адрес, затова на приложението му трябва място, където да ги качва. imagehoster е хостинг за изображения с отворен код, направен за Hive. Той може да приема качвания от хора, които са влезли във вашето приложение с Hivesigner: техният токен за достъп замества подпис с техния ключ.

## Как работи {#how-it-works}

1. Потребителят влиза във вашето приложение с Hivesigner, с posting достъп. Приложението ви получава токен за достъп. Вижте [Вход с OAuth2](/docs/oauth2).
2. Приложението ви изпраща изображението към вашия imagehoster, с този токен в URL адреса.
3. imagehoster проверява токена и акаунта, съхранява изображението и отговаря с неговия URL адрес.
4. Приложението ви поставя URL адреса в публикацията.

## Пуснете собствен imagehoster {#run-your-own}

imagehoster се настройва за един акаунт на приложение: `app_account` в раздела `[upload_limits]` на конфигурацията му. Изпращайте му токени, създадени за този акаунт. Публичните инстанции принадлежат на други приложения: images.ecency.com е настроен за акаунта на Ecency, а images.hive.blog за този на Hive.blog. За да приемате качвания от вашите потребители, пуснете собствена инстанция с вашия акаунт на приложение.

Изходният код и ръководствата за настройка:

- imagehoster на общността Hive: https://gitlab.syncad.com/hive/imagehoster
- imagehoster на Ecency: https://github.com/ecency/imagehoster

В конфигурацията задайте своя акаунт на приложение:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

Същият раздел задава минималната репутация, която акаунтът трябва да има, за да качва (`reputation`), и квотата за качване на всеки акаунт (`max` качвания за `duration` милисекунди). Настройте `redis_url`, за да се прилага квотата. `max_image_size` задава най-големия файл, в байтове.

## Качете изображение {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Токенът.** Поставете токена за достъп на потребителя в пътя, както Hivesigner го е дал на приложението ви. Използвайте токен от вход с posting достъп за вашето приложение. Токен само за вход, от заявка без `client_id`, не назовава приложение и се отказва.
- **Тялото.** Изпратете `multipart/form-data` с един файл с изображение. imagehoster взема първия файл, независимо от името на полето.
- **Размерът.** Изпратете заглавка `Content-Length`. Файлът не трябва да е по-голям от `max_image_size` на инстанцията.

Отговорът е JSON. При успех съдържа URL адреса на изображението:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

При неуспех imagehoster отговаря с HTTP статус за грешка. Повечето неуспехи носят и име на грешката:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Бележка:** Токенът пътува в URL адреса. Предоставяйте своя imagehoster само по https и пазете дневниците му за достъп частни.

## Пример {#example}

Тази функция в браузъра качва файл от поле за файл или от плъзгане. Браузърът задава multipart заглавките и дължината вместо вас: не задавайте `Content-Type` сами.

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
