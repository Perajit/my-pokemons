import { useEffect, useState } from "react";
import type { Drumstick } from "lucide-react";
import { Button } from "@/components/ui/button";

function useCountdown(endsAt: Date | null): number {
  const [now, setNow] = useState(() => Date.now());
  const endsAtMs = endsAt?.getTime() ?? null;

  useEffect(() => {
    if (endsAtMs === null) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAtMs]);

  if (endsAtMs === null) {
    return 0;
  }
  return Math.max(0, Math.ceil((endsAtMs - now) / 1000));
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function ActionButton({
  label,
  Icon,
  cooldownEndsAt,
  isPending,
  onClick,
}: {
  label: string;
  Icon: typeof Drumstick;
  cooldownEndsAt: string | null;
  isPending: boolean;
  onClick: () => void;
}) {
  const endsAt = cooldownEndsAt ? new Date(cooldownEndsAt) : null;
  const remaining = useCountdown(endsAt);
  const onCooldown = remaining > 0;
  const disabled = onCooldown || isPending;

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full"
      aria-label={label}
    >
      <Icon className="size-4" aria-hidden />
      <span>{onCooldown ? formatCountdown(remaining) : label}</span>
    </Button>
  );
}
