import type { Prisma } from "@my-pokemons/database";
import type { ItemKey } from "@my-pokemons/config/items";
import { db } from "@/lib/db";
import { NotFoundError } from "../errors";
import { spendCoins } from "../user";
import { grantItem } from "../inventory";

// Shop read DTO for an item — the exact shape the product card renders.
export type ShopItemDto = {
  id: string;
  key: ItemKey;
  name: string;
  description: string;
  price: number;
  userOwnedCount: number; // how many the user holds (UserItem.quantity, 0 if none)
};

type ShopItemEntity = Prisma.ItemGetPayload<{
  include: { userItems: { select: { quantity: true } } };
}>;

// catalog Item (+ the user's holding) → shop read DTO.
function toShopItemDto(item: ShopItemEntity): ShopItemDto {
  return {
    id: item.id,
    key: item.key as ItemKey,
    name: item.name,
    description: item.description,
    price: item.price,
    userOwnedCount: item.userItems[0]?.quantity ?? 0,
  };
}

// The full item catalog with the given user's holding merged in (one query).
export async function getShopItemsDto(userId: string): Promise<ShopItemDto[]> {
  const items = await db.item.findMany({
    orderBy: { price: "asc" },
    include: {
      userItems: { where: { userId }, select: { quantity: true } },
    },
  });
  return items.map(toShopItemDto);
}

// Buys one of the given item: atomically deducts coins (race-safe via
// spendCoins) and grants the item in the same transaction.
export async function buyItem(userId: string, itemKey: ItemKey): Promise<void> {
  const item = await db.item.findUnique({ where: { key: itemKey } });
  if (!item) {
    throw new NotFoundError("Item");
  }

  await db.$transaction(async (transaction) => {
    await spendCoins(transaction, userId, item.price);
    await grantItem(transaction, userId, itemKey, 1);
  });
}
