// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (msg: string) => toastSuccessMock(msg),
    error: (msg: string) => toastErrorMock(msg),
  },
}));

vi.mock("../actions", () => ({ buyItemAction: vi.fn() }));

import { buyItemAction } from "../actions";
import { ItemCard } from "./item-card";
import type { ShopItemDto } from "@/services/shop";

const mockAction = buyItemAction as Mock;

const revive: ShopItemDto = {
  id: "item-1",
  key: "REVIVE",
  name: "Revive",
  description: "Wake a fainted Pokémon and restore it to 50% HP.",
  price: 150,
  userOwnedCount: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAction.mockResolvedValue({ ok: true });
});

describe("ItemCard", () => {
  it("renders name, price, and owned count (description is hidden until the info icon)", () => {
    render(<ItemCard item={revive} userCoins={500} />);

    expect(screen.getByText("Revive")).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByLabelText("You own 2")).toBeInTheDocument();
    expect(
      screen.queryByText(/wake a fainted pokémon/i),
    ).not.toBeInTheDocument();
  });

  it("reveals the description in a popup when the info icon is clicked", async () => {
    render(<ItemCard item={revive} userCoins={500} />);

    fireEvent.click(screen.getByRole("button", { name: /about revive/i }));

    await waitFor(() => {
      expect(screen.getByText(/wake a fainted pokémon/i)).toBeInTheDocument();
    });
  });

  it("buys the item and shows a success toast", async () => {
    render(<ItemCard item={revive} userCoins={500} />);
    fireEvent.click(screen.getByRole("button", { name: /^buy$/i }));

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledWith("REVIVE");
      expect(toastSuccessMock).toHaveBeenCalledWith("Bought Revive!");
    });
  });

  it("shows an error toast when the action fails", async () => {
    mockAction.mockResolvedValue({
      ok: false,
      error: {
        type: "SHOP",
        code: "INSUFFICIENT_COINS",
        message: "Insufficient coins",
      },
    });
    render(<ItemCard item={revive} userCoins={500} />);
    fireEvent.click(screen.getByRole("button", { name: /^buy$/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Insufficient coins");
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("disables Buy and shows a hint when the balance is too low", () => {
    render(<ItemCard item={revive} userCoins={100} />);

    expect(screen.getByRole("button", { name: /^buy$/i })).toBeDisabled();
    expect(screen.getByText(/not enough coins/i)).toBeInTheDocument();
  });
});
