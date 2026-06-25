"use client";

import { CoinBadge } from "@/components/coin-badge";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export function PokemonCard({
  pokemon,
  userCoins,
}: {
  pokemon: ShopPokemonDto;
  userCoins: number;
}) {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      toast.success(`${pokemon.name} added to your collection!`);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsPending(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (isPending) {
      return;
    }
    if (!next) {
      setError(null);
    }
    setOpen(next);
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="group cursor-pointer rounded-2xl border-stone-200/70 bg-gradient-to-b from-white to-stone-50 shadow-sm transition-all hover:shadow-lg motion-safe:hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none motion-safe:focus-visible:-translate-y-1"
      >
        <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
          <PokemonSprite
            pokeApiId={pokemon.pokeApiId}
            name={pokemon.name}
            variant="card"
          />
          <h3 className="font-heading text-base font-medium text-stone-600">
            {pokemon.name}
          </h3>
          <span
            aria-label={`You own ${pokemon.userOwnedCount}`}
            className="-mt-1 text-xs text-stone-500 tabular-nums"
          >
            Owned &times;{pokemon.userOwnedCount}
          </span>
          <CoinBadge value={pokemon.price} label="Price" size="sm" />
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="top-0 left-0 flex flex-col overflow-hidden h-svh w-screen max-w-none translate-x-0 translate-y-0 rounded-none sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[calc(100svh-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
          <DialogHeader className="shrink-0">
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
              onClick={() => handleOpenChange(false)}
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
    </>
  );
}
