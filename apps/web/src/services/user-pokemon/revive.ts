import { REVIVE_RESTORE_VALUE } from "@my-pokemons/config/items";
import { db } from "@/lib/db";
import { NotFaintedError } from "../errors";
import { consumeItem } from "../inventory";
import { loadOwnedUserPokemonEntity } from "./action-steps";
import { toUserPokemon } from "./mappers";
import type { GameplayActionResult, UserPokemonSnapshot } from "./types";

// Wakes a fainted Pokémon by spending one Revive: restores both stats to
// REVIVE_RESTORE_VALUE, clears the faint, and folds the just-ended downtime
// into totalFaintedDurationMs so bond progress resumes where it froze while the
// active streak restarts from now.
export async function revivePokemon(
  userId: string,
  userPokemonId: string,
): Promise<GameplayActionResult> {
  const now = new Date();
  return db.$transaction(async (transaction) => {
    const entity = await loadOwnedUserPokemonEntity(
      transaction,
      userPokemonId,
      userId,
    );
    if (entity.faintedAt === null) {
      throw new NotFaintedError();
    }
    await consumeItem(transaction, userId, "REVIVE");

    const totalFaintedDurationMs =
      entity.totalFaintedDurationMs +
      (now.getTime() - entity.faintedAt.getTime());

    await transaction.userPokemon.update({
      where: { id: entity.id },
      data: {
        faintedAt: null,
        currentFullness: REVIVE_RESTORE_VALUE,
        currentMood: REVIVE_RESTORE_VALUE,
        lastCalculatedAt: now,
        lastRevivedAt: now,
        totalFaintedDurationMs,
      },
    });

    const snapshot: UserPokemonSnapshot = {
      id: entity.id,
      currentFullness: REVIVE_RESTORE_VALUE,
      currentMood: REVIVE_RESTORE_VALUE,
      acquiredAt: entity.acquiredAt,
      faintedAt: null,
      lastFedAt: entity.lastFedAt,
      lastPlayedAt: entity.lastPlayedAt,
      lastRevivedAt: now,
      totalFaintedDurationMs,
      pokemon: {
        name: entity.pokemon.name,
        pokeApiId: entity.pokemon.pokeApiId,
        feedCoinReward: entity.pokemon.feedCoinReward,
        playCoinReward: entity.pokemon.playCoinReward,
      },
    };

    return {
      userPokemon: toUserPokemon(snapshot, now),
      events: [{ type: "pokemon_revived", pokemonName: entity.pokemon.name }],
    };
  });
}
