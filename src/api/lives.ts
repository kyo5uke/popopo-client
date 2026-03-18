// ライブ配信・コメント・抽選

import type { Route } from "../endpoints.ts";
import * as ep from "../endpoints.ts";

type Caller = <T>(route: Route, body?: unknown) => Promise<T>;

export function createLiveMethods(call: Caller) {
  return {
    getLives: (spaceKey: string) =>
      call(ep.lives.list(spaceKey), {}),

    getLive: (spaceKey: string, liveId: string) =>
      call(ep.lives.byId(spaceKey, liveId), {}),

    startLive: (spaceKey: string, genreId: string, tags: string[] = [], canEnter = true) =>
      call(ep.lives.start(spaceKey), { genreId, tags, canEnter }),

    postComment: (spaceKey: string, liveId: string, value: string) =>
      call(ep.lives.comments(spaceKey, liveId), { kind: "text", value }),

    deleteComment: (spaceKey: string, liveId: string, commentId: string) =>
      call(ep.lives.deleteComment(spaceKey, liveId, commentId)),

    sendReaction: (spaceKey: string, liveId: string, data: Record<string, unknown>) =>
      call(ep.lives.reactions(spaceKey, liveId), data),

    sendPower: (spaceKey: string, liveId: string, data: Record<string, unknown>) =>
      call(ep.lives.powers(spaceKey, liveId), data),

    // 抽選
    getSelections: (spaceKey: string, liveId: string) =>
      call(ep.selections.list(spaceKey, liveId), {}),

    participateSelection: (spaceKey: string, liveId: string, selectionId: string) =>
      call(ep.selections.participate(spaceKey, liveId, selectionId), {}),
  };
}
