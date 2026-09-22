Hivesigner लोगों को अपनी कुंजियाँ आपके ऐप को दिए बिना उसमें अपना Hive खाता इस्तेमाल करने देता है। इसके दो हिस्से हैं: https://hivesigner.com पर ब्राउज़र साइनर और `https://hivesigner.com/api/` पर एक API। यह पन्ना बताता है कि हर हिस्सा क्या करता है और कोई ऐप उन्हें किन दो तरीकों से इस्तेमाल करता है।

## ब्राउज़र साइनर {#browser-signer}

ब्राउज़र साइनर ही Hivesigner की वेबसाइट है। लोग वहाँ अपने Hive खाते जोड़ते हैं। उनकी कुंजियाँ उनके अपने ब्राउज़र में ही रहती हैं: Hivesigner किसी सर्वर को कोई कुंजी नहीं भेजता। आपका ऐप कभी कोई कुंजी नहीं देखता।

साइनर तीन तरह की चीज़ों पर हस्ताक्षर करता है, और हर बार तब, जब उपयोगकर्ता देख चुका होता है कि वह किस पर हस्ताक्षर कर रहा है:

- **लॉगिन टोकन।** आपका ऐप किसी को लॉगिन के लिए Hivesigner पर भेजता है। Hivesigner आपके ऐप का नाम और वह जो माँग रहा है दिखाता है। जब उपयोगकर्ता मंज़ूरी देता है, Hivesigner उसकी कुंजी से एक छोटा कथन साइन करता है जिसमें उसका खाता और आपका ऐप दर्ज होता है। वही साइन किया हुआ कथन वह टोकन है जो आपके ऐप को मिलता है। देखें [OAuth2 से लॉगिन](/docs/oauth2) और [टोकन](/docs/tokens)।
- **लेन-देन।** एक साइन लिंक समीक्षा के लिए एक लेन-देन खोलता है। जब उपयोगकर्ता मंज़ूरी देता है, Hivesigner उसे ज़रूरी कुंजी से साइन करता है। फिर उसे ब्राउज़र से ही Hive नेटवर्क पर भेज देता है, बशर्ते लिंक सिर्फ़ हस्ताक्षर ही न माँगे। देखें [साइन लिंक](/docs/sign-links)।
- **संदेश।** आपका ऐप किसी उपयोगकर्ता से कह सकता है कि वह अपनी कुंजी से कोई पाठ साइन करे, यह साबित करने के लिए कि खाता उसी के नियंत्रण में है। देखें [संदेश पर हस्ताक्षर](/docs/message-signing)।

## API {#api}

API उस उपयोगकर्ता की ओर से पोस्टिंग ऑपरेशन प्रसारित करता है जिसने आपके ऐप में लॉगिन किया है: पोस्ट और टिप्पणियाँ, वोट, फ़ॉलो और दूसरे `custom_json` ऑपरेशन, इनाम लेना और प्रोफ़ाइल बदलना। आपका ऐप ऑपरेशन उपयोगकर्ता के टोकन के साथ भेजता है। API टोकन जाँचता है, लेन-देन को @hivesigner खाते की पोस्टिंग कुंजी से साइन करता है और उसे Hive पर प्रसारित कर देता है।

API लॉगिन किए उपयोगकर्ता का खाता भी लौटाता है, कोड के बदले टोकन देता है और Hivesigner इस्तेमाल करने वाले ऐप्स की सूची देता है। देखें [REST API](/docs/api)।

## पोस्टिंग अधिकार की शृंखला {#authority-chain}

Hive पर एक खाता दूसरे खाते को अपने पोस्टिंग अधिकार से काम करने दे सकता है। API ऐसी दो अनुमतियों पर टिका है:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **उपयोगकर्ता आपके ऐप खाते को अपने पोस्टिंग अधिकार में जोड़ता है।** जब कोई उपयोगकर्ता पहली बार आपके ऐप के लिए पोस्टिंग पहुँच को मंज़ूरी देता है, तब अनुमति वाली स्क्रीन यही करती है। इसके लिए एक बार उपयोगकर्ता की सक्रिय कुंजी चाहिए।
2. **आपका ऐप खाता @hivesigner को अपने पोस्टिंग अधिकार में जोड़ता है।** यह आप एक बार करते हैं, जब [अपना ऐप पंजीकृत करते हैं](/docs/register-app#grant-hivesigner)।

प्रसारण से पहले API जाँचता है कि दोनों अनुमतियाँ मौजूद हैं। वह सिर्फ़ वही ऑपरेशन प्रसारित करता है जिनका लेखक टोकन में दर्ज उपयोगकर्ता हो।

उपयोगकर्ता किसी भी समय https://hivesigner.com/authorized-apps पर आपके ऐप की पहुँच हटा सकता है। उसके बाद API आपके ऐप के ज़रिए उसकी ओर से पोस्ट नहीं कर सकता।

## जोड़ने के दो तरीके {#two-ways-to-integrate}

### लॉगिन, फिर API से प्रसारण {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

उपयोगकर्ता एक बार मंज़ूरी देता है। उसके बाद आपका ऐप बिना दोबारा पूछे उसकी ओर से वोट, टिप्पणी और पोस्ट कर सकता है, जब तक टोकन की अवधि खत्म न हो या उपयोगकर्ता आपके ऐप की पहुँच न हटा दे। रोज़मर्रा के सामाजिक कामों के लिए यही तरीका अपनाएँ।

आपको पंजीकृत कॉलबैक वाला एक ऐप खाता और @hivesigner की अनुमति चाहिए। देखें [अपना ऐप पंजीकृत करें](/docs/register-app)। अगर आप सिर्फ़ यह जानना चाहते हैं कि उपयोगकर्ता कौन है, तो देखें [पोस्टिंग पहुँच के बिना लॉगिन](/docs/login-only)।

### साइन लिंक {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

उपयोगकर्ता हर लेन-देन को साइन होने से पहले देखता है। साइन लिंक Hive के 41 ऑपरेशन कवर करते हैं, जिनमें ट्रांसफ़र और दूसरे वॉलेट काम शामिल हैं जिनके लिए सक्रिय कुंजी चाहिए। API उन्हें कभी नहीं संभालता। साइन लिंक के लिए आपको ऐप खाते की ज़रूरत नहीं। देखें [साइन लिंक](/docs/sign-links)।

### कौन-सा चुनें {#which-to-choose}

- **बार-बार होने वाले पोस्टिंग काम** (वोट, टिप्पणी, फ़ॉलो): OAuth2 से लॉगिन कराएँ और फिर API इस्तेमाल करें।
- **वॉलेट के काम**, या कुछ भी जिसके लिए सक्रिय कुंजी चाहिए: साइन लिंक इस्तेमाल करें।
- **दोनों**: बहुत से ऐप सामाजिक सुविधाओं के लिए OAuth2 से लॉगिन कराते हैं और ट्रांसफ़र के लिए साइन लिंक इस्तेमाल करते हैं।
- **सिर्फ़ उपयोगकर्ता की पहचान**: देखें [पोस्टिंग पहुँच के बिना लॉगिन](/docs/login-only)।

## स्रोत कोड {#source-code}

Hivesigner ओपन सोर्स है:

- ब्राउज़र साइनर: https://github.com/ecency/hivesigner-ui
- API: https://github.com/ecency/hivesigner-api
- JavaScript SDK (npm पैकेज `hivesigner`): https://github.com/ecency/hivesigner-sdk। देखें [SDK](/docs/sdk)।
