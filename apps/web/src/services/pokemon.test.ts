import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    userPokemon: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { NotOwnedError, FaintedError, CooldownError } from "./errors";
import {
  getMyPokemons,
  getMyPokemon,
  feedPokemon,
  playWithPokemon,
  toClientPokemon,
  type EnrichedUserPokemon,
} from "./pokemon";

const now = new Date("2024-06-01T12:00:00Z");

const basePokemon = {
  id: "poke-1",
  pokeApiId: 25,
  name: "Pikachu",
  description: "Electric mouse.",
  price: 400,
  fullnessDecayPerHour: 3,
  moodDecayPerHour: 6,
  feedFullnessGain: 15,
  feedCoinReward: 3,
  playMoodGain: 28,
  playCoinReward: 5,
};

function makeUserPokemon(overrides = {}) {
  return {
    id: "up-1",
    userId: "user-1",
    pokemonId: "poke-1",
    currentFullness: 60,
    currentMood: 60,
    isActive: true,
    faintedAt: null,
    lastFedAt: null,
    lastPlayedAt: null,
    lastCalculatedAt: new Date("2024-06-01T11:00:00Z"), // 1 hour before `now`
    acquiredAt: new Date("2024-05-31T12:00:00Z"), // 24h before `now`
    pokemon: basePokemon,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getMyPokemons", () => {
  it("applies 1h decay and computes heart and activeDays", async () => {
    const up = makeUserPokemon();
    vi.mocked(db.userPokemon.findMany).mockResolvedValue([up] as never);
    vi.mocked(db.userPokemon.update).mockResolvedValue({} as never);

    const result = await getMyPokemons("user-1");

    expect(result).toHaveLength(1);
    // 1h elapsed: fullness 60 - 3 = 57, mood 60 - 6 = 54
    expect(result[0].currentFullness).toBe(57);
    expect(result[0].currentMood).toBe(54);
    expect(result[0].heart).toBeCloseTo(0.6 * 57 + 0.4 * 54, 5);
    expect(result[0].activeDays).toBe(1);
  });

  it("persists synced state for active pokemon", async () => {
    const up = makeUserPokemon();
    vi.mocked(db.userPokemon.findMany).mockResolvedValue([up] as never);
    vi.mocked(db.userPokemon.update).mockResolvedValue({} as never);

    await getMyPokemons("user-1");

    expect(db.userPokemon.update).toHaveBeenCalledOnce();
    expect(db.userPokemon.update).toHaveBeenCalledWith({
      where: { id: "up-1" },
      data: expect.objectContaining({
        currentFullness: 57,
        currentMood: 54,
        isActive: true,
        lastCalculatedAt: now,
      }),
    });
  });

  it("marks pokemon fainted when decay drops both stats to 0", async () => {
    const up = makeUserPokemon({
      currentFullness: 1,
      currentMood: 1,
      lastCalculatedAt: new Date("2024-06-01T11:00:00Z"), // 1h ago, decay 3+6 > 1
    });
    vi.mocked(db.userPokemon.findMany).mockResolvedValue([up] as never);
    vi.mocked(db.userPokemon.update).mockResolvedValue({} as never);

    const result = await getMyPokemons("user-1");

    expect(result[0].isActive).toBe(false);
    expect(result[0].faintedAt).toEqual(now);
    expect(db.userPokemon.update).toHaveBeenCalledWith({
      where: { id: "up-1" },
      data: expect.objectContaining({
        isActive: false,
        faintedAt: now,
        currentFullness: 0,
        currentMood: 0,
      }),
    });
  });

  it("skips sync update for already-fainted pokemon", async () => {
    const faintedAt = new Date("2024-05-31T18:00:00Z");
    const up = makeUserPokemon({
      isActive: false,
      faintedAt,
      currentFullness: 0,
      currentMood: 0,
    });
    vi.mocked(db.userPokemon.findMany).mockResolvedValue([up] as never);

    const result = await getMyPokemons("user-1");

    expect(db.userPokemon.update).not.toHaveBeenCalled();
    expect(result[0].isActive).toBe(false);
    expect(result[0].heart).toBe(0);
  });

  it("counts activeDays up to faintedAt for fainted pokemon", async () => {
    const up = makeUserPokemon({
      isActive: false,
      faintedAt: new Date("2024-06-01T12:00:00Z"),
      acquiredAt: new Date("2024-05-29T12:00:00Z"), // 3 days before fainted
      currentFullness: 0,
      currentMood: 0,
    });
    vi.mocked(db.userPokemon.findMany).mockResolvedValue([up] as never);

    const result = await getMyPokemons("user-1");

    expect(result[0].activeDays).toBe(3);
  });

  it("returns empty array when user has no pokemon", async () => {
    vi.mocked(db.userPokemon.findMany).mockResolvedValue([] as never);

    const result = await getMyPokemons("user-1");

    expect(result).toEqual([]);
    expect(db.userPokemon.update).not.toHaveBeenCalled();
  });
});

describe("getMyPokemon", () => {
  it("returns enriched pokemon for the owner", async () => {
    const up = makeUserPokemon();
    vi.mocked(db.userPokemon.findUnique).mockResolvedValue(up as never);
    vi.mocked(db.userPokemon.update).mockResolvedValue({} as never);

    const result = await getMyPokemon("user-1", "up-1");

    expect(result.id).toBe("up-1");
    expect(result.heart).toBeCloseTo(0.6 * 57 + 0.4 * 54, 5);
  });

  it("throws NotOwnedError when pokemon does not belong to the user", async () => {
    const up = makeUserPokemon({ userId: "other-user" });
    vi.mocked(db.userPokemon.findUnique).mockResolvedValue(up as never);

    await expect(getMyPokemon("user-1", "up-1")).rejects.toThrow(NotOwnedError);
    expect(db.userPokemon.update).not.toHaveBeenCalled();
  });

  it("throws NotOwnedError when pokemon does not exist", async () => {
    vi.mocked(db.userPokemon.findUnique).mockResolvedValue(null);

    await expect(getMyPokemon("user-1", "up-1")).rejects.toThrow(NotOwnedError);
  });
});

type TxStub = {
  userPokemon: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  user: { update: ReturnType<typeof vi.fn> };
};

function makeTx(): TxStub {
  return {
    userPokemon: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    user: { update: vi.fn() },
  };
}

function wireTransaction(tx: TxStub) {
  vi.mocked(
    db.$transaction as unknown as (
      cb: (tx: TxStub) => Promise<unknown>,
    ) => Promise<unknown>,
  ).mockImplementation((cb) => cb(tx));
}

describe("feedPokemon", () => {
  it("throws NotOwnedError when the pokemon is not owned by the user", async () => {
    const tx = makeTx();
    tx.userPokemon.findUnique.mockResolvedValue(
      makeUserPokemon({ userId: "other-user" }),
    );
    wireTransaction(tx);

    await expect(feedPokemon("user-1", "up-1")).rejects.toThrow(NotOwnedError);
    expect(tx.userPokemon.updateMany).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("throws FaintedError when the pokemon is already inactive", async () => {
    const tx = makeTx();
    tx.userPokemon.findUnique.mockResolvedValue(
      makeUserPokemon({ isActive: false }),
    );
    wireTransaction(tx);

    await expect(feedPokemon("user-1", "up-1")).rejects.toThrow(FaintedError);
    expect(tx.userPokemon.updateMany).not.toHaveBeenCalled();
  });

  it("persists faint state and throws FaintedError when decay drops both stats to 0", async () => {
    const tx = makeTx();
    tx.userPokemon.findUnique.mockResolvedValue(
      makeUserPokemon({
        currentFullness: 1,
        currentMood: 1,
        lastCalculatedAt: new Date("2024-06-01T11:00:00Z"),
      }),
    );
    wireTransaction(tx);

    await expect(feedPokemon("user-1", "up-1")).rejects.toThrow(FaintedError);
    expect(tx.userPokemon.update).toHaveBeenCalledWith({
      where: { id: "up-1" },
      data: {
        currentFullness: 0,
        currentMood: 0,
        isActive: false,
        faintedAt: now,
        lastCalculatedAt: now,
      },
    });
    expect(tx.userPokemon.updateMany).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("throws CooldownError when within cooldown window", async () => {
    const tx = makeTx();
    const lastFedAt = new Date("2024-06-01T11:50:00Z"); // 10 min ago < 30 min
    tx.userPokemon.findUnique.mockResolvedValue(makeUserPokemon({ lastFedAt }));
    wireTransaction(tx);

    await expect(feedPokemon("user-1", "up-1")).rejects.toThrow(CooldownError);
    expect(tx.userPokemon.updateMany).not.toHaveBeenCalled();
  });

  it("attaches cooldownEndsAt to the thrown CooldownError", async () => {
    const tx = makeTx();
    const lastFedAt = new Date("2024-06-01T11:50:00Z");
    tx.userPokemon.findUnique.mockResolvedValue(makeUserPokemon({ lastFedAt }));
    wireTransaction(tx);

    try {
      await feedPokemon("user-1", "up-1");
      expect.fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(CooldownError);
      // 1800s after lastFedAt
      expect((err as CooldownError).cooldownEndsAt.toISOString()).toBe(
        "2024-06-01T12:20:00.000Z",
      );
    }
  });

  it("applies feed gain to fullness, preserves decayed mood, sets lastFedAt, credits coins", async () => {
    const tx = makeTx();
    const up = makeUserPokemon(); // 1h decay → fullness 57, mood 54
    tx.userPokemon.findUnique
      .mockResolvedValueOnce(up) // initial load
      .mockResolvedValueOnce({ ...up, currentFullness: 72, lastFedAt: now }); // fresh re-read
    tx.userPokemon.updateMany.mockResolvedValue({ count: 1 });
    tx.user.update.mockResolvedValue({});
    wireTransaction(tx);

    const result = await feedPokemon("user-1", "up-1");

    expect(tx.userPokemon.updateMany).toHaveBeenCalledWith({
      where: {
        id: "up-1",
        OR: [{ lastFedAt: null }, { lastFedAt: { lt: expect.any(Date) } }],
      },
      data: {
        currentFullness: 72, // applyFeed(57, 15)
        currentMood: 54,
        lastFedAt: now,
        lastCalculatedAt: now,
      },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { coins: { increment: 3 } }, // feedCoinReward = 3
    });
    expect(result.currentFullness).toBe(72);
  });

  it("throws CooldownError when updateMany count is 0 (race lost)", async () => {
    const tx = makeTx();
    const up = makeUserPokemon();
    const winnerLastFedAt = new Date("2024-06-01T12:00:00Z"); // race winner just set this
    tx.userPokemon.findUnique
      .mockResolvedValueOnce(up)
      .mockResolvedValueOnce({ ...up, lastFedAt: winnerLastFedAt });
    tx.userPokemon.updateMany.mockResolvedValue({ count: 0 });
    wireTransaction(tx);

    try {
      await feedPokemon("user-1", "up-1");
      expect.fail("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(CooldownError);
      expect((err as CooldownError).cooldownEndsAt.toISOString()).toBe(
        "2024-06-01T12:30:00.000Z",
      );
    }
    expect(tx.user.update).not.toHaveBeenCalled();
  });
});

describe("playWithPokemon", () => {
  it("applies play gain to mood, preserves decayed fullness, sets lastPlayedAt, credits coins", async () => {
    const tx = makeTx();
    const up = makeUserPokemon(); // 1h decay → fullness 57, mood 54
    tx.userPokemon.findUnique
      .mockResolvedValueOnce(up)
      .mockResolvedValueOnce({ ...up, currentMood: 82, lastPlayedAt: now });
    tx.userPokemon.updateMany.mockResolvedValue({ count: 1 });
    tx.user.update.mockResolvedValue({});
    wireTransaction(tx);

    const result = await playWithPokemon("user-1", "up-1");

    expect(tx.userPokemon.updateMany).toHaveBeenCalledWith({
      where: {
        id: "up-1",
        OR: [
          { lastPlayedAt: null },
          { lastPlayedAt: { lt: expect.any(Date) } },
        ],
      },
      data: {
        currentFullness: 57,
        currentMood: 82, // applyPlay(54, 28)
        lastPlayedAt: now,
        lastCalculatedAt: now,
      },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { coins: { increment: 5 } }, // playCoinReward = 5
    });
    expect(result.currentMood).toBe(82);
  });

  it("throws CooldownError when within play cooldown window", async () => {
    const tx = makeTx();
    const lastPlayedAt = new Date("2024-06-01T11:55:00Z"); // 5 min ago < 20 min
    tx.userPokemon.findUnique.mockResolvedValue(
      makeUserPokemon({ lastPlayedAt }),
    );
    wireTransaction(tx);

    await expect(playWithPokemon("user-1", "up-1")).rejects.toThrow(
      CooldownError,
    );
  });
});

describe("toClientPokemon", () => {
  function makeEnriched(
    overrides: Partial<EnrichedUserPokemon> = {},
  ): EnrichedUserPokemon {
    return {
      id: "up-1",
      userId: "user-1",
      pokemonId: "poke-1",
      currentFullness: 60,
      currentMood: 60,
      isActive: true,
      faintedAt: null,
      lastFedAt: null,
      lastPlayedAt: null,
      lastCalculatedAt: new Date("2024-06-01T12:00:00Z"),
      acquiredAt: new Date("2024-05-31T12:00:00Z"),
      pokemon: basePokemon,
      heart: 60,
      activeDays: 1,
      feedCooldownEndsAt: null,
      playCooldownEndsAt: null,
      ...overrides,
    };
  }

  it("serializes all Date fields to ISO strings when present", () => {
    const result = toClientPokemon(
      makeEnriched({
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
    const result = toClientPokemon(makeEnriched());

    expect(result.faintedAt).toBeNull();
    expect(result.feedCooldownEndsAt).toBeNull();
    expect(result.playCooldownEndsAt).toBeNull();
  });

  it("copies per-species feed and play coin rewards through to the client", () => {
    const result = toClientPokemon(makeEnriched());

    expect(result.feedCoinReward).toBe(basePokemon.feedCoinReward);
    expect(result.playCoinReward).toBe(basePokemon.playCoinReward);
  });
});
