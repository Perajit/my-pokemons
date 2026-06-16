import { describe, it, expect } from "vitest";
import type { BondLevelKey } from "./bond-levels";
import { getNewBondLevels, getEarnedBondLevels } from "./bond-levels";

describe("getNewBondLevels()", () => {
  it("returns empty at day 0 — the welcome badge is display-only, never paid", () => {
    expect(getNewBondLevels(0, [])).toEqual([]);
  });

  it("returns empty between acquisition and the first paid threshold", () => {
    expect(getNewBondLevels(6, [])).toEqual([]);
  });

  it("returns the first paid level once its threshold is reached", () => {
    const result = getNewBondLevels(7, []);
    expect(result.map((l) => l.key)).toEqual(["BOND_LEVEL_7D"]);
  });

  it("returns multiple paid levels when first action lands after multiple thresholds", () => {
    const result = getNewBondLevels(30, []);
    expect(result.map((l) => l.key)).toEqual([
      "BOND_LEVEL_7D",
      "BOND_LEVEL_30D",
    ]);
  });

  it("excludes paid levels already earned", () => {
    const result = getNewBondLevels(30, ["BOND_LEVEL_7D" as BondLevelKey]);
    expect(result.map((l) => l.key)).toEqual(["BOND_LEVEL_30D"]);
  });

  it("returns empty when all qualifying paid levels are already earned", () => {
    const result = getNewBondLevels(30, [
      "BOND_LEVEL_7D" as BondLevelKey,
      "BOND_LEVEL_30D" as BondLevelKey,
    ]);
    expect(result).toEqual([]);
  });

  it("treats the threshold as inclusive (exactly N days qualifies)", () => {
    const result = getNewBondLevels(7, []);
    expect(result.map((l) => l.key)).toContain("BOND_LEVEL_7D" as BondLevelKey);
  });
});

describe("getEarnedBondLevels()", () => {
  it("returns the day-0 welcome badge immediately on acquisition", () => {
    expect(getEarnedBondLevels(0)).toEqual(["BOND_LEVEL_0D"]);
  });

  it("keeps only the welcome badge before the first paid threshold", () => {
    expect(getEarnedBondLevels(6)).toEqual(["BOND_LEVEL_0D"]);
  });

  it("returns every reached threshold (inclusive)", () => {
    expect(getEarnedBondLevels(7)).toEqual(["BOND_LEVEL_0D", "BOND_LEVEL_7D"]);
    expect(getEarnedBondLevels(30)).toEqual([
      "BOND_LEVEL_0D",
      "BOND_LEVEL_7D",
      "BOND_LEVEL_30D",
    ]);
  });

  it("returns all five levels at 365 days", () => {
    expect(getEarnedBondLevels(365)).toEqual([
      "BOND_LEVEL_0D",
      "BOND_LEVEL_7D",
      "BOND_LEVEL_30D",
      "BOND_LEVEL_90D",
      "BOND_LEVEL_365D",
    ]);
  });
});
