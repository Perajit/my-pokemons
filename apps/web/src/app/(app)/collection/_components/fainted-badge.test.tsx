// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FaintedBadge } from "./fainted-badge";

describe("FaintedBadge", () => {
  it("renders the Fainted label", () => {
    render(<FaintedBadge />);
    expect(screen.getByText("Fainted")).toBeInTheDocument();
  });

  it("uses small padding and text for the sm size", () => {
    const { container } = render(<FaintedBadge size="sm" />);
    const badge = container.firstElementChild;
    expect(badge?.className).toContain("px-2.5");
    expect(badge?.className).toContain("text-xs");
  });

  it("uses larger padding and text for the md size", () => {
    const { container } = render(<FaintedBadge size="md" />);
    const badge = container.firstElementChild;
    expect(badge?.className).toContain("px-4");
    expect(badge?.className).toContain("text-sm");
  });

  it("defaults to the md size", () => {
    const { container } = render(<FaintedBadge />);
    expect(container.firstElementChild?.className).toContain("px-4");
  });
});
