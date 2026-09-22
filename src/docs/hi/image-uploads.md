Hive की पोस्ट तस्वीरों तक URL से पहुँचती हैं, इसलिए ऐप को उन्हें अपलोड करने के लिए कोई जगह चाहिए। imagehoster, Hive के लिए बनी ओपन सोर्स इमेज होस्टिंग है। यह उन लोगों के अपलोड ले सकता है जिन्होंने Hivesigner से आपके ऐप में लॉगिन किया है: उनका एक्सेस टोकन उनकी कुंजी से किए हस्ताक्षर की जगह ले लेता है।

## यह कैसे काम करता है {#how-it-works}

1. उपयोगकर्ता पोस्टिंग पहुँच के साथ Hivesigner से आपके ऐप में लॉगिन करता है। आपके ऐप को एक एक्सेस टोकन मिलता है। देखें [OAuth2 से लॉगिन](/docs/oauth2)।
2. आपका ऐप उस टोकन को URL में रखकर तस्वीर आपके imagehoster को भेजता है।
3. imagehoster टोकन और खाता जाँचता है, तस्वीर सहेजता है और उसका URL लौटाता है।
4. आपका ऐप वह URL पोस्ट में रख देता है।

## अपना imagehoster चलाएँ {#run-your-own}

हर imagehoster एक ही ऐप खाते के लिए सेट होता है: उसकी कॉन्फ़िगरेशन के `[upload_limits]` भाग में `app_account`। उसे उसी ऐप खाते के लिए बने टोकन भेजें। सार्वजनिक इंस्टेंस दूसरे ऐप्स के हैं: images.ecency.com, Ecency के ऐप खाते के लिए सेट है और images.hive.blog, Hive.blog के लिए। अपने उपयोगकर्ताओं के अपलोड लेने के लिए अपने ऐप खाते के साथ अपना इंस्टेंस चलाएँ।

स्रोत कोड और सेटअप गाइड:

- Hive समुदाय का imagehoster: https://gitlab.syncad.com/hive/imagehoster
- Ecency का imagehoster: https://github.com/ecency/imagehoster

कॉन्फ़िगरेशन में अपना ऐप खाता डालें:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

वही भाग अपलोड के लिए ज़रूरी न्यूनतम प्रतिष्ठा (`reputation`) और हर खाते का अपलोड कोटा (`duration` मिलीसेकंड में `max` अपलोड) तय करता है। कोटा असल में लागू हो, इसके लिए `redis_url` सेट करें। `max_image_size` सबसे बड़ी फ़ाइल तय करता है, बाइट में।

## एक तस्वीर अपलोड करें {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **टोकन।** उपयोगकर्ता का एक्सेस टोकन पथ में रखें, ठीक वैसे ही जैसे Hivesigner ने आपके ऐप को दिया था। अपने ऐप के लिए पोस्टिंग पहुँच वाले लॉगिन से मिला टोकन इस्तेमाल करें। सिर्फ़ लॉगिन वाला टोकन, जो बिना `client_id` के अनुरोध से आता है, किसी ऐप का नाम नहीं रखता और अस्वीकार कर दिया जाता है।
- **बॉडी।** एक तस्वीर फ़ाइल के साथ `multipart/form-data` भेजें। imagehoster पहली फ़ाइल लेता है, उसके फ़ील्ड का नाम चाहे जो हो।
- **आकार।** `Content-Length` हेडर भेजें। फ़ाइल उस इंस्टेंस के `max_image_size` से बड़ी नहीं होनी चाहिए।

उत्तर JSON होता है। सफल होने पर उसमें तस्वीर का URL होता है:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

विफल होने पर imagehoster एक HTTP त्रुटि स्थिति लौटाता है। ज़्यादातर विफलताओं में त्रुटि का नाम भी होता है:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **ध्यान दें:** टोकन URL में ही चलता है। अपना imagehoster सिर्फ़ https पर दें और उसके एक्सेस लॉग निजी रखें।

## उदाहरण {#example}

यह ब्राउज़र फ़ंक्शन किसी फ़ाइल इनपुट या ड्रॉप से फ़ाइल अपलोड करता है। ब्राउज़र आपकी ओर से मल्टीपार्ट हेडर और लंबाई सेट कर देता है: `Content-Type` खुद तय न करें।

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
