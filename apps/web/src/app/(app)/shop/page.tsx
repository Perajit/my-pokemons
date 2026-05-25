import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ShopCard } from "./_components/shop-card";

export default async function ShopPage() {
  const session = await auth();
  if (!session) {
    return null;
  }

  const [pokemons, user] = await Promise.all([
    db.pokemon.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        pokeApiId: true,
        name: true,
        description: true,
        price: true,
      },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { coins: true },
    }),
  ]);

  const userCoins = user?.coins ?? 0;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold text-amber-800 sm:text-3xl">
          Pokémon Shop
        </h1>
        <p className="text-sm text-stone-500">
          Pick a companion to bring home.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {pokemons.map((pokemon) => (
          <ShopCard key={pokemon.id} pokemon={pokemon} userCoins={userCoins} />
        ))}
      </div>
    </div>
  );
}
