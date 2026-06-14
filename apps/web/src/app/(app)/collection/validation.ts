export const MAX_NICKNAME_LENGTH = 20;

export function validateNickname(nickname: string): string | null {
  const trimmed = nickname.trim();
  if (!trimmed) {
    return "Nickname is required";
  }
  if (trimmed.length > MAX_NICKNAME_LENGTH) {
    return `Nickname must be ${MAX_NICKNAME_LENGTH} characters or fewer`;
  }
  return null;
}
