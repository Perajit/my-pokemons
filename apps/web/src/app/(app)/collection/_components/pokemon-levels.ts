export function levelColor(value: number): string {
  if (value >= 61) {
    return "text-emerald-700";
  }
  if (value >= 31) {
    return "text-amber-700";
  }
  return "text-rose-700";
}

export function fullnessLabel(value: number): string {
  if (value >= 81) {
    return "Stuffed";
  }
  if (value >= 61) {
    return "Full";
  }
  if (value >= 41) {
    return "Fine";
  }
  if (value >= 21) {
    return "Hungry";
  }
  return "Starving";
}

export function moodLabel(value: number): string {
  if (value >= 81) {
    return "Excited";
  }
  if (value >= 61) {
    return "Happy";
  }
  if (value >= 41) {
    return "Calm";
  }
  if (value >= 21) {
    return "Upset";
  }
  return "Sad";
}
