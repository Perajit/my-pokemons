import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/services/user", () => ({
  claimDailyGift: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { claimDailyGift } from "@/services/user";
import { AlreadyClaimedError } from "@/services/errors";
import { claimDailyGiftAction } from "./actions";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockClaimDailyGift = claimDailyGift as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("claimDailyGiftAction()", () => {
  it("returns UNAUTHORIZED payload when session is missing", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await claimDailyGiftAction();

    expect(result).toEqual({
      ok: false,
      error: { type: "AUTH", code: "UNAUTHORIZED", message: "Unauthorized" },
    });
    expect(mockClaimDailyGift).not.toHaveBeenCalled();
  });

  it("calls claimDailyGift and returns the reward on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const reward = { type: "coins", amount: 30 };
    mockClaimDailyGift.mockResolvedValue(reward);

    const result = await claimDailyGiftAction();

    expect(mockClaimDailyGift).toHaveBeenCalledWith("user-1");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(result).toEqual({ ok: true, data: { reward } });
  });

  it("maps AlreadyClaimedError to GAMEPLAY/ALREADY_CLAIMED payload", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockClaimDailyGift.mockRejectedValue(new AlreadyClaimedError());

    const result = await claimDailyGiftAction();

    expect(result).toEqual({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "ALREADY_CLAIMED",
        message: "Daily gift already claimed",
      },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
