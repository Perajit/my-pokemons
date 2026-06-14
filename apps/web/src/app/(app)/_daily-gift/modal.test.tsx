// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import * as React from "react";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./actions", () => ({
  claimDailyGiftAction: vi.fn(),
}));

import { toast } from "sonner";
import { claimDailyGiftAction } from "./actions";
import { DailyGiftModal } from "./modal";
import type { DailyGiftStatusDto } from "@/services/user";

const mockClaim = claimDailyGiftAction as ReturnType<typeof vi.fn>;

const availableStatus: DailyGiftStatusDto = {
  availableNow: true,
  nextGiftAvailableAt: null,
};

const claimedStatus: DailyGiftStatusDto = {
  availableNow: false,
  nextGiftAvailableAt: "2026-06-15T00:00:00.000Z",
};

const noop = () => {};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DailyGiftModal — claimed state", () => {
  it("shows 'Come back tomorrow' when gift already claimed", () => {
    render(
      <DailyGiftModal
        open
        onClose={noop}
        onClaimed={noop}
        status={claimedStatus}
      />,
    );
    expect(screen.getByText(/come back tomorrow/i)).toBeInTheDocument();
  });

  it("does not render an Open Gift button when gift is claimed", () => {
    render(
      <DailyGiftModal
        open
        onClose={noop}
        onClaimed={noop}
        status={claimedStatus}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /open gift/i }),
    ).not.toBeInTheDocument();
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
      render(
        <DailyGiftModal
          open
          onClose={noop}
          onClaimed={noop}
          status={claimedStatus}
        />,
      );
      // nextGiftAvailableAt = 2026-06-15T00:00:00Z → 14h 0m from 10:00 UTC
      expect(screen.getByText(/resets in 14h 0m/i)).toBeInTheDocument();
    });

    it("shows only minutes when less than one hour remains", () => {
      vi.setSystemTime(new Date("2026-06-14T23:31:00Z")); // 29m before midnight
      render(
        <DailyGiftModal
          open
          onClose={noop}
          onClaimed={noop}
          status={claimedStatus}
        />,
      );
      // nextGiftAvailableAt = 2026-06-15T00:00:00Z → 29m remaining
      expect(screen.getByText(/resets in 29m/i)).toBeInTheDocument();
    });

    it("shows 'now' when the reset time has already passed", () => {
      vi.setSystemTime(new Date("2026-06-15T00:01:00Z")); // 1m after midnight
      render(
        <DailyGiftModal
          open
          onClose={noop}
          onClaimed={noop}
          status={claimedStatus}
        />,
      );
      // nextGiftAvailableAt = 2026-06-15T00:00:00Z → already past
      expect(screen.getByText(/resets in now/i)).toBeInTheDocument();
    });
  });
});

describe("DailyGiftModal — dismissal via overlay/keyboard", () => {
  it("calls onClose when the dialog is dismissed via Escape key", () => {
    const onClose = vi.fn();
    render(
      <DailyGiftModal
        open
        onClose={onClose}
        onClaimed={noop}
        status={claimedStatus}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});

describe("DailyGiftModal — available state (idle)", () => {
  it("renders the Open Gift button enabled", () => {
    render(
      <DailyGiftModal
        open
        onClose={noop}
        onClaimed={noop}
        status={availableStatus}
      />,
    );
    expect(
      screen.getByRole("button", { name: /open gift/i }),
    ).not.toBeDisabled();
  });
});

describe("DailyGiftModal — animation and claim flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("disables the Open Gift button immediately after clicking (shaking state)", async () => {
    mockClaim.mockResolvedValue({
      ok: true,
      data: { reward: { type: "coins", amount: 30 } },
    });
    render(
      <DailyGiftModal
        open
        onClose={noop}
        onClaimed={noop}
        status={availableStatus}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /open gift/i }));
    });

    expect(screen.getByRole("button", { name: /open gift/i })).toBeDisabled();
  });

  it("shows the coin reward and Collect button after the full animation", async () => {
    mockClaim.mockResolvedValue({
      ok: true,
      data: { reward: { type: "coins", amount: 60 } },
    });
    render(
      <DailyGiftModal
        open
        onClose={noop}
        onClaimed={noop}
        status={availableStatus}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /open gift/i }));
    });

    // Advance through shake (600ms) — commits "opening" render
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    // Advance through open (400ms) — commits "revealed" render
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByText("+60 coins")).toBeInTheDocument();
    // getAllByRole because the dialog's X button also has accessible name "Close"
    expect(
      screen.getAllByRole("button", { name: /close/i })[0],
    ).toBeInTheDocument();
  });

  it("shows the Revive reward after the full animation", async () => {
    mockClaim.mockResolvedValue({
      ok: true,
      data: { reward: { type: "item", itemKey: "REVIVE", quantity: 1 } },
    });
    render(
      <DailyGiftModal
        open
        onClose={noop}
        onClaimed={noop}
        status={availableStatus}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /open gift/i }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByText("×1 Revive")).toBeInTheDocument();
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
    render(
      <DailyGiftModal
        open
        onClose={noop}
        onClaimed={noop}
        status={availableStatus}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /open gift/i }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(toast.error).toHaveBeenCalledWith("Daily gift already claimed");
    expect(
      screen.getByRole("button", { name: /open gift/i }),
    ).not.toBeDisabled();
  });

  it("fires onClaimed when the Collect button is clicked", async () => {
    const onClaimed = vi.fn();
    mockClaim.mockResolvedValue({
      ok: true,
      data: { reward: { type: "coins", amount: 30 } },
    });
    render(
      <DailyGiftModal
        open
        onClose={noop}
        onClaimed={onClaimed}
        status={availableStatus}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /open gift/i }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    await act(async () => {
      // getAllByRole because the dialog's X button also has accessible name "Close"
      fireEvent.click(screen.getAllByRole("button", { name: /close/i })[0]);
    });

    expect(onClaimed).toHaveBeenCalledOnce();
  });
});
