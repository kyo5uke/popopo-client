import type { AuthOptions } from "./auth.ts";
import {
  signInAnonymously, signInWithEmail, signUpWithEmail,
  signInWithCustomToken, signInWithIdp, signInWithEmailLink,
  signInWithPhoneNumber, sendPhoneVerificationCode, sendSignInLink,
  linkWithIdp, linkWithPhoneNumber,
  lookupAccount, updateFirebaseProfile, unlinkProvider,
  refreshToken,
} from "./auth.ts";
import { request, type RequestConfig, PopopoApiError } from "./request.ts";
import {
  getCoinBalance, getDocument, listDocuments, listSpaceMessages, listLiveComments,
  type FirestoreDoc, type ParsedMessage, type ParsedComment,
} from "./firestore.ts";
import * as tso from "./tso.ts";
import type { TsoConfig } from "./tso.ts";
import * as algolia from "./algolia.ts";
import type { AlgoliaConfig, SearchParams, SearchResult, AlgoliaUser, AlgoliaItem, AlgoliaLive } from "./algolia.ts";
import type { Route } from "./endpoints.ts";
import type {
  AuthSession, SessionData, PhoneVerificationResult, CoinBalance, TsoTokenResponse,
} from "./types.ts";

// APIモジュール
import { createUserMethods } from "./api/users.ts";
import { createSpaceMethods } from "./api/spaces.ts";
import { createLiveMethods } from "./api/lives.ts";
import { createSocialMethods } from "./api/social.ts";
import { createStoreMethods } from "./api/store.ts";
import { createDeviceMethods } from "./api/device.ts";

export { PopopoApiError };

export interface ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  tso?: TsoConfig;
  fetch?: typeof globalThis.fetch;
  autoRefresh?: boolean; // 401時に自動リフレッシュ（デフォルトtrue）
}

const DEFAULT_BASE_URL = "https://api.popopo.com";

export class Popopo {
  private token?: string;
  private _refreshToken?: string;
  private localId?: string;
  private readonly config: RequestConfig;
  private readonly authOpts: AuthOptions;
  private readonly tsoConfig: TsoConfig;
  private readonly autoRefresh: boolean;

  // 分割されたAPIメソッド群
  readonly users;
  readonly spaces;
  readonly lives;
  readonly social;
  readonly store;
  readonly device;

  constructor(opts: ClientConfig = {}) {
    this.config = {
      baseUrl: opts.baseUrl ?? DEFAULT_BASE_URL,
      fetch: opts.fetch,
    };
    this.authOpts = { apiKey: opts.apiKey, fetch: opts.fetch };
    this.tsoConfig = { ...opts.tso, fetch: opts.fetch };
    this.autoRefresh = opts.autoRefresh !== false;

    const caller = this.call.bind(this);
    this.users = createUserMethods(caller);
    this.spaces = createSpaceMethods(caller);
    this.lives = createLiveMethods(caller);
    this.social = createSocialMethods(caller);
    this.store = createStoreMethods(caller);
    this.device = createDeviceMethods(caller);
  }

  // セッション

  get userId(): string | undefined { return this.localId; }
  get idToken(): string | undefined { return this.token; }
  get isLoggedIn(): boolean { return this.token !== undefined; }

  setToken(idToken: string, refresh?: string, localId?: string): void {
    this.token = idToken;
    this._refreshToken = refresh;
    this.localId = localId;
    this.config.token = idToken;
  }

  clearToken(): void {
    this.token = undefined;
    this._refreshToken = undefined;
    this.localId = undefined;
    this.config.token = undefined;
  }

  exportSession(): SessionData {
    return { idToken: this.token, refreshToken: this._refreshToken, localId: this.localId };
  }

  importSession(data: SessionData): void {
    if (data.idToken) this.setToken(data.idToken, data.refreshToken, data.localId);
  }

  private applySession(session: AuthSession): void {
    this.setToken(session.idToken, session.refreshToken, session.localId);
  }

  private requireToken(): string {
    if (!this.token) throw new Error("ログインしていません");
    return this.token;
  }

  private requireUserId(): string {
    if (!this.localId) throw new Error("ログインしていません");
    return this.localId;
  }

  // 認証 - ログイン

  async loginAnonymous(): Promise<AuthSession> {
    const s = await signInAnonymously(this.authOpts);
    this.applySession(s); return s;
  }

  async loginEmail(email: string, password: string): Promise<AuthSession> {
    const s = await signInWithEmail(email, password, this.authOpts);
    this.applySession(s); return s;
  }

  async signupEmail(email: string, password: string): Promise<AuthSession> {
    const s = await signUpWithEmail(email, password, this.authOpts);
    this.applySession(s); return s;
  }

  async loginCustomToken(token: string): Promise<AuthSession> {
    const s = await signInWithCustomToken(token, this.authOpts);
    this.applySession(s); return s;
  }

  async loginGoogle(credentials: { idToken?: string; accessToken?: string }): Promise<AuthSession> {
    const s = await signInWithIdp("google.com", credentials, this.authOpts);
    this.applySession(s); return s;
  }

  async loginApple(credentials: { idToken?: string; nonce?: string }): Promise<AuthSession> {
    const s = await signInWithIdp("apple.com", credentials, this.authOpts);
    this.applySession(s); return s;
  }

  async loginFacebook(accessToken: string): Promise<AuthSession> {
    const s = await signInWithIdp("facebook.com", { accessToken }, this.authOpts);
    this.applySession(s); return s;
  }

  async loginTwitter(accessToken: string): Promise<AuthSession> {
    const s = await signInWithIdp("twitter.com", { accessToken }, this.authOpts);
    this.applySession(s); return s;
  }

  async loginGitHub(accessToken: string): Promise<AuthSession> {
    const s = await signInWithIdp("github.com", { accessToken }, this.authOpts);
    this.applySession(s); return s;
  }

  async sendPhoneCode(phoneNumber: string): Promise<PhoneVerificationResult> {
    return sendPhoneVerificationCode(phoneNumber, this.authOpts);
  }

  async loginPhone(sessionInfo: string, code: string): Promise<AuthSession> {
    const s = await signInWithPhoneNumber(sessionInfo, code, this.authOpts);
    this.applySession(s); return s;
  }

  async sendEmailLink(email: string, continueUrl: string): Promise<void> {
    return sendSignInLink(email, continueUrl, this.authOpts);
  }

  async loginEmailLink(email: string, oobCode: string): Promise<AuthSession> {
    const s = await signInWithEmailLink(email, oobCode, this.authOpts);
    this.applySession(s); return s;
  }

  async refresh(): Promise<AuthSession> {
    if (!this._refreshToken) throw new Error("リフレッシュトークンがありません");
    const s = await refreshToken(this._refreshToken, this.authOpts);
    this.applySession(s); return s;
  }

  // 認証 - アカウント管理

  async linkGoogle(credentials: { idToken?: string; accessToken?: string }): Promise<AuthSession> {
    const s = await linkWithIdp(this.requireToken(), "google.com", credentials, this.authOpts);
    this.applySession(s); return s;
  }

  async linkApple(credentials: { idToken?: string; nonce?: string }): Promise<AuthSession> {
    const s = await linkWithIdp(this.requireToken(), "apple.com", credentials, this.authOpts);
    this.applySession(s); return s;
  }

  async linkFacebook(accessToken: string): Promise<AuthSession> {
    const s = await linkWithIdp(this.requireToken(), "facebook.com", { accessToken }, this.authOpts);
    this.applySession(s); return s;
  }

  async linkPhone(sessionInfo: string, code: string): Promise<AuthSession> {
    const s = await linkWithPhoneNumber(this.requireToken(), sessionInfo, code, this.authOpts);
    this.applySession(s); return s;
  }

  async unlinkProvider(providerId: string): Promise<void> {
    return unlinkProvider(this.requireToken(), providerId, this.authOpts);
  }

  async getAccountInfo(): Promise<Record<string, unknown>> {
    return lookupAccount(this.requireToken(), this.authOpts);
  }

  async updateFirebaseProfile(profile: { displayName?: string; photoUrl?: string }): Promise<AuthSession> {
    const s = await updateFirebaseProfile(this.requireToken(), profile, this.authOpts);
    this.applySession(s); return s;
  }

  // API呼び出し（401時の自動リフレッシュ付き）

  async call<T = unknown>(route: Route, body?: unknown): Promise<T> {
    try {
      const res = await request<T>(this.config, route.method, route.path, body);
      return res.data;
    } catch (e) {
      if (e instanceof PopopoApiError && e.status === 401 && this.autoRefresh && this._refreshToken) {
        await this.refresh();
        const res = await request<T>(this.config, route.method, route.path, body);
        return res.data;
      }
      throw e;
    }
  }

  // Firestore

  async getCoinBalance(): Promise<CoinBalance> {
    return getCoinBalance(this.requireToken(), this.requireUserId());
  }

  async getFirestoreDoc(collection: string, docId: string): Promise<FirestoreDoc> {
    return getDocument(this.requireToken(), collection, docId);
  }

  async listComments(spaceKey: string, liveId: string, params?: { limit?: number; pageToken?: string }) {
    return listLiveComments(this.requireToken(), spaceKey, liveId, params);
  }

  async listMessages(spaceKey: string, params?: { limit?: number; pageToken?: string }) {
    return listSpaceMessages(this.requireToken(), spaceKey, params);
  }

  async listFirestoreCollection(path: string, params?: { limit?: number; orderBy?: string; pageToken?: string }) {
    return listDocuments(this.requireToken(), path, params);
  }

  // ページネーション - 全件取得するasyncジェネレーター
  async *paginateComments(spaceKey: string, liveId: string, limit = 50) {
    let pageToken: string | undefined;
    do {
      const page = await this.listComments(spaceKey, liveId, { limit, pageToken });
      yield* page.comments;
      pageToken = page.nextPageToken;
    } while (pageToken);
  }

  async *paginateMessages(spaceKey: string, limit = 50) {
    let pageToken: string | undefined;
    do {
      const page = await this.listMessages(spaceKey, { limit, pageToken });
      yield* page.messages;
      pageToken = page.nextPageToken;
    } while (pageToken);
  }

  // Firestoreのapp-configs読み取り
  async getAppConfig(name: string): Promise<Record<string, unknown>> {
    const doc = await getDocument(this.requireToken(), "app-configs", name);
    return doc.fields;
  }

  // Firestoreのusersコレクション
  async listUsers(params?: { limit?: number; pageToken?: string }) {
    return listDocuments(this.requireToken(), "users", params);
  }

  // Algolia検索

  searchUsers(params?: SearchParams): Promise<SearchResult<AlgoliaUser>> {
    return algolia.searchUsers(params);
  }

  searchItems(params?: SearchParams): Promise<SearchResult<AlgoliaItem>> {
    return algolia.searchItems(params);
  }

  searchLives(params?: SearchParams): Promise<SearchResult<AlgoliaLive>> {
    return algolia.searchLives(params);
  }

  async *paginateUsers(params?: SearchParams) {
    yield* algolia.paginateAll<AlgoliaUser>("users", params);
  }

  async *paginateItems(params?: SearchParams) {
    yield* algolia.paginateAll<AlgoliaItem>("items", params);
  }

  // TSO

  async tsoExchangeCode(code: string, codeVerifier: string): Promise<TsoTokenResponse> {
    return tso.exchangeAuthorizationCode(code, codeVerifier, this.tsoConfig);
  }

  async tsoRefreshToken(rt: string): Promise<TsoTokenResponse> {
    return tso.refreshAccessToken(rt, this.tsoConfig);
  }

  async tsoGetFileStatus(fileId: string, accessToken: string): Promise<Record<string, unknown>> {
    return tso.getFileStatus(fileId, accessToken, this.tsoConfig);
  }

  tsoBuildFileUrl(fileId: string): string {
    return tso.buildFileUrl(fileId, this.tsoConfig);
  }
}
