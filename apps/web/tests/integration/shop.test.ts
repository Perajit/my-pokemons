// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import { InsufficientCoinsError, NotFoundError } from "@/services/errors";
import { buyPokemon } from "@/services/shop";

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

beforeEach(async () => {
  await db.userPokemon.deleteMany();
  await db.pokemon.deleteMany();
  await db.user.deleteMany();
});

afterAll(() => db.$disconnect());

describe("buyPokemon service", () => {
  it("throws NotFoundError for unknown pokemonId", async () => {
    const user = await seedUser(500);
    await expect(buyPokemon(user.id, "does-not-exist")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws InsufficientCoinsError when user has insufficient coins, no DB change", async () => {
    const user = await seedUser(100);
    const pokemon = await seedPokemon();

    await expect(buyPokemon(user.id, pokemon.id)).rejects.toThrow(
      InsufficientCoinsError,
    );

    const after = await db.user.findUnique({ where: { id: user.id } });
    expect(after!.coins).toBe(100);
    expect(await db.userPokemon.count()).toBe(0);
  });

  it("deducts coins and creates UserPokemon on success", async () => {
    const user = await seedUser(500);
    const pokemon = await seedPokemon();

    await buyPokemon(user.id, pokemon.id);

    const after = await db.user.findUnique({ where: { id: user.id } });
    expect(after!.coins).toBe(100);
    const owned = await db.userPokemon.findMany({ where: { userId: user.id } });
    expect(owned).toHaveLength(1);
    expect(owned[0].pokemonId).toBe(pokemon.id);
    expect(owned[0].currentFullness).toBe(60);
    expect(owned[0].currentMood).toBe(60);
    expect(owned[0].isActive).toBe(true);
  });

  it("allows buying the same Pokémon twice", async () => {
    const user = await seedUser(1000);
    const pokemon = await seedPokemon();

    await buyPokemon(user.id, pokemon.id);
    await buyPokemon(user.id, pokemon.id);

    const after = await db.user.findUnique({ where: { id: user.id } });
    expect(after!.coins).toBe(200);
    expect(await db.userPokemon.count()).toBe(2);
  });

  it("prevents race condition: concurrent buys with exactly enough coins only succeeds once", async () => {
    const user = await seedUser(400);
    const pokemon = await seedPokemon();

    const results = await Promise.allSettled([
      buyPokemon(user.id, pokemon.id),
      buyPokemon(user.id, pokemon.id),
    ]);

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");
    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect((failed[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      InsufficientCoinsError,
    );

    const after = await db.user.findUnique({ where: { id: user.id } });
    expect(after!.coins).toBe(0);
    expect(await db.userPokemon.count()).toBe(1);
  });
});
