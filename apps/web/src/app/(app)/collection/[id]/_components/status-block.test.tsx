// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBlock } from "./status-block";

function renderBlock(value: number, action = <button>Go</button>) {
  return render(<StatusBlock label="Fullness" value={value} action={action} />);
}

describe("StatusBlock", () => {
  it("exposes the rounded value via aria-label", () => {
    renderBlock(74.6);
    expect(screen.getByLabelText("Fullness: 75 of 100")).toBeInTheDocument();
  });

  it("renders the label and fraction text", () => {
    renderBlock(40);
    expect(screen.getByText("Fullness")).toBeInTheDocument();
    expect(screen.getByText("(40 / 100)")).toBeInTheDocument();
  });

  it("rounds a non-integer value in the fraction", () => {
    renderBlock(33.7);
    expect(screen.getByText("(34 / 100)")).toBeInTheDocument();
  });

  it("sets progress bar width to the rounded value %", () => {
    const { container } = renderBlock(60);
    const bar = container.querySelector("[style]");
    expect(bar).toHaveStyle({ width: "60%" });
  });

  it("renders the action slot", () => {
    renderBlock(50, <button>Feed</button>);
    expect(screen.getByRole("button", { name: "Feed" })).toBeInTheDocument();
  });

  describe("progress bar color by level", () => {
    it("uses emerald for value > 50", () => {
      const { container } = renderBlock(51);
      expect(container.querySelector("[style]")?.className).toContain(
        "bg-emerald-500",
      );
    });

    it("uses amber for value > 20 and ≤ 50", () => {
      const { container } = renderBlock(21);
      expect(container.querySelector("[style]")?.className).toContain(
        "bg-amber-400",
      );
    });

    it("uses rose for value ≤ 20", () => {
      const { container } = renderBlock(20);
      expect(container.querySelector("[style]")?.className).toContain(
        "bg-rose-500",
      );
    });
  });
});
