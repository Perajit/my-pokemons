// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, screen } from "@testing-library/react";
import * as React from "react";
import { renderWithSwr } from "@/test/render";
import { makeUserPokemonDto } from "@/test/dto-factories";
import type { UserPokemonDto } from "@/services/user-pokemon";

// Black-box proof that the single-pokemon detail view polls and refreshes the
// DOM: real SWR + real usePolledUserPokemon (NOT mocked), only the network and
// unrelated next/action boundaries are faked.
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
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../../actions", () => ({
  feedAction: vi.fn(),
  playAction: vi.fn(),
  reviveAction: vi.fn(),
  renameAction: vi.fn(),
}));

import { PokemonDetail } from "./pokemon-detail";

const POLL_INTERVAL_MS =
  parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL_SECONDS ?? "300", 10) *
  1000;

let serverPokemon: UserPokemonDto;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => serverPokemon,
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("PokemonDetail polling", () => {
  it("refreshes the pokemon on the page after the poll interval elapses", async () => {
    // Nickname distinct from the species name so the assertion is unambiguous.
    const initial = makeUserPokemonDto({ nickname: "Buddy" });
    serverPokemon = initial;

    renderWithSwr(<PokemonDetail initial={initial} reviveCount={0} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText("Buddy")).toBeInTheDocument();

    serverPokemon = makeUserPokemonDto({ nickname: "Sparky" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(screen.getByText("Sparky")).toBeInTheDocument();
    expect(screen.queryByText("Buddy")).not.toBeInTheDocument();
  });
});
