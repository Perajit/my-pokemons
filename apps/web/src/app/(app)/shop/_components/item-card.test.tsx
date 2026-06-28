// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";

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
import { setup } from "@/test/render";

const mockAction = buyItemAction as Mock;

const revive: ShopItemDto = {
  id: "item-1",
  key: "REVIVE",
  name: "Revive",
  description: "Wake a fainted Pokémon and restore it to 50% HP.",
  price: 150,
  userOwnedCount: 2,
};

// Stale-safe query helpers (re-query on each call).
const getBuyButton = () => screen.getByRole("button", { name: /^buy$/i });
const getInfoButton = () =>
  screen.getByRole("button", { name: /about revive/i });

beforeEach(() => {
  vi.clearAllMocks();
  mockAction.mockResolvedValue({ ok: true });
});

describe("ItemCard", () => {
  it("renders name, price, and owned count (description is hidden until the info icon)", () => {
    setup(<ItemCard item={revive} userCoins={500} />);

    expect(screen.getByText("Revive")).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByLabelText("You own 2")).toBeInTheDocument();
    expect(
      screen.queryByText(/wake a fainted pokémon/i),
    ).not.toBeInTheDocument();
  });

  it("reveals the description in a popup when the info icon is clicked", async () => {
    const { user } = setup(<ItemCard item={revive} userCoins={500} />);

    await user.click(getInfoButton());

    expect(screen.getByText(/wake a fainted pokémon/i)).toBeInTheDocument();
  });

  it("buys the item and shows a success toast", async () => {
    const { user } = setup(<ItemCard item={revive} userCoins={500} />);

    await user.click(getBuyButton());

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
    const { user } = setup(<ItemCard item={revive} userCoins={500} />);

    await user.click(getBuyButton());

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Insufficient coins");
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("disables Buy and shows a hint when the balance is too low", () => {
    setup(<ItemCard item={revive} userCoins={100} />);

    expect(getBuyButton()).toBeDisabled();
    expect(screen.getByText(/not enough coins/i)).toBeInTheDocument();
  });
});
