// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import {
  NotFaintedError,
  InsufficientItemsError,
  NotOwnedError,
} from "@/services/errors";
import { revivePokemon } from "@/services/user-pokemon";
import { getUserItemQuantity } from "@/services/inventory";
import {
  seedUser,
  seedPokemon,
  seedUserPokemon,
  seedItem,
  seedUserItem,
  resetGameplayTables,
} from "./db-helpers";
import {
  makeUserData,
  makePokemonData,
  makeItemData,
} from "@/test/seed-factories";

beforeEach(resetGameplayTables);
afterAll(() => db.$disconnect());

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

describe("revivePokemon()", () => {
  it("consumes a Revive, clears faint, restores to 50, sets lastRevivedAt, accumulates downtime", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const item = await seedItem(makeItemData());
    await seedUserItem({ userId: user.id, itemId: item.id, quantity: 1 });
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
      faintedAt: new Date(Date.now() - TWO_HOURS_MS),
      currentFullness: 0,
      currentMood: 0,
    });

    const result = await revivePokemon(user.id, up.id);

    expect(await getUserItemQuantity(user.id, "REVIVE")).toBe(0);

    const persisted = await db.userPokemon.findUnique({ where: { id: up.id } });
    expect(persisted!.faintedAt).toBeNull();
    expect(persisted!.currentFullness).toBe(50);
    expect(persisted!.currentMood).toBe(50);
    expect(persisted!.lastRevivedAt).not.toBeNull();
    expect(persisted!.totalFaintedDurationMs).toBeGreaterThanOrEqual(
      TWO_HOURS_MS - 10_000,
    );

    expect(result.userPokemon.isFainted).toBe(false);
    expect(result.userPokemon.activeStreak).toBe(0);
    expect(result.events).toEqual([
      { type: "pokemon_revived", pokemonName: pokemon.name },
    ]);
  });

  it("throws NotFaintedError and consumes nothing when the pokemon is active", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const item = await seedItem(makeItemData());
    await seedUserItem({ userId: user.id, itemId: item.id, quantity: 1 });
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
    });

    await expect(revivePokemon(user.id, up.id)).rejects.toThrow(
      NotFaintedError,
    );
    expect(await getUserItemQuantity(user.id, "REVIVE")).toBe(1);
  });

  it("throws InsufficientItemsError and rolls back when the user has no Revive", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    await seedItem(makeItemData()); // in the catalog, but the user owns none
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
      faintedAt: new Date(Date.now() - TWO_HOURS_MS),
      currentFullness: 0,
      currentMood: 0,
    });

    await expect(revivePokemon(user.id, up.id)).rejects.toThrow(
      InsufficientItemsError,
    );

    const persisted = await db.userPokemon.findUnique({ where: { id: up.id } });
    expect(persisted!.faintedAt).not.toBeNull(); // faint untouched
  });

  it("throws NotOwnedError for another user's pokemon", async () => {
    const owner = await seedUser(makeUserData({ coins: 500 }));
    const intruder = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const up = await seedUserPokemon({
      userId: owner.id,
      pokemonId: pokemon.id,
      faintedAt: new Date(),
    });

    await expect(revivePokemon(intruder.id, up.id)).rejects.toThrow(
      NotOwnedError,
    );
  });
});
