import type { Prisma } from "@my-pokemons/database";
import { db } from "@/lib/db";
import { NotFoundError } from "../errors";
import { spendCoins } from "../user";

// Shop read DTO for a Pokémon — the exact shape the product card renders.
export type ShopPokemonDto = {
  id: string;
  pokeApiId: number;
  name: string;
  description: string;
  price: number;
  userOwnedCount: number; // how many of this species the user owns (0 if none)
};

type ShopPokemonEntity = Prisma.PokemonGetPayload<{
  include: { userPokemons: { select: { id: true } } };
}>;

// catalog Pokemon (+ the user's owned rows) → shop read DTO.
function toShopPokemonDto(pokemon: ShopPokemonEntity): ShopPokemonDto {
  return {
    id: pokemon.id,
    pokeApiId: pokemon.pokeApiId,
    name: pokemon.name,
    description: pokemon.description,
    price: pokemon.price,
    userOwnedCount: pokemon.userPokemons.length,
  };
}

// The full Pokémon catalog with the given user's owned count merged in.
export async function getShopPokemonsDto(
  userId: string,
): Promise<ShopPokemonDto[]> {
  const pokemons = await db.pokemon.findMany({
    orderBy: { id: "asc" },
    include: { userPokemons: { where: { userId }, select: { id: true } } },
  });
  return pokemons.map(toShopPokemonDto);
}

// Buys a Pokémon: atomically deducts coins (race-safe via spendCoins) and
// creates the UserPokemon in the same transaction.
export async function buyPokemon(
  userId: string,
  pokemonId: string,
): Promise<void> {
  const pokemon = await db.pokemon.findUnique({ where: { id: pokemonId } });
  if (!pokemon) {
    throw new NotFoundError("Pokémon");
  }

  await db.$transaction(async (transaction) => {
    await spendCoins(transaction, userId, pokemon.price);
    await transaction.userPokemon.create({
      data: { userId, pokemonId, nickname: pokemon.name },
    });
  });
}
