// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

// Only auth is mocked — the route runs against the real DB end to end, so the
// wire shape it serializes is exercised for real.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GET } from "@/app/api/me/route";
import { seedUser, resetGameplayTables } from "./db-helpers";
import { makeUserData } from "@/test/seed-factories";

const mockAuth = auth as ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.clearAllMocks();
  await resetGameplayTables();
});
afterAll(() => db.$disconnect());

describe("GET /api/me", () => {
  it("returns 401 when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns coins and an available daily gift for a fresh user", async () => {
    const user = await seedUser(makeUserData({ coins: 250, name: "Ash" }));
    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.coins).toBe(250);
    expect(body.name).toBe("Ash");
    expect(body.email).toBe(user.email);
    expect(body.dailyGift.availableNow).toBe(true);
    expect(body.dailyGift.nextGiftAvailableAt).toBeNull();
  });

  it("reports the gift as unavailable after it was claimed today", async () => {
    const user = await seedUser(makeUserData({ coins: 0 }));
    await db.user.update({
      where: { id: user.id },
      data: { lastDailyGiftClaimedAt: new Date() },
    });
    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const response = await GET();
    const body = await response.json();

    expect(body.dailyGift.availableNow).toBe(false);
    expect(body.dailyGift.nextGiftAvailableAt).not.toBeNull();
  });
});
