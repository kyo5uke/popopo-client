// スペース関連のAPI操作

import type { Route } from "../endpoints.ts";
import * as ep from "../endpoints.ts";
import type { ResultResponse, ConnectionInfo, SpaceInvite, CreateSpaceResponse } from "../types.ts";

type Caller = <T>(route: Route, body?: unknown) => Promise<T>;

export function createSpaceMethods(call: Caller) {
  return {
    createSpace: (data: Record<string, unknown>): Promise<CreateSpaceResponse> =>
      call(ep.spaces.create(), data),

    updateSpace: (spaceKey: string, data: Record<string, unknown>): Promise<CreateSpaceResponse> =>
      call(ep.spaces.update(spaceKey), data),

    getConnectionInfo: (spaceKey: string): Promise<ConnectionInfo> =>
      call(ep.spaces.connectionInfo(spaceKey), {}),

    setBackground: (spaceKey: string, background: Record<string, unknown>): Promise<ResultResponse> =>
      call(ep.spaces.setBackground(spaceKey), { background }),

    setBgm: (spaceKey: string, bgm: Record<string, unknown>): Promise<ResultResponse> =>
      call(ep.spaces.setBgm(spaceKey), { bgm }),

    sendMessage: (spaceKey: string, kind: string, value: string): Promise<ResultResponse> =>
      call(ep.spaces.messages(spaceKey), { kind, value }),

    connectSpace: (spaceKey: string, muted = false): Promise<ResultResponse> =>
      call(ep.spaces.connect(spaceKey), { muted }),

    disconnectSpace: (spaceKey: string): Promise<ResultResponse> =>
      call(ep.spaces.disconnect(spaceKey)),

    setMuted: (spaceKey: string, muted: boolean): Promise<ResultResponse> =>
      call(ep.spaces.mute(spaceKey), { muted }),

    createSpaceInvite: (spaceKey: string, limit: number, expiredAtSeconds: number): Promise<SpaceInvite> =>
      call(ep.spaces.invites(spaceKey), { limit, expiredAtSeconds }),
  };
}
