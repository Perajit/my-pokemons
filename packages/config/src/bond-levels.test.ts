import { describe, it, expect } from "vitest";
import type { BondLevelKey } from "./bond-levels";
import { getNewBondLevels, getEarnedBondLevels } from "./bond-levels";

describe("getNewBondLevels()", () => {
  it("returns empty when activeDayCount is below the first threshold", () => {
    expect(getNewBondLevels(0, [])).toEqual([]);
  });

  it("returns exactly the qualifying levels not yet earned", () => {
    const result = getNewBondLevels(1, []);
    expect(result.map((l) => l.key)).toEqual(["BOND_LEVEL_1D"]);
  });

  it("returns multiple levels when first action lands after multiple thresholds", () => {
    const result = getNewBondLevels(8, []);
    expect(result.map((l) => l.key)).toEqual([
      "BOND_LEVEL_1D",
      "BOND_LEVEL_7D",
    ]);
  });

  it("excludes levels already earned", () => {
    const result = getNewBondLevels(7, ["BOND_LEVEL_1D" as BondLevelKey]);
    expect(result.map((l) => l.key)).toEqual(["BOND_LEVEL_7D"]);
  });

  it("returns empty when all qualifying levels are already earned", () => {
    const result = getNewBondLevels(7, [
      "BOND_LEVEL_1D" as BondLevelKey,
      "BOND_LEVEL_7D" as BondLevelKey,
    ]);
    expect(result).toEqual([]);
  });

  it("treats the threshold as inclusive (exactly N days qualifies)", () => {
    const result = getNewBondLevels(7, []);
    expect(result.map((l) => l.key)).toContain("BOND_LEVEL_7D" as BondLevelKey);
  });
});

describe("getEarnedBondLevels()", () => {
  it("returns empty below the first threshold", () => {
    expect(getEarnedBondLevels(0)).toEqual([]);
  });

  it("returns BOND_LEVEL_1D at exactly 1 day", () => {
    expect(getEarnedBondLevels(1)).toEqual(["BOND_LEVEL_1D"]);
  });

  it("returns every reached threshold (inclusive)", () => {
    expect(getEarnedBondLevels(7)).toEqual(["BOND_LEVEL_1D", "BOND_LEVEL_7D"]);
    expect(getEarnedBondLevels(30)).toEqual([
      "BOND_LEVEL_1D",
      "BOND_LEVEL_7D",
      "BOND_LEVEL_30D",
    ]);
  });

  it("returns all five levels at 365 days", () => {
    expect(getEarnedBondLevels(365)).toEqual([
      "BOND_LEVEL_1D",
      "BOND_LEVEL_7D",
      "BOND_LEVEL_30D",
      "BOND_LEVEL_90D",
      "BOND_LEVEL_365D",
    ]);
  });
});
