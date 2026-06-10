export function calculateElapsedHours(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60);
}

export function applyDecay(
  value: number,
  decayPerHour: number,
  elapsedHours: number,
): number {
  return Math.max(0, value - decayPerHour * elapsedHours);
}

export function hasFainted(fullness: number, mood: number): boolean {
  return fullness === 0 && mood === 0;
}

// Hours for a stat to decay from `value` to 0 at `decayPerHour`.
// 0 if already empty; Infinity if it never decays (so it can't reach 0).
function hoursUntilZero(value: number, decayPerHour: number): number {
  if (value <= 0) {
    return 0;
  }
  if (decayPerHour <= 0) {
    return Infinity;
  }
  return value / decayPerHour;
}

export function computeDecayedState(
  currentFullness: number,
  currentMood: number,
  lastCalculatedAt: Date,
  fullnessDecayPerHour: number,
  moodDecayPerHour: number,
  now: Date,
): {
  currentFullness: number;
  currentMood: number;
  faintedAt: Date | null;
} {
  const elapsedHours = calculateElapsedHours(lastCalculatedAt, now);
  const newFullness = applyDecay(
    currentFullness,
    fullnessDecayPerHour,
    elapsedHours,
  );
  const newMood = applyDecay(currentMood, moodDecayPerHour, elapsedHours);
  // Faint requires BOTH stats at 0 → it happened at the later zero-crossing,
  // measured from lastCalculatedAt (not the lazy read time `now`).
  const faintHours = Math.max(
    hoursUntilZero(currentFullness, fullnessDecayPerHour),
    hoursUntilZero(currentMood, moodDecayPerHour),
  );
  return {
    currentFullness: newFullness,
    currentMood: newMood,
    faintedAt: hasFainted(newFullness, newMood)
      ? new Date(lastCalculatedAt.getTime() + faintHours * 60 * 60 * 1000)
      : null,
  };
}
