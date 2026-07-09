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
} from "./db-helpers";
import { makeUserData, makePokemonData } from "@/test/seed-factories";

beforeEach(resetGameplayTables);
afterAll(() => db.$disconnect());

describe("playWithPokemon()", () => {
  it("applies playMoodGain, sets lastPlayedAt, and credits playCoinReward", async () => {
    const user = await seedUser(makeUserData({ coins: 100 }));
    const pokemon = await seedPokemon(makePokemonData());
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
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

  it("awards BOND_LEVEL_7D when playing with a pokemon acquired 7 days ago", async () => {
    const user = await seedUser(makeUserData({ coins: 100 }));
    const pokemon = await seedPokemon(makePokemonData());
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
      acquiredAt: sevenDaysAgo,
    });

    const result = await playWithPokemon(user.id, up.id);

    expect(result.events).toEqual([
      { type: "pokemon_played", pokemonName: "Pikachu", coinsEarned: 5 },
      {
        type: "achievement_unlocked",
        achievementKey: "BOND_LEVEL_7D",
        coinsEarned: 15,
      },
    ]);
    const achievements = await db.userPokemonAchievement.findMany({
      where: { userPokemonId: up.id },
    });
    expect(achievements.map((m) => m.achievementKey)).toEqual([
      "BOND_LEVEL_7D",
    ]);
    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    // 100 + playCoinReward(5) + BOND_LEVEL_7D(15) = 120
    expect(persistedUser!.coins).toBe(120);
  });

  it("throws NotOwnedError when playing with another user's pokemon", async () => {
    const owner = await seedUser(makeUserData({ coins: 100 }));
    const intruder = await seedUser(makeUserData({ coins: 100 }));
    const pokemon = await seedPokemon(makePokemonData());
    const up = await seedUserPokemon({
      userId: owner.id,
      pokemonId: pokemon.id,
    });

    await expect(playWithPokemon(intruder.id, up.id)).rejects.toThrow(
      NotOwnedError,
    );
  });

  it("throws FaintedError when the pokemon is already fainted and credits no coins", async () => {
    const user = await seedUser(makeUserData({ coins: 100 }));
    const pokemon = await seedPokemon(makePokemonData());
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
      faintedAt: new Date(),
      currentFullness: 0,
      currentMood: 0,
    });

    await expect(playWithPokemon(user.id, up.id)).rejects.toThrow(FaintedError);

    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUser!.coins).toBe(100);
  });

  it("throws CooldownError on a second immediate play and credits coins only once", async () => {
    const user = await seedUser(makeUserData({ coins: 100 }));
    const pokemon = await seedPokemon(makePokemonData());
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
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
    const user = await seedUser(makeUserData({ coins: 100 }));
    const pokemon = await seedPokemon(makePokemonData());
    const longAgo = new Date(Date.now() - 100 * 60 * 60 * 1000);
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
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
