import type { BondLevelKey } from "@my-pokemons/config/bond-levels";

export type UserPokemonSnapshot = {
  id: string;
  nickname: string | null;
  currentFullness: number;
  currentMood: number;
  lastCalculatedAt: Date;
  acquiredAt: Date;
  faintedAt: Date | null;
  lastFedAt: Date | null;
  lastPlayedAt: Date | null;
  lastRevivedAt: Date | null;
  totalFaintedDurationMs: number;
  pokemon: {
    name: string;
    pokeApiId: number;
    feedCoinReward: number;
    playCoinReward: number;
    fullnessDecayPerHour: number;
    moodDecayPerHour: number;
  };
};

export type UserPokemon = {
  id: string;
  nickname: string;
  currentFullness: number;
  currentMood: number;
  lastCalculatedAt: Date;
  acquiredAt: Date;
  faintedAt: Date | null;
  lastFedAt: Date | null;
  lastPlayedAt: Date | null;
  pokemon: {
    name: string;
    pokeApiId: number;
    feedCoinReward: number;
    playCoinReward: number;
    fullnessDecayPerHour: number;
    moodDecayPerHour: number;
  };
  heart: number;
  activeStreak: number;
  isFainted: boolean;
  earnedBondLevels: BondLevelKey[];
  feedCooldownEndsAt: Date | null;
  playCooldownEndsAt: Date | null;
};

export type PokemonFedEvent = {
  type: "pokemon_fed";
  pokemonName: string;
  coinsEarned: number;
};

export type PokemonPlayedEvent = {
  type: "pokemon_played";
  pokemonName: string;
  coinsEarned: number;
};

export type AchievementUnlockedEvent = {
  type: "achievement_unlocked";
  achievementKey: string;
  coinsEarned: number;
};

export type PokemonRevivedEvent = {
  type: "pokemon_revived";
  pokemonName: string;
};

export type GameplayEvent =
  | PokemonFedEvent
  | PokemonPlayedEvent
  | AchievementUnlockedEvent
  | PokemonRevivedEvent;

export type GameplayActionResult = {
  userPokemon: UserPokemon;
  events: GameplayEvent[];
};

export type UserPokemonDto = {
  id: string;
  nickname: string;
  pokemon: {
    name: string;
    pokeApiId: number;
    fullnessDecayPerHour: number;
    moodDecayPerHour: number;
  };
  currentFullness: number;
  currentMood: number;
  lastCalculatedAt: string;
  heart: number;
  activeStreak: number;
  isFainted: boolean;
  acquiredAt: string;
  faintedAt: string | null;
  feedCooldownEndsAt: string | null;
  playCooldownEndsAt: string | null;
  earnedBondLevels: BondLevelKey[];
};
