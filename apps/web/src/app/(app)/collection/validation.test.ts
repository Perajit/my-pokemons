import { describe, it, expect } from "vitest";
import { validateNickname, MAX_NICKNAME_LENGTH } from "./validation";

describe("validateNickname", () => {
  it("rejects an empty or whitespace-only nickname", () => {
    expect(validateNickname("")).toBe("Nickname is required");
    expect(validateNickname("   ")).toBe("Nickname is required");
  });

  it("rejects a nickname longer than the limit", () => {
    const tooLong = "a".repeat(MAX_NICKNAME_LENGTH + 1);
    expect(validateNickname(tooLong)).toMatch(/20 characters/);
  });

  it("accepts a valid nickname, ignoring surrounding whitespace", () => {
    expect(validateNickname("Sparky")).toBeNull();
    expect(validateNickname("  Sparky  ")).toBeNull();
  });

  it("accepts a nickname exactly at the limit", () => {
    expect(validateNickname("a".repeat(MAX_NICKNAME_LENGTH))).toBeNull();
  });
});
