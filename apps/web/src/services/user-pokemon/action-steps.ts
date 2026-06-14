import {
  computeDecayedState,
  isOnCooldown,
  cooldownEndsAt,
} from "@my-pokemons/core";
import type { UserPokemonEntity } from "@my-pokemons/database";
import { NotOwnedError, FaintedError, CooldownError } from "../errors";
import type { PrismaTransaction } from "../transaction";
import { toUserPokemon } from "./mappers";
import type { UserPokemon, UserPokemonSnapshot } from "./types";

export async function loadOwnedUserPokemonEntity(
  transaction: PrismaTransaction,
  userPokemonId: string,
  userId: string,
): Promise<UserPokemonEntity> {
  const entity = await transaction.userPokemon.findUnique({
    where: { id: userPokemonId },
    include: {
      pokemon: true,
      achievements: { select: { achievementType: true, achievementKey: true } },
    },
  });
  if (!entity || entity.userId !== userId) {
    throw new NotOwnedError();
  }
  return entity;
}

export async function syncDecayAndAssertActive(
  transaction: PrismaTransaction,
  entity: UserPokemonEntity,
  now: Date,
): Promise<{ currentFullness: number; currentMood: number }> {
  if (entity.faintedAt) {
    throw new FaintedError();
  }
  const { currentFullness, currentMood, faintedAt } = computeDecayedState(
    entity.currentFullness,
    entity.currentMood,
    entity.lastCalculatedAt,
    entity.pokemon.fullnessDecayPerHour,
    entity.pokemon.moodDecayPerHour,
    now,
  );
  if (faintedAt !== null) {
    await transaction.userPokemon.update({
      where: { id: entity.id },
      data: {
        currentFullness: 0,
        currentMood: 0,
        faintedAt,
        lastCalculatedAt: now,
      },
    });
    throw new FaintedError();
  }
  return { currentFullness, currentMood };
}

export function assertNotOnCooldown(
  lastActionAt: Date | null,
  cooldownSeconds: number,
  now: Date,
): void {
  if (isOnCooldown(lastActionAt, cooldownSeconds, now)) {
    throw new CooldownError(
      cooldownEndsAt(lastActionAt, cooldownSeconds) as Date,
    );
  }
}

export async function commitActionWithCooldownGuard(
  transaction: PrismaTransaction,
  userPokemonId: string,
  lastActionField: "lastFedAt" | "lastPlayedAt",
  cooldownSeconds: number,
  updatedState: { currentFullness: number; currentMood: number },
  now: Date,
): Promise<void> {
  const cooldownCutoff = new Date(now.getTime() - cooldownSeconds * 1000);
  const result = await transaction.userPokemon.updateMany({
    where: {
      id: userPokemonId,
      OR: [
        { [lastActionField]: null },
        { [lastActionField]: { lt: cooldownCutoff } },
      ],
    },
    data: {
      currentFullness: updatedState.currentFullness,
      currentMood: updatedState.currentMood,
      [lastActionField]: now,
      lastCalculatedAt: now,
    },
  });
  /* v8 ignore start */
  // Race guard: reachable only under true multi-process concurrency, where two
  // requests both pass the cooldown pre-check before either commits. Not
  // deterministically triggerable in a single-process test (Prisma serializes
  // the transactions, so the loser is caught by assertNotOnCooldown). The
  // invariant is covered by the "two concurrent feeds" integration test.
  if (result.count === 0) {
    const fresh = await transaction.userPokemon.findUnique({
      where: { id: userPokemonId },
    });
    throw new CooldownError(
      cooldownEndsAt(fresh?.[lastActionField] ?? null, cooldownSeconds) as Date,
    );
  }
  /* v8 ignore stop */
}

// Records the "coins paid" ledger for newly-earned bond levels (dedup guard for
// coin crediting). Displayed bond levels are derived from bondActiveDays at read
// time — nothing else to persist here.
export async function recordAchievementRewards(
  transaction: PrismaTransaction,
  userPokemonId: string,
  newlyEarned: { achievementType: string; achievementKey: string }[],
): Promise<void> {
  if (newlyEarned.length === 0) {
    return;
  }
  await transaction.userPokemonAchievement.createMany({
    data: newlyEarned.map((item) => ({
      userPokemonId,
      achievementType: item.achievementType,
      achievementKey: item.achievementKey,
    })),
    skipDuplicates: true,
  });
}

export function buildPostActionUserPokemon(
  entity: UserPokemonEntity,
  updatedStats: { currentFullness: number; currentMood: number },
  lastActionField: "lastFedAt" | "lastPlayedAt",
  now: Date,
): UserPokemon {
  // faintedAt is null by invariant: syncDecayAndAssertActive throws on any
  // fainted path, and no subsequent step in the feed/play flow writes faintedAt.
  const snapshot: UserPokemonSnapshot = {
    id: entity.id,
    nickname: entity.nickname,
    currentFullness: updatedStats.currentFullness,
    currentMood: updatedStats.currentMood,
    acquiredAt: entity.acquiredAt,
    faintedAt: null,
    lastFedAt: lastActionField === "lastFedAt" ? now : entity.lastFedAt,
    lastPlayedAt:
      lastActionField === "lastPlayedAt" ? now : entity.lastPlayedAt,
    lastRevivedAt: entity.lastRevivedAt,
    totalFaintedDurationMs: entity.totalFaintedDurationMs,
    pokemon: {
      name: entity.pokemon.name,
      pokeApiId: entity.pokemon.pokeApiId,
      feedCoinReward: entity.pokemon.feedCoinReward,
      playCoinReward: entity.pokemon.playCoinReward,
    },
  };
  return toUserPokemon(snapshot, now);
}
