import { describe, it, expect } from "vitest";
import { runAction } from "./action-result";
import {
  AppError,
  CooldownError,
  FaintedError,
  UnauthorizedError,
} from "@/services/errors";

describe("runAction()", () => {
  it("returns { ok: true } when fn resolves", async () => {
    const result = await runAction(async () => {});
    expect(result).toEqual({ ok: true });
  });

  it("converts AppError to its network object", async () => {
    const result = await runAction(async () => {
      throw new UnauthorizedError();
    });
    expect(result).toEqual({
      ok: false,
      error: {
        type: "AUTH",
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      },
    });
  });

  it("converts AppError subclasses with metadata", async () => {
    const endsAt = new Date("2024-06-01T12:30:00.000Z");
    const result = await runAction(async () => {
      throw new CooldownError(endsAt);
    });
    expect(result).toEqual({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "COOLDOWN",
        message: "Action on cooldown",
        metadata: { cooldownEndsAt: "2024-06-01T12:30:00.000Z" },
      },
    });
  });

  it("converts AppError subclasses without metadata", async () => {
    const result = await runAction(async () => {
      throw new FaintedError();
    });
    expect(result).toEqual({
      ok: false,
      error: {
        type: "GAMEPLAY",
        code: "FAINTED",
        message: "Pokémon has fainted",
      },
    });
  });

  it("falls back to a SYSTEM/UNKNOWN error for non-AppError throws", async () => {
    const result = await runAction(async () => {
      throw new Error("Database connection lost");
    });
    expect(result).toEqual({
      ok: false,
      error: {
        type: "SYSTEM",
        code: "UNKNOWN",
        message: "Something went wrong",
      },
    });
  });

  it("falls back for non-Error throws too", async () => {
    const result = await runAction(async () => {
      throw "string-throw";
    });
    expect(result).toEqual({
      ok: false,
      error: {
        type: "SYSTEM",
        code: "UNKNOWN",
        message: "Something went wrong",
      },
    });
  });

  it("returns the network shape directly when AppError is the base class", async () => {
    const result = await runAction(async () => {
      throw new AppError("GAMEPLAY", "CUSTOM", "Custom");
    });
    expect(result).toEqual({
      ok: false,
      error: { type: "GAMEPLAY", code: "CUSTOM", message: "Custom" },
    });
  });
});
