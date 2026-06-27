"use client";

import { CoinBadge } from "@/components/coin-badge";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { Card, CardContent } from "@/components/ui/card";
import type { ShopPokemonDto } from "@/services/shop";
import { useState } from "react";
import { PokemonCardDialog } from "./pokemon-card-dialog";

export function PokemonCard({
  pokemon,
  userCoins,
}: {
  pokemon: ShopPokemonDto;
  userCoins: number;
}) {
  const [open, setOpen] = useState(false);

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
      <PokemonCardDialog
        pokemon={pokemon}
        userCoins={userCoins}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
