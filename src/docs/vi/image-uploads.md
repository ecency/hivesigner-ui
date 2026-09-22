Bài viết Hive trỏ tới hình ảnh bằng URL, nên một ứng dụng cần chỗ để tải ảnh lên. imagehoster là phần mềm lưu trữ ảnh mã nguồn mở, làm riêng cho Hive. Nó có thể nhận ảnh tải lên từ những người đã đăng nhập vào ứng dụng của bạn bằng Hivesigner: token truy cập của họ thay cho một chữ ký bằng khóa.

## Cách hoạt động {#how-it-works}

1. Người dùng đăng nhập vào ứng dụng của bạn bằng Hivesigner, với quyền posting. Ứng dụng của bạn nhận một token truy cập. Xem [Đăng nhập bằng OAuth2](/docs/oauth2).
2. Ứng dụng của bạn gửi ảnh tới imagehoster của bạn, với token đó nằm trong URL.
3. imagehoster kiểm tra token và tài khoản, lưu ảnh rồi trả lời kèm URL của ảnh.
4. Ứng dụng của bạn đặt URL đó vào bài viết.

## Tự chạy imagehoster của bạn {#run-your-own}

Một imagehoster được thiết lập cho một tài khoản ứng dụng: `app_account` trong phần `[upload_limits]` của cấu hình. Hãy gửi cho nó những token tạo ra cho tài khoản ứng dụng đó. Các bản công khai thuộc về ứng dụng khác: images.ecency.com được thiết lập cho tài khoản ứng dụng của Ecency và images.hive.blog cho của Hive.blog. Để nhận ảnh tải lên từ người dùng của bạn, hãy chạy bản của riêng bạn với tài khoản ứng dụng của bạn.

Mã nguồn và hướng dẫn thiết lập:

- imagehoster của cộng đồng Hive: https://gitlab.syncad.com/hive/imagehoster
- imagehoster của Ecency: https://github.com/ecency/imagehoster

Trong cấu hình, hãy đặt tài khoản ứng dụng của bạn:

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

Cũng phần đó đặt mức uy tín tối thiểu mà một tài khoản cần để tải ảnh lên (`reputation`) và hạn mức tải lên cho mỗi tài khoản (`max` lần tải trong `duration` mili giây). Hãy cấu hình `redis_url` để hạn mức có hiệu lực. `max_image_size` đặt kích thước tệp lớn nhất, tính bằng byte.

## Tải một ảnh lên {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **Token.** Hãy đặt token truy cập của người dùng vào đường dẫn, đúng như Hivesigner đã đưa cho ứng dụng của bạn. Hãy dùng token từ một lần đăng nhập có quyền posting cho ứng dụng của bạn. Một token chỉ đăng nhập, từ yêu cầu không có `client_id`, không nêu tên ứng dụng nào và sẽ bị từ chối.
- **Thân.** Hãy gửi `multipart/form-data` với một tệp ảnh. imagehoster lấy tệp đầu tiên, bất kể tên trường là gì.
- **Kích thước.** Hãy gửi header `Content-Length`. Tệp không được lớn hơn `max_image_size` của bản cài đặt đó.

Câu trả lời là JSON. Khi thành công, nó chứa URL của ảnh:

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

Khi thất bại, imagehoster trả lời bằng một mã trạng thái lỗi HTTP. Hầu hết lỗi còn kèm một tên lỗi:

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **Lưu ý:** token đi trong URL. Hãy chỉ phục vụ imagehoster của bạn qua https và giữ kín log truy cập của nó.

## Ví dụ {#example}

Hàm trình duyệt sau tải lên một tệp từ ô chọn tệp hoặc từ thao tác kéo thả. Trình duyệt tự đặt các header multipart và độ dài cho bạn: đừng tự đặt `Content-Type`.

```js
// IMAGEHOSTER_URL is the address of your imagehoster, such as 'https://YOUR_IMAGEHOSTER'.
async function uploadImage(file, accessToken) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${IMAGEHOSTER_URL}/hs/${accessToken}`, {
    method: 'POST',
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error?.name ?? `Upload failed with status ${response.status}`);
  }
  return result.url;
}

const url = await uploadImage(input.files[0], ACCESS_TOKEN);
const markdown = `![](${url})`; // add this to the post body
```
