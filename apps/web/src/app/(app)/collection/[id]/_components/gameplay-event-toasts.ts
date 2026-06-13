import { toast } from "sonner";
import {
  BOND_LEVEL_LABELS,
  type BondLevelKey,
} from "@my-pokemons/config/bond-levels";
import type { GameplayEvent } from "@/services/user-pokemon";

// One toast renderer per event type. The mapped type makes this exhaustive:
// adding a member to GameplayEvent without a renderer here is a compile error,
// and each renderer receives its narrowed event.
type GameplayToastRenderers = {
  [Type in GameplayEvent["type"]]: (
    event: Extract<GameplayEvent, { type: Type }>,
  ) => void;
};

const gameplayToastRenderers: GameplayToastRenderers = {
  pokemon_fed: (event) =>
    toast.success(`Fed ${event.pokemonName}! +${event.coinsEarned} coins`),
  pokemon_played: (event) =>
    toast.success(
      `Played with ${event.pokemonName}! +${event.coinsEarned} coins`,
    ),
  achievement_unlocked: (event) =>
    toast.success(
      `Earned: ${BOND_LEVEL_LABELS[event.achievementKey as BondLevelKey]} (+${event.coinsEarned} coins)`,
    ),
};

export function notifyGameplayEvents(events: GameplayEvent[]): void {
  for (const event of events) {
    // Single cast at the dispatch site — the standard discriminated-dispatch
    // idiom; the renderer definitions above stay fully type-safe.
    (gameplayToastRenderers[event.type] as (e: GameplayEvent) => void)(event);
  }
}
