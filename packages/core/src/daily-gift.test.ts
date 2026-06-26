import { describe, it, expect } from "vitest";
import {
  isDailyGiftAvailable,
  nextGiftAvailableAt,
  pickDailyGiftReward,
} from "./daily-gift";
import { DAILY_GIFT_CONFIGS } from "@my-pokemons/config/daily-gift";

describe("isDailyGiftAvailable()", () => {
  it("returns true when lastClaimedAt is null (never claimed)", () => {
    expect(isDailyGiftAvailable(null, new Date("2026-06-14T10:00:00Z"))).toBe(
      true,
    );
  });

  it("returns true when lastClaimedAt was yesterday UTC", () => {
    const yesterday = new Date("2026-06-13T23:59:59Z");
    const now = new Date("2026-06-14T00:00:01Z");
    expect(isDailyGiftAvailable(yesterday, now)).toBe(true);
  });

  it("returns false when lastClaimedAt is earlier today UTC", () => {
    const claimedAt = new Date("2026-06-14T06:00:00Z");
    const now = new Date("2026-06-14T22:00:00Z");
    expect(isDailyGiftAvailable(claimedAt, now)).toBe(false);
  });

  it("returns false when lastClaimedAt is the same UTC second as now", () => {
    const claimedAt = new Date("2026-06-14T10:00:00Z");
    expect(isDailyGiftAvailable(claimedAt, claimedAt)).toBe(false);
  });
});

describe("nextGiftAvailableAt()", () => {
  it("returns the next midnight UTC regardless of the time of day", () => {
    const claimedAt = new Date("2026-06-14T15:30:00Z");
    const result = nextGiftAvailableAt(claimedAt);
    expect(result.toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });

  it("handles a claim right before midnight correctly", () => {
    const claimedAt = new Date("2026-06-14T23:59:59Z");
    const result = nextGiftAvailableAt(claimedAt);
    expect(result.toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });

  it("handles a claim exactly at midnight (rolls to the next day)", () => {
    const claimedAt = new Date("2026-06-14T00:00:00Z");
    const result = nextGiftAvailableAt(claimedAt);
    expect(result.toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });
});

describe("pickDailyGiftReward()", () => {
  // DAILY_GIFT_CONFIGS weights: 60 / 20 / 9 / 9 / 2 (sum = 100)
  // random=0.00 → first bucket (weight 60):  5 coins
  // random=0.65 → second bucket (weight 20): 10 coins
  // random=0.88 → third bucket (weight 9):   50 coins
  // random=0.97 → fourth bucket (weight 9):  Revive
  // random=1.00 → last-option fallback:      100 coins

  it("picks 5 coins when random is at the very start", () => {
    const reward = pickDailyGiftReward(DAILY_GIFT_CONFIGS, 0);
    expect(reward).toEqual({ type: "coins", amount: 5 });
  });

  it("picks 10 coins when random crosses into the second bucket", () => {
    const reward = pickDailyGiftReward(DAILY_GIFT_CONFIGS, 0.65);
    expect(reward).toEqual({ type: "coins", amount: 10 });
  });

  it("picks 50 coins when random crosses into the third bucket", () => {
    const reward = pickDailyGiftReward(DAILY_GIFT_CONFIGS, 0.88);
    expect(reward).toEqual({ type: "coins", amount: 50 });
  });

  it("picks a Revive item when random crosses into the fourth bucket", () => {
    const reward = pickDailyGiftReward(DAILY_GIFT_CONFIGS, 0.97);
    expect(reward).toEqual({ type: "item", itemKey: "REVIVE", quantity: 1 });
  });

  it("falls through to the last option when random is exactly 1", () => {
    const reward = pickDailyGiftReward(DAILY_GIFT_CONFIGS, 1);
    expect(reward).toEqual({ type: "coins", amount: 100 });
  });
});
