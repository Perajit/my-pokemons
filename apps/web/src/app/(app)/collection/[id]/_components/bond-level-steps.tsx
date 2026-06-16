import { cn } from "@/lib/utils";
import {
  BOND_LEVEL_CONFIG,
  BOND_LEVEL_LABELS,
  type BondLevelKey,
} from "@my-pokemons/config/bond-levels";
import {
  Crown,
  HeartHandshake,
  PawPrint,
  ShieldCheck,
  Sprout,
  type LucideIcon,
} from "lucide-react";

// Per-tier icon + accent colour. Lives here (web layer) because lucide icons
// can't be referenced from the framework-agnostic packages/config.
const BOND_LEVEL_VISUALS: Record<
  BondLevelKey,
  { Icon: LucideIcon; color: string }
> = {
  BOND_LEVEL_0D: { Icon: Sprout, color: "text-emerald-500" },
  BOND_LEVEL_7D: { Icon: PawPrint, color: "text-sky-500" },
  BOND_LEVEL_30D: { Icon: HeartHandshake, color: "text-purple-500" },
  BOND_LEVEL_90D: { Icon: ShieldCheck, color: "text-amber-500" },
  BOND_LEVEL_365D: { Icon: Crown, color: "text-rose-500" },
};

// Bond level tiers as a progression of steps. Mobile-first: a centered vertical
// timeline by default, overridden to a full-width horizontal track on sm+.
export function BondLevelSteps({ earned }: { earned: BondLevelKey[] }) {
  const earnedSet = new Set(earned);
  const sortedLevels = [...BOND_LEVEL_CONFIG].sort((a, b) => a.days - b.days);

  return (
    <ol
      className="mx-auto flex w-fit flex-col gap-3 sm:mx-0 sm:w-full sm:flex-row sm:gap-0"
      aria-label="Bond levels"
    >
      {sortedLevels.map((level, index) => {
        const isEarned = earnedSet.has(level.key);
        const { Icon, color } = BOND_LEVEL_VISUALS[level.key];
        const label = BOND_LEVEL_LABELS[level.key];
        return (
          <li
            key={level.key}
            data-earned={isEarned}
            aria-label={`${label} (${isEarned ? "earned" : "locked"})`}
            className="relative flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-1.5 sm:text-center"
          >
            {/* Connector into this node from the previous one. Filled when this
                tier is reached, so the track fills up to current progress.
                Vertical by default (mobile), horizontal on sm+. */}
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute -translate-x-1/2",
                  "-top-3 left-5 h-3 w-0.5",
                  "sm:top-5 sm:left-0 sm:h-0.5 sm:w-full sm:-translate-y-1/2",
                  isEarned ? "bg-amber-300" : "bg-stone-200",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-2 transition-colors",
                isEarned
                  ? "border-stone-400/50 bg-white"
                  : "border-stone-300/50 bg-stone-50",
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  "size-5",
                  isEarned ? color : "text-stone-400 opacity-40 grayscale",
                )}
              />
            </span>
            <span className="flex flex-col items-start text-left sm:items-center sm:text-center">
              <span
                className={cn(
                  "text-xs leading-tight font-medium",
                  isEarned ? "text-stone-600" : "text-stone-400",
                )}
              >
                {label}
              </span>
              <span
                className={cn(
                  "text-[12px] leading-tight",
                  isEarned ? "text-stone-600" : "text-stone-400",
                )}
              >
                {level.days === 0 ? "New" : `${level.days}d`}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
