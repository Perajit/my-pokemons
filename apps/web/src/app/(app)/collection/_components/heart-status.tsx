import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { getStatusLevelColorClassnames } from "./status-levels";

export function HeartStatus({ value }: { value: number }) {
  const rounded = Math.round(value);
  const color = getStatusLevelColorClassnames(rounded).text;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-stone-500"
      aria-label={`Heart: ${rounded} of 100`}
    >
      <Heart className={cn("fill-current", color)} aria-hidden />
      <span className="text-lg font-semibold tabular-nums">
        {rounded} / 100
      </span>
    </span>
  );
}
