import { POKEMON_CONFIG } from "@my-pokemons/config/pokemons";
import { ITEM_CONFIG } from "@my-pokemons/config/items";
import { db } from "../src";

async function main() {
  for (const pokemon of POKEMON_CONFIG) {
    await db.pokemon.upsert({
      where: { pokeApiId: pokemon.pokeApiId },
      create: pokemon,
      update: pokemon,
    });
  }
  console.log(`Seeded ${POKEMON_CONFIG.length} Pokémon`);

  for (const item of ITEM_CONFIG) {
    await db.item.upsert({
      where: { key: item.key },
      create: item,
      update: item,
    });
  }
  console.log(`Seeded ${ITEM_CONFIG.length} items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
