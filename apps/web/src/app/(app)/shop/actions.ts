"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { InsufficientCoinsError, NotFoundError } from "@/services/errors";
import { buyPokemon } from "@/services/shop";

export type BuyResult = { ok: true } | { ok: false; error: string };

export async function buyPokemonAction(pokemonId: string): Promise<BuyResult> {
  const session = await auth();
  if (!session) {
    return { ok: false, error: "Unauthorized" };
  }
  try {
    await buyPokemon(session.user.id, pokemonId);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    if (err instanceof NotFoundError) {
      return { ok: false, error: "Pokémon not found" };
    }
    if (err instanceof InsufficientCoinsError) {
      return { ok: false, error: "Insufficient coins" };
    }
    return { ok: false, error: "Something went wrong" };
  }
}
