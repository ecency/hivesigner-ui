JavaScript SDK chính thức dựng URL đăng nhập và liên kết ký, đồng thời gọi API Hivesigner giúp bạn. Với Python thì có các thư viện của cộng đồng. Mọi ngôn ngữ khác đều có thể gọi thẳng [REST API](/docs/api).

## JavaScript SDK {#javascript}

SDK là gói npm `hivesigner`. Mã nguồn của nó nằm tại https://github.com/ecency/hivesigner-sdk. Nó viết bằng TypeScript và kèm sẵn các kiểu dữ liệu.

Phiên bản 4 cần Node.js 18 trở lên, vì nó dùng `fetch` có sẵn. Trong trình duyệt, nó cần ES2017 trở lên. Ở nơi không có `fetch` toàn cục, hãy thêm một polyfill trước khi dùng SDK. Trên Node.js cũ hơn, hãy ở lại phiên bản 3.

### Cài đặt {#install}

```bash
npm install hivesigner
```

Với một trang không có bước build, hãy tải bản đóng gói cho trình duyệt. Nó định nghĩa biến toàn cục `hivesigner`:

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### Tạo một client {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| Tùy chọn | Ý nghĩa |
| --- | --- |
| `app` | Tài khoản ứng dụng của bạn, được gửi dưới dạng `client_id`. |
| `callbackURL` | Nơi Hivesigner đưa người dùng trở lại. Nó phải là một trong các callback của ứng dụng bạn, từng ký tự một (callback loopback dùng http thường có thể khác về máy chủ và cổng, xem [Callback](/docs/register-app#callback-rules)). |
| `scope` | Một danh sách, được nối bằng dấu phẩy thành tham số `scope`. Xem [Phạm vi](/docs/oauth2#scopes). |
| `responseType` | `'code'` cho luồng mã. Với luồng token thì bỏ trống. |
| `accessToken` | Token truy cập của người dùng, khi bạn đã có sẵn. |
| `apiURL` | Nguồn của API. SDK thêm `/api/` vào sau. Mặc định là `https://hivesigner.com`. |

`setApp`, `setCallbackURL`, `setScope`, `setAccessToken`, `removeAccessToken` và `setApiURL` thay đổi client về sau. Mỗi hàm đều trả về client.

### Đăng nhập cho người dùng {#sign-in}

`getLoginURL(state, account)` trả về URL đăng nhập:

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` quay về callback của bạn nguyên vẹn. Hãy dùng nó để gắn câu trả lời với yêu cầu.
- `account` là tùy chọn: một tên người dùng. Hivesigner chọn tài khoản đó khi nó có trên thiết bị, và bỏ qua nếu không có.

Trong trình duyệt, `client.login({ state: 'STATE' })` đưa người dùng đến cùng URL đó, không kèm tài khoản.

Trong luồng token, callback của bạn nhận `access_token`, `expires_in` và `username`. Hãy đưa token cho client:

```js
client.setAccessToken('ACCESS_TOKEN');
```

SDK không có phương thức cho bước đổi mã của luồng mã. Máy chủ của bạn tự gửi mã và khóa bí mật của client tới API, như [Đổi mã](/docs/oauth2#exchange-code) trình bày.

### Lấy người dùng {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` là tài khoản Hive của người dùng đúng như chuỗi trả về. `scope` liệt kê những gì token cho phép.

### Phát giao dịch {#broadcast}

`broadcast(operations)` gửi các thao tác tới API, và API phát chúng thay người dùng. API chỉ chấp nhận các thao tác posting do chính người dùng của token là tác giả: `vote`, `comment`, `delete_comment`, `comment_options`, `custom_json` với quyền posting, `claim_reward_balance` và `account_update2` cho dữ liệu hồ sơ. Xem [broadcast chấp nhận những gì](/docs/api#broadcast-rules).

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

Hãy nêu tên người dùng trong mỗi thao tác. API không thay thế `__signer`.

Các hàm trợ giúp sau dựng một thao tác rồi gọi `broadcast`:

| Phương thức | Phát gì |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`. `weight` chạy từ `-10000` đến `10000` (100%). |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`. Với bài mới, `parentAuthor` là `''`. `jsonMetadata` có thể là một đối tượng: SDK chuyển nó thành chuỗi. |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`. Hãy truyền `[]` cho `requiredAuths` và `['USERNAME']` cho `requiredPostingAuths`. `json` là một chuỗi. |
| `reblog(account, author, permlink)` | `custom_json` với id `follow`, đăng lại bài viết |
| `follow(follower, following)` | `custom_json` với id `follow`, `what: ['blog']` |
| `unfollow(unfollower, unfollowing)` | `custom_json` với id `follow`, `what: []` |
| `ignore(follower, following)` | `custom_json` với id `follow`, `what: ['ignore']` (tắt tiếng) |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`. Số tiền là chuỗi, chẳng hạn `'0.000 HIVE'`, `'0.000 HBD'` và `'1.000000 VESTS'`. |

`updateUserMetadata()` đã lỗi thời. Để đổi hồ sơ của một người dùng, hãy phát `account_update2` với `posting_json_metadata` mới.

### Đăng xuất {#log-out}

`revokeToken()` là lời gọi đăng xuất của SDK. Nó gửi token tới điểm cuối thu hồi của API rồi gỡ token khỏi client. Khi lời gọi bị từ chối, hãy tự gọi `removeAccessToken()`. Cũng hãy xóa token ở mọi nơi ứng dụng của bạn đã lưu.

Để chấm dứt hẳn quyền truy cập của ứng dụng bạn, người dùng gỡ nó tại https://hivesigner.com/authorized-apps. Xem [Xem và gỡ quyền truy cập của một ứng dụng](/docs/signing-in#remove-access).

### Liên kết ký {#sign-links}

`sendOperation(op, params)`, `sendOperations(ops, params)` và `sendTransaction(tx, params)` trả về một liên kết `https://hivesigner.com/sign/...`. `params` nhận `callback`, `no_broadcast` và `signer`. Xem [Liên kết ký](/docs/sign-links).

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

Trong TypeScript, kiểu dữ liệu bắt buộc phải có đối số thứ ba: hãy truyền `undefined` để nhận lại liên kết.

Trong trình duyệt, hãy truyền một hàm làm đối số thứ ba để mở liên kết trong tab mới. Hàm đó không được gọi và không có gì được trả về. Hãy gọi nó từ một trình xử lý nhấp chuột, nếu không trình duyệt có thể chặn tab mới và lời gọi sẽ báo lỗi.

### Promise và callback {#promises-and-callbacks}

`me`, `broadcast`, các hàm trợ giúp và `revokeToken` đều trả về một promise. Để dùng callback thay thế, hãy truyền một hàm làm đối số cuối. Hàm đó nhận `(error, result)`.

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

Khi API trả lời bằng một lỗi, promise bị từ chối cùng thân lỗi của API, `{ error, error_description }`. Với callback, thân đó chính là đối số `error`. Khi câu trả lời không phải JSON, promise bị từ chối cùng lỗi phân tích cú pháp.

## Python {#python}

Các thư viện sau đến từ cộng đồng. Tác giả của chúng duy trì chúng, không phải đội ngũ Hivesigner. Hãy đối chiếu chúng với [REST API](/docs/api) trước khi dựa vào chúng.

| Thư viện | Tác giả |
| --- | --- |
| hivesigner-python-client: https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem, mô đun `beem.hivesigner`: https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
