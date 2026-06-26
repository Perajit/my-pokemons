// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import { InsufficientCoinsError, NotFoundError } from "@/services/errors";
import {
  buyPokemon,
  buyItem,
  getShopPokemonsDto,
  getShopItemsDto,
} from "@/services/shop";
import { getUserItemQuantity } from "@/services/inventory";
import {
  seedUser,
  seedPokemon,
  seedUserPokemon,
  seedItem,
  seedUserItem,
  resetGameplayTables,
} from "./db-helpers";
import { makeUserData, makePokemonData, makeItemData } from "@/test/fixtures";

beforeEach(resetGameplayTables);
afterAll(() => db.$disconnect());

describe("buyPokemon()", () => {
  it("throws NotFoundError for unknown pokemonId", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    await expect(buyPokemon(user.id, "does-not-exist")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("throws InsufficientCoinsError when coins are too low, no DB change", async () => {
    const user = await seedUser(makeUserData({ coins: 100 }));
    const pokemon = await seedPokemon(makePokemonData());

    await expect(buyPokemon(user.id, pokemon.id)).rejects.toThrow(
      InsufficientCoinsError,
    );

    const after = await db.user.findUnique({ where: { id: user.id } });
    expect(after!.coins).toBe(100);
    expect(await db.userPokemon.count()).toBe(0);
  });

  it("deducts coins and creates UserPokemon on success", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());

    await buyPokemon(user.id, pokemon.id);

    const after = await db.user.findUnique({ where: { id: user.id } });
    expect(after!.coins).toBe(100);
    const owned = await db.userPokemon.findMany({ where: { userId: user.id } });
    expect(owned).toHaveLength(1);
    expect(owned[0].pokemonId).toBe(pokemon.id);
    expect(owned[0].nickname).toBe(pokemon.name);
    expect(owned[0].currentFullness).toBe(60);
    expect(owned[0].currentMood).toBe(60);
    expect(owned[0].faintedAt).toBeNull();
  });

  it("prevents a race: concurrent buys with exactly enough coins succeed once", async () => {
    const user = await seedUser(makeUserData({ coins: 400 }));
    const pokemon = await seedPokemon(makePokemonData());

    const results = await Promise.allSettled([
      buyPokemon(user.id, pokemon.id),
      buyPokemon(user.id, pokemon.id),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.filter((r) => r.status === "rejected");
    expect(failed).toHaveLength(1);
    expect((failed[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      InsufficientCoinsError,
    );

    const after = await db.user.findUnique({ where: { id: user.id } });
    expect(after!.coins).toBe(0);
    expect(await db.userPokemon.count()).toBe(1);
  });
});

describe("buyItem()", () => {
  it("throws NotFoundError for an unknown item key", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    await expect(buyItem(user.id, "REVIVE")).rejects.toThrow(NotFoundError);
  });

  it("throws InsufficientCoinsError and changes nothing when coins are too low", async () => {
    const user = await seedUser(makeUserData({ coins: 100 }));
    await seedItem(makeItemData({ price: 150 }));

    await expect(buyItem(user.id, "REVIVE")).rejects.toThrow(
      InsufficientCoinsError,
    );

    const after = await db.user.findUnique({ where: { id: user.id } });
    expect(after!.coins).toBe(100);
    expect(await db.userItem.count()).toBe(0);
  });

  it("deducts coins and grants one item on success", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    await seedItem(makeItemData({ price: 150 }));

    await buyItem(user.id, "REVIVE");

    const after = await db.user.findUnique({ where: { id: user.id } });
    expect(after!.coins).toBe(350);
    expect(await getUserItemQuantity(user.id, "REVIVE")).toBe(1);
  });

  it("increments quantity when buying the same item again (upsert, not a new row)", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    await seedItem(makeItemData({ price: 150 }));

    await buyItem(user.id, "REVIVE");
    await buyItem(user.id, "REVIVE");

    const after = await db.user.findUnique({ where: { id: user.id } });
    expect(after!.coins).toBe(200);
    expect(await getUserItemQuantity(user.id, "REVIVE")).toBe(2);
    expect(await db.userItem.count()).toBe(1);
  });

  it("prevents a race: two concurrent buys with exactly enough coins succeed once", async () => {
    const user = await seedUser(makeUserData({ coins: 150 }));
    await seedItem(makeItemData({ price: 150 }));

    const results = await Promise.allSettled([
      buyItem(user.id, "REVIVE"),
      buyItem(user.id, "REVIVE"),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.filter((r) => r.status === "rejected");
    expect(failed).toHaveLength(1);
    expect((failed[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      InsufficientCoinsError,
    );

    const after = await db.user.findUnique({ where: { id: user.id } });
    expect(after!.coins).toBe(0);
    expect(await getUserItemQuantity(user.id, "REVIVE")).toBe(1);
  });
});

describe("getShopPokemonsDto()", () => {
  it("returns the catalog with the user's owned count (0 when none)", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());

    const before = await getShopPokemonsDto(user.id);
    expect(before).toHaveLength(1);
    expect(before[0]).toEqual({
      id: pokemon.id,
      pokeApiId: pokemon.pokeApiId,
      name: pokemon.name,
      description: pokemon.description,
      price: 400,
      userOwnedCount: 0,
      feedFullnessGain: 15,
      feedCoinReward: 3,
      playMoodGain: 28,
      playCoinReward: 5,
      fullnessDecayPerHour: 3,
      moodDecayPerHour: 6,
    });

    await seedUserPokemon({ userId: user.id, pokemonId: pokemon.id });
    await seedUserPokemon({ userId: user.id, pokemonId: pokemon.id });

    const after = await getShopPokemonsDto(user.id);
    expect(after[0].userOwnedCount).toBe(2);
  });
});

describe("getShopItemsDto()", () => {
  it("returns the catalog with the user's owned count (0 when none)", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const item = await seedItem(makeItemData());

    const before = await getShopItemsDto(user.id);
    expect(before).toHaveLength(1);
    expect(before[0]).toMatchObject({ key: "REVIVE", userOwnedCount: 0 });

    await seedUserItem({ userId: user.id, itemId: item.id, quantity: 3 });

    const after = await getShopItemsDto(user.id);
    expect(after[0].userOwnedCount).toBe(3);
  });
});
