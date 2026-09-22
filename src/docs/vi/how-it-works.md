Hivesigner cho phép mọi người dùng tài khoản Hive của họ trong ứng dụng của bạn mà không đưa khóa cho ứng dụng. Nó có hai phần: trình ký trong trình duyệt tại https://hivesigner.com và API tại `https://hivesigner.com/api/`. Trang này giải thích mỗi phần làm gì và hai cách một ứng dụng sử dụng chúng.

## Trình ký trong trình duyệt {#browser-signer}

Trình ký trong trình duyệt chính là trang web Hivesigner. Mọi người thêm tài khoản Hive của họ vào đó. Khóa của họ ở lại trong trình duyệt của chính họ: Hivesigner không gửi khóa nào đến bất kỳ máy chủ nào. Ứng dụng của bạn không bao giờ thấy khóa.

Trình ký ký ba loại thứ, và mỗi lần người dùng đều thấy trước thứ mình đang ký:

- **Token đăng nhập.** Ứng dụng của bạn đưa một người đến Hivesigner để đăng nhập. Hivesigner hiển thị tên ứng dụng của bạn và thứ nó yêu cầu. Khi người dùng phê duyệt, Hivesigner ký bằng khóa của họ một câu ngắn nêu tên tài khoản của họ và ứng dụng của bạn. Câu đã ký đó chính là token mà ứng dụng của bạn nhận được. Xem [Đăng nhập bằng OAuth2](/docs/oauth2) và [Token](/docs/tokens).
- **Giao dịch.** Liên kết ký mở một giao dịch để xem lại. Khi người dùng phê duyệt, Hivesigner ký giao dịch bằng khóa mà nó cần. Sau đó nó gửi giao dịch lên mạng Hive từ trình duyệt, trừ khi liên kết chỉ yêu cầu chữ ký. Xem [Liên kết ký](/docs/sign-links).
- **Thông điệp.** Ứng dụng của bạn có thể yêu cầu người dùng ký một đoạn văn bản bằng khóa của họ để chứng minh họ kiểm soát tài khoản. Xem [Ký thông điệp](/docs/message-signing).

## API {#api}

API phát lên mạng các thao tác ở mức posting cho người dùng đã đăng nhập vào ứng dụng của bạn: bài viết và bình luận, bình chọn, theo dõi và các thao tác `custom_json` khác, nhận thưởng và cập nhật hồ sơ. Ứng dụng của bạn gửi các thao tác kèm token của người dùng. API kiểm tra token, ký giao dịch bằng khóa posting của tài khoản @hivesigner rồi phát nó lên Hive.

API cũng trả về tài khoản của người dùng đã đăng nhập, đổi mã lấy token và liệt kê các ứng dụng dùng Hivesigner. Xem [REST API](/docs/api).

## Chuỗi quyền posting {#authority-chain}

Trên Hive, một tài khoản có thể cho phép tài khoản khác hành động với quyền posting của mình. API dựa vào hai lần cấp quyền như vậy:

```text
@alice (the user)
  posting authority includes  @myapp (your app account)
                                posting authority includes  @hivesigner (the API)

The API signs with the @hivesigner posting key.
Hive accepts that signature for @alice, through @myapp.
```

1. **Người dùng thêm tài khoản ứng dụng của bạn vào quyền posting của họ.** Màn hình cấp quyền làm việc này trong lần đầu người dùng phê duyệt quyền posting cho ứng dụng của bạn. Nó cần khóa active của người dùng một lần.
2. **Tài khoản ứng dụng của bạn thêm @hivesigner vào quyền posting của nó.** Bạn làm việc này một lần, khi [đăng ký ứng dụng](/docs/register-app#grant-hivesigner).

Trước khi phát, API kiểm tra cả hai lần cấp quyền đều còn hiệu lực. Nó chỉ phát các thao tác do chính người dùng nêu trong token là tác giả.

Người dùng có thể gỡ quyền truy cập của ứng dụng bạn bất cứ lúc nào tại https://hivesigner.com/authorized-apps. Sau đó API không còn đăng bài thay họ qua ứng dụng của bạn nữa.

## Hai cách tích hợp {#two-ways-to-integrate}

### Đăng nhập, rồi phát qua API {#sign-in-and-api}

```text
1. Your app     sends the user to https://hivesigner.com/oauth2/authorize?client_id=...
2. The user     reviews the request in Hivesigner and approves it
3. Hivesigner   redirects to REDIRECT_URI?access_token=...&expires_in=604800&username=alice
4. Your app     POSTs the token and the operations to https://hivesigner.com/api/broadcast
5. The API      signs with the @hivesigner posting key and broadcasts to Hive
```

Người dùng phê duyệt một lần. Sau đó ứng dụng của bạn có thể bình chọn, bình luận và đăng bài thay họ mà không cần hỏi lại, cho đến khi token hết hạn hoặc người dùng gỡ quyền truy cập. Hãy dùng cách này cho các thao tác xã hội hằng ngày.

Bạn cần một tài khoản ứng dụng với các callback đã đăng ký và quyền cho @hivesigner. Xem [Đăng ký ứng dụng](/docs/register-app). Nếu bạn chỉ muốn biết người dùng là ai, xem [Đăng nhập không cần quyền posting](/docs/login-only).

### Liên kết ký {#sign-links}

```text
1. Your app     sends the user to https://hivesigner.com/sign/... with the transaction in the link
2. The user     reviews the transaction in Hivesigner and approves it
3. Hivesigner   signs it with the user's own key in the browser and broadcasts it
4. Hivesigner   redirects to your callback, when the link names one
```

Người dùng thấy mọi giao dịch trước khi nó được ký. Liên kết ký bao quát 41 thao tác Hive, gồm cả chuyển khoản và những hành động ví khác cần khóa active. API không bao giờ xử lý những thao tác đó. Bạn không cần tài khoản ứng dụng cho liên kết ký. Xem [Liên kết ký](/docs/sign-links).

### Chọn cách nào {#which-to-choose}

- **Các thao tác đăng bài thường xuyên** (bình chọn, bình luận, theo dõi): đăng nhập bằng OAuth2, rồi dùng API.
- **Thao tác ví** hoặc bất cứ thứ gì cần khóa active: dùng liên kết ký.
- **Cả hai**: nhiều ứng dụng đăng nhập cho người dùng bằng OAuth2 cho các tính năng xã hội và dùng liên kết ký cho chuyển khoản.
- **Chỉ cần danh tính người dùng**: xem [Đăng nhập không cần quyền posting](/docs/login-only).

## Mã nguồn {#source-code}

Hivesigner là mã nguồn mở:

- Trình ký trong trình duyệt: https://github.com/ecency/hivesigner-ui
- API: https://github.com/ecency/hivesigner-api
- JavaScript SDK (gói npm `hivesigner`): https://github.com/ecency/hivesigner-sdk. Xem [SDK](/docs/sdk).
