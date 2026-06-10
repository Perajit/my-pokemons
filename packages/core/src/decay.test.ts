import { describe, it, expect } from "vitest";
import {
  calculateElapsedHours,
  applyDecay,
  hasFainted,
  computeDecayedState,
} from "./decay";

describe("calculateElapsedHours()", () => {
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

describe("applyDecay()", () => {
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

describe("hasFainted()", () => {
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

describe("computeDecayedState()", () => {
  it("returns decayed fullness and mood after elapsed time", () => {
    const lastCalculatedAt = new Date("2024-06-01T10:00:00Z");
    const now = new Date("2024-06-01T12:00:00Z"); // 2 hours
    const result = computeDecayedState(60, 60, lastCalculatedAt, 3, 6, now);
    expect(result.currentFullness).toBe(54); // 60 - 3*2
    expect(result.currentMood).toBe(48); // 60 - 6*2
    expect(result.faintedAt).toBeNull();
  });

  it("returns the real faint time (later of the two zero-crossings)", () => {
    const lastCalculatedAt = new Date("2024-06-01T00:00:00Z");
    const now = new Date("2024-06-02T00:00:00Z"); // 24 hours
    const result = computeDecayedState(10, 10, lastCalculatedAt, 3, 6, now);
    // fullness 10/3 = 3h20m, mood 10/6 = 1h40m → faints at the later one
    expect(result.faintedAt?.toISOString()).toBe("2024-06-01T03:20:00.000Z");
  });

  it("returns faintedAt: null when only one stat reaches 0", () => {
    const lastCalculatedAt = new Date("2024-06-01T10:00:00Z");
    const now = new Date("2024-06-01T12:00:00Z"); // 2 hours
    const result = computeDecayedState(0, 60, lastCalculatedAt, 3, 0, now);
    expect(result.faintedAt).toBeNull();
  });
});
