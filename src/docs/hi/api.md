Hivesigner का API `https://hivesigner.com/api/` पर है। यह लॉगिन किए उपयोगकर्ता का खाता लौटाता है, उसकी ओर से पोस्टिंग ऑपरेशन प्रसारित करता है, कोड के बदले टोकन देता है और Hivesigner इस्तेमाल करने वाले ऐप्स की सूची देता है। यह पन्ना हर एंडपॉइंट को उसके अनुरोधों, उत्तरों और त्रुटियों के साथ बताता है।

## अनुरोध और प्रमाणीकरण {#authentication}

- **आधार URL:** `https://hivesigner.com/api/`। नीचे का हर एंडपॉइंट `https://hivesigner.com` के सापेक्ष है।
- **टोकन:** उसे जैसा है वैसा ही `Authorization` हेडर में भेजें: `Authorization: ACCESS_TOKEN`। `Bearer ` उपसर्ग भी स्वीकार होता है। आप उसे क्वेरी स्ट्रिंग या बॉडी में `access_token` के रूप में भी भेज सकते हैं, पर हेडर उसे URL और लॉग से बाहर रखता है।
- **बॉडी:** `Content-Type: application/json` के साथ JSON, या एक फ़ॉर्म (`application/x-www-form-urlencoded`)।
- **उत्तर:** JSON।
- **ब्राउज़र:** API क्रॉस-ऑरिजिन अनुरोध स्वीकार करता है, इसलिए कोई वेब ऐप उसे सीधे बुला सकता है।

टोकन पाने के लिए देखें [OAuth2 से लॉगिन](/docs/oauth2)। टोकन में क्या होता है, इसके लिए देखें [टोकन](/docs/tokens)।

## त्रुटियाँ {#errors}

त्रुटि वाले उत्तर में HTTP त्रुटि स्थिति और यह बॉडी होती है:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| स्थिति | `error` | कब |
| --- | --- | --- |
| 401 | `invalid_grant` | टोकन नहीं है या वैध नहीं है, या इस एंडपॉइंट के लिए ग़लत प्रकार का है ("The token has invalid role")। `/api/oauth2/token` पर यह भी: "The code or secret is not valid"। |
| 401 | `invalid_scope` | `/api/broadcast`: ऐसा ऑपरेशन जिसकी टोकन इजाज़त नहीं देता। विवरण उन ऑपरेशनों के नाम बताता है। |
| 401 | `unauthorized_client` | `/api/broadcast`: ऐसा ऑपरेशन जिसका लेखक टोकन वाला उपयोगकर्ता नहीं है, कुंजियों को छूता `account_update2`, पोस्टिंग अधिकार की ग़ायब अनुमति, या ऐसा खाता जो लोड नहीं हो सका। विवरण बताता है कि कौन-सा। |
| 500 | `server_error` | `/api/broadcast`: Hive नेटवर्क ने लेन-देन अस्वीकार कर दिया। `error_description` में उसका संदेश होता है। |
| 503 | `unavailable` | `/api/apps`: डायरेक्टरी अभी बन रही है। |

## GET /api/me {#me}

वह खाता लौटाता है जिसके लिए टोकन है। इसका इस्तेमाल यह जानने के लिए करें कि किसने लॉगिन किया, या [किसी टोकन को जाँचने](/docs/tokens#check-with-the-api) के लिए।

- **मेथड:** `GET` या `POST`।
- **टोकन:** एक एक्सेस टोकन, उस `login` टोकन समेत जिसमें किसी ऐप का नाम हो।

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

उत्तर, संक्षेप में:

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| फ़ील्ड | अर्थ |
| --- | --- |
| `user` | वह Hive उपयोगकर्ता नाम जिसके लिए टोकन है। `_id` और `name` उसी को दोहराते हैं। |
| `account` | पूरा खाता, जैसा Hive का `condenser_api.get_accounts` लौटाता है। |
| `scope` | टोकन किसकी इजाज़त देता है: लॉगिन टोकन के लिए `["login"]`, वरना वे ऑपरेशन जो `/api/broadcast` स्वीकार करता है। |
| `user_metadata` | खाते का प्रोफ़ाइल मेटाडेटा, JSON से पढ़ा हुआ। |

`/api/me` यह नहीं बताता कि टोकन किस ऐप के लिए बना था। उसे जाँचने के लिए टोकन डिकोड करें: देखें [API से पूछें](/docs/tokens#check-with-the-api)।

## POST /api/broadcast {#broadcast}

टोकन वाले उपयोगकर्ता के पोस्टिंग ऑपरेशन @hivesigner की पोस्टिंग कुंजी से साइन करता है और Hive पर प्रसारित कर देता है।

- **मेथड:** `POST`।
- **टोकन:** एक `posting` एक्सेस टोकन, टोकन फ़्लो या कोड फ़्लो से।
- **काम करने से पहले:** उपयोगकर्ता ने आपके ऐप खाते को पोस्टिंग अधिकार दिया हो (अनुमति वाली स्क्रीन यही करती है) और आपके ऐप खाते ने [@hivesigner को पोस्टिंग अधिकार दिया हो](/docs/register-app#grant-hivesigner)।
- **बॉडी:** `{ "operations": [...] }`, जिसमें हर ऑपरेशन `[name, fields]` है, ठीक वैसे ही जैसे Hive ब्लॉकचेन पर। एक अनुरोध के सारे ऑपरेशन एक ही लेन-देन में जाते हैं।

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

वही अनुरोध curl से:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

फ़ॉलो एक `custom_json` ऑपरेशन है:

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

जैसे ही कोई Hive नोड लेन-देन स्वीकार करता है, API उत्तर दे देता है। `result.id` लेन-देन की आईडी है:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

जब नेटवर्क लेन-देन अस्वीकार करता है, तब उत्तर `server_error` के साथ `500` होता है। उसके `error_description` में नेटवर्क का संदेश और `response` में कच्ची त्रुटि होती है।

### broadcast क्या स्वीकार करता है {#broadcast-rules}

पोस्टिंग टोकन API को यही ऑपरेशन प्रसारित करने देता है, और कोई नहीं। हर एक में टोकन वाला उपयोगकर्ता दिखाए गए फ़ील्ड का खाता होना चाहिए:

| ऑपरेशन | टोकन वाला उपयोगकर्ता होना चाहिए |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | `required_posting_auths` का पहला खाता |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **कोई और ऑपरेशन** `invalid_scope` के साथ अस्वीकार होता है। `login` टोकन किसी भी ऑपरेशन की इजाज़त नहीं देता।
- **दूसरे खाते के लिए ऑपरेशन** `unauthorized_client` के साथ अस्वीकार होता है। टोकन हमेशा सिर्फ़ अपने ही उपयोगकर्ता की ओर से प्रसारित करता है।
- **`account_update2`** सिर्फ़ खाते का मेटाडेटा बदल सकता है। `owner`, `active` या `posting` फ़ील्ड वाला ऑपरेशन `unauthorized_client` के साथ अस्वीकार होता है।
- **`custom_json`**: `required_auths` खाली रखें। API पोस्टिंग अधिकार से साइन करता है, इसलिए सक्रिय अधिकार माँगने वाला ऑपरेशन नेटवर्क पर विफल हो जाता है।

ट्रांसफ़र और दूसरे वॉलेट ऑपरेशन के लिए उपयोगकर्ता की सक्रिय कुंजी चाहिए। उन्हें इसके बजाय [साइन लिंक](/docs/sign-links) के रूप में भेजें।

## POST /api/oauth2/token {#oauth2-token}

कोड के बदले टोकन, या रिफ़्रेश टोकन के बदले नए टोकन देता है। इसे सिर्फ़ अपने सर्वर से बुलाएँ। देखें [कोड फ़्लो](/docs/oauth2#code-flow)।

- **मेथड:** `POST`, मानों के साथ बॉडी में।
- **बॉडी:** `code` और `client_secret`, या `refresh_token` और `client_secret`।
- **हेडर:** कोई `Authorization` हेडर न भेजें।

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

हर कॉल एक नया एक्सेस टोकन और एक नया रिफ़्रेश टोकन लौटाता है। दोनों को @hivesigner साइन करता है। `expires_in` एक्सेस टोकन की आयु है, सेकंड में (7 दिन)।

त्रुटियाँ: `401 invalid_grant`। जब भेजा गया मान वैध कोड या रिफ़्रेश टोकन न हो तो विवरण "The token has invalid role" होता है। जब कोड या सीक्रेट मेल न खाए तो "The code or secret is not valid" होता है।

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Hivesigner को बताता है कि उपयोगकर्ता आपके ऐप से लॉगआउट कर चुका है। आपका ऐप टोकन खुद छोड़ देता है।

- **मेथड:** `POST`।
- **टोकन:** एक्सेस टोकन, `Authorization` हेडर में।

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

JavaScript SDK का `revokeToken()` यही कॉल करता है और फिर टोकन भुला देता है। आपके ऐप की पहुँच हमेशा के लिए हटाने के लिए उपयोगकर्ता उसे https://hivesigner.com/authorized-apps पर हटाता है। देखें [लॉगआउट और पहुँच हटाना](/docs/tokens#sign-out)।

## GET /api/apps {#apps}

सार्वजनिक ऐप डायरेक्टरी: वे ऐप जो Hivesigner से प्रसारण करते हैं, इस क्रम में कि उन्हें कितने लोग इस्तेमाल करते हैं। इसके लिए कोई टोकन नहीं चाहिए। https://hivesigner.com/apps वही सूची दिखाता है।

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| फ़ील्ड | अर्थ |
| --- | --- |
| `updated_at` | डायरेक्टरी आख़िरी बार कब बनी। |
| `building` | जब तक पहली बार बनने पर डेटा न आ जाए तब तक `true`। तब `apps` खाली रहता है। |
| `window_days` | रैंकिंग कितने दिनों को कवर करती है। |
| `featured` | वे उपयोगकर्ता नाम जो पहले दिखते हैं, इसी क्रम में। |
| `apps[].username` | ऐप खाता। |
| `apps[].name`, `about` | ऐप खाते की प्रोफ़ाइल से, या `null`। |
| `apps[].website` | प्रोफ़ाइल की वेबसाइट, जब वह अपने ही डोमेन पर उत्तर दे। वरना `null`। |
| `apps[].site` | वेबसाइट जाँच का नतीजा: `ok`, `no_website`, `invalid`, `redirected`, `blocked` या `unreachable`। `redirected` प्रविष्टि में `redirects_to` भी होता है। |
| `apps[].users` | रोज़ाना अलग-अलग उपयोगकर्ता, पूरी अवधि का जोड़। |
| `apps[].requests` | उस अवधि में ऐप के लिए हुए सफल API अनुरोध। |
| `apps[].first_seen`, `last_seen` | पहला दिन जब Hivesigner ने ऐप दर्ज किया और आख़िरी दिन जब वह इस्तेमाल हुआ, या `null`। |
| `apps[].new` | `true`, जब ऐप पहली बार इसी अवधि में दिखा हो। |

उत्तर 5 मिनट तक कैश में रह सकता है। डायरेक्टरी पहली बार बनने से पहले API `unavailable` के साथ `503` देता है। बाद में फिर कोशिश करें।

नाम और विवरण हर ऐप खाता खुद प्रकाशित करता है। Hivesigner उनमें से किसी की पुष्टि नहीं करता।
