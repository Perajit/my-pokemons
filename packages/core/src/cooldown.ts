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
