import { describe, it, expect } from "vitest";
import { validateRegisterInput } from "./validation";

describe("validateRegisterInput", () => {
  describe("missing fields", () => {
    it("rejects empty email", () => {
      expect(validateRegisterInput("", "password123")).toBe(
        "Email and password required",
      );
    });

    it("rejects empty password", () => {
      expect(validateRegisterInput("user@example.com", "")).toBe(
        "Email and password required",
      );
    });

    it("rejects both empty", () => {
      expect(validateRegisterInput("", "")).toBe("Email and password required");
    });
  });

  describe("invalid email", () => {
    it.each([
      ["notanemail", "no @ symbol"],
      ["@example.com", "missing local part"],
      ["user@", "missing domain"],
      ["user@nodot", "no dot in domain"],
      ["user name@example.com", "space in local part"],
      ["user@@example.com", "double @"],
    ])("rejects '%s' (%s)", (email) => {
      expect(validateRegisterInput(email, "password123")).toBe(
        "Invalid email address",
      );
    });
  });

  describe("valid email formats", () => {
    it.each([
      ["user@example.com", "basic"],
      ["user+tag@sub.domain.com", "subdomain + plus addressing"],
      ["a@b.co", "short TLD"],
    ])("accepts '%s' (%s)", (email) => {
      expect(validateRegisterInput(email, "password123")).toBeNull();
    });
  });

  describe("invalid password", () => {
    it("rejects password shorter than 8 chars", () => {
      expect(validateRegisterInput("user@example.com", "short")).toBe(
        "Password must be at least 8 characters",
      );
    });

    it("rejects password of exactly 7 chars", () => {
      expect(validateRegisterInput("user@example.com", "1234567")).toBe(
        "Password must be at least 8 characters",
      );
    });

    it("accepts password of exactly 8 chars", () => {
      expect(validateRegisterInput("user@example.com", "12345678")).toBeNull();
    });
  });
});
