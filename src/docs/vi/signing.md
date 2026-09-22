Các ứng dụng có thể yêu cầu bạn ký một giao dịch Hive, như một lượt bình chọn, một lần chuyển khoản hay một bài đăng. Chúng gửi cho bạn một liên kết mở Hivesigner. Hivesigner trình bày bằng lời lẽ rõ ràng yêu cầu đó làm gì, cần khóa nào và sẽ đưa bạn đi đâu sau đó. Không có gì được ký cho tới khi bạn phê duyệt. Ứng dụng cũng có thể yêu cầu bạn ký một thông điệp, thứ không bao giờ lên blockchain.

## Màn hình Xác nhận giao dịch {#confirm-screen}

Liên kết ký mở ra màn hình có tiêu đề “Xác nhận giao dịch”. Màn hình hiện một thẻ cho mỗi thao tác trong yêu cầu. Thao tác là một hành động trên Hive, chẳng hạn một lượt bình chọn hay một lần chuyển khoản.

Khi một yêu cầu có nhiều hơn một thao tác, các thẻ được đánh số và dòng phía trên ghi “Yêu cầu này chứa 3 thao tác. Hãy xem xét tất cả trước khi phê duyệt.”

### Phần tóm tắt {#summary}

Mỗi thẻ mở đầu bằng một câu nói rõ thao tác làm gì, kèm các giá trị lấy từ yêu cầu. Ví dụ:

| Thao tác | Nội dung trên thẻ |
| --- | --- |
| Chuyển khoản | Gửi 1.000 HIVE đến @bob (và bản ghi nhớ ở dưới, dạng Bản ghi nhớ: ...) |
| Bình chọn | Bình chọn ủng hộ @alice/bai-cua-toi (và trọng số bình chọn ở dưới, chẳng hạn 100%) |
| Bài đăng hoặc trả lời | Đăng bài “Tiêu đề của tôi”, hoặc Trả lời @alice/bai-cua-toi |
| Một hành động do ứng dụng Hive định nghĩa | Hành động tùy chỉnh (follow) |
| Thay đổi về người kiểm soát tài khoản | Cập nhật quyền hạn tài khoản |

Các thao tác khác hiện tên của chúng, như “Power Up” hay “Ủy quyền Hive Power”.

Bên cạnh câu đó, một nhãn viết hoa cho biết thao tác cần khóa nào: POSTING, ACTIVE hoặc OWNER.

### Phần chi tiết {#details}

Bên dưới câu tóm tắt, thẻ liệt kê những giá trị mà thao tác mang theo:

- tài khoản mà thao tác hành động thay mặt
- với bài đăng hoặc bình luận: permlink (địa chỉ của bài), cộng đồng hoặc thẻ, nội dung và siêu dữ liệu
- với hành động tùy chỉnh: mọi giá trị trong dữ liệu của nó, mỗi dòng một giá trị, để không có gì bị cắt mất
- với thay đổi quyền hạn: ngưỡng, các khóa và các tài khoản mà nó đặt ra

Thay đổi quyền hạn còn nói rõ khi nào nó sẽ gỡ khóa của bạn, bằng dòng “khóa: KHÔNG CÓ (khóa của bạn sẽ bị gỡ bỏ)”. Ngưỡng bị thiếu hiện thành “ngưỡng CHƯA ĐƯỢC ĐẶT (tính là 0)”.

Trong phần tóm tắt và phần chi tiết, những ký tự có thể giấu văn bản hoặc đổi chiều đọc được hiện thành `�`. Thứ bạn đọc không thể giả dạng thành thứ khác.

**Hiện dữ liệu thô của thao tác** mở ra đúng những thao tác sẽ được ký.

Khi một khoản được ghi bằng Hive Power, Hivesigner quy đổi theo tỷ lệ hiện tại. Nó hiện “Đang tải tỷ lệ Hive Power hiện tại…” và chờ có tỷ lệ đó rồi mới cho bạn phê duyệt.

Một số yêu cầu mang theo giao dịch đã được chuẩn bị ở nơi khác, chẳng hạn cho tài khoản do nhiều người cùng kiểm soát. Khi ấy màn hình ghi “Yêu cầu này tự cung cấp phần đầu (header) giao dịch riêng. Hết hạn: NGÀY.” Nếu người khác đã ký trước, nó ghi thêm “Yêu cầu này đã có sẵn 2 chữ ký.”

## Yêu cầu cần khóa nào {#which-key}

Dưới các thẻ, một dòng nêu khóa mà cả yêu cầu cần đến: “Sẽ được ký bằng khóa posting của bạn”, “Sẽ được ký bằng khóa active của bạn” hoặc “Sẽ được ký bằng khóa owner của bạn”.

Hivesigner ký đúng bằng khóa đó. Khóa active không ký được một lượt bình chọn và khóa owner không ký được một lần chuyển khoản. Đây là quy tắc của Hive từ đợt hard fork năm 2025. Xem [Nên thêm khóa nào](/docs/accounts#which-key).

Mọi thao tác trong cùng một yêu cầu phải cần chung một khóa. Khi không phải vậy, dòng đó ghi “Giao dịch này cần nhiều hơn một loại quyền và không thể ký bằng một khóa duy nhất.” Sẽ không có nút phê duyệt. Hãy quay lại ứng dụng.

Yêu cầu dùng khóa owner rất hiếm. Chúng thay đổi người có thể kiểm soát hoặc khôi phục tài khoản của bạn. Hãy đọc hai lần. Xem [Đọc kỹ trước khi phê duyệt](/docs/safety#read-before-approving).

### Khi thiếu khóa {#missing-key}

Nếu tài khoản đang chọn không có khóa đó trên thiết bị này, màn hình sẽ báo. Ví dụ: “Thao tác này cần khóa active của bạn, nhưng khóa active của @NGƯỜI_DÙNG không có ở đây.”

1. Chọn **Thêm tài khoản khác** ở dưới thông báo. Biểu mẫu **Thêm tài khoản** sẽ mở ra.
2. Nhập đúng tên người dùng đó và khóa còn thiếu. Nếu tài khoản có mã mở khóa, hãy nhập cả mã.
3. Chọn **Thêm tài khoản**. Hivesigner thêm khóa rồi đưa bạn trở lại yêu cầu.

Nếu tài khoản đang khóa, màn hình hiện ô **Mã mở khóa** ngay trên nút. Một cú nhấp sẽ mở khóa tài khoản và phê duyệt. Nếu hóa ra vẫn thiếu khóa, màn hình sẽ báo sau khi mở khóa.

Nếu trình duyệt này chưa có tài khoản nào, nút ghi **Tiếp tục** và mở biểu mẫu **Thêm tài khoản**.

## Phê duyệt hoặc ký {#approve}

Dòng tài khoản phía trên nút ghi “Ký với tư cách” kèm tài khoản thực hiện việc ký. **Chuyển tài khoản** cho phép bạn chọn tài khoản khác. Xem [Chuyển tài khoản](/docs/accounts#switch-accounts).

- **Phê duyệt** ký giao dịch ngay trong trình duyệt của bạn rồi gửi lên mạng Hive. Kết quả ghi “Giao dịch đã được phát lên mạng thành công” kèm **ID giao dịch** mở giao dịch đó trong một trình duyệt khối.
- **Ký** xuất hiện thay vào đó khi yêu cầu chỉ xin một chữ ký. Hivesigner ký giao dịch mà không gửi lên mạng. Nó chuyển chữ ký cho ứng dụng, hoặc hiển thị chữ ký khi yêu cầu không nêu trang web nào.

Nếu mạng từ chối giao dịch, bạn sẽ thấy “Giao dịch của bạn chưa được phát lên mạng” kèm “Thông báo lỗi” do mạng trả về. Bạn có thể thử lại.

## Trang web bạn sẽ quay lại {#return-site}

Khi yêu cầu có nêu trang web để quay lại, thông báo ở trên cùng ghi “Bạn sẽ được chuyển hướng đến HOST.” Sau khi bạn phê duyệt, Hivesigner đưa bạn tới đó. Hãy kiểm tra HOST đúng là trang web bạn vừa rời khỏi.

Khi yêu cầu không nêu trang web nào, Hivesigner ở lại màn hình kết quả.

## Yêu cầu dành cho tài khoản khác {#another-account}

Một yêu cầu có thể được tạo cho tài khoản khác với tài khoản đang chọn. Hivesigner cho thấy điều đó theo hai cách.

**Yêu cầu phải do tài khoản khác ký.** Màn hình ghi “Yêu cầu này phải được ký bởi @TÀI_KHOẢN. Hãy chuyển sang tài khoản đó.” Dòng tài khoản ghi “Tài khoản đã chọn” và danh sách tài khoản mở ra bên dưới. Hãy chọn tài khoản đó, hoặc thêm nó bằng **Thêm tài khoản khác**. Hivesigner không ký yêu cầu này bằng bất kỳ tài khoản nào khác.

**Một thao tác hành động thay mặt tài khoản khác.** Điều này xảy ra với những tài khoản do nhiều người cùng quản lý. Cảnh báo ở trên cùng ghi “Yêu cầu này không thực hiện thao tác dưới danh nghĩa @NGƯỜI_DÙNG mà dưới danh nghĩa @TÀI_KHOẢN. Chỉ tiếp tục nếu bạn cũng quản lý tài khoản đó.” Phần chi tiết của mỗi thẻ nêu rõ tài khoản mà thẻ đó hành động thay mặt.

## Những yêu cầu Hivesigner không đọc được {#invalid-requests}

Hivesigner không bao giờ ký một yêu cầu mà nó không đọc và trình bày trọn vẹn cho bạn được. Điều này bao gồm thao tác nó không biết, yêu cầu không có thao tác nào, giá trị không khớp với thao tác (một con số không phải là số, một khoản tiền sai định dạng) và dữ liệu thừa mà nó không hiển thị được.

Khi đó màn hình ghi “Rất tiếc, đã xảy ra lỗi. Dữ liệu được cung cấp không hợp lệ.” Hãy quay lại ứng dụng. Để báo cho nhóm Hivesigner, hãy chọn **Báo cáo sự cố này**.

## Yêu cầu ký thông điệp {#message-requests}

Một số ứng dụng yêu cầu bạn ký một thông điệp thay vì một giao dịch, chẳng hạn để chứng minh tài khoản là của bạn. Thông điệp là văn bản. Ký nó không làm thay đổi gì trên blockchain.

Màn hình hiển thị:

- Một tiêu đề như “ỨNG_DỤNG yêu cầu bạn ký một thông điệp.” Khi ứng dụng có tài khoản Hive, dòng bên dưới nêu tên tài khoản đó: “Tài khoản Hive @TÀI_KHOẢN_ỨNG_DỤNG”.
- “Chuyển bạn đến HOST”: trang web sẽ nhận chữ ký. Dòng này xuất hiện lại lần nữa bên cạnh nút.
- **Thông điệp**: toàn bộ văn bản, đúng như nó sẽ được ký. Những ký tự có thể giấu văn bản hoặc đổi chiều đọc được hiện thành mã được tô sáng, chẳng hạn `\u{200B}`.
- Khóa được dùng: “Sẽ được ký bằng khóa posting của bạn” hoặc “Sẽ được ký bằng khóa active của bạn”. Hivesigner không bao giờ ký thông điệp bằng khóa owner.
- Một cảnh báo: “Chữ ký của bạn chứng minh với bất kỳ ai nhìn thấy rằng @NGƯỜI_DÙNG đã ký đúng văn bản này. Chỉ ký thông điệp mà bạn hiểu.”
- Dòng tài khoản, “Ký với tư cách”, kèm **Chuyển tài khoản**.

Chọn **Ký** để ký. Hivesigner đưa bạn trở lại trang web kèm chữ ký, tên người dùng của bạn, loại khóa và khóa công khai đã tạo ra chữ ký. Khóa công khai là nửa có thể chia sẻ của một cặp khóa: nó không ký được gì cả.

Chọn **Hủy** để tới trang **Tài khoản** của bạn. Trang web sẽ không nhận được gì.

Nếu tài khoản không có khóa đó trên thiết bị này, màn hình sẽ báo. Ví dụ: “Thao tác này cần khóa posting của bạn, nhưng khóa posting của @NGƯỜI_DÙNG không có ở đây.” Hãy chọn **Chuyển tài khoản**, rồi chọn **Thêm tài khoản khác**. [Thêm khóa còn thiếu](/docs/accounts#add-a-key) cho đúng tài khoản đó. Hivesigner sẽ đưa bạn trở lại yêu cầu.

### Vì sao một số thông điệp bị từ chối {#refused-messages}

**Thông điệp hoạt động như một lần đăng nhập Hivesigner.** Có những đoạn văn bản mang đúng hình dạng của một lần đăng nhập Hivesigner. Ký nó sẽ cho trang web quyền truy cập tài khoản của bạn. Hivesigner không bao giờ ký đoạn văn bản như vậy và báo “Thông điệp này là một token của Hivesigner. Ký nó sẽ cho trang web quyền truy cập vào tài khoản của bạn, nên không thể ký.”

**Yêu cầu mà Hivesigner không dùng được.** Hivesigner từ chối yêu cầu không có thông điệp hoặc không có địa chỉ trả về. Nó cũng từ chối yêu cầu đòi khóa khác ngoài posting hay active, yêu cầu nêu là ứng dụng một thứ không phải tài khoản Hive, hoặc yêu cầu có địa chỉ trả về không an toàn hay chưa đăng ký cho ứng dụng. Nó báo “Không thể dùng yêu cầu ký này: cần có thông điệp, khóa posting hoặc active và một URL chuyển hướng an toàn đã đăng ký cho ứng dụng. Hãy quay lại trang web và thử lại.”

Nếu Hivesigner không đọc được thông tin ứng dụng từ mạng Hive, nó báo “Không thể tải thông tin tài khoản từ mạng Hive.” Chừng nào chưa đọc được, nó không ký gì cả. Hãy chọn **Thử lại**.

## Tự ký một thông điệp {#sign-message}

Bạn có thể tự ký một thông điệp để chứng minh mình kiểm soát một tài khoản.

1. Mở [hivesigner.com/signmessage](https://hivesigner.com/signmessage). Chân trang dẫn tới đó qua mục **Ký thông điệp**.
2. Nếu tài khoản đang chọn bị khóa, hãy nhập mã mở khóa rồi chọn **Mở khóa**. Nếu chưa chọn tài khoản nào, trang sẽ dẫn tới danh sách tài khoản của bạn.
3. Gõ văn bản vào ô **Thông điệp**. Hivesigner loại bỏ khoảng trắng và dấu xuống dòng ở đầu và cuối.
4. Chọn khóa ở ô **Khóa dùng để ký**. Ô này liệt kê các khóa của tài khoản đang chọn có trên thiết bị này, mạnh nhất lên trước. Khóa mạnh nhất được chọn sẵn từ đầu. Hãy đổi sang **Posting** trừ khi bạn cần khóa khác.
5. Chọn **Ký thông điệp**.

Phần **Tóm tắt chữ ký** hiện **Tác giả**, **Quyền đã dùng**, một **Token xác minh** và một **Liên kết xác minh**. Token xác minh gói thông điệp, tên người dùng của bạn và chữ ký vào chung một đoạn văn bản. Hãy chia sẻ liên kết hoặc token với người cần kiểm tra thông điệp.

Chữ ký không để lộ khóa của bạn. Nhưng nó cho thấy khóa nào đã tạo ra chữ ký.

## Xác minh một thông điệp {#verify-message}

1. Mở [hivesigner.com/verifymessage](https://hivesigner.com/verifymessage). Chân trang dẫn tới đó qua mục **Xác minh thông điệp**.
2. Dán token vào ô **Token xác minh** rồi chọn **Xác minh chữ ký**.

Liên kết xác minh sẽ mở đúng trang này và tự kiểm tra thông điệp.

Kết quả ghi “Chữ ký hợp lệ cho NGƯỜI_DÙNG” hoặc “Không thể xác minh chữ ký bằng các khóa của tài khoản.” Bên dưới, bạn thấy **Tác giả**, **Khóa công khai khôi phục từ chữ ký**, **Quyền khớp** (loại khóa đã ký) và **Thông điệp**.

Hivesigner đối chiếu chữ ký với những khóa mà tài khoản đang có trên mạng Hive lúc này. Thông điệp được ký bằng khóa mà tài khoản đã thay từ đó tới nay sẽ không còn xác minh được nữa.
