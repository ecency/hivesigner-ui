Ứng dụng đăng nhập cho mọi người bằng Hivesigner là một tài khoản Hive. Tên của nó chính là `client_id` bạn gửi. Hồ sơ của nó chứa các cài đặt mà Hivesigner đọc: những callback mà nó được phép gửi token đến và, cho luồng mã, một khóa bí mật của client. Để phát giao dịch qua API, tài khoản ứng dụng còn cấp quyền posting cho @hivesigner. Trang này đi qua từng bước.

## Bạn cần những gì {#what-you-need}

| Bạn muốn | Tài khoản ứng dụng và callback | Khóa bí mật của client | Quyền cho @hivesigner |
| --- | --- | --- | --- |
| Đăng nhập cho người dùng và phát bằng luồng token | Có | Không | Có |
| Đăng nhập cho người dùng và phát bằng luồng mã (token làm mới) | Có | Có | Có |
| Chỉ đăng nhập cho người dùng, với token nêu tên ứng dụng của bạn | Có | Không | Không |
| Chỉ đăng nhập cho người dùng, từ một trang web không có tài khoản Hive | Không | Không | Không |
| Gửi liên kết ký | Không | Không | Không |

Với hai dòng cuối, xem [Đăng nhập không cần quyền posting](/docs/login-only) và [Liên kết ký](/docs/sign-links).

## Tạo tài khoản ứng dụng {#app-account}

1. Tạo một tài khoản Hive cho ứng dụng của bạn, ví dụ tại https://ecency.com/signup. Hãy dùng một tài khoản riêng cho ứng dụng, không dùng tài khoản cá nhân. Tên của nó là `client_id` của bạn. Người dùng thấy tên đó trên màn hình cấp quyền, cạnh dòng “Tài khoản Hive”. Tài khoản Hive không thể đổi tên, vì vậy hãy chọn tên thật cẩn thận.
2. Thêm tài khoản vào Hivesigner tại https://hivesigner.com/import (**Thêm tài khoản**). Dùng khóa active hoặc mật khẩu chính: phần cấp quyền bên dưới cần khóa active.

## Điền các cài đặt của ứng dụng {#app-settings}

Mở https://hivesigner.com/profile với tài khoản ứng dụng đang được chọn và đặt:

- **Tài khoản này là một ứng dụng.** Bật mục này. Nó đánh dấu tài khoản là một ứng dụng, điều mà API kiểm tra trước khi chấp nhận một mã hoặc token làm mới cho tài khoản đó.
- **URI chuyển hướng.** Các callback của bạn, mỗi dòng một cái. Xem [Callback](#callbacks).
- **Người tạo.** Ai duy trì ứng dụng. Danh mục ứng dụng tại https://hivesigner.com/apps hiển thị thông tin này.
- **Trạng thái.** Môi trường thật hoặc thử nghiệm, để bạn tự ghi nhớ. Hivesigner đối xử với cả hai như nhau.
- **Khóa bí mật của client.** Chỉ cần cho [luồng mã](/docs/oauth2#code-flow). Xem [Khóa bí mật của client](#client-secret).

Hãy điền cả **Tên** và **URL ảnh đại diện**. Màn hình cấp quyền hiển thị ảnh và tên ứng dụng của bạn. Danh mục ứng dụng tại https://hivesigner.com/apps hiển thị tên, **Giới thiệu** và **Trang web**.

Việc lưu sẽ cập nhật hồ sơ của tài khoản trên chuỗi và cần khóa posting của nó. Hivesigner đọc các callback của bạn từ tài khoản khi một yêu cầu đăng nhập mở ra, nên thay đổi có hiệu lực ngay khi giao dịch vào một khối.

> **Lưu ý:** tên, ảnh và mô tả do chính tài khoản ứng dụng của bạn công bố. Vì vậy màn hình cấp quyền cũng hiển thị tên tài khoản thật (`@myapp`) và máy chủ mà nó đưa người dùng đến: đó mới là những thứ mà việc cấp quyền và chuyển hướng thực sự dùng.

## Callback {#callbacks}

Callback (tức `redirect_uri` trong một yêu cầu đăng nhập) là nơi Hivesigner đưa người dùng trở lại kèm token hoặc mã. Hivesigner chỉ gửi đến một callback có trong danh sách trên tài khoản ứng dụng của bạn.

### Các quy tắc {#callback-rules}

- **Khớp chính xác.** `redirect_uri` trong yêu cầu phải là một trong các URI chuyển hướng của bạn, từng ký tự một: giao thức, máy chủ, cổng, đường dẫn và chuỗi truy vấn.
- **Chỉ https.** Callback phải dùng `https://`. `http://` thường chỉ được chấp nhận trên loopback: `localhost`, `127.0.0.1` hoặc `[::1]`.
- **Cổng loopback có thể thay đổi.** Một callback loopback http thường đã đăng ký sẽ khớp với mọi máy chủ và cổng loopback có cùng đường dẫn, truy vấn, đoạn và thông tin người dùng. Một callback loopback `https://` đã đăng ký thì vẫn phải khớp chính xác.
- **Không dùng giao thức riêng.** Một callback như `myapp://callback` sẽ bị từ chối. Xem [Ứng dụng di động và máy tính](#native-apps).
- **Không có đoạn.** Đừng thêm `#fragment` vào callback.

Trang hồ sơ từ chối lưu một callback không bao giờ có thể hoạt động, kèm dòng “Callback không sử dụng được (phải là https, hoặc http trên localhost)”.

### Ví dụ {#callback-examples}

Với các URI chuyển hướng sau đã đăng ký:

```text
https://myapp.example/auth/callback
http://localhost:3000/auth
```

| `redirect_uri` trong yêu cầu | Kết quả |
| --- | --- |
| `https://myapp.example/auth/callback` | Chấp nhận: khớp chính xác |
| `https://myapp.example/auth/callback/` | Từ chối: thừa dấu `/` |
| `https://myapp.example/auth/callback?next=home` | Từ chối: truy vấn khác |
| `https://www.myapp.example/auth/callback` | Từ chối: máy chủ khác |
| `http://myapp.example/auth/callback` | Từ chối: http thường ngoài loopback |
| `http://localhost:3000/auth` | Chấp nhận: khớp chính xác |
| `http://127.0.0.1:51234/auth` | Chấp nhận: loopback, cùng đường dẫn, cổng khác |
| `http://[::1]:3000/auth` | Chấp nhận: loopback, cùng đường dẫn |
| `http://127.0.0.1:3000/other` | Từ chối: đường dẫn khác |
| `https://localhost:3000/auth` | Từ chối: https không khớp với đăng ký http thường |
| `myapp://auth` | Từ chối: giao thức riêng |

Để chấp nhận một truy vấn trên callback của bạn, hãy đăng ký callback kèm đúng truy vấn đó. Hivesigner giữ nguyên truy vấn của bạn và thêm các tham số của nó vào sau.

### Ứng dụng di động và máy tính {#native-apps}

Hivesigner đặt token vào URL callback. Một giao thức riêng như `myapp://` không gắn với một ứng dụng duy nhất: một ứng dụng khác trên cùng thiết bị có thể nhận nó và lấy token. Vì vậy Hivesigner từ chối giao thức riêng và chỉ gửi token tới một địa chỉ https hoặc tới loopback trên chính thiết bị của người dùng.

Một ứng dụng gốc dùng một trong hai cách sau:

- **Một liên kết https mà nó sở hữu.** Đăng ký một callback trên tên miền của bạn mà hệ điều hành mở trong ứng dụng của bạn (Android App Links hoặc iOS Universal Links).
- **Một callback loopback.** Ứng dụng lắng nghe trên `127.0.0.1` để nhận chuyển hướng. Hãy đăng ký `http://127.0.0.1/auth` (hoặc `localhost`) và dùng bất kỳ cổng rảnh nào lúc chạy: cổng không cần khớp.

## Khóa bí mật của client {#client-secret}

Khóa bí mật của client chứng minh rằng việc đổi mã đến từ máy chủ của bạn. Nó bắt buộc cho [luồng mã](/docs/oauth2#code-flow): máy chủ của bạn gửi nó kèm mỗi mã hoặc token làm mới tới `/api/oauth2/token`. Luồng token không dùng nó.

- **Tạo một giá trị ngẫu nhiên dài**, ví dụ bằng `openssl rand -hex 32`.
- **Đặt nó trên trang hồ sơ.** Hivesigner chỉ lưu bản băm sha256 của nó, trong hồ sơ tài khoản ứng dụng của bạn. Để trống ô này sẽ giữ nguyên khóa bí mật hiện tại.
- **Giữ nó trên máy chủ của bạn.** Đừng bao giờ đặt nó trong trang web, ứng dụng di động hay URL.
- **Để đổi nó,** hãy đặt khóa mới và cập nhật máy chủ của bạn cùng lúc.

## Cấp quyền posting cho @hivesigner {#grant-hivesigner}

API phát giao dịch bằng khóa posting của tài khoản @hivesigner. Hive chỉ chấp nhận chữ ký đó cho người dùng của bạn khi tài khoản ứng dụng của bạn đã thêm @hivesigner vào quyền posting của chính nó. Xem [Chuỗi quyền posting](/docs/how-it-works#authority-chain).

1. Chọn tài khoản ứng dụng của bạn trong Hivesigner.
2. Mở https://hivesigner.com/authorize/hivesigner.
3. Trang ghi “Cấp quyền cho @hivesigner” và “@hivesigner sẽ có thể đăng bài, bình luận, bình chọn và theo dõi dưới danh nghĩa @myapp.” Chọn **Cấp quyền**. Việc này cần khóa active của tài khoản ứng dụng.

Bạn chỉ làm việc này một lần. Nếu không, mọi lần phát đều thất bại với `unauthorized_client` và dòng “Broadcaster account doesn't have permission to broadcast for @myapp”. Ứng dụng chỉ đăng nhập thì không cần điều này.

Quyền này cũng cho phép @hivesigner đăng bài dưới danh nghĩa chính tài khoản ứng dụng của bạn, thêm một lý do nữa để chỉ dùng tài khoản ứng dụng cho ứng dụng.

Các ứng dụng phát giao dịch qua Hivesigner với quyền này có thể xuất hiện trong danh mục ứng dụng tại https://hivesigner.com/apps, xếp hạng theo số người dùng.

## Người dùng thấy gì khi có điều gì đó sai {#refused-requests}

Hivesigner từ chối một yêu cầu mà nó không thể đáp ứng an toàn. Nó hiển thị một thông báo và nút **Báo cáo sự cố này**. Yêu cầu đó không thể được phê duyệt. Không có gì được gửi đến callback của bạn.

| Vấn đề | Người dùng đọc thấy |
| --- | --- |
| `redirect_uri` không phải là một trong các URI chuyển hướng của bạn | “URL chuyển hướng của ứng dụng này chưa được đăng ký. Để bảo vệ bạn, việc đăng nhập đã bị chặn.” |
| `client_id` không phải là tài khoản Hive | “@myapp không phải là tài khoản Hive, nên không có ứng dụng nào để cấp quyền. Hãy quay lại trang web và thử lại.” |
| Tài khoản chưa được đánh dấu là ứng dụng | “@myapp chưa được thiết lập là ứng dụng nên không thể đăng nhập cho bạn. Hãy quay lại trang web và thử lại.” Hãy bật **Tài khoản này là một ứng dụng** như hướng dẫn ở trên. |
| Yêu cầu không có `redirect_uri` | “Yêu cầu cấp quyền này không đầy đủ: không nêu tên ứng dụng hoặc URL chuyển hướng. Hãy quay lại ứng dụng và thử lại.” |

Nếu người dùng báo về một trong các lỗi này, hãy đối chiếu `redirect_uri` mà ứng dụng của bạn gửi với các URI chuyển hướng của bạn, từng ký tự một.

## Danh sách kiểm tra {#checklist}

1. Một tài khoản Hive cho ứng dụng, đã thêm vào Hivesigner bằng khóa active.
2. Tại https://hivesigner.com/profile: “Tài khoản này là một ứng dụng” đã bật, các URI chuyển hướng đã liệt kê, đã đặt khóa bí mật của client nếu bạn dùng luồng mã.
3. Đã cấp quyền cho @hivesigner tại https://hivesigner.com/authorize/hivesigner, nếu bạn phát giao dịch qua API.
4. Một liên kết đăng nhập gửi đúng một trong các URI chuyển hướng của bạn. Xem [Đăng nhập bằng OAuth2](/docs/oauth2).
