"use client";

import { FaintedBadge } from "@/app/(app)/collection/_components/fainted-badge";
import { HeartStatus } from "@/app/(app)/collection/_components/heart-status";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { Card, CardContent } from "@/components/ui/card";
import { usePolledUserPokemon } from "@/hooks/use-polled-collection";
import type { UserPokemonDto } from "@/services/user-pokemon";
import { ChevronLeft, Cookie, Hand } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { feedAction, playAction, reviveAction } from "../../actions";
import { ActionButton } from "./action-button";
import { ActiveSteak } from "./active-streak";
import { BondLevelSteps } from "./bond-level-steps";
import { notifyGameplayEvents } from "./gameplay-event-toasts";
import { RenamePokemonDialog } from "./rename-pokemon-dialog";
import { ReviveButton } from "./revive-button";
import { StatusBlock } from "./status-block";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function PokemonDetail({
  initial,
  reviveCount = 0,
}: {
  initial: UserPokemonDto;
  reviveCount?: number;
}) {
  const router = useRouter();
  const { pokemon, mutate } = usePolledUserPokemon(initial);

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
          <PokemonSprite
            pokeApiId={pokemon.pokemon.pokeApiId}
            name={pokemon.pokemon.name}
            variant="feature"
          />
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <div className="relative flex items-center">
                <h1 className="font-heading text-2xl font-semibold text-stone-600">
                  {pokemon.nickname}
                </h1>
                <div className="absolute left-full pl-1">
                  <RenamePokemonDialog
                    userPokemonId={pokemon.id}
                    nickname={pokemon.nickname}
                    onRenamed={() => mutate()}
                  />
                </div>
              </div>
            </div>
            <div className="text-xs font-medium text-stone-500">
              {pokemon.pokemon.name}
            </div>
            <div className="text-xs text-stone-500">
              Since {dateFormatter.format(acquiredAt)}
            </div>
          </div>
          <BondLevelSteps earned={pokemon.earnedBondLevels} />
          <div className="border border-stone-300 w-full" />
          {!pokemon.isFainted ? (
            <>
              <div className="space-y-1">
                <ActiveSteak activeStreak={pokemon.activeStreak} />
                <HeartStatus size="md" value={pokemon.heart} />
              </div>
              <div className="flex w-full flex-col gap-3">
                <StatusBlock
                  label="Fullness"
                  value={fullness}
                  action={
                    <ActionButton
                      label="Feed"
                      Icon={Cookie}
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
                      Icon={Hand}
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
              <FaintedBadge />
              <ReviveButton
                reviveCount={reviveCount}
                isPending={revivePending}
                onRevive={handleRevive}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
