import { auth } from "@/lib/auth";
import { getUserCollection, toUserPokemonDTO } from "@/services/pokemon";
import { CollectionGrid } from "./_components/collection-grid";

export default async function CollectionPage() {
  const session = await auth();
  if (!session) {
    return null;
  }

  const pokemons = await getUserCollection(session.user.id);
  const initial = pokemons.map(toUserPokemonDTO);

  return <CollectionGrid initial={initial} />;
}
