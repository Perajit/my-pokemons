import { describe, it, expect } from "vitest";
import { validateDisplayName, MAX_DISPLAY_NAME_LENGTH } from "./validation";

describe("validateDisplayName", () => {
  it("rejects an empty or whitespace-only name", () => {
    expect(validateDisplayName("")).toBe("Name is required");
    expect(validateDisplayName("   ")).toBe("Name is required");
  });

  it("rejects a name longer than the limit", () => {
    const tooLong = "a".repeat(MAX_DISPLAY_NAME_LENGTH + 1);
    expect(validateDisplayName(tooLong)).toMatch(/32 characters/);
  });

  it("accepts a valid name, ignoring surrounding whitespace", () => {
    expect(validateDisplayName("Ash")).toBeNull();
    expect(validateDisplayName("  Ash Ketchum  ")).toBeNull();
  });

  it("accepts a name exactly at the limit", () => {
    expect(validateDisplayName("a".repeat(MAX_DISPLAY_NAME_LENGTH))).toBeNull();
  });
});
