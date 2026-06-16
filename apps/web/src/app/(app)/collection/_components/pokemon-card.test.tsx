// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UserPokemonDto } from "@/services/user-pokemon";
import { PokemonCard } from "./pokemon-card";

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

describe("PokemonCard", () => {
  it("shows the nickname as the card name", () => {
    render(<PokemonCard pokemon={makePokemon({ nickname: "Sparky" })} />);
    expect(screen.getByText("Sparky")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open sparky/i }),
    ).toBeInTheDocument();
  });

  it("renders heart stat when active", () => {
    render(<PokemonCard pokemon={makePokemon({ heart: 75 })} />);
    expect(screen.getByLabelText("Heart: 75 of 100")).toBeInTheDocument();
    expect(screen.queryByText("Fainted")).not.toBeInTheDocument();
  });

  it("links to the detail page", () => {
    render(<PokemonCard pokemon={makePokemon({ id: "up-42" })} />);
    const link = screen.getByRole("link", { name: /Open Pikachu/i });
    expect(link).toHaveAttribute("href", "/collection/up-42");
  });

  it("shows Fainted badge and hides heart stat when fainted", () => {
    render(
      <PokemonCard
        pokemon={makePokemon({
          isFainted: true,
          faintedAt: "2024-06-01T00:00:00Z",
          heart: 0,
        })}
      />,
    );
    expect(screen.getByText("Fainted")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Heart:/)).not.toBeInTheDocument();
  });
});
