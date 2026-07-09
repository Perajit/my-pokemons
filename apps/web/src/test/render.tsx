import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import type { ReactElement, ReactNode } from "react";

// RTL's documented setup pattern: userEvent.setup() must run per test, before
// any interaction, so bundle it with render. Returns the user session alongside
// the render result (container, rerender, …). This is the single place
// userEvent.setup() should be called — tests and per-file setup helpers compose
// this rather than calling userEvent.setup() themselves.
export function setup(ui: ReactElement) {
  return { user: userEvent.setup(), ...render(ui) };
}

// Black-box SWR rendering: a fresh cache per test (provider) so mutations don't
// leak between tests, and dedupingInterval 0 so back-to-back fetches aren't
// swallowed. Use for tests that run REAL SWR against a mocked fetch and assert
// the DOM updates — never mock the swr module and assert its config.
// Rendered via RTL's `wrapper` option so `rerender` re-wraps with the SAME
// SWRConfig instance — the cache survives rerenders (needed to test prop→cache sync).
export function renderWithSwr(ui: ReactElement) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SWRConfig
        value={{
          provider: () => new Map(),
          dedupingInterval: 0,
          focusThrottleInterval: 0,
        }}
      >
        {children}
      </SWRConfig>
    );
  }
  return render(ui, { wrapper: Wrapper });
}
