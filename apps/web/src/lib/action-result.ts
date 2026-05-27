import { AppError, type AppErrorPayload } from "@/services/errors";

export type ActionResult = { ok: true } | { ok: false; error: AppErrorPayload };

export async function runAction(
  fn: () => Promise<void>,
): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true };
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
