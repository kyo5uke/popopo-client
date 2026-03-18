// フォロー・招待・通報

import type { Route } from "../endpoints.ts";
import * as ep from "../endpoints.ts";
import type { ResultResponse, ViolationReportResponse } from "../types.ts";

type Caller = <T>(route: Route, body?: unknown) => Promise<T>;

export function createSocialMethods(call: Caller) {
  return {
    // フォロー
    getFollowers: (userId: string): Promise<ResultResponse> =>
      call(ep.followers.list(userId), {}),

    follow: (userId: string): Promise<ResultResponse> =>
      call(ep.followers.follow(userId), {}),

    unfollow: (userId: string): Promise<ResultResponse> =>
      call(ep.followers.unfollow(userId)),

    // 招待
    getInvite: (key: string) =>
      call(ep.invites.byKey(key), {}),

    acceptInvite: (key: string) =>
      call(ep.invites.accept(key), {}),

    // 通報
    report: (data: Record<string, unknown>): Promise<ViolationReportResponse> =>
      call(ep.reports.create(), data),
  };
}
