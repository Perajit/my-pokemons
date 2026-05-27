import { db } from "@/lib/db";
import { InsufficientCoinsError, NotFoundError } from "./errors";

export async function buyPokemon(
  userId: string,
  pokemonId: string,
): Promise<void> {
  const pokemon = await db.pokemon.findUnique({ where: { id: pokemonId } });
  if (!pokemon) {
    throw new NotFoundError("Pokémon");
  }

  await db.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id: userId, coins: { gte: pokemon.price } },
      data: { coins: { decrement: pokemon.price } },
    });
    if (result.count === 0) {
      throw new InsufficientCoinsError();
    }
    await tx.userPokemon.create({ data: { userId, pokemonId } });
  });
}
