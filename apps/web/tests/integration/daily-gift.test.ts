// @vitest-environment node

import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import { AlreadyClaimedError } from "@/services/errors";
import { getDailyGiftStatusDto, claimDailyGift } from "@/services/user";
import { getUserCoins } from "@/services/user";
import { getUserItemQuantity } from "@/services/inventory";
import { seedUser, seedItem, resetGameplayTables } from "./db-helpers";
import { makeUserData, makeItemData } from "@/test/seed-factories";

beforeEach(resetGameplayTables);
afterAll(() => db.$disconnect());

describe("getDailyGiftStatusDto()", () => {
  it("returns availableNow=true when the user has never claimed", async () => {
    const user = await seedUser(makeUserData({ coins: 0 }));

    const status = await getDailyGiftStatusDto(user.id);

    expect(status.availableNow).toBe(true);
    expect(status.nextGiftAvailableAt).toBeNull();
  });

  it("returns availableNow=false and nextGiftAvailableAt when claimed today", async () => {
    const user = await seedUser(makeUserData({ coins: 0 }));
    await db.user.update({
      where: { id: user.id },
      data: { lastDailyGiftClaimedAt: new Date() },
    });

    const status = await getDailyGiftStatusDto(user.id);

    expect(status.availableNow).toBe(false);
    expect(typeof status.nextGiftAvailableAt).toBe("string");
    // next gift should be in the future
    expect(new Date(status.nextGiftAvailableAt!).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it("returns availableNow=true when lastDailyGiftClaimedAt was yesterday", async () => {
    const user = await seedUser(makeUserData({ coins: 0 }));
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    yesterday.setUTCHours(0, 0, 0, 0); // put it firmly in the previous UTC day
    await db.user.update({
      where: { id: user.id },
      data: { lastDailyGiftClaimedAt: yesterday },
    });

    const status = await getDailyGiftStatusDto(user.id);

    expect(status.availableNow).toBe(true);
  });
});

describe("claimDailyGift()", () => {
  // claimDailyGift may grant a REVIVE depending on the weighted pick, so the
  // catalog row must exist — otherwise grantItem throws an opaque "Item not
  // found" instead of the test's real assertion.
  beforeEach(async () => {
    await seedItem(makeItemData());
  });

  it("credits coins when the reward is coins (mocked random)", async () => {
    const user = await seedUser(makeUserData({ coins: 100 }));
    // random=0 → first bucket → 5 coins
    vi.spyOn(Math, "random").mockReturnValue(0);

    const reward = await claimDailyGift(user.id);

    vi.restoreAllMocks();
    expect(reward).toEqual({ type: "coins", amount: 5 });
    expect(await getUserCoins(user.id)).toBe(105);

    // persists lastDailyGiftClaimedAt
    const updated = await db.user.findUnique({ where: { id: user.id } });
    expect(updated!.lastDailyGiftClaimedAt).not.toBeNull();
  });

  it("grants a Revive item when the reward is an item (mocked random)", async () => {
    const user = await seedUser(makeUserData({ coins: 0 }));
    // random=0.97 → fourth bucket → REVIVE item
    vi.spyOn(Math, "random").mockReturnValue(0.97);

    const reward = await claimDailyGift(user.id);

    vi.restoreAllMocks();
    expect(reward).toEqual({ type: "item", itemKey: "REVIVE", quantity: 1 });
    expect(await getUserItemQuantity(user.id, "REVIVE")).toBe(1);
  });

  it("throws AlreadyClaimedError on a second claim the same UTC day", async () => {
    const user = await seedUser(makeUserData({ coins: 0 }));
    vi.spyOn(Math, "random").mockReturnValue(0);

    await claimDailyGift(user.id);
    vi.restoreAllMocks();

    await expect(claimDailyGift(user.id)).rejects.toThrow(AlreadyClaimedError);
  });
});
