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

  it("reflects the rounded value on the progress bar", () => {
    renderBlock(60);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "60",
    );
  });

  it("renders the action slot", () => {
    renderBlock(50, <button>Feed</button>);
    expect(screen.getByRole("button", { name: "Feed" })).toBeInTheDocument();
  });
});

// The value→colour mapping is covered directly in status-levels.test.ts;
// asserting the resulting Tailwind classes here would only couple to styling.
