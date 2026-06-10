import { describe, it, expect } from "vitest";
import { levelColor, fullnessLabel, moodLabel } from "./pokemon-levels";

describe("levelColor()", () => {
  it.each([
    [0, "text-rose-700"],
    [20, "text-rose-700"],
    [30, "text-rose-700"],
    [31, "text-amber-700"],
    [60, "text-amber-700"],
    [61, "text-emerald-700"],
    [80, "text-emerald-700"],
    [100, "text-emerald-700"],
  ])("returns %s for value %i", (value, expected) => {
    expect(levelColor(value)).toBe(expected);
  });
});

describe("fullnessLabel()", () => {
  it.each([
    [0, "Starving"],
    [20, "Starving"],
    [21, "Hungry"],
    [40, "Hungry"],
    [41, "Fine"],
    [60, "Fine"],
    [61, "Full"],
    [80, "Full"],
    [81, "Stuffed"],
    [100, "Stuffed"],
  ])("returns %s for value %i", (value, expected) => {
    expect(fullnessLabel(value)).toBe(expected);
  });
});

describe("moodLabel()", () => {
  it.each([
    [0, "Sad"],
    [20, "Sad"],
    [21, "Upset"],
    [40, "Upset"],
    [41, "Calm"],
    [60, "Calm"],
    [61, "Happy"],
    [80, "Happy"],
    [81, "Excited"],
    [100, "Excited"],
  ])("returns %s for value %i", (value, expected) => {
    expect(moodLabel(value)).toBe(expected);
  });
});
