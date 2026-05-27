"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Drumstick, Smile, Skull, Gamepad2 } from "lucide-react";
import type { ClientPokemon } from "@/services/pokemon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetcher } from "@/lib/client-fetcher";
import { cn } from "@/lib/utils";
import { HeartStat } from "@/app/(app)/collection/_components/heart-stat";
import {
  levelColor,
  fullnessLabel,
  moodLabel,
} from "@/app/(app)/collection/_components/pokemon-levels";
import { feedAction, playAction } from "../../actions";

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

function StatRow({
  label,
  value,
  tier,
  Icon,
}: {
  label: string;
  value: number;
  tier: string;
  Icon: typeof Drumstick;
}) {
  const rounded = Math.round(value);
  return (
    <div
      className="flex w-full items-center gap-3 text-sm text-stone-700"
      aria-label={`${label}: ${rounded} of 100`}
    >
      <Icon
        className={cn("size-5 shrink-0", levelColor(rounded))}
        aria-hidden
      />
      <span className="flex-1 text-left text-xs uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <span className="font-semibold tabular-nums">{rounded}</span>
      <span className="w-16 text-right text-xs text-stone-500">{tier}</span>
    </div>
  );
}

function useCountdown(endsAt: Date | null): number {
  const [now, setNow] = useState(() => Date.now());
  const endsAtMs = endsAt?.getTime() ?? null;

  useEffect(() => {
    if (endsAtMs === null) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAtMs]);

  if (endsAtMs === null) {
    return 0;
  }
  return Math.max(0, Math.ceil((endsAtMs - now) / 1000));
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ActionButton({
  label,
  Icon,
  cooldownEndsAt,
  isPending,
  onClick,
}: {
  label: string;
  Icon: typeof Drumstick;
  cooldownEndsAt: string | null;
  isPending: boolean;
  onClick: () => void;
}) {
  const endsAt = cooldownEndsAt ? new Date(cooldownEndsAt) : null;
  const remaining = useCountdown(endsAt);
  const onCooldown = remaining > 0;
  const disabled = onCooldown || isPending;

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full"
      aria-label={label}
    >
      <Icon className="size-4" aria-hidden />
      <span>{onCooldown ? formatCountdown(remaining) : label}</span>
    </Button>
  );
}

export function PokemonDetail({ initial }: { initial: ClientPokemon }) {
  const { data: pokemon = initial, mutate } = useSWR<ClientPokemon>(
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
      } else {
        toast.error(result.error.message);
      }
      mutate();
    });
  }

  return (
    <Card className="mx-auto max-w-xl overflow-hidden rounded-2xl border-stone-200/70 bg-gradient-to-b from-white to-stone-50 shadow-sm">
      <CardContent className="flex flex-col items-center gap-5 p-6 text-center sm:p-8">
        <div className="flex size-44 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-amber-100/80 to-transparent sm:size-52">
          <Image
            src={spriteUrl(pokemon.pokemon.pokeApiId)}
            alt={pokemon.pokemon.name}
            width={208}
            height={208}
            className={cn(
              "size-36 drop-shadow-md sm:size-44",
              !pokemon.isActive && "opacity-50 grayscale",
            )}
          />
        </div>
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold text-amber-800">
            {pokemon.pokemon.name}
          </h1>
          <p className="text-sm text-stone-500">
            Since {dateFormatter.format(acquiredAt)} · {pokemon.activeDays} day
            {pokemon.activeDays === 1 ? "" : "s"}
          </p>
        </div>

        {pokemon.isActive ? (
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
  );
}
