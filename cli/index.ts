#!/usr/bin/env bun

// popopo-client CLI
// 使い方: bun run cli/index.ts <コマンド> [オプション]

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Popopo } from "../src/client.ts";
import type { SessionData } from "../src/types.ts";

const SESSION_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "../.session.json");

// セッション読み書き
async function loadSession(): Promise<SessionData> {
  if (!existsSync(SESSION_FILE)) return {};
  return JSON.parse(await readFile(SESSION_FILE, "utf8")) as SessionData;
}

async function saveSession(api: Popopo): Promise<void> {
  await writeFile(SESSION_FILE, JSON.stringify(api.exportSession(), null, 2) + "\n");
}

// 引数パース
function parseArgs(argv: string[]): { cmd: string[]; opts: Record<string, string> } {
  const cmd: string[] = [];
  const opts: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq >= 0) {
        opts[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        opts[a.slice(2)] = argv[i + 1] ?? "true";
        if (argv[i + 1] && !argv[i + 1]!.startsWith("--")) i++;
      }
    } else {
      cmd.push(a);
    }
  }
  return { cmd, opts };
}

function require(opts: Record<string, string>, key: string): string {
  const v = opts[key];
  if (!v) throw new Error(`--${key} が必要です`);
  return v;
}

// メイン
const { cmd, opts } = parseArgs(process.argv.slice(2));
const api = new Popopo();
const session = await loadSession();
api.importSession(session);

try {
  const result = await run(cmd, opts);
  await saveSession(api);
  if (result !== undefined) {
    console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2));
  }
} catch (e: any) {
  if (e.body) {
    console.error(`エラー [${e.status}]:`, JSON.stringify(e.body, null, 2));
  } else {
    console.error("エラー:", e.message);
  }
  process.exit(1);
}

async function run(cmd: string[], opts: Record<string, string>): Promise<unknown> {
  const [c1, c2, c3] = cmd;

  switch (c1) {
    // 認証
    case "login":
      return handleLogin(c2, opts);
    case "signup":
      return api.signupEmail(require(opts, "email"), require(opts, "password"));
    case "logout":
      api.clearToken();
      return "ログアウトしました";
    case "refresh":
      return api.refresh();
    case "whoami":
      return api.getAccountInfo();
    case "link":
      return handleLink(c2, opts);
    case "unlink":
      return api.unlinkProvider(require(opts, "provider"));

    // ユーザー
    case "profile":
      if (c2 === "update") return api.users.updateProfile(JSON.parse(require(opts, "data")));
      return api.users.getProfile();
    case "terms":
      return api.users.agreeTerms(require(opts, "kind") as "terms-of-service" | "privacy");
    case "birthday":
      return api.users.setBirthday(Number(require(opts, "year")), Number(require(opts, "month")), Number(require(opts, "day")));
    case "tutorial":
      return api.users.updateTutorial(Number(require(opts, "version")), Number(require(opts, "step")), opts["completed"] === "true");
    case "geo":
      return api.users.getGeo();
    case "story":
      return api.users.postStory(require(opts, "message"));
    case "block":
      return api.users.blockUser(require(opts, "user-id"));
    case "user":
      return api.users.getUser(require(opts, "user-id"));

    // フォロー
    case "follow":
      return api.social.follow(require(opts, "user-id"));
    case "unfollow":
      return api.social.unfollow(require(opts, "user-id"));
    case "followers":
      return api.social.getFollowers(require(opts, "user-id"));

    // スペース
    case "home":
      return api.users.getHomeSpaces();
    case "space":
      return handleSpace(c2, c3, opts);

    // ライブ
    case "live":
      return handleLive(c2, opts);

    // コイン
    case "coin":
      if (c2 === "balance") return api.getCoinBalance();
      if (c2 === "history") return api.store.getCoinTransactions();
      if (c2 === "expirations") return api.store.getCoinExpirations();
      return api.store.getCoinTransactions();

    // 招待
    case "invite":
      if (c2 === "accept") return api.social.acceptInvite(require(opts, "key"));
      if (c2 === "friend") return api.users.createFriendInvite(Number(opts["limit"] ?? "10"), Math.floor(Date.now() / 1000) + 86400);
      return api.social.getInvite(require(opts, "key"));

    // デバイス
    case "device":
      if (c2 === "register") return api.device.registerDevice(require(opts, "id"), JSON.parse(require(opts, "data")));
      if (c2 === "unregister") return api.device.unregisterDevice(require(opts, "id"));
      throw new Error("不明なデバイスコマンド: " + c2);

    // 通報
    case "report":
      return api.social.report(JSON.parse(require(opts, "data")));

    // VirtualCast
    case "vc":
      if (c2 === "token") return api.device.getVirtualCastAccessToken();
      if (c2 === "relay") return api.device.virtualCastApiRelay(JSON.parse(require(opts, "data")));
      throw new Error("不明なvcコマンド: " + c2);

    // TSO
    case "tso":
      if (c2 === "exchange") return api.tsoExchangeCode(require(opts, "code"), require(opts, "verifier"));
      if (c2 === "refresh") return api.tsoRefreshToken(require(opts, "token"));
      throw new Error("不明なtsoコマンド: " + c2);

    // スタンプ
    case "stamp":
      if (c2 === "press") return api.store.stamp(require(opts, "card-id"));
      if (c2 === "unlock") return api.store.unlockStampLane(require(opts, "card-id"), require(opts, "lane-id"));
      if (c2 === "claim") return api.store.claimStampReward(require(opts, "card-id"), require(opts, "lane-id"), require(opts, "reward-id"));
      throw new Error("不明なスタンプコマンド: " + c2);

    // push
    case "push":
      if (c2 === "call") return api.device.sendCallPush(JSON.parse(require(opts, "data")));
      if (c2 === "cancel") return api.device.cancelCallPush(require(opts, "id"));
      throw new Error("不明なpushコマンド: " + c2);

    // 低レベル
    case "raw":
      return api.call({ method: (require(opts, "method") as any), path: require(opts, "path") }, opts["body"] ? JSON.parse(opts["body"]) : undefined);

    case "help":
    case undefined:
      printHelp();
      return undefined;

    default:
      throw new Error(`不明なコマンド: ${c1}`);
  }
}

async function handleLogin(method: string | undefined, opts: Record<string, string>): Promise<unknown> {
  switch (method) {
    case "anonymous":
    case undefined:
      return api.loginAnonymous();
    case "email":
      return api.loginEmail(require(opts, "email"), require(opts, "password"));
    case "google":
      return api.loginGoogle({ idToken: opts["id-token"], accessToken: opts["access-token"] });
    case "apple":
      return api.loginApple({ idToken: opts["id-token"], nonce: opts["nonce"] });
    case "facebook":
      return api.loginFacebook(require(opts, "access-token"));
    case "twitter":
      return api.loginTwitter(require(opts, "access-token"));
    case "github":
      return api.loginGitHub(require(opts, "access-token"));
    case "phone": {
      if (opts["code"] && opts["session"]) {
        return api.loginPhone(opts["session"]!, opts["code"]!);
      }
      return api.sendPhoneCode(require(opts, "number"));
    }
    case "email-link": {
      if (opts["oob-code"]) {
        return api.loginEmailLink(require(opts, "email"), opts["oob-code"]!);
      }
      await api.sendEmailLink(require(opts, "email"), opts["continue-url"] ?? "https://www.popopo.com");
      return "メールリンクを送信しました";
    }
    case "token":
      return api.loginCustomToken(require(opts, "token"));
    default:
      throw new Error(`不明なログイン方法: ${method}`);
  }
}

async function handleLink(method: string | undefined, opts: Record<string, string>): Promise<unknown> {
  switch (method) {
    case "google":
      return api.linkGoogle({ idToken: opts["id-token"], accessToken: opts["access-token"] });
    case "apple":
      return api.linkApple({ idToken: opts["id-token"], nonce: opts["nonce"] });
    case "facebook":
      return api.linkFacebook(require(opts, "access-token"));
    case "phone":
      return api.linkPhone(require(opts, "session"), require(opts, "code"));
    default:
      throw new Error(`不明なリンク方法: ${method}`);
  }
}

async function handleSpace(sub: string | undefined, sub2: string | undefined, opts: Record<string, string>): Promise<unknown> {
  const key = opts["key"] ?? opts["space-key"];
  switch (sub) {
    case "create":
      return api.spaces.createSpace(JSON.parse(require(opts, "data")));
    case "update":
      return api.spaces.updateSpace(key!, JSON.parse(require(opts, "data")));
    case "connect":
      return api.spaces.connectSpace(key!, opts["muted"] === "true");
    case "disconnect":
      return api.spaces.disconnectSpace(key!);
    case "mute":
      return api.spaces.setMuted(key!, true);
    case "unmute":
      return api.spaces.setMuted(key!, false);
    case "message":
      return api.spaces.sendMessage(key!, "text", require(opts, "text"));
    case "invite":
      return api.spaces.createSpaceInvite(key!, Number(opts["limit"] ?? "10"), Math.floor(Date.now() / 1000) + Number(opts["ttl"] ?? "86400"));
    case "connection-info":
      return api.spaces.getConnectionInfo(key!);
    case "background":
      if (opts["data"]) return api.spaces.setBackground(key!, JSON.parse(opts["data"]));
      break;
    case "bgm":
      if (opts["data"]) return api.spaces.setBgm(key!, JSON.parse(opts["data"]));
      break;
    default:
      throw new Error(`不明なスペースコマンド: ${sub}`);
  }
}

async function handleLive(sub: string | undefined, opts: Record<string, string>): Promise<unknown> {
  const key = require(opts, "space-key");
  const liveId = opts["live-id"];
  switch (sub) {
    case "list":
      return api.lives.getLives(key);
    case "get":
      return api.lives.getLive(key, liveId!);
    case "comment":
      return api.lives.postComment(key, liveId!, require(opts, "text"));
    case "reaction":
      return api.lives.sendReaction(key, liveId!, { type: opts["type"] ?? "heart" });
    case "power":
      return api.lives.sendPower(key, liveId!, JSON.parse(require(opts, "data")));
    case "selections":
      return api.lives.getSelections(key, liveId!);
    default:
      throw new Error(`不明なライブコマンド: ${sub}`);
  }
}

function printHelp(): void {
  console.log(`popopo-client CLI

認証:
  login anonymous              匿名ログイン
  login email --email --password
  login google --id-token / --access-token
  login apple --id-token [--nonce]
  login facebook --access-token
  login phone --number         SMS送信
  login phone --session --code SMS検証
  login email-link --email     リンク送信
  login email-link --email --oob-code  リンク検証
  login token --token          カスタムトークン
  signup --email --password
  logout
  refresh
  whoami
  link google/apple/facebook/phone
  unlink --provider

ユーザー:
  profile                      プロフィール取得
  profile update --data '{}'
  terms --kind terms-of-service/privacy
  birthday --year --month --day
  geo
  story --message "..."
  user --user-id
  block --user-id

フォロー:
  follow --user-id
  unfollow --user-id
  followers --user-id

スペース:
  home                         ホームスペース一覧
  space create --data '{}'
  space connect --key
  space disconnect --key
  space mute/unmute --key
  space message --key --text "..."
  space invite --key [--limit] [--ttl]
  space connection-info --key
  space background --key --data '{}'
  space bgm --key --data '{}'

ライブ:
  live list --space-key
  live comment --space-key --live-id --body "..."
  live reaction --space-key --live-id [--type heart]
  live selections --space-key --live-id

コイン:
  coin                         取引履歴
  coin balance                 残高 (Firestore)
  coin expirations             期限切れ

招待:
  invite --key                 詳細
  invite accept --key
  invite friend

その他:
  stamp press --card-id
  device register --id --data '{}'
  push call --data '{}'
  vc token                     VirtualCast トークン取得
  report --data '{}'
  raw --method POST --path /api/v2/... [--body '{}']
`);
}
