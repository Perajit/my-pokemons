import { applyFeed } from "@my-pokemons/core";
import { db } from "@/lib/db";
import { creditCoins } from "../user";
import { FEED_COOLDOWN_SECONDS } from "./cooldowns";
import {
  loadOwnedUserPokemonEntity,
  syncDecayAndAssertActive,
  assertNotOnCooldown,
  commitActionWithCooldownGuard,
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
    const decayedState = await syncDecayAndAssertActive(
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
    await creditCoins(
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
      events: [
        {
          type: "pokemon_fed" as const,
          pokemonName: entity.pokemon.name,
          coinsEarned: entity.pokemon.feedCoinReward,
        },
        ...bondLevelOutcome.events,
      ],
    };
  });
}
