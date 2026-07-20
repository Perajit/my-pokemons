// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import { NotOwnedError } from "@/services/errors";
import {
  getUserCollection,
  getUserPokemon,
  getUserCollectionDto,
  getUserPokemonDto,
} from "@/services/user-pokemon";
import {
  seedUser,
  seedPokemon,
  seedUserPokemon,
  resetGameplayTables,
} from "./db-helpers";
import { makeUserData, makePokemonData } from "@/test/seed-factories";

beforeEach(resetGameplayTables);
afterAll(() => db.$disconnect());

describe("getUserCollection()", () => {
  it("returns enriched pokemons with heart and persists decay sync", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
      currentFullness: 60,
      currentMood: 60,
      lastCalculatedAt: oneHourAgo,
    });

    const result = await getUserCollection(user.id);

    expect(result).toHaveLength(1);
    // ~1h decay: fullness 60 - 3 = ~57, mood 60 - 6 = ~54
    expect(result[0].currentFullness).toBeCloseTo(57, 0);
    expect(result[0].currentMood).toBeCloseTo(54, 0);
    expect(result[0].heart).toBeCloseTo(0.6 * 57 + 0.4 * 54, 0);

    // Verify persistence: re-fetch directly from DB
    const persisted = await db.userPokemon.findUnique({ where: { id: up.id } });
    expect(persisted!.currentFullness).toBeCloseTo(57, 0);
    expect(persisted!.currentMood).toBeCloseTo(54, 0);
    expect(persisted!.lastCalculatedAt.getTime()).toBeGreaterThan(
      oneHourAgo.getTime(),
    );
  });

  it("faints at the real death time, so the streak/achievements freeze there (not at read time)", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    // Slow, deterministic decay: fullness 100/4 = 25h, mood 100/2 = 50h to zero.
    const pokemon = await seedPokemon(
      makePokemonData({ fullnessDecayPerHour: 4, moodDecayPerHour: 2 }),
    );
    const sixtyHoursAgo = new Date(Date.now() - 60 * 60 * 60 * 1000);
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
      currentFullness: 100,
      currentMood: 100,
      lastCalculatedAt: sixtyHoursAgo,
      acquiredAt: sixtyHoursAgo,
    });

    const result = await getUserCollection(user.id);

    expect(result[0].isFainted).toBe(true);
    expect(result[0].currentFullness).toBe(0);
    expect(result[0].currentMood).toBe(0);
    // Active streak resets to 0 while fainted. Bond progress, however, freezes
    // at the real death time (50h after acquire = 2 alive days, the later
    // zero-crossing) — not at read time 60h later — so the welcome badge stays.
    expect(result[0].activeStreak).toBe(0);
    expect(result[0].earnedBondLevels).toEqual(["BOND_LEVEL_0D"]);

    const persisted = await db.userPokemon.findUnique({ where: { id: up.id } });
    expect(persisted!.faintedAt!.getTime()).toBe(
      sixtyHoursAgo.getTime() + 50 * 60 * 60 * 1000,
    );
  });

  it("does not re-sync a pokemon that is already fainted", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const faintedAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldLastCalc = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
      faintedAt,
      currentFullness: 0,
      currentMood: 0,
      lastCalculatedAt: oldLastCalc,
    });

    await getUserCollection(user.id);

    const persisted = await db.userPokemon.findUnique({ where: { id: up.id } });
    // lastCalculatedAt should NOT change for fainted pokemon
    expect(persisted!.lastCalculatedAt.getTime()).toBe(oldLastCalc.getTime());
  });

  it("derives streak achievements from activeStreak without any feed/play", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
      acquiredAt: eightDaysAgo,
    });

    const result = await getUserCollection(user.id);

    // No feed/play has happened, yet the welcome badge and 7d achievement show
    // (display can't lag the streak).
    expect(result[0].earnedBondLevels).toEqual([
      "BOND_LEVEL_0D",
      "BOND_LEVEL_7D",
    ]);
  });

  it("returns an empty array when the user has no pokemon", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));

    const result = await getUserCollection(user.id);

    expect(result).toEqual([]);
  });
});

describe("getUserPokemon()", () => {
  it("returns the enriched pokemon for the owner", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
    });

    const result = await getUserPokemon(user.id, up.id);

    expect(result.id).toBe(up.id);
    expect(result.pokemon.name).toBe("Pikachu");
    expect(typeof result.heart).toBe("number");
  });

  it("throws NotOwnedError when the pokemon belongs to another user", async () => {
    const owner = await seedUser(makeUserData({ coins: 500 }));
    const intruder = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const up = await seedUserPokemon({
      userId: owner.id,
      pokemonId: pokemon.id,
    });

    await expect(getUserPokemon(intruder.id, up.id)).rejects.toThrow(
      NotOwnedError,
    );
  });

  it("throws NotOwnedError when the pokemon does not exist", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));

    await expect(getUserPokemon(user.id, "nonexistent-id")).rejects.toThrow(
      NotOwnedError,
    );
  });
});

// The DTO is the exact wire shape pages and the /api/collection routes return.
// Asserting it here is what guards against the domain object leaking to the
// client (feed/play coin rewards must be top-level, internal fields absent).
describe("getUserPokemonDto()", () => {
  it("returns the serialization-ready DTO shape", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
    });

    const dto = await getUserPokemonDto(user.id, up.id);

    // pokemon sub-object: display identity + species-level decay rates for client-side live decay
    expect(dto.pokemon).toEqual({
      name: pokemon.name,
      pokeApiId: pokemon.pokeApiId,
      fullnessDecayPerHour: pokemon.fullnessDecayPerHour,
      moodDecayPerHour: pokemon.moodDecayPerHour,
    });
    // dates are ISO strings
    expect(typeof dto.acquiredAt).toBe("string");
    // internal / now-unused fields never reach the wire
    expect(dto).not.toHaveProperty("lastFedAt");
    expect(dto).not.toHaveProperty("lastPlayedAt");
    expect(dto).not.toHaveProperty("feedCoinReward");
    expect(dto).not.toHaveProperty("playCoinReward");
  });

  it("throws NotOwnedError for a pokemon owned by someone else", async () => {
    const owner = await seedUser(makeUserData({ coins: 500 }));
    const intruder = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const up = await seedUserPokemon({
      userId: owner.id,
      pokemonId: pokemon.id,
    });

    await expect(getUserPokemonDto(intruder.id, up.id)).rejects.toThrow(
      NotOwnedError,
    );
  });
});

describe("getUserCollectionDto()", () => {
  it("returns an array of serialization-ready DTOs", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    await seedUserPokemon({ userId: user.id, pokemonId: pokemon.id });

    const collection = await getUserCollectionDto(user.id);

    expect(collection).toHaveLength(1);
    expect(collection[0].pokemon).toEqual({
      name: pokemon.name,
      pokeApiId: pokemon.pokeApiId,
      fullnessDecayPerHour: pokemon.fullnessDecayPerHour,
      moodDecayPerHour: pokemon.moodDecayPerHour,
    });
    expect(collection[0]).not.toHaveProperty("lastFedAt");
    expect(collection[0]).not.toHaveProperty("feedCoinReward");
  });

  it("returns an empty array when the user owns nothing", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    expect(await getUserCollectionDto(user.id)).toEqual([]);
  });
});
