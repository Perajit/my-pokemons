import { db } from "@/lib/db";

export const pikachuSeed = {
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
      lastCalculatedAt: overrides.lastCalculatedAt ?? new Date(),
      acquiredAt: overrides.acquiredAt ?? new Date(),
    },
  });
}

export async function resetGameplayTables() {
  await db.userPokemonAchievement.deleteMany();
  await db.userPokemon.deleteMany();
  await db.pokemon.deleteMany();
  await db.user.deleteMany();
}
