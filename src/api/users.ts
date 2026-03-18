// ユーザー関連のAPI操作

import type { Route } from "../endpoints.ts";
import * as ep from "../endpoints.ts";
import type { ResultResponse, GeoResponse, HomeDisplaySpacesResponse, StoryResponse, FriendInvite } from "../types.ts";

type Caller = <T>(route: Route, body?: unknown) => Promise<T>;

export function createUserMethods(call: Caller) {
  return {
    createAccount: (): Promise<ResultResponse> =>
      call(ep.users.create(), {}),

    getProfile: (): Promise<ResultResponse> =>
      call(ep.users.profile(), {}),

    updateProfile: (data: Record<string, unknown>): Promise<ResultResponse> =>
      call(ep.users.profile(), data),

    updateProfileIcon: (data: Record<string, unknown>): Promise<ResultResponse> =>
      call(ep.users.profileIcon(), data),

    updateProfileLook: (data: Record<string, unknown>): Promise<ResultResponse> =>
      call(ep.users.profileLook(), data),

    regenerateFriendCode: () =>
      call(ep.users.friendCode(), {}),

    setBirthday: (year: number, month: number, day: number) =>
      call(ep.users.birthday(), { year, month, day }),

    getPushSetting: (): Promise<ResultResponse> =>
      call(ep.users.pushSetting(), {}),

    updatePushSetting: (data: Record<string, unknown>): Promise<ResultResponse> =>
      call(ep.users.pushSetting(), data),

    updateTutorial: (version: number, step: number, completed: boolean): Promise<ResultResponse> =>
      call(ep.users.tutorial(), { version, step, completed }),

    agreeTerms: (kind: "terms-of-service" | "privacy"): Promise<ResultResponse> =>
      call(ep.users.termsAgreements(), { kind }),

    getGeo: (): Promise<GeoResponse> =>
      call(ep.users.geo(), {}),

    getHomeSpaces: (data: Record<string, unknown> = {}): Promise<HomeDisplaySpacesResponse> =>
      call(ep.users.homeDisplaySpaces(), data),

    getUser: (userId: string) =>
      call(ep.users.byId(userId), {}),

    blockUser: (userId: string): Promise<ResultResponse> =>
      call(ep.users.blockUser(userId), {}),

    postStory: (message: string): Promise<StoryResponse> =>
      call(ep.users.stories(), { message }),

    createFriendInvite: (limit: number, expiredAtSeconds: number): Promise<FriendInvite> =>
      call(ep.users.friendInvites(), { limit, expiredAtSeconds }),

    useFriendInvite: (inviteKey: string) =>
      call(ep.users.useFriendInvite(inviteKey), {}),

    getUserSettings: (targetUserId: string) =>
      call(ep.users.userSettings(targetUserId), {}),

    updateUserSettings: (targetUserId: string, data: Record<string, unknown>) =>
      call(ep.users.userSettings(targetUserId), data),

    getSpaceSetting: (spaceKey: string) =>
      call(ep.users.spaceSetting(spaceKey), {}),

    updateSpaceSetting: (spaceKey: string, data: Record<string, unknown>) =>
      call(ep.users.spaceSetting(spaceKey), data),

    getSelfIntro: (templateId: string) =>
      call(ep.users.selfIntro(templateId), {}),

    updateSelfIntro: (templateId: string, data: Record<string, unknown>) =>
      call(ep.users.selfIntro(templateId), data),

    getInventory: (itemId: string) =>
      call(ep.users.inventory(itemId), {}),
  };
}
