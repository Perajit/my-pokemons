import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Pokeball } from "@/components/pokeball";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function spriteUrl(pokeApiId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeApiId}.png`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    return null;
  }

  const userPokemons = await db.userPokemon.findMany({
    where: { userId: session.user.id },
    orderBy: { acquiredAt: "desc" },
    include: { pokemon: { select: { name: true, pokeApiId: true } } },
  });

  const count = userPokemons.length;
  const subtitle =
    count === 0
      ? "Your collection is waiting to begin."
      : count === 1
        ? "1 companion in your care."
        : `${count} companions in your care.`;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-amber-800 sm:text-3xl">
          My Collection
        </h1>
        <p className="text-sm text-stone-500">{subtitle}</p>
      </div>
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 py-12 text-center sm:py-16">
          <Pokeball className="size-28 opacity-90 drop-shadow-md sm:size-32" />
          <Link href="/shop" className={buttonVariants({ size: "lg" })}>
            Browse Shop →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {userPokemons.map((up) => (
            <Card
              key={up.id}
              className="group overflow-hidden rounded-2xl border-stone-200/70 bg-gradient-to-b from-white to-stone-50 shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="flex size-28 shrink-0 items-center justify-center sm:size-32">
                  <Image
                    src={spriteUrl(up.pokemon.pokeApiId)}
                    alt={up.pokemon.name}
                    width={192}
                    height={192}
                    className="size-24 drop-shadow-sm transition-transform duration-200 motion-safe:group-hover:scale-110 sm:size-28"
                  />
                </div>
                <p className="font-heading text-base font-medium text-stone-700">
                  {up.pokemon.name}
                </p>
                <p className="text-xs text-stone-500">
                  Since {dateFormatter.format(up.acquiredAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
