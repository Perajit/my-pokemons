const DAY_MS = 1000 * 60 * 60 * 24;

// Display streak — resets to 0 on faint, otherwise counts whole days from the
// current alive run's start (the last revive, or acquire if never revived).
export function activeStreakDays(
  acquiredAt: Date,
  lastRevivedAt: Date | null,
  faintedAt: Date | null,
  now: Date,
): number {
  if (faintedAt !== null) {
    return 0;
  }
  const anchor = (lastRevivedAt ?? acquiredAt).getTime();
  return Math.floor((now.getTime() - anchor) / DAY_MS);
}

// Bond progression — cumulative whole alive days, excluding all fainted
// downtime; monotonic across faints/revives (downtime is folded into
// totalFaintedDurationMs on revive). Freezes at faintedAt while fainted.
export function bondActiveDays(
  acquiredAt: Date,
  faintedAt: Date | null,
  now: Date,
  totalFaintedDurationMs: number,
): number {
  const endMs = (faintedAt ?? now).getTime();
  const aliveMs = endMs - acquiredAt.getTime() - totalFaintedDurationMs;
  return Math.floor(aliveMs / DAY_MS);
}
