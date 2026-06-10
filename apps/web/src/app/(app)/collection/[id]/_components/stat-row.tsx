import type { Drumstick } from "lucide-react";
import { cn } from "@/lib/utils";
import { levelColor } from "@/app/(app)/collection/_components/pokemon-levels";

export function StatRow({
  label,
  value,
  tier,
  Icon,
}: {
  label: string;
  value: number;
  tier: string;
  Icon: typeof Drumstick;
}) {
  const rounded = Math.round(value);
  return (
    <div
      className="flex w-full items-center gap-3 text-sm text-stone-700"
      aria-label={`${label}: ${rounded} of 100`}
    >
      <Icon
        className={cn("size-5 shrink-0", levelColor(rounded))}
        aria-hidden
      />
      <span className="flex-1 text-left text-xs uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <span className="font-semibold tabular-nums">{rounded}</span>
      <span className="w-16 text-right text-xs text-stone-500">{tier}</span>
    </div>
  );
}
