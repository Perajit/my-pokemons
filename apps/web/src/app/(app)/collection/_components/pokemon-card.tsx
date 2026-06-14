import Image from "next/image";
import Link from "next/link";
import { Heart, Drumstick, Smile } from "lucide-react";
import type { UserPokemonDto } from "@/services/user-pokemon";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { levelColor } from "./pokemon-levels";

function spriteUrl(pokeApiId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeApiId}.png`;
}

export function PokemonCard({ pokemon }: { pokemon: UserPokemonDto }) {
  const fullness = Math.round(pokemon.currentFullness);
  const mood = Math.round(pokemon.currentMood);
  const heart = Math.round(pokemon.heart);

  return (
    <Link
      href={`/collection/${pokemon.id}`}
      className="block rounded-2xl focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
      aria-label={`Open ${pokemon.nickname}`}
    >
      <Card className="group cursor-pointer rounded-2xl border-stone-200/70 bg-white shadow-sm transition-all hover:shadow-md motion-safe:hover:-translate-y-0.5">
        <CardContent className="px-5 py-3.5 sm:p-4">
          <div className="mx-auto flex max-w-sm flex-row items-center gap-4 sm:max-w-none sm:flex-col sm:items-center sm:gap-2.5 sm:text-center">
            <Image
              src={spriteUrl(pokemon.pokemon.pokeApiId)}
              alt={pokemon.pokemon.name}
              width={192}
              height={192}
              className={cn(
                "size-16 shrink-0 drop-shadow-sm transition-transform duration-200 motion-safe:group-hover:scale-110 sm:size-20",
                pokemon.isFainted && "opacity-50 grayscale",
              )}
            />
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-none sm:items-center sm:gap-2">
              <div className="flex flex-col items-start gap-1 sm:items-center">
                <p className="font-heading text-base font-medium text-stone-700">
                  {pokemon.nickname}
                </p>
                {pokemon.isFainted ? (
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-sm font-medium text-stone-500">
                    Fainted
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span
                  aria-label={`Heart: ${heart} of 100`}
                  className="inline-flex items-center gap-1 text-sm text-stone-700"
                >
                  <Heart
                    className={cn("size-4 fill-current", levelColor(heart))}
                    aria-hidden
                  />
                  <span className="tabular-nums">{heart}</span>
                </span>
                <span
                  aria-label={`Fullness: ${fullness}`}
                  className="inline-flex items-center gap-1 text-sm text-stone-700"
                >
                  <Drumstick
                    className={cn("size-4", levelColor(fullness))}
                    aria-hidden
                  />
                  <span className="tabular-nums">{fullness}</span>
                </span>
                <span
                  aria-label={`Mood: ${mood}`}
                  className="inline-flex items-center gap-1 text-sm text-stone-700"
                >
                  <Smile
                    className={cn("size-4", levelColor(mood))}
                    aria-hidden
                  />
                  <span className="tabular-nums">{mood}</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
