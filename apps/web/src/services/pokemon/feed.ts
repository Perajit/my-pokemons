import { applyFeed } from "@my-pokemons/core";
import { db } from "@/lib/db";
import { FEED_COOLDOWN_SECONDS } from "./cooldowns";
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

export async function feedPokemon(
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
    assertNotOnCooldown(entity.lastFedAt, FEED_COOLDOWN_SECONDS, now);
    const updatedState = {
      currentFullness: applyFeed(
        decayedState.currentFullness,
        entity.pokemon.feedFullnessGain,
      ),
      currentMood: decayedState.currentMood,
    };
    await commitActionWithCooldownGuard(
      transaction,
      entity.id,
      "lastFedAt",
      FEED_COOLDOWN_SECONDS,
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
      entity.pokemon.feedCoinReward + bondLevelOutcome.totalBondLevelCoins,
    );
    return {
      userPokemon: buildPostActionUserPokemon(
        entity,
        updatedState,
        "lastFedAt",
        now,
      ),
      events: bondLevelOutcome.events,
    };
  });
}
