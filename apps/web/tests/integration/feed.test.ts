// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import { NotOwnedError, FaintedError, CooldownError } from "@/services/errors";
import { feedPokemon } from "@/services/user-pokemon";
import {
  seedUser,
  seedPokemon,
  seedUserPokemon,
  resetGameplayTables,
} from "./seed";

beforeEach(resetGameplayTables);
afterAll(() => db.$disconnect());

const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

describe("feedPokemon()", () => {
  it("applies feedFullnessGain, sets lastFedAt, and credits feedCoinReward", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(user.id, pokemon.id, {
      currentFullness: 50,
      currentMood: 50,
      lastCalculatedAt: new Date(), // no decay
    });

    await feedPokemon(user.id, up.id);

    const persistedUp = await db.userPokemon.findUnique({
      where: { id: up.id },
    });
    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUp!.currentFullness).toBeCloseTo(65, 0); // 50 + feedFullnessGain(15)
    expect(persistedUp!.lastFedAt).not.toBeNull();
    expect(persistedUser!.coins).toBe(103); // 100 + feedCoinReward(3)
  });

  it("awards BOND_LEVEL_7D when feeding a pokemon acquired 8 days ago (day-0 welcome is display-only)", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(user.id, pokemon.id, {
      acquiredAt: eightDaysAgo,
    });

    const result = await feedPokemon(user.id, up.id);

    expect(result.events).toEqual([
      { type: "pokemon_fed", pokemonName: "Pikachu", coinsEarned: 3 },
      {
        type: "achievement_unlocked",
        achievementKey: "BOND_LEVEL_7D",
        coinsEarned: 15,
      },
    ]);

    // Durable facts: the achievement ledger (drives coin dedup) + the credited
    // balance. The day-0 welcome badge writes no ledger row.
    const achievements = await db.userPokemonAchievement.findMany({
      where: { userPokemonId: up.id },
    });
    expect(achievements.map((m) => m.achievementKey).sort()).toEqual([
      "BOND_LEVEL_7D",
    ]);
    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    // 100 + feedCoinReward(3) + BOND_LEVEL_7D(15) = 118
    expect(persistedUser!.coins).toBe(118);
  });

  it("does not re-credit bond levels on a second feed after the cooldown", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(user.id, pokemon.id, {
      acquiredAt: eightDaysAgo,
    });

    await feedPokemon(user.id, up.id);

    // Bypass cooldown by moving lastFedAt far into the past.
    await db.userPokemon.update({
      where: { id: up.id },
      data: { lastFedAt: new Date(Date.now() - 60 * 60 * 1000) },
    });

    const result = await feedPokemon(user.id, up.id);

    // Only the action event remains; no new bond levels on the second feed.
    expect(result.events).toEqual([
      { type: "pokemon_fed", pokemonName: "Pikachu", coinsEarned: 3 },
    ]);
    const achievementCount = await db.userPokemonAchievement.count({
      where: { userPokemonId: up.id },
    });
    expect(achievementCount).toBe(1);
    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    // First feed: 100 + 3 + 15 = 118. Second feed: +3 (no new bond levels) = 121.
    expect(persistedUser!.coins).toBe(121);
  });

  it("throws NotOwnedError when feeding another user's pokemon", async () => {
    const owner = await seedUser(100);
    const intruder = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(owner.id, pokemon.id);

    await expect(feedPokemon(intruder.id, up.id)).rejects.toThrow(
      NotOwnedError,
    );
  });

  it("throws FaintedError when the pokemon is already fainted and credits no coins", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(user.id, pokemon.id, {
      faintedAt: new Date(),
      currentFullness: 0,
      currentMood: 0,
    });

    await expect(feedPokemon(user.id, up.id)).rejects.toThrow(FaintedError);

    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUser!.coins).toBe(100);
  });

  it("throws CooldownError on a second immediate feed and credits coins only once", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(user.id, pokemon.id, {
      lastCalculatedAt: new Date(),
    });

    await feedPokemon(user.id, up.id);
    await expect(feedPokemon(user.id, up.id)).rejects.toThrow(CooldownError);

    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUser!.coins).toBe(103); // credited only once
  });

  it("two concurrent feeds → exactly one succeeds, one CooldownError, coin credited once", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(user.id, pokemon.id, {
      lastCalculatedAt: new Date(),
    });

    const results = await Promise.allSettled([
      feedPokemon(user.id, up.id),
      feedPokemon(user.id, up.id),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter((r) => r.status === "rejected");
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      CooldownError,
    );

    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUser!.coins).toBe(103);
  });

  it("refuses the feed and rolls back when decay during the feed would faint the pokemon", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const longAgo = new Date(Date.now() - 100 * 60 * 60 * 1000);
    const up = await seedUserPokemon(user.id, pokemon.id, {
      currentFullness: 1,
      currentMood: 1,
      lastCalculatedAt: longAgo,
    });

    await expect(feedPokemon(user.id, up.id)).rejects.toThrow(FaintedError);

    // The faint update runs inside the transaction, so the thrown FaintedError
    // rolls it back; the faint is persisted later by the next lazy read.
    const persistedUp = await db.userPokemon.findUnique({
      where: { id: up.id },
    });
    expect(persistedUp!.faintedAt).toBeNull(); // faint rolled back → not fainted
    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUser!.coins).toBe(100); // no coins credited
  });

  it("credits no coins when the pokemon's feed reward is zero", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon({ feedCoinReward: 0 });
    const up = await seedUserPokemon(user.id, pokemon.id, {
      lastCalculatedAt: new Date(),
    });

    await feedPokemon(user.id, up.id);

    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUser!.coins).toBe(100); // creditCoins skips the write
  });
});
