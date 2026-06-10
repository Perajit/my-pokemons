import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/services/errors";
import { getUserCollection } from "@/services/pokemon";
import { appErrorToResponse } from "@/lib/server-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    const pokemons = await getUserCollection(session.user.id);
    return Response.json(pokemons);
  } catch (err) {
    return appErrorToResponse(err);
  }
}
