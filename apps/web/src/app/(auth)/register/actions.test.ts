import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}));

vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
}));

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { registerAction } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    fd.append(k, v);
  }
  return fd;
}

describe("registerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation error for invalid email", async () => {
    const result = await registerAction(
      null,
      makeFormData({ email: "bad-email", password: "password123" }),
    );
    expect(result).toBe("Invalid email address");
  });

  it("returns validation error for short password", async () => {
    const result = await registerAction(
      null,
      makeFormData({ email: "user@example.com", password: "short" }),
    );
    expect(result).toBe("Password must be at least 8 characters");
  });

  it("returns error for missing fields", async () => {
    const result = await registerAction(
      null,
      makeFormData({ email: "", password: "" }),
    );
    expect(result).toBe("Email and password required");
  });

  it("returns error when email already in use", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "1",
      email: "user@example.com",
      passwordHash: "hash",
      name: null,
      coins: 0,
      createdAt: new Date(),
    } as never);

    const result = await registerAction(
      null,
      makeFormData({ email: "user@example.com", password: "password123" }),
    );

    expect(result).toBe("Email already in use");
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("hashes password and creates user on success", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({} as never);
    vi.mocked(signIn).mockResolvedValue(undefined);

    await registerAction(
      null,
      makeFormData({
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
      }),
    );

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: "Alice",
        email: "alice@example.com",
        passwordHash: "hashed_password",
      },
    });
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "alice@example.com",
      password: "password123",
      redirectTo: "/",
    });
  });

  it("omits name when not provided", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({} as never);
    vi.mocked(signIn).mockResolvedValue(undefined);

    await registerAction(
      null,
      makeFormData({ email: "alice@example.com", password: "password123" }),
    );

    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: undefined,
        email: "alice@example.com",
        passwordHash: "hashed_password",
      },
    });
  });
});
