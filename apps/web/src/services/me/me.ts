import { isDailyGiftAvailable, nextGiftAvailableAt } from "@my-pokemons/core";
import { db } from "@/lib/db";
import type { DailyGiftStatusDto } from "../user";

// Aggregate of everything the app-shell header renders live: coin balance and
// daily-gift status, plus identity for the account menu. One query replaces the
// layout's previous two serial fetches (user + daily gift status).
export type MeDto = {
  name: string | null;
  email: string;
  coins: number;
  dailyGift: DailyGiftStatusDto;
};

export async function getMeDto(userId: string): Promise<MeDto> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      coins: true,
      lastDailyGiftClaimedAt: true,
    },
  });

  const lastClaimedAt = user.lastDailyGiftClaimedAt ?? null;
  const availableNow = isDailyGiftAvailable(lastClaimedAt, new Date());

  return {
    name: user.name,
    email: user.email,
    coins: user.coins,
    dailyGift: {
      availableNow,
      nextGiftAvailableAt:
        availableNow || lastClaimedAt === null
          ? null
          : nextGiftAvailableAt(lastClaimedAt).toISOString(),
    },
  };
}
