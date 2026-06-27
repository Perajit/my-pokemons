// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

const mockAction = buyPokemonAction as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  mockAction.mockResolvedValue({ ok: true });
});

const card = () => screen.getByRole("button", { name: /pikachu/i });

describe("PokemonCard", () => {
  it("renders the pokemon name, price, and owned count on the face", () => {
    render(<PokemonCard pokemon={shopPokemon} userCoins={500} />);

    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText(/400/)).toBeInTheDocument();
    expect(screen.getByLabelText("You own 2")).toBeInTheDocument();
  });

  it("keeps the dialog closed until the card is activated", () => {
    render(<PokemonCard pokemon={shopPokemon} userCoins={500} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the dialog on click, flowing the pokemon and balance through", async () => {
    const user = userEvent.setup();
    render(<PokemonCard pokemon={shopPokemon} userCoins={500} />);

    await user.click(card());

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(shopPokemon.description),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText("500 coins")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /^buy$/i }),
    ).toBeInTheDocument();
  });

  it("opens the dialog when Enter is pressed on the card", async () => {
    const user = userEvent.setup();
    render(<PokemonCard pokemon={shopPokemon} userCoins={500} />);

    card().focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens the dialog when Space is pressed on the card", async () => {
    const user = userEvent.setup();
    render(<PokemonCard pokemon={shopPokemon} userCoins={500} />);

    card().focus();
    await user.keyboard(" ");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("ignores other keys on the card", async () => {
    const user = userEvent.setup();
    render(<PokemonCard pokemon={shopPokemon} userCoins={500} />);

    card().focus();
    await user.keyboard("a");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the dialog when its Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<PokemonCard pokemon={shopPokemon} userCoins={500} />);
    await user.click(card());
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the dialog after a successful buy", async () => {
    const user = userEvent.setup();
    render(<PokemonCard pokemon={shopPokemon} userCoins={500} />);
    await user.click(card());

    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^buy$/i,
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
