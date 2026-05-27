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

export function calculateHeart(fullness: number, mood: number): number {
  return 0.6 * fullness + 0.4 * mood;
}

export function applyFeed(
  currentFullness: number,
  feedFullnessGain: number,
): number {
  return Math.min(100, currentFullness + feedFullnessGain);
}

export function applyPlay(currentMood: number, playMoodGain: number): number {
  return Math.min(100, currentMood + playMoodGain);
}

export function isOnCooldown(
  lastActionAt: Date | null,
  cooldownSeconds: number,
  now: Date,
): boolean {
  if (!lastActionAt) {
    return false;
  }
  return (now.getTime() - lastActionAt.getTime()) / 1000 < cooldownSeconds;
}

export function cooldownEndsAt(
  lastActionAt: Date | null,
  cooldownSeconds: number,
): Date | null {
  if (!lastActionAt) {
    return null;
  }
  return new Date(lastActionAt.getTime() + cooldownSeconds * 1000);
}
