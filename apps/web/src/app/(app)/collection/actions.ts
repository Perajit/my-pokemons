"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/services/errors";
import { feedPokemon, playWithPokemon } from "@/services/pokemon";
import { runAction, type ActionResult } from "@/lib/action-result";

export async function feedAction(userPokemonId: string): Promise<ActionResult> {
  return runAction(async () => {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    await feedPokemon(session.user.id, userPokemonId);
    revalidatePath("/", "layout");
  });
}

export async function playAction(userPokemonId: string): Promise<ActionResult> {
  return runAction(async () => {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    await playWithPokemon(session.user.id, userPokemonId);
    revalidatePath("/", "layout");
  });
}
