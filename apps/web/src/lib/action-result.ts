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
