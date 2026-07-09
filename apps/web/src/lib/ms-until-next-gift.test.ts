import { describe, it, expect } from "vitest";
import { msUntilNextGift } from "./ms-until-next-gift";

describe("msUntilNextGift", () => {
  const now = new Date("2026-01-01T23:00:00.000Z");

  it("returns the ms remaining until a future target", () => {
    const oneHourLater = "2026-01-02T00:00:00.000Z";
    expect(msUntilNextGift(oneHourLater, now)).toBe(60 * 60 * 1000);
  });

  it("returns 0 when the target is exactly now", () => {
    expect(msUntilNextGift(now.toISOString(), now)).toBe(0);
  });

  it("returns 0 (never negative) when the target is in the past", () => {
    const oneHourEarlier = "2026-01-01T22:00:00.000Z";
    expect(msUntilNextGift(oneHourEarlier, now)).toBe(0);
  });
});
