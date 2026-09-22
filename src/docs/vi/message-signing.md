Ứng dụng của bạn có thể yêu cầu người dùng ký một thông điệp văn bản bằng khóa posting hoặc khóa active của họ. Chữ ký chứng minh người dùng kiểm soát tài khoản. Không có gì được phát lên mạng: thông điệp không bao giờ lên blockchain. Hivesigner ký giống hệt `requestSignBuffer` của Hive Keychain, nên đoạn mã máy chủ kiểm tra chữ ký Keychain cũng kiểm tra được chữ ký Hivesigner.

## Yêu cầu một chữ ký {#request}

Đưa người dùng đến `https://hivesigner.com/sign-buffer` với các tham số truy vấn sau:

| Tham số | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `message` | Có | Đúng đoạn văn bản cần ký. Nó phải chứa nhiều hơn khoảng trắng. |
| `redirect_uri` | Có | Nơi Hivesigner gửi kết quả đến. Xem [Quy tắc callback](#callback-rules). |
| `authority` | Không | `posting` hoặc `active`, viết hoa thường thế nào cũng được (`Posting` cũng dùng được). Là `posting` khi thiếu hoặc rỗng. Mọi giá trị khác đều bị từ chối. |
| `client_id` | Không | Tài khoản ứng dụng của bạn. `clientId` cũng được đọc. Khi có nó, `redirect_uri` phải là một trong các callback của ứng dụng bạn. |
| `state` | Không | Giá trị bất kỳ. Hivesigner trả lại nguyên vẹn. |
| `account` | Không | Tài khoản mà bạn chờ đợi sẽ ký. Hivesigner chọn tài khoản đó khi nó có trên thiết bị, và bỏ qua nếu không có. `select_account` cũng được đọc. |

Hãy dựng URL bằng `URLSearchParams` để mọi giá trị đều được mã hóa:

```js
const params = new URLSearchParams({
  message: 'MESSAGE',
  authority: 'posting',
  redirect_uri: 'REDIRECT_URI',
  client_id: 'CLIENT_ID',
  state: 'STATE',
});
window.location.assign(`https://hivesigner.com/sign-buffer?${params}`);
```

### Quy tắc callback {#callback-rules}

- Callback phải là `https://`. `http://` thường chỉ hoạt động trên loopback: `localhost`, `127.0.0.1` hoặc `[::1]`.
- **Khi có `client_id`**, callback phải được đăng ký trên tài khoản ứng dụng đó và được đối chiếu như khi đăng nhập. Xem [Callback](/docs/register-app#callback-rules). Hivesigner đọc các callback của ứng dụng từ Hive khi yêu cầu mở ra, và không ký gì cho đến khi đọc được. Khi không kết nối được Hive, người dùng nhận nút **Thử lại**.
- **Khi không có `client_id`**, bất kỳ callback nào theo đúng quy tắc đầu tiên đều dùng được. Khi đó Hivesigner nêu máy chủ của callback là bên yêu cầu, ví dụ “HOST yêu cầu bạn ký một thông điệp.”

Hãy gửi `client_id` khi bạn có tài khoản ứng dụng. Khi đó người dùng thấy tên và tài khoản của ứng dụng bạn. Chỉ các callback đã đăng ký của bạn mới nhận được chữ ký.

Hivesigner từ chối yêu cầu không có thông điệp, có `authority` không xác định, thiếu callback hoặc callback không dùng được, có `client_id` không phải tài khoản Hive, hoặc có callback chưa đăng ký trên ứng dụng đó. Người dùng thấy “Không thể dùng yêu cầu ký này: cần có thông điệp, khóa posting hoặc active và một URL chuyển hướng an toàn đã đăng ký cho ứng dụng. Hãy quay lại trang web và thử lại.” và một nút **Báo cáo sự cố này**.

### Người dùng thấy gì {#what-the-user-sees}

- Một tiêu đề nêu tên ứng dụng của bạn (hoặc máy chủ của callback) và “Chuyển bạn đến HOST”.
- Toàn bộ thông điệp, đúng như nó sẽ được ký. Những ký tự có thể giấu văn bản hoặc đổi hướng chữ được hiện dưới dạng mã, chẳng hạn `\u{200B}`.
- “Sẽ được ký bằng khóa posting của bạn” hoặc “Sẽ được ký bằng khóa active của bạn”.
- Một cảnh báo: “Chữ ký của bạn chứng minh với bất kỳ ai nhìn thấy rằng @USERNAME đã ký đúng văn bản này. Chỉ ký thông điệp mà bạn hiểu.”
- **Ký** và **Hủy**. Tài khoản đang khóa sẽ hỏi mã truy cập trước.

[Yêu cầu ký thông điệp](/docs/signing#message-requests) mô tả màn hình này cho người dùng.

## Callback của bạn nhận được gì {#callback}

Khi người dùng chọn **Ký**, Hivesigner đưa họ tới callback của bạn với các tham số truy vấn sau:

| Tham số | Giá trị |
| --- | --- |
| `signature` | Chữ ký, dưới dạng chuỗi thập lục phân 130 ký tự |
| `public_key` | Khóa công khai của khóa đã ký, chẳng hạn `STM...` |
| `username` | Tài khoản đã ký |
| `authority` | `posting` hoặc `active` |
| `state` | `state` của bạn, khi yêu cầu có kèm (kể cả giá trị rỗng) |

Hivesigner thêm chúng vào truy vấn của callback, sau `?` hoặc `&` và trước mọi `#fragment`. Truy vấn của chính bạn vẫn giữ nguyên.

```text
https://YOUR_APP/signed?signature=SIGNATURE&public_key=PUBLIC_KEY&username=USERNAME&authority=posting&state=STATE
```

Khi người dùng chọn **Hủy**, Hivesigner mở danh sách tài khoản của họ. Callback của bạn không nhận được gì.

> **Cảnh báo:** ai cũng có thể mở callback của bạn với các giá trị bịa ra. Hãy coi mọi tham số chỉ là lời khai cho đến khi máy chủ của bạn đã kiểm tra chữ ký.

## Xác minh chữ ký {#verify}

Hãy kiểm tra chữ ký trên máy chủ của bạn:

1. Giữ thông điệp bạn đã yêu cầu trên máy chủ của bạn, kèm `state` của nó. Đừng tin bản sao quay về từ trình duyệt.
2. Băm thông điệp: sha256 trên các byte UTF-8 của nó.
3. Khôi phục khóa công khai từ chữ ký và bản băm đó.
4. Tải tài khoản từ Hive. Kiểm tra rằng khóa khôi phục được thuộc về quyền mà bạn đã yêu cầu, với trọng số đủ để ký một mình.
5. Kiểm tra `state` đúng là giá trị bạn đã phát ra. Chấp nhận mỗi thông điệp một lần.

Ví dụ này dùng dhive (https://www.npmjs.com/package/@hiveio/dhive):

```js
import { Client, Signature, cryptoUtils } from '@hiveio/dhive';

const hive = new Client(['https://api.hive.blog']);

// message and authority: what you asked for, from your own records.
// signature and username: from the callback.
export async function verifySignBuffer({ message, authority, signature, username }) {
  let recovered;
  try {
    const hash = cryptoUtils.sha256(message); // sha256 over the UTF-8 bytes
    recovered = Signature.fromString(signature).recover(hash).toString();
  } catch {
    return false; // not a valid signature
  }
  const [account] = await hive.database.getAccounts([username]);
  if (!account) return false;
  const auth = account[authority]; // 'posting' or 'active'
  return auth.key_auths.some(
    ([key, weight]) => key === recovered && weight >= auth.weight_threshold,
  );
}
```

Cùng cách kiểm tra đó cũng đúng với chữ ký từ `requestSignBuffer` của Hive Keychain. Hãy đối chiếu với khóa bạn khôi phục được: `public_key` trong callback chỉ là gợi ý.

## Những thông điệp Hivesigner không ký {#refused-messages}

Một thông điệp là đối tượng JSON có khóa `signed_message` thì mang hình dạng của một token Hivesigner. Ký nó sẽ cho bên yêu cầu quyền truy cập vào tài khoản của người dùng. Hivesigner không bao giờ ký thông điệp như vậy. Nó nói với người dùng “Thông điệp này là một token của Hivesigner. Ký nó sẽ cho trang web quyền truy cập vào tài khoản của bạn, nên không thể ký.”

Hãy dùng văn bản thuần, hoặc JSON không có khóa `signed_message`. Hãy nói rõ chữ ký dùng để làm gì và thêm một giá trị mà bạn tạo ra một lần, ví dụ:

```text
Confirm your account for YOUR_APP
Account: USERNAME
Nonce: NONCE
```

## Công cụ Ký thông điệp {#sign-message-tool}

Mọi người cũng có thể tự ký một thông điệp tại https://hivesigner.com/signmessage (**Ký thông điệp**) và kiểm tra một thông điệp tại https://hivesigner.com/verifymessage (**Xác minh thông điệp**). Xem [Tự ký một thông điệp](/docs/signing#sign-message).

Công cụ đó ký khác với `/sign-buffer`. Nó ký phần thân của một token Hivesigner chứa thông điệp, tài khoản và thời gian. Nó chia sẻ kết quả dưới dạng **Token xác minh**. Hãy kiểm tra token như vậy trên trang **Xác minh thông điệp** hoặc theo cách mô tả trong [Tự kiểm tra](/docs/tokens#check-it-yourself), chứ không phải bằng đoạn mã ở trên.
