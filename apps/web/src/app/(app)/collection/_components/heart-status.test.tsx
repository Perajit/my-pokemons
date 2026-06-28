// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeartStatus } from "./heart-status";

describe("HeartStat", () => {
  it("renders the rounded value", () => {
    render(<HeartStatus value={74.6} />);
    expect(screen.getByText("75 / 100")).toBeInTheDocument();
  });

  it("exposes the value via aria-label", () => {
    render(<HeartStatus value={55} />);
    expect(screen.getByLabelText("Heart: 55 of 100")).toBeInTheDocument();
  });

  // The value→colour mapping is covered directly in status-levels.test.ts;
  // asserting the icon's Tailwind class here would only couple to styling.
});
