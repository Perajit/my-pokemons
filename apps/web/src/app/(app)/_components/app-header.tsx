"use client";

import { CoinBadge } from "@/components/coin-badge";
import { useLayoutState } from "@/hooks/use-layout-state";
import type { MeDto } from "@/services/me";
import { DailyGiftButton } from "../_daily-gift/button";
import { UserMenu } from "../_user-menu/menu";

// Client owner of the live header state. Server layout renders it once with
// SSR data; from there SWR keeps coins and the daily-gift dot fresh (focus +
// midnight timer) without a reload.
export function AppHeader({ initial }: { initial: MeDto }) {
  const { state, mutate } = useLayoutState(initial);

  // Optimistically flip the gift to claimed so the dot hides immediately, then
  // revalidate to pull the real nextGiftAvailableAt from the server.
  const handleClaimed = () =>
    void mutate(
      (current) =>
        current && {
          ...current,
          dailyGift: {
            availableNow: false,
            nextGiftAvailableAt: current.dailyGift.nextGiftAvailableAt,
          },
        },
      { revalidate: true },
    );

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <CoinBadge value={state.coins} label="Coin balance" />
      <DailyGiftButton status={state.dailyGift} onClaimed={handleClaimed} />
      <UserMenu user={{ name: state.name, email: state.email }} />
    </div>
  );
}
