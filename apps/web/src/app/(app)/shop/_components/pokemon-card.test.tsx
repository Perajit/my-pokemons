// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

// Only system boundaries are mocked. The real PokemonCardDialog is rendered so
// these tests verify the actual integration — that the card opens/closes the
// live dialog and flows the right props into it. The dialog's own buy/error/
// loading logic is covered in pokemon-card-dialog.test.tsx.
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("../actions", () => ({ buyPokemonAction: vi.fn() }));

import { buyPokemonAction } from "../actions";
import { PokemonCard } from "./pokemon-card";
import { shopPokemon } from "./__test-helpers";
import { setup } from "@/test/render";

const mockAction = buyPokemonAction as Mock;

// Stale-safe query helpers (re-query on each call).
const getCard = () => screen.getByRole("button", { name: /pikachu/i });
const getDialog = () => screen.getByRole("dialog");
const queryDialog = () => screen.queryByRole("dialog");
const getBuyButton = () =>
  within(getDialog()).getByRole("button", { name: /^buy$/i });
const getCancelButton = () =>
  within(getDialog()).getByRole("button", { name: /cancel/i });

beforeEach(() => {
  vi.clearAllMocks();
  mockAction.mockResolvedValue({ ok: true });
});

describe("PokemonCard", () => {
  it("renders the pokemon name, price, and owned count on the face", () => {
    setup(<PokemonCard pokemon={shopPokemon} userCoins={500} />);

    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText(/400/)).toBeInTheDocument();
    expect(screen.getByLabelText("You own 2")).toBeInTheDocument();
  });

  it("keeps the dialog closed until the card is activated", () => {
    setup(<PokemonCard pokemon={shopPokemon} userCoins={500} />);

    expect(queryDialog()).not.toBeInTheDocument();
  });

  it("opens the dialog on click, flowing the pokemon and balance through", async () => {
    const { user } = setup(
      <PokemonCard pokemon={shopPokemon} userCoins={500} />,
    );

    await user.click(getCard());

    expect(
      within(getDialog()).getByText(shopPokemon.description),
    ).toBeInTheDocument();
    expect(within(getDialog()).getByLabelText("500 coins")).toBeInTheDocument();
    expect(getBuyButton()).toBeInTheDocument();
  });

  it("opens the dialog when Enter is pressed on the card", async () => {
    const { user } = setup(
      <PokemonCard pokemon={shopPokemon} userCoins={500} />,
    );

    getCard().focus();
    await user.keyboard("{Enter}");

    expect(getDialog()).toBeInTheDocument();
  });

  it("opens the dialog when Space is pressed on the card", async () => {
    const { user } = setup(
      <PokemonCard pokemon={shopPokemon} userCoins={500} />,
    );

    getCard().focus();
    await user.keyboard(" ");

    expect(getDialog()).toBeInTheDocument();
  });

  it("ignores other keys on the card", async () => {
    const { user } = setup(
      <PokemonCard pokemon={shopPokemon} userCoins={500} />,
    );

    getCard().focus();
    await user.keyboard("a");

    expect(queryDialog()).not.toBeInTheDocument();
  });

  it("closes the dialog when its Cancel button is clicked", async () => {
    const { user } = setup(
      <PokemonCard pokemon={shopPokemon} userCoins={500} />,
    );
    await user.click(getCard());
    expect(getDialog()).toBeInTheDocument();

    await user.click(getCancelButton());

    expect(queryDialog()).not.toBeInTheDocument();
  });

  it("closes the dialog after a successful buy", async () => {
    const { user } = setup(
      <PokemonCard pokemon={shopPokemon} userCoins={500} />,
    );
    await user.click(getCard());

    await user.click(getBuyButton());

    await waitFor(() => expect(queryDialog()).not.toBeInTheDocument());
  });
});
