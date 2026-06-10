import { describe, it, expect } from "vitest";
import { isOnCooldown, cooldownEndsAt } from "./cooldown";

describe("isOnCooldown()", () => {
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

describe("cooldownEndsAt()", () => {
  it("returns null when lastActionAt is null", () => {
    expect(cooldownEndsAt(null, 60)).toBeNull();
  });

  it("returns lastActionAt + cooldownSeconds", () => {
    const lastActionAt = new Date("2024-06-01T12:00:00Z");
    const result = cooldownEndsAt(lastActionAt, 1800);
    expect(result?.toISOString()).toBe("2024-06-01T12:30:00.000Z");
  });
});
