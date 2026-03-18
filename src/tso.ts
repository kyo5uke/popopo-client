// TSO (The Seed Online) = VirtualCast のOAuth連携
// ホロスーツ(アバター)の取得にTSOのAPIを使う

import type { TsoTokenResponse } from "./types.ts";

const DEFAULT_OAUTH_BASE = "https://oauth.dev.seed.virtualcast.jp";

export interface TsoConfig {
  oauthBaseUrl?: string;
  fileApiBaseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  fetch?: typeof globalThis.fetch;
}

function fetcher(cfg?: TsoConfig): typeof globalThis.fetch {
  return cfg?.fetch ?? globalThis.fetch;
}

// 認可コードをトークンに交換
export async function exchangeAuthorizationCode(
  code: string,
  codeVerifier: string,
  cfg?: TsoConfig,
): Promise<TsoTokenResponse> {
  const base = cfg?.oauthBaseUrl ?? DEFAULT_OAUTH_BASE;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
  });
  if (cfg?.clientId) body.set("client_id", cfg.clientId);
  if (cfg?.clientSecret) body.set("client_secret", cfg.clientSecret);
  if (cfg?.redirectUri) body.set("redirect_uri", cfg.redirectUri);

  const res = await fetcher(cfg)(`${base}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return parseTokenResponse(res);
}

// リフレッシュトークンでアクセストークンを更新
export async function refreshAccessToken(
  refreshToken: string,
  cfg?: TsoConfig,
): Promise<TsoTokenResponse> {
  const base = cfg?.oauthBaseUrl ?? DEFAULT_OAUTH_BASE;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  if (cfg?.clientId) body.set("client_id", cfg.clientId);
  if (cfg?.clientSecret) body.set("client_secret", cfg.clientSecret);

  const res = await fetcher(cfg)(`${base}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return parseTokenResponse(res);
}

// ファイルのステータス取得
export async function getFileStatus(
  fileId: string,
  accessToken: string,
  cfg?: TsoConfig,
): Promise<Record<string, unknown>> {
  const base = cfg?.fileApiBaseUrl;
  if (!base) throw new Error("fileApiBaseUrl が設定されていません");

  const res = await fetcher(cfg)(`${base}/api/v1/files/${encodeURIComponent(fileId)}/status`, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`TSO ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ファイルのダウンロードURLを構築
export function buildFileUrl(fileId: string, cfg?: TsoConfig): string {
  const base = cfg?.fileApiBaseUrl;
  if (!base) throw new Error("fileApiBaseUrl が設定されていません");
  let url = `${base}/api/v1/files/${encodeURIComponent(fileId)}`;
  if (cfg?.clientId) url += `?client_id=${encodeURIComponent(cfg.clientId)}`;
  return url;
}

async function parseTokenResponse(res: Response): Promise<TsoTokenResponse> {
  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`TSO OAuth ${res.status}: ${JSON.stringify(data)}`);
  return {
    accessToken: (data["access_token"] ?? data["accessToken"]) as string,
    refreshToken: (data["refresh_token"] ?? data["refreshToken"]) as string | undefined,
    expiresIn: Number(data["expires_in"] ?? data["expiresIn"]),
    tokenType: data["token_type"] as string | undefined,
    scope: data["scope"] as string | undefined,
  };
}
