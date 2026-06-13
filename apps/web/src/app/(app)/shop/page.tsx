import { auth } from "@/lib/auth";
import { getShopPokemonsDto, getShopItemsDto } from "@/services/shop";
import { getUserCoins } from "@/services/user";
import { PokemonProductCard } from "./_components/pokemon-product-card";
import { ItemProductCard } from "./_components/item-product-card";

export default async function ShopPage() {
  const session = await auth();
  if (!session) {
    return null;
  }

  const [pokemons, items, userCoins] = await Promise.all([
    getShopPokemonsDto(session.user.id),
    getShopItemsDto(session.user.id),
    getUserCoins(session.user.id),
  ]);

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <section className="flex flex-col gap-4 sm:gap-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-amber-800 sm:text-3xl">
            Pokémon
          </h1>
          <p className="text-sm text-stone-500">
            Pick a companion to bring home.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {pokemons.map((pokemon) => (
            <PokemonProductCard
              key={pokemon.id}
              pokemon={pokemon}
              userCoins={userCoins}
            />
          ))}
        </div>
      </section>

      {items.length > 0 && (
        <section className="flex flex-col gap-4 sm:gap-6">
          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-bold text-amber-800 sm:text-3xl">
              Items
            </h2>
            <p className="text-sm text-stone-500">
              Handy supplies for your Pokémon.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {items.map((item) => (
              <ItemProductCard
                key={item.id}
                item={item}
                userCoins={userCoins}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
