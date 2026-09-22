लोगों को आपके ऐप में लॉगिन करने के लिए Hivesigner पर भेजें। वे वहाँ आपका अनुरोध देखते हैं और मंज़ूरी देते हैं। फिर Hivesigner उन्हें एक टोकन के साथ (टोकन फ़्लो) या एक कोड के साथ आपके कॉलबैक पर लौटा देता है, जिसे आपका सर्वर टोकन के बदले देता है (कोड फ़्लो)। यह पन्ना दोनों फ़्लो, हर पैरामीटर और स्कोप को कवर करता है।

## शुरू करने से पहले {#before-you-start}

- अपना ऐप पंजीकृत करें: उसके लिए एक Hive खाता, आपके कॉलबैक सूचीबद्ध करके। देखें [अपना ऐप पंजीकृत करें](/docs/register-app)।
- API से प्रसारण के लिए आपके ऐप खाते को [@hivesigner को पोस्टिंग अधिकार भी देना](/docs/register-app#grant-hivesigner) होगा।
- कोड फ़्लो के लिए एक [क्लाइंट सीक्रेट](/docs/register-app#client-secret) सेट करें।

## अनुमति URL {#authorize-url}

उपयोगकर्ता को इस पते पर भेजें:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

हर मान को URL-एन्कोड करें। `URLSearchParams` यह आपके लिए कर देता है:

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

### पैरामीटर {#parameters}

| पैरामीटर | ज़रूरी | यह क्या करता है |
| --- | --- | --- |
| `client_id` | हाँ, ऐप के लिए | आपके ऐप खाते का नाम। `clientId` भी पढ़ा जाता है। इसके बिना अनुरोध ऐसी साइट से सिर्फ़ लॉगिन का अनुरोध है जिसका ऐप खाता नहीं है: देखें [पोस्टिंग पहुँच के बिना लॉगिन](/docs/login-only)। |
| `redirect_uri` | हाँ | Hivesigner उपयोगकर्ता को कहाँ लौटाएगा। यह आपके ऐप के रीडायरेक्ट URI में से ठीक एक होना चाहिए। देखें [कॉलबैक](/docs/register-app#callbacks)। |
| `scope` | नहीं | `login`, `posting` या `offline`। देखें [स्कोप](#scopes)। इसके बिना अनुरोध पोस्टिंग पहुँच माँगता है। |
| `response_type` | नहीं | `code` [कोड फ़्लो](#code-flow) शुरू करता है। कोई और मान, या कोई नहीं, का मतलब है [टोकन फ़्लो](#token-flow)। |
| `state` | अनुशंसित | एक यादृच्छिक मान जिसे Hivesigner बिना बदले लौटाता है। देखें [अनुरोध को state से बचाएँ](#state)। |
| `account` | नहीं | कोई Hive उपयोगकर्ता नाम। जब वह खाता उपयोगकर्ता के डिवाइस पर हो, Hivesigner उसे चुन लेता है। वरना उसे अनदेखा कर देता है। `select_account` भी पढ़ा जाता है। |

उपयोगकर्ता अनुमति वाली स्क्रीन पर फिर भी दूसरा खाता चुन सकता है। खाता हमेशा टोकन से या कोड के आदान-प्रदान से लें, कभी उससे नहीं जो आपने माँगा था।

## स्कोप {#scopes}

Hive में एक ही पोस्टिंग अधिकार है। इसलिए Hivesigner में पहुँच के दो स्तर हैं, सिर्फ़ लॉगिन और पोस्टिंग, और इनके बीच कुछ बारीक नहीं।

| `scope` | उपयोगकर्ता किसे मंज़ूरी देता है | फ़्लो | एक्सेस टोकन का `type` |
| --- | --- | --- | --- |
| `login` | «आपके खाते का उपयोगकर्ता नाम देखना»। कुछ नहीं दिया जाता। | टोकन फ़्लो (`response_type=code` न जोड़ें) | `login` |
| `posting` | पोस्टिंग पहुँच। पहली बार यह आपके ऐप खाते को उपयोगकर्ता के पोस्टिंग अधिकार में जोड़ देता है। | टोकन फ़्लो, या `response_type=code` के साथ कोड फ़्लो | `posting` |
| `offline` | पोस्टिंग पहुँच, ऊपर की तरह | कोड फ़्लो | `posting`, एक `refresh` टोकन के साथ |

कोड फ़्लो में कॉलबैक को पहले एक कोड मिलता है (`type` `code` वाला टोकन) जिसे आपका सर्वर एक्सेस टोकन के बदले देता है।

- **कोई स्कोप न देना** का मतलब है `posting`।
- **जिस मान में कहीं भी `offline` हो** उसका मतलब है `offline`, जैसे पुराना `offline,vote,comment`।
- **कोई और मान** का मतलब है `posting`। इसमें `vote`, `comment`, `vote,comment`, `comment_options` या `custom_json` जैसे पुराने ऑपरेशन नाम भी आते हैं। वे टोकन को सीमित नहीं करते: हर पोस्टिंग टोकन उन्हीं ऑपरेशनों की इजाज़त देता है। देखें [broadcast क्या स्वीकार करता है](/docs/api#broadcast-rules)।

जब आपके ऐप को सिर्फ़ यह जानना हो कि उपयोगकर्ता कौन है, तब `login` माँगें। देखें [पोस्टिंग पहुँच के बिना लॉगिन](/docs/login-only)।

## टोकन फ़्लो {#token-flow}

उपयोगकर्ता के ब्राउज़र को एक्सेस टोकन सीधे मिलता है। आपके ऐप को किसी सीक्रेट की ज़रूरत नहीं।

1. उपयोगकर्ता को अनुमति URL पर भेजें:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. उपयोगकर्ता मंज़ूरी देता है। Hivesigner आपके कॉलबैक पर भेज देता है:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   जब आपके कॉलबैक में क्वेरी न हो तो Hivesigner अपने पैरामीटर `?` से जोड़ता है और जब हो तो `&` से। `state` तभी होता है जब आपने कोई ग़ैर-खाली मान भेजा हो।

3. अपने कॉलबैक पर पहले [`state` मिलाएँ](#state)। फिर अपने सर्वर पर [टोकन जाँचें](/docs/tokens#check-a-token)। जिस खाते का वह टोकन है वह टोकन के भीतर ही है: सिर्फ़ `username` पैरामीटर पर भरोसा न करें, क्योंकि कोई भी URL बदल सकता है।
4. टोकन अपने सर्वर पर या किसी httpOnly कुकी में रखें। किसी साफ़ URL पर भेज दें ताकि टोकन पता-पट्टी से हट जाए।
5. टोकन को [API](/docs/api) के साथ तब तक इस्तेमाल करें जब तक `expires_in` सेकंड (7 दिन) बाद उसकी अवधि खत्म न हो। फिर उपयोगकर्ता को दोबारा अनुमति URL पर भेजें। जिसने पहले ही पोस्टिंग पहुँच दी है उसे «APP में लॉगिन करें» और «आप @myapp को पहले ही अधिकृत कर चुके हैं। कोई नई अनुमति नहीं दी जा रही है।» दिखता है।

## कोड फ़्लो {#code-flow}

आपके सर्वर को एक कोड मिलता है और वह उसे एक एक्सेस टोकन तथा एक रिफ़्रेश टोकन के बदले देता है। बाद में वह उन्हें उपयोगकर्ता के बिना नया कर सकता है। जब आपका सर्वर लंबे समय तक उपयोगकर्ताओं की ओर से काम करता है तब इसे अपनाएँ।

1. उपयोगकर्ता को `scope=offline` के साथ अनुमति URL पर भेजें:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` भी यही करता है।

2. उपयोगकर्ता पोस्टिंग पहुँच को मंज़ूरी देता है। Hivesigner आपके कॉलबैक पर भेज देता है:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [`state` मिलाएँ](#state)। फिर कोड को तुरंत, अपने सर्वर से, बदल लें।

### कोड बदलें {#exchange-code}

कोड और अपना क्लाइंट सीक्रेट एक POST अनुरोध की बॉडी में `/api/oauth2/token` पर भेजें:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

उत्तर:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

वही कॉल Node.js 18 या उसके बाद के संस्करण में:

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

- कोड और सीक्रेट अनुरोध की बॉडी में रखें, कभी URL में नहीं।
- इस अनुरोध के साथ कोई `Authorization` हेडर न भेजें।
- इसी उत्तर का `username` इस्तेमाल करें। वह उसी कोड से आता है जिस पर उपयोगकर्ता ने हस्ताक्षर किए।
- एक्सेस टोकन और रिफ़्रेश टोकन अपने सर्वर पर रखें।

### रिफ़्रेश {#refresh}

जब एक्सेस टोकन की अवधि खत्म हो जाए, तो रिफ़्रेश टोकन अपने क्लाइंट सीक्रेट के साथ उसी एंडपॉइंट पर भेजें:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

उत्तर का रूप वही रहता है, जिसमें एक नया एक्सेस टोकन और एक नया रिफ़्रेश टोकन होता है। दोनों को पुराने वालों की जगह सहेजें।

## अनुरोध को state से बचाएँ {#state}

`state` के बिना कोई दूसरी साइट आपके उपयोगकर्ता को अपनी मर्ज़ी के टोकन या कोड के साथ आपके कॉलबैक पर भेज सकती है। तब आपका ऐप उपयोगकर्ता को किसी और के खाते में लॉगिन करा देगा। `state` हर वापसी को उसी ब्राउज़र से बाँधता है जिसने लॉगिन शुरू किया था।

1. हर लॉगिन के लिए एक यादृच्छिक मान बनाएँ, कम से कम 16 यादृच्छिक बाइट। हेक्स उसे ऐसे अक्षरों से बचाए रखता है जिनके लिए एन्कोडिंग चाहिए।
2. उसे वहाँ रखें जहाँ सिर्फ़ यही ब्राउज़र उसे दोबारा पेश कर सके: आपके सर्वर का सत्र, या `SameSite=Lax` वाली छोटी अवधि की httpOnly, Secure कुकी।
3. उसे अनुमति URL में `state` के रूप में भेजें।
4. अपने कॉलबैक पर `state` पैरामीटर को सहेजे गए मान से मिलाएँ। अगर वह न हो या अलग हो, तो रुक जाएँ: न टोकन इस्तेमाल करें न कोड।
5. सहेजा गया मान मिटा दें, ताकि हर मान एक ही बार काम करे।

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

Hivesigner वही `state` मान लौटाता है जो उसे मिला था। खाली मान वह छोड़ देता है।

## उपयोगकर्ता क्या देखता है {#what-the-user-sees}

अनुमति वाली स्क्रीन आपके ऐप का चित्र और नाम, «Hive खाता @myapp» और «आपको HOST पर भेजता है» दिखाती है, जिसमें HOST आपके कॉलबैक से लिया जाता है। फिर:

- **पहला पोस्टिंग अनुरोध।** शीर्षक कहता है «APP आपके खाते तक पहुँच का अनुरोध कर रहा है।»। **स्कोप** कार्ड बताता है कि आपका ऐप क्या कर सकेगा। एक सूचना कहती है «पहली बार अनुमति: इससे @myapp ऑन-चेन आपके पोस्टिंग अधिकार में जुड़ जाएगा, और इसके लिए एक बार आपकी सक्रिय कुंजी चाहिए। जब तक आप इसे निरस्त नहीं करते, वह खाता आपकी ओर से पोस्ट कर सकेगा।»। बटन कहता है **अधिकृत करें**। जब उपयोगकर्ता के डिवाइस पर उस खाते की सक्रिय कुंजी न हो, तो स्क्रीन वहीं उसे माँग लेती है।
- **लॉगिन।** `scope=login` के लिए, या उस पोस्टिंग पहुँच के लिए जो उपयोगकर्ता पहले दे चुका है, शीर्षक कहता है «APP में लॉगिन करें» और बटन कहता है **लॉगिन करें**।
- **खाता।** «इस खाते से अधिकृत कर रहे हैं» या «इस खाते से लॉगिन कर रहे हैं», और उसके बाद चुना हुआ खाता। उपयोगकर्ता यहीं खाता बदल सकता है।
- **लॉक किया खाता।** बटन के ऊपर पासकोड का ख़ाना होता है। एक क्लिक खाता खोल देता है और आगे बढ़ जाता है।
- **डिवाइस पर कोई खाता नहीं।** बटन कहता है **जारी रखें**। वह खाता जोड़ने का फ़ॉर्म खोलता है और बाद में अनुरोध पर लौट आता है।

पहले पोस्टिंग अनुरोध के बाद Hivesigner रीडायरेक्ट करने से पहले तब तक रुकता है जब तक नई अनुमति चेन पर दिखने न लगे। इसमें कुछ सेकंड लग सकते हैं। उपयोगकर्ता की ओर से पूरी स्क्रीन देखने के लिए देखें [ऐप्स में लॉगिन](/docs/signing-in)।

## रद्द करना और अस्वीकृत अनुरोध {#cancel}

- **रद्द करना।** उपयोगकर्ता Hivesigner में अपनी खाता सूची पर चला जाता है। आपके कॉलबैक पर कुछ नहीं भेजा जाता: कोई त्रुटि पैरामीटर नहीं होता। अपना लॉगिन बटन उपलब्ध रखें ताकि उपयोगकर्ता फिर से शुरू कर सके। किसी वापसी का इंतज़ार न करें।
- **अस्वीकृत अनुरोध।** ग़ैर-पंजीकृत कॉलबैक, अनजान `client_id` या ग़ायब `redirect_uri` पर Hivesigner एक त्रुटि और **इस समस्या की रिपोर्ट करें** बटन दिखाता है। आपके कॉलबैक पर कुछ नहीं भेजा जाता। देखें [कुछ गड़बड़ होने पर उपयोगकर्ता क्या देखते हैं](/docs/register-app#refused-requests)।

## पुराना लॉगिन-रिक्वेस्ट URL {#legacy-login-request}

Hivesigner अब भी पुराना लॉगिन URL स्वीकार करता है, जो पुरानी इंटीग्रेशन के लिए रखा गया है। नई के लिए `/oauth2/authorize` इस्तेमाल करें।

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

वह वही अनुमति वाली स्क्रीन खोलता है, उन्हीं कॉलबैक जाँचों और उसी रीडायरेक्ट के साथ। पर वह अपने पैरामीटर अलग ढंग से पढ़ता है:

- `scope` या तो `login` होता है या `posting`। कोई और मान, या कोई नहीं, का मतलब है `login`।
- `offline` नहीं पढ़ा जाता। कोड फ़्लो के लिए `response_type=code` जोड़ें।
- `account` नहीं पढ़ा जाता।

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` भी इन्हीं नियमों पर चलता है।
