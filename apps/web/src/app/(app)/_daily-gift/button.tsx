"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import type { DailyGiftStatusDto } from "@/services/user";
import { DailyGiftModal } from "./modal";

export function DailyGiftButton({
  status,
  onClaimed,
}: {
  status: DailyGiftStatusDto;
  onClaimed: () => void;
}) {
  const [open, setOpen] = useState(false);

  // Single source of truth: the dot follows the server's availableNow. The
  // parent (AppHeader) optimistically flips it to false on claim and revalidates,
  // so there is no local "claimed" flag to drift out of sync across days.
  const showDot = status.availableNow;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Daily gift"
        className="relative shrink-0 cursor-pointer rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <Gift className="size-5" aria-hidden />
        {showDot && (
          <span
            aria-label="Gift available"
            className="absolute top-0.5 right-0.5 size-2 rounded-full bg-amber-500 animate-pulse"
          />
        )}
      </button>
      <DailyGiftModal
        open={open}
        onClose={() => setOpen(false)}
        onClaimed={onClaimed}
        status={status}
      />
    </>
  );
}
