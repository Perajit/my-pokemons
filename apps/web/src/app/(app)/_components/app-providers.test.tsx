// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import { AppProviders } from "./app-providers";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const mockPush = vi.fn();

// Triggers a failed SWR fetch with the given HTTP status so onError fires.
function SWRErrorThrower({ status }: { status: number }) {
  useSWR(`/err-${status}`, async () => {
    throw Object.assign(new Error("test"), { status });
  });
  return <div>rendered</div>;
}

describe("AppProviders", () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders children", () => {
    render(
      <AppProviders>
        <div>hello</div>
      </AppProviders>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("redirects to /login on a 401 SWR error", async () => {
    render(
      <AppProviders>
        <SWRErrorThrower status={401} />
      </AppProviders>,
    );
    await act(async () => {});
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("shows a generic error toast on non-401 SWR errors", async () => {
    render(
      <AppProviders>
        <SWRErrorThrower status={500} />
      </AppProviders>,
    );
    await act(async () => {});
    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong. Please try again.",
    );
  });
});
