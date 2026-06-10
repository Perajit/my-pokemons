// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UserPokemonDTO } from "@/services/pokemon";
import { PokemonCard } from "./pokemon-card";

function makePokemon(overrides: Partial<UserPokemonDTO> = {}): UserPokemonDTO {
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
    feedCoinReward: 3,
    playCoinReward: 5,
    earnedAchievements: [],
    ...overrides,
  };
}

describe("PokemonCard", () => {
  it("shows the pokemon name", () => {
    render(<PokemonCard pokemon={makePokemon()} />);
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
  });

  it("renders heart, fullness, and mood stats when active", () => {
    render(
      <PokemonCard
        pokemon={makePokemon({
          heart: 75,
          currentFullness: 80,
          currentMood: 70,
        })}
      />,
    );
    expect(screen.getByLabelText("Heart: 75 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Fullness: 80")).toBeInTheDocument();
    expect(screen.getByLabelText("Mood: 70")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("links to the detail page", () => {
    render(<PokemonCard pokemon={makePokemon({ id: "up-42" })} />);
    const link = screen.getByRole("link", { name: /Open Pikachu/i });
    expect(link).toHaveAttribute("href", "/collection/up-42");
  });

  it("shows Fainted chip and still renders all stats at 0 when not active", () => {
    render(
      <PokemonCard
        pokemon={makePokemon({
          isFainted: true,
          faintedAt: "2024-06-01T00:00:00Z",
          heart: 0,
          currentFullness: 0,
          currentMood: 0,
        })}
      />,
    );
    expect(screen.getByText("Fainted")).toBeInTheDocument();
    expect(screen.getByLabelText("Heart: 0 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Fullness: 0")).toBeInTheDocument();
    expect(screen.getByLabelText("Mood: 0")).toBeInTheDocument();
  });

  it("desaturates the sprite when fainted", () => {
    const { container } = render(
      <PokemonCard pokemon={makePokemon({ isFainted: true })} />,
    );
    const img = container.querySelector("img");
    expect(img?.className).toContain("grayscale");
  });
});
