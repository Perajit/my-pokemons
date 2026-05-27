import { describe, it, expect } from "vitest";
import {
  calculateElapsedHours,
  applyDecay,
  hasFainted,
  calculateHeart,
  applyFeed,
  applyPlay,
  isOnCooldown,
  cooldownEndsAt,
} from "./index";

describe("calculateElapsedHours", () => {
  it("returns 0 for the same time", () => {
    const t = new Date("2024-01-01T00:00:00Z");
    expect(calculateElapsedHours(t, t)).toBe(0);
  });

  it("returns 1 for exactly 1 hour apart", () => {
    const from = new Date("2024-01-01T00:00:00Z");
    const to = new Date("2024-01-01T01:00:00Z");
    expect(calculateElapsedHours(from, to)).toBe(1);
  });

  it("returns 0.5 for 30 minutes apart", () => {
    const from = new Date("2024-01-01T00:00:00Z");
    const to = new Date("2024-01-01T00:30:00Z");
    expect(calculateElapsedHours(from, to)).toBe(0.5);
  });

  it("returns 2.5 for 2.5 hours apart", () => {
    const from = new Date("2024-01-01T00:00:00Z");
    const to = new Date("2024-01-01T02:30:00Z");
    expect(calculateElapsedHours(from, to)).toBe(2.5);
  });
});

describe("applyDecay", () => {
  it("subtracts decay over elapsed time", () => {
    expect(applyDecay(50, 3, 2)).toBe(44);
  });

  it("clamps at 0 when decay exceeds current value", () => {
    expect(applyDecay(10, 3, 10)).toBe(0);
  });

  it("returns current value when elapsed is 0", () => {
    expect(applyDecay(50, 3, 0)).toBe(50);
  });

  it("returns 0 when already at 0", () => {
    expect(applyDecay(0, 3, 2)).toBe(0);
  });

  it("handles fractional results correctly", () => {
    expect(applyDecay(100, 1, 0.5)).toBe(99.5);
  });
});

describe("hasFainted", () => {
  it("returns true when both fullness and mood are 0", () => {
    expect(hasFainted(0, 0)).toBe(true);
  });

  it("returns false when fullness is 0 but mood is not", () => {
    expect(hasFainted(0, 1)).toBe(false);
  });

  it("returns false when mood is 0 but fullness is not", () => {
    expect(hasFainted(1, 0)).toBe(false);
  });

  it("returns false when both are positive", () => {
    expect(hasFainted(50, 50)).toBe(false);
  });
});

describe("calculateHeart", () => {
  it("returns 100 when both are at max", () => {
    expect(calculateHeart(100, 100)).toBe(100);
  });

  it("returns 0 when both are 0", () => {
    expect(calculateHeart(0, 0)).toBe(0);
  });

  it("applies 0.6 weight to fullness and 0.4 to mood", () => {
    expect(calculateHeart(80, 40)).toBe(64);
  });

  it("returns 40 when fullness is 0 and mood is 100", () => {
    expect(calculateHeart(0, 100)).toBe(40);
  });

  it("returns 60 when fullness is 100 and mood is 0", () => {
    expect(calculateHeart(100, 0)).toBe(60);
  });
});

describe("applyFeed", () => {
  it("adds gain to current fullness", () => {
    expect(applyFeed(60, 15)).toBe(75);
  });

  it("clamps at 100", () => {
    expect(applyFeed(95, 15)).toBe(100);
  });

  it("returns 100 when already at 100", () => {
    expect(applyFeed(100, 20)).toBe(100);
  });

  it("returns the gain when starting at 0", () => {
    expect(applyFeed(0, 15)).toBe(15);
  });
});

describe("applyPlay", () => {
  it("adds gain to current mood", () => {
    expect(applyPlay(40, 28)).toBe(68);
  });

  it("clamps at 100", () => {
    expect(applyPlay(80, 28)).toBe(100);
  });
});

describe("isOnCooldown", () => {
  const now = new Date("2024-06-01T12:00:00Z");

  it("returns false when lastActionAt is null", () => {
    expect(isOnCooldown(null, 60, now)).toBe(false);
  });

  it("returns true when elapsed is less than cooldown", () => {
    const lastActionAt = new Date(now.getTime() - 30 * 1000); // 30s ago
    expect(isOnCooldown(lastActionAt, 60, now)).toBe(true);
  });

  it("returns false when elapsed equals cooldown", () => {
    const lastActionAt = new Date(now.getTime() - 60 * 1000); // exactly 60s ago
    expect(isOnCooldown(lastActionAt, 60, now)).toBe(false);
  });

  it("returns false when elapsed exceeds cooldown", () => {
    const lastActionAt = new Date(now.getTime() - 120 * 1000);
    expect(isOnCooldown(lastActionAt, 60, now)).toBe(false);
  });
});

describe("cooldownEndsAt", () => {
  it("returns null when lastActionAt is null", () => {
    expect(cooldownEndsAt(null, 60)).toBeNull();
  });

  it("returns lastActionAt + cooldownSeconds", () => {
    const lastActionAt = new Date("2024-06-01T12:00:00Z");
    const result = cooldownEndsAt(lastActionAt, 1800);
    expect(result?.toISOString()).toBe("2024-06-01T12:30:00.000Z");
  });
});
