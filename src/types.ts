// 実際のAPIレスポンスから起こした型定義

// 汎用
export interface ResultResponse {
  result: boolean;
}

// ユーザー
export interface UserProfile {
  userId?: string;
  name?: string;
  alias?: string;
  displayName?: string;
  anotherName?: string;
  iconSource?: string;
  iconUrl?: string;
  friendCode?: string;
  followingCount?: number;
  followersCount?: number;
  lookCount?: number;
  subscription?: { kind: string };
  look?: UserLook;
  createdAt?: number;
  updatedAt?: number;
  onlineSpaceId?: string;
  [key: string]: unknown;
}

export interface UserLook {
  id?: string;
  name?: string;
  icon?: string;
  kind?: string;
  reason?: string;
  modelNumber?: string | null;
  [key: string]: unknown;
}

// 位置情報
export interface GeoResponse {
  countryCode: string;
  updatedAt: number;
}

// スペース
export interface Space {
  spaceKey: string;
  name: string;
  userId: string;
  bgm?: SpaceBgm;
  background?: SpaceBackground;
  [key: string]: unknown;
}

export interface SpaceBgm {
  id: string | null;
  kind: string;
  volume: number;
}

export interface SpaceBackground {
  id: string;
  kind: string;
  homeImageUrls?: string[];
}

export interface HomeDisplaySpacesResponse {
  spaces: HomeDisplaySpace[];
  [key: string]: unknown;
}

export interface HomeDisplaySpace {
  space: Space;
  live?: LiveInfo;
  [key: string]: unknown;
}

// TRTC接続情報
export interface ConnectionInfo {
  userSig: string;
  privateMapKey?: string;
  [key: string]: unknown;
}

// ライブ
export interface LiveInfo {
  id: string;
  spaceKey: string;
  userId: string;
  token?: string;
  genreId?: string;
  tags?: string[];
  canEnter?: boolean;
  currentCount?: number;
  selectionRecruiting?: boolean;
  createdAt?: number;
  [key: string]: unknown;
}

// コイン
export interface CoinTransactionsResponse {
  cursor: string | null;
  items: CoinTransaction[];
}

export interface CoinTransaction {
  id?: string;
  amount?: number;
  type?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface CoinExpirationsResponse {
  items: CoinExpiration[];
}

export interface CoinExpiration {
  amount?: number;
  expirationDate?: string;
  [key: string]: unknown;
}

// Firestore経由のコイン残高
export interface CoinBalance {
  paid: number;
  free: number;
  raw: Record<string, unknown>;
}

// 招待
export interface SpaceInvite {
  inviteLink: string;
  inviteKey: string;
  spaceKey: string;
}

export interface FriendInvite {
  inviteKey: string;
  inviteLink: string;
  imageURL?: string;
  userId: string;
}

// ストーリー
export interface StoryResponse {
  id: string;
}

// 通報
export interface ViolationReportResponse {
  violationReportId: string;
  reportedAt: number;
}

// スペース作成
export interface CreateSpaceResponse {
  spaceKey: string;
}

export interface UpdateSpaceResponse {
  spaceKey: string;
}

// 認証
export interface AuthSession {
  idToken: string;
  refreshToken: string;
  localId: string;
  expiresIn: number;
  email?: string;
  displayName?: string;
  isNewUser?: boolean;
  providerId?: string;
}

export interface PhoneVerificationResult {
  sessionInfo: string;
}

// TSO
export interface TsoTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType?: string;
  scope?: string;
}

// セッション
export interface SessionData {
  idToken?: string;
  refreshToken?: string;
  localId?: string;
}
