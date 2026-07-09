// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, screen } from "@testing-library/react";
import { renderWithSwr } from "@/test/render";
import { makeUserPokemonDto } from "@/test/dto-factories";
import type { UserPokemonDto } from "@/services/user-pokemon";
import { CollectionGrid } from "./collection-grid";

// Black-box proof that collection polling refreshes the DOM: real SWR + real
// usePolledCollection (NOT mocked), only the network is faked. Advancing fake
// timers past the poll interval must pull the server's newer data onto the page
// with no reload. This is the live-refresh coverage the prior white-box hook
// test (mocking swr, asserting refreshInterval) could not give.
const POLL_INTERVAL_MS =
  parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL_SECONDS ?? "300", 10) *
  1000;

let serverPokemons: UserPokemonDto[];

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => serverPokemons,
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("CollectionGrid polling", () => {
  it("renders freshly polled pokemon after the poll interval elapses", async () => {
    const initial = [makeUserPokemonDto({ id: "up-1", nickname: "Pikachu" })];
    // Server returns the same data through the mount revalidation.
    serverPokemons = initial;

    renderWithSwr(<CollectionGrid initial={initial} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0); // let the mount revalidation settle
    });
    expect(screen.getByText("Pikachu")).toBeInTheDocument();

    // A rename lands on the server; the next poll should surface it.
    serverPokemons = [makeUserPokemonDto({ id: "up-1", nickname: "Sparky" })];
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(screen.getByText("Sparky")).toBeInTheDocument();
    expect(screen.queryByText("Pikachu")).not.toBeInTheDocument();
  });
});
