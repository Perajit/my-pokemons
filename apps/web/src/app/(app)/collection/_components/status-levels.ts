type StatusLevel = "low" | "medium" | "high";
type StatusLevelColors = { text: string; bg: string };

const COLOR_CLASSNAMES_BY_STATUS_LEVEL: Record<StatusLevel, StatusLevelColors> =
  {
    low: { text: "text-rose-600", bg: "bg-rose-500" },
    medium: { text: "text-amber-500", bg: "bg-amber-400" },
    high: { text: "text-emerald-600", bg: "bg-emerald-500" },
  };

export function getStatusLevelColorClassnames(
  value: number,
): StatusLevelColors {
  if (value > 50) {
    return COLOR_CLASSNAMES_BY_STATUS_LEVEL["high"];
  }
  if (value > 20) {
    return COLOR_CLASSNAMES_BY_STATUS_LEVEL["medium"];
  }
  return COLOR_CLASSNAMES_BY_STATUS_LEVEL["low"];
}
