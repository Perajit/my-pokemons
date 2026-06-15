import { cn } from "@/lib/utils";
import { getStatusLevelColorClassnames } from "../../_components/status-levels";

export function StatusBlock({
  label,
  value,
  action,
}: {
  label: string;
  value: number;
  action: React.ReactNode;
}) {
  const rounded = Math.round(value);
  const color = getStatusLevelColorClassnames(value).bg;

  return (
    <div
      className="flex flex-wrap items-center gap-4 bg-stone-100 border-stone-300 border rounded-lg p-3 sm:p-4"
      aria-label={`${label}: ${rounded} of 100`}
    >
      <div className="flex-1 flex flex-col gap-0.5 items-start">
        <div className="flex flex-wrap gap-1 text-xs">
          <span className="uppercase tracking-wide text-stone-600 font-semibold">
            {label}
          </span>
          <span className="tabular-nums text-stone-500">({rounded} / 100)</span>
        </div>
        <div className="w-full h-2 overflow-hidden rounded-full bg-stone-200 mt-0.5">
          <div
            className={cn("h-full rounded-full", color)}
            style={{ width: `${rounded}%` }}
          />
        </div>
      </div>
      <div className="shrink-0 w-20 sm:w-24">{action}</div>
    </div>
  );
}
