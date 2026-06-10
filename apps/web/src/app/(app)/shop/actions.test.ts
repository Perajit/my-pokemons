import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/services/shop", () => ({ buyPokemon: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { buyPokemon } from "@/services/shop";
import { InsufficientCoinsError, NotFoundError } from "@/services/errors";
import { buyPokemonAction } from "./actions";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockBuy = buyPokemon as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buyPokemonAction()", () => {
  it("returns UNAUTHORIZED payload when session is missing", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await buyPokemonAction("poke-id");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "AUTH",
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      },
    });
    expect(mockBuy).not.toHaveBeenCalled();
  });

  it("calls buyPokemon and revalidates layout on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockBuy.mockResolvedValue(undefined);

    const result = await buyPokemonAction("poke-id");

    expect(mockBuy).toHaveBeenCalledWith("user-1", "poke-id");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(result).toEqual({ ok: true });
  });

  it("maps NotFoundError to SHOP/NOT_FOUND payload", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockBuy.mockRejectedValue(new NotFoundError("Pokémon"));

    const result = await buyPokemonAction("poke-id");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "SHOP",
        code: "NOT_FOUND",
        message: "Pokémon not found",
      },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps InsufficientCoinsError to SHOP/INSUFFICIENT_COINS payload", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockBuy.mockRejectedValue(new InsufficientCoinsError());

    const result = await buyPokemonAction("poke-id");

    expect(result).toEqual({
      ok: false,
      error: {
        type: "SHOP",
        code: "INSUFFICIENT_COINS",
        message: "Insufficient coins",
      },
    });
  });

  it("returns SYSTEM/UNKNOWN payload for unexpected throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockBuy.mockRejectedValue(new Error("DB exploded"));

    const result = await buyPokemonAction("poke-id");

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
