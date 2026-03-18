// Firebase Identity Toolkit / SecureToken のラッパー
// POPOPOはFirebase Authを認証基盤として使っている

import type { AuthSession, PhoneVerificationResult } from "./types.ts";

const FIREBASE_API_KEY = "AIzaSyAmY4T-_U3IGS_TvD5ERQsr2HQsHUmaapc";
const IDENTITY_TOOLKIT = "https://www.googleapis.com/identitytoolkit/v3/relyingparty";
const SECURE_TOKEN = "https://securetoken.googleapis.com/v1";

export interface AuthOptions {
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
}

function key(opts?: AuthOptions): string {
  return opts?.apiKey ?? FIREBASE_API_KEY;
}

function f(opts?: AuthOptions): typeof globalThis.fetch {
  return opts?.fetch ?? globalThis.fetch;
}

async function firebasePost(
  opts: AuthOptions | undefined,
  endpoint: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await f(opts)(`${IDENTITY_TOOLKIT}/${endpoint}?key=${key(opts)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    throw new AuthError(endpoint, res.status, data);
  }
  return data;
}

// 匿名ログイン
export async function signInAnonymously(opts?: AuthOptions): Promise<AuthSession> {
  const data = await firebasePost(opts, "signupNewUser", {});
  return toSession(data);
}

// メール+パスワードでサインアップ
export async function signUpWithEmail(
  email: string,
  password: string,
  opts?: AuthOptions,
): Promise<AuthSession> {
  const data = await firebasePost(opts, "signupNewUser", {
    email,
    password,
    returnSecureToken: true,
  });
  return toSession(data);
}

// メール+パスワードでログイン
export async function signInWithEmail(
  email: string,
  password: string,
  opts?: AuthOptions,
): Promise<AuthSession> {
  const data = await firebasePost(opts, "verifyPassword", {
    email,
    password,
    returnSecureToken: true,
  });
  return toSession(data);
}

// カスタムトークンでログイン（サーバー発行トークン用）
export async function signInWithCustomToken(
  token: string,
  opts?: AuthOptions,
): Promise<AuthSession> {
  const data = await firebasePost(opts, "verifyCustomToken", {
    token,
    returnSecureToken: true,
  });
  return toSession(data);
}

// OAuthプロバイダでログイン（Google, Apple, Facebook, Twitter, GitHub等）
export async function signInWithIdp(
  providerId: string,
  credentials: {
    idToken?: string;
    accessToken?: string;
    nonce?: string;
    authCode?: string;
  },
  opts?: AuthOptions,
): Promise<AuthSession> {
  // postBodyを組み立て
  const params = new URLSearchParams();
  params.set("providerId", providerId);
  if (credentials.idToken) params.set("id_token", credentials.idToken);
  if (credentials.accessToken) params.set("access_token", credentials.accessToken);
  if (credentials.nonce) params.set("nonce", credentials.nonce);
  if (credentials.authCode) params.set("code", credentials.authCode);

  const data = await firebasePost(opts, "verifyAssertion", {
    requestUri: "http://localhost",
    postBody: params.toString(),
    returnSecureToken: true,
    returnIdpCredential: true,
  });
  return toSession(data);
}

// 電話番号認証 - SMS送信
export async function sendPhoneVerificationCode(
  phoneNumber: string,
  opts?: AuthOptions,
): Promise<PhoneVerificationResult> {
  const data = await firebasePost(opts, "sendVerificationCode", {
    phoneNumber,
  });
  return { sessionInfo: data["sessionInfo"] as string };
}

// 電話番号認証 - SMSコード検証してログイン
export async function signInWithPhoneNumber(
  sessionInfo: string,
  code: string,
  opts?: AuthOptions,
): Promise<AuthSession> {
  const data = await firebasePost(opts, "verifyPhoneNumber", {
    sessionInfo,
    code,
  });
  return toSession(data);
}

// メールリンクでログイン
export async function signInWithEmailLink(
  email: string,
  oobCode: string,
  opts?: AuthOptions,
): Promise<AuthSession> {
  const data = await firebasePost(opts, "emailLinkSignin", {
    email,
    oobCode,
  });
  return toSession(data);
}

// メールリンク送信（ログイン用）
export async function sendSignInLink(
  email: string,
  continueUrl: string,
  opts?: AuthOptions,
): Promise<void> {
  await firebasePost(opts, "getOobConfirmationCode", {
    requestType: "EMAIL_SIGNIN",
    email,
    continueUrl,
    canHandleCodeInApp: true,
  });
}

// アカウントにプロバイダをリンク
export async function linkWithIdp(
  idToken: string,
  providerId: string,
  credentials: {
    idToken?: string;
    accessToken?: string;
    nonce?: string;
  },
  opts?: AuthOptions,
): Promise<AuthSession> {
  const params = new URLSearchParams();
  params.set("providerId", providerId);
  if (credentials.idToken) params.set("id_token", credentials.idToken);
  if (credentials.accessToken) params.set("access_token", credentials.accessToken);
  if (credentials.nonce) params.set("nonce", credentials.nonce);

  const data = await firebasePost(opts, "verifyAssertion", {
    idToken,
    requestUri: "http://localhost",
    postBody: params.toString(),
    returnSecureToken: true,
    returnIdpCredential: true,
  });
  return toSession(data);
}

// 電話番号をリンク
export async function linkWithPhoneNumber(
  idToken: string,
  sessionInfo: string,
  code: string,
  opts?: AuthOptions,
): Promise<AuthSession> {
  const data = await firebasePost(opts, "verifyPhoneNumber", {
    idToken,
    sessionInfo,
    code,
  });
  return toSession(data);
}

// アカウント情報取得
export async function lookupAccount(
  idToken: string,
  opts?: AuthOptions,
): Promise<Record<string, unknown>> {
  const data = await firebasePost(opts, "getAccountInfo", { idToken });
  const users = data["users"] as unknown[];
  return (users?.[0] ?? {}) as Record<string, unknown>;
}

// プロフィール更新（displayName, photoUrl）
export async function updateFirebaseProfile(
  idToken: string,
  profile: { displayName?: string; photoUrl?: string },
  opts?: AuthOptions,
): Promise<AuthSession> {
  const data = await firebasePost(opts, "setAccountInfo", {
    idToken,
    ...profile,
    returnSecureToken: true,
  });
  return toSession(data);
}

// プロバイダをアンリンク
export async function unlinkProvider(
  idToken: string,
  providerId: string,
  opts?: AuthOptions,
): Promise<void> {
  await firebasePost(opts, "setAccountInfo", {
    idToken,
    deleteProvider: [providerId],
  });
}

// トークンリフレッシュ
export async function refreshToken(
  token: string,
  opts?: AuthOptions,
): Promise<AuthSession> {
  const res = await f(opts)(`${SECURE_TOKEN}/token?key=${key(opts)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(token)}`,
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    throw new AuthError("token", res.status, data);
  }
  return {
    idToken: data["id_token"] as string,
    refreshToken: data["refresh_token"] as string,
    localId: data["user_id"] as string,
    expiresIn: Number(data["expires_in"]),
  };
}

function toSession(data: Record<string, unknown>): AuthSession {
  return {
    idToken: (data["idToken"] ?? data["id_token"]) as string,
    refreshToken: (data["refreshToken"] ?? data["refresh_token"]) as string,
    localId: (data["localId"] ?? data["user_id"]) as string,
    expiresIn: Number(data["expiresIn"] ?? data["expires_in"]),
    email: data["email"] as string | undefined,
    displayName: data["displayName"] as string | undefined,
    isNewUser: data["isNewUser"] as boolean | undefined,
    providerId: data["providerId"] as string | undefined,
  };
}

export class AuthError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Firebase Auth ${endpoint}: ${status}`);
    this.name = "AuthError";
  }
}
