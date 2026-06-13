// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock useSWR to return the fallbackData (initial prop) without fetching.
vi.mock("swr", () => ({
  default: (
    _key: string,
    _fetcher: unknown,
    options: { fallbackData: unknown },
  ) => ({ data: options.fallbackData }),
}));

import type { UserPokemonDto } from "@/services/user-pokemon";
import { CollectionGrid } from "./collection-grid";

function makePokemon(overrides: Partial<UserPokemonDto> = {}): UserPokemonDto {
  return {
    id: "up-1",
    pokemon: { name: "Pikachu", pokeApiId: 25 },
    currentFullness: 60,
    currentMood: 60,
    heart: 60,
    activeDays: 1,
    isFainted: false,
    acquiredAt: "2024-05-31T12:00:00Z",
    faintedAt: null,
    feedCooldownEndsAt: null,
    playCooldownEndsAt: null,

    earnedBondLevels: [],
    ...overrides,
  };
}

describe("CollectionGrid", () => {
  it("shows empty state with link to shop when no pokemons", () => {
    render(<CollectionGrid initial={[]} />);
    expect(
      screen.getByText("Your collection is waiting to begin."),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Browse Shop/i });
    expect(link).toHaveAttribute("href", "/shop");
  });

  it("renders cards for each pokemon", () => {
    render(
      <CollectionGrid
        initial={[
          makePokemon({
            id: "up-1",
            pokemon: { name: "Pikachu", pokeApiId: 25 },
          }),
          makePokemon({
            id: "up-2",
            pokemon: { name: "Bulbasaur", pokeApiId: 1 },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText("Bulbasaur")).toBeInTheDocument();
  });

  it("shows the singular subtitle for exactly one pokemon", () => {
    render(<CollectionGrid initial={[makePokemon()]} />);
    expect(screen.getByText("1 companion in your care.")).toBeInTheDocument();
  });

  it("shows the plural subtitle for multiple pokemons", () => {
    render(
      <CollectionGrid
        initial={[
          makePokemon({ id: "up-1" }),
          makePokemon({ id: "up-2" }),
          makePokemon({ id: "up-3" }),
        ]}
      />,
    );
    expect(screen.getByText("3 companions in your care.")).toBeInTheDocument();
  });
});
