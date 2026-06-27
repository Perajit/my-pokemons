// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
import { PokemonCardDialog } from "./pokemon-card-dialog";
import { shopPokemon } from "./__test-helpers";

const mockAction = buyPokemonAction as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  mockAction.mockResolvedValue({ ok: true });
});

function renderDialog(userCoins = 500, open = true) {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <PokemonCardDialog
      pokemon={shopPokemon}
      userCoins={userCoins}
      open={open}
      onClose={onClose}
    />,
  );
  return { user, onClose };
}

describe("PokemonCardDialog", () => {
  it("renders the name, description, and feed/play/decay stats", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText("Pikachu")).toBeInTheDocument();
    expect(
      within(dialog).getByText(shopPokemon.description),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("+15 fullness")).toBeInTheDocument();
    expect(within(dialog).getByText("+3 coins")).toBeInTheDocument();
    expect(within(dialog).getByText("+28 mood")).toBeInTheDocument();
    expect(within(dialog).getByText("+5 coins")).toBeInTheDocument();
    expect(within(dialog).getByText("−3/hr")).toBeInTheDocument();
    expect(within(dialog).getByText("−6/hr")).toBeInTheDocument();
  });

  it("renders the price and the user's balance", () => {
    renderDialog(500);
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByLabelText("400 coins")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("500 coins")).toBeInTheDocument();
  });

  it("renders no dialog when closed", () => {
    renderDialog(500, false);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("buys on confirm: calls the action, closes, and toasts", async () => {
    const { user, onClose } = renderDialog();
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /^buy$/i }));

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledWith("pika-id");
      expect(onClose).toHaveBeenCalled();
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Pikachu added to your collection!",
      );
    });
  });

  it("shows the error and stays open when the action returns an error", async () => {
    mockAction.mockResolvedValue({
      ok: false,
      error: {
        type: "SHOP",
        code: "INSUFFICIENT_COINS",
        message: "Insufficient coins",
      },
    });
    const { user, onClose } = renderDialog();
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /^buy$/i }));

    await waitFor(() =>
      expect(within(dialog).getByRole("alert")).toHaveTextContent(
        "Insufficient coins",
      ),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("shows a generic error when the action throws unexpectedly", async () => {
    mockAction.mockRejectedValue(new Error("unexpected"));
    const { user } = renderDialog();
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /^buy$/i }));

    await waitFor(() =>
      expect(within(dialog).getByRole("alert")).toHaveTextContent(
        /something went wrong/i,
      ),
    );
  });

  it("disables Buy and shows the hint when balance is below price", () => {
    renderDialog(100);
    const dialog = screen.getByRole("dialog");

    expect(
      within(dialog).getByRole("button", { name: /^buy$/i }),
    ).toBeDisabled();
    expect(within(dialog).getByText(/not enough coins/i)).toBeInTheDocument();
  });

  it("disables both buttons and shows loading text while buying", async () => {
    let resolveAction!: (value: { ok: boolean }) => void;
    mockAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const { user } = renderDialog();
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /^buy$/i }));

    await waitFor(() => {
      expect(
        within(dialog).getByRole("button", { name: /buying/i }),
      ).toBeDisabled();
      expect(
        within(dialog).getByRole("button", { name: /cancel/i }),
      ).toBeDisabled();
    });

    resolveAction({ ok: true });
  });

  it("calls onClose when Cancel is clicked", async () => {
    const { user, onClose } = renderDialog();
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("closes when the dialog's X button requests it", async () => {
    const { user, onClose } = renderDialog();
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("ignores a dialog close request while a buy is in flight", async () => {
    let resolveAction!: (value: { ok: boolean }) => void;
    mockAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const { user, onClose } = renderDialog();
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^buy$/i }));
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: /buying/i }),
      ).toBeDisabled(),
    );

    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(onClose).not.toHaveBeenCalled();
    resolveAction({ ok: true });
  });

  it("clears a shown error when closing via Cancel", async () => {
    mockAction.mockResolvedValue({
      ok: false,
      error: { type: "SHOP", code: "INSUFFICIENT_COINS", message: "Nope" },
    });
    const { user, onClose } = renderDialog();
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^buy$/i }));
    await waitFor(() =>
      expect(within(dialog).getByRole("alert")).toBeInTheDocument(),
    );

    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
