"use client";

import { PokemonSprite } from "@/components/pokemon-sprite";
import { Card, CardContent } from "@/components/ui/card";
import { useNow } from "@/context/now-provider";
import type { UserPokemonDto } from "@/services/user-pokemon";
import {
  applyDecay,
  calculateElapsedHours,
  calculateHeart,
  hasFainted,
} from "@my-pokemons/core";
import Link from "next/link";
import { FaintedBadge } from "./fainted-badge";
import { HeartStatus } from "./heart-status";

export function PokemonCard({ pokemon }: { pokemon: UserPokemonDto }) {
  const now = useNow();
  const elapsedHours = pokemon.isFainted
    ? 0
    : calculateElapsedHours(new Date(pokemon.lastCalculatedAt), now);
  const liveFullness = applyDecay(
    pokemon.currentFullness,
    pokemon.pokemon.fullnessDecayPerHour,
    elapsedHours,
  );
  const liveMood = applyDecay(
    pokemon.currentMood,
    pokemon.pokemon.moodDecayPerHour,
    elapsedHours,
  );
  const liveHeart = Math.round(calculateHeart(liveFullness, liveMood));
  const liveIsFainted = pokemon.isFainted || hasFainted(liveFullness, liveMood);

  return (
    <Link
      href={`/collection/${pokemon.id}`}
      className="block rounded-2xl focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
      aria-label={`Open ${pokemon.nickname}`}
    >
      <Card className="group cursor-pointer rounded-2xl border-stone-200/70 bg-white shadow-sm transition-all hover:shadow-md motion-safe:hover:-translate-y-0.5">
        <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
          <PokemonSprite
            pokeApiId={pokemon.pokemon.pokeApiId}
            name={pokemon.pokemon.name}
            variant="card"
          />
          <h3 className="font-heading text-base font-medium text-stone-700">
            {pokemon.nickname}
          </h3>
          {!liveIsFainted ? (
            <HeartStatus size="sm" value={liveHeart} />
          ) : (
            <div className="flex flex-col items-start gap-1 sm:items-center">
              <FaintedBadge size="sm" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
