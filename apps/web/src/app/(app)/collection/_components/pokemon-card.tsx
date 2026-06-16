import { PokemonSprite } from "@/components/pokemon-sprite";
import { Card, CardContent } from "@/components/ui/card";
import type { UserPokemonDto } from "@/services/user-pokemon";
import Link from "next/link";
import { FaintedBadge } from "./fainted-badge";
import { HeartStatus } from "./heart-status";

export function PokemonCard({ pokemon }: { pokemon: UserPokemonDto }) {
  const heart = Math.round(pokemon.heart);

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
          {!pokemon.isFainted ? (
            <HeartStatus size="sm" value={heart} />
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
