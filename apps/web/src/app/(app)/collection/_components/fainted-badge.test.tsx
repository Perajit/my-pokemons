// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FaintedBadge } from "./fainted-badge";

describe("FaintedBadge", () => {
  it("renders the Fainted label at the default size", () => {
    render(<FaintedBadge />);
    expect(screen.getByText("Fainted")).toBeInTheDocument();
  });

  it("renders the Fainted label at the small size", () => {
    render(<FaintedBadge size="sm" />);
    expect(screen.getByText("Fainted")).toBeInTheDocument();
  });

  // The sm/md variants only swap padding/text-size classes — pure styling with
  // no behavioural difference, so the exact classes aren't asserted.
});
