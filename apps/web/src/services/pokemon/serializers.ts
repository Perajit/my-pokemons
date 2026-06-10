import type { UserPokemon, UserPokemonDTO } from "./types";

export function toUserPokemonDTO(userPokemon: UserPokemon): UserPokemonDTO {
  return {
    id: userPokemon.id,
    pokemon: {
      name: userPokemon.pokemon.name,
      pokeApiId: userPokemon.pokemon.pokeApiId,
    },
    currentFullness: userPokemon.currentFullness,
    currentMood: userPokemon.currentMood,
    heart: userPokemon.heart,
    activeDays: userPokemon.activeDays,
    isFainted: userPokemon.isFainted,
    acquiredAt: userPokemon.acquiredAt.toISOString(),
    faintedAt: userPokemon.faintedAt
      ? userPokemon.faintedAt.toISOString()
      : null,
    feedCooldownEndsAt: userPokemon.feedCooldownEndsAt
      ? userPokemon.feedCooldownEndsAt.toISOString()
      : null,
    playCooldownEndsAt: userPokemon.playCooldownEndsAt
      ? userPokemon.playCooldownEndsAt.toISOString()
      : null,
    feedCoinReward: userPokemon.pokemon.feedCoinReward,
    playCoinReward: userPokemon.pokemon.playCoinReward,
    earnedBondLevels: userPokemon.earnedBondLevels,
  };
}
