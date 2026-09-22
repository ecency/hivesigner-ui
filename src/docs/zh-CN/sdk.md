官方 JavaScript SDK 会替您构造登录地址和签名链接，并调用 Hivesigner API。Python 方面有社区提供的库。其他任何语言都可以直接调用 [REST API](/docs/api)。

## JavaScript SDK {#javascript}

SDK 就是 npm 包 `hivesigner`。它的源码在 https://github.com/ecency/hivesigner-sdk。它用 TypeScript 编写，并自带类型定义。

版本 4 需要 Node.js 18 或更高版本，因为它使用内置的 `fetch`。在浏览器中它需要 ES2017 或更高版本。在没有全局 `fetch` 的环境里，请在使用 SDK 之前加上 polyfill。在更老的 Node.js 上，请继续使用版本 3。

### 安装 {#install}

```bash
npm install hivesigner
```

对于没有构建步骤的页面，请加载浏览器打包版。它会定义一个全局变量 `hivesigner`：

```text
<script src="https://cdn.jsdelivr.net/npm/hivesigner@4/lib/hivesigner.min.js"></script>
```

### 创建客户端 {#client}

```js
import { Client } from 'hivesigner';

const client = new Client({
  app: 'CLIENT_ID',
  callbackURL: 'REDIRECT_URI',
  scope: ['posting'],
});
```

| 选项 | 含义 |
| --- | --- |
| `app` | 您的应用账户，作为 `client_id` 发送。 |
| `callbackURL` | Hivesigner 把用户送回的地址。它必须与您应用的某个回调地址逐字符一致（使用普通 http 的回环回调地址在主机和端口上可以不同，参见[回调地址](/docs/register-app#callback-rules)）。 |
| `scope` | 一个列表，用逗号连接后放入 `scope` 参数。参见[权限范围](/docs/oauth2#scopes)。 |
| `responseType` | 授权码流程用 `'code'`。令牌流程则不填。 |
| `accessToken` | 用户的访问令牌，如果您已经有了。 |
| `apiURL` | API 的源地址。SDK 会在后面加上 `/api/`。默认值是 `https://hivesigner.com`。 |

`setApp`、`setCallbackURL`、`setScope`、`setAccessToken`、`removeAccessToken` 和 `setApiURL` 可以在之后修改客户端。每个方法都返回该客户端。

### 为用户登录 {#sign-in}

`getLoginURL(state, account)` 返回登录地址：

```js
const url = client.getLoginURL('STATE');
// https://hivesigner.com/oauth2/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&scope=posting&state=STATE
```

- `state` 会原样回到您的回调地址。用它把回答和请求对应起来。
- `account` 是可选的：一个用户名。该账户在设备上时 Hivesigner 会选中它，否则忽略。

在浏览器中，`client.login({ state: 'STATE' })` 会把用户送到同一个地址，但不带账户。

在令牌流程中，您的回调地址会收到 `access_token`、`expires_in` 和 `username`。请把令牌交给客户端：

```js
client.setAccessToken('ACCESS_TOKEN');
```

SDK 没有提供授权码流程中兑换授权码的方法。您的服务器要自行把授权码和客户端密钥发送到 API，正如[兑换授权码](/docs/oauth2#exchange-code)所示。

### 获取用户 {#me}

```js
const me = await client.me();
// { user, _id, name, account, scope, user_metadata }
```

`account` 是链上返回的用户 Hive 账户。`scope` 列出该令牌允许的内容。

### 广播 {#broadcast}

`broadcast(operations)` 把操作发送到 API，由 API 替用户广播。API 只接受由令牌所属用户撰写的发布类操作：`vote`、`comment`、`delete_comment`、`comment_options`、使用发布权限的 `custom_json`、`claim_reward_balance` 以及用于资料元数据的 `account_update2`。参见[广播接受哪些操作](/docs/api#broadcast-rules)。

```js
await client.broadcast([
  ['vote', { voter: 'USERNAME', author: 'AUTHOR', permlink: 'PERMLINK', weight: 10000 }],
]);
```

请在每个操作中写明用户。API 不会替换 `__signer`。

以下辅助方法各自构造一个操作并调用 `broadcast`：

| 方法 | 广播什么 |
| --- | --- |
| `vote(voter, author, permlink, weight)` | `vote`。`weight` 取值从 `-10000` 到 `10000`（100%）。 |
| `comment(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata)` | `comment`。发新帖时 `parentAuthor` 为 `''`。`jsonMetadata` 可以是对象：SDK 会把它转成字符串。 |
| `deleteComment(author, permlink)` | `delete_comment` |
| `customJson(requiredAuths, requiredPostingAuths, id, json)` | `custom_json`。`requiredAuths` 传 `[]`，`requiredPostingAuths` 传 `['USERNAME']`。`json` 是字符串。 |
| `reblog(account, author, permlink)` | id 为 `follow` 的 `custom_json`，用于转发帖子 |
| `follow(follower, following)` | id 为 `follow`、`what: ['blog']` 的 `custom_json` |
| `unfollow(unfollower, unfollowing)` | id 为 `follow`、`what: []` 的 `custom_json` |
| `ignore(follower, following)` | id 为 `follow`、`what: ['ignore']` 的 `custom_json`（屏蔽） |
| `claimRewardBalance(account, rewardHive, rewardHbd, rewardVests)` | `claim_reward_balance`。金额是字符串，例如 `'0.000 HIVE'`、`'0.000 HBD'` 和 `'1.000000 VESTS'`。 |

`updateUserMetadata()` 已弃用。要更改用户资料，请广播带有新 `posting_json_metadata` 的 `account_update2`。

### 退出登录 {#log-out}

`revokeToken()` 是 SDK 的退出调用。它把令牌发送到 API 的撤销端点，然后把它从客户端移除。当该调用被拒绝时，请自行调用 `removeAccessToken()`。同时也要在您的应用保存令牌的地方把它删除。

要彻底终止您应用的访问权限，需由用户在 https://hivesigner.com/authorized-apps 移除。参见[查看并移除应用的访问权限](/docs/signing-in#remove-access)。

### 签名链接 {#sign-links}

`sendOperation(op, params)`、`sendOperations(ops, params)` 和 `sendTransaction(tx, params)` 返回一个 `https://hivesigner.com/sign/...` 链接。`params` 接受 `callback`、`no_broadcast` 和 `signer`。参见[签名链接](/docs/sign-links)。

```js
import { sendOperation } from 'hivesigner';

const link = sendOperation(
  ['transfer', { from: '__signer', to: 'RECIPIENT', amount: '1.000 HIVE', memo: 'MEMO' }],
  { callback: 'https://YOUR_APP/paid' },
);
```

在 TypeScript 中，类型要求必须有第三个参数：传入 `undefined` 即可取回链接。

在浏览器中，把一个函数作为第三个参数传入，可改为在新标签页中打开链接。该函数不会被调用，也不会返回任何内容。请在点击处理函数中调用它，否则浏览器可能会拦截新标签页，调用也会抛出错误。

### Promise 与回调 {#promises-and-callbacks}

`me`、`broadcast`、各个辅助方法以及 `revokeToken` 都返回 Promise。若想改用回调，请把一个函数作为最后一个参数传入。它会收到 `(error, result)`。

```js
// Promise
try {
  const result = await client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000);
} catch (error) {
  console.error(error.error, error.error_description);
}

// Callback
client.vote('USERNAME', 'AUTHOR', 'PERMLINK', 10000, (error, result) => {
  if (error) console.error(error.error, error.error_description);
});
```

当 API 以错误作答时，Promise 会以 API 的错误主体 `{ error, error_description }` 被拒绝。使用回调时，该主体就是 `error` 参数。当回答不是 JSON 时，Promise 会以解析错误被拒绝。

## Python {#python}

以下库来自社区。它们由各自的作者维护，而非 Hivesigner 团队。在依赖它们之前，请对照 [REST API](/docs/api) 核实。

| 库 | 作者 |
| --- | --- |
| hivesigner-python-client：https://github.com/emre/hivesigner-python-client | emrebeyler |
| beem，`beem.hivesigner` 模块：https://beem.readthedocs.io/en/latest/beem.hivesigner.html | holger80 |
