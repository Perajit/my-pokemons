import { POKEMON_CONFIGS } from "@my-pokemons/config/pokemons";
import { ITEM_CONFIGS } from "@my-pokemons/config/items";
import { db } from "../src";

async function main() {
  for (const pokemon of POKEMON_CONFIGS) {
    await db.pokemon.upsert({
      where: { pokeApiId: pokemon.pokeApiId },
      create: pokemon,
      update: pokemon,
    });
  }
  console.log(`Seeded ${POKEMON_CONFIGS.length} Pokémon`);

  for (const item of ITEM_CONFIGS) {
    await db.item.upsert({
      where: { key: item.key },
      create: item,
      update: item,
    });
  }
  console.log(`Seeded ${ITEM_CONFIGS.length} items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
