import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/services/errors";
import { getUserPokemonDto } from "@/services/user-pokemon";
import { appErrorToResponse } from "@/lib/server-response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    const { id } = await params;
    const pokemon = await getUserPokemonDto(session.user.id, id);
    return Response.json(pokemon);
  } catch (err) {
    return appErrorToResponse(err);
  }
}
