자주 묻는 질문에 대한 짧은 답변입니다. 각 답변은 자세한 내용이 있는 페이지로 연결됩니다.

## Hivesigner 사용하기 {#using-hivesigner}

### Hivesigner는 무료인가요? {#is-it-free}

네. Hivesigner는 사용자에게도 앱에게도 비용을 받지 않습니다. 소스 코드는 MIT 라이선스로 공개되어 있습니다.

### Hivesigner가 제 키를 볼 수 있나요? {#keys}

아니요. 키는 회원님의 기기에 있는 브라우저 안에 남고, Hivesigner는 그곳에서 서명합니다. 키는 Hivesigner의 서버로도, 사용하는 앱으로도 절대 전송되지 않습니다. [키가 저장되는 곳](/docs/accounts#where-keys-are-stored)과 [키를 안전하게 지키기](/docs/safety)를 보세요.

### 패스코드를 잊어버리면 어떻게 하나요? {#forgotten-passcode}

패스코드는 Hivesigner를 포함해 누구도 복구할 수 없습니다. 계정을 Hivesigner에서 삭제한 뒤 Hive 키와 새 패스코드로 다시 추가하세요. Hive 계정과 승인한 앱은 그대로 유지됩니다. [패스코드를 잊어버렸다면](/docs/accounts#forgotten-passcode)을 보세요.

### 휴대폰에서도 Hivesigner를 쓸 수 있나요? {#phone}

네. 휴대폰 브라우저에서 https://hivesigner.com 을 열고 계정을 추가하세요. 키는 그 브라우저에만 저장되므로 사용하는 기기마다 계정을 추가해야 합니다. [계정 추가와 관리](/docs/accounts)를 보세요.

### 어떤 앱이 Hivesigner를 사용하나요? {#which-apps}

https://hivesigner.com/apps 에 Hivesigner를 통해 Hive에 브로드캐스트하는 앱이 많이 사용된 순으로 나옵니다. 각 앱은 자기 이름과 설명을 직접 게시하며, Hivesigner는 그것을 검증하지 않습니다. 거기서 앱을 열면 게시 권한을 줄 수 있는 페이지가 나타납니다. [디렉터리에서 앱 승인하기](/docs/signing-in#directory)를 보세요.

### Hivesigner와 Hive Keychain은 어떤 관계인가요? {#hive-keychain}

서로 다른 도구입니다. Hive Keychain은 브라우저 확장 프로그램이자 모바일 앱이고, Hivesigner는 웹사이트여서 설치할 것이 없습니다. 앱이 메시지 서명을 요청할 때 만들어지는 서명은 Hive Keychain이 만드는 것과 같은 종류여서, 앱은 같은 코드로 둘 다 확인합니다. Hivesigner의 **메시지 서명** 페이지에서 만든 검증 토큰은 Hivesigner의 **메시지 검증** 페이지에서 확인합니다. [메시지 서명](/docs/message-signing)을 보세요.

## Hivesigner로 개발하기 {#building}

### 모바일 앱에서도 Hivesigner를 쓸 수 있나요? {#mobile-app}

네. 사용자를 브라우저의 Hivesigner로 보내고, 앱이 받을 수 있는 콜백을 사용하세요. 앱이 소유한 https 링크(Android App Links 또는 iOS Universal Links)나 `http://127.0.0.1/auth` 같은 루프백 주소를 쓰면 됩니다. `myapp://` 같은 사용자 지정 스킴은 거부됩니다. [모바일 앱과 데스크톱 앱](/docs/register-app#native-apps)을 보세요.

### 앱 계정이 꼭 필요한가요? {#app-account}

게시 권한으로 사용자를 로그인시키거나 API로 브로드캐스트하려면 필요합니다. [앱 등록하기](/docs/register-app)를 보세요. [서명 링크](/docs/sign-links)와 [메시지 서명](/docs/message-signing)은 앱 계정 없이도 작동합니다. [게시 권한 없는 로그인](/docs/login-only)도 마찬가지입니다.

### API로 송금할 수 있나요? {#transfers}

아니요. API는 투표, 댓글, 팔로우처럼 게시 권한으로 충분한 작업만 브로드캐스트합니다. 송금을 비롯해 활성 키가 필요한 작업에는 [서명 링크](/docs/sign-links)를 쓰세요. 사용자가 자기 키로 하나씩 승인합니다.

### 어떤 언어에 SDK가 있나요? {#languages}

공식 SDK는 JavaScript용입니다. Python에는 커뮤니티 라이브러리가 있습니다. 어떤 언어에서든 REST API를 호출할 수 있습니다. [SDK](/docs/sdk)와 [REST API](/docs/api)를 보세요.

## 도움말 {#help}

### 어디서 도움을 받을 수 있나요? {#get-help}

HiveDevs 디스코드 서버에서 물어보세요: https://discord.gg/pNJn7wh. 버그는 해당하는 GitHub 저장소에 이슈로 등록하세요. 웹사이트는 https://github.com/ecency/hivesigner-ui, API는 https://github.com/ecency/hivesigner-api, JavaScript SDK는 https://github.com/ecency/hivesigner-sdk 입니다. 요청이 거부된 화면에서는 **이 문제 신고하기**로 Hivesigner 팀에 문제를 보낼 수 있습니다.

### 어떻게 기여할 수 있나요? {#contribute}

Hivesigner는 위 세 저장소에서 GitHub에 오픈 소스로 공개되어 있습니다. 버그나 아이디어를 이슈로 남겨주세요. 수정 사항은 풀 리퀘스트로 보내주세요.
