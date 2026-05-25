const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequired(value: string, label: string): string | null {
  if (!value) {
    return `${label} is required`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) {
    return "Email is required";
  }
  if (!EMAIL_RE.test(email)) {
    return "Enter a valid email address";
  }
  return null;
}

export type PasswordRule = {
  key: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    key: "length",
    label: "At least 8 characters",
    test: (p) => p.length >= 8,
  },
  { key: "upper", label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { key: "number", label: "Number", test: (p) => /[0-9]/.test(p) },
  {
    key: "special",
    label: "Special character",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
] as const;

export function checkPasswordRules(password: string) {
  return PASSWORD_RULES.map((r) => ({ ...r, met: r.test(password) }));
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required";
  }
  const failed = checkPasswordRules(password).find((r) => !r.met);
  if (failed) {
    return `Password must satisfy: ${failed.label.toLowerCase()}`;
  }
  return null;
}
