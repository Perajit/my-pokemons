import {
  calculateElapsedHours,
  applyDecay,
  hasFainted,
  calculateHeart,
  applyFeed,
  applyPlay,
  isOnCooldown,
  cooldownEndsAt,
} from "@my-pokemons/core";
import { db } from "@/lib/db";
import { NotOwnedError, FaintedError, CooldownError } from "./errors";

const FEED_COOLDOWN_SECONDS = parseInt(
  process.env.FEED_COOLDOWN_SECONDS ?? "1800",
  10,
);
const PLAY_COOLDOWN_SECONDS = parseInt(
  process.env.PLAY_COOLDOWN_SECONDS ?? "1200",
  10,
);

type Pokemon = {
  id: string;
  pokeApiId: number;
  name: string;
  description: string;
  price: number;
  fullnessDecayPerHour: number;
  moodDecayPerHour: number;
  feedFullnessGain: number;
  feedCoinReward: number;
  playMoodGain: number;
  playCoinReward: number;
};

type UserPokemonRow = {
  id: string;
  userId: string;
  pokemonId: string;
  currentFullness: number;
  currentMood: number;
  isActive: boolean;
  faintedAt: Date | null;
  lastFedAt: Date | null;
  lastPlayedAt: Date | null;
  lastCalculatedAt: Date;
  acquiredAt: Date;
  pokemon: Pokemon;
};

export type EnrichedUserPokemon = UserPokemonRow & {
  heart: number;
  activeDays: number;
  feedCooldownEndsAt: Date | null;
  playCooldownEndsAt: Date | null;
};

export type ClientPokemon = {
  id: string;
  pokemon: { name: string; pokeApiId: number };
  currentFullness: number;
  currentMood: number;
  heart: number;
  activeDays: number;
  isActive: boolean;
  acquiredAt: string;
  faintedAt: string | null;
  feedCooldownEndsAt: string | null;
  playCooldownEndsAt: string | null;
  feedCoinReward: number;
  playCoinReward: number;
};

export function toClientPokemon(p: EnrichedUserPokemon): ClientPokemon {
  return {
    id: p.id,
    pokemon: { name: p.pokemon.name, pokeApiId: p.pokemon.pokeApiId },
    currentFullness: p.currentFullness,
    currentMood: p.currentMood,
    heart: p.heart,
    activeDays: p.activeDays,
    isActive: p.isActive,
    acquiredAt: p.acquiredAt.toISOString(),
    faintedAt: p.faintedAt ? p.faintedAt.toISOString() : null,
    feedCooldownEndsAt: p.feedCooldownEndsAt
      ? p.feedCooldownEndsAt.toISOString()
      : null,
    playCooldownEndsAt: p.playCooldownEndsAt
      ? p.playCooldownEndsAt.toISOString()
      : null,
    feedCoinReward: p.pokemon.feedCoinReward,
    playCoinReward: p.pokemon.playCoinReward,
  };
}

function activeDays(
  acquiredAt: Date,
  faintedAt: Date | null,
  isActive: boolean,
  now: Date,
): number {
  const end = !isActive && faintedAt ? faintedAt : now;
  return Math.floor(
    (end.getTime() - acquiredAt.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function enrich(up: UserPokemonRow, now: Date): EnrichedUserPokemon {
  return {
    ...up,
    heart: calculateHeart(up.currentFullness, up.currentMood),
    activeDays: activeDays(up.acquiredAt, up.faintedAt, up.isActive, now),
    feedCooldownEndsAt: cooldownEndsAt(up.lastFedAt, FEED_COOLDOWN_SECONDS),
    playCooldownEndsAt: cooldownEndsAt(up.lastPlayedAt, PLAY_COOLDOWN_SECONDS),
  };
}

function computeDecayedStats(
  up: UserPokemonRow,
  now: Date,
): { newFullness: number; newMood: number; fainted: boolean } {
  const elapsed = calculateElapsedHours(up.lastCalculatedAt, now);
  const newFullness = applyDecay(
    up.currentFullness,
    up.pokemon.fullnessDecayPerHour,
    elapsed,
  );
  const newMood = applyDecay(
    up.currentMood,
    up.pokemon.moodDecayPerHour,
    elapsed,
  );
  return { newFullness, newMood, fainted: hasFainted(newFullness, newMood) };
}

async function syncAndEnrich(
  up: UserPokemonRow,
  now: Date,
): Promise<EnrichedUserPokemon> {
  if (!up.isActive) {
    return enrich(up, now);
  }

  const { newFullness, newMood, fainted } = computeDecayedStats(up, now);

  const syncedData = {
    currentFullness: newFullness,
    currentMood: newMood,
    isActive: !fainted,
    faintedAt: fainted ? now : up.faintedAt,
    lastCalculatedAt: now,
  };

  await db.userPokemon.update({ where: { id: up.id }, data: syncedData });
  return enrich({ ...up, ...syncedData }, now);
}

export async function getMyPokemons(
  userId: string,
): Promise<EnrichedUserPokemon[]> {
  const now = new Date();
  const rows = await db.userPokemon.findMany({
    where: { userId },
    orderBy: { acquiredAt: "desc" },
    include: { pokemon: true },
  });
  return Promise.all(
    rows.map((up) => syncAndEnrich(up as UserPokemonRow, now)),
  );
}

export async function getMyPokemon(
  userId: string,
  userPokemonId: string,
): Promise<EnrichedUserPokemon> {
  const now = new Date();
  const up = await db.userPokemon.findUnique({
    where: { id: userPokemonId },
    include: { pokemon: true },
  });
  if (!up || up.userId !== userId) {
    throw new NotOwnedError();
  }
  return syncAndEnrich(up as UserPokemonRow, now);
}

type ActionConfig = {
  cooldownSeconds: number;
  lastActionField: "lastFedAt" | "lastPlayedAt";
  applyGain: (current: number, gain: number) => number;
  gainField: "feedFullnessGain" | "playMoodGain";
  statField: "currentFullness" | "currentMood";
  coinRewardField: "feedCoinReward" | "playCoinReward";
};

async function performAction(
  userId: string,
  userPokemonId: string,
  cfg: ActionConfig,
): Promise<EnrichedUserPokemon> {
  const now = new Date();
  type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

  const updated = await db.$transaction(async (tx: Tx) => {
    const up = (await tx.userPokemon.findUnique({
      where: { id: userPokemonId },
      include: { pokemon: true },
    })) as UserPokemonRow | null;

    if (!up || up.userId !== userId) {
      throw new NotOwnedError();
    }
    if (!up.isActive) {
      throw new FaintedError();
    }

    const { newFullness, newMood, fainted } = computeDecayedStats(up, now);

    if (fainted) {
      await tx.userPokemon.update({
        where: { id: up.id },
        data: {
          currentFullness: 0,
          currentMood: 0,
          isActive: false,
          faintedAt: now,
          lastCalculatedAt: now,
        },
      });
      throw new FaintedError();
    }

    const lastActionAt = up[cfg.lastActionField];
    if (isOnCooldown(lastActionAt, cfg.cooldownSeconds, now)) {
      throw new CooldownError(
        cooldownEndsAt(lastActionAt, cfg.cooldownSeconds) as Date,
      );
    }

    const cutoff = new Date(now.getTime() - cfg.cooldownSeconds * 1000);
    const updatedFullness =
      cfg.statField === "currentFullness"
        ? cfg.applyGain(newFullness, up.pokemon[cfg.gainField])
        : newFullness;
    const updatedMood =
      cfg.statField === "currentMood"
        ? cfg.applyGain(newMood, up.pokemon[cfg.gainField])
        : newMood;

    const result = await tx.userPokemon.updateMany({
      where: {
        id: up.id,
        OR: [
          { [cfg.lastActionField]: null },
          { [cfg.lastActionField]: { lt: cutoff } },
        ],
      },
      data: {
        currentFullness: updatedFullness,
        currentMood: updatedMood,
        [cfg.lastActionField]: now,
        lastCalculatedAt: now,
      },
    });

    if (result.count === 0) {
      const fresh = (await tx.userPokemon.findUnique({
        where: { id: up.id },
      })) as UserPokemonRow | null;
      throw new CooldownError(
        cooldownEndsAt(
          fresh?.[cfg.lastActionField] ?? null,
          cfg.cooldownSeconds,
        ) as Date,
      );
    }

    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: up.pokemon[cfg.coinRewardField] } },
    });

    const fresh = (await tx.userPokemon.findUnique({
      where: { id: up.id },
      include: { pokemon: true },
    })) as UserPokemonRow;
    return fresh;
  });

  return enrich(updated, now);
}

export function feedPokemon(
  userId: string,
  userPokemonId: string,
): Promise<EnrichedUserPokemon> {
  return performAction(userId, userPokemonId, {
    cooldownSeconds: FEED_COOLDOWN_SECONDS,
    lastActionField: "lastFedAt",
    applyGain: applyFeed,
    gainField: "feedFullnessGain",
    statField: "currentFullness",
    coinRewardField: "feedCoinReward",
  });
}

export function playWithPokemon(
  userId: string,
  userPokemonId: string,
): Promise<EnrichedUserPokemon> {
  return performAction(userId, userPokemonId, {
    cooldownSeconds: PLAY_COOLDOWN_SECONDS,
    lastActionField: "lastPlayedAt",
    applyGain: applyPlay,
    gainField: "playMoodGain",
    statField: "currentMood",
    coinRewardField: "playCoinReward",
  });
}
