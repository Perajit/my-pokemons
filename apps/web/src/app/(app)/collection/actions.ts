"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/services/errors";
import {
  feedPokemon,
  playWithPokemon,
  type GameplayEvent,
} from "@/services/user-pokemon";
import { runAction, type ActionResult } from "@/lib/action-result";

export async function feedAction(
  userPokemonId: string,
): Promise<ActionResult<{ events: GameplayEvent[] }>> {
  return runAction(async () => {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    const result = await feedPokemon(session.user.id, userPokemonId);
    revalidatePath("/", "layout");
    return { events: result.events };
  });
}

export async function playAction(
  userPokemonId: string,
): Promise<ActionResult<{ events: GameplayEvent[] }>> {
  return runAction(async () => {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    const result = await playWithPokemon(session.user.id, userPokemonId);
    revalidatePath("/", "layout");
    return { events: result.events };
  });
}
