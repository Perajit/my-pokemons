// @vitest-environment jsdom

import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the polling hook (the component's data boundary): echo the initial prop
// back as pokemons, no SWR/network. Polling config itself is covered by
// use-polled-collection.test.tsx.
vi.mock("@/hooks/use-polled-collection", () => ({
  usePolledCollection: vi.fn(),
}));

import type { UserPokemonDto } from "@/services/user-pokemon";
import { usePolledCollection } from "@/hooks/use-polled-collection";
import { CollectionGrid } from "./collection-grid";

const mockUsePolledCollection = vi.mocked(usePolledCollection);

beforeEach(() => {
  mockUsePolledCollection.mockImplementation((initial) => ({
    pokemons: initial,
  }));
});

function makePokemon(overrides: Partial<UserPokemonDto> = {}): UserPokemonDto {
  return {
    id: "up-1",
    nickname: "Pikachu",
    pokemon: { name: "Pikachu", pokeApiId: 25 },
    currentFullness: 60,
    currentMood: 60,
    heart: 60,
    activeStreak: 1,
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
            nickname: "Pikachu",
            pokemon: { name: "Pikachu", pokeApiId: 25 },
          }),
          makePokemon({
            id: "up-2",
            nickname: "Bulbasaur",
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
