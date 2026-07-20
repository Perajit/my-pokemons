import { useNow } from "@/context/now-provider";
import { Button } from "@/components/ui/button";
import type { Drumstick } from "lucide-react";

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
  const now = useNow();
  const endsAt = cooldownEndsAt ? new Date(cooldownEndsAt) : null;
  const remaining = endsAt
    ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 1000))
    : 0;
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
