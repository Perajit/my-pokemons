"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DailyGiftReward, DailyGiftStatusDto } from "@/services/user";
import { Coins, Gift, HeartPulse, PackageOpen } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { claimDailyGiftAction } from "./actions";

type AnimState = "idle" | "shaking" | "opening" | "revealed";

type RewardLabelRenderers = {
  [Type in DailyGiftReward["type"]]: (
    reward: Extract<DailyGiftReward, { type: Type }>,
  ) => string;
};

const rewardLabelRenderers: RewardLabelRenderers = {
  coins: (reward) => `+${reward.amount} coins`,
  item: (reward) => `×${reward.quantity} Revive`,
};

function rewardLabel(reward: DailyGiftReward): string {
  return (rewardLabelRenderers[reward.type] as (r: DailyGiftReward) => string)(
    reward,
  );
}

function formatCountdown(target: Date, now: Date): string {
  const remainingMs = target.getTime() - now.getTime();
  if (remainingMs <= 0) {
    return "now";
  }
  const totalMinutes = Math.floor(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function DailyGiftModal({
  open,
  onClose,
  onClaimed,
  status,
}: {
  open: boolean;
  onClose: () => void;
  onClaimed: () => void;
  status: DailyGiftStatusDto;
}) {
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [reward, setReward] = useState<DailyGiftReward | null>(null);
  const actionResultRef = useRef<Promise<
    Awaited<ReturnType<typeof claimDailyGiftAction>>
  > | null>(null);

  function handleOpen() {
    setAnimState("shaking");

    // Fire the action concurrently so network time overlaps with the animation.
    actionResultRef.current = claimDailyGiftAction();

    setTimeout(() => {
      setAnimState("opening");

      setTimeout(async () => {
        const result = await actionResultRef.current!;
        if (!result.ok) {
          toast.error(result.error.message);
          setAnimState("idle");
          return;
        }
        setReward(result.data.reward);
        setAnimState("revealed");
      }, 500);
    }, 900);
  }

  function handleClose() {
    setAnimState("idle");
    setReward(null);
    onClose();
  }

  function handleCollect() {
    onClaimed();
    handleClose();
  }

  const nextGiftAt = status.nextGiftAvailableAt
    ? new Date(status.nextGiftAvailableAt)
    : null;
  const countdown = nextGiftAt ? formatCountdown(nextGiftAt, new Date()) : null;

  // Stay in the animation branch if animState !== "idle" so that a mid-animation
  // layout re-fetch (caused by revalidatePath in claimDailyGiftAction) doesn't
  // flip the modal to the claimed branch before the reward reveal plays through.
  const showClaimedState = !status.availableNow && animState === "idle";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
    >
      <DialogContent className="top-0 left-0 h-svh w-screen max-w-none translate-x-0 translate-y-0 rounded-none sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-center font-heading text-2xl font-semibold text-amber-800">
            Daily Gift
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {showClaimedState ? (
            <>
              <div className="flex size-44 items-center justify-center rounded-full bg-stone-100">
                <Gift className="size-24 text-stone-400" aria-hidden />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-stone-700">
                  Come back tomorrow
                </p>
                {countdown && (
                  <p className="text-xs text-stone-500">
                    Resets in {countdown}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </>
          ) : (
            <>
              {animState === "revealed" ? (
                <div className="flex size-44 items-center justify-center rounded-full bg-gradient-to-b from-amber-100/80 to-transparent">
                  <PackageOpen className="size-24 text-amber-600" aria-hidden />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpen}
                  disabled={animState === "shaking" || animState === "opening"}
                  aria-label="Open gift"
                  className="flex size-44 cursor-pointer items-center justify-center rounded-full bg-gradient-to-b from-amber-100/80 to-transparent transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  style={
                    animState === "opening"
                      ? { animation: "gift-burst 0.5s ease-out" }
                      : undefined
                  }
                >
                  {animState === "opening" ? (
                    <PackageOpen
                      className="size-24 text-amber-600"
                      aria-hidden
                      style={{ animation: "gift-open 0.5s ease-out" }}
                    />
                  ) : (
                    <Gift
                      className="size-24 text-amber-600"
                      aria-hidden
                      style={
                        animState === "shaking"
                          ? { animation: "shake 0.9s ease-in-out" }
                          : undefined
                      }
                    />
                  )}
                </button>
              )}

              <div className="flex w-full flex-col items-center gap-3">
                {(animState === "idle" || animState === "shaking") && (
                  <p className="text-center text-sm text-stone-500">
                    Tap the gift to open!
                  </p>
                )}

                {animState === "revealed" && (
                  <>
                    <div
                      className="flex items-center gap-2"
                      style={{ animation: "reward-pop 0.5s ease-out both" }}
                    >
                      {reward!.type === "coins" ? (
                        <Coins className="size-5 text-amber-500" aria-hidden />
                      ) : (
                        <HeartPulse
                          className="size-5 text-rose-500"
                          aria-hidden
                        />
                      )}
                      <p className="font-heading text-xl font-semibold text-stone-600">
                        {rewardLabel(reward!)}
                      </p>
                    </div>
                    <p className="text-center text-sm text-stone-500">
                      Come back tomorrow for another gift.
                    </p>
                    <Button
                      type="button"
                      onClick={handleCollect}
                      className="w-full sm:w-auto"
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
