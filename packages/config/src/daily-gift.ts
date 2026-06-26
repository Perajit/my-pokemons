import type { ItemKey } from "./items";

export type DailyGiftReward =
  | { type: "coins"; amount: number }
  | { type: "item"; itemKey: ItemKey; quantity: number };

export type DailyGiftConfig = {
  weight: number;
  reward: DailyGiftReward;
};

// weights sum to 100, reading directly as percentages
export const DAILY_GIFT_CONFIGS: readonly DailyGiftConfig[] = [
  { weight: 60, reward: { type: "coins", amount: 5 } },
  { weight: 20, reward: { type: "coins", amount: 10 } },
  { weight: 9, reward: { type: "coins", amount: 50 } },
  { weight: 9, reward: { type: "item", itemKey: "REVIVE", quantity: 1 } },
  { weight: 2, reward: { type: "coins", amount: 100 } },
];
