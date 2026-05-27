import { AppError } from "@/services/errors";

export function appErrorToResponse(err: unknown): Response {
  if (err instanceof AppError) {
    return Response.json(err.toNetworkObject(), { status: err.status });
  }
  return Response.json(
    new AppError("SYSTEM", "UNKNOWN", "Something went wrong").toNetworkObject(),
    { status: 500 },
  );
}
