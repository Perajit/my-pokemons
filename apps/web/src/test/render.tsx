import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

// RTL's documented setup pattern: userEvent.setup() must run per test, before
// any interaction, so bundle it with render. Returns the user session alongside
// the render result (container, rerender, …). This is the single place
// userEvent.setup() should be called — tests and per-file setup helpers compose
// this rather than calling userEvent.setup() themselves.
export function setup(ui: ReactElement) {
  return { user: userEvent.setup(), ...render(ui) };
}
