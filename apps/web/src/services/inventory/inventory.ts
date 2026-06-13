import type { ItemKey } from "@my-pokemons/config/items";
import { db } from "@/lib/db";
import { NotFoundError } from "../errors";
import type { PrismaTransaction } from "../transaction";

// Adds `quantity` of an item to a user's inventory, creating the row on first
// grant. Runs inside the caller's transaction so it composes with coin spends.
export async function grantItem(
  transaction: PrismaTransaction,
  userId: string,
  itemKey: ItemKey,
  quantity: number,
): Promise<void> {
  const item = await transaction.item.findUnique({ where: { key: itemKey } });
  if (!item) {
    throw new NotFoundError("Item");
  }
  await transaction.userItem.upsert({
    where: { userId_itemId: { userId, itemId: item.id } },
    create: { userId, itemId: item.id, quantity },
    update: { quantity: { increment: quantity } },
  });
}

// The UserItem.quantity this user holds for an item (0 if no row).
export async function getUserItemQuantity(
  userId: string,
  itemKey: ItemKey,
): Promise<number> {
  const userItem = await db.userItem.findFirst({
    where: { userId, item: { key: itemKey } },
    select: { quantity: true },
  });
  return userItem?.quantity ?? 0;
}
