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

describe("buyPokemonAction", () => {
  it("returns Unauthorized when session is missing", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await buyPokemonAction("poke-id");
    expect(result).toEqual({ ok: false, error: "Unauthorized" });
    expect(mockBuy).not.toHaveBeenCalled();
  });

  it("calls buyPokemon with userId and pokemonId on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockBuy.mockResolvedValue(undefined);

    const result = await buyPokemonAction("poke-id");

    expect(mockBuy).toHaveBeenCalledWith("user-1", "poke-id");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(result).toEqual({ ok: true });
  });

  it("returns not-found error for NotFoundError", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockBuy.mockRejectedValue(new NotFoundError());

    const result = await buyPokemonAction("poke-id");
    expect(result).toEqual({ ok: false, error: "Pokémon not found" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns insufficient-coins error for InsufficientCoinsError", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockBuy.mockRejectedValue(new InsufficientCoinsError());

    const result = await buyPokemonAction("poke-id");
    expect(result).toEqual({ ok: false, error: "Insufficient coins" });
  });

  it("returns generic error for unexpected throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockBuy.mockRejectedValue(new Error("DB exploded"));

    const result = await buyPokemonAction("poke-id");
    expect(result).toEqual({ ok: false, error: "Something went wrong" });
  });
});
