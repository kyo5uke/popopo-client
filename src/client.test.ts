import { describe, test, expect } from "bun:test";
import { Popopo, PopopoApiError } from "./index.ts";

// 実APIに接続するテスト
// bun test で実行

let api: Popopo;

describe("認証", () => {
  test("匿名ログイン", async () => {
    api = new Popopo();
    const session = await api.loginAnonymous();
    expect(session.idToken).toBeTruthy();
    expect(session.localId).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();
    expect(api.isLoggedIn).toBe(true);
  });

  test("トークンリフレッシュ", async () => {
    const session = await api.refresh();
    expect(session.idToken).toBeTruthy();
  });

  test("アカウント情報取得", async () => {
    const info = await api.getAccountInfo();
    expect(info).toBeTruthy();
  });
});

describe("アカウント", () => {
  test("作成", async () => {
    const res = await api.createAccount();
    expect(res.result).toBe(true);
  });

  test("利用規約同意", async () => {
    const r1 = await api.agreeTerms("terms-of-service");
    const r2 = await api.agreeTerms("privacy");
    expect(r1.result).toBe(true);
    expect(r2.result).toBe(true);
  });

  test("プロフィール取得", async () => {
    const res = await api.getProfile();
    expect(res.result).toBe(true);
  });

  test("誕生日設定", async () => {
    await api.setBirthday(2000, 1, 1);
  });

  test("チュートリアル更新", async () => {
    const res = await api.updateTutorial(1, 0, false);
    expect(res.result).toBe(true);
  });

  test("プッシュ通知設定取得", async () => {
    const res = await api.getPushSetting();
    expect(res.result).toBe(true);
  });
});

describe("位置情報", () => {
  test("取得", async () => {
    const geo = await api.getGeo();
    expect(geo.countryCode).toBe("JP");
    expect(geo.updatedAt).toBeGreaterThan(0);
  });
});

describe("ホームスペース", () => {
  test("一覧取得", async () => {
    const home = await api.getHomeSpaces();
    expect(home.spaces.length).toBeGreaterThan(0);
    expect(home.spaces[0]!.space.spaceKey).toBeTruthy();
    expect(home.spaces[0]!.space.name).toBeTruthy();
  });
});

describe("コイン", () => {
  test("取引履歴", async () => {
    const res = await api.getCoinTransactions();
    expect(res.items).toBeArray();
  });

  test("期限切れ", async () => {
    const res = await api.getCoinExpirations();
    expect(res.items).toBeArray();
  });

  test("残高 (Firestore)", async () => {
    const balance = await api.getCoinBalance();
    expect(balance.paid).toBeNumber();
    expect(balance.free).toBeNumber();
  });
});

describe("フォロー", () => {
  let targetUserId: string;

  test("対象ユーザー取得", async () => {
    const home = await api.getHomeSpaces();
    targetUserId = home.spaces[0]!.space.userId;
    expect(targetUserId).toBeTruthy();
  });

  test("フォロー", async () => {
    const res = await api.follow(targetUserId);
    expect(res.result).toBe(true);
  });

  test("アンフォロー", async () => {
    const res = await api.unfollow(targetUserId);
    expect(res.result).toBe(true);
  });
});

describe("スペース", () => {
  let spaceKey: string;

  test("作成", async () => {
    const res = await api.createSpace({ name: "test-space", backgroundId: "HpZwMLpRuCX1yKXeqrIZ" });
    spaceKey = res.spaceKey;
    expect(spaceKey).toBeTruthy();
  });

  test("TRTC接続情報", async () => {
    const info = await api.getConnectionInfo(spaceKey);
    expect(info.userSig).toBeTruthy();
    expect(info.userSig.length).toBeGreaterThan(100);
  });

  test("接続", async () => {
    const res = await api.connectSpace(spaceKey);
    expect(res.result).toBe(true);
  });

  test("ミュート", async () => {
    const res = await api.setMuted(spaceKey, true);
    expect(res.result).toBe(true);
  });

  test("メッセージ送信", async () => {
    const res = await api.sendMessage(spaceKey, "text", "テスト");
    expect(res.result).toBe(true);
  });

  test("招待リンク作成", async () => {
    const invite = await api.createSpaceInvite(spaceKey, 10, Math.floor(Date.now() / 1000) + 86400);
    expect(invite.inviteKey).toBeTruthy();
    expect(invite.inviteLink).toContain("popopo.com");
  });

  test("更新", async () => {
    const res = await api.updateSpace(spaceKey, { name: "test-renamed" });
    expect(res.spaceKey).toBe(spaceKey);
  });

  test("背景設定", async () => {
    const res = await api.setBackground(spaceKey, { id: "HpZwMLpRuCX1yKXeqrIZ", kind: "shared" });
    expect(res.result).toBe(true);
  });

  test("切断", async () => {
    const res = await api.disconnectSpace(spaceKey);
    expect(res.result).toBe(true);
  });
});

describe("コンテンツ", () => {
  test("ストーリー投稿", async () => {
    const res = await api.postStory("テストストーリー");
    expect(res.id).toBeTruthy();
  });

  test("フレンド招待作成", async () => {
    const res = await api.createFriendInvite(5, Math.floor(Date.now() / 1000) + 86400);
    expect(res.inviteKey).toBeTruthy();
    expect(res.inviteLink).toContain("popopo.com");
  });

  test("デバイス登録", async () => {
    const res = await api.registerDevice("test-device", {
      deviceName: "test", system: "android", token: "fcm-test", app: "com.popopo.popopo",
    });
    expect(res.result).toBe(true);
  });

  test("違反報告", async () => {
    const res = await api.report({
      target: { kind: "user", userId: "test" },
      reason: "other",
      description: "テスト",
    });
    expect(res.violationReportId).toBeTruthy();
  });
});

describe("ライブコメント", () => {
  test("配信中スペースにコメント投稿", async () => {
    const home = await api.getHomeSpaces();
    const liveSpace = home.spaces.find((s) => s.live);
    if (!liveSpace?.live) {
      console.log("配信中のスペースがないためスキップ");
      return;
    }
    const res = await api.postComment(liveSpace.space.spaceKey, liveSpace.live.id, "テスト");
    expect((res as any).id).toBeTruthy();
  });
});

describe("セッション", () => {
  test("エクスポート/インポート", () => {
    const exported = api.exportSession();
    expect(exported.idToken).toBeTruthy();
    expect(exported.localId).toBeTruthy();

    const api2 = new Popopo();
    api2.importSession(exported);
    expect(api2.isLoggedIn).toBe(true);
    expect(api2.userId).toBe(exported.localId);
  });
});
