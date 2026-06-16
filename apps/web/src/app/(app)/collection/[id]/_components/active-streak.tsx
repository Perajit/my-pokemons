export function ActiveSteak({ activeStreak }: { activeStreak: number }) {
  const label =
    activeStreak === 0
      ? "< 1 day streak"
      : activeStreak === 1
        ? "1 day streak"
        : `${activeStreak} days streak`;

  return (
    <p className="text-xs uppercase tracking-wide text-stone-500 font-semibold">
      {label}
    </p>
  );
}
