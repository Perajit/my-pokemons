import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userPokemons = await db.userPokemon.findMany({
    where: { userId: session.user.id },
    orderBy: { acquiredAt: "desc" },
    include: {
      pokemon: {
        select: { name: true, pokeApiId: true },
      },
    },
  });

  return Response.json(userPokemons);
}
