import { activeDays } from "@my-pokemons/core";
import type { UserPokemonEntity } from "@my-pokemons/database";
import {
  getNewBondLevels,
  type BondLevelKey,
} from "@my-pokemons/config/bond-levels";
import type { AchievementUnlockedEvent } from "./types";

export function evaluateBondLevels(
  entity: UserPokemonEntity,
  now: Date,
): {
  newlyEarnedBondLevels: { achievementType: string; achievementKey: string }[];
  totalBondLevelCoins: number;
  events: AchievementUnlockedEvent[];
} {
  const days = activeDays(entity.acquiredAt, entity.faintedAt, now);
  const earnedKeys = entity.achievements
    .filter((a) => a.achievementType === "bondLevel")
    .map((a) => a.achievementKey as BondLevelKey);
  const newlyEarned = getNewBondLevels(days, earnedKeys);
  const totalBondLevelCoins = newlyEarned.reduce(
    (sum, level) => sum + level.coinReward,
    0,
  );
  const events: AchievementUnlockedEvent[] = newlyEarned.map((earned) => ({
    type: "achievement_unlocked",
    achievementKey: earned.key,
    coinsEarned: earned.coinReward,
  }));
  const newlyEarnedBondLevels = newlyEarned.map((level) => ({
    achievementType: "bondLevel",
    achievementKey: level.key,
  }));
  return { newlyEarnedBondLevels, totalBondLevelCoins, events };
}
