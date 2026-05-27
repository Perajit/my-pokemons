import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { levelColor } from "./pokemon-levels";

export function HeartStat({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "lg";
}) {
  const rounded = Math.round(value);
  const color = levelColor(rounded);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-stone-700",
        size === "lg" ? "text-base" : "text-sm",
      )}
      aria-label={`Heart: ${rounded} of 100`}
    >
      <Heart
        className={cn(
          "fill-current",
          color,
          size === "lg" ? "size-5" : "size-4",
        )}
        aria-hidden
      />
      <span className="font-semibold tabular-nums">{rounded}</span>
    </span>
  );
}
