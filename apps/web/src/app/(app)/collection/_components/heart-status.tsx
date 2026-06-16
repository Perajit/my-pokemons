import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { getStatusLevelColor } from "./status-levels";

type Size = "sm" | "md";

const SIZE_STYLES: Record<Size, { container: string; icon: string }> = {
  sm: {
    container: "text-md h-6",
    icon: "size-3.5",
  },
  md: {
    container: "text-lg h-8",
    icon: "size-5 mb-0.5",
  },
};

export function HeartStatus({
  value,
  size = "md",
}: {
  value: number;
  size?: Size;
}) {
  const rounded = Math.round(value);
  const color = getStatusLevelColor(rounded).text;
  const style = SIZE_STYLES[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-stone-600 font-semibold",
        style.container,
      )}
      aria-label={`Heart: ${rounded} of 100`}
    >
      <Heart className={cn("fill-current", style.icon, color)} aria-hidden />
      <span className="tabular-nums">{rounded} / 100</span>
    </span>
  );
}
