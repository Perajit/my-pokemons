import type { ShopPokemonDto } from "@/services/shop";

// Shared shop-Pokémon fixture: used by both pokemon-card.test.tsx and
// pokemon-card-dialog.test.tsx. Single-use builders stay in their own file.
export const shopPokemon: ShopPokemonDto = {
  id: "pika-id",
  name: "Pikachu",
  pokeApiId: 25,
  description: "It keeps its tail raised.",
  price: 400,
  userOwnedCount: 2,
  feedFullnessGain: 15,
  feedCoinReward: 3,
  playMoodGain: 28,
  playCoinReward: 5,
  fullnessDecayPerHour: 3,
  moodDecayPerHour: 6,
};
