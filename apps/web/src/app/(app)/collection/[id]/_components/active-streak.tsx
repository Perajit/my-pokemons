export function ActiveSteak({ activeStreak }: { activeStreak: number }) {
  const label = activeStreak === 1 ? "day streak" : "days streak";
  return (
    <p className="text-xs uppercase tracking-wide text-stone-500 font-semibold">
      {activeStreak} {label}
    </p>
  );
}
