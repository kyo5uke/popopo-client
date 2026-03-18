// コイン・課金・ショップ・スタンプカード・サブスク

import type { Route } from "../endpoints.ts";
import * as ep from "../endpoints.ts";
import type { CoinTransactionsResponse, CoinExpirationsResponse, ResultResponse } from "../types.ts";

type Caller = <T>(route: Route, body?: unknown) => Promise<T>;

export function createStoreMethods(call: Caller) {
  return {
    // コイン
    getCoinTransactions: (): Promise<CoinTransactionsResponse> =>
      call(ep.coin.transactions()),

    getCoinExpirations: (): Promise<CoinExpirationsResponse> =>
      call(ep.coin.upcomingExpirations()),

    reclaimCoinPurchase: (data: Record<string, unknown>) =>
      call(ep.coin.reclaimIab(), data),

    // サブスク
    reclaimSubscription: (data: Record<string, unknown>) =>
      call(ep.subscription.reclaimIab(), data),

    // ショップ
    getShopItemShareImage: (itemId: string) =>
      call(ep.shop.itemShareImage(itemId), {}),

    // スタンプカード
    stamp: (cardId: string) =>
      call(ep.stampCards.stamp(cardId), {}),

    unlockStampLane: (cardId: string, laneId: string) =>
      call(ep.stampCards.unlockLane(cardId, laneId), {}),

    claimStampReward: (cardId: string, laneId: string, rewardId: string) =>
      call(ep.stampCards.claimReward(cardId, laneId, rewardId), {}),
  };
}
