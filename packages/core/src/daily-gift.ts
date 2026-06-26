import type {
  DailyGiftConfig,
  DailyGiftReward,
} from "@my-pokemons/config/daily-gift";

// "today" is the UTC calendar date — null lastClaimedAt means never claimed.
export function isDailyGiftAvailable(
  lastClaimedAt: Date | null,
  now: Date,
): boolean {
  if (lastClaimedAt === null) return true;
  return (
    lastClaimedAt.toISOString().slice(0, 10) < now.toISOString().slice(0, 10)
  );
}

// Next midnight UTC after lastClaimedAt — the moment the gift resets.
export function nextGiftAvailableAt(lastClaimedAt: Date): Date {
  const next = new Date(lastClaimedAt);
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

// Weighted random pick; caller injects `random` (0–1) for testability.
export function pickDailyGiftReward(
  options: readonly DailyGiftConfig[],
  random: number,
): DailyGiftReward {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  let threshold = random * totalWeight;
  for (const option of options) {
    threshold -= option.weight;
    if (threshold <= 0) return option.reward;
  }
  return options[options.length - 1].reward;
}
