"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Drumstick, Smile, Skull, Gamepad2, ChevronLeft } from "lucide-react";
import {
  BOND_LEVEL_LABELS,
  type BondLevelKey,
} from "@my-pokemons/config/bond-levels";
import type { UserPokemonDTO } from "@/services/pokemon";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetcher } from "@/lib/client-fetcher";
import { cn } from "@/lib/utils";
import { HeartStat } from "@/app/(app)/collection/_components/heart-stat";
import {
  fullnessLabel,
  moodLabel,
} from "@/app/(app)/collection/_components/pokemon-levels";
import { feedAction, playAction } from "../../actions";
import { StatRow } from "./stat-row";
import { ActionButton } from "./action-button";
import { StreakHeader } from "./streak-header";
import { BondLevelSteps } from "./bond-level-steps";

const POLL_INTERVAL_MS =
  parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL_SECONDS ?? "300", 10) *
  1000;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function spriteUrl(pokeApiId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeApiId}.png`;
}

export function PokemonDetail({ initial }: { initial: UserPokemonDTO }) {
  const { data: pokemon = initial, mutate } = useSWR<UserPokemonDTO>(
    `/api/collection/${initial.id}`,
    apiFetcher,
    {
      fallbackData: initial,
      refreshInterval: POLL_INTERVAL_MS,
      revalidateOnFocus: true,
    },
  );

  const [feedPending, startFeedTransition] = useTransition();
  const [playPending, startPlayTransition] = useTransition();

  const acquiredAt = new Date(pokemon.acquiredAt);
  const fullness = Math.round(pokemon.currentFullness);
  const mood = Math.round(pokemon.currentMood);

  function handleFeed() {
    startFeedTransition(async () => {
      const result = await feedAction(pokemon.id);
      if (result.ok) {
        toast.success(
          `Fed ${pokemon.pokemon.name}! +${pokemon.feedCoinReward} coins`,
        );
        result.data.events.forEach((event) => {
          if (event.type === "achievement_unlocked") {
            toast.success(
              `Earned: ${BOND_LEVEL_LABELS[event.achievementKey as BondLevelKey]} (+${event.coinsEarned} coins)`,
            );
          }
        });
      } else {
        toast.error(result.error.message);
      }
      mutate();
    });
  }

  function handlePlay() {
    startPlayTransition(async () => {
      const result = await playAction(pokemon.id);
      if (result.ok) {
        toast.success(
          `Played with ${pokemon.pokemon.name}! +${pokemon.playCoinReward} coins`,
        );
        result.data.events.forEach((event) => {
          if (event.type === "achievement_unlocked") {
            toast.success(
              `Earned: ${BOND_LEVEL_LABELS[event.achievementKey as BondLevelKey]} (+${event.coinsEarned} coins)`,
            );
          }
        });
      } else {
        toast.error(result.error.message);
      }
      mutate();
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-3">
      <Link
        href="/collection"
        className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 transition-colors hover:text-stone-700"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to Collection
      </Link>
      <Card className="overflow-hidden rounded-2xl border-stone-200/70 bg-gradient-to-b from-white to-stone-50 shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 p-6 text-center sm:p-8">
          <div className="flex size-44 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-amber-100/80 to-transparent sm:size-52">
            <Image
              src={spriteUrl(pokemon.pokemon.pokeApiId)}
              alt={pokemon.pokemon.name}
              width={208}
              height={208}
              className={cn(
                "size-36 drop-shadow-md sm:size-44",
                pokemon.isFainted && "opacity-50 grayscale",
              )}
            />
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-semibold text-amber-800">
              {pokemon.pokemon.name}
            </h1>
            <p className="text-sm text-stone-500">
              Since {dateFormatter.format(acquiredAt)}
            </p>
            <StreakHeader activeDays={pokemon.activeDays} />
          </div>
          <BondLevelSteps earned={pokemon.earnedBondLevels} />

          {!pokemon.isFainted ? (
            <>
              <div className="flex w-full flex-col gap-3">
                <div className="flex justify-center">
                  <HeartStat value={pokemon.heart} size="lg" />
                </div>
                <StatRow
                  label="Fullness"
                  value={fullness}
                  tier={fullnessLabel(fullness)}
                  Icon={Drumstick}
                />
                <StatRow
                  label="Mood"
                  value={mood}
                  tier={moodLabel(mood)}
                  Icon={Smile}
                />
              </div>
              <div className="grid w-full grid-cols-2 gap-3">
                <ActionButton
                  label="Feed"
                  Icon={Drumstick}
                  cooldownEndsAt={pokemon.feedCooldownEndsAt}
                  isPending={feedPending}
                  onClick={handleFeed}
                />
                <ActionButton
                  label="Play"
                  Icon={Gamepad2}
                  cooldownEndsAt={pokemon.playCooldownEndsAt}
                  isPending={playPending}
                  onClick={handlePlay}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-500">
              <Skull className="size-4" aria-hidden />
              <span>Fainted</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
