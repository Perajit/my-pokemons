// @vitest-environment jsdom

import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeUserPokemonDto } from "@/test/dto-factories";
import { setup } from "@/test/render";
import { PokemonCard } from "./pokemon-card";

describe("PokemonCard", () => {
  it("shows the nickname as the card name", () => {
    setup(<PokemonCard pokemon={makeUserPokemonDto({ nickname: "Sparky" })} />);
    expect(screen.getByText("Sparky")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open sparky/i }),
    ).toBeInTheDocument();
  });

  it("renders live heart stat when active", () => {
    // fullness=75, mood=75 → heart = 0.6*75 + 0.4*75 = 75
    setup(
      <PokemonCard
        pokemon={makeUserPokemonDto({ currentFullness: 75, currentMood: 75 })}
      />,
    );
    expect(screen.getByLabelText("Heart: 75 of 100")).toBeInTheDocument();
    expect(screen.queryByText("Fainted")).not.toBeInTheDocument();
  });

  it("links to the detail page", () => {
    setup(<PokemonCard pokemon={makeUserPokemonDto({ id: "up-42" })} />);
    const link = screen.getByRole("link", { name: /Open Pikachu/i });
    expect(link).toHaveAttribute("href", "/collection/up-42");
  });

  it("shows Fainted badge and hides heart stat when fainted", () => {
    setup(
      <PokemonCard
        pokemon={makeUserPokemonDto({
          isFainted: true,
          faintedAt: "2024-06-01T00:00:00Z",
          currentFullness: 0,
          currentMood: 0,
        })}
      />,
    );
    expect(screen.getByText("Fainted")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Heart:/)).not.toBeInTheDocument();
  });

  describe("when idle with decay rates", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-01T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("transitions to fainted when both stats decay to zero", () => {
      setup(
        <PokemonCard
          pokemon={makeUserPokemonDto({
            currentFullness: 1,
            currentMood: 1,
            pokemon: { fullnessDecayPerHour: 3600, moodDecayPerHour: 3600 },
            lastCalculatedAt: "2024-06-01T12:00:00Z",
          })}
        />,
      );
      expect(screen.queryByText("Fainted")).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(screen.getByText("Fainted")).toBeInTheDocument();
      expect(screen.queryByLabelText(/Heart:/)).not.toBeInTheDocument();
    });
  });
});
