import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
}));

vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = "AuthError";
    }
  },
}));

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { loginAction } from "./actions";

function makeFormData(data: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    fd.append(k, v);
  }
  return fd;
}

describe("loginAction()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error message when credentials are invalid", async () => {
    vi.mocked(signIn).mockRejectedValue(new AuthError("CredentialsSignin"));

    const result = await loginAction(
      null,
      makeFormData({ email: "user@example.com", password: "wrongpass" }),
    );

    expect(result).toBe("Invalid email or password");
  });

  it("re-throws non-AuthError errors (e.g. NEXT_REDIRECT)", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    vi.mocked(signIn).mockRejectedValue(redirectError);

    await expect(
      loginAction(
        null,
        makeFormData({ email: "user@example.com", password: "password123" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
  });

  it("calls signIn with credentials from form data", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined);

    await loginAction(
      null,
      makeFormData({ email: "user@example.com", password: "password123" }),
    );

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "password123",
      redirectTo: "/collection",
    });
  });

  it("returns null when signIn resolves without redirect", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined);

    const result = await loginAction(
      null,
      makeFormData({ email: "user@example.com", password: "password123" }),
    );

    expect(result).toBeNull();
  });
});
