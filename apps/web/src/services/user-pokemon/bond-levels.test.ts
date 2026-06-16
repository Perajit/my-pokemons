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
    nickname: null,
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
  it("emits no paid event at day 0 — the welcome badge is display-only", () => {
    const result = evaluateBondLevels(withAcquiredDaysAgo(0), fixedNow);
    expect(result.events).toEqual([]);
    expect(result.totalBondLevelCoins).toBe(0);
    expect(result.newlyEarnedBondLevels).toEqual([]);
  });

  it("emits no paid event before the first time-based threshold", () => {
    const result = evaluateBondLevels(withAcquiredDaysAgo(6), fixedNow);
    expect(result.events).toEqual([]);
    expect(result.totalBondLevelCoins).toBe(0);
  });

  it("emits BOND_LEVEL_7D event at exactly 7 days with 15 coins", () => {
    const result = evaluateBondLevels(withAcquiredDaysAgo(7), fixedNow);
    expect(result.events).toEqual([
      {
        type: "achievement_unlocked",
        achievementKey: "BOND_LEVEL_7D",
        coinsEarned: 15,
      },
    ]);
    expect(result.totalBondLevelCoins).toBe(15);
  });

  it("emits BOND_LEVEL_7D and BOND_LEVEL_30D at 30 days when none completed", () => {
    const result = evaluateBondLevels(withAcquiredDaysAgo(30), fixedNow);
    expect(result.events.map((e) => e.achievementKey)).toEqual([
      "BOND_LEVEL_7D",
      "BOND_LEVEL_30D",
    ]);
    expect(result.totalBondLevelCoins).toBe(55);
  });

  it("skips already-earned bond levels", () => {
    const result = evaluateBondLevels(
      withAcquiredDaysAgo(30, ["BOND_LEVEL_7D"]),
      fixedNow,
    );
    expect(result.events.map((e) => e.achievementKey)).toEqual([
      "BOND_LEVEL_30D",
    ]);
    expect(result.totalBondLevelCoins).toBe(40);
  });

  it("emits the four paid bond levels at 365 days when none completed", () => {
    const result = evaluateBondLevels(withAcquiredDaysAgo(365), fixedNow);
    expect(result.events.map((e) => e.achievementKey)).toEqual([
      "BOND_LEVEL_7D",
      "BOND_LEVEL_30D",
      "BOND_LEVEL_90D",
      "BOND_LEVEL_365D",
    ]);
    expect(result.totalBondLevelCoins).toBe(15 + 40 + 100 + 300);
  });
});
