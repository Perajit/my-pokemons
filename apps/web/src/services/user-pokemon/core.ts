import { computeDecayedState } from "@my-pokemons/core";
import type { UserPokemonEntity } from "@my-pokemons/database";
import { db } from "@/lib/db";
import { NotOwnedError } from "../errors";
import { toUserPokemon, toUserPokemonDto } from "./mappers";
import type { UserPokemon, UserPokemonDto } from "./types";

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

// Domain reads (internal): callers inside the service layer that need the full
// domain object. Pages and API routes use the Dto reads below.
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

// DTO reads (public): the serialization-ready shape that pages and the
// `/api/collection` routes return. Mapping lives here, never in the caller.
export async function getUserCollectionDto(
  userId: string,
): Promise<UserPokemonDto[]> {
  const collection = await getUserCollection(userId);
  return collection.map(toUserPokemonDto);
}

export async function getUserPokemonDto(
  userId: string,
  userPokemonId: string,
): Promise<UserPokemonDto> {
  const userPokemon = await getUserPokemon(userId, userPokemonId);
  return toUserPokemonDto(userPokemon);
}
