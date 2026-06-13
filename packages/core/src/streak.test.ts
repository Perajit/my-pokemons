import { describe, it, expect } from "vitest";
import { activeStreakDays, bondActiveDays } from "./streak";

const now = new Date("2024-06-08T12:00:00Z");
const acquiredAt = new Date("2024-06-01T12:00:00Z"); // 7 days before now

describe("activeStreakDays()", () => {
  it("returns 0 the instant it is acquired and not fainted", () => {
    expect(activeStreakDays(now, null, null, now)).toBe(0);
  });

  it("counts whole days from acquiredAt when never revived and active", () => {
    expect(activeStreakDays(acquiredAt, null, null, now)).toBe(7);
  });

  it("returns 0 while fainted, regardless of how long it lived", () => {
    const faintedAt = new Date("2024-06-04T12:00:00Z");
    expect(activeStreakDays(acquiredAt, null, faintedAt, now)).toBe(0);
  });

  it("counts from lastRevivedAt once revived (streak restarts)", () => {
    const lastRevivedAt = new Date("2024-06-06T12:00:00Z"); // 2 days before now
    expect(activeStreakDays(acquiredAt, lastRevivedAt, null, now)).toBe(2);
  });
});

describe("bondActiveDays()", () => {
  it("counts whole alive days since acquiredAt with no downtime", () => {
    expect(bondActiveDays(acquiredAt, null, now, 0)).toBe(7);
  });

  it("excludes accumulated fainted downtime", () => {
    const twoDaysMs = 2 * 86_400_000;
    expect(bondActiveDays(acquiredAt, null, now, twoDaysMs)).toBe(5);
  });

  it("freezes at faintedAt while currently fainted", () => {
    const faintedAt = new Date("2024-06-04T12:00:00Z"); // 3 alive days
    expect(bondActiveDays(acquiredAt, faintedAt, now, 0)).toBe(3);
  });

  it("is continuous across a revive (downtime folded into the total, no loss)", () => {
    const faintedAt = new Date("2024-06-04T12:00:00Z");
    const frozenWhileFainted = bondActiveDays(acquiredAt, faintedAt, now, 0); // 3
    const twoDaysDowntimeMs = 2 * 86_400_000;
    const afterRevive = bondActiveDays(
      acquiredAt,
      null,
      now,
      twoDaysDowntimeMs,
    ); // 7 - 2 = 5
    expect(frozenWhileFainted).toBe(3);
    expect(afterRevive).toBe(5);
    expect(afterRevive).toBeGreaterThanOrEqual(frozenWhileFainted); // monotonic
  });
});
