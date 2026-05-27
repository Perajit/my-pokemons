// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const toastSuccessMock = vi.fn();

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: (msg: string) => toastSuccessMock(msg) },
}));

vi.mock("../actions", () => ({ buyPokemonAction: vi.fn() }));

import { buyPokemonAction } from "../actions";
import { ShopCard } from "./shop-card";

const mockAction = buyPokemonAction as Mock;

const pikachu = {
  id: "pika-id",
  name: "Pikachu",
  pokeApiId: 25,
  description: "It keeps its tail raised.",
  price: 400,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAction.mockResolvedValue({ ok: true });
});

function openDialog() {
  fireEvent.click(screen.getByText("Pikachu"));
}

function openDialogByKeyboard(key: string) {
  fireEvent.keyDown(screen.getByText("Pikachu"), { key });
}

describe("ShopCard", () => {
  it("renders pokemon name and price on the card", () => {
    render(<ShopCard pokemon={pikachu} userCoins={500} />);

    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText(/400/)).toBeInTheDocument();
  });

  it("opens dialog with description and balance when clicked", () => {
    render(<ShopCard pokemon={pikachu} userCoins={500} />);
    openDialog();

    expect(screen.getByText("It keeps its tail raised.")).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^buy$/i })).toBeInTheDocument();
  });

  it("calls action, closes dialog, and shows toast on success", async () => {
    render(<ShopCard pokemon={pikachu} userCoins={500} />);
    openDialog();
    fireEvent.click(screen.getByRole("button", { name: /^buy$/i }));

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledWith("pika-id");
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Pikachu added to your collection!",
      );
    });
    expect(
      screen.queryByText("It keeps its tail raised."),
    ).not.toBeInTheDocument();
  });

  it("shows error message when action returns an error", async () => {
    mockAction.mockResolvedValue({
      ok: false,
      error: {
        type: "SHOP",
        code: "INSUFFICIENT_COINS",
        message: "Insufficient coins",
      },
    });
    render(<ShopCard pokemon={pikachu} userCoins={500} />);
    openDialog();
    fireEvent.click(screen.getByRole("button", { name: /^buy$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Insufficient coins");
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("shows generic error when action throws unexpectedly", async () => {
    mockAction.mockRejectedValue(new Error("unexpected"));
    render(<ShopCard pokemon={pikachu} userCoins={500} />);
    openDialog();
    fireEvent.click(screen.getByRole("button", { name: /^buy$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /something went wrong/i,
      );
    });
  });

  it("opens dialog when Enter is pressed on the card", () => {
    render(<ShopCard pokemon={pikachu} userCoins={500} />);
    openDialogByKeyboard("Enter");

    expect(screen.getByText("It keeps its tail raised.")).toBeInTheDocument();
  });

  it("opens dialog when Space is pressed on the card", () => {
    render(<ShopCard pokemon={pikachu} userCoins={500} />);
    openDialogByKeyboard(" ");

    expect(screen.getByText("It keeps its tail raised.")).toBeInTheDocument();
  });

  it("ignores other keys on the card", () => {
    render(<ShopCard pokemon={pikachu} userCoins={500} />);
    openDialogByKeyboard("a");

    expect(
      screen.queryByText("It keeps its tail raised."),
    ).not.toBeInTheDocument();
  });

  it("closes dialog and clears state when Cancel is clicked", () => {
    render(<ShopCard pokemon={pikachu} userCoins={500} />);
    openDialog();

    expect(screen.getByText("It keeps its tail raised.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(
      screen.queryByText("It keeps its tail raised."),
    ).not.toBeInTheDocument();
  });

  it("disables Buy and shows 'Not enough coins' hint when balance < price", () => {
    render(<ShopCard pokemon={pikachu} userCoins={100} />);
    openDialog();

    expect(screen.getByRole("button", { name: /^buy$/i })).toBeDisabled();
    expect(screen.getByText(/not enough coins/i)).toBeInTheDocument();
  });

  it("disables buttons and shows loading text while action is in flight", async () => {
    let resolveAction!: (value: { ok: boolean }) => void;
    mockAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    render(<ShopCard pokemon={pikachu} userCoins={500} />);
    openDialog();
    fireEvent.click(screen.getByRole("button", { name: /^buy$/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /buying/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    });

    resolveAction({ ok: true });
  });
});
