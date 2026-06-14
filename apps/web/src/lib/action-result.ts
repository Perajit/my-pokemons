import { AppError, type AppErrorPayload } from "@/services/errors";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: AppErrorPayload };

export async function runAction<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    if (err instanceof AppError) {
      return { ok: false, error: err.toNetworkObject() };
    }
    // Unexpected (non-AppError) failure — log the real cause so the generic
    // "Something went wrong" returned to the client stays diagnosable.
    console.error("Unhandled action error:", err);
    return {
      ok: false,
      error: new AppError(
        "SYSTEM",
        "UNKNOWN",
        "Something went wrong",
      ).toNetworkObject(),
    };
  }
}
