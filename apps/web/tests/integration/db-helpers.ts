import type {
  Prisma,
  Item,
  Pokemon,
  User,
  UserItem,
  UserPokemon,
} from "@my-pokemons/database";
import { db } from "@/lib/db";

export function seedUser(data: Prisma.UserCreateInput): Promise<User> {
  return db.user.create({ data });
}

export function seedPokemon(data: Prisma.PokemonCreateInput): Promise<Pokemon> {
  return db.pokemon.create({ data });
}

export function seedItem(data: Prisma.ItemCreateInput): Promise<Item> {
  return db.item.create({ data });
}

// Unchecked variant: tests bind the row with raw userId/pokemonId foreign keys
// (the rows were just created). All state fields are optional — the schema
// defaults (60/60, null, 0, now) apply when omitted.
export function seedUserPokemon(
  data: Prisma.UserPokemonUncheckedCreateInput,
): Promise<UserPokemon> {
  return db.userPokemon.create({ data });
}

export function seedUserItem(
  data: Prisma.UserItemUncheckedCreateInput,
): Promise<UserItem> {
  return db.userItem.create({ data });
}

export async function resetGameplayTables(): Promise<void> {
  await db.userPokemonAchievement.deleteMany();
  await db.userItem.deleteMany();
  await db.userPokemon.deleteMany();
  await db.item.deleteMany();
  await db.pokemon.deleteMany();
  await db.user.deleteMany();
}
