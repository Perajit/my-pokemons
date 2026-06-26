import type { Pokemon } from "@my-pokemons/database";
import { makePokemonData } from "@/test/fixtures";

// Shared test fixture: the one piece used by more than one sibling test file
// (mappers.test.ts and bond-levels.test.ts). Single-use builders live in
// their own test file.
export const basePokemon: Pokemon = {
  ...makePokemonData(),
  id: "poke-1",
};
