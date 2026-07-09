import { auth } from "@/lib/auth";
import { UnauthorizedError } from "@/services/errors";
import { getMeDto } from "@/services/me";
import { appErrorToResponse } from "@/lib/server-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      throw new UnauthorizedError();
    }
    const me = await getMeDto(session.user.id);
    return Response.json(me);
  } catch (err) {
    return appErrorToResponse(err);
  }
}
