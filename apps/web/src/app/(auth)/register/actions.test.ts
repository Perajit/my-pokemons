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
      makeFormData({ email: "bad-email", password: "Password1!" }),
    );
    expect(result).toBe("Enter a valid email address");
  });

  it.each([
    ["Pass1!", "at least 8 characters"],
    ["password1!", "uppercase letter"],
    ["PASSWORD1!", "lowercase letter"],
    ["Password!", "number"],
    ["Password1", "special character"],
  ])(
    "rejects password '%s' with the matching rule message",
    async (password, rule) => {
      const result = await registerAction(
        null,
        makeFormData({ email: "user@example.com", password }),
      );
      expect(result).toBe(`Password must satisfy: ${rule}`);
    },
  );

  it("returns email error when email is empty", async () => {
    const result = await registerAction(
      null,
      makeFormData({ email: "", password: "Password1!" }),
    );
    expect(result).toBe("Email is required");
  });

  it("returns password error when password is empty", async () => {
    const result = await registerAction(
      null,
      makeFormData({ email: "user@example.com", password: "" }),
    );
    expect(result).toBe("Password is required");
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
      makeFormData({ email: "user@example.com", password: "Password1!" }),
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
        password: "Password1!",
      }),
    );

    expect(bcrypt.hash).toHaveBeenCalledWith("Password1!", 12);
    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: "Alice",
        email: "alice@example.com",
        passwordHash: "hashed_password",
      },
    });
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "alice@example.com",
      password: "Password1!",
      redirectTo: "/",
    });
  });

  it("treats missing email and password form fields as empty strings", async () => {
    // FormData with no email/password keys at all — exercises the ?? "" fallbacks
    const result = await registerAction(null, new FormData());
    // Empty email triggers the email-validation error path, which is what we expect
    expect(typeof result).toBe("string");
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("omits name when not provided", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({} as never);
    vi.mocked(signIn).mockResolvedValue(undefined);

    await registerAction(
      null,
      makeFormData({ email: "alice@example.com", password: "Password1!" }),
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
