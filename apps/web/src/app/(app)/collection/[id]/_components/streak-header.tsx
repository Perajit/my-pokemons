export function StreakHeader({ activeDays }: { activeDays: number }) {
  const label = activeDays === 1 ? "day streak" : "days streak";
  return (
    <p className="text-xs uppercase tracking-wide text-amber-700/80">
      {activeDays} {label}
    </p>
  );
}
