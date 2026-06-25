import { ITEM_CONFIG } from "@my-pokemons/config/items";
import type { PokemonConfig } from "@my-pokemons/config/pokemons";
import { db } from "@/lib/db";

export const pikachuSeed: PokemonConfig = {
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

export function seedPokemon(overrides: Partial<typeof pikachuSeed> = {}) {
  return db.pokemon.create({ data: { ...pikachuSeed, ...overrides } });
}

export function seedUser(coins: number) {
  return db.user.create({
    data: {
      email: `user-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: "hash",
      coins,
    },
  });
}

type UserPokemonOverrides = Partial<{
  currentFullness: number;
  currentMood: number;
  faintedAt: Date | null;
  lastRevivedAt: Date | null;
  totalFaintedDurationMs: number;
  lastCalculatedAt: Date;
  acquiredAt: Date;
}>;

export function seedUserPokemon(
  userId: string,
  pokemonId: string,
  overrides: UserPokemonOverrides = {},
) {
  return db.userPokemon.create({
    data: {
      userId,
      pokemonId,
      currentFullness: overrides.currentFullness ?? 60,
      currentMood: overrides.currentMood ?? 60,
      faintedAt: overrides.faintedAt ?? null,
      lastRevivedAt: overrides.lastRevivedAt ?? null,
      totalFaintedDurationMs: overrides.totalFaintedDurationMs ?? 0,
      lastCalculatedAt: overrides.lastCalculatedAt ?? new Date(),
      acquiredAt: overrides.acquiredAt ?? new Date(),
    },
  });
}

const reviveSeed = ITEM_CONFIG.find((item) => item.key === "REVIVE")!;

export function seedItem(overrides: Partial<typeof reviveSeed> = {}) {
  return db.item.create({ data: { ...reviveSeed, ...overrides } });
}

export function seedUserItem(userId: string, itemId: string, quantity: number) {
  return db.userItem.create({ data: { userId, itemId, quantity } });
}

export async function resetGameplayTables() {
  await db.userPokemonAchievement.deleteMany();
  await db.userItem.deleteMany();
  await db.userPokemon.deleteMany();
  await db.item.deleteMany();
  await db.pokemon.deleteMany();
  await db.user.deleteMany();
}
