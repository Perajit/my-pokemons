import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/services/user", () => ({ updateUserProfile: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { updateUserProfile } from "@/services/user";
import type { UserProfileDto } from "@/services/user";
import { updateProfileAction } from "./actions";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockUpdate = updateUserProfile as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateProfileAction()", () => {
  it("returns UNAUTHORIZED payload when session is missing", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateProfileAction("Ash");

    expect(result).toEqual({
      ok: false,
      error: { type: "AUTH", code: "UNAUTHORIZED", message: "Unauthorized" },
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns a VALIDATION payload and skips the update for a blank name", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await updateProfileAction("   ");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "VALIDATION",
        code: "INVALID_NAME",
        message: "Name is required",
      },
    });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("updates the profile and revalidates layout on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const updated: UserProfileDto = {
      id: "user-1",
      name: "Ash",
      email: "ash@example.com",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    mockUpdate.mockResolvedValue(updated);

    const result = await updateProfileAction("Ash");

    expect(mockUpdate).toHaveBeenCalledWith("user-1", { name: "Ash" });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(result).toEqual({ ok: true, data: { user: updated } });
  });

  it("returns SYSTEM/UNKNOWN payload for unexpected throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdate.mockRejectedValue(new Error("DB exploded"));

    const result = await updateProfileAction("Ash");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "SYSTEM",
        code: "UNKNOWN",
        message: "Something went wrong",
      },
    });
  });
});
