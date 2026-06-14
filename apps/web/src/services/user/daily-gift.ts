import { DAILY_GIFT_OPTIONS } from "@my-pokemons/config/daily-gift";
import type { DailyGiftReward } from "@my-pokemons/config/daily-gift";
import {
  isDailyGiftAvailable,
  nextGiftAvailableAt,
  pickDailyGiftReward,
} from "@my-pokemons/core";
import { db } from "@/lib/db";
import { AlreadyClaimedError } from "../errors";
import { grantItem } from "../inventory";

export type DailyGiftStatusDto = {
  availableNow: boolean;
  nextGiftAvailableAt: string | null; // ISO string; null when availableNow
};

export { type DailyGiftReward };

export async function getDailyGiftStatusDto(
  userId: string,
): Promise<DailyGiftStatusDto> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lastDailyGiftClaimedAt: true },
  });
  const lastClaimedAt = user?.lastDailyGiftClaimedAt ?? null;
  const availableNow = isDailyGiftAvailable(lastClaimedAt, new Date());
  return {
    availableNow,
    nextGiftAvailableAt:
      availableNow || lastClaimedAt === null
        ? null
        : nextGiftAvailableAt(lastClaimedAt).toISOString(),
  };
}

export async function claimDailyGift(userId: string): Promise<DailyGiftReward> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lastDailyGiftClaimedAt: true },
  });
  const lastClaimedAt = user?.lastDailyGiftClaimedAt ?? null;
  if (!isDailyGiftAvailable(lastClaimedAt, new Date())) {
    throw new AlreadyClaimedError();
  }

  const reward = pickDailyGiftReward(DAILY_GIFT_OPTIONS, Math.random());

  await db.$transaction(async (transaction) => {
    if (reward.type === "coins") {
      await transaction.user.update({
        where: { id: userId },
        data: {
          lastDailyGiftClaimedAt: new Date(),
          coins: { increment: reward.amount },
        },
      });
    } else {
      await transaction.user.update({
        where: { id: userId },
        data: { lastDailyGiftClaimedAt: new Date() },
      });
      await grantItem(transaction, userId, reward.itemKey, reward.quantity);
    }
  });

  return reward;
}
