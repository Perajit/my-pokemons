import { describe, it, expect } from "vitest";
import { appErrorToResponse } from "./server-response";
import {
  CooldownError,
  FaintedError,
  NotOwnedError,
  UnauthorizedError,
} from "@/services/errors";

describe("appErrorToResponse()", () => {
  it("returns 401 + AUTH payload for UnauthorizedError", async () => {
    const res = appErrorToResponse(new UnauthorizedError());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      type: "AUTH",
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  });

  it("returns 404 for NotOwnedError", async () => {
    const res = appErrorToResponse(new NotOwnedError());
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      type: "GAMEPLAY",
      code: "NOT_OWNED",
    });
  });

  it("returns 400 for FaintedError", async () => {
    const res = appErrorToResponse(new FaintedError());
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      type: "GAMEPLAY",
      code: "FAINTED",
    });
  });

  it("returns 400 + metadata for CooldownError", async () => {
    const endsAt = new Date("2024-06-01T12:30:00.000Z");
    const res = appErrorToResponse(new CooldownError(endsAt));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      type: "GAMEPLAY",
      code: "COOLDOWN",
      message: "Action on cooldown",
      metadata: { cooldownEndsAt: "2024-06-01T12:30:00.000Z" },
    });
  });

  it("returns 500 + SYSTEM/UNKNOWN for non-AppError throws", async () => {
    const res = appErrorToResponse(new Error("boom"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      type: "SYSTEM",
      code: "UNKNOWN",
      message: "Something went wrong",
    });
  });

  it("returns 500 + SYSTEM/UNKNOWN for non-Error throws too", async () => {
    const res = appErrorToResponse("oops");
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({
      type: "SYSTEM",
      code: "UNKNOWN",
    });
  });
});
