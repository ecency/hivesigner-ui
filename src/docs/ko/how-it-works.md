Hivesigner를 쓰면 사람들이 앱에 자신의 키를 주지 않고도 Hive 계정을 그 앱에서 쓸 수 있습니다. Hivesigner는 두 부분으로 되어 있습니다. https://hivesigner.com 의 브라우저 서명 화면과 `https://hivesigner.com/api/` 의 API입니다. 이 문서는 각 부분이 하는 일과 앱이 그것을 쓰는 두 가지 방법을 설명합니다.

## 브라우저 서명 화면 {#browser-signer}

브라우저 서명 화면은 Hivesigner 웹사이트 자체입니다. 사람들은 거기에 자신의 Hive 계정을 추가합니다. 키는 각자의 브라우저 안에 남습니다. Hivesigner는 어떤 서버에도 키를 보내지 않습니다. 여러분의 앱이 키를 보는 일도 없습니다.

서명 화면은 세 가지에 서명하며, 언제나 사용자가 무엇에 서명하는지 본 뒤에 서명합니다.

- **로그인 토큰.** 여러분의 앱은 로그인을 위해 사용자를 Hivesigner로 보냅니다. Hivesigner는 앱의 이름과 요청 내용을 보여 줍니다. 사용자가 승인하면 Hivesigner는 그 사용자의 키로, 사용자의 계정과 여러분의 앱을 적은 짧은 진술에 서명합니다. 그 서명된 진술이 여러분의 앱이 받는 토큰입니다. [OAuth2로 로그인](/docs/oauth2)과 [토큰](/docs/tokens)을 보세요.
- **거래.** 서명 링크는 확인할 거래를 엽니다. 사용자가 승인하면 Hivesigner가 필요한 키로 서명합니다. 그다음 브라우저에서 Hive 네트워크로 보냅니다. 링크가 서명만 요청한 경우에는 보내지 않습니다. [서명 링크](/docs/sign-links)를 보세요.
- **메시지.** 여러분의 앱은 사용자가 그 계정을 관리한다는 것을 증명하도록, 자신의 키로 텍스트에 서명해 달라고 요청할 수 있습니다. [메시지 서명](/docs/message-signing)을 보세요.

## API {#api}

API는 여러분의 앱에 로그인한 사용자를 대신해 게시 관련 작업을 브로드캐스트합니다. 글과 댓글, 투표, 팔로우를 비롯한 `custom_json` 작업, 보상 수령, 프로필 수정입니다. 여러분의 앱은 작업을 사용자의 토큰과 함께 보냅니다. API는 토큰을 확인하고, @hivesigner 계정의 게시 키로 거래에 서명한 뒤 Hive에 브로드캐스트합니다.

API는 로그인한 사용자의 계정도 돌려주고, 코드를 토큰으로 바꾸며, Hivesigner를 쓰는 앱 목록도 제공합니다. [REST API](/docs/api)를 보세요.

## 게시 권한의 연결 고리 {#authority-chain}

Hive에서는 한 계정이 다른 계정에 자신의 게시 권한으로 행동하도록 허용할 수 있습니다. API는 이런 허용 두 가지에 기대고 있습니다.

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **사용자가 자신의 게시 권한에 여러분의 앱 계정을 추가합니다.** 사용자가 여러분의 앱에 게시 접근을 처음 승인할 때 동의 화면이 이 일을 합니다. 이때 사용자의 활성 키가 한 번 필요합니다.
2. **여러분의 앱 계정이 자신의 게시 권한에 @hivesigner를 추가합니다.** 이것은 [앱을 등록할 때](/docs/register-app#grant-hivesigner) 한 번만 하면 됩니다.

브로드캐스트하기 전에 API는 두 허용이 모두 있는지 확인합니다. 토큰이 가리키는 사용자가 작성한 작업만 브로드캐스트합니다.

사용자는 https://hivesigner.com/authorized-apps 에서 언제든지 여러분 앱의 접근을 없앨 수 있습니다. 그 뒤로 API는 여러분의 앱을 통해 그 사용자를 대신해 게시할 수 없습니다.

## 통합하는 두 가지 방법 {#two-ways-to-integrate}

### 로그인한 뒤 API로 브로드캐스트하기 {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

사용자는 한 번만 승인합니다. 그 뒤로는 토큰이 만료되거나 사용자가 접근을 없앨 때까지, 여러분의 앱은 다시 묻지 않고 투표, 댓글, 게시를 할 수 있습니다. 일상적인 소셜 동작에는 이 방법을 쓰세요.

콜백을 등록한 앱 계정과 @hivesigner에 대한 허용이 필요합니다. [앱 등록하기](/docs/register-app)를 보세요. 사용자가 누구인지만 알면 된다면 [게시 접근 없는 로그인](/docs/login-only)을 보세요.

### 서명 링크 {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

사용자는 서명되기 전에 모든 거래를 봅니다. 서명 링크는 Hive의 41가지 작업을 다루며, 송금을 비롯해 활성 키가 필요한 지갑 동작도 들어 있습니다. API는 그런 작업을 절대 다루지 않습니다. 서명 링크에는 앱 계정이 필요 없습니다. [서명 링크](/docs/sign-links)를 보세요.

### 무엇을 고를까 {#which-to-choose}

- **자주 일어나는 게시 동작**(투표, 댓글, 팔로우): OAuth2로 로그인시킨 다음 API를 쓰세요.
- **지갑 동작**, 또는 활성 키가 필요한 모든 것: 서명 링크를 쓰세요.
- **둘 다**: 많은 앱이 소셜 기능에는 OAuth2 로그인을, 송금에는 서명 링크를 씁니다.
- **사용자가 누구인지만**: [게시 접근 없는 로그인](/docs/login-only)을 보세요.

## 소스 코드 {#source-code}

Hivesigner는 오픈 소스입니다.

- 브라우저 서명 화면: https://github.com/ecency/hivesigner-ui
- API: https://github.com/ecency/hivesigner-api
- JavaScript SDK(npm 패키지 `hivesigner`): https://github.com/ecency/hivesigner-sdk. [SDK](/docs/sdk)를 보세요.
