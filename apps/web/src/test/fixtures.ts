import type { Prisma } from "@my-pokemons/database";

// Test-owned fixture data, typed as Prisma's *CreateInput — the exact shape
// db.X.create({ data }) expects. Deliberately NOT derived from the production
// catalogs (POKEMON_CONFIGS / ITEM_CONFIGS): tests assert on exact values (coin
// math, decay, gains), so the data they run against must be stable and
// independent of whatever the real catalog holds. Override only the field a
// given test cares about.

export function makeUserData(
  overrides: Partial<Prisma.UserCreateInput> = {},
): Prisma.UserCreateInput {
  return {
    // unique per call so concurrent seeds never collide on the email constraint
    email: `user-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hash",
    coins: 500,
    ...overrides,
  };
}

export function makePokemonData(
  overrides: Partial<Prisma.PokemonCreateInput> = {},
): Prisma.PokemonCreateInput {
  return {
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
    ...overrides,
  };
}

export function makeItemData(
  overrides: Partial<Prisma.ItemCreateInput> = {},
): Prisma.ItemCreateInput {
  return {
    key: "REVIVE",
    name: "Revive",
    description: "Wake a fainted Pokémon and restore it to 50% HP.",
    price: 50,
    ...overrides,
  };
}
