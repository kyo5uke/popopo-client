# popopo-client

POPOPO (ぽぽぽ) の非公式APIクライアント。

## 特徴

- Firebase認証（匿名 / メール / トークンリフレッシュ）
- 75以上のAPIエンドポイントに対応
- 正確なHTTPメソッドマッピング（このAPIはGETをほぼ使わない非標準設計）
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
await api.createAccount();

// ホームのスペース一覧
const home = await api.getHomeSpaces();

// コイン残高
const coins = await api.getCoinTransactions();
```

### 認証

```typescript
// 匿名
await api.loginAnonymous();

// メール
await api.loginEmail("user@example.com", "password");

// トークンリフレッシュ
await api.refresh();

// 外部トークン (他の認証フローで取得済みの場合)
api.setToken(idToken, refreshToken, localId);
```

### スペース・通話

```typescript
// TRTC接続情報 (userSig等)
const conn = await api.getConnectionInfo("spaceKey");

// スペースに接続
await api.connectSpace("spaceKey");

// ミュート
await api.setMuted("spaceKey", true);

// 切断
await api.disconnectSpace("spaceKey");
```

### ライブ配信

```typescript
const lives = await api.getLives("spaceKey");
const comments = await api.getComments("spaceKey", "liveId");
await api.postComment("spaceKey", "liveId", { body: "hello" });
await api.sendReaction("spaceKey", "liveId", { type: "heart" });
```

### 低レベルAPI

全エンドポイントは `endpoints` モジュールからルート定義として利用可能。
`call()` で任意のルートを直接叩ける。

```typescript
import { Popopo, endpoints } from "./src/index.ts";

const api = new Popopo();
await api.loginAnonymous();

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
