// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import { NotOwnedError, FaintedError, CooldownError } from "@/services/errors";
import { playWithPokemon } from "@/services/user-pokemon";
import {
  seedUser,
  seedPokemon,
  seedUserPokemon,
  resetGameplayTables,
} from "./seed";

beforeEach(resetGameplayTables);
afterAll(() => db.$disconnect());

describe("playWithPokemon()", () => {
  it("applies playMoodGain, sets lastPlayedAt, and credits playCoinReward", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(user.id, pokemon.id, {
      currentFullness: 50,
      currentMood: 50,
      lastCalculatedAt: new Date(),
    });

    await playWithPokemon(user.id, up.id);

    const persistedUp = await db.userPokemon.findUnique({
      where: { id: up.id },
    });
    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUp!.currentMood).toBeCloseTo(78, 0); // 50 + playMoodGain(28)
    expect(persistedUp!.lastPlayedAt).not.toBeNull();
    expect(persistedUser!.coins).toBe(105); // 100 + playCoinReward(5)
  });

  it("awards BOND_LEVEL_1D when playing with a pokemon acquired 1 day ago", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const up = await seedUserPokemon(user.id, pokemon.id, {
      acquiredAt: oneDayAgo,
    });

    const result = await playWithPokemon(user.id, up.id);

    expect(result.events).toEqual([
      { type: "pokemon_played", pokemonName: "Pikachu", coinsEarned: 5 },
      {
        type: "achievement_unlocked",
        achievementKey: "BOND_LEVEL_1D",
        coinsEarned: 5,
      },
    ]);
    const achievements = await db.userPokemonAchievement.findMany({
      where: { userPokemonId: up.id },
    });
    expect(achievements.map((m) => m.achievementKey)).toEqual([
      "BOND_LEVEL_1D",
    ]);
    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    // 100 + playCoinReward(5) + BOND_LEVEL_1D(5) = 110
    expect(persistedUser!.coins).toBe(110);
  });

  it("throws NotOwnedError when playing with another user's pokemon", async () => {
    const owner = await seedUser(100);
    const intruder = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(owner.id, pokemon.id);

    await expect(playWithPokemon(intruder.id, up.id)).rejects.toThrow(
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

    await expect(playWithPokemon(user.id, up.id)).rejects.toThrow(FaintedError);

    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUser!.coins).toBe(100);
  });

  it("throws CooldownError on a second immediate play and credits coins only once", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(user.id, pokemon.id, {
      lastCalculatedAt: new Date(),
    });

    await playWithPokemon(user.id, up.id);
    await expect(playWithPokemon(user.id, up.id)).rejects.toThrow(
      CooldownError,
    );

    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUser!.coins).toBe(105); // credited only once
  });

  it("refuses the play and rolls back when decay during the play would faint the pokemon", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const longAgo = new Date(Date.now() - 100 * 60 * 60 * 1000);
    const up = await seedUserPokemon(user.id, pokemon.id, {
      currentFullness: 1,
      currentMood: 1,
      lastCalculatedAt: longAgo,
    });

    await expect(playWithPokemon(user.id, up.id)).rejects.toThrow(FaintedError);

    const persistedUp = await db.userPokemon.findUnique({
      where: { id: up.id },
    });
    expect(persistedUp!.faintedAt).toBeNull(); // faint rolled back → not fainted
    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUser!.coins).toBe(100); // no coins credited
  });
});
