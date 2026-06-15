export function ActiveSteak({ activeStreak }: { activeStreak: number }) {
  const label = activeStreak === 1 ? "day streak" : "days streak";
  return (
    <p className="text-xs uppercase tracking-wide text-amber-700/80">
      {activeStreak} {label}
    </p>
  );
}
