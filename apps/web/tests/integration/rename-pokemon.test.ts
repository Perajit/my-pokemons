// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import { NotOwnedError } from "@/services/errors";
import { renamePokemon } from "@/services/user-pokemon";
import {
  seedUser,
  seedPokemon,
  seedUserPokemon,
  resetGameplayTables,
} from "./db-helpers";
import { makeUserData, makePokemonData } from "@/test/seed-factories";

beforeEach(resetGameplayTables);
afterAll(() => db.$disconnect());

describe("renamePokemon()", () => {
  it("persists the new nickname for the owner", async () => {
    const user = await seedUser(makeUserData({ coins: 0 }));
    const pokemon = await seedPokemon(makePokemonData());
    const owned = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
    });

    await renamePokemon(user.id, owned.id, "Sparky");

    const stored = await db.userPokemon.findUnique({ where: { id: owned.id } });
    expect(stored!.nickname).toBe("Sparky");
  });

  it("renames a fainted Pokémon (no active-state restriction)", async () => {
    const user = await seedUser(makeUserData({ coins: 0 }));
    const pokemon = await seedPokemon(makePokemonData());
    const owned = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
      faintedAt: new Date(),
      currentFullness: 0,
      currentMood: 0,
    });

    await renamePokemon(user.id, owned.id, "Green");

    const stored = await db.userPokemon.findUnique({ where: { id: owned.id } });
    expect(stored!.nickname).toBe("Green");
  });

  it("throws NotOwnedError and leaves the nickname untouched for a non-owner", async () => {
    const owner = await seedUser(makeUserData({ coins: 0 }));
    const intruder = await seedUser(makeUserData({ coins: 0 }));
    const pokemon = await seedPokemon(makePokemonData());
    const owned = await seedUserPokemon({
      userId: owner.id,
      pokemonId: pokemon.id,
    });

    await expect(
      renamePokemon(intruder.id, owned.id, "Sparky"),
    ).rejects.toThrow(NotOwnedError);

    const stored = await db.userPokemon.findUnique({ where: { id: owned.id } });
    expect(stored!.nickname).toBeNull();
  });
});
