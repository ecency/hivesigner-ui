Đưa mọi người đến Hivesigner để đăng nhập vào ứng dụng của bạn. Họ xem lại yêu cầu của bạn ở đó và phê duyệt. Sau đó Hivesigner đưa họ về callback của bạn kèm một token (luồng token) hoặc kèm một mã mà máy chủ của bạn đổi lấy token (luồng mã). Trang này bao quát cả hai luồng, mọi tham số và các phạm vi.

## Trước khi bắt đầu {#before-you-start}

- Đăng ký ứng dụng: một tài khoản Hive cho nó, với các callback đã liệt kê. Xem [Đăng ký ứng dụng](/docs/register-app).
- Để phát giao dịch qua API, tài khoản ứng dụng của bạn còn phải [cấp quyền posting cho @hivesigner](/docs/register-app#grant-hivesigner).
- Với luồng mã, hãy đặt một [khóa bí mật của client](/docs/register-app#client-secret).

## URL cấp quyền {#authorize-url}

Đưa người dùng đến địa chỉ này:

```text
https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=SCOPE&state=STATE
```

Hãy mã hóa mọi giá trị cho URL. `URLSearchParams` làm việc đó giúp bạn:

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

### Tham số {#parameters}

| Tham số | Bắt buộc | Tác dụng |
| --- | --- | --- |
| `client_id` | Có, với một ứng dụng | Tên tài khoản ứng dụng của bạn. `clientId` cũng được đọc. Nếu không có nó, yêu cầu trở thành yêu cầu chỉ đăng nhập từ một trang web không có tài khoản ứng dụng: xem [Đăng nhập không cần quyền posting](/docs/login-only). |
| `redirect_uri` | Có | Nơi Hivesigner đưa người dùng trở lại. Nó phải trùng khớp chính xác với một trong các URI chuyển hướng của ứng dụng bạn. Xem [Callback](/docs/register-app#callbacks). |
| `scope` | Không | `login`, `posting` hoặc `offline`. Xem [Phạm vi](#scopes). Nếu không có nó, yêu cầu xin quyền posting. |
| `response_type` | Không | Giá trị `code` bắt đầu [luồng mã](#code-flow). Giá trị khác, hoặc không có, nghĩa là [luồng token](#token-flow). |
| `state` | Nên có | Một giá trị ngẫu nhiên mà Hivesigner trả lại nguyên vẹn. Xem [Bảo vệ yêu cầu bằng state](#state). |
| `account` | Không | Một tên người dùng Hive. Khi tài khoản đó có trên thiết bị của người dùng, Hivesigner chọn nó. Nếu không thì bỏ qua. `select_account` cũng được đọc. |

Người dùng vẫn có thể chuyển sang tài khoản khác trên màn hình cấp quyền. Hãy luôn lấy tài khoản từ token hoặc từ lần đổi mã, đừng bao giờ lấy từ thứ bạn đã yêu cầu.

## Phạm vi {#scopes}

Hive chỉ có một quyền posting. Vì vậy Hivesigner có hai mức truy cập, chỉ đăng nhập và posting, và không có mức nào nhỏ hơn ở giữa.

| `scope` | Người dùng phê duyệt điều gì | Luồng | `type` của token truy cập |
| --- | --- | --- | --- |
| `login` | “Xem tên người dùng của tài khoản bạn”. Không cấp quyền nào. | Luồng token (đừng thêm `response_type=code`) | `login` |
| `posting` | Quyền posting. Lần đầu tiên, việc này thêm tài khoản ứng dụng của bạn vào quyền posting của người dùng. | Luồng token, hoặc luồng mã với `response_type=code` | `posting` |
| `offline` | Quyền posting, như trên | Luồng mã | `posting`, kèm một token `refresh` |

Trong luồng mã, callback nhận một mã trước (một token có `type` là `code`) và máy chủ của bạn đổi nó lấy token truy cập.

- **Không có phạm vi** nghĩa là `posting`.
- **Giá trị có chứa `offline`** ở bất kỳ đâu nghĩa là `offline`, ví dụ giá trị cũ `offline,vote,comment`.
- **Bất kỳ giá trị nào khác** nghĩa là `posting`. Điều này gồm cả các tên thao tác cũ như `vote`, `comment`, `vote,comment`, `comment_options` hay `custom_json`. Chúng không giới hạn token: mọi token posting đều cho phép cùng một tập thao tác. Xem [broadcast chấp nhận những gì](/docs/api#broadcast-rules).

Hãy xin `login` khi ứng dụng của bạn chỉ cần biết người dùng là ai. Xem [Đăng nhập không cần quyền posting](/docs/login-only).

## Luồng token {#token-flow}

Trình duyệt của người dùng nhận token truy cập trực tiếp. Ứng dụng của bạn không cần khóa bí mật nào.

1. Đưa người dùng đến URL cấp quyền:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
   ```

2. Người dùng phê duyệt. Hivesigner chuyển hướng tới callback của bạn:

   ```text
   REDIRECT_URI?state=STATE&access_token=ACCESS_TOKEN&expires_in=604800&username=USERNAME
   ```

   Hivesigner thêm các tham số của nó bằng `?` khi callback của bạn không có chuỗi truy vấn, và bằng `&` khi có. `state` chỉ xuất hiện khi bạn gửi một giá trị không rỗng.

3. Trên callback của bạn, hãy [so khớp `state`](#state) trước. Rồi [kiểm tra token](/docs/tokens#check-a-token) trên máy chủ của bạn. Tài khoản mà token thuộc về nằm ngay trong token: đừng chỉ dựa vào tham số `username`, vì ai cũng có thể sửa một URL.
4. Giữ token trên máy chủ của bạn hoặc trong cookie httpOnly. Hãy chuyển hướng tới một URL sạch để token rời khỏi thanh địa chỉ.
5. Dùng token với [API](/docs/api) cho đến khi nó hết hạn sau `expires_in` giây (7 ngày). Rồi đưa người dùng đến URL cấp quyền lần nữa. Người dùng đã cấp quyền posting trước đó sẽ thấy “Đăng nhập vào APP” và “Bạn đã cấp quyền cho @myapp trước đây. Không có quyền mới nào được cấp.”

## Luồng mã {#code-flow}

Máy chủ của bạn nhận một mã và đổi nó lấy một token truy cập và một token làm mới. Sau đó nó có thể tự gia hạn mà không cần người dùng. Hãy dùng cách này khi máy chủ của bạn hành động thay người dùng trong thời gian dài.

1. Đưa người dùng đến URL cấp quyền với `scope=offline`:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=offline&state=STATE
   ```

   `scope=posting&response_type=code` cho kết quả tương tự.

2. Người dùng phê duyệt quyền posting. Hivesigner chuyển hướng tới callback của bạn:

   ```text
   REDIRECT_URI?code=CODE&state=STATE&username=USERNAME
   ```

3. [So khớp `state`](#state). Rồi đổi mã ngay lập tức, từ máy chủ của bạn.

### Đổi mã {#exchange-code}

Gửi mã và khóa bí mật của client tới `/api/oauth2/token` trong phần thân của một yêu cầu POST:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

Câu trả lời:

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Cùng lời gọi đó trong Node.js 18 trở lên:

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

- Đặt mã và khóa bí mật trong thân yêu cầu, đừng bao giờ đặt trong URL.
- Đừng gửi header `Authorization` cùng yêu cầu này.
- Hãy dùng `username` từ câu trả lời này. Giá trị đó đến từ mã mà người dùng đã ký.
- Giữ token truy cập và token làm mới trên máy chủ của bạn.

### Làm mới {#refresh}

Khi token truy cập hết hạn, hãy gửi token làm mới cùng khóa bí mật của client tới cùng điểm cuối:

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token": "REFRESH_TOKEN", "client_secret": "CLIENT_SECRET"}'
```

```js
const renewed = await hivesignerTokens({ refresh_token: stored.refresh_token });
```

Câu trả lời có cùng hình dạng, với một token truy cập mới và một token làm mới mới. Hãy lưu cả hai thay cho token cũ.

## Bảo vệ yêu cầu bằng state {#state}

Nếu không có `state`, một trang web khác có thể đưa người dùng của bạn tới callback của bạn kèm token hoặc mã do nó tự chọn. Ứng dụng của bạn khi đó sẽ đăng nhập người dùng vào tài khoản của người khác. `state` gắn mỗi lần quay về với đúng trình duyệt đã bắt đầu lần đăng nhập.

1. Tạo một giá trị ngẫu nhiên cho mỗi lần đăng nhập, ít nhất 16 byte ngẫu nhiên. Dạng thập lục phân giúp giá trị không có ký tự cần mã hóa.
2. Lưu nó ở nơi chỉ trình duyệt này mới trình lại được: phiên trên máy chủ của bạn, hoặc một cookie httpOnly và Secure ngắn hạn với `SameSite=Lax`.
3. Gửi nó dưới dạng `state` trong URL cấp quyền.
4. Trên callback của bạn, hãy so tham số `state` với giá trị đã lưu. Nếu thiếu hoặc khác, hãy dừng lại: đừng dùng token cũng đừng dùng mã.
5. Xóa giá trị đã lưu, để mỗi giá trị chỉ dùng được một lần.

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

Hivesigner trả lại đúng giá trị `state` mà nó nhận được. Giá trị rỗng thì nó bỏ qua.

## Người dùng thấy gì {#what-the-user-sees}

Màn hình cấp quyền hiển thị ảnh và tên ứng dụng của bạn, “Tài khoản Hive @myapp” và “Chuyển bạn đến HOST”, với HOST lấy từ callback của bạn. Sau đó:

- **Yêu cầu posting lần đầu.** Tiêu đề ghi “APP đang yêu cầu quyền truy cập tài khoản của bạn.” Thẻ **Phạm vi** liệt kê những gì ứng dụng của bạn sẽ làm được. Một thông báo ghi “Cấp quyền lần đầu: thao tác này thêm @myapp vào quyền posting của bạn trên chuỗi và cần khóa active của bạn một lần. Tài khoản đó sẽ có thể đăng bài dưới danh nghĩa bạn cho đến khi bạn thu hồi quyền.” Nút ghi **Cấp quyền**. Khi thiết bị của người dùng không có khóa active cho tài khoản đó, màn hình sẽ xin khóa ngay tại chỗ.
- **Đăng nhập.** Với `scope=login`, hoặc với quyền posting mà người dùng đã cấp trước đó, tiêu đề ghi “Đăng nhập vào APP” và nút ghi **Đăng nhập**.
- **Tài khoản.** “Cấp quyền với tư cách” hoặc “Đăng nhập với tư cách”, theo sau là tài khoản đang chọn. Người dùng có thể đổi tài khoản tại đây.
- **Tài khoản đang khóa.** Một ô mã truy cập nằm phía trên nút. Một cú nhấp là mở khóa tài khoản và đi tiếp.
- **Không có tài khoản trên thiết bị.** Nút ghi **Tiếp tục**. Nút này mở biểu mẫu thêm tài khoản rồi quay lại yêu cầu.

Sau một yêu cầu posting lần đầu, Hivesigner chờ đến khi quyền mới hiện trên chuỗi rồi mới chuyển hướng. Việc này có thể mất vài giây. Để xem toàn bộ màn hình từ phía người dùng, xem [Đăng nhập vào ứng dụng](/docs/signing-in).

## Hủy và yêu cầu bị từ chối {#cancel}

- **Hủy.** Người dùng đi tới danh sách tài khoản của họ trong Hivesigner. Không có gì được gửi đến callback của bạn: cũng không có tham số lỗi nào. Hãy giữ nút đăng nhập sẵn sàng để người dùng bắt đầu lại. Đừng chờ một lần quay về.
- **Yêu cầu bị từ chối.** Một callback chưa đăng ký, một `client_id` không xác định hoặc thiếu `redirect_uri` sẽ hiện lỗi trong Hivesigner kèm nút **Báo cáo sự cố này**. Không có gì được gửi đến callback của bạn. Xem [Người dùng thấy gì khi có điều gì đó sai](/docs/register-app#refused-requests).

## URL yêu cầu đăng nhập cũ {#legacy-login-request}

Hivesigner vẫn chấp nhận URL đăng nhập cũ, được giữ lại cho các tích hợp trước đây. Với tích hợp mới, hãy dùng `/oauth2/authorize`.

```text
https://hivesigner.com/login-request/CLIENT_ID?redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

Nó mở cùng màn hình cấp quyền, với cùng các bước kiểm tra callback và cùng cách chuyển hướng. Nhưng nó đọc tham số khác đi:

- `scope` là `login` hoặc `posting`. Giá trị khác, hoặc không có, nghĩa là `login`.
- `offline` không được đọc. Với luồng mã, hãy thêm `response_type=code`.
- `account` không được đọc.

`https://hivesigner.com/login?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI` theo đúng các quy tắc đó.
