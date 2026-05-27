"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import { buyPokemonAction } from "../actions";
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

type ShopPokemon = {
  id: string;
  name: string;
  pokeApiId: number;
  description: string;
  price: number;
};

function spriteUrl(pokeApiId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeApiId}.png`;
}

export function ShopCard({
  pokemon,
  userCoins,
}: {
  pokemon: ShopPokemon;
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
          <div className="flex size-28 shrink-0 items-center justify-center sm:size-32">
            <Image
              src={spriteUrl(pokemon.pokeApiId)}
              alt={pokemon.name}
              width={192}
              height={192}
              className="size-24 drop-shadow-sm transition-transform duration-200 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110 sm:size-28"
            />
          </div>
          <p className="font-heading text-base font-medium text-stone-700">
            {pokemon.name}
          </p>
          <span
            aria-label={`Price: ${pokemon.price} coins`}
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold leading-none tabular-nums text-amber-800 ring-2 ring-amber-300 ring-inset"
          >
            <Coins className="size-3.5" aria-hidden />
            <span className="relative top-px">{pokemon.price}</span>
          </span>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="top-0 left-0 h-svh w-screen max-w-none translate-x-0 translate-y-0 rounded-none sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-center font-heading text-2xl font-semibold text-amber-800">
              {pokemon.name}
            </DialogTitle>
            <DialogDescription className="text-center text-stone-600">
              {pokemon.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-5 py-2">
            <div className="flex size-48 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-amber-100/80 to-transparent">
              <Image
                src={spriteUrl(pokemon.pokeApiId)}
                alt={pokemon.name}
                width={160}
                height={160}
                className="size-40 drop-shadow-md"
              />
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
          <DialogFooter>
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
