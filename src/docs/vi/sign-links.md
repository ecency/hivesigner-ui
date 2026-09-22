Liên kết ký mở một giao dịch Hive trong Hivesigner. Người dùng xem lại, phê duyệt bằng khóa của chính mình và Hivesigner phát nó lên mạng từ trình duyệt của họ. Sau đó Hivesigner có thể đưa người dùng về ứng dụng của bạn kèm ID giao dịch. Liên kết ký không cần tài khoản ứng dụng và không cần token. Chúng bao quát cả 41 thao tác mà Hivesigner hỗ trợ, gồm cả chuyển khoản và những hành động khác cần khóa active.

## Liên kết ký hoạt động thế nào {#how-it-works}

1. Ứng dụng của bạn dựng một liên kết chứa một hoặc nhiều thao tác.
2. Người dùng mở liên kết. Hivesigner hiển thị từng thao tác bằng lời lẽ đơn giản trên màn hình “Xác nhận giao dịch”, kèm khóa mà nó cần.
3. Người dùng phê duyệt. Hivesigner ký giao dịch trong trình duyệt bằng khóa của tài khoản đang được chọn trong Hivesigner. Rồi nó gửi giao dịch lên mạng Hive.
4. Khi liên kết nêu một callback, Hivesigner đưa người dùng đến đó kèm ID giao dịch.

Ứng dụng của bạn không bao giờ thấy khóa. Bất kỳ trang web nào cũng có thể tạo liên kết ký: không cần gửi `client_id` nào cả.

## Các dạng liên kết {#link-forms}

Hivesigner đọc hai loại liên kết ký: liên kết mã hóa và liên kết cũ.

### Liên kết mã hóa {#encoded-links}

Liên kết mã hóa mang các thao tác dưới dạng JSON, mã hóa base64url. Nó dùng dạng `hive://sign/...` của gói `hive-uri`, với `hive://` được thay bằng `https://hivesigner.com/`.

| Dạng | `B64U` chứa gì |
| --- | --- |
| `https://hivesigner.com/sign/op/B64U` | Một thao tác: `["vote", {...}]` |
| `https://hivesigner.com/sign/ops/B64U` | Một danh sách thao tác: `[["transfer", {...}], ["transfer", {...}]]` |
| `https://hivesigner.com/sign/tx/B64U` | Cả một giao dịch, với phần đầu của chính nó |

`B64U` là đoạn văn bản JSON, mã hóa thành UTF-8 rồi thành base64, với `+` thay bằng `-`, `/` thay bằng `_` và phần đệm `=` thay bằng `.`.

Với `op` và `ops`, Hivesigner tự dựng giao dịch quanh các thao tác. Nó tự điền khối tham chiếu và thời hạn.

Với `tx`, Hivesigner giữ nguyên `ref_block_num`, `ref_block_prefix` và `expiration` của chính giao dịch. Nó cũng giữ các chữ ký mà giao dịch đã mang sẵn. Nhờ vậy nhiều tài khoản có thể lần lượt ký cùng một giao dịch, cho một tài khoản do nhiều người cùng kiểm soát. Hivesigner từ chối giao dịch có danh sách `extensions` không rỗng.

> **Lưu ý:** Hivesigner chuẩn hóa một số giá trị trước khi ký, chẳng hạn số tiền và những trường để nguyên giá trị mặc định. Giao dịch đã ký vì thế có thể mang ID khác với giao dịch bạn dựng. Hãy đọc ID từ callback.

### Liên kết cũ {#legacy-links}

Liên kết cũ nêu tên một thao tác trong đường dẫn và đặt các trường của nó trong chuỗi truy vấn:

```text
https://hivesigner.com/sign/vote?author=AUTHOR&permlink=PERMLINK&weight=10000
https://hivesigner.com/sign/transfer?to=RECIPIENT&amount=1.000%20HIVE&memo=MEMO
https://hivesigner.com/sign/transfer-to-vesting?amount=10.000%20HIVE
```

- Viết tên thao tác theo snake case (`transfer_to_vesting`), camel case (`transferToVesting`) hoặc kebab case (`transfer-to-vesting`).
- Đưa mỗi trường thành một tham số truy vấn mang đúng tên trường. Hãy mã hóa mọi giá trị cho URL.
- Viết danh sách và đối tượng dưới dạng JSON, ví dụ `required_posting_auths=["alice"]`. Danh sách ID hay tên cũng có thể ngăn cách bằng dấu phẩy: `proposal_ids=379,380`.
- Viết giá trị luận lý là `true` hoặc `false`.

Liên kết cũ chỉ chứa một thao tác. Nếu cần nhiều hơn, hãy dùng liên kết mã hóa.

### Giá trị của các trường {#field-values}

Những quy tắc này áp dụng cho mọi dạng:

- **Giá trị mặc định.** Trường bạn bỏ qua sẽ nhận giá trị mặc định của nó. Tài khoản thực hiện hành động (`voter`, `from`, `owner` và các trường tương tự) mặc định là tài khoản ký. `weight` của một lượt bình chọn mặc định là `10000` (100%).
- **Số tiền** gồm một con số và một ký hiệu: `1.000 HIVE`, `0.500 HBD` hoặc `100.000000 VESTS`. Hivesigner viết HIVE và HBD với 3 chữ số thập phân, còn VESTS với 6.
- **Hive Power.** Trường nhận VESTS cũng nhận số tiền theo HP, chẳng hạn `100 HP`. Hivesigner quy đổi sang VESTS theo tỷ giá hiện tại trước khi người dùng có thể phê duyệt.
- **`__signer`** ở bất kỳ đâu trong một giá trị sẽ trở thành tên của tài khoản ký. Ví dụ, một `custom_json` theo dõi có thể nêu `__signer` làm người theo dõi ngay trong `json` của nó.
- **Số nguyên** phải là số nguyên nằm trong khoảng mà chuỗi chấp nhận, chẳng hạn từ `-10000` đến `10000` cho `weight` của một lượt bình chọn.

Hivesigner từ chối cả liên kết khi một giá trị không hợp với trường của nó, khi thao tác không được biết đến, hoặc khi liên kết không chứa thao tác nào. Người dùng thấy “Rất tiếc, đã xảy ra lỗi. Dữ liệu được cung cấp không hợp lệ.” và không có gì được ký.

## Tham số {#parameters}

Hãy thêm những tham số này vào chuỗi truy vấn của bất kỳ liên kết ký nào:

| Tham số | Ý nghĩa |
| --- | --- |
| `cb` | URL callback, mã hóa base64url. Đây là thứ mà `hive-uri` viết ra cho tùy chọn `callback` của nó. |
| `redirect_uri` | URL callback dưới dạng văn bản mã hóa URL thông thường. Liên kết cũ dùng tham số này. Liên kết mã hóa dùng nó khi không có `cb`. |
| `nb` | Chỉ ký. Hivesigner ký giao dịch mà không phát lên mạng. Hãy đặt `{{sig}}` trong callback để nhận chữ ký (xem [Chỗ thay thế trong callback](#callback-placeholders)). Giá trị nào cũng được, kể cả giá trị rỗng (`nb=`). |
| `s` | Tài khoản phải ký. Khi một tài khoản khác đang được chọn, Hivesigner yêu cầu người dùng chuyển sang tài khoản này. Nó không ký bằng bất kỳ tài khoản nào khác. |

Hãy dùng callback `https://`. Hivesigner bỏ qua callback không phải là URL `http` hoặc `https` và khi đó sẽ ở lại màn hình kết quả của chính nó.

Hivesigner chọn khóa dựa trên các thao tác. Không có tham số nào để chọn khóa: trên liên kết ký, Hivesigner bỏ qua `authority` (và tham số `a` của `hive-uri`). Xem [Liên kết cần khóa nào](#which-key).

### Chỗ thay thế trong callback {#callback-placeholders}

Sau khi người dùng phê duyệt, Hivesigner điền các chỗ thay thế sau trong callback:

| Chỗ thay thế | Giá trị |
| --- | --- |
| `{{id}}` | ID giao dịch |
| `{{sig}}` | Chữ ký, với liên kết chỉ ký (`nb`) |
| `{{block}}` | Để trống |
| `{{txn}}` | Để trống |
| `{{data}}` | Để trống |

Một callback không có chỗ thay thế nào trong số này sẽ được thêm ID giao dịch dưới dạng `id`, sau `?` hoặc `&`:

```text
https://YOUR_APP/done           becomes  https://YOUR_APP/done?id=TRANSACTION_ID
https://YOUR_APP/done?step=2    becomes  https://YOUR_APP/done?step=2&id=TRANSACTION_ID
https://YOUR_APP/tx/{{id}}      becomes  https://YOUR_APP/tx/TRANSACTION_ID
```

Hivesigner chuyển hướng ngay khi một node Hive nhận giao dịch. Giao dịch có thể chưa nằm trong khối. Hãy tra cứu nó theo ID khi bạn cần biết nó đã được đưa vào khối.

Callback của bạn không được gọi khi mạng từ chối giao dịch (người dùng thấy lỗi) hoặc khi người dùng rời đi mà không phê duyệt.

## Dựng một liên kết {#build-a-link}

### Với hive-uri {#with-hive-uri}

Gói `hive-uri` (https://www.npmjs.com/package/hive-uri) mã hóa các thao tác thành liên kết. Hãy dùng phiên bản 0.2.8 trở lên, phiên bản mã hóa đúng mọi văn bản Unicode.

```bash
npm install hive-uri
```

```js
import { encodeOp, encodeOps } from 'hive-uri';

// One vote. __signer becomes the account that signs.
const vote = encodeOp(
  ['vote', { voter: '__signer', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
  { callback: 'https://YOUR_APP/voted?tx={{id}}' },
);

// Two transfers in one transaction.
const payout = encodeOps(
  [
    ['transfer', { from: '__signer', to: 'RECIPIENT_1', amount: '1.000 HIVE', memo: 'MEMO' }],
    ['transfer', { from: '__signer', to: 'RECIPIENT_2', amount: '2.000 HIVE', memo: 'MEMO' }],
  ],
  { callback: 'https://YOUR_APP/paid' },
);

const voteLink = vote.replace('hive://', 'https://hivesigner.com/');
const payoutLink = payout.replace('hive://', 'https://hivesigner.com/');
```

Đối tượng tùy chọn nhận `callback` (được viết thành `cb`), `no_broadcast: true` (được viết thành `nb`) và `signer` (được viết thành `s`). `encodeTx` làm điều tương tự cho cả một giao dịch.

### Với JavaScript SDK {#with-the-sdk}

Gói `hivesigner` có `sendOperation`, `sendOperations` và `sendTransaction`. Chúng nhận cùng bộ đối số như các hàm mã hóa của `hive-uri` và trả về liên kết `https://hivesigner.com/sign/...`:

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

Trong TypeScript, kiểu dữ liệu bắt buộc phải có đối số thứ ba: hãy truyền `undefined` để nhận lại liên kết. Trong trình duyệt, một hàm truyền làm đối số thứ ba sẽ khiến chúng mở liên kết trong tab mới thay vì trả về nó. Xem [SDK](/docs/sdk#sign-links).

### Không cần viết mã {#signs-page}

https://hivesigner.com/signs (“Ký giao dịch”) liệt kê mọi thao tác được hỗ trợ cùng một biểu mẫu cho các trường của nó. Nó dựng một liên kết `/sign/op/` rồi mở liên kết đó.

## Liên kết cần khóa nào {#which-key}

Mỗi thao tác cần một khóa: posting, active hoặc owner. [Bảng bên dưới](#supported-operations) liệt kê chúng. Ba thao tác phụ thuộc vào giá trị của chính chúng:

- `custom_json` cần khóa active khi `required_auths` nêu tên một tài khoản. Nếu không thì cần khóa posting.
- `account_update` cần khóa owner khi nó đặt `owner`. Nếu không thì cần khóa active.
- `account_update2` cần khóa owner khi nó đặt `owner`. Nó cần khóa active khi đặt `active`, `posting`, `memo_key` hoặc `json_metadata`. Nếu chỉ có `posting_json_metadata` thì nó cần khóa posting.

Hivesigner ký một liên kết bằng một khóa duy nhất, nên mọi thao tác trong một liên kết phải cần cùng một khóa. Hivesigner từ chối ký liên kết trộn lẫn chúng và nói cho người dùng biết vì sao. Hãy gửi những thao tác như vậy trong các liên kết riêng.

Khi tài khoản đang chọn không có khóa đó trên thiết bị, Hivesigner cho biết thiếu khóa nào và đề nghị thêm vào. Xem [Khi thiếu khóa](/docs/signing#missing-key).

## Người dùng thấy gì {#what-the-user-sees}

- Một màn hình có tiêu đề “Xác nhận giao dịch”, với một thẻ cho mỗi thao tác: bản tóm tắt bằng lời lẽ đơn giản, khóa mà nó cần và các giá trị mà nó mang.
- “Bạn sẽ được chuyển hướng đến HOST.” khi liên kết có callback. Hãy dùng callback trên chính trang web của bạn, để người dùng nhận ra máy chủ đó.
- Một cảnh báo khi một thao tác hành động dưới danh nghĩa tài khoản khác với tài khoản ký.
- **Phê duyệt**, hoặc **Ký** với liên kết chỉ ký. Tài khoản đang khóa sẽ hỏi mã truy cập trước.
- Sau khi phát lên mạng, “Giao dịch đã được phát lên mạng thành công” kèm ID giao dịch. Rồi chuyển hướng tới callback của bạn.

[Xem lại và ký](/docs/signing#confirm-screen) mô tả màn hình này cho người dùng.

## Các thao tác được hỗ trợ {#supported-operations}

Hivesigner ký 41 thao tác sau, theo tên của chúng trên chuỗi. Mọi thứ khác đều bị từ chối. Tên ở đây là tên mà Hivesigner hiển thị trên màn hình xác nhận.

| Thao tác | Khóa | Tên |
| --- | --- | --- |
| `transfer` | Active | Chuyển khoản |
| `recurrent_transfer` | Active | Chuyển khoản định kỳ |
| `delegate_vesting_shares` | Active | Ủy quyền Hive Power |
| `transfer_to_vesting` | Active | Power Up |
| `set_withdraw_vesting_route` | Active | Đặt tuyến nhận Power Down |
| `withdraw_vesting` | Active | Power Down |
| `transfer_to_savings` | Active | Chuyển vào tiết kiệm |
| `transfer_from_savings` | Active | Chuyển từ tiết kiệm |
| `cancel_transfer_from_savings` | Active | Hủy chuyển từ tiết kiệm |
| `convert` | Active | Chuyển đổi HBD sang HIVE |
| `collateralized_convert` | Active | Chuyển đổi HIVE sang HBD |
| `account_witness_vote` | Active | Bỏ phiếu nhân chứng |
| `witness_update` | Active | Cập nhật nhân chứng |
| `witness_set_properties` | Active | Đặt thuộc tính nhân chứng |
| `account_witness_proxy` | Active | Proxy quản trị |
| `claim_account` | Active | Nhận tín dụng tạo tài khoản |
| `account_create` | Active | Tạo tài khoản |
| `create_claimed_account` | Active | Tạo tài khoản bằng tín dụng tài khoản |
| `vote` | Posting | Bình chọn |
| `limit_order_create` | Active | Tạo lệnh giới hạn |
| `limit_order_create2` | Active | Tạo lệnh giới hạn |
| `limit_order_cancel` | Active | Hủy lệnh giới hạn |
| `claim_reward_balance` | Posting | Nhận phần thưởng |
| `comment` | Posting | Bài viết hoặc bình luận |
| `comment_options` | Posting | Tùy chọn bài viết hoặc bình luận |
| `custom_json` | Posting, hoặc Active khi có đặt `required_auths` | Thao tác tùy chỉnh |
| `delete_comment` | Posting | Xóa bình luận |
| `account_update` | Active, hoặc Owner khi có đặt `owner` | Cập nhật tài khoản (active) |
| `account_update2` | Posting, Active hoặc Owner, tùy theo trường | Cập nhật tài khoản (posting) |
| `change_recovery_account` | Owner | Đổi tài khoản khôi phục |
| `create_proposal` | Active | Tạo đề xuất |
| `remove_proposal` | Active | Xóa đề xuất |
| `update_proposal_votes` | Active | Cập nhật bình chọn đề xuất |
| `update_proposal` | Active | Cập nhật đề xuất |
| `escrow_transfer` | Active | Chuyển ký quỹ |
| `escrow_approve` | Active | Phê duyệt ký quỹ |
| `escrow_dispute` | Active | Tranh chấp ký quỹ |
| `escrow_release` | Active | Giải phóng ký quỹ |
| `account_create_with_delegation` | Active | Tạo tài khoản kèm ủy quyền |
| `request_account_recovery` | Active | Yêu cầu khôi phục tài khoản |
| `recover_account` | Owner | Khôi phục tài khoản |
