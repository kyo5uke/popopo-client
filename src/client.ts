import type { AuthSession, AuthOptions } from "./auth.ts";
import { signInAnonymously, signInWithEmail, signUpWithEmail, refreshToken } from "./auth.ts";
import { request, type RequestConfig, type ApiResponse, PopopoApiError } from "./request.ts";
import type { Route } from "./endpoints.ts";
import * as ep from "./endpoints.ts";

export type { ApiResponse, AuthSession, PopopoApiError };

export interface ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  fetch?: typeof globalThis.fetch;
}

const DEFAULT_BASE_URL = "https://api.popopo.com";

export class Popopo {
  private token?: string;
  private _refreshToken?: string;
  private localId?: string;
  private readonly config: RequestConfig;
  private readonly authOpts: AuthOptions;

  constructor(opts: ClientConfig = {}) {
    this.config = {
      baseUrl: opts.baseUrl ?? DEFAULT_BASE_URL,
      fetch: opts.fetch,
    };
    this.authOpts = {
      apiKey: opts.apiKey,
      fetch: opts.fetch,
    };
  }

  get userId(): string | undefined {
    return this.localId;
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

  async loginAnonymous(): Promise<AuthSession> {
    const session = await signInAnonymously(this.authOpts);
    this.applySession(session);
    return session;
  }

  async loginEmail(email: string, password: string): Promise<AuthSession> {
    const session = await signInWithEmail(email, password, this.authOpts);
    this.applySession(session);
    return session;
  }

  async signupEmail(email: string, password: string): Promise<AuthSession> {
    const session = await signUpWithEmail(email, password, this.authOpts);
    this.applySession(session);
    return session;
  }

  async refresh(): Promise<AuthSession> {
    if (!this._refreshToken) throw new Error("No refresh token available");
    const session = await refreshToken(this._refreshToken, this.authOpts);
    this.applySession(session);
    return session;
  }

  private applySession(session: AuthSession): void {
    this.setToken(session.idToken, session.refreshToken, session.localId);
  }

  async call<T = unknown>(route: Route, body?: unknown): Promise<T> {
    const res = await request<T>(this.config, route.method, route.path, body);
    return res.data;
  }

  // ユーザー

  createAccount() {
    return this.call(ep.users.create(), {});
  }

  getProfile() {
    return this.call(ep.users.profile(), {});
  }

  updateProfile(data: Record<string, unknown>) {
    return this.call(ep.users.profile(), data);
  }

  updateProfileIcon(data: Record<string, unknown>) {
    return this.call(ep.users.profileIcon(), data);
  }

  updateProfileLook(data: Record<string, unknown>) {
    return this.call(ep.users.profileLook(), data);
  }

  regenerateFriendCode() {
    return this.call(ep.users.friendCode(), {});
  }

  setBirthday(data: Record<string, unknown>) {
    return this.call(ep.users.birthday(), data);
  }

  getPushSetting() {
    return this.call(ep.users.pushSetting(), {});
  }

  updatePushSetting(data: Record<string, unknown>) {
    return this.call(ep.users.pushSetting(), data);
  }

  updateTutorial(data: Record<string, unknown>) {
    return this.call(ep.users.tutorial(), data);
  }

  agreeTerms(data: Record<string, unknown>) {
    return this.call(ep.users.termsAgreements(), data);
  }

  getGeo() {
    return this.call(ep.users.geo(), {});
  }

  getHomeSpaces() {
    return this.call(ep.users.homeDisplaySpaces(), {});
  }

  getUser(userId: string) {
    return this.call(ep.users.byId(userId), {});
  }

  blockUser(userId: string) {
    return this.call(ep.users.blockUser(userId), {});
  }

  // フォロー

  getFollowers(userId: string) {
    return this.call(ep.followers.list(userId), {});
  }

  follow(userId: string) {
    return this.call(ep.followers.follow(userId), {});
  }

  unfollow(userId: string) {
    return this.call(ep.followers.unfollow(userId));
  }

  // スペース

  createSpace(data: Record<string, unknown>) {
    return this.call(ep.spaces.create(), data);
  }

  updateSpace(spaceKey: string, data: Record<string, unknown>) {
    return this.call(ep.spaces.update(spaceKey), data);
  }

  getConnectionInfo(spaceKey: string) {
    return this.call(ep.spaces.connectionInfo(spaceKey), {});
  }

  setBackground(spaceKey: string, background: Record<string, unknown>) {
    return this.call(ep.spaces.setBackground(spaceKey), { background });
  }

  setBgm(spaceKey: string, bgm: Record<string, unknown>) {
    return this.call(ep.spaces.setBgm(spaceKey), { bgm });
  }

  sendMessage(spaceKey: string, kind: string, value: string) {
    return this.call(ep.spaces.messages(spaceKey), { kind, value });
  }

  connectSpace(spaceKey: string, muted = false) {
    return this.call(ep.spaces.connect(spaceKey), { muted });
  }

  disconnectSpace(spaceKey: string) {
    return this.call(ep.spaces.disconnect(spaceKey));
  }

  setMuted(spaceKey: string, muted: boolean) {
    return this.call(ep.spaces.mute(spaceKey), { muted });
  }

  createSpaceInvite(spaceKey: string, limit: number, expiredAtSeconds: number) {
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

  postComment(spaceKey: string, liveId: string, data: Record<string, unknown>) {
    return this.call(ep.lives.comments(spaceKey, liveId), data);
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

  // コイン

  getCoinTransactions() {
    return this.call(ep.coin.transactions());
  }

  getCoinExpirations() {
    return this.call(ep.coin.upcomingExpirations());
  }

  reclaimCoinPurchase(data: Record<string, unknown>) {
    return this.call(ep.coin.reclaimIab(), data);
  }

  // プッシュ通知

  sendCallPush(data: Record<string, unknown>) {
    return this.call(ep.push.sendCall(), data);
  }

  cancelCallPush(callPushId: string) {
    return this.call(ep.push.cancelCall(callPushId));
  }

  registerDevice(deviceId: string, data: Record<string, unknown>) {
    return this.call(ep.push.registerDevice(deviceId), data);
  }

  // 招待

  getInvite(key: string) {
    return this.call(ep.invites.byKey(key), {});
  }

  acceptInvite(key: string) {
    return this.call(ep.invites.accept(key), {});
  }

  // 通報

  report(data: Record<string, unknown>) {
    return this.call(ep.reports.create(), data);
  }
}
