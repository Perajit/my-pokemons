// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import { setup } from "@/test/render";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./actions", () => ({
  claimDailyGiftAction: vi.fn(),
}));

import { toast } from "sonner";
import { claimDailyGiftAction } from "./actions";
import { DailyGiftModal } from "./modal";
import { giftAnimation } from "./animation";
import type { DailyGiftStatusDto } from "@/services/user";

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

// Stale-safe query helpers (re-query on each call), scoped to the dialog portal.
const getDialog = () => screen.getByRole("dialog");
const getOpenGiftButton = () =>
  within(getDialog()).getByRole("button", { name: /open gift/i });
const queryOpenGiftButton = () =>
  within(getDialog()).queryByRole("button", { name: /open gift/i });
// The revealed state has both a Collect and an X button, each named "Close";
// the in-content Collect button comes first.
const getCollectButton = () =>
  within(getDialog()).getAllByRole("button", { name: /close/i })[0];

function setupComponent({
  status,
  onClose = vi.fn(),
  onClaimed = vi.fn(),
}: {
  status: DailyGiftStatusDto;
  onClose?: () => void;
  onClaimed?: () => void;
}) {
  // user + render result come from setup — never a raw render()
  return {
    onClose,
    onClaimed,
    ...setup(
      <DailyGiftModal
        open
        onClose={onClose}
        onClaimed={onClaimed}
        status={status}
      />,
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DailyGiftModal — claimed state", () => {
  it("shows 'Come back tomorrow' when gift already claimed", () => {
    setupComponent({ status: claimedStatus });
    expect(
      within(getDialog()).getByText(/come back tomorrow/i),
    ).toBeInTheDocument();
  });

  it("does not render an Open Gift button when gift is claimed", () => {
    setupComponent({ status: claimedStatus });
    expect(queryOpenGiftButton()).not.toBeInTheDocument();
  });

  describe("countdown", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-14T10:00:00Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows hours and minutes until the next reset", () => {
      setupComponent({ status: claimedStatus });
      // nextGiftAvailableAt = 2026-06-15T00:00:00Z → 14h 0m from 10:00 UTC
      expect(
        within(getDialog()).getByText(/resets in 14h 0m/i),
      ).toBeInTheDocument();
    });

    it("shows only minutes when less than one hour remains", () => {
      vi.setSystemTime(new Date("2026-06-14T23:31:00Z")); // 29m before midnight
      setupComponent({ status: claimedStatus });
      expect(
        within(getDialog()).getByText(/resets in 29m/i),
      ).toBeInTheDocument();
    });

    it("shows 'now' when the reset time has already passed", () => {
      vi.setSystemTime(new Date("2026-06-15T00:01:00Z")); // 1m after midnight
      setupComponent({ status: claimedStatus });
      expect(
        within(getDialog()).getByText(/resets in now/i),
      ).toBeInTheDocument();
    });
  });
});

describe("DailyGiftModal — dismissal via keyboard", () => {
  it("calls onClose when the dialog is dismissed via Escape", async () => {
    const { user, onClose } = setupComponent({ status: claimedStatus });

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });
});

describe("DailyGiftModal — available state (idle)", () => {
  it("renders the Open Gift button enabled", () => {
    setupComponent({ status: availableStatus });
    expect(getOpenGiftButton()).not.toBeDisabled();
  });
});

// Real timers + userEvent. The reveal is setTimeout-driven (not CSS), so the
// durations are zeroed here to settle in ~0ms instead of waiting ~1.4s.
describe("DailyGiftModal — animation and claim flow", () => {
  beforeEach(() => {
    giftAnimation.shakeMs = 0;
    giftAnimation.openMs = 0;
  });
  afterEach(() => {
    giftAnimation.shakeMs = ANIM_DEFAULTS.shakeMs;
    giftAnimation.openMs = ANIM_DEFAULTS.openMs;
  });

  it("disables the Open Gift button immediately after clicking (shaking state)", async () => {
    // Hold the shaking window open so the transient disabled state is assertable.
    giftAnimation.shakeMs = 10_000;
    mockClaim.mockResolvedValue({
      ok: true,
      data: { reward: { type: "coins", amount: 30 } },
    });
    const { user } = setupComponent({ status: availableStatus });

    await user.click(getOpenGiftButton());

    expect(getOpenGiftButton()).toBeDisabled();
  });

  it("shows the coin reward and Collect button after the full animation", async () => {
    mockClaim.mockResolvedValue({
      ok: true,
      data: { reward: { type: "coins", amount: 60 } },
    });
    const { user } = setupComponent({ status: availableStatus });

    await user.click(getOpenGiftButton());

    expect(
      await within(getDialog()).findByText("+60 coins"),
    ).toBeInTheDocument();
    expect(getCollectButton()).toBeInTheDocument();
  });

  it("shows the Revive reward after the full animation", async () => {
    mockClaim.mockResolvedValue({
      ok: true,
      data: { reward: { type: "item", itemKey: "REVIVE", quantity: 1 } },
    });
    const { user } = setupComponent({ status: availableStatus });

    await user.click(getOpenGiftButton());

    expect(
      await within(getDialog()).findByText("×1 Revive"),
    ).toBeInTheDocument();
  });

  it("shows a toast error and resets to idle when the action fails", async () => {
    mockClaim.mockResolvedValue({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "ALREADY_CLAIMED",
        message: "Daily gift already claimed",
      },
    });
    const { user } = setupComponent({ status: availableStatus });

    await user.click(getOpenGiftButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Daily gift already claimed"),
    );
    expect(getOpenGiftButton()).not.toBeDisabled();
  });

  it("fires onClaimed when the Collect button is clicked", async () => {
    mockClaim.mockResolvedValue({
      ok: true,
      data: { reward: { type: "coins", amount: 30 } },
    });
    const { user, onClaimed } = setupComponent({ status: availableStatus });

    await user.click(getOpenGiftButton());
    await within(getDialog()).findByText("+30 coins");
    await user.click(getCollectButton());

    expect(onClaimed).toHaveBeenCalledOnce();
  });
});
