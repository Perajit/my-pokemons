// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll } from "vitest";

import { db } from "@/lib/db";
import { NotFoundError } from "@/services/errors";
import { getUserProfileDto, updateUserProfile } from "@/services/user";
import { seedUser, resetGameplayTables } from "./db-helpers";
import { makeUserData } from "@/test/fixtures";

beforeEach(resetGameplayTables);
afterAll(() => db.$disconnect());

describe("getUserProfileDto()", () => {
  it("returns the user's profile with createdAt as an ISO string", async () => {
    const user = await seedUser(makeUserData({ coins: 0 }));

    const profile = await getUserProfileDto(user.id);

    expect(profile).toMatchObject({ id: user.id, email: user.email });
    expect(typeof profile.createdAt).toBe("string");
    expect(new Date(profile.createdAt).toISOString()).toBe(profile.createdAt);
  });

  it("throws NotFoundError for an unknown user", async () => {
    await expect(getUserProfileDto("does-not-exist")).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe("updateUserProfile()", () => {
  it("persists a trimmed display name and returns the updated profile", async () => {
    const user = await seedUser(makeUserData({ coins: 0 }));

    const profile = await updateUserProfile(user.id, {
      name: "  Ash Ketchum  ",
    });

    expect(profile.name).toBe("Ash Ketchum");
    const stored = await db.user.findUnique({ where: { id: user.id } });
    expect(stored!.name).toBe("Ash Ketchum");
  });
});
