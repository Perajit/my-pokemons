export type PokemonConfig = {
  pokeApiId: number;
  name: string;
  description: string;
  price: number;
  fullnessDecayPerHour: number;
  moodDecayPerHour: number;
  feedFullnessGain: number;
  feedCoinReward: number;
  playMoodGain: number;
  playCoinReward: number;
};

// The Pokémon catalog — seeded into the DB; the app reads it from the DB at runtime.
export const POKEMON_CONFIGS: readonly PokemonConfig[] = [
  {
    pokeApiId: 1,
    name: "Bulbasaur",
    description:
      "A strange seed was planted on its back at birth. The plant sprouts and grows with this Pokémon.",
    price: 250,
    fullnessDecayPerHour: 3,
    moodDecayPerHour: 3,
    feedFullnessGain: 18,
    feedCoinReward: 3,
    playMoodGain: 15,
    playCoinReward: 3,
  },
  {
    pokeApiId: 4,
    name: "Charmander",
    description:
      "The flame at the tip of its tail reflects its emotions. It flickers when it is enjoying itself.",
    price: 250,
    fullnessDecayPerHour: 3,
    moodDecayPerHour: 5,
    feedFullnessGain: 15,
    feedCoinReward: 3,
    playMoodGain: 22,
    playCoinReward: 4,
  },
  {
    pokeApiId: 7,
    name: "Squirtle",
    description:
      "After birth, its back swells and hardens into a shell. It powerfully sprays foam from its mouth.",
    price: 250,
    fullnessDecayPerHour: 5,
    moodDecayPerHour: 3,
    feedFullnessGain: 22,
    feedCoinReward: 4,
    playMoodGain: 15,
    playCoinReward: 3,
  },
  {
    pokeApiId: 25,
    name: "Pikachu",
    description:
      "It keeps its tail raised to monitor its surroundings. If you grab its tail, it will try to bite you.",
    price: 400,
    fullnessDecayPerHour: 3,
    moodDecayPerHour: 6,
    feedFullnessGain: 15,
    feedCoinReward: 3,
    playMoodGain: 28,
    playCoinReward: 5,
  },
  {
    pokeApiId: 133,
    name: "Eevee",
    description:
      "Its genetic code is irregular. It may mutate if it is exposed to radiation from element stones.",
    price: 500,
    fullnessDecayPerHour: 3,
    moodDecayPerHour: 3,
    feedFullnessGain: 20,
    feedCoinReward: 4,
    playMoodGain: 20,
    playCoinReward: 4,
  },
  {
    pokeApiId: 143,
    name: "Snorlax",
    description:
      "Very lazy. Just eats and sleeps. As its rotund bulk builds, it becomes steadily more slothful.",
    price: 800,
    fullnessDecayPerHour: 8,
    moodDecayPerHour: 2,
    feedFullnessGain: 35,
    feedCoinReward: 6,
    playMoodGain: 10,
    playCoinReward: 2,
  },
];
