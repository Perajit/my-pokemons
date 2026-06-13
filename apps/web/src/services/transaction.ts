import type { db } from "@/lib/db";

// The transaction-scoped Prisma client passed to `db.$transaction(async (tx) => ...)`.
// Shared so service helpers that compose inside a caller's transaction agree on one type.
export type PrismaTransaction = Parameters<
  Parameters<(typeof db)["$transaction"]>[0]
>[0];
