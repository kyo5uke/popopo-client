// スペース監視 - 一定間隔でホームスペースの状況を取得
import { Popopo } from "../src/index.ts";

const api = new Popopo();
await api.loginAnonymous();
await api.createAccount();
await api.agreeTerms("terms-of-service");
await api.agreeTerms("privacy");

const check = async () => {
  const home = await api.getHomeSpaces();
  const now = new Date().toLocaleTimeString("ja-JP");
  const livesCount = home.spaces.filter((s) => s.live).length;

  console.log(`[${now}] スペース: ${home.spaces.length}件 / 配信中: ${livesCount}件`);

  for (const { space, live } of home.spaces) {
    if (live) {
      console.log(`  🔴 ${space.name} - 視聴者: ${live.viewerCount ?? "?"}`);
    }
  }
};

// 初回実行
await check();

// 60秒ごとに繰り返し
setInterval(check, 60_000);
