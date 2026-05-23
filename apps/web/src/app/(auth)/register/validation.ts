const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegisterInput(
  email: string,
  password: string,
): string | null {
  if (!email || !password) {
    return "Email and password required";
  }
  if (!EMAIL_RE.test(email)) {
    return "Invalid email address";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return null;
}
