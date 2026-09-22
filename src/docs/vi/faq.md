Câu trả lời ngắn cho những câu hỏi thường gặp. Mỗi câu đều dẫn tới trang có đầy đủ chi tiết.

## Dùng Hivesigner {#using-hivesigner}

### Hivesigner có miễn phí không? {#is-it-free}

Có. Hivesigner không thu phí người dùng lẫn ứng dụng. Mã nguồn của nó mở theo giấy phép MIT.

### Hivesigner có bao giờ nhìn thấy khóa của tôi không? {#keys}

Không. Khóa của bạn ở lại trong trình duyệt trên thiết bị của bạn. Hivesigner ký ngay tại đó. Chúng không bao giờ được gửi tới máy chủ của Hivesigner hay tới các ứng dụng bạn dùng. Xem [Khóa của bạn được lưu ở đâu](/docs/accounts#where-keys-are-stored) và [Giữ an toàn cho khóa của bạn](/docs/safety).

### Nếu tôi quên mã mở khóa thì sao? {#forgotten-passcode}

Không ai khôi phục được mã mở khóa, kể cả Hivesigner. Hãy xóa tài khoản khỏi Hivesigner rồi thêm lại bằng khóa Hive và một mã mở khóa mới. Tài khoản Hive của bạn và các ứng dụng bạn đã cấp quyền vẫn giữ nguyên. Xem [Nếu bạn quên mã mở khóa](/docs/accounts#forgotten-passcode).

### Tôi dùng Hivesigner trên điện thoại được không? {#phone}

Được. Hãy mở https://hivesigner.com trong trình duyệt điện thoại và thêm tài khoản ở đó. Khóa chỉ được lưu trong trình duyệt đó, nên hãy thêm tài khoản trên mỗi thiết bị bạn dùng. Xem [Thêm và quản lý tài khoản](/docs/accounts).

### Những ứng dụng nào dùng Hivesigner? {#which-apps}

https://hivesigner.com/apps liệt kê các ứng dụng phát giao dịch lên Hive thông qua Hivesigner, xếp theo mức độ sử dụng từ cao xuống thấp. Mỗi ứng dụng tự công bố tên và mô tả của mình. Hivesigner không xác minh chúng. Mở một ứng dụng ở đó sẽ hiện trang cho phép bạn cấp quyền đăng bài cho nó. Xem [Cấp quyền cho ứng dụng từ danh mục](/docs/signing-in#directory).

### Hivesigner liên quan thế nào tới Hive Keychain? {#hive-keychain}

Đó là hai công cụ riêng biệt. Hive Keychain là tiện ích trình duyệt và ứng dụng di động. Hivesigner là một trang web, nên không có gì phải cài đặt. Khi một ứng dụng yêu cầu bạn ký thông điệp, chữ ký tạo ra cùng loại với chữ ký của Hive Keychain, nên ứng dụng kiểm tra cả hai bằng cùng một đoạn mã. Token xác minh từ trang **Ký thông điệp** của Hivesigner được kiểm tra tại trang **Xác minh thông điệp** của Hivesigner. Xem [Ký thông điệp](/docs/message-signing).

## Phát triển với Hivesigner {#building}

### Tôi dùng Hivesigner trong ứng dụng di động được không? {#mobile-app}

Được. Hãy đưa người dùng tới Hivesigner trong trình duyệt và dùng một địa chỉ trả về mà ứng dụng của bạn nhận được: một liên kết https thuộc quyền sở hữu của bạn (Android App Links hoặc iOS Universal Links) hay một địa chỉ loopback như `http://127.0.0.1/auth`. Các lược đồ riêng như `myapp://` sẽ bị từ chối. Xem [Ứng dụng di động và máy tính](/docs/register-app#native-apps).

### Tôi có cần tài khoản ứng dụng không? {#app-account}

Bạn cần nó để đăng nhập cho người dùng kèm quyền đăng bài và để phát giao dịch qua API. Xem [Đăng ký ứng dụng của bạn](/docs/register-app). [Liên kết ký](/docs/sign-links) và [ký thông điệp](/docs/message-signing) vẫn chạy mà không cần. [Đăng nhập không kèm quyền đăng bài](/docs/login-only) cũng vậy.

### API có gửi được chuyển khoản không? {#transfers}

Không. API chỉ phát các thao tác ở mức posting, như bình chọn, bình luận và theo dõi. Với chuyển khoản và những thao tác khác cần khóa active, hãy dùng [liên kết ký](/docs/sign-links): người dùng phê duyệt từng cái bằng khóa của chính họ.

### Những ngôn ngữ nào có SDK? {#languages}

SDK chính thức dành cho JavaScript. Python có các thư viện do cộng đồng viết. Ngôn ngữ nào cũng có thể gọi REST API. Xem [SDK](/docs/sdk) và [REST API](/docs/api).

## Trợ giúp {#help}

### Tôi có thể nhận trợ giúp ở đâu? {#get-help}

Hãy hỏi trong máy chủ Discord HiveDevs: https://discord.gg/pNJn7wh. Báo lỗi bằng cách mở issue trong kho GitHub tương ứng: https://github.com/ecency/hivesigner-ui cho trang web, https://github.com/ecency/hivesigner-api cho API hoặc https://github.com/ecency/hivesigner-sdk cho SDK JavaScript. Trên màn hình từ chối một yêu cầu, nút **Báo cáo sự cố này** gửi sự cố tới nhóm Hivesigner.

### Tôi có thể đóng góp thế nào? {#contribute}

Hivesigner là mã nguồn mở trên GitHub, trong ba kho nêu trên. Hãy mở issue kèm lỗi hoặc ý tưởng. Gửi pull request kèm bản sửa.
