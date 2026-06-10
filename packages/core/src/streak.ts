// A pokemon is fainted iff faintedAt is set, so the streak ends at faintedAt
// when present, otherwise it's still counting up to now.
export function activeDays(
  acquiredAt: Date,
  faintedAt: Date | null,
  now: Date,
): number {
  const endDate = faintedAt ?? now;
  return Math.floor(
    (endDate.getTime() - acquiredAt.getTime()) / (1000 * 60 * 60 * 24),
  );
}
