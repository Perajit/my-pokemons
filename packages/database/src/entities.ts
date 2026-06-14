import type { Prisma } from "@prisma/client";

export type UserPokemonEntity = Prisma.UserPokemonGetPayload<{
  include: {
    pokemon: true;
    // achievements is the "coins paid" ledger (dedup). Bond levels for display
    // are derived from activeDays, not stored.
    achievements: { select: { achievementType: true; achievementKey: true } };
  };
}>;
