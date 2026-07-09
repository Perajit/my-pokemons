// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import {
  grantItem,
  consumeItem,
  getUserItemQuantity,
} from "@/services/inventory";
import { NotFoundError, InsufficientItemsError } from "@/services/errors";
import {
  seedUser,
  seedItem,
  seedUserItem,
  resetGameplayTables,
} from "./db-helpers";
import { makeUserData, makeItemData } from "@/test/seed-factories";

beforeEach(resetGameplayTables);
afterAll(() => db.$disconnect());

describe("grantItem()", () => {
  it("throws NotFoundError for an unknown item key", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    await expect(
      db.$transaction((transaction) =>
        grantItem(transaction, user.id, "REVIVE", 1),
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("creates the inventory row on first grant, then increments it", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    await seedItem(makeItemData());

    await db.$transaction((transaction) =>
      grantItem(transaction, user.id, "REVIVE", 2),
    );
    expect(await getUserItemQuantity(user.id, "REVIVE")).toBe(2);

    await db.$transaction((transaction) =>
      grantItem(transaction, user.id, "REVIVE", 3),
    );
    expect(await getUserItemQuantity(user.id, "REVIVE")).toBe(5);
    expect(await db.userItem.count()).toBe(1);
  });
});

describe("consumeItem()", () => {
  it("throws NotFoundError for an unknown item key", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    await expect(
      db.$transaction((transaction) =>
        consumeItem(transaction, user.id, "REVIVE"),
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("decrements the held quantity, and throws InsufficientItemsError at zero", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const item = await seedItem(makeItemData());
    await seedUserItem({ userId: user.id, itemId: item.id, quantity: 1 });

    await db.$transaction((transaction) =>
      consumeItem(transaction, user.id, "REVIVE"),
    );
    expect(await getUserItemQuantity(user.id, "REVIVE")).toBe(0);

    await expect(
      db.$transaction((transaction) =>
        consumeItem(transaction, user.id, "REVIVE"),
      ),
    ).rejects.toThrow(InsufficientItemsError);
  });
});

describe("getUserItemQuantity()", () => {
  it("returns 0 when the user has never owned the item", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    await seedItem(makeItemData());

    expect(await getUserItemQuantity(user.id, "REVIVE")).toBe(0);
  });

  it("returns the owned quantity when the user has the item", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const item = await seedItem(makeItemData());
    await seedUserItem({ userId: user.id, itemId: item.id, quantity: 4 });

    expect(await getUserItemQuantity(user.id, "REVIVE")).toBe(4);
  });
});
