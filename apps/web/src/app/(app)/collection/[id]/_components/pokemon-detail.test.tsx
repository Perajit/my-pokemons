// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

vi.mock("../../actions", () => ({
  feedAction: vi.fn(),
  playAction: vi.fn(),
}));

import { toast } from "sonner";
import { feedAction, playAction } from "../../actions";
import type { ClientPokemon } from "@/services/pokemon";
import { PokemonDetail } from "./pokemon-detail";

const mockFeed = feedAction as ReturnType<typeof vi.fn>;
const mockPlay = playAction as ReturnType<typeof vi.fn>;

function makePokemon(overrides: Partial<ClientPokemon> = {}): ClientPokemon {
  return {
    id: "up-1",
    pokemon: { name: "Pikachu", pokeApiId: 25 },
    currentFullness: 80,
    currentMood: 70,
    heart: 76,
    activeDays: 5,
    isActive: true,
    acquiredAt: "2024-05-26T12:00:00Z",
    faintedAt: null,
    feedCooldownEndsAt: null,
    playCooldownEndsAt: null,
    feedCoinReward: 3,
    playCoinReward: 5,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PokemonDetail", () => {
  it("renders name, days since acquired, and stat bars when active", () => {
    render(<PokemonDetail initial={makePokemon()} />);
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText(/5 days/)).toBeInTheDocument();
    expect(screen.getByLabelText("Heart: 76 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Fullness: 80 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Mood: 70 of 100")).toBeInTheDocument();
  });

  it("uses singular 'day' when activeDays is 1", () => {
    render(<PokemonDetail initial={makePokemon({ activeDays: 1 })} />);
    expect(screen.getByText(/1 day$/)).toBeInTheDocument();
  });

  it("shows fainted label and hides stat bars when not active", () => {
    render(
      <PokemonDetail
        initial={makePokemon({
          isActive: false,
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
      <PokemonDetail initial={makePokemon({ isActive: false })} />,
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
    render(<PokemonDetail initial={makePokemon({ isActive: false })} />);
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
  });

  it("calls feedAction and toasts success on Feed click", async () => {
    const user = userEvent.setup();
    mockFeed.mockResolvedValue({ ok: true });
    render(<PokemonDetail initial={makePokemon()} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Feed" }));
    });

    expect(mockFeed).toHaveBeenCalledWith("up-1");
    expect(toast.success).toHaveBeenCalledWith("Fed Pikachu! +3 coins");
  });

  it("calls playAction and toasts success on Play click", async () => {
    const user = userEvent.setup();
    mockPlay.mockResolvedValue({ ok: true });
    render(<PokemonDetail initial={makePokemon()} />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Play" }));
    });

    expect(mockPlay).toHaveBeenCalledWith("up-1");
    expect(toast.success).toHaveBeenCalledWith("Played with Pikachu! +5 coins");
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
});
