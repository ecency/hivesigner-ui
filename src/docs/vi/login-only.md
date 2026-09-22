Một số ứng dụng chỉ cần biết một người là ai trên Hive. Chúng không bao giờ đăng bài, bình chọn hay phát bất cứ thứ gì thay họ. Hivesigner có thể đăng nhập cho người dùng vào một ứng dụng như vậy mà không cần bất kỳ quyền posting nào. Người dùng chứng minh họ kiểm soát một tài khoản Hive. Ứng dụng của bạn biết được tên tài khoản đó. Trang này cho thấy hai cách làm và cách kiểm tra kết quả một cách an toàn.

## Hai cách {#two-ways}

- **Có tài khoản ứng dụng:** ứng dụng của bạn có tài khoản Hive riêng và yêu cầu `scope=login`. Token nêu tên ứng dụng của bạn.
- **Không có tài khoản ứng dụng:** một trang web không có tài khoản Hive chỉ gửi `redirect_uri`. Token không nêu tên ứng dụng nào. Trang web của bạn tự kiểm tra nó.

Cả hai cách đều không cần người dùng hay tài khoản ứng dụng của bạn cấp quyền, nên không có gì thay đổi trên tài khoản của người dùng. Hivesigner ký lần đăng nhập bằng khóa posting, hoặc bằng khóa active khi thiết bị không có khóa posting cho tài khoản đó.

## Có tài khoản ứng dụng {#app-account}

1. [Đăng ký ứng dụng](/docs/register-app): tạo tài khoản Hive cho nó và liệt kê các callback. Bạn không cần khóa bí mật của client và không cần quyền cho @hivesigner.
2. Đưa người dùng đến:

   ```text
   https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=login&state=STATE
   ```

3. Người dùng thấy “Đăng nhập vào APP” với **Phạm vi** ghi “Xem tên người dùng của tài khoản bạn”. Họ chọn **Đăng nhập**.
4. Hivesigner chuyển hướng tới callback của bạn:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

5. [So khớp `state`](/docs/oauth2#state), rồi kiểm tra token. Đây là token `login` có nêu tên ứng dụng của bạn, nên một trong hai cách sau đều được:
   - gọi [`GET /api/me`](/docs/api#me) với nó, API trả về tài khoản trong `user` và `scope` là `["login"]`, sau đó giải mã token và kiểm tra `type` cùng `app` ([Hỏi API](/docs/tokens#check-with-the-api));
   - hoặc [tự kiểm tra](/docs/tokens#check-it-yourself) với `type: 'login'` và tên ứng dụng của bạn.

Token `login` không thể phát giao dịch: `/api/broadcast` từ chối mọi thao tác gửi kèm nó.

## Không có tài khoản ứng dụng {#no-app-account}

1. Đưa người dùng đến URL cấp quyền với một `redirect_uri` và không có `client_id`:

   ```text
   https://hivesigner.com/oauth2/authorize?redirect_uri=REDIRECT_URI&state=STATE
   ```

   Callback phải là `https://`, hoặc `http://` trên loopback (`localhost`, `127.0.0.1`, `[::1]`). Không có danh sách nào để đăng ký nó. Hivesigner bỏ qua `scope` và `response_type` ở đây: câu trả lời luôn là một token đăng nhập.

2. Người dùng thấy “HOST muốn xác nhận tên người dùng Hive của bạn.”, trong đó HOST là máy chủ của callback. Họ chọn **Đăng nhập**.
3. Hivesigner chuyển hướng tới callback của bạn:

   ```text
   REDIRECT_URI?state=STATE&access_token=TOKEN&expires_in=604800&username=USERNAME
   ```

4. [So khớp `state`](/docs/oauth2#state), rồi tự kiểm tra token. API không chấp nhận token không nêu tên ứng dụng, nên máy chủ của bạn tự xác minh chữ ký với các khóa của tài khoản. Xem [Tự kiểm tra](/docs/tokens#check-it-yourself), với `type: 'login'` và không có `app`.

Khi callback không phải là một địa chỉ web, hoặc là `http://` thường ngoài loopback, Hivesigner từ chối yêu cầu và nói cho người dùng biết vì sao.

## Nên dùng cách nào {#which-one}

| | Có tài khoản ứng dụng | Không có tài khoản ứng dụng |
| --- | --- | --- |
| Người dùng thấy gì | Tên, ảnh và tài khoản Hive của ứng dụng bạn | Chỉ máy chủ của trang web bạn |
| Thiết lập | Một tài khoản Hive với các callback đã liệt kê | Không cần |
| Token nêu tên | Ứng dụng của bạn | Không ứng dụng nào |
| Kiểm tra token bằng | `/api/me` hoặc mã của bạn | Mã của bạn |
| Quyền posting về sau | Cùng tài khoản: yêu cầu `posting` và [cấp quyền cho @hivesigner](/docs/register-app#grant-hivesigner) | Cần có tài khoản ứng dụng trước |

Hãy dùng tài khoản ứng dụng khi có thể. Người dùng thấy tên và ảnh của ứng dụng bạn. Máy chủ của bạn có thể từ chối token được tạo cho ứng dụng khác. Về sau bạn có thể chuyển sang quyền posting với cùng tài khoản đó.

Hãy dùng cách thứ hai khi trang web của bạn không có tài khoản Hive và không muốn có.

## Kiểm tra lần đăng nhập một cách an toàn {#check-safely}

- **Ràng buộc yêu cầu bằng `state`.** Tạo một giá trị ngẫu nhiên cho mỗi lần đăng nhập, lưu vào phiên của người dùng, so khớp trên callback và chỉ dùng một lần. Xem [Bảo vệ yêu cầu bằng state](/docs/oauth2#state).
- **Kiểm tra loại.** Chỉ chấp nhận `signed_message.type` là `login`. Mã hay token làm mới không phải là một lần đăng nhập.
- **Kiểm tra ứng dụng.** Với tài khoản ứng dụng, `signed_message.app` phải là ứng dụng của bạn. Nếu không có tài khoản ứng dụng thì không được có trường `app`.
- **Kiểm tra tuổi.** Bạn kiểm tra token ngay sau khi chuyển hướng, nên chỉ chấp nhận nó trong vài phút kể từ `timestamp` (ví dụ 5 phút, cộng thêm một phút cho lệch đồng hồ).
- **Dùng mỗi token một lần.** Sau khi kiểm tra thành công, hãy bắt đầu phiên của riêng bạn (ví dụ một cookie httpOnly) và bỏ token Hivesigner đi. Hãy ghi lại các token đã chấp nhận cho đến khi chúng quá cũ để qua được bước kiểm tra tuổi. Từ chối bất kỳ token nào bạn thấy lại.
- **Giữ token ngoài log.** Nó đến trong chuỗi truy vấn của callback. Xem [Giữ token an toàn](/docs/tokens#keep-tokens-safe).

## Ví dụ {#examples}

Các trang như https://hivesearcher.com và https://openhive.chat cho phép mọi người đăng nhập bằng tài khoản Hive để dùng những tính năng nằm ngoài chuỗi, như tìm kiếm và trò chuyện. Họ chỉ cần biết người đó là ai, không cần gì hơn.
