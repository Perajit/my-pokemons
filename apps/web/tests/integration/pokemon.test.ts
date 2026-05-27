// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import { NotOwnedError, FaintedError, CooldownError } from "@/services/errors";
import {
  getMyPokemons,
  getMyPokemon,
  feedPokemon,
  playWithPokemon,
} from "@/services/pokemon";

const pikachuSeed = {
  pokeApiId: 25,
  name: "Pikachu",
  description: "Electric mouse Pokémon.",
  price: 400,
  fullnessDecayPerHour: 3,
  moodDecayPerHour: 6,
  feedFullnessGain: 15,
  feedCoinReward: 3,
  playMoodGain: 28,
  playCoinReward: 5,
};

async function seedPokemon() {
  return db.pokemon.create({ data: pikachuSeed });
}

async function seedUser(coins: number) {
  return db.user.create({
    data: {
      email: `user-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: "hash",
      coins,
    },
  });
}

async function seedUserPokemon(
  userId: string,
  pokemonId: string,
  overrides: Partial<{
    currentFullness: number;
    currentMood: number;
    isActive: boolean;
    faintedAt: Date | null;
    lastCalculatedAt: Date;
    acquiredAt: Date;
  }> = {},
) {
  return db.userPokemon.create({
    data: {
      userId,
      pokemonId,
      currentFullness: overrides.currentFullness ?? 60,
      currentMood: overrides.currentMood ?? 60,
      isActive: overrides.isActive ?? true,
      faintedAt: overrides.faintedAt ?? null,
      lastCalculatedAt: overrides.lastCalculatedAt ?? new Date(),
      acquiredAt: overrides.acquiredAt ?? new Date(),
    },
  });
}

beforeEach(async () => {
  await db.userPokemon.deleteMany();
  await db.pokemon.deleteMany();
  await db.user.deleteMany();
});

afterAll(() => db.$disconnect());

describe("getMyPokemons", () => {
  it("returns enriched pokemons with heart and persists decay sync", async () => {
    const user = await seedUser(500);
    const pokemon = await seedPokemon();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const up = await seedUserPokemon(user.id, pokemon.id, {
      currentFullness: 60,
      currentMood: 60,
      lastCalculatedAt: oneHourAgo,
    });

    const result = await getMyPokemons(user.id);

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

  it("marks a pokemon as fainted when both stats decay to 0 and persists it", async () => {
    const user = await seedUser(500);
    const pokemon = await seedPokemon();
    const longAgo = new Date(Date.now() - 100 * 60 * 60 * 1000); // 100h ago — plenty for full decay
    const up = await seedUserPokemon(user.id, pokemon.id, {
      currentFullness: 1,
      currentMood: 1,
      lastCalculatedAt: longAgo,
    });

    const result = await getMyPokemons(user.id);

    expect(result[0].isActive).toBe(false);
    expect(result[0].faintedAt).not.toBeNull();
    expect(result[0].currentFullness).toBe(0);
    expect(result[0].currentMood).toBe(0);

    const persisted = await db.userPokemon.findUnique({ where: { id: up.id } });
    expect(persisted!.isActive).toBe(false);
    expect(persisted!.faintedAt).not.toBeNull();
  });

  it("does not re-sync a pokemon that is already fainted", async () => {
    const user = await seedUser(500);
    const pokemon = await seedPokemon();
    const faintedAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldLastCalc = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const up = await seedUserPokemon(user.id, pokemon.id, {
      isActive: false,
      faintedAt,
      currentFullness: 0,
      currentMood: 0,
      lastCalculatedAt: oldLastCalc,
    });

    await getMyPokemons(user.id);

    const persisted = await db.userPokemon.findUnique({ where: { id: up.id } });
    // lastCalculatedAt should NOT change for fainted pokemon
    expect(persisted!.lastCalculatedAt.getTime()).toBe(oldLastCalc.getTime());
  });

  it("returns an empty array when the user has no pokemon", async () => {
    const user = await seedUser(500);

    const result = await getMyPokemons(user.id);

    expect(result).toEqual([]);
  });
});

describe("getMyPokemon", () => {
  it("returns the enriched pokemon for the owner", async () => {
    const user = await seedUser(500);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(user.id, pokemon.id);

    const result = await getMyPokemon(user.id, up.id);

    expect(result.id).toBe(up.id);
    expect(result.pokemon.name).toBe("Pikachu");
    expect(typeof result.heart).toBe("number");
  });

  it("throws NotOwnedError when the pokemon belongs to another user", async () => {
    const owner = await seedUser(500);
    const intruder = await seedUser(500);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(owner.id, pokemon.id);

    await expect(getMyPokemon(intruder.id, up.id)).rejects.toThrow(
      NotOwnedError,
    );
  });

  it("throws NotOwnedError when the pokemon does not exist", async () => {
    const user = await seedUser(500);

    await expect(getMyPokemon(user.id, "nonexistent-id")).rejects.toThrow(
      NotOwnedError,
    );
  });
});

describe("feedPokemon", () => {
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

  it("throws CooldownError on a second immediate feed and does not credit coins again", async () => {
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

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      CooldownError,
    );

    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUser!.coins).toBe(103);
  });

  it("throws FaintedError when pokemon is already fainted and does not credit coins", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(user.id, pokemon.id, {
      isActive: false,
      faintedAt: new Date(),
      currentFullness: 0,
      currentMood: 0,
    });

    await expect(feedPokemon(user.id, up.id)).rejects.toThrow(FaintedError);

    const persistedUser = await db.user.findUnique({ where: { id: user.id } });
    expect(persistedUser!.coins).toBe(100);
  });

  it("throws NotOwnedError when pokemon belongs to another user", async () => {
    const owner = await seedUser(100);
    const intruder = await seedUser(100);
    const pokemon = await seedPokemon();
    const up = await seedUserPokemon(owner.id, pokemon.id);

    await expect(feedPokemon(intruder.id, up.id)).rejects.toThrow(
      NotOwnedError,
    );
  });
});

describe("playWithPokemon", () => {
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
});
