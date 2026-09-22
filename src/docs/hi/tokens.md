Hivesigner का टोकन एक छोटा साइन किया हुआ कथन है। उसमें एक Hive खाता, वह ऐप जिसके लिए वह बना और साइन होने का समय दर्ज होता है। आपका सर्वर टोकन को API से या खुद जाँच सकता है। यह पन्ना बताता है कि टोकन में क्या होता है, वह कितने समय चलता है और उसे जाँचने के दोनों तरीके।

## टोकन कैसा दिखता है {#format}

टोकन base64url में एन्कोड किया हुआ एक JSON ऑब्जेक्ट है, और मानक base64url से उसमें एक फ़र्क़ है: पैडिंग में `=` की जगह `.` आता है। यानी सादे base64 की तुलना में `+` बन जाता है `-`, `/` बन जाता है `_` और `=` बन जाता है `.`। हर टोकन `eyJzaWduZWRfbWVzc2FnZSI6` से शुरू होता है।

डिकोड करने पर टोकन फ़्लो का एक्सेस टोकन ऐसा दिखता है:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| फ़ील्ड | अर्थ |
| --- | --- |
| `signed_message.type` | टोकन क्या है: `login`, `posting`, `code` या `refresh`। देखें [टोकन के प्रकार](#kinds)। |
| `signed_message.app` | वह ऐप खाता जिसके लिए टोकन बना। ऐप खाते के बिना साइट के लॉगिन टोकन में कोई नहीं होता। |
| `authors[0]` | वह Hive खाता जिसके लिए टोकन है। |
| `timestamp` | कब साइन हुआ, 1970-01-01 UTC से सेकंड में। |
| `signatures[0]` | हस्ताक्षर, हेक्स स्ट्रिंग के रूप में। |
| `authority` | सिर्फ़ ब्राउज़र में साइन हुए टोकनों में: उपयोगकर्ता की किस कुंजी ने साइन किया, `posting` या `active`। यह फ़ील्ड साइन किए डेटा से बाहर है। किस कुंजी ने साइन किया यह जानने के लिए उसे हस्ताक्षर से निकालें। |

हस्ताक्षर `JSON.stringify({ signed_message, authors, timestamp })` के sha256 हैश पर किया गया secp256k1 हस्ताक्षर है, कुंजियाँ उसी क्रम में।

### टोकन डिकोड करें {#decode}

Node.js में:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

ब्राउज़र में:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

डिकोड करना जाँचना नहीं है। कोई भी ऐसी स्ट्रिंग बना सकता है जो इसी रूप में डिकोड हो। भरोसा करने से पहले [टोकन जाँचें](#check-a-token)।

## टोकन के प्रकार {#kinds}

| टोकन | `type` | `app` | किसने साइन किया | कहाँ से मिलता है |
| --- | --- | --- | --- | --- |
| एक्सेस टोकन, टोकन फ़्लो | `posting` | आपका ऐप | उपयोगकर्ता की पोस्टिंग कुंजी, या उसकी सक्रिय कुंजी जब Hivesigner के पास उस खाते की पोस्टिंग कुंजी न हो | आपके कॉलबैक पर `access_token` |
| लॉगिन टोकन, `scope=login` | `login` | आपका ऐप | उपयोगकर्ता की पोस्टिंग या सक्रिय कुंजी | आपके कॉलबैक पर `access_token` |
| लॉगिन टोकन, ऐप खाते के बिना साइट | `login` | कोई नहीं | उपयोगकर्ता की पोस्टिंग या सक्रिय कुंजी | आपके कॉलबैक पर `access_token` |
| कोड | `code` | आपका ऐप | उपयोगकर्ता की पोस्टिंग या सक्रिय कुंजी | आपके कॉलबैक पर `code` |
| एक्सेस टोकन, कोड फ़्लो | `posting` | आपका ऐप | @hivesigner की पोस्टिंग कुंजी | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| रिफ़्रेश टोकन | `refresh` | आपका ऐप | @hivesigner की पोस्टिंग कुंजी | [`/api/oauth2/token`](/docs/api#oauth2-token) |

कोड और रिफ़्रेश टोकन एक्सेस टोकन नहीं हैं। इनमें से किसी को भी कभी लॉगिन के रूप में स्वीकार न करें।

## टोकन कितने समय चलता है {#lifetime}

एक्सेस टोकन 7 दिन चलता है: `expires_in` 604800 सेकंड है, उसके `timestamp` से गिना जाता है। अवधि खत्म होने पर:

- **टोकन फ़्लो:** उपयोगकर्ता को दोबारा लॉगिन के लिए भेजें। जिसने पहले ही आपके ऐप को अनुमति दी है उसे «APP में लॉगिन करें» दिखता है और एक क्लिक काफ़ी है।
- **कोड फ़्लो:** आपका सर्वर रिफ़्रेश टोकन और अपने क्लाइंट सीक्रेट से नया एक्सेस टोकन ले लेता है। देखें [रिफ़्रेश](/docs/oauth2#refresh)।

जैसे ही टोकन का `timestamp` 7 दिन से पुराना हो, उसे समाप्त मानें। रीडायरेक्ट के ठीक बाद जो जाँचते हैं उसके लिए बहुत कम उम्र स्वीकार करें। कोड तुरंत बदलें। लॉगिन टोकन सिर्फ़ उसके `timestamp` के कुछ मिनटों के भीतर स्वीकार करें।

## अपने सर्वर पर टोकन जाँचें {#check-a-token}

आपका सर्वर किसी ब्राउज़र या ऐप के भेजे टोकन पर भरोसा करे, उससे पहले जाँचें कि:

- खाते या @hivesigner ने ही उसे साइन किया है;
- वह आपके ऐप के लिए बना है;
- वह उसी प्रकार का टोकन है जिसकी आप उम्मीद करते हैं;
- वह पर्याप्त ताज़ा है।

### API से पूछें {#check-with-the-api}

टोकन के साथ `/api/me` बुलाएँ। वैध टोकन `user` में खाता लौटाता है:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

अवैध टोकन `invalid_grant` के साथ `401` लौटाता है। देखें [GET /api/me](/docs/api#me)।

`/api/me` हस्ताक्षर की पुष्टि करता है। उसका उत्तर यह नहीं बताता कि टोकन किस ऐप के लिए बना था। इसलिए टोकन डिकोड भी करें और उसके `app`, `type` तथा उम्र खुद जाँचें। दूसरे ऐप के लिए बना टोकन आपके ऐप में किसी को लॉगिन न कराए।

```js
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// type: 'posting' for an access token, 'login' for a scope=login sign-in.
export async function hivesignerUser(token, { app, type }) {
  const res = await fetch('https://hivesigner.com/api/me', {
    headers: { Authorization: token },
  });
  if (!res.ok) return null;
  const me = await res.json();

  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, timestamp } = body ?? {};
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!(age >= -60 && age <= WEEK)) return null;
  return me.user;
}
```

API सिर्फ़ वही टोकन लेता है जिनमें किसी ऐप का नाम हो। ऐप खाते के बिना साइट के लॉगिन टोकन को [खुद](#check-it-yourself) जाँचें।

### खुद जाँचें {#check-it-yourself}

1. टोकन डिकोड करें।
2. जाँचें कि `signed_message.type` वही प्रकार है जिसकी आप उम्मीद करते हैं: एक्सेस टोकन के लिए `posting`, लॉगिन टोकन के लिए `login`।
3. जाँचें कि `signed_message.app` आपका ऐप खाता है। ऐप खाते के बिना साइट के लिए जाँचें कि कोई है ही नहीं।
4. `timestamp` से उम्र जाँचें।
5. `JSON.stringify({ signed_message, authors, timestamp })` का sha256 हैश निकालें।
6. `signatures[0]` और उसी हैश से सार्वजनिक कुंजी निकालें।
7. `authors[0]` खाते को अभी Hive ब्लॉकचेन से पढ़ें, क्योंकि उपयोगकर्ता अपनी कुंजियाँ बदल सकते हैं। निकाली हुई कुंजी उसकी मौजूदा पोस्टिंग या सक्रिय कुंजियों में से एक होनी चाहिए। `/api/oauth2/token` से आया टोकन @hivesigner साइन करता है: उनके लिए @hivesigner खाते की मौजूदा पोस्टिंग कुंजी स्वीकार करें।

Node.js में [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk) के साथ, जो `@ecency/sdk/hive` के नीचे `PrivateKey`, `PublicKey`, `Signature` और `callRPC` देता है:

```js
import { createHash } from 'node:crypto';
import { Signature, callRPC } from '@ecency/sdk/hive';
import { decodeToken } from './decode-token.js';

const WEEK = 7 * 24 * 60 * 60;

// Returns the Hive username the token is for, or null.
export async function verifyHivesignerToken(token, { type, app, maxAge = WEEK }) {
  let body;
  try {
    body = decodeToken(token);
  } catch {
    return null;
  }
  const { signed_message, authors, timestamp, signatures } = body ?? {};

  // What the token is and who it is for.
  if (signed_message?.type !== type || signed_message.app !== app) return null;
  const username = Array.isArray(authors) ? authors[0] : undefined;
  if (typeof username !== 'string' || !Array.isArray(signatures)) return null;

  // How old it is, allowing one minute of clock difference.
  const age = Math.floor(Date.now() / 1000) - timestamp;
  if (!Number.isInteger(timestamp) || age < -60 || age > maxAge) return null;

  // Which key signed it.
  const digest = createHash('sha256')
    .update(JSON.stringify({ signed_message, authors, timestamp }))
    .digest();
  let signer;
  try {
    signer = Signature.from(signatures[0]).getPublicKey(digest).toString();
  } catch {
    return null;
  }

  // Whether that key belongs to the account now.
  const accounts = await callRPC('condenser_api.get_accounts', [[username, 'hivesigner']]);
  const user = accounts.find((a) => a.name === username);
  if (!user) return null;
  const keys = [...user.posting.key_auths, ...user.active.key_auths];
  if (type === 'posting') {
    // Access tokens from /api/oauth2/token are signed by @hivesigner.
    const hivesigner = accounts.find((a) => a.name === 'hivesigner');
    keys.push(...(hivesigner?.posting.key_auths ?? []));
  }
  return keys.some(([key]) => key === signer) ? username : null;
}
```

इसे ऐसे इस्तेमाल करें:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

dhive लाइब्रेरी (`@hiveio/dhive`) भी चलती है: हैश `cryptoUtils.sha256(message)` से निकालें और कुंजी `Signature.fromString(signatures[0]).recover(digest).toString()` से।

## टोकन सुरक्षित रखें {#keep-tokens-safe}

जिसके पास पोस्टिंग टोकन है वह उसकी अवधि खत्म होने तक आपके ऐप के ज़रिए उपयोगकर्ता की ओर से प्रसारण कर सकता है। उसे पासवर्ड की तरह ही समझें।

- **टोकन अपने सर्वर पर रखें,** या किसी httpOnly, Secure कुकी में। रिफ़्रेश टोकन और अपना क्लाइंट सीक्रेट सिर्फ़ सर्वर पर रखें।
- **जिस URL को आप लॉग करते हैं उसमें कभी टोकन न डालें।** टोकन फ़्लो टोकन को आपके कॉलबैक की क्वेरी स्ट्रिंग में पहुँचाता है। उसे सर्वर पर पढ़ें, फिर बिना टोकन वाले URL पर भेज दें। कॉलबैक की क्वेरी स्ट्रिंग अपने लॉग से बाहर रखें।
- **अपने कॉलबैक पन्ने पर दूसरी साइटों से कुछ न लादें,** ताकि टोकन वाला पता उन तक न पहुँचे। उस पन्ने पर `Referrer-Policy: no-referrer` हेडर मदद करता है।
- **टोकन सिर्फ़ अपने सर्वर पर और `https://hivesigner.com/api/` पर भेजें।**

## लॉगआउट और पहुँच हटाना {#sign-out}

- **किसी उपयोगकर्ता को लॉगआउट कराना** का मतलब है टोकन छोड़ देना: उसे अपने सत्र या कुकी से मिटा दें। Hivesigner को यह बताने के लिए कि उपयोगकर्ता लॉगआउट कर चुका है, आप [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) भी बुला सकते हैं। आपका ऐप फिर भी टोकन खुद छोड़ देता है।
- **आपके ऐप की पहुँच हमेशा के लिए काटना** उपयोगकर्ता का फ़ैसला है। https://hivesigner.com/authorized-apps पर, या `https://hivesigner.com/revoke/APP` पर, वह आपके ऐप खाते को ऑन-चेन अपने पोस्टिंग अधिकार से हटा देता है। उसके बाद API आपके ऐप के ज़रिए उसकी ओर से प्रसारण नहीं करता।
