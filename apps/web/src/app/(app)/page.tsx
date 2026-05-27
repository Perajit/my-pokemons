import { auth } from "@/lib/auth";
import { getMyPokemons, toClientPokemon } from "@/services/pokemon";
import { CollectionGrid } from "./collection/_components/collection-grid";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    return null;
  }

  const pokemons = await getMyPokemons(session.user.id);
  const initial = pokemons.map(toClientPokemon);

  return <CollectionGrid initial={initial} />;
}
