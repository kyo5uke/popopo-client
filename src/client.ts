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
import { getCoinBalance, getDocument, type FirestoreDoc } from "./firestore.ts";
import * as tso from "./tso.ts";
import type { TsoConfig } from "./tso.ts";
import type { Route } from "./endpoints.ts";
import * as ep from "./endpoints.ts";
import type {
  AuthSession, SessionData, PhoneVerificationResult, CoinBalance,
  TsoTokenResponse, ResultResponse, GeoResponse, HomeDisplaySpacesResponse,
  ConnectionInfo, CoinTransactionsResponse, CoinExpirationsResponse,
  SpaceInvite, FriendInvite, StoryResponse, ViolationReportResponse,
  CreateSpaceResponse,
} from "./types.ts";

export { PopopoApiError };

export interface ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  tso?: TsoConfig;
  fetch?: typeof globalThis.fetch;
}

const DEFAULT_BASE_URL = "https://api.popopo.com";

export class Popopo {
  private token?: string;
  private _refreshToken?: string;
  private localId?: string;
  private readonly config: RequestConfig;
  private readonly authOpts: AuthOptions;
  private readonly tsoConfig: TsoConfig;

  constructor(opts: ClientConfig = {}) {
    this.config = {
      baseUrl: opts.baseUrl ?? DEFAULT_BASE_URL,
      fetch: opts.fetch,
    };
    this.authOpts = {
      apiKey: opts.apiKey,
      fetch: opts.fetch,
    };
    this.tsoConfig = { ...opts.tso, fetch: opts.fetch };
  }

  get userId(): string | undefined {
    return this.localId;
  }

  get idToken(): string | undefined {
    return this.token;
  }

  get isLoggedIn(): boolean {
    return this.token !== undefined;
  }

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
    this.applySession(s);
    return s;
  }

  async loginEmail(email: string, password: string): Promise<AuthSession> {
    const s = await signInWithEmail(email, password, this.authOpts);
    this.applySession(s);
    return s;
  }

  async signupEmail(email: string, password: string): Promise<AuthSession> {
    const s = await signUpWithEmail(email, password, this.authOpts);
    this.applySession(s);
    return s;
  }

  async loginCustomToken(token: string): Promise<AuthSession> {
    const s = await signInWithCustomToken(token, this.authOpts);
    this.applySession(s);
    return s;
  }

  async loginGoogle(credentials: { idToken?: string; accessToken?: string }): Promise<AuthSession> {
    const s = await signInWithIdp("google.com", credentials, this.authOpts);
    this.applySession(s);
    return s;
  }

  async loginApple(credentials: { idToken?: string; nonce?: string }): Promise<AuthSession> {
    const s = await signInWithIdp("apple.com", credentials, this.authOpts);
    this.applySession(s);
    return s;
  }

  async loginFacebook(accessToken: string): Promise<AuthSession> {
    const s = await signInWithIdp("facebook.com", { accessToken }, this.authOpts);
    this.applySession(s);
    return s;
  }

  async loginTwitter(accessToken: string): Promise<AuthSession> {
    const s = await signInWithIdp("twitter.com", { accessToken }, this.authOpts);
    this.applySession(s);
    return s;
  }

  async loginGitHub(accessToken: string): Promise<AuthSession> {
    const s = await signInWithIdp("github.com", { accessToken }, this.authOpts);
    this.applySession(s);
    return s;
  }

  async sendPhoneCode(phoneNumber: string): Promise<PhoneVerificationResult> {
    return sendPhoneVerificationCode(phoneNumber, this.authOpts);
  }

  async loginPhone(sessionInfo: string, code: string): Promise<AuthSession> {
    const s = await signInWithPhoneNumber(sessionInfo, code, this.authOpts);
    this.applySession(s);
    return s;
  }

  async sendEmailLink(email: string, continueUrl: string): Promise<void> {
    return sendSignInLink(email, continueUrl, this.authOpts);
  }

  async loginEmailLink(email: string, oobCode: string): Promise<AuthSession> {
    const s = await signInWithEmailLink(email, oobCode, this.authOpts);
    this.applySession(s);
    return s;
  }

  async refresh(): Promise<AuthSession> {
    if (!this._refreshToken) throw new Error("リフレッシュトークンがありません");
    const s = await refreshToken(this._refreshToken, this.authOpts);
    this.applySession(s);
    return s;
  }

  // 認証 - アカウント管理

  async linkGoogle(credentials: { idToken?: string; accessToken?: string }): Promise<AuthSession> {
    const s = await linkWithIdp(this.requireToken(), "google.com", credentials, this.authOpts);
    this.applySession(s);
    return s;
  }

  async linkApple(credentials: { idToken?: string; nonce?: string }): Promise<AuthSession> {
    const s = await linkWithIdp(this.requireToken(), "apple.com", credentials, this.authOpts);
    this.applySession(s);
    return s;
  }

  async linkFacebook(accessToken: string): Promise<AuthSession> {
    const s = await linkWithIdp(this.requireToken(), "facebook.com", { accessToken }, this.authOpts);
    this.applySession(s);
    return s;
  }

  async linkPhone(sessionInfo: string, code: string): Promise<AuthSession> {
    const s = await linkWithPhoneNumber(this.requireToken(), sessionInfo, code, this.authOpts);
    this.applySession(s);
    return s;
  }

  async unlinkProvider(providerId: string): Promise<void> {
    return unlinkProvider(this.requireToken(), providerId, this.authOpts);
  }

  async getAccountInfo(): Promise<Record<string, unknown>> {
    return lookupAccount(this.requireToken(), this.authOpts);
  }

  async updateFirebaseProfile(profile: { displayName?: string; photoUrl?: string }): Promise<AuthSession> {
    const s = await updateFirebaseProfile(this.requireToken(), profile, this.authOpts);
    this.applySession(s);
    return s;
  }

  // API呼び出し

  async call<T = unknown>(route: Route, body?: unknown): Promise<T> {
    const res = await request<T>(this.config, route.method, route.path, body);
    return res.data;
  }

  // ユーザー

  createAccount(): Promise<ResultResponse> {
    return this.call(ep.users.create(), {});
  }

  getProfile(): Promise<ResultResponse> {
    return this.call(ep.users.profile(), {});
  }

  updateProfile(data: Record<string, unknown>): Promise<ResultResponse> {
    return this.call(ep.users.profile(), data);
  }

  updateProfileIcon(data: Record<string, unknown>): Promise<ResultResponse> {
    return this.call(ep.users.profileIcon(), data);
  }

  updateProfileLook(data: Record<string, unknown>): Promise<ResultResponse> {
    return this.call(ep.users.profileLook(), data);
  }

  regenerateFriendCode() {
    return this.call(ep.users.friendCode(), {});
  }

  setBirthday(year: number, month: number, day: number) {
    return this.call(ep.users.birthday(), { year, month, day });
  }

  getPushSetting(): Promise<ResultResponse> {
    return this.call(ep.users.pushSetting(), {});
  }

  updatePushSetting(data: Record<string, unknown>): Promise<ResultResponse> {
    return this.call(ep.users.pushSetting(), data);
  }

  updateTutorial(version: number, step: number, completed: boolean): Promise<ResultResponse> {
    return this.call(ep.users.tutorial(), { version, step, completed });
  }

  agreeTerms(kind: "terms-of-service" | "privacy"): Promise<ResultResponse> {
    return this.call(ep.users.termsAgreements(), { kind });
  }

  getGeo(): Promise<GeoResponse> {
    return this.call(ep.users.geo(), {});
  }

  getHomeSpaces(data: Record<string, unknown> = {}): Promise<HomeDisplaySpacesResponse> {
    return this.call(ep.users.homeDisplaySpaces(), data);
  }

  getUser(userId: string) {
    return this.call(ep.users.byId(userId), {});
  }

  blockUser(userId: string): Promise<ResultResponse> {
    return this.call(ep.users.blockUser(userId), {});
  }

  postStory(message: string): Promise<StoryResponse> {
    return this.call(ep.users.stories(), { message });
  }

  createFriendInvite(limit: number, expiredAtSeconds: number): Promise<FriendInvite> {
    return this.call(ep.users.friendInvites(), { limit, expiredAtSeconds });
  }

  // フォロー

  getFollowers(userId: string): Promise<ResultResponse> {
    return this.call(ep.followers.list(userId), {});
  }

  follow(userId: string): Promise<ResultResponse> {
    return this.call(ep.followers.follow(userId), {});
  }

  unfollow(userId: string): Promise<ResultResponse> {
    return this.call(ep.followers.unfollow(userId));
  }

  // スペース

  createSpace(data: Record<string, unknown>): Promise<CreateSpaceResponse> {
    return this.call(ep.spaces.create(), data);
  }

  updateSpace(spaceKey: string, data: Record<string, unknown>): Promise<CreateSpaceResponse> {
    return this.call(ep.spaces.update(spaceKey), data);
  }

  getConnectionInfo(spaceKey: string): Promise<ConnectionInfo> {
    return this.call(ep.spaces.connectionInfo(spaceKey), {});
  }

  setBackground(spaceKey: string, background: Record<string, unknown>): Promise<ResultResponse> {
    return this.call(ep.spaces.setBackground(spaceKey), { background });
  }

  setBgm(spaceKey: string, bgm: Record<string, unknown>): Promise<ResultResponse> {
    return this.call(ep.spaces.setBgm(spaceKey), { bgm });
  }

  sendMessage(spaceKey: string, kind: string, value: string): Promise<ResultResponse> {
    return this.call(ep.spaces.messages(spaceKey), { kind, value });
  }

  connectSpace(spaceKey: string, muted = false): Promise<ResultResponse> {
    return this.call(ep.spaces.connect(spaceKey), { muted });
  }

  disconnectSpace(spaceKey: string): Promise<ResultResponse> {
    return this.call(ep.spaces.disconnect(spaceKey));
  }

  setMuted(spaceKey: string, muted: boolean): Promise<ResultResponse> {
    return this.call(ep.spaces.mute(spaceKey), { muted });
  }

  createSpaceInvite(spaceKey: string, limit: number, expiredAtSeconds: number): Promise<SpaceInvite> {
    return this.call(ep.spaces.invites(spaceKey), { limit, expiredAtSeconds });
  }

  // ライブ配信

  getLives(spaceKey: string) {
    return this.call(ep.lives.list(spaceKey), {});
  }

  getLive(spaceKey: string, liveId: string) {
    return this.call(ep.lives.byId(spaceKey, liveId), {});
  }

  getComments(spaceKey: string, liveId: string) {
    return this.call(ep.lives.comments(spaceKey, liveId), {});
  }

  postComment(spaceKey: string, liveId: string, value: string) {
    return this.call(ep.lives.comments(spaceKey, liveId), { kind: "text", value });
  }

  deleteComment(spaceKey: string, liveId: string, commentId: string) {
    return this.call(ep.lives.deleteComment(spaceKey, liveId, commentId));
  }

  sendReaction(spaceKey: string, liveId: string, data: Record<string, unknown>) {
    return this.call(ep.lives.reactions(spaceKey, liveId), data);
  }

  sendPower(spaceKey: string, liveId: string, data: Record<string, unknown>) {
    return this.call(ep.lives.powers(spaceKey, liveId), data);
  }

  // 抽選

  getSelections(spaceKey: string, liveId: string) {
    return this.call(ep.selections.list(spaceKey, liveId), {});
  }

  participateSelection(spaceKey: string, liveId: string, selectionId: string) {
    return this.call(ep.selections.participate(spaceKey, liveId, selectionId), {});
  }

  // コイン (API)

  getCoinTransactions(): Promise<CoinTransactionsResponse> {
    return this.call(ep.coin.transactions());
  }

  getCoinExpirations(): Promise<CoinExpirationsResponse> {
    return this.call(ep.coin.upcomingExpirations());
  }

  reclaimCoinPurchase(data: Record<string, unknown>) {
    return this.call(ep.coin.reclaimIab(), data);
  }

  // コイン (Firestore)

  async getCoinBalance(): Promise<CoinBalance> {
    return getCoinBalance(this.requireToken(), this.requireUserId());
  }

  async getFirestoreDoc(collection: string, docId: string): Promise<FirestoreDoc> {
    return getDocument(this.requireToken(), collection, docId);
  }

  // プッシュ通知

  sendCallPush(data: Record<string, unknown>) {
    return this.call(ep.push.sendCall(), data);
  }

  cancelCallPush(callPushId: string) {
    return this.call(ep.push.cancelCall(callPushId));
  }

  registerDevice(deviceId: string, data: Record<string, unknown>): Promise<ResultResponse> {
    return this.call(ep.push.registerDevice(deviceId), data);
  }

  unregisterDevice(deviceId: string): Promise<ResultResponse> {
    return this.call(ep.push.unregisterDevice(deviceId));
  }

  // 招待

  getInvite(key: string) {
    return this.call(ep.invites.byKey(key), {});
  }

  acceptInvite(key: string) {
    return this.call(ep.invites.accept(key), {});
  }

  // 通報

  report(data: Record<string, unknown>): Promise<ViolationReportResponse> {
    return this.call(ep.reports.create(), data);
  }

  // スタンプカード

  stamp(cardId: string) {
    return this.call(ep.stampCards.stamp(cardId), {});
  }

  unlockStampLane(cardId: string, laneId: string) {
    return this.call(ep.stampCards.unlockLane(cardId, laneId), {});
  }

  claimStampReward(cardId: string, laneId: string, rewardId: string) {
    return this.call(ep.stampCards.claimReward(cardId, laneId, rewardId), {});
  }

  // サブスクリプション

  reclaimSubscription(data: Record<string, unknown>) {
    return this.call(ep.subscription.reclaimIab(), data);
  }

  // ショップ

  getShopItemShareImage(itemId: string) {
    return this.call(ep.shop.itemShareImage(itemId), {});
  }

  // VirtualCast OAuth (API経由)

  getVirtualCastAccessToken() {
    return this.call(ep.virtualcast.accessToken(), {});
  }

  virtualCastApiRelay(data: Record<string, unknown>) {
    return this.call(ep.virtualcast.apiRelay(), data);
  }

  // 通知

  getNotificationContent(notificationId: string) {
    return this.call(ep.notifications.deliveryContent(notificationId), {});
  }

  // ユーザー設定

  getUserSettings(targetUserId: string) {
    return this.call(ep.users.userSettings(targetUserId), {});
  }

  updateUserSettings(targetUserId: string, data: Record<string, unknown>) {
    return this.call(ep.users.userSettings(targetUserId), data);
  }

  getSpaceSetting(spaceKey: string) {
    return this.call(ep.users.spaceSetting(spaceKey), {});
  }

  updateSpaceSetting(spaceKey: string, data: Record<string, unknown>) {
    return this.call(ep.users.spaceSetting(spaceKey), data);
  }

  getSelfIntro(templateId: string) {
    return this.call(ep.users.selfIntro(templateId), {});
  }

  updateSelfIntro(templateId: string, data: Record<string, unknown>) {
    return this.call(ep.users.selfIntro(templateId), data);
  }

  getInventory(itemId: string) {
    return this.call(ep.users.inventory(itemId), {});
  }

  useFriendInvite(inviteKey: string) {
    return this.call(ep.users.useFriendInvite(inviteKey), {});
  }

  // TSO (VirtualCast/TheSeedOnline)

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

  // セッション保存/復元

  exportSession(): SessionData {
    return { idToken: this.token, refreshToken: this._refreshToken, localId: this.localId };
  }

  importSession(data: SessionData): void {
    if (data.idToken) this.setToken(data.idToken, data.refreshToken, data.localId);
  }
}
