import { cn } from "@/lib/utils";

export function initialsFrom(name: string | null, email: string): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const tokens = trimmedName.split(/\s+/);
    const first = tokens[0]?.[0] ?? "";
    const last = tokens.length > 1 ? (tokens[tokens.length - 1][0] ?? "") : "";
    return (first + last).toUpperCase();
  }
  return (email.trim()[0] ?? "?").toUpperCase();
}

export function UserAvatar({
  name,
  email,
  className,
}: {
  name: string | null;
  email: string;
  className?: string;
}) {
  const initials = initialsFrom(name, email);

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full border-[2px] border-amber-400 bg-amber-300 font-heading text-sm font-semibold leading-none text-amber-900",
        className,
      )}
    >
      {initials}
    </span>
  );
}
