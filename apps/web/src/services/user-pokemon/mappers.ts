import { calculateHeart, cooldownEndsAt, activeDays } from "@my-pokemons/core";
import { getEarnedBondLevels } from "@my-pokemons/config/bond-levels";
import { FEED_COOLDOWN_SECONDS, PLAY_COOLDOWN_SECONDS } from "./cooldowns";
import type { UserPokemon, UserPokemonSnapshot, UserPokemonDto } from "./types";

// entity/snapshot → domain object (adds derived fields: heart, streak, bond levels, cooldowns).
export function toUserPokemon(
  snapshot: UserPokemonSnapshot,
  now: Date,
): UserPokemon {
  const activeDayCount = activeDays(
    snapshot.acquiredAt,
    snapshot.faintedAt,
    now,
  );
  return {
    id: snapshot.id,
    currentFullness: snapshot.currentFullness,
    currentMood: snapshot.currentMood,
    acquiredAt: snapshot.acquiredAt,
    faintedAt: snapshot.faintedAt,
    lastFedAt: snapshot.lastFedAt,
    lastPlayedAt: snapshot.lastPlayedAt,
    pokemon: snapshot.pokemon,
    heart: calculateHeart(snapshot.currentFullness, snapshot.currentMood),
    activeDays: activeDayCount,
    isFainted: snapshot.faintedAt !== null,
    earnedBondLevels: getEarnedBondLevels(activeDayCount),
    feedCooldownEndsAt: cooldownEndsAt(
      snapshot.lastFedAt,
      FEED_COOLDOWN_SECONDS,
    ),
    playCooldownEndsAt: cooldownEndsAt(
      snapshot.lastPlayedAt,
      PLAY_COOLDOWN_SECONDS,
    ),
  };
}

// domain object → wire DTO (Dates → ISO strings, drops internal-only fields).
export function toUserPokemonDto(userPokemon: UserPokemon): UserPokemonDto {
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
    earnedBondLevels: userPokemon.earnedBondLevels,
  };
}
