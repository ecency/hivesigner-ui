Hive의 글은 이미지를 URL로 가리키므로, 앱에는 이미지를 올릴 곳이 필요합니다. imagehoster는 Hive를 위해 만들어진 오픈 소스 이미지 호스팅입니다. Hivesigner로 여러분의 앱에 로그인한 사람들의 업로드를 받을 수 있습니다. 그 사람들의 액세스 토큰이 키로 한 서명을 대신합니다.

## 동작 방식 {#how-it-works}

1. 사용자가 게시 접근 권한과 함께 Hivesigner로 여러분의 앱에 로그인합니다. 여러분의 앱은 액세스 토큰을 받습니다. [OAuth2로 로그인](/docs/oauth2)을 보세요.
2. 여러분의 앱은 그 토큰을 URL에 넣어 이미지를 여러분의 imagehoster로 보냅니다.
3. imagehoster는 토큰과 계정을 확인하고 이미지를 저장한 뒤 그 URL로 답합니다.
4. 여러분의 앱은 그 URL을 글에 넣습니다.

## 자신의 imagehoster 운영하기 {#run-your-own}

imagehoster는 하나의 앱 계정을 위해 설정합니다. 설정의 `[upload_limits]` 항목에 있는 `app_account`입니다. 그 앱 계정을 위해 만들어진 토큰을 보내세요. 공개 인스턴스는 다른 앱의 것입니다. images.ecency.com은 Ecency의 앱 계정용, images.hive.blog은 Hive.blog용으로 설정되어 있습니다. 여러분 사용자들의 업로드를 받으려면 여러분의 앱 계정으로 자신의 인스턴스를 운영하세요.

소스 코드와 설치 안내:

- Hive 커뮤니티의 imagehoster: https://gitlab.syncad.com/hive/imagehoster
- Ecency의 imagehoster: https://github.com/ecency/imagehoster

설정에 여러분의 앱 계정을 넣습니다.

```text
[upload_limits]
app_account = 'YOUR_APP_ACCOUNT'
```

같은 항목에서 업로드에 필요한 최소 평판(`reputation`)과 계정별 업로드 한도(`duration` 밀리초마다 `max`회)도 정합니다. 한도가 실제로 적용되도록 `redis_url`을 설정하세요. `max_image_size`는 가장 큰 파일 크기를 바이트로 정합니다.

## 이미지 올리기 {#upload}

```http
POST /hs/ACCESS_TOKEN HTTP/1.1
Host: YOUR_IMAGEHOSTER
Content-Type: multipart/form-data; boundary=BOUNDARY
Content-Length: LENGTH
```

- **토큰.** 사용자의 액세스 토큰을, Hivesigner가 여러분의 앱에 준 그대로 경로에 넣습니다. 여러분의 앱을 위한 게시 접근 로그인에서 받은 토큰을 쓰세요. `client_id` 없는 요청에서 나온 로그인 전용 토큰은 어떤 앱도 가리키지 않아 거절됩니다.
- **본문.** 이미지 파일 하나를 담아 `multipart/form-data`로 보냅니다. imagehoster는 필드 이름과 상관없이 첫 번째 파일을 가져갑니다.
- **크기.** `Content-Length` 헤더를 보내세요. 파일은 그 인스턴스의 `max_image_size`보다 크면 안 됩니다.

응답은 JSON입니다. 성공하면 이미지의 URL이 들어 있습니다.

```json
{ "url": "https://YOUR_IMAGEHOSTER/IMAGE_HASH/photo.jpg" }
```

실패하면 imagehoster는 HTTP 오류 상태로 답합니다. 대부분의 실패에는 오류 이름도 함께 옵니다.

```json
{ "error": { "name": "ERROR_NAME" } }
```

> **참고:** 토큰은 URL 안에서 오갑니다. imagehoster는 https로만 제공하고, 접근 기록은 공개하지 마세요.

## 예시 {#example}

다음 브라우저용 함수는 파일 입력란이나 끌어다 놓기에서 파일을 올립니다. 멀티파트 헤더와 길이는 브라우저가 대신 설정합니다. `Content-Type`을 직접 정하지 마세요.

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
