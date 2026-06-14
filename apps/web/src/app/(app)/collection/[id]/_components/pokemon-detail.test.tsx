// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("swr", () => ({
  default: (
    _key: string,
    _fetcher: unknown,
    options: { fallbackData: unknown },
  ) => ({ data: options.fallbackData, mutate: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../../actions", () => ({
  feedAction: vi.fn(),
  playAction: vi.fn(),
  reviveAction: vi.fn(),
  renameAction: vi.fn(),
}));

import { toast } from "sonner";
import {
  feedAction,
  playAction,
  reviveAction,
  renameAction,
} from "../../actions";
import type { UserPokemonDto } from "@/services/user-pokemon";
import { PokemonDetail } from "./pokemon-detail";

const mockFeed = feedAction as ReturnType<typeof vi.fn>;
const mockPlay = playAction as ReturnType<typeof vi.fn>;
const mockRevive = reviveAction as ReturnType<typeof vi.fn>;

function makePokemon(overrides: Partial<UserPokemonDto> = {}): UserPokemonDto {
  return {
    id: "up-1",
    nickname: "Pikachu",
    pokemon: { name: "Pikachu", pokeApiId: 25 },
    currentFullness: 80,
    currentMood: 70,
    heart: 76,
    activeStreak: 5,
    isFainted: false,
    acquiredAt: "2024-05-26T12:00:00Z",
    faintedAt: null,
    feedCooldownEndsAt: null,
    playCooldownEndsAt: null,
    earnedBondLevels: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PokemonDetail", () => {
  it("renders name, days since acquired, and stat bars when active", () => {
    render(<PokemonDetail initial={makePokemon()} />);
    expect(
      screen.getByRole("heading", { name: "Pikachu" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/5 days streak/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Heart: 76 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Fullness: 80 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Mood: 70 of 100")).toBeInTheDocument();
  });

  it("shows the nickname as the title with a rename button", () => {
    render(<PokemonDetail initial={makePokemon({ nickname: "Sparky" })} />);
    expect(screen.getByRole("heading", { name: "Sparky" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /rename sparky/i }),
    ).toBeInTheDocument();
  });

  it("renames through the pencil dialog on success", async () => {
    const user = userEvent.setup();
    (renameAction as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    render(<PokemonDetail initial={makePokemon({ nickname: "Pikachu" })} />);

    await user.click(screen.getByRole("button", { name: /rename pikachu/i }));
    const input = await screen.findByLabelText(/nickname/i);
    await user.clear(input);
    await user.type(input, "Sparky");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(renameAction).toHaveBeenCalledWith("up-1", "Sparky"),
    );
  });

  it("always shows the species name as a subtitle under the nickname", () => {
    const { rerender } = render(
      <PokemonDetail initial={makePokemon({ nickname: "Sparky" })} />,
    );
    // renamed → nickname title + species subtitle
    expect(screen.getByRole("heading", { name: "Sparky" })).toBeInTheDocument();
    expect(screen.getByText("Pikachu")).toBeInTheDocument();

    // un-renamed (nickname === species) → species still shown, so it appears
    // twice: once as the title, once as the subtitle
    rerender(<PokemonDetail initial={makePokemon({ nickname: "Pikachu" })} />);
    expect(screen.getAllByText("Pikachu")).toHaveLength(2);
  });

  it("renders a Back to Collection link pointing at /collection", () => {
    render(<PokemonDetail initial={makePokemon()} />);
    expect(
      screen.getByRole("link", { name: /back to collection/i }),
    ).toHaveAttribute("href", "/collection");
  });

  it("renders the streak header with the active day count", () => {
    render(<PokemonDetail initial={makePokemon({ activeStreak: 1 })} />);
    expect(screen.getByText(/1 day streak/i)).toBeInTheDocument();
  });

  it("shows fainted label and hides stat bars when not active", () => {
    render(
      <PokemonDetail
        initial={makePokemon({
          isFainted: true,
          faintedAt: "2024-06-01T00:00:00Z",
          currentFullness: 0,
          currentMood: 0,
          heart: 0,
        })}
      />,
    );
    expect(screen.getByText("Fainted")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Heart:/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Fullness:/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Mood:/)).not.toBeInTheDocument();
  });

  it("desaturates the sprite when fainted", () => {
    const { container } = render(
      <PokemonDetail initial={makePokemon({ isFainted: true })} />,
    );
    const img = container.querySelector("img");
    expect(img?.className).toContain("grayscale");
  });

  it("renders Feed and Play buttons when active", () => {
    render(<PokemonDetail initial={makePokemon()} />);
    expect(screen.getByRole("button", { name: "Feed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("hides Feed and Play buttons when fainted", () => {
    render(<PokemonDetail initial={makePokemon({ isFainted: true })} />);
    expect(
      screen.queryByRole("button", { name: "Feed" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Play" }),
    ).not.toBeInTheDocument();
  });

  describe("when on cooldown", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-01T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("disables the Feed button and shows a m:ss countdown", () => {
      // 90 seconds in the future → 1:30
      const cooldownEndsAt = new Date("2024-06-01T12:01:30Z").toISOString();
      render(
        <PokemonDetail
          initial={makePokemon({ feedCooldownEndsAt: cooldownEndsAt })}
        />,
      );

      const feedBtn = screen.getByRole("button", { name: "Feed" });
      expect(feedBtn).toBeDisabled();
      expect(feedBtn.textContent).toContain("1:30");
    });

    it("ticks the countdown forward as time advances", () => {
      const cooldownEndsAt = new Date("2024-06-01T12:01:30Z").toISOString();
      const { unmount } = render(
        <PokemonDetail
          initial={makePokemon({ feedCooldownEndsAt: cooldownEndsAt })}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(30_000);
      });

      const feedBtn = screen.getByRole("button", { name: "Feed" });
      expect(feedBtn.textContent).toContain("1:00");

      unmount();
    });
  });

  it("calls feedAction and toasts the pokemon_fed event on Feed click", async () => {
    const user = userEvent.setup();
    mockFeed.mockResolvedValue({
      ok: true,
      data: {
        events: [
          { type: "pokemon_fed", pokemonName: "Pikachu", coinsEarned: 3 },
        ],
      },
    });
    render(<PokemonDetail initial={makePokemon()} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Feed" }));
    });

    expect(mockFeed).toHaveBeenCalledWith("up-1");
    expect(toast.success).toHaveBeenCalledWith("Fed Pikachu! +3 coins");
  });

  it("calls playAction and toasts the pokemon_played event on Play click", async () => {
    const user = userEvent.setup();
    mockPlay.mockResolvedValue({
      ok: true,
      data: {
        events: [
          { type: "pokemon_played", pokemonName: "Pikachu", coinsEarned: 5 },
        ],
      },
    });
    render(<PokemonDetail initial={makePokemon()} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Play" }));
    });

    expect(mockPlay).toHaveBeenCalledWith("up-1");
    expect(toast.success).toHaveBeenCalledWith("Played with Pikachu! +5 coins");
  });

  it("fires an achievement toast in addition to the action toast on Play", async () => {
    const user = userEvent.setup();
    mockPlay.mockResolvedValue({
      ok: true,
      data: {
        events: [
          { type: "pokemon_played", pokemonName: "Pikachu", coinsEarned: 5 },
          {
            type: "achievement_unlocked",
            achievementKey: "BOND_LEVEL_7D",
            coinsEarned: 15,
          },
        ],
      },
    });
    render(<PokemonDetail initial={makePokemon()} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Play" }));
    });

    expect(toast.success).toHaveBeenCalledWith("Played with Pikachu! +5 coins");
    expect(toast.success).toHaveBeenCalledWith(
      "Earned: Close Friend (+15 coins)",
    );
  });

  it("fires an achievement toast in addition to the action toast on Feed", async () => {
    const user = userEvent.setup();
    mockFeed.mockResolvedValue({
      ok: true,
      data: {
        events: [
          { type: "pokemon_fed", pokemonName: "Pikachu", coinsEarned: 3 },
          {
            type: "achievement_unlocked",
            achievementKey: "BOND_LEVEL_1D",
            coinsEarned: 5,
          },
        ],
      },
    });
    render(<PokemonDetail initial={makePokemon()} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Feed" }));
    });

    expect(toast.success).toHaveBeenCalledWith("Fed Pikachu! +3 coins");
    expect(toast.success).toHaveBeenCalledWith("Earned: New Friend (+5 coins)");
  });

  it("toasts the error message on a failed Feed click", async () => {
    const user = userEvent.setup();
    mockFeed.mockResolvedValue({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "FAINTED",
        message: "Pokémon has fainted",
      },
    });
    render(<PokemonDetail initial={makePokemon()} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Feed" }));
    });

    expect(mockFeed).toHaveBeenCalledWith("up-1");
    expect(toast.error).toHaveBeenCalledWith("Pokémon has fainted");
  });

  it("toasts the error message on a failed Play click", async () => {
    const user = userEvent.setup();
    mockPlay.mockResolvedValue({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "COOLDOWN",
        message: "Action on cooldown",
        metadata: { cooldownEndsAt: "2024-06-01T12:30:00.000Z" },
      },
    });
    render(<PokemonDetail initial={makePokemon()} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Play" }));
    });

    expect(mockPlay).toHaveBeenCalledWith("up-1");
    expect(toast.error).toHaveBeenCalledWith("Action on cooldown");
  });

  const faintedRevive = () =>
    makePokemon({ isFainted: true, currentFullness: 0, currentMood: 0 });

  it("revives a fainted pokemon and toasts the pokemon_revived event", async () => {
    const user = userEvent.setup();
    mockRevive.mockResolvedValue({
      ok: true,
      data: {
        events: [{ type: "pokemon_revived", pokemonName: "Pikachu" }],
      },
    });
    render(<PokemonDetail initial={faintedRevive()} reviveCount={2} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /revive/i }));
    });

    expect(mockRevive).toHaveBeenCalledWith("up-1");
    expect(toast.success).toHaveBeenCalledWith("Pikachu was revived!");
  });

  it("disables Revive and links to the shop when no Revive is owned", () => {
    render(<PokemonDetail initial={faintedRevive()} reviveCount={0} />);

    expect(screen.getByRole("button", { name: /revive/i })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /get a revive in the shop/i }),
    ).toHaveAttribute("href", "/shop");
  });
});
