// POPOPOのAPIはRESTっぽくなくて、データ取得にもPOSTやPUTを使う
// 各routeのmethodは実際にサーバーが受け付けるHTTPメソッド

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Route {
  method: Method;
  path: string;
}

function route(method: Method, path: string): Route {
  return { method, path };
}

const e = encodeURIComponent;

export const users = {
  create: () => route("POST", "/api/v2/users"),
  profile: () => route("PUT", "/api/v2/users/me/profile"),
  profileIcon: () => route("PUT", "/api/v2/users/me/profile/icon"),
  profileLook: () => route("PUT", "/api/v2/users/me/profile/look"),
  friendCode: () => route("POST", "/api/v2/users/me/profile/friend-code"),
  birthday: () => route("POST", "/api/v2/users/me/birthday"),
  pushSetting: () => route("PUT", "/api/v2/users/me/push-setting"),
  tutorial: () => route("PUT", "/api/v2/users/me/tutorial"),
  termsAgreements: () => route("POST", "/api/v2/users/me/terms-agreements"),
  geo: () => route("POST", "/api/v2/users/me/geo"),
  homeDisplaySpaces: () => route("POST", "/api/v2/users/me/home-display-spaces"),
  stories: () => route("POST", "/api/v2/users/me/stories"),
  storyById: (id: string) => route("POST", `/api/v2/users/me/stories/${e(id)}`),
  friendInvites: () => route("POST", "/api/v2/users/me/friend-invites"),
  useFriendInvite: (key: string) => route("POST", `/api/v2/users/me/use-friend-invites/${e(key)}`),
  blockUser: (userId: string) => route("POST", `/api/v2/users/me/block-users/${e(userId)}`),
  userSettings: (targetId: string) => route("PUT", `/api/v2/users/me/user-settings/${e(targetId)}`),
  spaceSetting: (spaceKey: string) => route("PUT", `/api/v2/users/me/user-space-setting/${e(spaceKey)}`),
  inventory: (itemId: string) => route("POST", `/api/v2/users/me/user-inventories/${e(itemId)}`),
  selfIntro: (templateId: string) => route("PUT", `/api/v2/users/me/self-introductions/${e(templateId)}`),
  byId: (userId: string) => route("POST", `/api/v2/users/${e(userId)}`),
  shareImage: (userId: string) => route("POST", `/api/v2/users/${e(userId)}/share-image`),
} as const;

export const followers = {
  list: (userId: string) => route("POST", `/api/v2/users/${e(userId)}/followers`),
  follow: (userId: string) => route("POST", `/api/v2/users/${e(userId)}/followers`),
  unfollow: (userId: string) => route("DELETE", `/api/v2/users/${e(userId)}/followers/me`),
} as const;

export const spaces = {
  create: () => route("POST", "/api/v2/spaces"),
  update: (key: string) => route("PUT", `/api/v2/spaces/${e(key)}`),
  connectionInfo: (key: string) => route("POST", `/api/v2/spaces/${e(key)}/connection-info`),
  setBackground: (key: string) => route("PUT", `/api/v2/spaces/${e(key)}/background`),
  setBgm: (key: string) => route("PUT", `/api/v2/spaces/${e(key)}/bgm`),
  invites: (key: string) => route("POST", `/api/v2/spaces/${e(key)}/invites`),
  messages: (key: string) => route("POST", `/api/v2/spaces/${e(key)}/messages`),
  messageById: (key: string, msgId: string) => route("POST", `/api/v2/spaces/${e(key)}/messages/${e(msgId)}`),
  connect: (key: string) => route("POST", `/api/v2/spaces/${e(key)}/users/me/connection`),
  disconnect: (key: string) => route("DELETE", `/api/v2/spaces/${e(key)}/users/me/connection`),
  mute: (key: string) => route("PUT", `/api/v2/spaces/${e(key)}/users/me/connection/muted`),
  userMe: (key: string) => route("POST", `/api/v2/spaces/${e(key)}/users/me`),
  user: (key: string, userId: string) => route("POST", `/api/v2/spaces/${e(key)}/users/${e(userId)}`),
  userRole: (key: string, userId: string) => route("PATCH", `/api/v2/spaces/${e(key)}/users/${e(userId)}/role`),
  hiddenViewer: (key: string, userId: string) => route("PUT", `/api/v2/spaces/${e(key)}/hidden_viewers/${e(userId)}`),
} as const;

export const lives = {
  list: (spaceKey: string) => route("POST", `/api/v2/spaces/${e(spaceKey)}/lives`),
  byId: (spaceKey: string, liveId: string) => route("POST", `/api/v2/spaces/${e(spaceKey)}/lives/${e(liveId)}`),
  comments: (spaceKey: string, liveId: string) => route("POST", `/api/v2/spaces/${e(spaceKey)}/lives/${e(liveId)}/comments`),
  deleteComment: (spaceKey: string, liveId: string, commentId: string) =>
    route("DELETE", `/api/v2/spaces/${e(spaceKey)}/lives/${e(liveId)}/comments/${e(commentId)}`),
  reactions: (spaceKey: string, liveId: string) => route("POST", `/api/v2/spaces/${e(spaceKey)}/lives/${e(liveId)}/reactions`),
  powers: (spaceKey: string, liveId: string) => route("POST", `/api/v2/spaces/${e(spaceKey)}/lives/${e(liveId)}/powers`),
  shareImage: (spaceKey: string, liveId: string) => route("POST", `/api/v2/spaces/${e(spaceKey)}/lives/${e(liveId)}/share-image`),
} as const;

export const selections = {
  list: (spaceKey: string, liveId: string) =>
    route("POST", `/api/v2/spaces/${e(spaceKey)}/lives/${e(liveId)}/selections`),
  byId: (spaceKey: string, liveId: string, selId: string) =>
    route("POST", `/api/v2/spaces/${e(spaceKey)}/lives/${e(liveId)}/selections/${e(selId)}`),
  participants: (spaceKey: string, liveId: string, selId: string) =>
    route("POST", `/api/v2/spaces/${e(spaceKey)}/lives/${e(liveId)}/selections/${e(selId)}/participants`),
  participate: (spaceKey: string, liveId: string, selId: string) =>
    route("POST", `/api/v2/spaces/${e(spaceKey)}/lives/${e(liveId)}/selections/${e(selId)}/sequences/participate`),
  nominate: (spaceKey: string, liveId: string, selId: string) =>
    route("POST", `/api/v2/spaces/${e(spaceKey)}/lives/${e(liveId)}/selections/${e(selId)}/sequences/nominate`),
} as const;

export const coin = {
  transactions: () => route("GET", "/api/v2/coin/transactions"),
  upcomingExpirations: () => route("GET", "/api/v2/coin/upcoming-expirations"),
  reclaimIab: () => route("POST", "/api/v2/coin/platforms/iab/reclaims"),
} as const;

export const subscription = {
  reclaimIab: () => route("POST", "/api/v2/subscription/platforms/iab/reclaims"),
} as const;

export const push = {
  sendCall: () => route("POST", "/api/v2/push/call-pushes"),
  cancelCall: (id: string) => route("DELETE", `/api/v2/push/call-pushes/${e(id)}`),
  registerDevice: (id: string) => route("PUT", `/api/v2/push/devices/${e(id)}`),
  unregisterDevice: (id: string) => route("DELETE", `/api/v2/push/devices/${e(id)}`),
} as const;

export const shop = {
  itemShareImage: (itemId: string) => route("POST", `/api/v2/shop/items/${e(itemId)}/share-image`),
} as const;

export const stampCards = {
  stamp: (cardId: string) => route("POST", `/api/v2/stamp-cards/${e(cardId)}/stamps`),
  unlockLane: (cardId: string, laneId: string) =>
    route("POST", `/api/v2/stamp-cards/${e(cardId)}/stamp-lanes/${e(laneId)}/unlock`),
  claimReward: (cardId: string, laneId: string, rewardId: string) =>
    route("POST", `/api/v2/stamp-cards/${e(cardId)}/stamp-lanes/${e(laneId)}/stamp-lane-rewards/${e(rewardId)}/stamp-reward-claims`),
} as const;

export const virtualcast = {
  accessToken: () => route("POST", "/api/v2/users/me/oauth/virtualcast/access-token"),
  apiRelay: () => route("POST", "/api/v2/users/me/oauth/virtualcast/api-relay"),
} as const;

export const notifications = {
  deliveryContent: (id: string) => route("POST", `/api/v2/personal-notifications/${e(id)}/delivery-content`),
} as const;

export const invites = {
  byKey: (key: string) => route("POST", `/api/v2/invites/${e(key)}`),
  accept: (key: string) => route("POST", `/api/v2/invites/${e(key)}/accept`),
} as const;

export const reports = {
  create: () => route("POST", "/api/v2/violation-reports"),
} as const;
