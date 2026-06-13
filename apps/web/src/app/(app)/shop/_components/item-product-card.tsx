"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ShopItemDto } from "@/services/shop";
import type { ItemKey } from "@my-pokemons/config/items";
import { Coins, HeartPulse, Info, type LucideIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { buyItemAction } from "../actions";

const ITEM_VISUALS: Record<ItemKey, { Icon: LucideIcon; color: string }> = {
  REVIVE: { Icon: HeartPulse, color: "text-rose-500" },
};

export function ItemProductCard({
  item,
  userCoins,
}: {
  item: ShopItemDto;
  userCoins: number;
}) {
  const [isPending, startTransition] = useTransition();
  const canAfford = userCoins >= item.price;
  const { Icon, color } = ITEM_VISUALS[item.key];

  function handleBuy() {
    startTransition(async () => {
      const result = await buyItemAction(item.key);
      if (result.ok) {
        toast.success(`Bought ${item.name}!`);
      } else {
        toast.error(result.error.message);
      }
    });
  }

  return (
    <Card className="rounded-2xl border-stone-200/70 bg-gradient-to-b from-white to-stone-50 shadow-sm">
      <CardContent className="flex gap-2.5 px-4 py-1">
        <div className="flex flex-1 items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-rose-50 ring-2 ring-rose-200 ring-inset">
            <Icon className={`size-6 ${color}`} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate font-heading text-base font-medium text-stone-700">
                {item.name}
              </p>
              <Popover>
                <PopoverTrigger
                  aria-label={`About ${item.name}`}
                  className="shrink-0 rounded-full p-0.5 text-stone-400 transition-colors hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
                >
                  <Info className="size-4" aria-hidden />
                </PopoverTrigger>
                <PopoverContent className="text-stone-600">
                  {item.description}
                </PopoverContent>
              </Popover>
            </div>
            <p
              aria-label={`You own ${item.userOwnedCount}`}
              className="text-xs text-stone-500 tabular-nums"
            >
              Owned &times;{item.userOwnedCount}
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-2">
          <span
            aria-label={`Price: ${item.price} coins`}
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold leading-none tabular-nums text-amber-800 ring-2 ring-amber-300 ring-inset"
          >
            <Coins className="size-3.5" aria-hidden />
            <span className="relative top-px">{item.price}</span>
          </span>
          <Button
            type="button"
            size="sm"
            onClick={handleBuy}
            disabled={isPending || !canAfford}
            aria-describedby={
              !canAfford ? `item-${item.key}-disabled` : undefined
            }
          >
            {isPending ? "Buying..." : "Buy"}
          </Button>
        </div>
        {!canAfford && (
          <p
            id={`item-${item.key}-disabled`}
            className="text-right text-xs text-amber-800"
          >
            Not enough coins
          </p>
        )}
      </CardContent>
    </Card>
  );
}
