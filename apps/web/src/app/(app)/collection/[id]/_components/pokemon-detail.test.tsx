// @vitest-environment jsdom

import { act, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

// Mock the polling hook (the component's data boundary): echo the initial prop
// back as pokemon, no SWR/network. Polling config is covered by
// use-polled-collection.test.tsx.
vi.mock("@/hooks/use-polled-collection", () => ({
  usePolledUserPokemon: vi.fn(),
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

import type { UserPokemonDto } from "@/services/user-pokemon";
import { usePolledUserPokemon } from "@/hooks/use-polled-collection";
import { toast } from "sonner";
import {
  feedAction,
  playAction,
  renameAction,
  reviveAction,
} from "../../actions";
import { PokemonDetail } from "./pokemon-detail";
import { setup } from "@/test/render";
import { makeUserPokemonDto } from "@/test/dto-factories";

const mockFeed = feedAction as ReturnType<typeof vi.fn>;
const mockPlay = playAction as ReturnType<typeof vi.fn>;
const mockRevive = reviveAction as ReturnType<typeof vi.fn>;
const mockUsePolledUserPokemon = vi.mocked(usePolledUserPokemon);

// The detail view's tests assume a healthier default than the shared factory
// (higher stats, longer streak, earlier acquiredAt); keep those defaults here as
// a thin wrapper over the shared builder so the 20 call sites stay unchanged.
type PokemonDtoOverrides = Partial<
  Omit<UserPokemonDto, "pokemon"> & {
    pokemon: Partial<UserPokemonDto["pokemon"]>;
  }
>;
function makePokemon(overrides: PokemonDtoOverrides = {}): UserPokemonDto {
  return makeUserPokemonDto({
    currentFullness: 80,
    currentMood: 70,
    heart: 76,
    activeStreak: 5,
    acquiredAt: "2024-05-26T12:00:00Z",
    ...overrides,
  });
}

// user + render result come from setup — never a raw render()
function setupComponent(props: {
  initial: UserPokemonDto;
  reviveCount?: number;
}) {
  return setup(<PokemonDetail {...props} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUsePolledUserPokemon.mockImplementation((initial) => ({
    pokemon: initial,
    mutate: vi.fn(),
  }));
});

describe("PokemonDetail", () => {
  it("renders name, days since acquired, and stat bars when active", () => {
    setupComponent({ initial: makePokemon() });
    expect(
      screen.getByRole("heading", { name: "Pikachu" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/5 days streak/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Heart: 76 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Fullness: 80 of 100")).toBeInTheDocument();
    expect(screen.getByLabelText("Mood: 70 of 100")).toBeInTheDocument();
  });

  it("shows the nickname as the title with a rename button", () => {
    setupComponent({ initial: makePokemon({ nickname: "Sparky" }) });
    expect(screen.getByRole("heading", { name: "Sparky" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /rename sparky/i }),
    ).toBeInTheDocument();
  });

  it("renames through the pencil dialog on success", async () => {
    (renameAction as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    const { user } = setupComponent({
      initial: makePokemon({ nickname: "Pikachu" }),
    });

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
    const { rerender } = setupComponent({
      initial: makePokemon({ nickname: "Sparky" }),
    });
    // renamed → nickname title + species subtitle
    expect(screen.getByRole("heading", { name: "Sparky" })).toBeInTheDocument();
    expect(screen.getByText("Pikachu")).toBeInTheDocument();

    // un-renamed (nickname === species) → species still shown, so it appears
    // twice: once as the title, once as the subtitle
    rerender(<PokemonDetail initial={makePokemon({ nickname: "Pikachu" })} />);
    expect(screen.getAllByText("Pikachu")).toHaveLength(2);
  });

  it("renders a Back to Collection link pointing at /collection", () => {
    setupComponent({ initial: makePokemon() });
    expect(
      screen.getByRole("link", { name: /back to collection/i }),
    ).toHaveAttribute("href", "/collection");
  });

  it("renders the streak header with the active day count", () => {
    setupComponent({ initial: makePokemon({ activeStreak: 1 }) });
    expect(screen.getByText(/1 day streak/i)).toBeInTheDocument();
  });

  it("shows fainted label and hides stat bars when not active", () => {
    setupComponent({
      initial: makePokemon({
        isFainted: true,
        faintedAt: "2024-06-01T00:00:00Z",
        currentFullness: 0,
        currentMood: 0,
        heart: 0,
      }),
    });
    expect(screen.getByText("Fainted")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Heart:/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Fullness:/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Mood:/)).not.toBeInTheDocument();
  });

  it("renders Feed and Play buttons when active", () => {
    setupComponent({ initial: makePokemon() });
    expect(screen.getByRole("button", { name: "Feed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("hides Feed and Play buttons when fainted", () => {
    setupComponent({ initial: makePokemon({ isFainted: true }) });
    expect(
      screen.queryByRole("button", { name: "Feed" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Play" }),
    ).not.toBeInTheDocument();
  });

  describe("when idle with decay rates", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-01T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("transitions to fainted state when both stats decay to zero", async () => {
      // 1 unit of each stat, decaying at 3600/hr → hits 0 after exactly 1s
      setupComponent({
        initial: makePokemon({
          isFainted: false,
          currentFullness: 1,
          currentMood: 1,
          pokemon: { fullnessDecayPerHour: 3600, moodDecayPerHour: 3600 },
          lastCalculatedAt: "2024-06-01T12:00:00Z",
        }),
      });

      expect(screen.getByRole("button", { name: "Feed" })).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(
        screen.queryByRole("button", { name: "Feed" }),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Fainted")).toBeInTheDocument();
    });
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
      setupComponent({
        initial: makePokemon({ feedCooldownEndsAt: cooldownEndsAt }),
      });

      const feedBtn = screen.getByRole("button", { name: "Feed" });
      expect(feedBtn).toBeDisabled();
      expect(feedBtn.textContent).toContain("1:30");
    });

    it("ticks the countdown forward as time advances", () => {
      const cooldownEndsAt = new Date("2024-06-01T12:01:30Z").toISOString();
      const { unmount } = setupComponent({
        initial: makePokemon({ feedCooldownEndsAt: cooldownEndsAt }),
      });

      act(() => {
        vi.advanceTimersByTime(30_000);
      });

      const feedBtn = screen.getByRole("button", { name: "Feed" });
      expect(feedBtn.textContent).toContain("1:00");

      unmount();
    });
  });

  it("calls feedAction and toasts the pokemon_fed event on Feed click", async () => {
    mockFeed.mockResolvedValue({
      ok: true,
      data: {
        events: [
          { type: "pokemon_fed", pokemonName: "Pikachu", coinsEarned: 3 },
        ],
      },
    });
    const { user } = setupComponent({ initial: makePokemon() });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Feed" }));
    });

    expect(mockFeed).toHaveBeenCalledWith("up-1");
    expect(toast.success).toHaveBeenCalledWith("Fed Pikachu! +3 coins");
  });

  it("calls playAction and toasts the pokemon_played event on Play click", async () => {
    mockPlay.mockResolvedValue({
      ok: true,
      data: {
        events: [
          { type: "pokemon_played", pokemonName: "Pikachu", coinsEarned: 5 },
        ],
      },
    });
    const { user } = setupComponent({ initial: makePokemon() });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Play" }));
    });

    expect(mockPlay).toHaveBeenCalledWith("up-1");
    expect(toast.success).toHaveBeenCalledWith("Played with Pikachu! +5 coins");
  });

  it("fires an achievement toast in addition to the action toast on Play", async () => {
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
    const { user } = setupComponent({ initial: makePokemon() });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Play" }));
    });

    expect(toast.success).toHaveBeenCalledWith("Played with Pikachu! +5 coins");
    expect(toast.success).toHaveBeenCalledWith(
      "Earned: Good Buddy (+15 coins)",
    );
  });

  it("fires an achievement toast in addition to the action toast on Feed", async () => {
    mockFeed.mockResolvedValue({
      ok: true,
      data: {
        events: [
          { type: "pokemon_fed", pokemonName: "Pikachu", coinsEarned: 3 },
          {
            type: "achievement_unlocked",
            achievementKey: "BOND_LEVEL_30D",
            coinsEarned: 40,
          },
        ],
      },
    });
    const { user } = setupComponent({ initial: makePokemon() });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Feed" }));
    });

    expect(toast.success).toHaveBeenCalledWith("Fed Pikachu! +3 coins");
    expect(toast.success).toHaveBeenCalledWith(
      "Earned: Close Buddy (+40 coins)",
    );
  });

  it("toasts the error message on a failed Feed click", async () => {
    mockFeed.mockResolvedValue({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "FAINTED",
        message: "Pokémon has fainted",
      },
    });
    const { user } = setupComponent({ initial: makePokemon() });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Feed" }));
    });

    expect(mockFeed).toHaveBeenCalledWith("up-1");
    expect(toast.error).toHaveBeenCalledWith("Pokémon has fainted");
  });

  it("toasts the error message on a failed Play click", async () => {
    mockPlay.mockResolvedValue({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "COOLDOWN",
        message: "Action on cooldown",
        metadata: { cooldownEndsAt: "2024-06-01T12:30:00.000Z" },
      },
    });
    const { user } = setupComponent({ initial: makePokemon() });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Play" }));
    });

    expect(mockPlay).toHaveBeenCalledWith("up-1");
    expect(toast.error).toHaveBeenCalledWith("Action on cooldown");
  });

  const faintedRevive = () =>
    makePokemon({ isFainted: true, currentFullness: 0, currentMood: 0 });

  it("revives a fainted pokemon and toasts the pokemon_revived event", async () => {
    mockRevive.mockResolvedValue({
      ok: true,
      data: {
        events: [{ type: "pokemon_revived", pokemonName: "Pikachu" }],
      },
    });
    const { user } = setupComponent({
      initial: faintedRevive(),
      reviveCount: 2,
    });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /revive/i }));
    });

    expect(mockRevive).toHaveBeenCalledWith("up-1");
    expect(toast.success).toHaveBeenCalledWith("Pikachu was revived!");
  });

  it("toasts the error message on a failed Revive click", async () => {
    mockRevive.mockResolvedValue({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "NO_REVIVE",
        message: "No Revive item available",
      },
    });
    const { user } = setupComponent({
      initial: faintedRevive(),
      reviveCount: 1,
    });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /revive/i }));
    });

    expect(mockRevive).toHaveBeenCalledWith("up-1");
    expect(toast.error).toHaveBeenCalledWith("No Revive item available");
  });

  it("disables Revive and links to the shop when no Revive is owned", () => {
    setupComponent({ initial: faintedRevive(), reviveCount: 0 });

    expect(screen.getByRole("button", { name: /revive/i })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /get a revive in the shop/i }),
    ).toHaveAttribute("href", "/shop");
  });
});
