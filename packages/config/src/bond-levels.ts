export type BondLevelKey =
  | "BOND_LEVEL_0D"
  | "BOND_LEVEL_7D"
  | "BOND_LEVEL_30D"
  | "BOND_LEVEL_90D"
  | "BOND_LEVEL_365D";

export const BOND_LEVEL_LABELS: Record<BondLevelKey, string> = {
  BOND_LEVEL_0D: "Just Met",
  BOND_LEVEL_7D: "Good Buddy",
  BOND_LEVEL_30D: "Close Buddy",
  BOND_LEVEL_90D: "Best Buddy",
  BOND_LEVEL_365D: "Forever Buddy",
};

export type BondLevelConfig = {
  key: BondLevelKey;
  days: number;
  coinReward: number;
};

// The first tier (day 0, "Just Met") is a display-only welcome badge: it
// lights up the moment a pokemon is obtained, earns no coins, and writes no
// ledger row. The time-based tiers (7d+) are the paid, ledgered rewards.
export const BOND_LEVEL_CONFIG: readonly BondLevelConfig[] = [
  { key: "BOND_LEVEL_0D", days: 0, coinReward: 0 },
  { key: "BOND_LEVEL_7D", days: 7, coinReward: 15 },
  { key: "BOND_LEVEL_30D", days: 30, coinReward: 40 },
  { key: "BOND_LEVEL_90D", days: 90, coinReward: 100 },
  { key: "BOND_LEVEL_365D", days: 365, coinReward: 300 },
];

// Newly-earned PAID bond levels (coins + ledger + toast). Only time-based
// tiers (days > 0) qualify; the day-0 welcome badge is display-only and never
// flows through here.
export function getNewBondLevels(
  activeDayCount: number,
  earnedKeys: BondLevelKey[],
): BondLevelConfig[] {
  return BOND_LEVEL_CONFIG.filter(
    (config) =>
      config.days > 0 &&
      activeDayCount >= config.days &&
      !earnedKeys.includes(config.key),
  );
}

// The bond levels a pokemon has reached by its active-day count. Derived
// (not stored), so the display always matches the streak even before coins
// are claimed on the next feed/play.
export function getEarnedBondLevels(activeDayCount: number): BondLevelKey[] {
  return BOND_LEVEL_CONFIG.filter(
    (config) => activeDayCount >= config.days,
  ).map((config) => config.key);
}
