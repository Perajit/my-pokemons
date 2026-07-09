import type { UserPokemonDto } from "@/services/user-pokemon";

// Client-layer test data: fully-formed UserPokemonDto (the wire shape, with
// Date fields already serialized to ISO strings). Distinct from seed-factories.ts,
// which builds Prisma *CreateInput for seeding the integration-test DB.
// Override only the field a given test asserts on.
export function makeUserPokemonDto(
  overrides: Partial<UserPokemonDto> = {},
): UserPokemonDto {
  return {
    id: "up-1",
    nickname: "Pikachu",
    pokemon: { name: "Pikachu", pokeApiId: 25 },
    currentFullness: 60,
    currentMood: 60,
    heart: 60,
    activeStreak: 1,
    isFainted: false,
    acquiredAt: "2024-05-31T12:00:00Z",
    faintedAt: null,
    feedCooldownEndsAt: null,
    playCooldownEndsAt: null,
    earnedBondLevels: [],
    ...overrides,
  };
}
