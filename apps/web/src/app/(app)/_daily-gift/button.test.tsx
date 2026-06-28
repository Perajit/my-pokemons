// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, within } from "@testing-library/react";

// Only system boundaries are mocked. The real DailyGiftModal is rendered so
// these tests verify the actual integration — opening it, dismissing it, and
// the optimistic dot update driven by the modal's onClaimed. The modal's own
// animation/claim internals are covered in modal.test.tsx.
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./actions", () => ({ claimDailyGiftAction: vi.fn() }));

import { claimDailyGiftAction } from "./actions";
import { DailyGiftButton } from "./button";
import { giftAnimation } from "./animation";
import type { DailyGiftStatusDto } from "@/services/user";
import { setup } from "@/test/render";

const ANIM_DEFAULTS = { ...giftAnimation };

const mockClaim = claimDailyGiftAction as ReturnType<typeof vi.fn>;

const availableStatus: DailyGiftStatusDto = {
  availableNow: true,
  nextGiftAvailableAt: null,
};

const claimedStatus: DailyGiftStatusDto = {
  availableNow: false,
  nextGiftAvailableAt: "2026-06-15T00:00:00.000Z",
};

// Stale-safe query helpers (re-query on each call).
const getGiftButton = () => screen.getByRole("button", { name: "Daily gift" });
const getGiftDot = () => screen.getByLabelText("Gift available");
const queryGiftDot = () => screen.queryByLabelText("Gift available");
const getDialog = () => screen.getByRole("dialog");
const queryDialog = () => screen.queryByRole("dialog");
const getOpenGiftButton = () =>
  within(getDialog()).getByRole("button", { name: /open gift/i });
const getCloseButton = () =>
  within(getDialog()).getByRole("button", { name: "Close" });
// During the revealed state the dialog has both a Collect and an X button, each
// named "Close"; the in-content Collect button comes first.
const getCollectButton = () =>
  within(getDialog()).getAllByRole("button", { name: /close/i })[0];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DailyGiftButton", () => {
  it("renders the gift icon button", () => {
    setup(<DailyGiftButton status={claimedStatus} />);
    expect(getGiftButton()).toBeInTheDocument();
  });

  it("shows an amber notification dot when the gift is available", () => {
    setup(<DailyGiftButton status={availableStatus} />);
    expect(getGiftDot()).toBeInTheDocument();
  });

  it("shows no dot when the gift has already been claimed today", () => {
    setup(<DailyGiftButton status={claimedStatus} />);
    expect(queryGiftDot()).not.toBeInTheDocument();
  });

  it("opens the modal when the button is clicked", async () => {
    const { user } = setup(<DailyGiftButton status={availableStatus} />);

    expect(queryDialog()).not.toBeInTheDocument();
    await user.click(getGiftButton());

    expect(getDialog()).toBeInTheDocument();
  });

  it("closes the modal when it is dismissed", async () => {
    const { user } = setup(<DailyGiftButton status={availableStatus} />);
    await user.click(getGiftButton());

    await user.click(getCloseButton());

    expect(queryDialog()).not.toBeInTheDocument();
  });

  // Real timers + userEvent. The reveal is setTimeout-driven (not CSS), so the
  // durations are zeroed so it settles in ~0ms instead of waiting ~1.4s.
  describe("claim flow", () => {
    beforeEach(() => {
      giftAnimation.shakeMs = 0;
      giftAnimation.openMs = 0;
    });
    afterEach(() => {
      giftAnimation.shakeMs = ANIM_DEFAULTS.shakeMs;
      giftAnimation.openMs = ANIM_DEFAULTS.openMs;
    });

    it("hides the dot once the revealed gift is collected", async () => {
      mockClaim.mockResolvedValue({
        ok: true,
        data: { reward: { type: "coins", amount: 30 } },
      });
      const { user } = setup(<DailyGiftButton status={availableStatus} />);
      expect(getGiftDot()).toBeInTheDocument();

      await user.click(getGiftButton());
      await user.click(getOpenGiftButton());
      // The reward appears once the (zeroed) open animation settles.
      await within(getDialog()).findByText("+30 coins");
      await user.click(getCollectButton());

      expect(queryGiftDot()).not.toBeInTheDocument();
    });
  });
});
