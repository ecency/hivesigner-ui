आधिकारिक JavaScript SDK लॉगिन URL और साइन लिंक बनाता है और आपकी ओर से Hivesigner API बुलाता है। Python के लिए समुदाय की लाइब्रेरियाँ हैं। कोई भी दूसरी भाषा सीधे [REST API](/docs/api) बुला सकती है।

## JavaScript SDK {#javascript}

SDK, `hivesigner` नाम का npm पैकेज है। उसका स्रोत https://github.com/ecency/hivesigner-sdk पर है। वह TypeScript में लिखा है और अपने टाइप साथ लाता है।

संस्करण 4 के लिए Node.js 18 या उसके बाद का चाहिए, क्योंकि वह भीतर बने `fetch` का इस्तेमाल करता है। ब्राउज़रों में उसे ES2017 या उसके बाद का चाहिए। जहाँ वैश्विक `fetch` न हो, वहाँ SDK इस्तेमाल करने से पहले कोई polyfill जोड़ें। पुराने Node.js पर संस्करण 3 पर ही रहें।

### इंस्टॉल {#install}

```bash
npm install hivesigner
```

बिना बिल्ड चरण वाले पन्ने के लिए ब्राउज़र बंडल लोड करें। वह एक वैश्विक `hivesigner` बनाता है:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### क्लाइंट बनाएँ {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| विकल्प | अर्थ |
| --- | --- |
| `app` | आपका ऐप खाता, जो `client_id` के रूप में भेजा जाता है। |
| `callbackURL` | Hivesigner उपयोगकर्ता को कहाँ लौटाएगा। यह आपके ऐप के कॉलबैक में से एक होना चाहिए, अक्षर दर अक्षर (सादे http वाला लूपबैक कॉलबैक होस्ट और पोर्ट में अलग हो सकता है, देखें [कॉलबैक](/docs/register-app#callback-rules))। |
| `scope` | एक सूची, जो अल्पविराम से जुड़कर `scope` पैरामीटर बनती है। देखें [स्कोप](/docs/oauth2#scopes)। |
| `responseType` | कोड फ़्लो के लिए `'code'`। टोकन फ़्लो के लिए इसे छोड़ दें। |
| `accessToken` | उपयोगकर्ता का एक्सेस टोकन, जब आपके पास पहले से हो। |
| `apiURL` | API का ऑरिजिन। SDK उसमें `/api/` जोड़ देता है। डिफ़ॉल्ट `https://hivesigner.com` है। |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` और `setApiURL` क्लाइंट को बाद में बदलते हैं। हर एक क्लाइंट लौटाता है।

### उपयोगकर्ता को लॉगिन कराएँ {#sign-in}

`getLoginURL(state, account)` लॉगिन URL लौटाता है:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` आपके कॉलबैक पर बिना बदले लौट आता है। उत्तर को अनुरोध से बाँधने के लिए उसका इस्तेमाल करें।
- `account` वैकल्पिक है: कोई उपयोगकर्ता नाम। वह खाता डिवाइस पर हो तो Hivesigner उसे चुन लेता है, वरना अनदेखा कर देता है।

ब्राउज़र में `client.login({ state: 'STATE' })` उपयोगकर्ता को उसी URL पर भेजता है, बिना खाते के।

टोकन फ़्लो में आपके कॉलबैक को `access_token`, `expires_in` और `username` मिलते हैं। टोकन क्लाइंट को दें:

```js
client.setAccessToken('ACCESS_TOKEN');
```

कोड फ़्लो के आदान-प्रदान के लिए SDK में कोई मेथड नहीं है। आपका सर्वर कोड और क्लाइंट सीक्रेट ख़ुद API को भेजता है, जैसा [कोड बदलें](/docs/oauth2#exchange-code) दिखाता है।

### उपयोगकर्ता लें {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` उपयोगकर्ता का Hive खाता है, जैसा चेन लौटाती है। `scope` बताता है कि टोकन किसकी इजाज़त देता है।

### प्रसारण {#broadcast}

`broadcast(operations)` ऑपरेशन API को भेजता है, जो उन्हें उपयोगकर्ता की ओर से प्रसारित करता है। API सिर्फ़ वही पोस्टिंग ऑपरेशन लेता है जिनका लेखक टोकन वाला उपयोगकर्ता हो: `vote`, `comment`, `delete_comment`, `comment_options`, पोस्टिंग अधिकार वाला `custom_json`, `claim_reward_balance` और प्रोफ़ाइल मेटाडेटा के लिए `account_update2`। देखें [broadcast क्या स्वीकार करता है](/docs/api#broadcast-rules)।

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

हर ऑपरेशन में उपयोगकर्ता का नाम दें। API `__signer` नहीं बदलता।

ये सहायक मेथड एक-एक ऑपरेशन बनाते हैं और `broadcast` बुलाते हैं:

| मेथड | क्या प्रसारित करता है |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`। `weight` `-10000` से `10000` (100%) तक चलता है। |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`। नई पोस्ट के लिए `parentAuthor` `''` होता है। `jsonMetadata` ऑब्जेक्ट हो सकता है: SDK उसे स्ट्रिंग बना देता है। |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`। `requiredAuths` के रूप में `[]` और `requiredPostingAuths` के रूप में `['USERNAME']` दें। `json` एक स्ट्रिंग है। |
| `reblog(account, author, permlink)` | `follow` आईडी वाला `custom_json`, जो पोस्ट दोबारा साझा करता है |
| `follow(follower, following)` | `follow` आईडी वाला `custom_json`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `follow` आईडी वाला `custom_json`, `what: []` |
| `ignore(follower, following)` | `follow` आईडी वाला `custom_json`, `what: ['ignore']` (म्यूट) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`। रकम `'0.000 HIVE'`, `'0.000 HBD'` और `'1.000000 VESTS'` जैसी स्ट्रिंग होती हैं। |

`updateUserMetadata()` अब चलन से बाहर है। किसी उपयोगकर्ता की प्रोफ़ाइल बदलने के लिए नए `posting_json_metadata` के साथ `account_update2` प्रसारित करें।

### लॉगआउट {#log-out}

`revokeToken()` SDK का लॉगआउट कॉल है। वह टोकन को API के रद्द करने वाले एंडपॉइंट पर भेजता है और फिर उसे क्लाइंट से हटा देता है। जब कॉल विफल हो, तो `removeAccessToken()` खुद बुलाएँ। आपका ऐप जहाँ भी टोकन रख रहा हो, वहाँ से भी मिटा दें।

आपके ऐप की पहुँच हमेशा के लिए खत्म करने के लिए उपयोगकर्ता उसे https://hivesigner.com/authorized-apps पर हटाता है। देखें [किसी ऐप की पहुँच देखना और हटाना](/docs/signing-in#remove-access)।

### साइन लिंक {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` और `sendTransaction(tx, params)` एक `https://hivesigner.com/sign/...` लिंक लौटाते हैं। `params` `callback`, `no_broadcast` और `signer` लेता है। देखें [साइन लिंक](/docs/sign-links)।

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

TypeScript में टाइप तीसरा आर्गुमेंट माँगते हैं: लिंक वापस पाने के लिए `undefined` दें।

ब्राउज़र में तीसरे आर्गुमेंट के रूप में फ़ंक्शन दें ताकि लिंक नए टैब में खुले। वह फ़ंक्शन बुलाया नहीं जाता और कुछ लौटता नहीं। उसे किसी क्लिक हैंडलर से बुलाएँ, वरना ब्राउज़र नया टैब रोक सकता है और कॉल त्रुटि दे सकता है।

### प्रॉमिस और कॉलबैक {#promises-and-callbacks}

`me`, `broadcast`, सहायक मेथड और `revokeToken` एक प्रॉमिस लौटाते हैं। इसके बजाय कॉलबैक इस्तेमाल करने के लिए आख़िरी आर्गुमेंट के रूप में एक फ़ंक्शन दें। उसे `(error, result)` मिलता है।

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

जब API त्रुटि के साथ उत्तर देता है, तो प्रॉमिस API की त्रुटि बॉडी के साथ विफल होता है, `{ error, error_description }`। कॉलबैक के साथ वही बॉडी `error` आर्गुमेंट होती है। जब उत्तर JSON न हो, तो वह पार्स त्रुटि के साथ विफल होता है।

## Python {#python}

ये लाइब्रेरियाँ समुदाय से आती हैं। इन्हें इनके लेखक संभालते हैं, Hivesigner की टीम नहीं। इन पर भरोसा करने से पहले इन्हें [REST API](/docs/api) से मिलाकर देखें।

| लाइब्रेरी | लेखक |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, मॉड्यूल `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
