export const MAX_DISPLAY_NAME_LENGTH = 32;

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Name is required";
  }
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return `Name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer`;
  }
  return null;
}
