// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeartStat } from "./heart-stat";

describe("HeartStat", () => {
  it("renders the rounded value", () => {
    render(<HeartStat value={74.6} />);
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("exposes the value via aria-label", () => {
    render(<HeartStat value={55} />);
    expect(screen.getByLabelText("Heart: 55 of 100")).toBeInTheDocument();
  });

  it("colors the heart icon by the 3-tier scale", () => {
    const cases: Array<[number, string]> = [
      [10, "text-rose-700"],
      [30, "text-rose-700"],
      [50, "text-amber-700"],
      [70, "text-emerald-700"],
      [90, "text-emerald-700"],
    ];
    for (const [value, expected] of cases) {
      const { container, unmount } = render(<HeartStat value={value} />);
      const icon = container.querySelector("svg");
      expect(icon?.getAttribute("class")).toContain(expected);
      unmount();
    }
  });
});
