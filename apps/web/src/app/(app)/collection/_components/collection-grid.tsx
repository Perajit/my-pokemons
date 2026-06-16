"use client";

import { Pokeball } from "@/components/pokeball";
import { buttonVariants } from "@/components/ui/button";
import { apiFetcher } from "@/lib/client-fetcher";
import type { UserPokemonDto } from "@/services/user-pokemon";
import Link from "next/link";
import useSWR from "swr";
import { PokemonCard } from "./pokemon-card";

const POLL_INTERVAL_MS =
  parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL_SECONDS ?? "300", 10) *
  1000;

function subtitleFor(count: number): string {
  if (count === 0) {
    return "Your collection is waiting to begin.";
  }
  if (count === 1) {
    return "1 companion in your care.";
  }
  return `${count} companions in your care.`;
}

export function CollectionGrid({ initial }: { initial: UserPokemonDto[] }) {
  const { data: pokemons = initial } = useSWR<UserPokemonDto[]>(
    "/api/collection",
    apiFetcher,
    {
      fallbackData: initial,
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: true,
    },
  );

  const count = pokemons.length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-amber-800 sm:text-3xl">
          My Collection
        </h1>
        <p className="text-sm text-stone-500">{subtitleFor(count)}</p>
      </div>
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 py-12 text-center sm:py-16">
          <Pokeball className="size-28 opacity-90 drop-shadow-md sm:size-32" />
          <Link href="/shop" className={buttonVariants({ size: "lg" })}>
            Browse Shop →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {pokemons.map((p) => (
            <PokemonCard key={p.id} pokemon={p} />
          ))}
        </div>
      )}
    </div>
  );
}
