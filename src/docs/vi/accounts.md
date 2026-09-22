Hivesigner ký bằng khóa của những tài khoản Hive mà bạn thêm vào. Bạn thêm một tài khoản một lần trong mỗi trình duyệt bạn dùng. Sau đó Hivesigner giữ khóa của tài khoản đó trong trình duyệt ấy, được mã hóa bằng mã mở khóa nếu bạn đặt.

## Thêm một tài khoản {#add-account}

1. Hãy kiểm tra thanh địa chỉ trình duyệt có hiện `https://hivesigner.com` hay không. Xem [Kiểm tra địa chỉ trước tiên](/docs/safety#check-the-address).
2. Mở [hivesigner.com/import](https://hivesigner.com/import). Nếu trình duyệt này chưa có tài khoản nào, nút **Thiết lập Hivesigner** ở trang chủ mở đúng biểu mẫu đó.
3. Ở ô **Tên người dùng**, nhập tên người dùng Hive của bạn bằng chữ thường, không có `@`.
4. Ở ô **Khóa riêng tư**, dán một trong các khóa riêng tư của bạn. Hãy đọc trước [Nên thêm khóa nào](/docs/accounts#which-key).
5. Giữ nguyên dấu tích ở **Bảo vệ bằng mã mở khóa (khuyến nghị)** và chọn một **Mã mở khóa**. Mã cần ít nhất 4 ký tự. Xem [Bảo vệ bằng mã mở khóa](/docs/accounts#passcode).
6. Chọn **Thêm tài khoản**.

Trước khi lưu bất cứ thứ gì, Hivesigner đối chiếu khóa với tài khoản của bạn trên mạng Hive. Nó so phần công khai của khóa với các khóa mà tài khoản liệt kê. Bản thân khóa riêng tư không được gửi đi đâu cả. Nếu tên người dùng không phải là tài khoản Hive, hoặc khóa không thuộc về tài khoản đó, biểu mẫu báo “Tên người dùng hoặc khóa không hợp lệ. Hãy dùng mật khẩu chính hoặc khóa owner, active, posting hay memo của bạn.”

Tài khoản bạn vừa thêm trở thành tài khoản đã chọn: tài khoản mà Hivesigner dùng trên các màn hình của nó. Nếu bạn tới biểu mẫu này từ một yêu cầu, Hivesigner sẽ đưa bạn trở lại yêu cầu đó. Nếu không, nó mở trang **Tài khoản**.

### Thêm một khóa nữa cho tài khoản {#add-a-key}

Để thêm khóa thứ hai cho tài khoản đã có sẵn ở đây (chẳng hạn khóa active bên cạnh khóa posting), hãy thêm lại tài khoản đó với khóa mới. Hivesigner giữ những khóa đã có và thêm khóa mới. Khóa mới cho vai trò đã có sẵn sẽ thay thế khóa cũ.

Nếu tài khoản có mã mở khóa, hãy giữ nguyên dấu tích ở **Bảo vệ bằng mã mở khóa (khuyến nghị)** và nhập đúng mã đó. Hivesigner từ chối mọi trường hợp khác:

- Không nhập mã mở khóa, biểu mẫu báo “Tài khoản này được bảo vệ trên thiết bị này. Hãy nhập mã mở khóa của tài khoản để thêm khóa.”
- Nhập mã khác, nó báo “Sai mã mở khóa. Khóa chưa được lưu.”

## Nên thêm khóa nào {#which-key}

Một tài khoản Hive có nhiều khóa riêng tư. Mỗi khóa cho phép những thao tác khác nhau. Bạn nhận chúng từ ví hoặc ứng dụng đã tạo tài khoản Hive cho bạn, thường ở trang khóa hoặc mật khẩu của ứng dụng đó. Hivesigner không thể cho bạn xem chúng.

| Khóa | Hivesigner dùng vào việc gì |
| --- | --- |
| Posting | Đăng nhập vào ứng dụng, bình chọn, đăng bài và bình luận, theo dõi, sửa hồ sơ và nhận thưởng. |
| Active | Thao tác ví như chuyển khoản, power up hoặc power down, ủy quyền, tiết kiệm và chuyển đổi. Bình chọn nhân chứng và đề xuất. Cấp quyền lần đầu cho ứng dụng và thu hồi quyền của ứng dụng. |
| Owner | Đổi khóa owner hoặc tài khoản khôi phục. Bạn không cần nó cho việc hằng ngày. |
| Memo | Không dùng vào việc gì. Biểu mẫu vẫn nhận, nhưng tài khoản chỉ có khóa memo thì không đăng nhập được: màn hình yêu cầu khi đó hiện “Thêm khóa posting hoặc active cho @NGƯỜI_DÙNG để tiếp tục”. |

Hãy thêm khóa posting cho việc dùng hằng ngày. Chỉ thêm khóa active khi bạn cần cho thao tác ví hoặc để cấp quyền lần đầu cho ứng dụng. Khi một màn hình cần khóa mà thiết bị này không có, nó sẽ báo và cho bạn thêm khóa.

Mật khẩu chính cũng dùng được ở ô **Khóa riêng tư**. Hivesigner suy ra các khóa từ đó và lưu mọi khóa vẫn khớp với tài khoản của bạn, kể cả khóa owner. Thêm từng khóa riêng lẻ sẽ giữ khóa owner tránh xa thiết bị này.

> **Lưu ý:** Hivesigner ký mỗi giao dịch đúng bằng khóa mà giao dịch đó cần. Đây là quy tắc của Hive có hiệu lực từ một đợt hard fork năm 2025. Khóa active không còn ký được thao tác mức posting như một lượt bình chọn. Khóa owner không còn ký được thao tác ví. Hãy thêm khóa posting ngay cả khi khóa active đã có sẵn ở đây.

Đăng nhập vào ứng dụng thì khác: đó không phải giao dịch. Hivesigner đăng nhập cho bạn bằng khóa posting, hoặc bằng khóa active khi thiết bị này không có khóa posting của tài khoản.

## Bảo vệ bằng mã mở khóa {#passcode}

Mã mở khóa là mật khẩu bạn chọn riêng cho trình duyệt này. Nó không phải mật khẩu Hive và cũng không phải khóa nào của bạn. Hivesigner dùng nó để mã hóa các khóa của tài khoản trước khi lưu, rồi hỏi lại mã đó để mở chúng.

- Hivesigner không lưu mã mở khóa của bạn và không gửi nó đi đâu. Không ai khôi phục hộ bạn được.
- Mỗi tài khoản trên thiết bị này có mã mở khóa riêng. Bạn có thể dùng chung một mã cho tất cả.
- Mã càng dài càng khó đoán. Đừng dùng mật khẩu chính Hive hay một trong các khóa của bạn làm mã mở khóa.

Không có mã mở khóa, Hivesigner lưu các khóa của tài khoản trong trình duyệt này mà không mã hóa. Nó tự mở chúng mỗi lần khởi động, nên ai dùng trình duyệt này cũng có thể ký bằng chúng. Trang **Tài khoản** đánh dấu tài khoản như vậy bằng **Không có mã mở khóa**.

Để đặt mã mở khóa cho tài khoản chưa có, hãy thêm lại tài khoản đó với một trong các khóa của nó kèm một mã mở khóa. Khi ấy Hivesigner mã hóa toàn bộ khóa của tài khoản bằng mã đó.

Để đổi mã mở khóa, hãy [xóa tài khoản](/docs/accounts#remove-account) rồi thêm lại với mã mới. Việc xóa sẽ gỡ mọi khóa của tài khoản khỏi trình duyệt này, nên hãy thêm lại từng khóa (khóa posting, rồi khóa active nếu bạn dùng).

## Mở khóa một tài khoản {#unlock}

Tài khoản có mã mở khóa luôn ở trạng thái khóa mỗi khi Hivesigner mở ra: trong thẻ mới, sau khi tải lại, hoặc khi một ứng dụng đưa bạn tới. Bạn không cần mở khóa trước. Màn hình cần tới khóa sẽ hiện ô **Mã mở khóa** ngay trên nút của nó (ví dụ **Đăng nhập**, **Phê duyệt** hoặc **Mở khóa**). Một cú nhấp sẽ mở khóa tài khoản và tiếp tục.

Mã sai sẽ hiện “Sai mã mở khóa.” và không có gì được ký.

Hivesigner chỉ giữ các khóa đã mở trong bộ nhớ tạm, không bao giờ trong bộ nhớ lưu trữ. Tài khoản vẫn mở trong thẻ đó cho tới khi bạn đóng hoặc tải lại thẻ.

## Chuyển tài khoản {#switch-accounts}

Trang **Tài khoản** liệt kê các tài khoản trên thiết bị này từ A đến Z. Tài khoản đang chọn có dấu tích. Từ 6 tài khoản trở lên, ô **Tìm kiếm tài khoản** sẽ lọc danh sách.

Hãy chọn một tài khoản để biến nó thành tài khoản đã chọn. Ở đây Hivesigner không hỏi mã mở khóa. Màn hình cần tới khóa mới hỏi.

Trên màn hình yêu cầu, dòng nêu tên tài khoản (“Đăng nhập với tư cách”, “Cấp quyền với tư cách” hoặc “Ký với tư cách”) có liên kết **Chuyển tài khoản**. Liên kết đó mở đúng danh sách ấy ngay tại chỗ, nên bạn có thể chọn tài khoản khác mà không rời khỏi yêu cầu. **Thêm tài khoản khác** ở dưới danh sách mở biểu mẫu **Thêm tài khoản** rồi đưa bạn trở lại yêu cầu.

## Xóa một tài khoản {#remove-account}

1. Mở trang **Tài khoản**.
2. Chọn dấu **✕** bên cạnh tài khoản. Nhãn của nó cho trình đọc màn hình là **Xóa khỏi Hivesigner @NGƯỜI_DÙNG**.
3. Xác nhận khi trình duyệt hỏi “Xóa @NGƯỜI_DÙNG khỏi thiết bị này? Các khóa của tài khoản này được lưu tại đây sẽ bị xóa.”

Xóa một tài khoản chỉ gỡ khóa của nó khỏi trình duyệt này. Tài khoản Hive của bạn không thay đổi. Các ứng dụng bạn đã cấp quyền vẫn giữ quyền truy cập, vì quyền đó nằm trên blockchain Hive. Để gỡ bỏ, xem [Xem và thu hồi quyền của ứng dụng](/docs/signing-in#remove-access).

Nếu bạn xóa tài khoản đang chọn, một tài khoản khác trên thiết bị này sẽ trở thành tài khoản đã chọn.

Nếu trình duyệt không cho Hivesigner lưu thay đổi, bạn sẽ thấy “Chỉ xóa trong phiên này: bộ nhớ lưu trữ không khả dụng, nên tài khoản này sẽ xuất hiện lại khi bạn tải lại trang.”

## Nếu bạn quên mã mở khóa {#forgotten-passcode}

Không ai khôi phục được mã mở khóa, kể cả Hivesigner. Tài khoản Hive của bạn không bị ảnh hưởng: mã chỉ bảo vệ bản sao các khóa nằm trong trình duyệt này.

1. [Xóa tài khoản](/docs/accounts#remove-account) khỏi thiết bị này.
2. [Thêm lại](/docs/accounts#add-account) bằng khóa của nó và một mã mở khóa mới.

Trên blockchain Hive không có gì thay đổi. Các ứng dụng bạn đã cấp quyền vẫn giữ quyền truy cập.

## Khóa của bạn được lưu ở đâu {#where-keys-are-stored}

Hivesigner chỉ lưu khóa của bạn trong trình duyệt này, trên thiết bị này, ở phần bộ nhớ mà trình duyệt dành cho hivesigner.com.

- Chúng không được đồng bộ. Trình duyệt khác, hồ sơ trình duyệt khác hay thiết bị khác đều không có. Hãy thêm tài khoản ở đó nữa.
- Xóa dữ liệu trang web hoặc dữ liệu duyệt web của hivesigner.com sẽ xóa chúng. Đóng cửa sổ ẩn danh cũng vậy.
- Hivesigner không phải là bản sao lưu. Hãy cất giữ khóa hoặc mật khẩu chính của bạn an toàn ở nơi khác.
