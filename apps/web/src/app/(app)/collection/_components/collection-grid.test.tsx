// @vitest-environment jsdom

import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the polling hook (the component's data boundary): echo the initial prop
// back as pokemons, no SWR/network. Polling config itself is covered by
// use-polled-collection.test.tsx.
vi.mock("@/hooks/use-polled-collection", () => ({
  usePolledCollection: vi.fn(),
}));

import { usePolledCollection } from "@/hooks/use-polled-collection";
import { makeUserPokemonDto } from "@/test/dto-factories";
import { CollectionGrid } from "./collection-grid";

const mockUsePolledCollection = vi.mocked(usePolledCollection);

beforeEach(() => {
  mockUsePolledCollection.mockImplementation((initial) => ({
    pokemons: initial,
  }));
});

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
          makeUserPokemonDto({
            id: "up-1",
            nickname: "Pikachu",
            pokemon: { name: "Pikachu", pokeApiId: 25 },
          }),
          makeUserPokemonDto({
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
    render(<CollectionGrid initial={[makeUserPokemonDto()]} />);
    expect(screen.getByText("1 companion in your care.")).toBeInTheDocument();
  });

  it("shows the plural subtitle for multiple pokemons", () => {
    render(
      <CollectionGrid
        initial={[
          makeUserPokemonDto({ id: "up-1" }),
          makeUserPokemonDto({ id: "up-2" }),
          makeUserPokemonDto({ id: "up-3" }),
        ]}
      />,
    );
    expect(screen.getByText("3 companions in your care.")).toBeInTheDocument();
  });
});
