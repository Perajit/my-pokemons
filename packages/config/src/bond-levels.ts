export type BondLevelKey =
  | "BOND_LEVEL_1D"
  | "BOND_LEVEL_7D"
  | "BOND_LEVEL_30D"
  | "BOND_LEVEL_90D"
  | "BOND_LEVEL_365D";

export const BOND_LEVEL_LABELS: Record<BondLevelKey, string> = {
  BOND_LEVEL_1D: "New Friend",
  BOND_LEVEL_7D: "Close Friend",
  BOND_LEVEL_30D: "Best Friend",
  BOND_LEVEL_90D: "True Companion",
  BOND_LEVEL_365D: "Lifetime Companion",
};

export type BondLevelConfig = {
  key: BondLevelKey;
  days: number;
  coinReward: number;
};

export const BOND_LEVEL_CONFIG: readonly BondLevelConfig[] = [
  { key: "BOND_LEVEL_1D", days: 1, coinReward: 5 },
  { key: "BOND_LEVEL_7D", days: 7, coinReward: 15 },
  { key: "BOND_LEVEL_30D", days: 30, coinReward: 40 },
  { key: "BOND_LEVEL_90D", days: 90, coinReward: 100 },
  { key: "BOND_LEVEL_365D", days: 365, coinReward: 300 },
];

export function getNewBondLevels(
  activeDayCount: number,
  earnedKeys: BondLevelKey[],
): BondLevelConfig[] {
  return BOND_LEVEL_CONFIG.filter(
    (config) =>
      activeDayCount >= config.days && !earnedKeys.includes(config.key),
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
