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
    expect(screen.getByAltText("Pikachu").getAttribute("src")).toContain("25");
  });

  it("omits the gradient background for the card variant", () => {
    const { container } = render(
      <PokemonSprite pokeApiId={25} name="Pikachu" variant="card" />,
    );
    expect(container.firstElementChild?.className).not.toContain(
      "bg-gradient-to-b",
    );
  });

  it("applies the gradient background for the feature variant", () => {
    const { container } = render(
      <PokemonSprite pokeApiId={25} name="Pikachu" variant="feature" />,
    );
    expect(container.firstElementChild?.className).toContain(
      "bg-gradient-to-b",
    );
  });

  it("does not gray out the sprite by default", () => {
    render(<PokemonSprite pokeApiId={25} name="Pikachu" variant="feature" />);
    expect(screen.getByAltText("Pikachu").className).not.toContain("grayscale");
  });
});
