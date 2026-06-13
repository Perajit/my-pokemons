"use client";

import Link from "next/link";
import { HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReviveButton({
  reviveCount,
  isPending,
  onRevive,
}: {
  reviveCount: number;
  isPending: boolean;
  onRevive: () => void;
}) {
  if (reviveCount === 0) {
    return (
      <div className="flex flex-col items-center gap-1">
        <Button type="button" disabled>
          <HeartPulse className="size-4" aria-hidden />
          Revive
        </Button>
        <Link
          href="/shop"
          className="text-xs text-amber-700 underline-offset-2 hover:underline"
        >
          Get a Revive in the Shop
        </Link>
      </div>
    );
  }

  return (
    <Button type="button" onClick={onRevive} disabled={isPending}>
      <HeartPulse className="size-4" aria-hidden />
      {isPending ? "Reviving..." : `Revive ×${reviveCount}`}
    </Button>
  );
}
