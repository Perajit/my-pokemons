import { describe, it, expect } from "vitest";
import { calculateHeart, applyFeed, applyPlay } from "./stats";

describe("calculateHeart()", () => {
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

describe("applyFeed()", () => {
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

describe("applyPlay()", () => {
  it("adds gain to current mood", () => {
    expect(applyPlay(40, 28)).toBe(68);
  });

  it("clamps at 100", () => {
    expect(applyPlay(80, 28)).toBe(100);
  });
});
