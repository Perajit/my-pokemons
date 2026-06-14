import { describe, it, expect } from "vitest";
import { toUserPokemon, toUserPokemonDto } from "./mappers";
import type { UserPokemon, UserPokemonSnapshot } from "./types";
import { basePokemon } from "./__test-helpers";

function makeUserPokemon(overrides: Partial<UserPokemon> = {}): UserPokemon {
  return {
    id: "up-1",
    nickname: "Sparky",
    currentFullness: 60,
    currentMood: 60,
    faintedAt: null,
    lastFedAt: null,
    lastPlayedAt: null,
    acquiredAt: new Date("2024-05-31T12:00:00Z"),
    pokemon: basePokemon,
    heart: 60,
    activeStreak: 1,
    isFainted: false,
    feedCooldownEndsAt: null,
    playCooldownEndsAt: null,
    earnedBondLevels: [],
    ...overrides,
  };
}

function makeSnapshot(
  overrides: Partial<UserPokemonSnapshot> = {},
): UserPokemonSnapshot {
  return {
    id: "up-1",
    nickname: null,
    currentFullness: 60,
    currentMood: 60,
    acquiredAt: new Date("2024-05-31T12:00:00Z"),
    faintedAt: null,
    lastFedAt: null,
    lastPlayedAt: null,
    lastRevivedAt: null,
    totalFaintedDurationMs: 0,
    pokemon: basePokemon,
    ...overrides,
  };
}

describe("toUserPokemon()", () => {
  const now = new Date("2024-06-01T12:00:00Z");

  it("uses the stored nickname when present", () => {
    expect(
      toUserPokemon(makeSnapshot({ nickname: "Sparky" }), now).nickname,
    ).toBe("Sparky");
  });

  it("falls back to the species name when the nickname is null", () => {
    expect(toUserPokemon(makeSnapshot({ nickname: null }), now).nickname).toBe(
      "Pikachu",
    );
  });
});

describe("toUserPokemonDto()", () => {
  it("serializes all Date fields to ISO strings when present", () => {
    const result = toUserPokemonDto(
      makeUserPokemon({
        faintedAt: new Date("2024-06-02T00:00:00Z"),
        feedCooldownEndsAt: new Date("2024-06-01T12:30:00Z"),
        playCooldownEndsAt: new Date("2024-06-01T12:20:00Z"),
      }),
    );

    expect(result.acquiredAt).toBe("2024-05-31T12:00:00.000Z");
    expect(result.faintedAt).toBe("2024-06-02T00:00:00.000Z");
    expect(result.feedCooldownEndsAt).toBe("2024-06-01T12:30:00.000Z");
    expect(result.playCooldownEndsAt).toBe("2024-06-01T12:20:00.000Z");
  });

  it("returns null for nullable date fields when they are null", () => {
    const result = toUserPokemonDto(makeUserPokemon());

    expect(result.faintedAt).toBeNull();
    expect(result.feedCooldownEndsAt).toBeNull();
    expect(result.playCooldownEndsAt).toBeNull();
  });

  it("passes the derived bond levels through to the DTO", () => {
    const result = toUserPokemonDto(
      makeUserPokemon({ earnedBondLevels: ["BOND_LEVEL_1D", "BOND_LEVEL_7D"] }),
    );
    expect(result.earnedBondLevels).toEqual(["BOND_LEVEL_1D", "BOND_LEVEL_7D"]);
  });

  it("returns an empty bond levels array when none are earned", () => {
    const result = toUserPokemonDto(makeUserPokemon());
    expect(result.earnedBondLevels).toEqual([]);
  });

  it("passes the nickname through to the DTO", () => {
    const result = toUserPokemonDto(makeUserPokemon({ nickname: "Sparky" }));
    expect(result.nickname).toBe("Sparky");
  });
});
