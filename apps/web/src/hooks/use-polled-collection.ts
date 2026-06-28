"use client";

import { apiFetcher } from "@/lib/client-fetcher";
import type { UserPokemonDto } from "@/services/user-pokemon";
import useSWR, { type KeyedMutator } from "swr";

// Decay is computed lazily server-side, so the client polls to keep the
// displayed stats live without a reload. One place owns the interval + options
// for both the collection grid and the single-Pokémon detail view.
const POLL_INTERVAL_MS =
  parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL_SECONDS ?? "300", 10) *
  1000;

const pollingConfig = {
  refreshInterval: POLL_INTERVAL_MS,
  revalidateOnFocus: true,
};

export function usePolledCollection(initial: UserPokemonDto[]): {
  pokemons: UserPokemonDto[];
} {
  const { data: pokemons = initial } = useSWR<UserPokemonDto[]>(
    "/api/collection",
    apiFetcher,
    { fallbackData: initial, ...pollingConfig },
  );
  return { pokemons };
}

export function usePolledUserPokemon(initial: UserPokemonDto): {
  pokemon: UserPokemonDto;
  mutate: KeyedMutator<UserPokemonDto>;
} {
  const { data: pokemon = initial, mutate } = useSWR<UserPokemonDto>(
    `/api/collection/${initial.id}`,
    apiFetcher,
    { fallbackData: initial, ...pollingConfig },
  );
  return { pokemon, mutate };
}
