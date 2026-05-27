"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/services/errors";
import { buyPokemon } from "@/services/shop";
import { runAction, type ActionResult } from "@/lib/action-result";

export async function buyPokemonAction(
  pokemonId: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    await buyPokemon(session.user.id, pokemonId);
    revalidatePath("/", "layout");
  });
}
