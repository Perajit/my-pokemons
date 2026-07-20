import type { UserPokemonDto } from "@/services/user-pokemon";

// Client-layer test data: fully-formed UserPokemonDto (the wire shape, with
// Date fields already serialized to ISO strings). Distinct from seed-factories.ts,
// which builds Prisma *CreateInput for seeding the integration-test DB.
// Override only the field a given test asserts on. `pokemon` is deep-merged so
// callers can patch a single nested field (e.g. fullnessDecayPerHour) without
// repeating the other pokemon defaults.
export function makeUserPokemonDto(
  overrides: Partial<
    Omit<UserPokemonDto, "pokemon"> & {
      pokemon: Partial<UserPokemonDto["pokemon"]>;
    }
  > = {},
): UserPokemonDto {
  const { pokemon: pokemonOverrides, ...rest } = overrides;
  return {
    id: "up-1",
    nickname: "Pikachu",
    pokemon: {
      name: "Pikachu",
      pokeApiId: 25,
      fullnessDecayPerHour: 3,
      moodDecayPerHour: 6,
      ...pokemonOverrides,
    },
    currentFullness: 60,
    currentMood: 60,
    lastCalculatedAt: new Date().toISOString(),
    heart: 60,
    activeStreak: 1,
    isFainted: false,
    acquiredAt: "2024-05-31T12:00:00Z",
    faintedAt: null,
    feedCooldownEndsAt: null,
    playCooldownEndsAt: null,
    earnedBondLevels: [],
    ...rest,
  };
}
