type StatusLevel = "low" | "medium" | "high";
type StatusLevelColor = { text: string; bg: string };

const STATUS_LEVEL_COLORS: Record<StatusLevel, StatusLevelColor> = {
  low: { text: "text-rose-600", bg: "bg-rose-500" },
  medium: { text: "text-amber-500", bg: "bg-amber-400" },
  high: { text: "text-emerald-600", bg: "bg-emerald-500" },
};

export function getStatusLevelColor(value: number): StatusLevelColor {
  if (value > 50) {
    return STATUS_LEVEL_COLORS["high"];
  }
  if (value > 20) {
    return STATUS_LEVEL_COLORS["medium"];
  }
  return STATUS_LEVEL_COLORS["low"];
}
