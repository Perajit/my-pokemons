"use client";

import { HeartStatus } from "@/app/(app)/collection/_components/heart-status";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetcher } from "@/lib/client-fetcher";
import { cn } from "@/lib/utils";
import type { UserPokemonDto } from "@/services/user-pokemon";
import { ChevronLeft, Drumstick, Gamepad2, Skull } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { feedAction, playAction, reviveAction } from "../../actions";
import { ActionButton } from "./action-button";
import { ActiveSteak } from "./active-streak";
import { BondLevelSteps } from "./bond-level-steps";
import { notifyGameplayEvents } from "./gameplay-event-toasts";
import { RenamePokemonDialog } from "./rename-pokemon-dialog";
import { ReviveButton } from "./revive-button";
import { StatusBlock } from "./status-block";

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

export function PokemonDetail({
  initial,
  reviveCount = 0,
}: {
  initial: UserPokemonDto;
  reviveCount?: number;
}) {
  const router = useRouter();
  const { data: pokemon = initial, mutate } = useSWR<UserPokemonDto>(
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
  const [revivePending, startReviveTransition] = useTransition();

  const acquiredAt = new Date(pokemon.acquiredAt);
  const fullness = Math.round(pokemon.currentFullness);
  const mood = Math.round(pokemon.currentMood);

  function handleFeed() {
    startFeedTransition(async () => {
      const result = await feedAction(pokemon.id);
      if (result.ok) {
        notifyGameplayEvents(result.data.events);
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
        notifyGameplayEvents(result.data.events);
      } else {
        toast.error(result.error.message);
      }
      mutate();
    });
  }

  function handleRevive() {
    startReviveTransition(async () => {
      const result = await reviveAction(pokemon.id);
      if (result.ok) {
        notifyGameplayEvents(result.data.events);
        mutate(); // refresh the now-alive pokemon
        router.refresh(); // refresh the server-fetched reviveCount
      } else {
        toast.error(result.error.message);
      }
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
        <CardContent className="flex flex-col items-center gap-6 px-6 py-4 text-center sm:px-8 sm:py-6">
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
            <div className="flex justify-center">
              <div className="relative flex items-center">
                <h1 className="font-heading text-3xl font-semibold text-stone-800">
                  {pokemon.nickname}
                </h1>
                <div className="absolute left-full pl-2">
                  <RenamePokemonDialog
                    userPokemonId={pokemon.id}
                    nickname={pokemon.nickname}
                    onRenamed={() => mutate()}
                  />
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-stone-400">
              {pokemon.pokemon.name}
            </p>
            <p className="text-sm text-stone-500">
              Since {dateFormatter.format(acquiredAt)}
            </p>
          </div>
          {!pokemon.isFainted ? (
            <>
              <div className="space-y-1">
                <ActiveSteak activeStreak={pokemon.activeStreak} />
                <HeartStatus value={pokemon.heart} />
              </div>
              <div className="flex w-full flex-col gap-3">
                <StatusBlock
                  label="Fullness"
                  value={fullness}
                  action={
                    <ActionButton
                      label="Feed"
                      Icon={Drumstick}
                      cooldownEndsAt={pokemon.feedCooldownEndsAt}
                      isPending={feedPending}
                      onClick={handleFeed}
                    />
                  }
                />
                <StatusBlock
                  label="Mood"
                  value={mood}
                  action={
                    <ActionButton
                      label="Play"
                      Icon={Gamepad2}
                      cooldownEndsAt={pokemon.playCooldownEndsAt}
                      isPending={playPending}
                      onClick={handlePlay}
                    />
                  }
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-500">
                <Skull className="size-4" aria-hidden />
                <span>Fainted</span>
              </div>
              <ReviveButton
                reviveCount={reviveCount}
                isPending={revivePending}
                onRevive={handleRevive}
              />
            </div>
          )}
          <BondLevelSteps earned={pokemon.earnedBondLevels} />
        </CardContent>
      </Card>
    </div>
  );
}
