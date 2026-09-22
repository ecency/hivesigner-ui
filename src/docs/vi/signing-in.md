Khi một ứng dụng cho bạn đăng nhập bằng Hivesigner, nó đưa bạn tới hivesigner.com kèm một yêu cầu. Hivesigner cho thấy ai đang hỏi, họ xin gì và tài khoản nào của bạn sẽ trả lời. Bạn quyết định ngay tại đó. Ứng dụng không bao giờ nhận được khóa của bạn: nó nhận một bằng chứng về tên người dùng của bạn, được ký trong trình duyệt của bạn.

## Màn hình yêu cầu {#request-screen}

Từ trên xuống dưới, màn hình hiển thị:

- **Ứng dụng.** Hình ảnh và một tiêu đề. Khi ứng dụng xin quyền đăng bài lần đầu, tiêu đề ghi “ỨNG_DỤNG đang yêu cầu quyền truy cập tài khoản của bạn.” Còn lại, tiêu đề ghi “Đăng nhập vào ỨNG_DỤNG”. Tên trong đó do ứng dụng tự chọn.
- **Tài khoản Hive @TÀI_KHOẢN_ỨNG_DỤNG.** Tài khoản Hive thật của ứng dụng. Ứng dụng có thể tự đặt tên gì tùy ý, nhưng không đổi được tên này. Hãy kiểm tra nó.
- **Chuyển bạn đến HOST.** Trang web mà Hivesigner đưa bạn trở lại khi bạn phê duyệt.
- **Phạm vi.** Điều ứng dụng xin: [chỉ đăng nhập hoặc quyền đăng bài](/docs/signing-in#scopes).
- **Dòng tài khoản.** “Cấp quyền với tư cách” hoặc “Đăng nhập với tư cách”, kèm tài khoản mà ứng dụng sẽ nhận và liên kết **Chuyển tài khoản**. Xem [Chọn tài khoản](/docs/signing-in#choose-account).
- **Nút bấm.** **Cấp quyền** hoặc **Đăng nhập**. Nếu tài khoản đang khóa, ô **Mã mở khóa** nằm ngay phía trên, và một cú nhấp sẽ mở khóa tài khoản rồi tiếp tục.
- **Hủy.** Đưa bạn tới trang **Tài khoản** của bạn. Hivesigner không gửi gì cho ứng dụng.

Nếu trình duyệt này chưa có tài khoản nào, nút ghi **Tiếp tục**. Nó mở biểu mẫu **Thêm tài khoản** rồi đưa bạn trở lại yêu cầu. Xem [Thêm một tài khoản](/docs/accounts#add-account).

## Chỉ đăng nhập hoặc quyền đăng bài {#scopes}

Ứng dụng xin một trong hai điều này. Không có gì ở giữa.

### Chỉ đăng nhập {#sign-in-only}

**Phạm vi** hiện “Xem tên người dùng của tài khoản bạn”. Ứng dụng biết bạn là tài khoản Hive nào, được xác nhận bằng chữ ký của bạn. Nó không nhận quyền hành động thay bạn. Nút ghi **Đăng nhập**.

Một trang web không có tài khoản Hive riêng cũng có thể xin bạn đăng nhập. Màn hình của nó ghi “HOST muốn xác nhận tên người dùng Hive của bạn.” Yêu cầu như vậy luôn chỉ là đăng nhập. Hivesigner gọi trang web bằng địa chỉ của nó, vì địa chỉ là thứ duy nhất bạn kiểm tra được về nó.

### Quyền đăng bài {#posting-access}

**Phạm vi** hiện “Với quyền posting của bạn, ỨNG_DỤNG sẽ có thể:” rồi liệt kê điều đó nghĩa là gì:

- **Đăng bài và bình luận:** đăng bài viết và bình luận thay bạn.
- **Bình chọn:** bình chọn ủng hộ và phản đối bằng tài khoản của bạn.
- **Theo dõi và cập nhật bảng tin của bạn:** theo dõi, tắt tiếng và đăng lại thay bạn.

Quyền posting là phần trong tài khoản Hive của bạn phụ trách các thao tác hằng ngày. Phê duyệt tức là thêm tài khoản Hive của ứng dụng vào quyền posting của bạn. Đó là một lần cấp quyền trên blockchain Hive, không phải một danh sách nhiều quyền riêng lẻ.

## Quyền đăng bài cho phép những gì {#what-posting-access-allows}

Với quyền đăng bài, ứng dụng có thể thay bạn làm mọi việc mà khóa posting của bạn làm được:

- đăng, sửa và xóa bài viết cùng bình luận của bạn
- bình chọn
- theo dõi, tắt tiếng và đăng lại
- sửa hồ sơ của bạn
- nhận thưởng về chính ví của bạn
- những thao tác hằng ngày khác mà các ứng dụng và trò chơi trên Hive dùng tới

Nó không bao giờ có thể:

- động tới tiền của bạn: gửi HIVE hay HBD, power up hoặc power down, ủy quyền Hive Power hay dùng khoản tiết kiệm của bạn
- đổi khóa của bạn hay đổi người kiểm soát tài khoản
- cấp quyền truy cập cho ứng dụng khác

> **Cảnh báo:** Chỉ cấp quyền cho những ứng dụng bạn tin tưởng. Quyền đăng bài kéo dài cho tới khi bạn thu hồi. Nó được lưu trên blockchain Hive chứ không phải trong Hivesigner: xóa tài khoản khỏi Hivesigner không chấm dứt quyền đó.

## Lần đầu bạn cấp quyền cho một ứng dụng {#first-time}

Lần đầu bạn trao quyền đăng bài cho một ứng dụng, màn hình hiện thông báo này: “Cấp quyền lần đầu: thao tác này thêm @TÀI_KHOẢN_ỨNG_DỤNG vào quyền posting của bạn trên chuỗi và cần khóa active của bạn một lần. Tài khoản đó sẽ có thể đăng bài dưới danh nghĩa bạn cho đến khi bạn thu hồi quyền.”

Đổi người được đăng bài thay tài khoản của bạn là một thay đổi trên chính tài khoản, nên cần khóa active. Nếu thiết bị này không có, màn hình sẽ hỏi ngay tại chỗ:

1. Dán khóa active vào ô **Khóa active hoặc mật khẩu chính của @NGƯỜI_DÙNG**. Hivesigner đối chiếu nó với tài khoản của bạn trên mạng Hive rồi lưu vào thiết bị này cùng các khóa khác. Nếu bạn dán mật khẩu chính, Hivesigner chỉ giữ lại khóa active từ đó, cộng thêm khóa posting khi thiết bị này chưa có.
2. Nếu tài khoản chưa có mã mở khóa, biểu mẫu đề nghị **Bảo vệ bằng mã mở khóa (khuyến nghị)**, được tích sẵn. Nếu tài khoản đã có và Hivesigner cần dùng lại, biểu mẫu hỏi ở ô **Mã mở khóa của @NGƯỜI_DÙNG**.
3. Chọn **Thêm khóa active**, rồi chọn **Cấp quyền**.

Sau đó Hivesigner gửi thay đổi lên mạng Hive ngay từ trình duyệt của bạn. Nó đợi thay đổi xuất hiện trên blockchain rồi mới đưa bạn trở lại ứng dụng ở trạng thái đã đăng nhập. Nếu lâu quá, bạn sẽ thấy “Yêu cầu cấp quyền đã được gửi nhưng vẫn đang chờ xác nhận. Vui lòng thử lại sau giây lát.”

Sau đó khóa active vẫn nằm lại trên thiết bị này. Để ở đây chỉ còn khóa posting, xem [Chỉ thêm những khóa bạn cần](/docs/safety#only-the-keys-you-need).

## Cấp quyền cho ứng dụng từ danh mục {#directory}

Mỗi ứng dụng tại [hivesigner.com/apps](https://hivesigner.com/apps) mở ra một trang có tiêu đề “Cấp quyền cho @TÀI_KHOẢN_ỨNG_DỤNG”. Trang đó cho thấy những gì ứng dụng tự công bố về mình cùng câu “@TÀI_KHOẢN_ỨNG_DỤNG sẽ có thể đăng bài, bình luận, bình chọn và theo dõi dưới danh nghĩa @NGƯỜI_DÙNG.”

Chọn **Cấp quyền** sẽ trao ngay quyền đăng bài cho ứng dụng, giống màn hình cấp quyền lần đầu. Thao tác này cần khóa active của bạn. Không ứng dụng nào yêu cầu điều đó, nên chỉ dùng khi bạn thực sự có ý định như vậy. **Hủy** đưa bạn tới trang **Tài khoản** của bạn.

Khi tài khoản của bạn đã trao quyền đăng bài cho ứng dụng, trang ghi “Đã cấp quyền cho @TÀI_KHOẢN_ỨNG_DỤNG.” và mời bạn **Tiếp tục**.

## Quay lại một ứng dụng {#coming-back}

Khi tài khoản của bạn đã trao quyền đăng bài cho một ứng dụng, không có gì mới được cấp. Màn hình ngắn hơn:

- Tiêu đề ghi “Đăng nhập vào ỨNG_DỤNG”.
- Một dòng ghi “Bạn đã cấp quyền cho @TÀI_KHOẢN_ỨNG_DỤNG trước đây. Không có quyền mới nào được cấp.”
- Dòng tài khoản ghi “Đăng nhập với tư cách”.
- Nút ghi **Đăng nhập**.

Lúc này bạn chỉ cần khóa posting (hoặc khóa active). Nếu bạn đã thu hồi quyền của ứng dụng trong thời gian đó, màn hình cấp quyền lần đầu sẽ hiện lại.

## Chọn tài khoản {#choose-account}

Dòng tài khoản nêu tài khoản mà ứng dụng sẽ nhận. Hãy kiểm tra trước khi phê duyệt, nhất là khi bạn có nhiều tài khoản trên thiết bị này.

- Chọn **Chuyển tài khoản** để mở danh sách tài khoản của bạn ngay tại chỗ. Chọn tài khoản khác và màn hình sẽ chuyển sang tài khoản đó.
- Chọn **Thêm tài khoản khác** ở dưới danh sách để thêm tài khoản chưa có trên thiết bị này. Sau đó Hivesigner đưa bạn trở lại yêu cầu.

Ứng dụng có thể gợi ý nên dùng tài khoản nào. Nếu tài khoản đó có trên thiết bị này, Hivesigner sẽ chọn nó. Bạn vẫn có thể đổi.

## Khi Hivesigner từ chối một yêu cầu {#refused-requests}

Hivesigner không cho bạn phê duyệt yêu cầu mà nó không kiểm chứng được. Thay vào đó, màn hình hiện một trong các thông báo sau:

| Thông báo | Nghĩa là gì |
| --- | --- |
| “URL chuyển hướng của ứng dụng này chưa được đăng ký. Để bảo vệ bạn, việc đăng nhập đã bị chặn.” | Địa chỉ trả về không nằm trong danh sách mà ứng dụng khai trên tài khoản Hive của mình. |
| “@TÀI_KHOẢN_ỨNG_DỤNG không phải là tài khoản Hive, nên không có ứng dụng nào để cấp quyền. Hãy quay lại trang web và thử lại.” | Yêu cầu nêu tên một ứng dụng không tồn tại. |
| “Trang web này yêu cầu gửi thông tin đăng nhập của bạn qua một địa chỉ http:// không mã hóa. Hivesigner chỉ gửi qua https. Hãy yêu cầu trang web dùng địa chỉ bảo mật.” | Địa chỉ trả về không an toàn. |
| “Trang web này yêu cầu gửi thông tin đăng nhập của bạn tới một địa chỉ không phải URL web. Hãy quay lại trang web đó và thử lại.” | Địa chỉ trả về không phải địa chỉ web. |
| “Yêu cầu cấp quyền này không đầy đủ: không nêu tên ứng dụng hoặc URL chuyển hướng. Hãy quay lại ứng dụng và thử lại.” | Yêu cầu thiếu một số phần. |

Hãy quay lại ứng dụng và thử lại. Nếu sự cố vẫn còn, hãy chọn **Báo cáo sự cố này**. Nó gửi liên kết cùng ghi chú tùy chọn của bạn tới nhóm Hivesigner, với các thông tin bí mật đã được che đi.

Nếu Hivesigner không kết nối được với mạng Hive, nó hiện “Không thể tải thông tin tài khoản từ mạng Hive.” Hãy chọn **Thử lại**.

## Xem và thu hồi quyền của ứng dụng {#remove-access}

1. Mở [hivesigner.com/authorized-apps](https://hivesigner.com/authorized-apps). Chân trang dẫn tới đó qua mục **Ứng dụng đã cấp quyền**.
2. Trang hiện “Các ứng dụng có thể đăng bài dưới danh nghĩa @NGƯỜI_DÙNG.” cho tài khoản đang chọn, bên dưới là từng ứng dụng. Muốn xem ứng dụng của tài khoản khác, hãy chọn tài khoản đó trước ở trang **Tài khoản**.
3. Nếu tài khoản đang khóa, hãy nhập mã mở khóa rồi chọn **Mở khóa**.
4. Chọn **Thu hồi** bên cạnh ứng dụng. Khi khóa active có sẵn trên thiết bị này, quyền của ứng dụng bị gỡ ngay lập tức.

Danh sách hiển thị mọi tài khoản có thể tự mình đăng bài dưới danh nghĩa của bạn, kể cả những tài khoản bạn đã thêm bằng công cụ khác.

Thu hồi là một thay đổi trên tài khoản của bạn trong blockchain Hive, nên cần khóa active một lần. Nếu thiết bị này không có, **Thu hồi** mở một trang riêng cho ứng dụng đó (“Thu hồi quyền của @TÀI_KHOẢN_ỨNG_DỤNG”) và hỏi khóa active ngay tại đó. Trang ghi “@TÀI_KHOẢN_ỨNG_DỤNG sẽ không thể thực hiện thao tác dưới danh nghĩa @NGƯỜI_DÙNG nữa.” Hãy thêm khóa rồi chọn **Thu hồi**.

Khi bạn thu hồi quyền của một ứng dụng, Hivesigner gỡ tài khoản của ứng dụng khỏi quyền posting của tài khoản bạn (và khỏi quyền active, nếu nó cũng nằm ở đó). Từ đó ứng dụng không còn đăng bài, bình chọn hay hành động thay bạn được nữa. Nếu sau này ứng dụng lại xin quyền đăng bài, bạn sẽ thấy màn hình cấp quyền lần đầu.

Thu hồi không đăng xuất bạn khỏi trang web riêng của ứng dụng. Nếu muốn, hãy đăng xuất ở đó nữa.
