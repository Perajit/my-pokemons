export type ErrorType = "AUTH" | "GAMEPLAY" | "SHOP" | "SYSTEM";

export type AppErrorPayload = {
  type: ErrorType;
  code: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export class AppError extends Error {
  constructor(
    public readonly type: ErrorType,
    public readonly code: string,
    message: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }

  get status(): number {
    return 500;
  }

  toNetworkObject(): AppErrorPayload {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      ...(this.metadata ? { metadata: this.metadata } : {}),
    };
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("AUTH", "UNAUTHORIZED", "Unauthorized");
    this.name = "UnauthorizedError";
  }
  get status() {
    return 401;
  }
}

export class NotOwnedError extends AppError {
  constructor() {
    super("GAMEPLAY", "NOT_OWNED", "Not found");
    this.name = "NotOwnedError";
  }
  get status() {
    return 404;
  }
}

export class FaintedError extends AppError {
  constructor() {
    super("GAMEPLAY", "FAINTED", "Pokémon has fainted");
    this.name = "FaintedError";
  }
  get status() {
    return 400;
  }
}

export class CooldownError extends AppError {
  constructor(cooldownEndsAt: Date) {
    super("GAMEPLAY", "COOLDOWN", "Action on cooldown", {
      cooldownEndsAt: cooldownEndsAt.toISOString(),
    });
    this.name = "CooldownError";
  }
  get status() {
    return 400;
  }
  get cooldownEndsAt(): Date {
    return new Date(this.metadata!.cooldownEndsAt as string);
  }
}

export class NotFoundError extends AppError {
  constructor(what = "Resource") {
    super("SHOP", "NOT_FOUND", `${what} not found`);
    this.name = "NotFoundError";
  }
  get status() {
    return 404;
  }
}

export class InsufficientCoinsError extends AppError {
  constructor() {
    super("SHOP", "INSUFFICIENT_COINS", "Insufficient coins");
    this.name = "InsufficientCoinsError";
  }
  get status() {
    return 400;
  }
}

export class NotFaintedError extends AppError {
  constructor() {
    super("GAMEPLAY", "NOT_FAINTED", "Pokémon hasn't fainted");
    this.name = "NotFaintedError";
  }
  get status() {
    return 400;
  }
}

export class InsufficientItemsError extends AppError {
  constructor() {
    super("GAMEPLAY", "INSUFFICIENT_ITEMS", "You don't have that item");
    this.name = "InsufficientItemsError";
  }
  get status() {
    return 400;
  }
}

export class AlreadyClaimedError extends AppError {
  constructor() {
    super("GAMEPLAY", "ALREADY_CLAIMED", "Daily gift already claimed");
    this.name = "AlreadyClaimedError";
  }
  get status() {
    return 400;
  }
}
