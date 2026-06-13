// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreakHeader } from "./streak-header";

describe("StreakHeader", () => {
  it("pluralizes the streak label for multiple days", () => {
    render(<StreakHeader activeStreak={7} />);
    expect(screen.getByText(/7 days streak/i)).toBeInTheDocument();
  });

  it("renders 0 days streak for a freshly acquired pokemon", () => {
    render(<StreakHeader activeStreak={0} />);
    expect(screen.getByText(/0 days streak/i)).toBeInTheDocument();
  });

  it("uses the singular label at exactly 1 day", () => {
    render(<StreakHeader activeStreak={1} />);
    expect(screen.getByText(/^1 day streak$/i)).toBeInTheDocument();
  });
});
