Дописи Hive вказують на зображення за адресою, тож застосунку потрібне місце, куди їх завантажувати. imagehoster це відкритий хостинг зображень, зроблений для Hive. Він може приймати завантаження від людей, які ввійшли до вашого застосунку через Hivesigner: їхній токен доступу заміняє підпис їхнім ключем.

## Як це працює {#how-it-works}

1. Користувач входить до вашого застосунку через Hivesigner, з доступом до публікації. Ваш застосунок отримує токен доступу. Див. [Вхід через OAuth2](/docs/oauth2).
2. Ваш застосунок надсилає зображення на ваш imagehoster, із цим токеном в адресі.
3. imagehoster перевіряє токен і обліковий запис, зберігає зображення й відповідає його адресою.
4. Ваш застосунок кладе адресу в допис.

## Запустіть власний imagehoster {#run-your-own}

imagehoster налаштовують для одного облікового запису застосунку: `app_account` у розділі `[upload_limits]` його конфігурації. Надсилайте йому токени, створені для цього облікового запису. Публічні примірники належать іншим застосункам: images.ecency.com налаштовано для облікового запису застосунку Ecency, а images.hive.blog для Hive.blog. Щоб приймати завантаження від своїх користувачів, запустіть власний примірник зі своїм обліковим записом застосунку.

Вихідний код і настанови з налаштування:

- imagehoster спільноти Hive: https://gitlab.syncad.com/hive/imagehoster
- imagehoster від Ecency: https://github.com/ecency/imagehoster

У конфігурації задайте свій обліковий запис застосунку:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

Той самий розділ задає мінімальну репутацію, потрібну обліковому запису для завантаження (`reputation`), і квоту завантажень для кожного облікового запису (`max` завантажень за `duration` мілісекунд). Налаштуйте `redis_url`, щоб квота діяла. `max_image_size` задає найбільший файл у байтах.

## Завантажте зображення {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Токен.** Покладіть токен доступу користувача у шлях, у тому вигляді, у якому Hivesigner дав його вашому застосунку. Використовуйте токен із входу з доступом до публікації для вашого застосунку. Токен лише для входу, із запиту без `client_id`, не називає жодного застосунку, і його буде відхилено.
- **Тіло.** Надсилайте `multipart/form-data` з одним файлом зображення. imagehoster бере перший файл, хай як називається поле.
- **Розмір.** Надсилайте заголовок `Content-Length`. Файл не має бути більшим за `max_image_size` цього примірника.

Відповідь це JSON. В успішному випадку вона містить адресу зображення:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

У разі невдачі imagehoster відповідає статусом помилки HTTP. Більшість невдач несуть також назву помилки:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Примітка:** токен мандрує в адресі. Роздавайте свій imagehoster лише через https і тримайте його журнали доступу закритими.

## Приклад {#example}

Ця браузерна функція завантажує файл із поля вибору файлів або з перетягування. Заголовки multipart і довжину браузер задає за вас: не задавайте `Content-Type` самі.

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
