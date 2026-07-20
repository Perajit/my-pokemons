// @vitest-environment node

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

// Only auth is mocked — the route runs against the real DB end to end, the same
// way it does in production, so the wire shape it serializes is exercised for real.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GET as getCollection } from "@/app/api/collection/route";
import { GET as getCollectionItem } from "@/app/api/collection/[id]/route";
import {
  seedUser,
  seedPokemon,
  seedUserPokemon,
  resetGameplayTables,
} from "./db-helpers";
import { makeUserData, makePokemonData } from "@/test/seed-factories";

const mockAuth = auth as ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.clearAllMocks();
  await resetGameplayTables();
});
afterAll(() => db.$disconnect());

describe("GET /api/collection", () => {
  it("returns 401 when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await getCollection();

    expect(response.status).toBe(401);
  });

  it("returns the owner's collection as serialized DTOs", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    await seedUserPokemon({ userId: user.id, pokemonId: pokemon.id });
    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const response = await getCollection();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].pokemon).toEqual({
      name: pokemon.name,
      pokeApiId: pokemon.pokeApiId,
      fullnessDecayPerHour: pokemon.fullnessDecayPerHour,
      moodDecayPerHour: pokemon.moodDecayPerHour,
    });
    expect(body[0]).not.toHaveProperty("lastFedAt");
    expect(body[0]).not.toHaveProperty("feedCoinReward");
  });
});

describe("GET /api/collection/[id]", () => {
  it("returns 401 when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await getCollectionItem(new Request("http://test/x"), {
      params: Promise.resolve({ id: "any" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when the pokemon belongs to another user", async () => {
    const owner = await seedUser(makeUserData({ coins: 500 }));
    const intruder = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const up = await seedUserPokemon({
      userId: owner.id,
      pokemonId: pokemon.id,
    });
    mockAuth.mockResolvedValue({ user: { id: intruder.id } });

    const response = await getCollectionItem(new Request("http://test/x"), {
      params: Promise.resolve({ id: up.id }),
    });

    expect(response.status).toBe(404);
  });

  it("returns the owned pokemon as a serialized DTO", async () => {
    const user = await seedUser(makeUserData({ coins: 500 }));
    const pokemon = await seedPokemon(makePokemonData());
    const up = await seedUserPokemon({
      userId: user.id,
      pokemonId: pokemon.id,
    });
    mockAuth.mockResolvedValue({ user: { id: user.id } });

    const response = await getCollectionItem(new Request("http://test/x"), {
      params: Promise.resolve({ id: up.id }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe(up.id);
    expect(body.pokemon.name).toBe(pokemon.name);
    expect(body).not.toHaveProperty("lastFedAt");
    expect(body).not.toHaveProperty("feedCoinReward");
  });
});
