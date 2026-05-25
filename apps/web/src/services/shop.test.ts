import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    pokemon: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { InsufficientCoinsError, NotFoundError } from "./errors";
import { buyPokemon } from "./shop";

type TxClient = {
  user: { updateMany: ReturnType<typeof vi.fn> };
  userPokemon: { create: ReturnType<typeof vi.fn> };
};

function mockTransaction(updateCount: number): TxClient {
  const tx: TxClient = {
    user: { updateMany: vi.fn().mockResolvedValue({ count: updateCount }) },
    userPokemon: { create: vi.fn().mockResolvedValue({}) },
  };
  vi.mocked(
    db.$transaction as unknown as (
      fn: (tx: TxClient) => Promise<unknown>,
    ) => Promise<unknown>,
  ).mockImplementation(async (fn) => fn(tx));
  return tx;
}

describe("buyPokemon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws NotFoundError when pokemon does not exist", async () => {
    vi.mocked(db.pokemon.findUnique).mockResolvedValue(null);
    await expect(buyPokemon("user-id", "bad-id")).rejects.toThrow(
      NotFoundError,
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("debits coins and creates UserPokemon on success", async () => {
    vi.mocked(db.pokemon.findUnique).mockResolvedValue({
      id: "poke-id",
      price: 250,
    } as never);
    const tx = mockTransaction(1);

    await buyPokemon("user-id", "poke-id");

    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-id", coins: { gte: 250 } },
      data: { coins: { decrement: 250 } },
    });
    expect(tx.userPokemon.create).toHaveBeenCalledWith({
      data: { userId: "user-id", pokemonId: "poke-id" },
    });
  });

  it("throws InsufficientCoinsError when updateMany matches no rows", async () => {
    vi.mocked(db.pokemon.findUnique).mockResolvedValue({
      id: "poke-id",
      price: 250,
    } as never);
    const tx = mockTransaction(0);

    await expect(buyPokemon("user-id", "poke-id")).rejects.toThrow(
      InsufficientCoinsError,
    );
    expect(tx.userPokemon.create).not.toHaveBeenCalled();
  });
});
