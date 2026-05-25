import { cn } from "@/lib/utils";

export function Pokeball({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative aspect-square shrink-0 overflow-hidden rounded-full border-[3px] border-zinc-900 bg-white shadow-md",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1/2 bg-primary" />
      <div className="absolute inset-x-0 top-1/2 h-[14%] -translate-y-1/2 bg-zinc-900" />
      <div className="absolute top-1/2 left-1/2 size-[32%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-zinc-900 bg-white" />
    </div>
  );
}
