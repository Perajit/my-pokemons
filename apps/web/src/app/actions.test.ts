import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "./actions";

describe("logoutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears the session without letting next-auth redirect", async () => {
    await logoutAction();

    expect(signOut).toHaveBeenCalledWith({ redirect: false });
  });

  it("redirects to /login after signing out", async () => {
    await logoutAction();

    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
