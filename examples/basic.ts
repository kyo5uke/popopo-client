// 基本的な使い方
import { Popopo } from "../src/index.ts";

const api = new Popopo();

// 匿名ログイン → アカウント作成
await api.loginAnonymous();
await api.createAccount();
await api.agreeTerms("terms-of-service");
await api.agreeTerms("privacy");

// プロフィール取得
const profile = await api.getProfile();
console.log("プロフィール:", profile);

// ホームのスペース一覧
const home = await api.getHomeSpaces();
console.log(`${home.spaces.length}件のスペースが見つかりました`);

for (const { space } of home.spaces.slice(0, 5)) {
  console.log(`  - ${space.name} (${space.spaceKey})`);
}
