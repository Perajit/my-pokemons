// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import { setup } from "@/test/render";

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

// Stale-safe query helpers: each re-queries on call; dialog-scoped ones resolve
// the dialog afresh so a re-render can't leave a detached reference.
const getDialog = () => screen.getByRole("dialog");
const queryDialog = () => screen.queryByRole("dialog");
const getBuyButton = () =>
  within(getDialog()).getByRole("button", { name: /^buy$/i });
const getBuyingButton = () =>
  within(getDialog()).getByRole("button", { name: /buying/i });
const getCancelButton = () =>
  within(getDialog()).getByRole("button", { name: /cancel/i });
const getCloseButton = () =>
  within(getDialog()).getByRole("button", { name: "Close" });
const getAlert = () => within(getDialog()).getByRole("alert");

function setupComponent({ userCoins = 500, open = true } = {}) {
  const onClose = vi.fn();
  // user + render result come from setup — never a raw render()
  return {
    onClose,
    ...setup(
      <PokemonCardDialog
        pokemon={shopPokemon}
        userCoins={userCoins}
        open={open}
        onClose={onClose}
      />,
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAction.mockResolvedValue({ ok: true });
});

describe("PokemonCardDialog", () => {
  it("renders the name, description, and feed/play/decay stats", () => {
    setupComponent();

    expect(within(getDialog()).getByText("Pikachu")).toBeInTheDocument();
    expect(
      within(getDialog()).getByText(shopPokemon.description),
    ).toBeInTheDocument();
    expect(within(getDialog()).getByText("+15 fullness")).toBeInTheDocument();
    expect(within(getDialog()).getByText("+3 coins")).toBeInTheDocument();
    expect(within(getDialog()).getByText("+28 mood")).toBeInTheDocument();
    expect(within(getDialog()).getByText("+5 coins")).toBeInTheDocument();
    expect(within(getDialog()).getByText("−3/hr")).toBeInTheDocument();
    expect(within(getDialog()).getByText("−6/hr")).toBeInTheDocument();
  });

  it("renders the price and the user's balance", () => {
    setupComponent({ userCoins: 500 });

    expect(within(getDialog()).getByLabelText("400 coins")).toBeInTheDocument();
    expect(within(getDialog()).getByLabelText("500 coins")).toBeInTheDocument();
  });

  it("renders no dialog when closed", () => {
    setupComponent({ open: false });

    expect(queryDialog()).not.toBeInTheDocument();
  });

  it("buys on confirm: calls the action, closes, and toasts", async () => {
    const { user, onClose } = setupComponent();

    await user.click(getBuyButton());

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
    const { user, onClose } = setupComponent();

    await user.click(getBuyButton());

    await waitFor(() =>
      expect(getAlert()).toHaveTextContent("Insufficient coins"),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it("shows a generic error when the action throws unexpectedly", async () => {
    mockAction.mockRejectedValue(new Error("unexpected"));
    const { user } = setupComponent();

    await user.click(getBuyButton());

    await waitFor(() =>
      expect(getAlert()).toHaveTextContent(/something went wrong/i),
    );
  });

  it("disables Buy and shows the hint when balance is below price", () => {
    setupComponent({ userCoins: 100 });

    expect(getBuyButton()).toBeDisabled();
    expect(
      within(getDialog()).getByText(/not enough coins/i),
    ).toBeInTheDocument();
  });

  it("disables both buttons and shows loading text while buying", async () => {
    let resolveAction!: (value: { ok: boolean }) => void;
    mockAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const { user } = setupComponent();

    await user.click(getBuyButton());

    await waitFor(() => {
      expect(getBuyingButton()).toBeDisabled();
      expect(getCancelButton()).toBeDisabled();
    });

    resolveAction({ ok: true });
  });

  it("calls onClose when Cancel is clicked", async () => {
    const { user, onClose } = setupComponent();

    await user.click(getCancelButton());

    expect(onClose).toHaveBeenCalled();
  });

  it("closes when the dialog's X button requests it", async () => {
    const { user, onClose } = setupComponent();

    await user.click(getCloseButton());

    expect(onClose).toHaveBeenCalled();
  });

  it("ignores a dialog close request while a buy is in flight", async () => {
    let resolveAction!: (value: { ok: boolean }) => void;
    mockAction.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const { user, onClose } = setupComponent();
    await user.click(getBuyButton());
    await waitFor(() => expect(getBuyingButton()).toBeDisabled());

    await user.click(getCloseButton());

    expect(onClose).not.toHaveBeenCalled();
    resolveAction({ ok: true });
  });

  it("clears a shown error when closing via Cancel", async () => {
    mockAction.mockResolvedValue({
      ok: false,
      error: { type: "SHOP", code: "INSUFFICIENT_COINS", message: "Nope" },
    });
    const { user, onClose } = setupComponent();
    await user.click(getBuyButton());
    await waitFor(() => expect(getAlert()).toBeInTheDocument());

    await user.click(getCancelButton());

    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
