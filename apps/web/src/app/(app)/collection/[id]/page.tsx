import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserPokemonDto } from "@/services/user-pokemon";
import { getUserItemQuantity } from "@/services/inventory";
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
  const [initial, reviveCount] = await Promise.all([
    getUserPokemonDto(session.user.id, id).catch((err) => {
      if (err instanceof NotOwnedError) {
        notFound();
      }
      throw err;
    }),
    getUserItemQuantity(session.user.id, "REVIVE"),
  ]);
  return <PokemonDetail initial={initial} reviveCount={reviveCount} />;
}
