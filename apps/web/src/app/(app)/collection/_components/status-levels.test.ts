import { describe, expect, it } from "vitest";
import { getStatusLevelColor } from "./status-levels";

describe("getStatusLevelColor()", () => {
  it.each([
    [0, { text: "text-rose-600", bg: "bg-rose-500" }],
    [20, { text: "text-rose-600", bg: "bg-rose-500" }],
    [21, { text: "text-amber-500", bg: "bg-amber-400" }],
    [50, { text: "text-amber-500", bg: "bg-amber-400" }],
    [51, { text: "text-emerald-600", bg: "bg-emerald-500" }],
    [100, { text: "text-emerald-600", bg: "bg-emerald-500" }],
  ])("returns %s for value %i", (value, expected) => {
    expect(getStatusLevelColor(value)).toEqual(expected);
  });
});
