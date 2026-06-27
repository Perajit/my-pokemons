"use client";

import { PokemonSprite } from "@/components/pokemon-sprite";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ShopPokemonDto } from "@/services/shop";
import { Coins, Cookie, Hand, TrendingDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { buyPokemonAction } from "../actions";

export function PokemonCardDialog({
  pokemon,
  userCoins,
  open,
  onClose,
}: {
  pokemon: ShopPokemonDto;
  userCoins: number;
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canAfford = userCoins >= pokemon.price;

  async function handleBuy() {
    setIsPending(true);
    setError(null);
    try {
      const result = await buyPokemonAction(pokemon.id);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      onClose();
      toast.success(`${pokemon.name} added to your collection!`);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsPending(false);
    }
  }

  function handleClose() {
    if (isPending) {
      return;
    }
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent mobileFullScreen>
        <DialogHeader>
          <DialogTitle className="text-center font-heading text-2xl font-semibold text-amber-800">
            {pokemon.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto py-2">
          <DialogDescription className="text-center text-stone-600">
            {pokemon.description}
          </DialogDescription>
          <PokemonSprite
            pokeApiId={pokemon.pokeApiId}
            name={pokemon.name}
            variant="feature"
          />
          <div className="grid w-full grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 ring-inset">
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <Cookie className="size-3" aria-hidden />
                Feed
              </span>
              <span className="text-xs font-medium text-stone-700">
                +{Math.round(pokemon.feedFullnessGain)} fullness
              </span>
              <span className="text-xs text-stone-500">
                +{pokemon.feedCoinReward} coins
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 ring-inset">
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <Hand className="size-3" aria-hidden />
                Play
              </span>
              <span className="text-xs font-medium text-stone-700">
                +{Math.round(pokemon.playMoodGain)} mood
              </span>
              <span className="text-xs text-stone-500">
                +{pokemon.playCoinReward} coins
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 ring-inset">
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <TrendingDown className="size-3" aria-hidden />
                Fullness decay
              </span>
              <span className="text-xs font-medium text-stone-700">
                −{pokemon.fullnessDecayPerHour}/hr
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 ring-inset">
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <TrendingDown className="size-3" aria-hidden />
                Mood decay
              </span>
              <span className="text-xs font-medium text-stone-700">
                −{pokemon.moodDecayPerHour}/hr
              </span>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2">
            <div className="flex flex-col items-center gap-1 rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 ring-inset">
              <span className="text-xs text-stone-500">Price</span>
              <span
                aria-label={`${pokemon.price} coins`}
                className="inline-flex items-center gap-1 text-base font-bold leading-none tabular-nums text-amber-800"
              >
                <Coins className="size-4" aria-hidden />
                <span className="relative top-px">{pokemon.price}</span>
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200 ring-inset">
              <span className="text-xs text-stone-500">Your balance</span>
              <span
                aria-label={`${userCoins} coins`}
                className="inline-flex items-center gap-1 text-base font-bold leading-none tabular-nums text-amber-800"
              >
                <Coins className="size-4" aria-hidden />
                <span className="relative top-px">{userCoins}</span>
              </span>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {!error && !canAfford && (
            <p id="buy-disabled-reason" className="text-sm text-amber-800">
              Not enough coins
            </p>
          )}
        </div>
        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleBuy}
            disabled={isPending || !canAfford}
            aria-describedby={
              !canAfford && !error ? "buy-disabled-reason" : undefined
            }
          >
            {isPending ? "Buying..." : "Buy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
