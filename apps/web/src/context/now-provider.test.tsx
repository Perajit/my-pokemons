// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NowProvider, useNow } from "./now-provider";

function NowDisplay() {
  const now = useNow();
  return <div data-testid="now">{now.toISOString()}</div>;
}

describe("NowProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("provides the current time to consumers", () => {
    render(
      <NowProvider>
        <NowDisplay />
      </NowProvider>,
    );
    expect(screen.getByTestId("now").textContent).toBe(
      "2024-06-01T12:00:00.000Z",
    );
  });

  it("updates now every second", () => {
    render(
      <NowProvider>
        <NowDisplay />
      </NowProvider>,
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("now").textContent).toBe(
      "2024-06-01T12:00:03.000Z",
    );
  });
});
