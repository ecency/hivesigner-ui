Token Hivesigner là một câu ngắn đã được ký. Nó nêu tên một tài khoản Hive, ứng dụng mà nó được tạo ra cho, và thời điểm ký. Máy chủ của bạn có thể kiểm tra token bằng API hoặc tự kiểm tra. Trang này cho thấy token chứa gì, nó tồn tại bao lâu và cả hai cách kiểm tra.

## Token trông như thế nào {#format}

Token là một đối tượng JSON được mã hóa base64url, khác chuẩn base64url ở một điểm: phần đệm dùng `.` thay vì `=`. So với base64 thường thì `+` thành `-`, `/` thành `_` và `=` thành `.`. Mọi token đều bắt đầu bằng `eyJzaWduZWRfbWVzc2FnZSI6`.

Khi giải mã, một token truy cập từ luồng token trông như sau:

```json
{
  "signed_message": { "type": "posting", "app": "myapp" },
  "authors": ["alice"],
  "timestamp": 1789819200,
  "signatures": ["1f5a0c...e27b"],
  "authority": "posting"
}
```

| Trường | Ý nghĩa |
| --- | --- |
| `signed_message.type` | Token thuộc loại nào: `login`, `posting`, `code` hoặc `refresh`. Xem [Các loại token](#kinds). |
| `signed_message.app` | Tài khoản ứng dụng mà token được tạo ra cho. Token đăng nhập cho một trang web không có tài khoản ứng dụng thì không có trường này. |
| `authors[0]` | Tài khoản Hive mà token thuộc về. |
| `timestamp` | Thời điểm ký, tính bằng giây từ 1970-01-01 UTC. |
| `signatures[0]` | Chữ ký, dưới dạng chuỗi thập lục phân. |
| `authority` | Chỉ có trong token được ký trong trình duyệt: khóa nào của người dùng đã ký, `posting` hay `active`. Trường này nằm ngoài dữ liệu được ký. Muốn biết khóa nào đã ký, hãy khôi phục nó từ chữ ký. |

Chữ ký là chữ ký secp256k1 trên bản băm sha256 của `JSON.stringify({ signed_message, authors, timestamp })`, với các khóa theo đúng thứ tự đó.

### Giải mã một token {#decode}

Trong Node.js:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}
```

Trong trình duyệt:

```js
export function decodeToken(token) {
  const base64 = token.replace(/[-_.]/g, (c) => ({ '-': '+', _: '/', '.': '=' })[c]);
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
```

Giải mã không phải là kiểm tra. Ai cũng có thể dựng một chuỗi giải mã ra đúng hình dạng này. Hãy [kiểm tra token](#check-a-token) trước khi tin nó.

## Các loại token {#kinds}

| Token | `type` | `app` | Được ký bởi | Bạn nhận nó ở đâu |
| --- | --- | --- | --- | --- |
| Token truy cập, luồng token | `posting` | Ứng dụng của bạn | Khóa posting của người dùng, hoặc khóa active của họ khi Hivesigner không giữ khóa posting cho tài khoản đó | `access_token` trên callback của bạn |
| Token đăng nhập, `scope=login` | `login` | Ứng dụng của bạn | Khóa posting hoặc active của người dùng | `access_token` trên callback của bạn |
| Token đăng nhập, trang web không có tài khoản ứng dụng | `login` | Không có | Khóa posting hoặc active của người dùng | `access_token` trên callback của bạn |
| Mã | `code` | Ứng dụng của bạn | Khóa posting hoặc active của người dùng | `code` trên callback của bạn |
| Token truy cập, luồng mã | `posting` | Ứng dụng của bạn | Khóa posting của @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |
| Token làm mới | `refresh` | Ứng dụng của bạn | Khóa posting của @hivesigner | [`/api/oauth2/token`](/docs/api#oauth2-token) |

Mã và token làm mới không phải là token truy cập. Đừng bao giờ chấp nhận chúng như một lần đăng nhập.

## Token tồn tại bao lâu {#lifetime}

Token truy cập tồn tại 7 ngày: `expires_in` là 604800 giây, tính từ `timestamp` của nó. Khi nó hết hạn:

- **Luồng token:** đưa người dùng đi đăng nhập lại. Người dùng đã cấp quyền cho ứng dụng của bạn sẽ thấy “Đăng nhập vào APP” và chỉ cần một cú nhấp.
- **Luồng mã:** máy chủ của bạn lấy token truy cập mới bằng token làm mới và khóa bí mật của client. Xem [Làm mới](/docs/oauth2#refresh).

Hãy coi token là đã hết hạn khi `timestamp` của nó cũ hơn 7 ngày. Với bất cứ thứ gì bạn kiểm tra ngay sau khi chuyển hướng, hãy chấp nhận tuổi ngắn hơn nhiều. Hãy đổi mã ngay lập tức. Chỉ chấp nhận token đăng nhập trong vài phút kể từ `timestamp` của nó.

## Kiểm tra token trên máy chủ của bạn {#check-a-token}

Trước khi máy chủ của bạn tin một token do trình duyệt hay ứng dụng gửi đến, hãy kiểm tra rằng:

- tài khoản đó hoặc @hivesigner thực sự đã ký nó;
- nó được tạo ra cho ứng dụng của bạn;
- nó thuộc loại token mà bạn chờ đợi;
- nó đủ mới.

### Hỏi API {#check-with-the-api}

Gọi `/api/me` kèm token. Một token hợp lệ trả về tài khoản trong `user`:

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Token không hợp lệ trả về `401` với `invalid_grant`. Xem [GET /api/me](/docs/api#me).

`/api/me` xác nhận chữ ký. Câu trả lời của nó không nêu tên ứng dụng mà token được tạo ra cho. Vì vậy hãy tự giải mã token và kiểm tra `app`, `type` cùng tuổi của nó. Một token được tạo cho ứng dụng khác không được phép đăng nhập ai vào ứng dụng của bạn.

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

API chỉ chấp nhận token có nêu tên ứng dụng. Token đăng nhập từ một trang web không có tài khoản ứng dụng thì hãy [tự kiểm tra](#check-it-yourself).

### Tự kiểm tra {#check-it-yourself}

1. Giải mã token.
2. Kiểm tra `signed_message.type` đúng loại bạn chờ đợi: `posting` cho token truy cập, `login` cho token đăng nhập.
3. Kiểm tra `signed_message.app` là tài khoản ứng dụng của bạn. Với trang web không có tài khoản ứng dụng, hãy kiểm tra rằng trường này không tồn tại.
4. Kiểm tra tuổi từ `timestamp`.
5. Tính bản băm sha256 của `JSON.stringify({ signed_message, authors, timestamp })`.
6. Khôi phục khóa công khai từ `signatures[0]` và bản băm đó.
7. Đọc tài khoản `authors[0]` từ blockchain Hive ngay lúc này, vì người dùng có thể đổi khóa. Khóa khôi phục được phải là một trong các khóa posting hoặc active hiện tại của tài khoản. Token từ `/api/oauth2/token` lại do @hivesigner ký: với những token đó, hãy chấp nhận một khóa posting hiện tại của tài khoản @hivesigner.

Trong Node.js với [@ecency/sdk](https://www.npmjs.com/package/@ecency/sdk), gói này xuất `PrivateKey`, `PublicKey`, `Signature` và `callRPC` dưới `@ecency/sdk/hive`:

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

Dùng như sau:

```js
// An access token from the token flow:
const user = await verifyHivesignerToken(token, { type: 'posting', app: 'myapp' });

// A sign-in token from a site with no app account, right after the redirect:
const visitor = await verifyHivesignerToken(token, { type: 'login', app: undefined, maxAge: 300 });
```

Thư viện dhive (`@hiveio/dhive`) cũng dùng được: tính bản băm bằng `cryptoUtils.sha256(message)` và khôi phục khóa bằng `Signature.fromString(signatures[0]).recover(digest).toString()`.

## Giữ token an toàn {#keep-tokens-safe}

Bất kỳ ai giữ một token posting đều có thể phát giao dịch dưới danh nghĩa người dùng qua ứng dụng của bạn cho đến khi nó hết hạn. Hãy coi nó như một mật khẩu.

- **Giữ token trên máy chủ của bạn,** hoặc trong cookie httpOnly và Secure. Chỉ giữ token làm mới và khóa bí mật của client trên máy chủ.
- **Đừng bao giờ đặt token vào một URL mà bạn ghi log.** Luồng token trả token trong chuỗi truy vấn của callback. Hãy đọc nó trên máy chủ, rồi chuyển hướng tới một URL không có nó. Hãy để chuỗi truy vấn của callback ngoài log của bạn.
- **Đừng tải gì từ trang khác trên trang callback,** để địa chỉ chứa token không bị gửi cho họ. Một header `Referrer-Policy: no-referrer` trên trang đó sẽ giúp ích.
- **Chỉ gửi token tới máy chủ của chính bạn và tới `https://hivesigner.com/api/`.**

## Đăng xuất và gỡ quyền truy cập {#sign-out}

- **Đăng xuất một người dùng** nghĩa là bỏ token đi: xóa nó khỏi phiên hoặc cookie của bạn. Bạn cũng có thể gọi [`/api/oauth2/token/revoke`](/docs/api#oauth2-token-revoke) để báo cho Hivesigner biết người dùng đã đăng xuất. Ứng dụng của bạn vẫn tự bỏ token đi.
- **Cắt hẳn quyền truy cập của ứng dụng bạn** là lựa chọn của người dùng. Tại https://hivesigner.com/authorized-apps, hoặc tại `https://hivesigner.com/revoke/APP`, họ gỡ tài khoản ứng dụng của bạn khỏi quyền posting của họ trên chuỗi. Sau đó API không còn phát giao dịch thay họ qua ứng dụng của bạn.
