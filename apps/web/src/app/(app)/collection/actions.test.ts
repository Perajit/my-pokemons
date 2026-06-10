import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/services/pokemon", () => ({
  feedPokemon: vi.fn(),
  playWithPokemon: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { feedPokemon, playWithPokemon } from "@/services/pokemon";
import { NotOwnedError, FaintedError, CooldownError } from "@/services/errors";
import { feedAction, playAction } from "./actions";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockFeed = feedPokemon as ReturnType<typeof vi.fn>;
const mockPlay = playWithPokemon as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("feedAction()", () => {
  it("returns UNAUTHORIZED payload when session is missing", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await feedAction("up-1");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "AUTH",
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      },
    });
    expect(mockFeed).not.toHaveBeenCalled();
  });

  it("calls feedPokemon, revalidates layout, and returns events on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFeed.mockResolvedValue({ userPokemon: {}, events: [] });

    const result = await feedAction("up-1");

    expect(mockFeed).toHaveBeenCalledWith("user-1", "up-1");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(result).toEqual({ ok: true, data: { events: [] } });
  });

  it("maps NotOwnedError to GAMEPLAY/NOT_OWNED payload", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFeed.mockRejectedValue(new NotOwnedError());

    const result = await feedAction("up-1");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "NOT_OWNED",
        message: "Not found",
      },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps FaintedError to GAMEPLAY/FAINTED payload", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFeed.mockRejectedValue(new FaintedError());

    const result = await feedAction("up-1");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "FAINTED",
        message: "Pokémon has fainted",
      },
    });
  });

  it("maps CooldownError to GAMEPLAY/COOLDOWN payload with cooldownEndsAt in metadata", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const endsAt = new Date("2024-06-01T12:30:00.000Z");
    mockFeed.mockRejectedValue(new CooldownError(endsAt));

    const result = await feedAction("up-1");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "COOLDOWN",
        message: "Action on cooldown",
        metadata: { cooldownEndsAt: "2024-06-01T12:30:00.000Z" },
      },
    });
  });

  it("returns SYSTEM/UNKNOWN payload for unexpected throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockFeed.mockRejectedValue(new Error("DB exploded"));

    const result = await feedAction("up-1");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "SYSTEM",
        code: "UNKNOWN",
        message: "Something went wrong",
      },
    });
  });
});

describe("playAction()", () => {
  it("returns UNAUTHORIZED payload when session is missing", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await playAction("up-1");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "AUTH",
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      },
    });
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it("calls playWithPokemon, revalidates layout, and returns events on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPlay.mockResolvedValue({ userPokemon: {}, events: [] });

    const result = await playAction("up-1");

    expect(mockPlay).toHaveBeenCalledWith("user-1", "up-1");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(result).toEqual({ ok: true, data: { events: [] } });
  });

  it("maps CooldownError to GAMEPLAY/COOLDOWN payload", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const endsAt = new Date("2024-06-01T12:20:00.000Z");
    mockPlay.mockRejectedValue(new CooldownError(endsAt));

    const result = await playAction("up-1");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "COOLDOWN",
        message: "Action on cooldown",
        metadata: { cooldownEndsAt: "2024-06-01T12:20:00.000Z" },
      },
    });
  });
});
