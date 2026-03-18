// スペースの作成・接続・メッセージ送信
import { Popopo } from "../src/index.ts";

const api = new Popopo();
await api.loginAnonymous();
await api.users.createAccount();
await api.users.agreeTerms("terms-of-service");
await api.users.agreeTerms("privacy");

// スペース作成
const { spaceKey } = await api.spaces.createSpace({
  name: "テストルーム",
  backgroundId: "HpZwMLpRuCX1yKXeqrIZ",
});
console.log("スペース作成:", spaceKey);

// TRTC接続情報を取得
const conn = await api.spaces.getConnectionInfo(spaceKey);
console.log("userSig:", conn.userSig.substring(0, 30) + "...");

// 接続してメッセージ送信
await api.spaces.connectSpace(spaceKey);
await api.spaces.sendMessage(spaceKey, "text", "こんにちは！");
console.log("メッセージ送信完了");

// 招待リンク作成
const invite = await api.spaces.createSpaceInvite(
  spaceKey,
  10,
  Math.floor(Date.now() / 1000) + 86400,
);
console.log("招待リンク:", invite.inviteLink);

// 切断
await api.spaces.disconnectSpace(spaceKey);
console.log("切断しました");
