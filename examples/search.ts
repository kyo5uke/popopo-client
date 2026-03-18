// Algolia検索の使い方
import { Popopo } from "../src/index.ts";

const api = new Popopo();

// ユーザー検索
const users = await api.searchUsers({ query: "", hitsPerPage: 5 });
console.log(`ユーザー: ${users.nbHits.toLocaleString()}人`);
for (const u of users.hits) {
  console.log(`  ${u.name} (${u.alias})`);
}

// 商品検索
const items = await api.searchItems({ query: "", hitsPerPage: 5 });
console.log(`\n商品: ${items.nbHits}件`);
for (const i of items.hits) {
  console.log(`  ${i.name} - ${i.price}コイン`);
}

// ライブ検索
const lives = await api.searchLives({ hitsPerPage: 5 });
console.log(`\nライブ: ${lives.nbHits}件`);
for (const l of lives.hits) {
  console.log(`  ${l.spaceKey} tags: ${l.tags?.join(", ")}`);
}

// 全商品を取得（ページネーション）
console.log("\n全商品カタログ:");
let count = 0;
for await (const item of api.paginateItems()) {
  console.log(`  ${item.name} - ${item.price}コイン`);
  count++;
}
console.log(`合計: ${count}件`);
