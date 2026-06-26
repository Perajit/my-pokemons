// @vitest-environment node

import { vi, describe, it, expect, beforeEach, afterAll } from "vitest";
import bcrypt from "bcryptjs";

// Mock signIn (HTTP call) and redirect (throws NEXT_REDIRECT).
// Avoids loading next-auth in node environment; the DB is real — that's what we test.
vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: vi.fn(),
  handlers: {},
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

// Imported after vi.mock — Vitest hoists vi.mock so these get the mocked versions.
// authorizeUser comes from auth-utils (no next-auth dependency) — loads cleanly in node.
import { registerAction } from "@/app/(auth)/register/actions";
import { authorizeUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { resetGameplayTables } from "./db-helpers";

beforeEach(async () => {
  await resetGameplayTables();
  vi.clearAllMocks();
});

afterAll(() => db.$disconnect());

// ─── registerAction ───────────────────────────────────────────────────────────

describe("registerAction()", () => {
  const makeForm = (email: string, password: string, name?: string) => {
    const f = new FormData();
    f.set("email", email);
    f.set("password", password);
    if (name) {
      f.set("name", name);
    }
    return f;
  };

  it("creates a user row with the correct email", async () => {
    await registerAction(null, makeForm("alice@example.com", "Password1!"));

    const user = await db.user.findUnique({
      where: { email: "alice@example.com" },
    });
    expect(user).not.toBeNull();
    expect(user!.email).toBe("alice@example.com");
  });

  it("stores a bcrypt hash, not the plaintext password", async () => {
    await registerAction(null, makeForm("alice@example.com", "Password1!"));

    const user = await db.user.findUnique({
      where: { email: "alice@example.com" },
    });
    expect(user!.passwordHash).not.toBe("Password1!");
    expect(await bcrypt.compare("Password1!", user!.passwordHash)).toBe(true);
  });

  it("stores the optional name when provided", async () => {
    await registerAction(
      null,
      makeForm("alice@example.com", "Password1!", "Alice"),
    );

    const user = await db.user.findUnique({
      where: { email: "alice@example.com" },
    });
    expect(user!.name).toBe("Alice");
  });

  it("returns an error for duplicate email without creating a second row", async () => {
    await registerAction(null, makeForm("alice@example.com", "Password1!"));
    const result = await registerAction(
      null,
      makeForm("alice@example.com", "Password1!"),
    );

    expect(result).toBe("Email already in use");
    expect(await db.user.count()).toBe(1);
  });

  it("returns a validation error without touching the DB", async () => {
    const result = await registerAction(
      null,
      makeForm("not-an-email", "Password1!"),
    );

    expect(result).toBe("Enter a valid email address");
    expect(await db.user.count()).toBe(0);
  });
});

// ─── authorizeUser ────────────────────────────────────────────────────────────

describe("authorizeUser()", () => {
  beforeEach(async () => {
    await db.user.create({
      data: {
        email: "alice@example.com",
        passwordHash: await bcrypt.hash("password123", 12),
      },
    });
  });

  it("returns the user object for valid credentials", async () => {
    const result = await authorizeUser({
      email: "alice@example.com",
      password: "password123",
    });

    expect(result).toMatchObject({ email: "alice@example.com" });
    expect(result).toHaveProperty("id");
  });

  it("returns null for an incorrect password", async () => {
    const result = await authorizeUser({
      email: "alice@example.com",
      password: "wrong",
    });
    expect(result).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    const result = await authorizeUser({
      email: "nobody@example.com",
      password: "password123",
    });
    expect(result).toBeNull();
  });
});
