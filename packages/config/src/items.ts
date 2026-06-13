export type ItemKey = "REVIVE";

// Fullness & mood a fainted Pokémon wakes up with after a Revive (heart → 50).
export const REVIVE_RESTORE_VALUE = 50;

export type ItemConfig = {
  key: ItemKey;
  name: string;
  description: string;
  price: number;
};

export const ITEM_CONFIG: readonly ItemConfig[] = [
  {
    key: "REVIVE",
    name: "Revive",
    description: "Wake a fainted Pokémon and restore it to 50% HP.",
    price: 150,
  },
];
