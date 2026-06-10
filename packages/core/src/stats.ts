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
