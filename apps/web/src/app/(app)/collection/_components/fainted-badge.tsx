import { cn } from "@/lib/utils";
import { Skull } from "lucide-react";

type Size = "sm" | "md";

const SIZE_STYLES: Record<
  Size,
  { container: string; icon: string; height: string }
> = {
  sm: {
    container: "px-2.5 py-1 text-xs rounded-md",
    icon: "size-3",
    height: "h-6",
  },
  md: {
    container: "px-4 py-2 text-sm rounded-lg",
    icon: "size-3.5",
    height: "h-8",
  },
};

export function FaintedBadge({ size = "md" }: { size?: Size }) {
  const style = SIZE_STYLES[size];

  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-stone-200 text-stone-500 font-medium",
        style.container,
        style.height,
      )}
    >
      <Skull className={style.icon} aria-hidden />
      <span>Fainted</span>
    </div>
  );
}
