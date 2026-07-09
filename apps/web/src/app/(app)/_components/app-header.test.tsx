// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithSwr } from "@/test/render";
import type { MeDto } from "@/services/me";

// Boundary mocks only. Everything below AppHeader (CoinBadge, DailyGiftButton,
// UserMenu) renders for real; the ONLY thing faked is the network (global fetch)
// and the server actions / next primitives those children reference at import.
vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/app/actions", () => ({ logoutAction: vi.fn() }));
vi.mock("../_daily-gift/actions", () => ({ claimDailyGiftAction: vi.fn() }));

import { AppHeader } from "./app-header";
import { claimDailyGiftAction } from "../_daily-gift/actions";
import { giftAnimation } from "../_daily-gift/animation";

const mockClaim = claimDailyGiftAction as ReturnType<typeof vi.fn>;
const ANIM_DEFAULTS = { ...giftAnimation };

// The mocked server responds with whatever `serverMe` currently holds, so a test
// can flip server state mid-flight and then trigger a revalidation to observe the
// DOM catch up — exactly how the live page behaves.
let serverMe: MeDto;

function makeMe(overrides: Partial<MeDto> = {}): MeDto {
  return {
    name: "Ash",
    email: "ash@example.com",
    coins: 250,
    dailyGift: { availableNow: false, nextGiftAvailableAt: null },
    ...overrides,
  };
}

const queryGiftDot = () => screen.queryByLabelText("Gift available");

// Flush the pending SWR revalidation (a microtask-resolved fetch) under fake
// timers so mount/focus/timer refetches settle deterministically before we
// assert — no arbitrary waits, and no race that could pass for the wrong reason.
const flush = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });

beforeEach(() => {
  vi.useFakeTimers();
  serverMe = makeMe();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => serverMe,
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("AppHeader live updates", () => {
  it("renders the initial coin balance and no gift dot when the gift is claimed", async () => {
    const initial = makeMe({
      coins: 250,
      dailyGift: {
        availableNow: false,
        nextGiftAvailableAt: new Date(Date.now() + 60_000).toISOString(),
      },
    });
    serverMe = initial;

    renderWithSwr(<AppHeader initial={initial} />);
    await flush(); // mount revalidation settles with the same claimed state

    expect(
      screen.getByLabelText("Coin balance: 250 coins"),
    ).toBeInTheDocument();
    expect(queryGiftDot()).not.toBeInTheDocument();
  });

  it("adopts server-pushed coin and gift updates when initial changes", async () => {
    // A coin action calls revalidatePath("/", "layout"), re-rendering this client
    // component with a fresh `initial`. The header must adopt it — SWR's cache would
    // otherwise ignore the updated prop (fallbackData loses to an existing entry).
    const initial = makeMe({
      coins: 250,
      dailyGift: {
        availableNow: false,
        nextGiftAvailableAt: new Date(Date.now() + 60_000).toISOString(),
      },
    });
    serverMe = initial;

    const { rerender } = renderWithSwr(<AppHeader initial={initial} />);
    await flush();
    expect(
      screen.getByLabelText("Coin balance: 250 coins"),
    ).toBeInTheDocument();
    expect(queryGiftDot()).not.toBeInTheDocument();

    // Server pushes fresh state (coins credited, gift now available).
    const updated = makeMe({
      coins: 300,
      dailyGift: { availableNow: true, nextGiftAvailableAt: null },
    });
    serverMe = updated;
    rerender(<AppHeader initial={updated} />);
    await flush();

    expect(
      screen.getByLabelText("Coin balance: 300 coins"),
    ).toBeInTheDocument();
    expect(queryGiftDot()).toBeInTheDocument();
  });

  it("flips the dot on and refreshes coins when the reset time arrives (midnight trigger)", async () => {
    // Reset is 5 min out. The assertion isolates the one-shot timer as the cause:
    // after mount settles, NO refetch happens as time passes up to the reset
    // boundary, then exactly one refetch fires AT the boundary. The fetch count
    // is the invariant — it proves the change is surfaced by the timer, not by an
    // incidental mount/background revalidation. Coins are asserted too since the
    // same mutate() refreshes the whole header payload.
    const RESET_MS = 300_000;
    const SETTLE_MS = 1_000; // drain SWR's deferred mount revalidation
    const resetAt = new Date(Date.now() + RESET_MS).toISOString();
    const initial = makeMe({
      coins: 250,
      dailyGift: { availableNow: false, nextGiftAvailableAt: resetAt },
    });
    serverMe = initial;
    const fetchMock = fetch as ReturnType<typeof vi.fn>;

    renderWithSwr(<AppHeader initial={initial} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SETTLE_MS);
    });
    const afterMountCalls = fetchMock.mock.calls.length;
    expect(afterMountCalls).toBeGreaterThanOrEqual(1); // mount did revalidate
    expect(queryGiftDot()).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Coin balance: 250 coins"),
    ).toBeInTheDocument();

    // Server now reports the gift available and a changed balance.
    serverMe = makeMe({
      coins: 265,
      dailyGift: { availableNow: true, nextGiftAvailableAt: null },
    });

    // Up to just before the reset boundary: nothing refetches, DOM unchanged.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RESET_MS - SETTLE_MS - 1);
    });
    expect(fetchMock.mock.calls.length).toBe(afterMountCalls);
    expect(queryGiftDot()).not.toBeInTheDocument();

    // Crossing the reset boundary fires the timer → exactly one refetch → DOM updates.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(fetchMock.mock.calls.length).toBe(afterMountCalls + 1);
    expect(queryGiftDot()).toBeInTheDocument();
    expect(
      screen.getByLabelText("Coin balance: 265 coins"),
    ).toBeInTheDocument();
  });

  it("hides the dot after the gift is claimed (optimistic mutate)", async () => {
    // Real timers here: userEvent drives the modal's setTimeout-based reveal, and
    // the two don't compose cleanly with fake timers. Durations are zeroed so it
    // still settles in ~0ms.
    vi.useRealTimers();
    giftAnimation.shakeMs = 0;
    giftAnimation.openMs = 0;
    // Claiming mutates the server: subsequent revalidations report it as taken,
    // so the optimistic hide is confirmed rather than reverted.
    mockClaim.mockImplementation(async () => {
      serverMe = makeMe({
        dailyGift: {
          availableNow: false,
          nextGiftAvailableAt: new Date(Date.now() + 60_000).toISOString(),
        },
      });
      return { ok: true, data: { reward: { type: "coins", amount: 30 } } };
    });
    const user = userEvent.setup();

    const initial = makeMe({
      dailyGift: { availableNow: true, nextGiftAvailableAt: null },
    });
    serverMe = initial;
    renderWithSwr(<AppHeader initial={initial} />);
    expect(queryGiftDot()).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Daily gift" }));
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /open gift/i }),
    );
    await within(dialog).findByText("+30 coins");
    await user.click(
      within(dialog).getAllByRole("button", { name: /close/i })[0],
    );

    expect(
      await screen.findByRole("button", { name: "Daily gift" }),
    ).toBeInTheDocument();
    expect(queryGiftDot()).not.toBeInTheDocument();

    giftAnimation.shakeMs = ANIM_DEFAULTS.shakeMs;
    giftAnimation.openMs = ANIM_DEFAULTS.openMs;
  });
});
