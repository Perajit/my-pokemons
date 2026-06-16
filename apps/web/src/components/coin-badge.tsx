import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";

type Size = "sm" | "md";

const SIZE_STYLES: Record<Size, { container: string; icon: string }> = {
  sm: {
    container: "gap-1 px-2.5 py-1 text-sm font-semibold",
    icon: "size-3.5",
  },
  md: { container: "gap-1.5 px-3 py-1.5 text-base font-bold", icon: "size-4" },
};

export function CoinBadge({
  value,
  label,
  size = "md",
}: {
  value: number;
  label: string;
  size?: Size;
}) {
  const style = SIZE_STYLES[size];

  return (
    <span
      aria-label={`${label}: ${value} coins`}
      className={cn(
        "shrink-0 inline-flex items-center rounded-full bg-amber-50 leading-none tabular-nums text-amber-800 ring-2 ring-amber-300 ring-inset",
        style.container,
      )}
    >
      <Coins className={cn(style.icon)} aria-hidden />
      <span className="relative top-px">{value}</span>
    </span>
  );
}
