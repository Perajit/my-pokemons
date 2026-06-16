// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActiveSteak } from "./active-streak";

describe("ActiveSteak", () => {
  it("pluralizes the streak label for multiple days", () => {
    render(<ActiveSteak activeStreak={7} />);
    expect(screen.getByText(/7 days streak/i)).toBeInTheDocument();
  });

  it("renders < 1 day streak for a freshly acquired pokemon", () => {
    render(<ActiveSteak activeStreak={0} />);
    expect(screen.getByText(/< 1 day streak/i)).toBeInTheDocument();
  });

  it("uses the singular label at exactly 1 day", () => {
    render(<ActiveSteak activeStreak={1} />);
    expect(screen.getByText(/^1 day streak$/i)).toBeInTheDocument();
  });
});
