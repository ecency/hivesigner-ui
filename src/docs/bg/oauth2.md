Изпратете хората към Hivesigner, за да влязат във вашето приложение. Там те преглеждат заявката ви и я одобряват. След това Hivesigner ги връща към вашия адрес за обратно извикване с токен (потокът с токен) или с код, който вашият сървър разменя за токени (потокът с код). Тази страница покрива и двата потока, всички параметри и обхватите.

## Преди да започнете {#before-you-start}

- Регистрирайте приложението си: Hive акаунт за него, с изброени ваши адреси за обратно извикване. Вижте [Регистрирайте приложението си](/docs/register-app).
- За да излъчвате през API, акаунтът на приложението ви трябва също да [даде posting правомощия на @hivesigner](/docs/register-app#grant-hivesigner).
- За потока с код задайте [клиентска тайна](/docs/register-app#client-secret).

## Адресът за упълномощаване {#authorize-url}

Изпратете потребителя към този адрес:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Кодирайте всяка стойност за URL. `URLSearchParams` го прави вместо вас:

```js
import { randomBytes } from 'node:crypto';

const state = randomBytes(16).toString('hex');
// Store `state` in the user's session before you redirect (see "Protect the request with state").

const params = new URLSearchParams({
  client_id: 'myapp',
  redirect_uri: 'https://myapp.example/auth/callback',
  scope: 'posting',
  state,
});
const authorizeUrl = `https://hivesigner.com/oauth2/authorize?${params}`;
```

### Параметри {#parameters}

| Параметър | Задължителен | Какво прави |
| --- | --- | --- |
| `client_id` | Да, за приложение | Името на акаунта на вашето приложение. Чете се и `clientId`. Без него заявката е заявка само за вход от сайт без акаунт за приложение: вижте [Вход без posting достъп](/docs/login-only). |
| `redirect_uri` | Да | Къде Hivesigner връща потребителя. Трябва да е точно един от URI адресите за пренасочване на приложението ви. Вижте [Адреси за обратно извикване](/docs/register-app#callbacks). |
| `scope` | Не | `login`, `posting` или `offline`. Вижте [Обхвати](#scopes). Без него заявката иска posting достъп. |
| `response_type` | Не | `code` започва [потока с код](#code-flow). Всяка друга стойност или никаква означава [потока с токен](#token-flow). |
| `state` | Препоръчително | Случайна стойност, която Hivesigner връща непроменена. Вижте [Защитете заявката със state](#state). |
| `account` | Не | Потребителско име в Hive. Когато този акаунт е на устройството на потребителя, Hivesigner го избира. Иначе се пренебрегва. Чете се и `select_account`. |

Потребителят все пак може да превключи към друг акаунт на екрана за съгласие. Винаги вземайте акаунта от токена или от размяната на кода, никога от това, което сте поискали.

## Обхвати {#scopes}

Hive има едни posting правомощия. Затова Hivesigner има две нива на достъп, само вход и posting, и нищо по-фино между тях.

| `scope` | Какво одобрява потребителят | Поток | `type` на токена за достъп |
| --- | --- | --- | --- |
| `login` | "Преглед на потребителското име на вашия акаунт". Нищо не се предоставя. | Поток с токен (не добавяйте `response_type=code`) | `login` |
| `posting` | posting достъп. Първия път това добавя акаунта на вашето приложение към posting правомощията на потребителя. | Поток с токен или поток с код с `response_type=code` | `posting` |
| `offline` | posting достъп, както по-горе | Поток с код | `posting`, с токен `refresh` |

В потока с код адресът за обратно извикване първо получава код (токен с `type` `code`), който вашият сървър разменя за токена за достъп.

- **Без обхват** означава `posting`.
- **Стойност, която съдържа `offline`** където и да е, означава `offline`, например старата `offline,vote,comment`.
- **Всяка друга стойност** означава `posting`. Това включва старите имена на операции като `vote`, `comment`, `vote,comment`, `comment_options` или `custom_json`. Те не ограничават токена: всеки posting токен позволява едни и същи операции. Вижте [Какво приема broadcast](/docs/api#broadcast-rules).

Искайте `login`, когато приложението ви трябва само да знае кой е потребителят. Вижте [Вход без posting достъп](/docs/login-only).

## Потокът с токен {#token-flow}

Браузърът на потребителя получава токена за достъп директно. Приложението ви не се нуждае от тайна.

1. Изпратете потребителя към адреса за упълномощаване:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. Потребителят одобрява. Hivesigner пренасочва към вашия адрес за обратно извикване:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner добавя своите параметри с `?`, когато адресът ви няма query, и с `&`, когато има. `state` присъства само ако сте изпратили непразна стойност.

3. На своя адрес за обратно извикване първо [сравнете `state`](#state). След това [проверете токена](/docs/tokens#check-a-token) на своя сървър. Акаунтът, за който е токенът, е вътре в него: не разчитайте само на параметъра `username`, защото всеки може да редактира URL адрес.
4. Пазете токена на своя сървър или в httpOnly бисквитка. Пренасочете към чист URL адрес, за да излезе токенът от адресната лента.
5. Използвайте токена с [API](/docs/api), докато изтече след `expires_in` секунди (7 дни). След това изпратете потребителя отново към адреса за упълномощаване. Който вече е дал posting достъп, вижда "Вход в APP" и "Вече сте упълномощили @myapp. Не се дават нови права.".

## Потокът с код {#code-flow}

Вашият сървър получава код и го разменя за токен за достъп и токен за обновяване. После може да ги подновява без потребителя. Използвайте го, когато сървърът ви действа от името на потребителите дълго време.

1. Изпратете потребителя към адреса за упълномощаване с `scope=offline`:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` прави същото.

2. Потребителят одобрява posting достъп. Hivesigner пренасочва към вашия адрес за обратно извикване:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [Сравнете `state`](#state). След това разменете кода веднага, от своя сървър.

### Разменете кода {#exchange-code}

Изпратете кода и клиентската си тайна към `/api/oauth2/token` в тялото на POST заявка:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

Отговорът:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Същото извикване в Node.js 18 или по-нов:

```js
const TOKEN_URL = 'https://hivesigner.com/api/oauth2/token';

export async function hivesignerTokens(grant) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...grant,
      client_secret: process.env.HIVESIGNER_CLIENT_SECRET,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`${data.error}: ${data.error_description}`);
  }
  return data; // { access_token, refresh_token, expires_in, username }
}

// On your callback, after checking state:
const tokens = await hivesignerTokens({ code: req.query.code });
```

- Поставете кода и тайната в тялото на заявката, никога в URL адреса.
- Не изпращайте заглавка `Authorization` с тази заявка.
- Използвайте `username` от този отговор. Той идва от кода, който потребителят е подписал.
- Пазете токена за достъп и токена за обновяване на своя сървър.

### Обновяване {#refresh}

Когато токенът за достъп изтече, изпратете токена за обновяване с клиентската си тайна към същата крайна точка:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

Отговорът има същия вид, с нов токен за достъп и нов токен за обновяване. Съхранете и двата вместо старите.

## Защитете заявката със state {#state}

Без `state` друг сайт би могъл да изпрати вашия потребител към вашия адрес за обратно извикване с токен или код по свой избор. Тогава приложението ви би вписало потребителя в чужд акаунт. `state` свързва всяко връщане с браузъра, който е започнал входа.

1. Генерирайте случайна стойност за всеки вход, поне 16 случайни байта. Шестнадесетичният запис я пази без символи, които изискват кодиране.
2. Съхранете я там, където само този браузър може да я представи отново: сесията на вашия сървър или краткотрайна httpOnly, Secure бисквитка със `SameSite=Lax`.
3. Изпратете я като `state` в адреса за упълномощаване.
4. На адреса за обратно извикване сравнете параметъра `state` със съхранената стойност. Ако липсва или е различен, спрете: не използвайте токена или кода.
5. Изтрийте съхранената стойност, за да работи всяка само веднъж.

```js
app.get('/auth/callback', async (req, res) => {
  const expected = req.session.hivesignerState;
  delete req.session.hivesignerState;
  if (!expected || req.query.state !== expected) {
    return res.status(400).send('This sign-in has expired. Please try again.');
  }
  // Token flow: req.query.access_token. Code flow: req.query.code.
});
```

Hivesigner връща същата стойност на `state`, която е получил. Празна стойност той пропуска.

## Какво вижда потребителят {#what-the-user-sees}

Екранът за съгласие показва снимката и името на вашето приложение, "Hive акаунт @myapp" и "Ще ви пренасочи към HOST", като HOST се взема от вашия адрес за обратно извикване. След това:

- **Първа posting заявка.** Заглавието гласи "APP иска достъп до вашия акаунт.". Картата **Обхват** изброява какво ще може да прави приложението ви. Съобщение гласи "Първо упълномощаване: това добавя @myapp към вашите posting правомощия в блокчейна и еднократно изисква вашия active ключ. Този акаунт ще може да публикува от ваше име, докато не му отнемете правомощията.". Бутонът гласи **Упълномощи**. Когато устройството на потребителя няма active ключ за акаунта, екранът го иска на място.
- **Вход.** За `scope=login` или за posting достъп, който потребителят вече е дал, заглавието гласи "Вход в APP", а бутонът гласи **Вход**.
- **Акаунтът.** "Упълномощаване като" или "Вход като", следвано от избрания акаунт. Потребителят може да смени акаунта тук.
- **Заключен акаунт.** Над бутона стои поле за код за достъп. Едно кликване отключва акаунта и продължава.
- **Няма акаунт на устройството.** Бутонът гласи **Продължи**. Той отваря формата за добавяне на акаунт и се връща към заявката.

След първа posting заявка Hivesigner изчаква новото разрешение да стане видимо в блокчейна, преди да пренасочи. Това може да отнеме няколко секунди. За целия екран от гледна точка на потребителя вижте [Вход в приложения](/docs/signing-in).

## Отказ и отхвърлени заявки {#cancel}

- **Отказ.** Потребителят отива към списъка си с акаунти в Hivesigner. Към вашия адрес за обратно извикване не се изпраща нищо: няма параметър за грешка. Дръжте бутона си за вход достъпен, за да може потребителят да започне отново. Не чакайте връщане.
- **Отхвърлени заявки.** Нерегистриран адрес за обратно извикване, непознат `client_id` или липсващ `redirect_uri` показват грешка в Hivesigner с бутон **Докладвайте този проблем**. Към вашия адрес не се изпраща нищо. Вижте [Какво виждат потребителите, когато нещо не е наред](/docs/register-app#refused-requests).

## Старият адрес за заявка за вход {#legacy-login-request}

Hivesigner все още приема по-стария адрес за вход, запазен за стари интеграции. За новите използвайте `/oauth2/authorize`.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

Той отваря същия екран за съгласие, със същите проверки на адреса за обратно извикване и същото пренасочване. Чете параметрите си по различен начин:

- `scope` е `login` или `posting`. Всяка друга стойност или никаква означава `login`.
- `offline` не се чете. За потока с код добавете `response_type=code`.
- `account` не се чете.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` следва същите правила.
