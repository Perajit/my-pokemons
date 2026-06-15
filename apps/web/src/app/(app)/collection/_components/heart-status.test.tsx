// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeartStatus } from "./heart-status";
import { getStatusLevelColorClassnames } from "./status-levels";

describe("HeartStat", () => {
  it("renders the rounded value", () => {
    render(<HeartStatus value={74.6} />);
    expect(screen.getByText("75 / 100")).toBeInTheDocument();
  });

  it("exposes the value via aria-label", () => {
    render(<HeartStatus value={55} />);
    expect(screen.getByLabelText("Heart: 55 of 100")).toBeInTheDocument();
  });

  it.each([[0], [10], [20], [30], [40], [50], [60], [70], [80], [90], [100]])(
    "colors the heart icon by corresponding level: %i",
    (value) => {
      const { container, unmount } = render(<HeartStatus value={value} />);
      const icon = container.querySelector("svg");
      expect(icon?.getAttribute("class")).toContain(
        getStatusLevelColorClassnames(value).text,
      );
      unmount();
    },
  );
});
