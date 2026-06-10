import { describe, it, expect } from "vitest";
import {
  checkPasswordRules,
  validateEmail,
  validatePassword,
  validateRequired,
} from "./validation";

describe("validateEmail()", () => {
  it("rejects empty email", () => {
    expect(validateEmail("")).toBe("Email is required");
  });

  describe("invalid format", () => {
    it.each([
      ["notanemail", "no @ symbol"],
      ["@example.com", "missing local part"],
      ["user@", "missing domain"],
      ["user@nodot", "no dot in domain"],
      ["user name@example.com", "space in local part"],
      ["user@@example.com", "double @"],
    ])("rejects '%s' (%s)", (email) => {
      expect(validateEmail(email)).toBe("Enter a valid email address");
    });
  });

  describe("valid formats", () => {
    it.each([
      ["user@example.com", "basic"],
      ["user+tag@sub.domain.com", "subdomain + plus addressing"],
      ["a@b.co", "short TLD"],
    ])("accepts '%s' (%s)", (email) => {
      expect(validateEmail(email)).toBeNull();
    });
  });
});

describe("validatePassword()", () => {
  it("rejects empty password", () => {
    expect(validatePassword("")).toBe("Password is required");
  });

  it.each([
    ["Pass1!", "too short", "at least 8 characters"],
    ["password1!", "no uppercase", "uppercase letter"],
    ["PASSWORD1!", "no lowercase", "lowercase letter"],
    ["Password!", "no number", "number"],
    ["Password1", "no special character", "special character"],
  ])("rejects '%s' (%s)", (password, _reason, failedRule) => {
    expect(validatePassword(password)).toBe(
      `Password must satisfy: ${failedRule}`,
    );
  });

  it.each([["Password1!"], ["MyDog2024!"], ["Pikachu99$"]])(
    "accepts '%s' (all rules met)",
    (password) => {
      expect(validatePassword(password)).toBeNull();
    },
  );
});

describe("checkPasswordRules()", () => {
  it("returns all rules with met=false for empty password", () => {
    const rules = checkPasswordRules("");
    expect(rules).toHaveLength(5);
    expect(rules.every((r) => !r.met)).toBe(true);
  });

  it("flips each rule individually as the password gains that property", () => {
    const byKey = (p: string) =>
      Object.fromEntries(checkPasswordRules(p).map((r) => [r.key, r.met]));

    expect(byKey("aaaaaaaa")).toEqual({
      length: true,
      upper: false,
      lower: true,
      number: false,
      special: false,
    });
    expect(byKey("Aaaaaaaa")).toMatchObject({ upper: true });
    expect(byKey("Aaaaaaa1")).toMatchObject({ number: true });
    expect(byKey("Aaaaaa1!")).toMatchObject({ special: true });
  });

  it("returns all rules met for a valid password", () => {
    expect(checkPasswordRules("Password1!").every((r) => r.met)).toBe(true);
  });
});

describe("validateRequired()", () => {
  it("returns error with label when value is empty", () => {
    expect(validateRequired("", "Email")).toBe("Email is required");
    expect(validateRequired("", "Password")).toBe("Password is required");
  });

  it("returns null for any non-empty value", () => {
    expect(validateRequired("not-an-email", "Email")).toBeNull();
    expect(validateRequired("x", "Password")).toBeNull();
    expect(validateRequired("user@example.com", "Email")).toBeNull();
  });
});
