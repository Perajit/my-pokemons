"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UnauthorizedError, ValidationError } from "@/services/errors";
import {
  feedPokemon,
  playWithPokemon,
  revivePokemon,
  renamePokemon,
  type GameplayEvent,
} from "@/services/user-pokemon";
import { runAction, type ActionResult } from "@/lib/action-result";
import { validateNickname } from "./validation";

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

export async function reviveAction(
  userPokemonId: string,
): Promise<ActionResult<{ events: GameplayEvent[] }>> {
  return runAction(async () => {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    const result = await revivePokemon(session.user.id, userPokemonId);
    revalidatePath("/", "layout");
    return { events: result.events };
  });
}

export async function renameAction(
  userPokemonId: string,
  nickname: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    const error = validateNickname(nickname);
    if (error) {
      throw new ValidationError(error, "INVALID_NICKNAME");
    }
    await renamePokemon(session.user.id, userPokemonId, nickname.trim());
    revalidatePath("/", "layout");
  });
}
