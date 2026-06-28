// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("swr");

import useSWR from "swr";
import type { UserPokemonDto } from "@/services/user-pokemon";
import {
  usePolledCollection,
  usePolledUserPokemon,
} from "./use-polled-collection";

const mockUseSWR = vi.mocked(useSWR);

function makePokemon(overrides: Partial<UserPokemonDto> = {}): UserPokemonDto {
  return {
    id: "up-1",
    nickname: "Pikachu",
    pokemon: { name: "Pikachu", pokeApiId: 25 },
    currentFullness: 60,
    currentMood: 60,
    heart: 60,
    activeStreak: 1,
    isFainted: false,
    acquiredAt: "2024-05-31T12:00:00Z",
    faintedAt: null,
    feedCooldownEndsAt: null,
    playCooldownEndsAt: null,
    earnedBondLevels: [],
    ...overrides,
  };
}

// useSWR is overloaded, so its return type isn't directly assignable from a
// partial literal — cast through unknown at this mock boundary.
function swrResult<T>(
  data: T | undefined,
  mutate = vi.fn(),
): ReturnType<typeof useSWR> {
  return { data, mutate } as unknown as ReturnType<typeof useSWR>;
}

beforeEach(() => {
  mockUseSWR.mockReset();
});

describe("usePolledCollection", () => {
  it("polls /api/collection with the configured interval and focus revalidation", () => {
    const initial = [makePokemon()];
    mockUseSWR.mockReturnValue(swrResult(initial));

    renderHook(() => usePolledCollection(initial));

    const [key, , config] = mockUseSWR.mock.calls[0];
    expect(key).toBe("/api/collection");
    expect(config).toMatchObject({
      fallbackData: initial,
      refreshInterval: 300_000,
      revalidateOnFocus: true,
    });
  });

  it("returns SWR data as pokemons", () => {
    const fresh = [makePokemon({ nickname: "Sparky" })];
    mockUseSWR.mockReturnValue(swrResult(fresh));

    const { result } = renderHook(() => usePolledCollection([makePokemon()]));
    expect(result.current.pokemons).toBe(fresh);
  });

  it("falls back to initial when SWR has no data yet", () => {
    const initial = [makePokemon()];
    mockUseSWR.mockReturnValue(swrResult(undefined));

    const { result } = renderHook(() => usePolledCollection(initial));
    expect(result.current.pokemons).toBe(initial);
  });
});

describe("usePolledUserPokemon", () => {
  it("polls /api/collection/<id> with the configured interval and focus revalidation", () => {
    const initial = makePokemon({ id: "up-42" });
    mockUseSWR.mockReturnValue(swrResult(initial));

    renderHook(() => usePolledUserPokemon(initial));

    const [key, , config] = mockUseSWR.mock.calls[0];
    expect(key).toBe("/api/collection/up-42");
    expect(config).toMatchObject({
      fallbackData: initial,
      refreshInterval: 300_000,
      revalidateOnFocus: true,
    });
  });

  it("returns SWR data and its mutate", () => {
    const fresh = makePokemon({ nickname: "Sparky" });
    const mutate = vi.fn();
    mockUseSWR.mockReturnValue(swrResult(fresh, mutate));

    const { result } = renderHook(() => usePolledUserPokemon(makePokemon()));
    expect(result.current.pokemon).toBe(fresh);
    expect(result.current.mutate).toBe(mutate);
  });

  it("falls back to initial when SWR has no data yet", () => {
    const initial = makePokemon();
    mockUseSWR.mockReturnValue(swrResult(undefined));

    const { result } = renderHook(() => usePolledUserPokemon(initial));
    expect(result.current.pokemon).toBe(initial);
  });
});
