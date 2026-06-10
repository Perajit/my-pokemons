import {
  computeDecayedState,
  calculateHeart,
  cooldownEndsAt,
  activeDays,
} from "@my-pokemons/core";
import { getEarnedBondLevels } from "@my-pokemons/config/bond-levels";
import type { UserPokemonEntity } from "@my-pokemons/database";
import { db } from "@/lib/db";
import { NotOwnedError } from "../errors";
import { FEED_COOLDOWN_SECONDS, PLAY_COOLDOWN_SECONDS } from "./cooldowns";
import type { UserPokemon, UserPokemonSnapshot } from "./types";

async function syncDecayState(
  entity: UserPokemonEntity,
  now: Date,
): Promise<UserPokemonEntity> {
  if (entity.faintedAt) {
    return entity;
  }
  const { currentFullness, currentMood, faintedAt } = computeDecayedState(
    entity.currentFullness,
    entity.currentMood,
    entity.lastCalculatedAt,
    entity.pokemon.fullnessDecayPerHour,
    entity.pokemon.moodDecayPerHour,
    now,
  );
  const syncedData = {
    currentFullness,
    currentMood,
    faintedAt,
    lastCalculatedAt: now,
  };
  await db.userPokemon.update({ where: { id: entity.id }, data: syncedData });
  return { ...entity, ...syncedData };
}

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

export async function getUserCollection(
  userId: string,
): Promise<UserPokemon[]> {
  const now = new Date();
  const entities = await db.userPokemon.findMany({
    where: { userId },
    orderBy: { acquiredAt: "desc" },
    include: {
      pokemon: true,
      achievements: { select: { achievementType: true, achievementKey: true } },
    },
  });
  return Promise.all(
    entities.map(async (entity) => {
      const synced = await syncDecayState(entity, now);
      return toUserPokemon(synced, now);
    }),
  );
}

export async function getUserPokemon(
  userId: string,
  userPokemonId: string,
): Promise<UserPokemon> {
  const now = new Date();
  const entity = await db.userPokemon.findUnique({
    where: { id: userPokemonId },
    include: {
      pokemon: true,
      achievements: { select: { achievementType: true, achievementKey: true } },
    },
  });
  if (!entity || entity.userId !== userId) {
    throw new NotOwnedError();
  }
  const synced = await syncDecayState(entity, now);
  return toUserPokemon(synced, now);
}
