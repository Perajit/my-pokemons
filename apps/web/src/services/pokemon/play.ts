import { applyPlay } from "@my-pokemons/core";
import { db } from "@/lib/db";
import { PLAY_COOLDOWN_SECONDS } from "./cooldowns";
import {
  loadOwnedUserPokemonEntity,
  syncDecayOrThrowIfFainted,
  assertNotOnCooldown,
  commitActionWithCooldownGuard,
  creditCoinsToUser,
  recordAchievementRewards,
  buildPostActionUserPokemon,
} from "./action-steps";
import { evaluateBondLevels } from "./bond-levels";
import type { GameplayActionResult } from "./types";

export async function playWithPokemon(
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
    const decayedState = await syncDecayOrThrowIfFainted(
      transaction,
      entity,
      now,
    );
    assertNotOnCooldown(entity.lastPlayedAt, PLAY_COOLDOWN_SECONDS, now);
    const updatedState = {
      currentFullness: decayedState.currentFullness,
      currentMood: applyPlay(
        decayedState.currentMood,
        entity.pokemon.playMoodGain,
      ),
    };
    await commitActionWithCooldownGuard(
      transaction,
      entity.id,
      "lastPlayedAt",
      PLAY_COOLDOWN_SECONDS,
      updatedState,
      now,
    );
    const bondLevelOutcome = evaluateBondLevels(entity, now);
    await recordAchievementRewards(
      transaction,
      entity.id,
      bondLevelOutcome.newlyEarnedBondLevels,
    );
    await creditCoinsToUser(
      transaction,
      userId,
      entity.pokemon.playCoinReward + bondLevelOutcome.totalBondLevelCoins,
    );
    return {
      userPokemon: buildPostActionUserPokemon(
        entity,
        updatedState,
        "lastPlayedAt",
        now,
      ),
      events: bondLevelOutcome.events,
    };
  });
}
