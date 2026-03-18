// 基本的な使い方
import { Popopo } from "../src/index.ts";

const api = new Popopo();

// 匿名ログイン → アカウント作成
await api.loginAnonymous();
await api.users.createAccount();
await api.users.agreeTerms("terms-of-service");
await api.users.agreeTerms("privacy");

// プロフィール取得
const profile = await api.users.getProfile();
console.log("プロフィール:", profile);

// ホームのスペース一覧
const home = await api.users.getHomeSpaces();
console.log(`${home.spaces.length}件のスペースが見つかりました`);

for (const { space } of home.spaces.slice(0, 5)) {
  console.log(`  - ${space.name} (${space.spaceKey})`);
}
