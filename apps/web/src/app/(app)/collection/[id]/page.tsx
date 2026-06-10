import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserPokemon, toUserPokemonDTO } from "@/services/pokemon";
import { NotOwnedError } from "@/services/errors";
import { PokemonDetail } from "./_components/pokemon-detail";

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const { id } = await params;
  const pokemon = await getUserPokemon(session.user.id, id).catch((err) => {
    if (err instanceof NotOwnedError) {
      notFound();
    }
    throw err;
  });
  return <PokemonDetail initial={toUserPokemonDTO(pokemon)} />;
}
