import { db } from "@/lib/db";
import { InsufficientCoinsError } from "../errors";
import type { PrismaTransaction } from "../transaction";

// The user's wallet: the coin balance read plus credit/spend mutations.
// Currency is a global user concern, not a feature one — feed/play and the shop
// both compose the mutations inside their own transaction.

// The user's current coin balance, 0 if the user somehow isn't found.
export async function getUserCoins(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { coins: true },
  });
  return user?.coins ?? 0;
}

export async function creditCoins(
  transaction: PrismaTransaction,
  userId: string,
  amount: number,
): Promise<void> {
  if (amount === 0) {
    return;
  }
  await transaction.user.update({
    where: { id: userId },
    data: { coins: { increment: amount } },
  });
}

// Atomically checks and deducts coins in one statement (race-safe): if the
// balance is below `amount` the `updateMany` matches no rows and we throw,
// rolling back the caller's transaction.
export async function spendCoins(
  transaction: PrismaTransaction,
  userId: string,
  amount: number,
): Promise<void> {
  const result = await transaction.user.updateMany({
    where: { id: userId, coins: { gte: amount } },
    data: { coins: { decrement: amount } },
  });
  if (result.count === 0) {
    throw new InsufficientCoinsError();
  }
}
