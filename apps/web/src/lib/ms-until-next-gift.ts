// Pure timer math for the daily-gift midnight trigger: how long until the gift
// becomes available again. Clamped to 0 so a past target fires the refresh
// immediately rather than scheduling a negative (instant-clamped) timeout.
export function msUntilNextGift(
  nextGiftAvailableAt: string,
  now: Date,
): number {
  const remainingMs = new Date(nextGiftAvailableAt).getTime() - now.getTime();
  return Math.max(0, remainingMs);
}
