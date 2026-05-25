import { cn } from "@/lib/utils";

export function PokeballWatermark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      className={cn("shrink-0", className)}
    >
      <path d="M 4 50 A 46 46 0 0 1 96 50 Z" fill="#ef4444" />
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="#171717"
        strokeWidth="6"
      />
      <line x1="4" y1="50" x2="96" y2="50" stroke="#171717" strokeWidth="6" />
      <circle
        cx="50"
        cy="50"
        r="14"
        fill="#ffffff"
        stroke="#171717"
        strokeWidth="6"
      />
    </svg>
  );
}
