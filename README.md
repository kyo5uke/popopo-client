# popopo-client

POPOPO (ぽぽぽ) の非公式APIクライアント。

## 特徴

- Firebase認証フル対応（匿名 / メール / Google / Apple / Facebook / Twitter / GitHub / 電話番号 / メールリンク）
- OAuthプロバイダのリンク/アンリンク
- Firestoreからコイン残高を直接取得
- TSO (VirtualCast/TheSeedOnline) OAuth連携
- 75以上のAPIエンドポイントに対応
- 全エンドポイント実機検証済みのHTTPメソッドマッピング（このAPIはGETをほぼ使わない非標準設計）
- TypeScript / Bun

## インストール

```bash
bun install
```

## 使い方

```typescript
import { Popopo } from "./src/index.ts";

const api = new Popopo();

// ログイン
await api.loginAnonymous();

// アカウント作成
await api.users.createAccount();

// ホームのスペース一覧
const home = await api.users.getHomeSpaces();

// コイン残高
const coins = await api.store.getCoinTransactions();
```

### 認証

```typescript
// 匿名
await api.loginAnonymous();

// メール
await api.loginEmail("user@example.com", "password");
await api.signupEmail("new@example.com", "password");

// OAuth (Google / Apple / Facebook / Twitter / GitHub)
await api.loginGoogle({ idToken: "..." });
await api.loginApple({ idToken: "...", nonce: "..." });
await api.loginFacebook("access_token");

// 電話番号
const { sessionInfo } = await api.sendPhoneCode("+819012345678");
await api.loginPhone(sessionInfo, "123456");

// メールリンク
await api.sendEmailLink("user@example.com", "https://popopo.com/callback");
await api.loginEmailLink("user@example.com", "oobCode");

// カスタムトークン
await api.loginCustomToken("server-issued-token");

// トークンリフレッシュ
await api.refresh();

// プロバイダのリンク/アンリンク
await api.linkGoogle({ idToken: "..." });
await api.unlinkProvider("google.com");

// アカウント情報
const info = await api.getAccountInfo();
```

### コイン残高 (Firestore直接取得)

```typescript
const balance = await api.getCoinBalance();
console.log(balance.paid, balance.free);
```

### TSO (VirtualCast) 連携

```typescript
const tokens = await api.tsoExchangeCode(code, codeVerifier);
const refreshed = await api.tsoRefreshToken(tokens.refreshToken);
const url = api.tsoBuildFileUrl("file-id");
```

### スペース・通話

```typescript
// TRTC接続情報 (userSig等)
const conn = await api.spaces.getConnectionInfo("spaceKey");

// スペースに接続
await api.spaces.connectSpace("spaceKey");

// ミュート
await api.spaces.setMuted("spaceKey", true);

// 切断
await api.spaces.disconnectSpace("spaceKey");
```

### ライブ配信

```typescript
const lives = await api.lives.getLives("spaceKey");
await api.lives.postComment("spaceKey", "liveId", "hello");
await api.lives.sendReaction("spaceKey", "liveId", { type: "heart" });
```

### 低レベルAPI

全エンドポイントは `endpoints` モジュールからルート定義として利用可能。
`call()` で任意のルートを直接叩ける。

```typescript
import { Popopo, endpoints } from "./src/index.ts";

const api = new Popopo();
await api.loginAnonymous();
await api.users.createAccount();

// ルート定義から直接呼び出し
const route = endpoints.spaces.connectionInfo("mySpaceKey");
const data = await api.call(route, {});
```

## APIメソッドマッピング

このAPIは一般的なREST設計と異なり、読み取り操作にもPOST/PUTを使用する。

| 操作 | メソッド | 例 |
|------|---------|-----|
| プロフィール取得/更新 | PUT | `/api/v2/users/me/profile` |
| スペース一覧 | POST | `/api/v2/users/me/home-display-spaces` |
| 位置情報取得 | POST | `/api/v2/users/me/geo` |
| コイン取引履歴 | GET | `/api/v2/coin/transactions` |
| コイン期限切れ | GET | `/api/v2/coin/upcoming-expirations` |
| デバイス登録 | PUT | `/api/v2/push/devices/{id}` |
| デバイス解除 | DELETE | `/api/v2/push/devices/{id}` |

## 対応エンドポイント一覧

<details>
<summary>展開</summary>

### users
- `POST /api/v2/users` - アカウント作成
- `PUT /api/v2/users/me/profile` - プロフィール
- `PUT /api/v2/users/me/profile/icon` - アイコン
- `PUT /api/v2/users/me/profile/look` - ルック
- `POST /api/v2/users/me/profile/friend-code` - フレンドコード再生成
- `POST /api/v2/users/me/birthday` - 誕生日
- `PUT /api/v2/users/me/push-setting` - プッシュ通知設定
- `PUT /api/v2/users/me/tutorial` - チュートリアル
- `POST /api/v2/users/me/terms-agreements` - 利用規約同意
- `POST /api/v2/users/me/geo` - 位置情報
- `POST /api/v2/users/me/home-display-spaces` - ホームスペース
- `POST /api/v2/users/me/stories` - ストーリー
- `POST /api/v2/users/me/friend-invites` - フレンド招待
- `POST /api/v2/users/me/block-users/{userId}` - ブロック

### followers
- `POST /api/v2/users/{userId}/followers` - フォロー / 一覧
- `DELETE /api/v2/users/{userId}/followers/me` - アンフォロー

### spaces
- `POST /api/v2/spaces` - スペース作成
- `POST /api/v2/spaces/{key}` - スペース詳細
- `POST /api/v2/spaces/{key}/connection-info` - TRTC接続情報
- `POST /api/v2/spaces/{key}/background` - 背景取得
- `PATCH /api/v2/spaces/{key}/background` - 背景設定
- `POST /api/v2/spaces/{key}/bgm` - BGM取得
- `PATCH /api/v2/spaces/{key}/bgm` - BGM設定
- `POST /api/v2/spaces/{key}/messages` - メッセージ
- `POST /api/v2/spaces/{key}/users/me/connection` - 接続
- `DELETE /api/v2/spaces/{key}/users/me/connection` - 切断
- `PATCH /api/v2/spaces/{key}/users/me/connection/muted` - ミュート

### lives
- `POST /api/v2/spaces/{key}/lives` - ライブ一覧
- `POST /api/v2/spaces/{key}/lives/{id}` - ライブ詳細
- `POST /api/v2/spaces/{key}/lives/{id}/comments` - コメント
- `DELETE /api/v2/spaces/{key}/lives/{id}/comments/{commentId}` - コメント削除
- `POST /api/v2/spaces/{key}/lives/{id}/reactions` - リアクション
- `POST /api/v2/spaces/{key}/lives/{id}/powers` - パワー

### selections (抽選)
- `POST .../selections` - 一覧
- `POST .../selections/{id}/sequences/participate` - 参加
- `POST .../selections/{id}/sequences/nominate` - ノミネート

### coin
- `GET /api/v2/coin/transactions` - 取引履歴
- `GET /api/v2/coin/upcoming-expirations` - 期限切れ
- `POST /api/v2/coin/platforms/iab/reclaims` - 購入検証

### push
- `POST /api/v2/push/call-pushes` - 通話プッシュ送信
- `DELETE /api/v2/push/call-pushes/{id}` - キャンセル
- `PUT /api/v2/push/devices/{id}` - デバイス登録
- `DELETE /api/v2/push/devices/{id}` - デバイス解除

### その他
- `POST /api/v2/invites/{key}` - 招待詳細
- `POST /api/v2/invites/{key}/accept` - 招待承認
- `POST /api/v2/violation-reports` - 違反報告

</details>

## 技術メモ

- 通信基盤は Tencent TRTC (WebRTCではない)
- `connection-info` エンドポイントで TRTC の userSig を取得する
- Firebase App Check ヘッダー (`X-Firebase-AppCheck`) は送信可能だが現時点では必須ではない
- サーバーは Node.js / Express (Google Cloud LB 背後)

## License

MIT
