import { describe, it, expect, vi, afterEach } from "vitest";
import { apiFetcher } from "./client-fetcher";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetcher", () => {
  it("returns the parsed JSON body on a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ id: "abc", value: 42 }),
      }),
    );

    const result = await apiFetcher<{ id: string; value: number }>(
      "/api/anything",
    );

    expect(result).toEqual({ id: "abc", value: 42 });
    expect(fetch).toHaveBeenCalledWith("/api/anything");
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn(),
      }),
    );

    await expect(apiFetcher("/api/anything")).rejects.toThrow(
      "Failed to load /api/anything (500)",
    );
  });
});
