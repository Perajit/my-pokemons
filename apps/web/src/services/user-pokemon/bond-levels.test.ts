import { describe, it, expect } from "vitest";
import type { BondLevelKey } from "@my-pokemons/config/bond-levels";
import { evaluateBondLevels } from "./bond-levels";
import { basePokemon } from "./__test-helpers";

const fixedNow = new Date("2024-06-01T12:00:00Z");

function makeEntity(overrides = {}) {
  return {
    id: "up-1",
    userId: "user-1",
    pokemonId: "poke-1",
    currentFullness: 60,
    currentMood: 60,
    faintedAt: null,
    lastFedAt: null,
    lastPlayedAt: null,
    lastRevivedAt: null,
    totalFaintedDurationMs: 0,
    lastCalculatedAt: new Date("2024-06-01T11:00:00Z"),
    acquiredAt: new Date("2024-05-31T12:00:00Z"),
    pokemon: basePokemon,
    achievements: [] as { achievementType: string; achievementKey: string }[],
    ...overrides,
  };
}

function withAcquiredDaysAgo(days: number, earnedKeys: BondLevelKey[] = []) {
  const acquiredAt = new Date(fixedNow.getTime() - days * 24 * 60 * 60 * 1000);
  return makeEntity({
    acquiredAt,
    achievements: earnedKeys.map((key) => ({
      achievementType: "bondLevel",
      achievementKey: key,
    })),
  });
}

describe("evaluateBondLevels()", () => {
  it("returns no events when active days is below 1", () => {
    const result = evaluateBondLevels(withAcquiredDaysAgo(0), fixedNow);
    expect(result.events).toEqual([]);
    expect(result.totalBondLevelCoins).toBe(0);
    expect(result.newlyEarnedBondLevels).toEqual([]);
  });

  it("emits BOND_LEVEL_1D event at exactly 1 day with 5 coins", () => {
    const result = evaluateBondLevels(withAcquiredDaysAgo(1), fixedNow);
    expect(result.events).toEqual([
      {
        type: "achievement_unlocked",
        achievementKey: "BOND_LEVEL_1D",
        coinsEarned: 5,
      },
    ]);
    expect(result.totalBondLevelCoins).toBe(5);
  });

  it("emits BOND_LEVEL_1D and BOND_LEVEL_7D at 8 days when none completed", () => {
    const result = evaluateBondLevels(withAcquiredDaysAgo(8), fixedNow);
    expect(result.events.map((e) => e.achievementKey)).toEqual([
      "BOND_LEVEL_1D",
      "BOND_LEVEL_7D",
    ]);
    expect(result.totalBondLevelCoins).toBe(20);
  });

  it("skips already-earned bond levels", () => {
    const result = evaluateBondLevels(
      withAcquiredDaysAgo(7, ["BOND_LEVEL_1D"]),
      fixedNow,
    );
    expect(result.events.map((e) => e.achievementKey)).toEqual([
      "BOND_LEVEL_7D",
    ]);
    expect(result.totalBondLevelCoins).toBe(15);
  });

  it("emits all five bond levels at 365 days when none completed", () => {
    const result = evaluateBondLevels(withAcquiredDaysAgo(365), fixedNow);
    expect(result.events.map((e) => e.achievementKey)).toEqual([
      "BOND_LEVEL_1D",
      "BOND_LEVEL_7D",
      "BOND_LEVEL_30D",
      "BOND_LEVEL_90D",
      "BOND_LEVEL_365D",
    ]);
    expect(result.totalBondLevelCoins).toBe(5 + 15 + 40 + 100 + 300);
  });
});
