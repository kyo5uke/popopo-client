// プッシュ通知・デバイス管理・通知コンテンツ・VirtualCast

import type { Route } from "../endpoints.ts";
import * as ep from "../endpoints.ts";
import type { ResultResponse } from "../types.ts";

type Caller = <T>(route: Route, body?: unknown) => Promise<T>;

export function createDeviceMethods(call: Caller) {
  return {
    // プッシュ
    sendCallPush: (data: Record<string, unknown>) =>
      call(ep.push.sendCall(), data),

    cancelCallPush: (callPushId: string) =>
      call(ep.push.cancelCall(callPushId)),

    registerDevice: (deviceId: string, data: Record<string, unknown>): Promise<ResultResponse> =>
      call(ep.push.registerDevice(deviceId), data),

    unregisterDevice: (deviceId: string): Promise<ResultResponse> =>
      call(ep.push.unregisterDevice(deviceId)),

    // 通知コンテンツ
    getNotificationContent: (notificationId: string) =>
      call(ep.notifications.deliveryContent(notificationId), {}),

    // VirtualCast OAuth (API経由)
    getVirtualCastAccessToken: () =>
      call(ep.virtualcast.accessToken(), {}),

    virtualCastApiRelay: (data: Record<string, unknown>) =>
      call(ep.virtualcast.apiRelay(), data),
  };
}
