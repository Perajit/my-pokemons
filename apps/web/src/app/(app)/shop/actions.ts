"use server";

import { revalidatePath } from "next/cache";
import type { ItemKey } from "@my-pokemons/config/items";
import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/services/errors";
import { buyPokemon, buyItem } from "@/services/shop";
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

export async function buyItemAction(itemKey: ItemKey): Promise<ActionResult> {
  return runAction(async () => {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    await buyItem(session.user.id, itemKey);
    revalidatePath("/", "layout");
  });
}
