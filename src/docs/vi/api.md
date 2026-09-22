API Hivesigner nằm tại `https://hivesigner.com/api/`. Nó trả về tài khoản của người dùng đã đăng nhập, phát các thao tác posting thay họ, đổi mã lấy token và liệt kê các ứng dụng dùng Hivesigner. Trang này mô tả từng điểm cuối cùng với yêu cầu, câu trả lời và lỗi của nó.

## Yêu cầu và xác thực {#authentication}

- **URL gốc:** `https://hivesigner.com/api/`. Mọi điểm cuối bên dưới đều tương đối với `https://hivesigner.com`.
- **Token:** gửi nó trong header `Authorization` đúng như nó vốn có: `Authorization: ACCESS_TOKEN`. Tiền tố `Bearer ` cũng được chấp nhận. Bạn cũng có thể gửi nó dưới dạng `access_token` trong chuỗi truy vấn hoặc trong thân, nhưng header giúp token không lọt vào URL và log.
- **Thân yêu cầu:** JSON với `Content-Type: application/json`, hoặc form (`application/x-www-form-urlencoded`).
- **Câu trả lời:** JSON.
- **Trình duyệt:** API cho phép yêu cầu khác nguồn, nên một ứng dụng web có thể gọi trực tiếp.

Để lấy token, xem [Đăng nhập bằng OAuth2](/docs/oauth2). Về những gì token chứa, xem [Token](/docs/tokens).

## Lỗi {#errors}

Câu trả lời lỗi có một mã trạng thái lỗi HTTP và thân như sau:

```json
{
  "error": "invalid_scope",
  "error_description": "The access_token scope does not allow the following operation(s): transfer"
}
```

| Trạng thái | `error` | Khi nào |
| --- | --- | --- |
| 401 | `invalid_grant` | Thiếu token hoặc token không hợp lệ, hoặc nó sai loại với điểm cuối này (“The token has invalid role”). Trên `/api/oauth2/token` còn có “The code or secret is not valid”. |
| 401 | `invalid_scope` | `/api/broadcast`: một thao tác mà token không cho phép. Phần mô tả nêu tên các thao tác đó. |
| 401 | `unauthorized_client` | `/api/broadcast`: một thao tác không do người dùng của token là tác giả, một `account_update2` chạm vào khóa, thiếu quyền posting được cấp, hoặc không tải được tài khoản. Phần mô tả cho biết trường hợp nào. |
| 500 | `server_error` | `/api/broadcast`: mạng Hive từ chối giao dịch. `error_description` mang thông báo của mạng. |
| 503 | `unavailable` | `/api/apps`: danh mục vẫn đang được dựng. |

## GET /api/me {#me}

Trả về tài khoản mà token thuộc về. Dùng nó để biết ai đã đăng nhập, hoặc để [kiểm tra token](/docs/tokens#check-with-the-api).

- **Phương thức:** `GET` hoặc `POST`.
- **Token:** một token truy cập, gồm cả token `login` có nêu tên ứng dụng.

```bash
curl https://hivesigner.com/api/me -H 'Authorization: ACCESS_TOKEN'
```

Câu trả lời, đã rút gọn:

```json
{
  "user": "alice",
  "_id": "alice",
  "name": "alice",
  "account": { "id": 1370484, "name": "alice" },
  "scope": [
    "vote",
    "comment",
    "delete_comment",
    "comment_options",
    "custom_json",
    "claim_reward_balance",
    "account_update2"
  ],
  "user_metadata": { "profile": { "name": "Alice", "version": 2 } }
}
```

| Trường | Ý nghĩa |
| --- | --- |
| `user` | Tên người dùng Hive mà token thuộc về. `_id` và `name` lặp lại giá trị này. |
| `account` | Toàn bộ tài khoản, đúng như `condenser_api.get_accounts` của Hive trả về. |
| `scope` | Token cho phép những gì: `["login"]` với token đăng nhập, ngược lại là các thao tác mà `/api/broadcast` chấp nhận. |
| `user_metadata` | Dữ liệu hồ sơ của tài khoản, đã phân tích từ JSON. |

`/api/me` không nêu tên ứng dụng mà token được tạo ra cho. Để kiểm tra điều đó, hãy giải mã token: xem [Hỏi API](/docs/tokens#check-with-the-api).

## POST /api/broadcast {#broadcast}

Ký các thao tác posting cho người dùng của token bằng khóa posting của @hivesigner và phát chúng lên Hive.

- **Phương thức:** `POST`.
- **Token:** một token truy cập `posting`, từ luồng token hoặc luồng mã.
- **Điều kiện trước:** người dùng đã cấp quyền posting cho tài khoản ứng dụng của bạn (màn hình cấp quyền làm việc này) và tài khoản ứng dụng của bạn đã [cấp quyền posting cho @hivesigner](/docs/register-app#grant-hivesigner).
- **Thân:** `{ "operations": [...] }`, trong đó mỗi thao tác là `[name, fields]` như trên blockchain Hive. Mọi thao tác trong một yêu cầu đi vào cùng một giao dịch.

```http
POST /api/broadcast HTTP/1.1
Host: hivesigner.com
Authorization: ACCESS_TOKEN
Content-Type: application/json

{
  "operations": [
    ["vote", { "voter": "alice", "author": "bob", "permlink": "my-first-post", "weight": 10000 }]
  ]
}
```

Cùng yêu cầu đó với curl:

```bash
curl -X POST https://hivesigner.com/api/broadcast \
  -H 'Authorization: ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"operations":[["vote",{"voter":"alice","author":"bob","permlink":"my-first-post","weight":10000}]]}'
```

Một lần theo dõi là thao tác `custom_json`:

```json
{
  "operations": [
    ["custom_json", {
      "required_auths": [],
      "required_posting_auths": ["alice"],
      "id": "follow",
      "json": "[\"follow\",{\"follower\":\"alice\",\"following\":\"bob\",\"what\":[\"blog\"]}]"
    }]
  ]
}
```

API trả lời ngay khi một node Hive đã nhận giao dịch. `result.id` là ID giao dịch:

```json
{
  "result": { "id": "TRANSACTION_ID" }
}
```

Khi mạng từ chối giao dịch, câu trả lời là `500` với `server_error`. `error_description` mang thông báo của mạng và `response` mang lỗi thô.

### broadcast chấp nhận những gì {#broadcast-rules}

Một token posting chỉ cho phép API phát các thao tác sau và không gì khác. Trong mỗi thao tác, người dùng của token phải là tài khoản ở trường được nêu:

| Thao tác | Người dùng của token phải là |
| --- | --- |
| `vote` | `voter` |
| `comment` | `author` |
| `delete_comment` | `author` |
| `comment_options` | `author` |
| `custom_json` | Tài khoản đầu tiên trong `required_posting_auths` |
| `claim_reward_balance` | `account` |
| `account_update2` | `account` |

- **Bất kỳ thao tác nào khác** bị từ chối với `invalid_scope`. Token `login` không cho phép thao tác nào cả.
- **Thao tác cho tài khoản khác** bị từ chối với `unauthorized_client`. Một token chỉ phát giao dịch cho chính người dùng của nó.
- **`account_update2`** chỉ có thể đổi dữ liệu hồ sơ của tài khoản. Thao tác có trường `owner`, `active` hoặc `posting` bị từ chối với `unauthorized_client`.
- **`custom_json`**: hãy để `required_auths` rỗng. API ký bằng quyền posting, nên thao tác cần quyền active sẽ thất bại trên mạng.

Chuyển khoản và các thao tác ví khác cần khóa active của người dùng. Hãy gửi chúng dưới dạng [liên kết ký](/docs/sign-links).

## POST /api/oauth2/token {#oauth2-token}

Đổi một mã lấy token, hoặc một token làm mới lấy bộ token mới. Chỉ gọi từ máy chủ của bạn. Xem [Luồng mã](/docs/oauth2#code-flow).

- **Phương thức:** `POST`, với các giá trị nằm trong thân.
- **Thân:** `code` và `client_secret`, hoặc `refresh_token` và `client_secret`.
- **Header:** đừng gửi header `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token \
  -H 'Content-Type: application/json' \
  -d '{"code": "CODE", "client_secret": "CLIENT_SECRET"}'
```

```json
{
  "access_token": "ACCESS_TOKEN",
  "refresh_token": "REFRESH_TOKEN",
  "expires_in": 604800,
  "username": "alice"
}
```

Mỗi lần gọi trả về một token truy cập mới và một token làm mới mới. Cả hai đều do @hivesigner ký. `expires_in` là thời hạn của token truy cập tính bằng giây (7 ngày).

Lỗi: `401 invalid_grant`. Phần mô tả là “The token has invalid role” khi giá trị gửi lên không phải mã hoặc token làm mới hợp lệ. Nó là “The code or secret is not valid” khi mã hoặc khóa bí mật không khớp.

## POST /api/oauth2/token/revoke {#oauth2-token-revoke}

Báo cho Hivesigner biết người dùng đã đăng xuất khỏi ứng dụng của bạn. Còn token thì ứng dụng của bạn tự bỏ đi.

- **Phương thức:** `POST`.
- **Token:** token truy cập, trong header `Authorization`.

```bash
curl -X POST https://hivesigner.com/api/oauth2/token/revoke -H 'Authorization: ACCESS_TOKEN'
```

```json
{ "success": true }
```

Hàm `revokeToken()` của JavaScript SDK thực hiện lời gọi này rồi quên token đi. Để gỡ hẳn quyền truy cập của ứng dụng bạn, người dùng tự gỡ nó tại https://hivesigner.com/authorized-apps. Xem [Đăng xuất và gỡ quyền truy cập](/docs/tokens#sign-out).

## GET /api/apps {#apps}

Danh mục ứng dụng công khai: các ứng dụng phát giao dịch qua Hivesigner, xếp hạng theo số người dùng. Nó không cần token. https://hivesigner.com/apps hiển thị cùng danh sách đó.

```bash
curl https://hivesigner.com/api/apps
```

```json
{
  "updated_at": "2026-09-19T06:00:00.000Z",
  "building": false,
  "window_days": 7,
  "featured": ["myapp"],
  "apps": [
    {
      "username": "myapp",
      "name": "My App",
      "about": "A short description from the app's profile.",
      "website": "https://myapp.example",
      "site": "ok",
      "users": 412,
      "requests": 9310,
      "first_seen": "2026-08-01",
      "last_seen": "2026-09-19",
      "new": false
    }
  ]
}
```

| Trường | Ý nghĩa |
| --- | --- |
| `updated_at` | Danh mục được dựng lần gần nhất khi nào. |
| `building` | Là `true` cho đến khi lần dựng đầu tiên có dữ liệu. Khi đó `apps` rỗng. |
| `window_days` | Số ngày mà bảng xếp hạng bao quát. |
| `featured` | Các tên người dùng hiển thị trước, theo đúng thứ tự đó. |
| `apps[].username` | Tài khoản của ứng dụng. |
| `apps[].name`, `about` | Lấy từ hồ sơ của tài khoản ứng dụng, hoặc là `null`. |
| `apps[].website` | Trang web trong hồ sơ, khi trang đó trả lời trên tên miền của chính nó. Nếu không thì `null`. |
| `apps[].site` | Kết quả kiểm tra trang web: `ok`, `no_website`, `invalid`, `redirected`, `blocked` hoặc `unreachable`. Mục `redirected` còn có `redirects_to`. |
| `apps[].users` | Số người dùng khác nhau mỗi ngày, cộng dồn trong khoảng thời gian. |
| `apps[].requests` | Số yêu cầu API thành công thực hiện cho ứng dụng trong khoảng thời gian đó. |
| `apps[].first_seen`, `last_seen` | Ngày đầu tiên Hivesigner ghi nhận ứng dụng và ngày cuối cùng nó được dùng, hoặc `null`. |
| `apps[].new` | Là `true` khi ứng dụng xuất hiện lần đầu trong khoảng thời gian đó. |

Câu trả lời có thể được lưu đệm tới 5 phút. Trước khi danh mục được dựng lần đầu, API trả về `503` với `unavailable`. Hãy thử lại sau.

Tên và mô tả do chính mỗi tài khoản ứng dụng công bố. Hivesigner không xác minh chúng.
