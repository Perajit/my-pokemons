import { describe, it, expect } from "vitest";
import {
  AppError,
  UnauthorizedError,
  NotOwnedError,
  FaintedError,
  CooldownError,
  NotFoundError,
  InsufficientCoinsError,
} from "./errors";

describe("AppError", () => {
  it("carries type, code, message, and optional metadata", () => {
    const err = new AppError("SYSTEM", "BOOM", "Something exploded", {
      detail: "x",
    });
    expect(err.type).toBe("SYSTEM");
    expect(err.code).toBe("BOOM");
    expect(err.message).toBe("Something exploded");
    expect(err.metadata).toEqual({ detail: "x" });
  });

  it("has status 500 by default", () => {
    expect(new AppError("SYSTEM", "X", "x").status).toBe(500);
  });

  it("is an Error so it can be thrown and caught", () => {
    expect(new AppError("SYSTEM", "X", "x")).toBeInstanceOf(Error);
  });

  describe("toNetworkObject", () => {
    it("returns type, code, message", () => {
      const err = new AppError("GAMEPLAY", "FOO", "Foo happened");
      expect(err.toNetworkObject()).toEqual({
        type: "GAMEPLAY",
        code: "FOO",
        message: "Foo happened",
      });
    });

    it("includes metadata when present", () => {
      const err = new AppError("GAMEPLAY", "FOO", "Foo", { count: 3 });
      expect(err.toNetworkObject()).toEqual({
        type: "GAMEPLAY",
        code: "FOO",
        message: "Foo",
        metadata: { count: 3 },
      });
    });

    it("omits metadata when absent (no `metadata: undefined` key)", () => {
      const payload = new AppError("GAMEPLAY", "FOO", "Foo").toNetworkObject();
      expect(payload).not.toHaveProperty("metadata");
    });
  });
});

describe("UnauthorizedError", () => {
  it("is AUTH/UNAUTHORIZED with status 401", () => {
    const err = new UnauthorizedError();
    expect(err).toBeInstanceOf(AppError);
    expect(err.type).toBe("AUTH");
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Unauthorized");
    expect(err.status).toBe(401);
  });
});

describe("NotOwnedError", () => {
  it("is GAMEPLAY/NOT_OWNED with status 404", () => {
    const err = new NotOwnedError();
    expect(err.type).toBe("GAMEPLAY");
    expect(err.code).toBe("NOT_OWNED");
    expect(err.status).toBe(404);
  });
});

describe("FaintedError", () => {
  it("is GAMEPLAY/FAINTED with status 400", () => {
    const err = new FaintedError();
    expect(err.type).toBe("GAMEPLAY");
    expect(err.code).toBe("FAINTED");
    expect(err.status).toBe(400);
  });
});

describe("CooldownError", () => {
  const endsAt = new Date("2024-06-01T12:30:00.000Z");

  it("is GAMEPLAY/COOLDOWN with status 400", () => {
    const err = new CooldownError(endsAt);
    expect(err.type).toBe("GAMEPLAY");
    expect(err.code).toBe("COOLDOWN");
    expect(err.status).toBe(400);
  });

  it("stores cooldownEndsAt as an ISO string in metadata", () => {
    const err = new CooldownError(endsAt);
    expect(err.metadata).toEqual({
      cooldownEndsAt: "2024-06-01T12:30:00.000Z",
    });
  });

  it("exposes cooldownEndsAt getter that returns the original Date", () => {
    const err = new CooldownError(endsAt);
    expect(err.cooldownEndsAt.toISOString()).toBe(endsAt.toISOString());
  });

  it("serializes the cooldownEndsAt ISO into the network payload", () => {
    const err = new CooldownError(endsAt);
    expect(err.toNetworkObject()).toEqual({
      type: "GAMEPLAY",
      code: "COOLDOWN",
      message: "Action on cooldown",
      metadata: { cooldownEndsAt: "2024-06-01T12:30:00.000Z" },
    });
  });
});

describe("NotFoundError", () => {
  it("is SHOP/NOT_FOUND with status 404 and configurable resource label", () => {
    const err = new NotFoundError("Pokémon");
    expect(err.type).toBe("SHOP");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Pokémon not found");
    expect(err.status).toBe(404);
  });
});

describe("InsufficientCoinsError", () => {
  it("is SHOP/INSUFFICIENT_COINS with status 400", () => {
    const err = new InsufficientCoinsError();
    expect(err.type).toBe("SHOP");
    expect(err.code).toBe("INSUFFICIENT_COINS");
    expect(err.status).toBe(400);
  });
});
