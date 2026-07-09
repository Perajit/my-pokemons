"use client";

import { useEffect } from "react";
import useSWR, { type KeyedMutator } from "swr";
import { apiFetcher } from "@/lib/client-fetcher";
import { msUntilNextGift } from "@/lib/ms-until-next-gift";
import type { MeDto } from "@/services/me";

// Header state (coins, daily-gift status) is server-rendered once, then kept
// live client-side. No interval polling — revalidate when the user returns to
// the tab, plus a one-shot timer that fires exactly when the gift resets so the
// dot flips on without waiting for a focus event or a reload.
export function useLayoutState(initial: MeDto): {
  state: MeDto;
  mutate: KeyedMutator<MeDto>;
} {
  const { data: state = initial, mutate } = useSWR<MeDto>(
    "/api/me",
    apiFetcher,
    {
      fallbackData: initial,
      revalidateOnFocus: true,
      revalidateOnMount: true,
    },
  );

  // Coin/gift-changing actions call revalidatePath("/", "layout"), which re-renders
  // this component with a fresh `initial`. Adopt it into the SWR cache so the header
  // updates immediately — revalidatePath refreshes server output, not the client cache.
  // `initial`'s identity only changes on a server (RSC) re-render, never on a
  // client-only re-render, so this won't clobber data from a focus/timer revalidation.
  useEffect(() => {
    void mutate(initial, { revalidate: false });
  }, [initial, mutate]);

  const { nextGiftAvailableAt } = state.dailyGift;
  useEffect(() => {
    if (!nextGiftAvailableAt) {
      return;
    }
    const delay = msUntilNextGift(nextGiftAvailableAt, new Date());
    const timer = setTimeout(() => void mutate(), delay);
    return () => clearTimeout(timer);
  }, [nextGiftAvailableAt, mutate]);

  return { state, mutate };
}
