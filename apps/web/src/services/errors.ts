export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class InsufficientCoinsError extends Error {
  constructor(message = "Insufficient coins") {
    super(message);
    this.name = "InsufficientCoinsError";
  }
}
