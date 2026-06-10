import { describe, it, expect } from "vitest";
import { activeDays } from "./streak";

describe("activeDays()", () => {
  const now = new Date("2024-06-08T12:00:00Z");

  it("returns 0 when acquired the same instant and not fainted", () => {
    expect(activeDays(now, null, now)).toBe(0);
  });

  it("returns whole days since acquiredAt while not fainted", () => {
    const acquiredAt = new Date("2024-06-01T12:00:00Z");
    expect(activeDays(acquiredAt, null, now)).toBe(7);
  });

  it("truncates at faintedAt when the pokemon has fainted", () => {
    const acquiredAt = new Date("2024-06-01T12:00:00Z");
    const faintedAt = new Date("2024-06-04T12:00:00Z");
    expect(activeDays(acquiredAt, faintedAt, now)).toBe(3);
  });
});
