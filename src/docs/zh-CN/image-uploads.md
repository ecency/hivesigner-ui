Hive 帖子通过网址指向图片，所以应用需要一个上传图片的地方。imagehoster 是为 Hive 打造的开源图片托管程序。它可以接受那些用 Hivesigner 登录了您应用的人上传的图片：他们的访问令牌代替了用密钥所做的签名。

## 工作方式 {#how-it-works}

1. 用户用 Hivesigner 登录您的应用，并授予发布权限。您的应用收到一个访问令牌。参见[使用 OAuth2 登录](/docs/oauth2)。
2. 您的应用把图片发送到您的 imagehoster，并把该令牌放在网址中。
3. imagehoster 检查令牌和账户，保存图片，并以图片的网址作答。
4. 您的应用把网址放进帖子里。

## 自行运行 imagehoster {#run-your-own}

一个 imagehoster 只为一个应用账户配置：配置中 `[upload_limits]` 一节的 `app_account`。请只向它发送为该应用账户生成的令牌。公共实例属于别的应用：images.ecency.com 为 Ecency 的应用账户配置，images.hive.blog 为 Hive.blog 的应用账户配置。要接受您自己用户的上传，请用您的应用账户运行您自己的实例。

源码和部署指南：

- Hive 社区的 imagehoster：https://gitlab.syncad.com/hive/imagehoster
- Ecency 的 imagehoster：https://github.com/ecency/imagehoster

在配置中设置您的应用账户：

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

同一节还设置账户上传所需的最低声誉（`reputation`），以及每个账户的上传配额（每 `duration` 毫秒 `max` 次上传）。请配置 `redis_url`，配额才会生效。`max_image_size` 设置最大文件大小，以字节计。

## 上传图片 {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **令牌。** 把用户的访问令牌按 Hivesigner 交给您应用时的原样放进路径。请使用为您的应用、带发布权限登录所得到的令牌。来自不带 `client_id` 请求的纯登录令牌没有写明任何应用，会被拒绝。
- **请求体。** 发送 `multipart/form-data`，其中包含一个图片文件。无论字段名是什么，imagehoster 都取第一个文件。
- **大小。** 请发送 `Content-Length` 头。文件不得大于该实例的 `max_image_size`。

回答是 JSON。成功时它包含图片的网址：

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

失败时，imagehoster 以 HTTP 错误状态码作答。多数失败还会带上一个错误名称：

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **备注：** 令牌在网址中传输。请只通过 https 提供您的 imagehoster，并妥善保管它的访问日志。

## 示例 {#example}

下面这个浏览器函数会从文件输入框或拖放操作中上传一个文件。浏览器会替您设置 multipart 相关的请求头和长度：不要自行设置 `Content-Type`。

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
