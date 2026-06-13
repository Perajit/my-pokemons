// Shared test fixture: the one piece used by more than one sibling test file
// (mappers.test.ts and bond-levels.test.ts). Single-use builders live in
// their own test file.
export const basePokemon = {
  id: "poke-1",
  pokeApiId: 25,
  name: "Pikachu",
  description: "Electric mouse.",
  price: 400,
  fullnessDecayPerHour: 3,
  moodDecayPerHour: 6,
  feedFullnessGain: 15,
  feedCoinReward: 3,
  playMoodGain: 28,
  playCoinReward: 5,
};
