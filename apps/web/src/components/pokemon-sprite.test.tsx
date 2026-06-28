// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PokemonSprite } from "./pokemon-sprite";

describe("PokemonSprite", () => {
  it("renders the sprite with the name as alt text", () => {
    render(<PokemonSprite pokeApiId={25} name="Pikachu" variant="card" />);
    expect(screen.getByAltText("Pikachu")).toBeInTheDocument();
  });

  it("builds the sprite src from the pokeApiId", () => {
    render(<PokemonSprite pokeApiId={25} name="Pikachu" variant="card" />);
    expect(screen.getByAltText("Pikachu")).toHaveAttribute(
      "src",
      expect.stringContaining("25"),
    );
  });

  // The card/feature variants only swap layout/background styling — a purely
  // visual difference with no behavioural signal, so they aren't asserted here.
});
