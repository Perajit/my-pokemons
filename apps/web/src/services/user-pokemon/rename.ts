import { db } from "@/lib/db";
import { NotOwnedError } from "../errors";

// Renames an owned Pokémon. Ownership is checked in the same statement: the
// updateMany matches no rows when the Pokémon isn't the user's, so we throw
// rather than touch another user's data.
export async function renamePokemon(
  userId: string,
  userPokemonId: string,
  nickname: string,
): Promise<void> {
  const result = await db.userPokemon.updateMany({
    where: { id: userPokemonId, userId },
    data: { nickname },
  });
  if (result.count === 0) {
    throw new NotOwnedError();
  }
}
