// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import { getUserCoins } from "@/services/user";
import { seedUser, resetGameplayTables } from "./db-helpers";
import { makeUserData } from "@/test/fixtures";

beforeEach(resetGameplayTables);
afterAll(() => db.$disconnect());

describe("getUserCoins()", () => {
  it("returns the user's coin balance", async () => {
    const user = await seedUser(makeUserData({ coins: 275 }));
    expect(await getUserCoins(user.id)).toBe(275);
  });

  it("returns 0 for an unknown user", async () => {
    expect(await getUserCoins("does-not-exist")).toBe(0);
  });
});
