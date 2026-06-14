// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";

vi.mock("./modal", () => ({
  DailyGiftModal: vi.fn(({ open }: { open: boolean }) =>
    open ? <div data-testid="daily-gift-modal" /> : null,
  ),
}));

import { DailyGiftButton } from "./button";
import type { DailyGiftStatusDto } from "@/services/user";

const availableStatus: DailyGiftStatusDto = {
  availableNow: true,
  nextGiftAvailableAt: null,
};

const claimedStatus: DailyGiftStatusDto = {
  availableNow: false,
  nextGiftAvailableAt: "2026-06-15T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DailyGiftButton", () => {
  it("renders the gift icon button", () => {
    render(<DailyGiftButton status={claimedStatus} />);
    expect(
      screen.getByRole("button", { name: "Daily gift" }),
    ).toBeInTheDocument();
  });

  it("shows an amber notification dot when the gift is available", () => {
    render(<DailyGiftButton status={availableStatus} />);
    expect(screen.getByLabelText("Gift available")).toBeInTheDocument();
  });

  it("shows no dot when the gift has already been claimed today", () => {
    render(<DailyGiftButton status={claimedStatus} />);
    expect(screen.queryByLabelText("Gift available")).not.toBeInTheDocument();
  });

  it("opens the modal when the button is clicked", async () => {
    const user = userEvent.setup();
    render(<DailyGiftButton status={availableStatus} />);

    expect(screen.queryByTestId("daily-gift-modal")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Daily gift" }));
    expect(screen.getByTestId("daily-gift-modal")).toBeInTheDocument();
  });

  it("sets modal closed when onClose is called by the modal", async () => {
    const { DailyGiftModal } = await import("./modal");
    const MockModal = DailyGiftModal as ReturnType<typeof vi.fn>;

    MockModal.mockImplementation(
      ({ open, onClose }: { open: boolean; onClose: () => void }) => {
        if (!open) {
          return null;
        }
        return (
          <div data-testid="daily-gift-modal">
            <button type="button" onClick={onClose}>
              Close modal
            </button>
          </div>
        );
      },
    );

    const user = userEvent.setup();
    render(<DailyGiftButton status={availableStatus} />);

    await user.click(screen.getByRole("button", { name: "Daily gift" }));
    expect(screen.getByTestId("daily-gift-modal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close modal" }));
    expect(screen.queryByTestId("daily-gift-modal")).not.toBeInTheDocument();
  });

  it("hides the dot after onClaimed is fired (optimistic update)", async () => {
    const { DailyGiftModal } = await import("./modal");
    const MockModal = DailyGiftModal as ReturnType<typeof vi.fn>;

    // Make the mock immediately fire onClaimed when rendered with open=true
    MockModal.mockImplementation(
      ({ open, onClaimed }: { open: boolean; onClaimed: () => void }) => {
        if (open) {
          onClaimed();
          return <div data-testid="daily-gift-modal" />;
        }
        return null;
      },
    );

    const user = userEvent.setup();
    render(<DailyGiftButton status={availableStatus} />);

    await user.click(screen.getByRole("button", { name: "Daily gift" }));

    expect(screen.queryByLabelText("Gift available")).not.toBeInTheDocument();
  });
});
